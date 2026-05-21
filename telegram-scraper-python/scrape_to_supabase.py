import asyncio
import os
import re
import sys
import json
from datetime import datetime, timedelta, timezone
from mimetypes import guess_type
from typing import Any
from telethon import TelegramClient
from telethon.tl.functions.messages import ImportChatInviteRequest
from telethon.errors import UserAlreadyParticipantError
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI, OpenAIError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from pydantic import BaseModel, Field, ValidationError

# Load environment variables
load_dotenv()

API_ID_RAW = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')
SESSION_NAME = 'scraper_session'

SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
# For writing, try SERVICE_ROLE_KEY, then fallback to others
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
OPENAI_MODEL = "gpt-4.1-mini"
EMBEDDING_MODEL = os.getenv('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small')
EMBEDDING_DIMENSIONS = 1536
ALLOWED_CATEGORIES = {
    "Artsy",
    "Event",
    "Food",
    "Sports",
    "Shopping",
    "Offer",
    "Outdoor",
    "Games",
    "Culture",
    "Promo",
}
REQUIRED_DEAL_FIELDS = [
    "title",
    "category",
    "description",
    "price",
    "time_info",
    "location",
    "discount",
    "vibe",
    "tags",
]


class DealExtraction(BaseModel):
    title: str = Field(description="Short, catchy name of the deal or activity, max 45 characters")
    category: str = Field(description="One of: Artsy, Event, Food, Sports, Shopping, Offer, Outdoor, Games, Culture, Promo")
    description: str = Field(description="Engaging summary of the deal in 1-2 sentences")
    price: str = Field(description="Price information, such as '$18 entry', '$12-$22', 'Free', or '$28 per pax'")
    time_info: str = Field(description="Validity or timing, such as 'Daily, lunch onward', 'Valid till 31 May', or 'Fri, 8:30 PM'")
    location: str = Field(description="Location name, such as 'Bugis', 'Multiple locations', or 'Tiong Bahru Studio'")
    discount: str = Field(description="Discount details, if any")
    vibe: str = Field(description="3-4 words describing the vibe")
    tags: list[str] = Field(description="2-3 short tags")

# Validate required variables
if not API_ID_RAW or not API_HASH:
    print("Error: Please set TELEGRAM_API_ID and TELEGRAM_API_HASH in your .env file.")
    sys.exit(1)

try:
    API_ID = int(API_ID_RAW)
except ValueError:
    print("Error: TELEGRAM_API_ID must be an integer.")
    sys.exit(1)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY in your .env file.")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

openai_client = None

# Initialize OpenAI if API key is present
if OPENAI_API_KEY:
    try:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        print(f"OpenAI parser is configured with {OPENAI_MODEL}. Embeddings use {EMBEDDING_MODEL}.")
    except Exception as e:
        print(f"OpenAI client could not be initialized. Messages will be skipped. Error: {e}")
else:
    print("OpenAI API key not found. Messages will be skipped (no parser configured).")

# Target channels list (public usernames and invite links)
TARGET_CHANNELS = [
    "nusfoodies",
    "ThisCounted",
    "https://t.me/+K0Cj1uIDRDtjM2U1",
    "goodlobang",
    "confirmgood"
]

def normalize_deal_data(data: Any) -> dict:
    if isinstance(data, DealExtraction):
        data = data.model_dump()
    elif not isinstance(data, dict):
        data = {}

    normalized = {}
    for key in REQUIRED_DEAL_FIELDS:
        if key == "tags":
            tags = data.get("tags", [])
            if isinstance(tags, str):
                tags = [tags]
            elif not isinstance(tags, list):
                tags = []
            normalized[key] = [str(tag).strip() for tag in tags if str(tag).strip()][:3]
        else:
            normalized[key] = str(data.get(key, "") or "").strip()

    normalized["title"] = normalized["title"][:45] or "Featured Deal"
    if normalized["category"] not in ALLOWED_CATEGORIES:
        normalized["category"] = "Offer"
    if not normalized["tags"]:
        normalized["tags"] = [normalized["category"], "Promo"]

    return normalized


def parse_money(value: str | None) -> float | None:
    if not value:
        return None
    if "free" in value.lower():
        return 0

    matches = re.findall(r'(?:S\$|\$)?\s*(\d+(?:\.\d+)?)', value)
    if not matches:
        return None

    values = [float(match) for match in matches]
    return round(sum(values) / len(values), 2)


def estimate_expiry(time_info: str | None) -> str:
    now = datetime.now(timezone.utc)
    if not time_info:
        return (now + timedelta(days=60)).isoformat()

    text = time_info.lower()
    if any(word in text for word in ["today", "tonight"]):
        return (now + timedelta(days=1)).isoformat()
    if "weekend" in text:
        return (now + timedelta(days=7)).isoformat()

    return (now + timedelta(days=60)).isoformat()


def estimate_coordinates(location: str | None) -> tuple[float, float]:
    text = (location or "").lower()
    known_locations = [
        ("orchard", 1.3048, 103.8318),
        ("somerset", 1.3003, 103.8377),
        ("bugis", 1.2992, 103.8556),
        ("tiong bahru", 1.2846, 103.8326),
        ("chinatown", 1.2836, 103.8439),
        ("marina bay", 1.2834, 103.8607),
        ("dhoby ghaut", 1.2989, 103.8466),
        ("haji lane", 1.3009, 103.8593),
        ("joo chiat", 1.3148, 103.9003),
        ("civic district", 1.2905, 103.8515),
    ]

    for hint, lat, lng in known_locations:
        if hint in text:
            return lat, lng

    return 1.3521, 103.8198


def build_embedding_text(deal: dict) -> str:
    return "\n".join(
        [
            deal.get("title", ""),
            deal.get("description", ""),
            f"Category: {deal.get('category', '')}",
            f"Location: {deal.get('location', 'Singapore')}",
            f"Price: {deal.get('price', '')}",
            f"Discount: {deal.get('discount', '')}",
            f"Vibe: {deal.get('vibe', '')}",
            f"Tags: {', '.join(deal.get('tags', []))}",
        ]
    ).strip()


def embedding_to_pgvector(embedding: list[float] | None) -> str | None:
    if not embedding:
        return None
    return "[" + ",".join(f"{value:.8f}" for value in embedding) + "]"


@retry(
    retry=retry_if_exception_type(OpenAIError),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    stop=stop_after_attempt(3),
    reraise=True,
)
def create_embedding(text: str) -> str | None:
    if not openai_client or not text:
        return None

    try:
        response = openai_client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text,
            dimensions=EMBEDDING_DIMENSIONS,
        )
        return embedding_to_pgvector(response.data[0].embedding)
    except OpenAIError as e:
        print(f"OpenAI embedding failed. Saving deal without embedding. Error: {e}")
        return None
    except Exception as e:
        print(f"Unexpected embedding error. Saving deal without embedding. Error: {e}")
        return None


def enrich_deal_for_rag(extracted: dict, source_link: str, channel_name: str) -> dict:
    lat, lng = estimate_coordinates(extracted.get("location"))
    embedding_text = build_embedding_text(extracted)
    embedding = create_embedding(embedding_text)

    return {
        "source": channel_name,
        "source_url": source_link,
        "price_amount": parse_money(extracted.get("price")),
        "discount_amount": parse_money(extracted.get("discount")),
        "expiry_at": estimate_expiry(extracted.get("time_info")),
        "refreshed_at": datetime.now(timezone.utc).isoformat(),
        "lat": lat,
        "lng": lng,
        "best_time": extracted.get("time_info") or "7:00 PM",
        "embedding_text": embedding_text,
        "embedding_model": EMBEDDING_MODEL if embedding else None,
        "embedding": embedding,
    }


def parsed_response_to_deal(response: Any) -> dict | None:
    if getattr(response, "output_parsed", None):
        return normalize_deal_data(response.output_parsed)

    for output in getattr(response, "output", []) or []:
        if getattr(output, "type", None) != "message":
            continue

        for item in getattr(output, "content", []) or []:
            if getattr(item, "type", None) == "refusal":
                print(f"OpenAI refused to parse message. Skipping. Refusal: {item.refusal}")
                return None
            if getattr(item, "parsed", None):
                return normalize_deal_data(item.parsed)

    return None


@retry(
    retry=retry_if_exception_type(OpenAIError),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    stop=stop_after_attempt(3),
    reraise=True,
)
def extract_deal_with_openai(text: str) -> dict | None:
    if not openai_client:
        return None

    try:
        instructions = """
You are an AI assistant that extracts details of deals, promos, activities, and food offers from Singapore Telegram channel posts.
Analyze the Telegram message and return structured data for the deal.

Use the schema descriptions exactly. If a field is not present in the message, return an empty string for that field. Return 2-3 short tags.
"""
        response = openai_client.responses.parse(
            model=OPENAI_MODEL,
            instructions=instructions,
            input=f'Telegram message:\n"""\n{text}\n"""',
            text_format=DealExtraction,
            store=False,
        )

        parsed = parsed_response_to_deal(response)
        if parsed:
            return parsed

        raise ValueError("OpenAI response did not include parsed structured output.")
    except (json.JSONDecodeError, ValidationError, ValueError) as e:
        print(f"Invalid OpenAI parser response. Skipping. Error: {e}")
        return None
    except OpenAIError as e:
        print(f"Error parsing with OpenAI: {e}")
        return None
    except Exception as e:
        print(f"Unexpected OpenAI parser error: {e}")
        return None

async def process_invite_link(client, link: str):
    """Joins a private channel using invite link hash if necessary."""
    # Extract invite hash (e.g. K0Cj1uIDRDtjM2U1)
    hash_val = None
    if "+" in link:
        hash_val = link.split("+")[-1]
    elif "joinchat/" in link:
        hash_val = link.split("joinchat/")[-1]
    
    if not hash_val:
        print(f"Skipping link {link} - invalid invite format.")
        return None

    try:
        await client(ImportChatInviteRequest(hash_val))
        print(f"Successfully joined channel via invite link: {link}")
    except UserAlreadyParticipantError:
        # We're already in, that's fine
        pass
    except Exception as e:
        print(f"Note/Warning when joining {link}: {e}")
    
    return link

async def _process_message(client, msg, channel_name, channel_input, openai_sem):
    loop = asyncio.get_running_loop()
    deal_id = f"{channel_name}:{msg.id}"

    existing = await loop.run_in_executor(
        None, lambda: supabase.table('deals').select('id').eq('id', deal_id).execute()
    )
    if existing.data:
        return False

    print(f"New message found in {channel_name} (ID: {msg.id}). Processing...")

    if not openai_client:
        print(f"  ⚠️ Skipping message {msg.id} — no OpenAI client configured.")
        return False
    async with openai_sem:
        extracted = await loop.run_in_executor(None, extract_deal_with_openai, msg.text)
    if not extracted:
        print(f"  ⚠️ Skipping message {msg.id} — OpenAI extraction failed after retries.")
        return False

    image_url = None
    if msg.photo:
        print(f"  📷 Photo found, downloading...")
        downloaded_path = await client.download_media(msg.photo, file=f"downloads/msg_{msg.id}")
        if downloaded_path and os.path.exists(downloaded_path):
            print(f"  Uploading {downloaded_path} to Supabase storage...")
            file_name = f"{channel_name}_{msg.id}_{os.path.basename(downloaded_path)}"
            mime_type, _ = guess_type(downloaded_path)
            if not mime_type:
                mime_type = "image/jpeg"
            with open(downloaded_path, 'rb') as f:
                file_data = f.read()
            try:
                supabase.storage.from_('deal-images').upload(
                    path=file_name,
                    file=file_data,
                    file_options={"content-type": mime_type}
                )
                image_url = supabase.storage.from_('deal-images').get_public_url(file_name)
                print(f"  ✅ Uploaded successfully: {image_url}")
            except Exception as storage_err:
                print(f"  ❌ Storage upload failed: {storage_err}")
                image_url = None
            try:
                os.remove(downloaded_path)
            except Exception:
                pass

    source_link = (
        f"https://t.me/{channel_name}/{msg.id}"
        if not channel_input.startswith("https://")
        else channel_input
    )

    async with openai_sem:
        rag_data = await loop.run_in_executor(
            None, enrich_deal_for_rag, extracted, source_link, channel_name
        )

    deal_data = {
        "id": deal_id,
        "title": extracted["title"],
        "category": extracted["category"],
        "description": extracted["description"],
        "image_url": image_url,
        "price": extracted["price"],
        "time_info": extracted["time_info"],
        "location": extracted["location"],
        "discount": extracted["discount"],
        "vibe": extracted["vibe"],
        "tags": extracted["tags"],
        "source_link": source_link,
        "channel_name": channel_name,
        "message_id": msg.id,
        **rag_data,
    }

    for attempt in range(1, 4):
        try:
            await loop.run_in_executor(
                None, lambda: supabase.table('deals').insert(deal_data).execute()
            )
            print(f"  ✅ Saved deal to database: {extracted['title']}")
            return True
        except Exception as db_err:
            if attempt == 3:
                print(f"  ❌ Database insert failed after 3 attempts: {db_err}")
                return False
            wait = 2 ** attempt
            print(f"  ⚠️ DB insert attempt {attempt} failed, retrying in {wait}s: {db_err}")
            await asyncio.sleep(wait)


async def _scrape_one_channel(client, channel_input, limit, openai_sem):
    channel_name = (
        channel_input.split("/")[-1].replace("+", "invite_")
        if channel_input.startswith("https://")
        else channel_input.replace("@", "")
    )

    print("-" * 60)
    print(f"Processing target: {channel_input}...")

    try:
        entity = await client.get_entity(channel_input)
        messages = await client.get_messages(entity, limit=limit)

        text_messages = [msg for msg in messages if msg.text and len(msg.text.strip()) >= 10]

        tasks = [
            _process_message(client, msg, channel_name, channel_input, openai_sem)
            for msg in text_messages
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        new_deals_count = sum(1 for r in results if r is True)
        print(f"Done with {channel_name}. Added {new_deals_count} new deals.")
        return new_deals_count
    except Exception as e:
        print(f"Error scraping {channel_input}: {e}")
        return 0


def trigger_revalidate():
    revalidate_url = os.getenv("REVALIDATE_URL")
    revalidate_secret = os.getenv("REVALIDATE_SECRET")
    if not revalidate_url or not revalidate_secret:
        print("  ℹ️  REVALIDATE_URL/REVALIDATE_SECRET not set — skipping cache revalidation.")
        return
    try:
        import urllib.request
        req = urllib.request.Request(
            revalidate_url,
            method="POST",
            headers={"Authorization": f"Bearer {revalidate_secret}"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"  ✅ Cache revalidated (HTTP {resp.status})")
    except Exception as e:
        print(f"  ⚠️  Cache revalidation failed (non-fatal): {e}")


async def scrape_channels(limit=35):
    os.makedirs('downloads', exist_ok=True)

    try:
        supabase.storage.create_bucket('deal-images', options={'public': True})
        print("Ensured bucket 'deal-images' exists.")
    except Exception:
        pass

    # Cap concurrent OpenAI API calls to avoid rate limits
    openai_sem = asyncio.Semaphore(5)

    async with TelegramClient(SESSION_NAME, API_ID, API_HASH) as client:
        # Join private channels first (must be sequential)
        for channel_input in TARGET_CHANNELS:
            if channel_input.startswith("https://"):
                await process_invite_link(client, channel_input)

        # Scrape all channels concurrently
        channel_results = await asyncio.gather(*[
            _scrape_one_channel(client, channel_input, limit, openai_sem)
            for channel_input in TARGET_CHANNELS
        ], return_exceptions=True)
        total_new = sum(r for r in channel_results if isinstance(r, int))

    if total_new > 0:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, trigger_revalidate)


def backfill_missing_embeddings(limit=100):
    if not openai_client:
        print("OpenAI API key not found. Cannot backfill embeddings.")
        return

    try:
        result = (
            supabase
            .table('deals')
            .select('id,title,description,category,price,discount,time_info,location,vibe,tags,source_link,channel_name')
            .filter('embedding', 'is', 'null')
            .limit(limit)
            .execute()
        )
    except Exception as e:
        print(f"Could not fetch rows for embedding backfill: {e}")
        return

    rows = result.data or []
    print(f"Backfilling embeddings for {len(rows)} deals...")

    for row in rows:
        extracted = {
            "title": row.get("title") or "",
            "description": row.get("description") or "",
            "category": row.get("category") or "Offer",
            "price": row.get("price") or "",
            "discount": row.get("discount") or "",
            "time_info": row.get("time_info") or "",
            "location": row.get("location") or "Singapore",
            "vibe": row.get("vibe") or "",
            "tags": row.get("tags") or [],
        }
        source_link = row.get("source_link") or "https://t.me/"
        channel_name = row.get("channel_name") or "telegram"
        rag_data = enrich_deal_for_rag(extracted, source_link, channel_name)

        try:
            supabase.table('deals').update(rag_data).eq('id', row["id"]).execute()
            print(f"  ✅ Backfilled embedding for {row['id']}")
        except Exception as e:
            print(f"  ❌ Failed to backfill {row.get('id')}: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "backfill-embeddings":
        backfill_missing_embeddings()
    else:
        asyncio.run(scrape_channels())
