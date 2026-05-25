#!/usr/bin/env python3
import os
import re
import sys
import json
import asyncio
import argparse
import requests
from datetime import datetime, timezone
from mimetypes import guess_type
import lxml.html
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, Field

# Load env variables from parent directory if needed
project_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(project_dir, ".env"))

# Import existing helpers and config from scrape_to_supabase
try:
    from scrape_to_supabase import (
        supabase,
        openai_client,
        EMBEDDING_MODEL,
        create_embedding,
        enrich_deal_for_rag,
        normalize_deal_data,
        trigger_revalidate,
        OPENAI_MODEL,
    )
except ImportError as e:
    print(f"Error importing scrape_to_supabase components: {e}")
    sys.exit(1)

# Define schemas for OpenAI Structured Output
class DealExtractionWithImage(BaseModel):
    title: str = Field(description="Short, catchy name of the deal or activity, max 45 characters")
    category: str = Field(description="One of: Artsy, Event, Food, Sports, Shopping, Offer, Outdoor, Games, Culture, Promo")
    description: str = Field(description="Engaging summary of the deal in 1-2 sentences")
    price: str = Field(description="Price information, such as '$18 entry', '$12-$22', 'Free', or '$28 per pax'")
    time_info: str = Field(description="Validity or timing, such as 'Daily, lunch onward', 'Valid till 31 May', or 'Fri, 8:30 PM'")
    location: str = Field(description="Location name, such as 'Bugis', 'Multiple locations', or 'Tiong Bahru Studio'")
    discount: str = Field(description="Discount details, if any")
    vibe: str = Field(description="3-4 words describing the vibe")
    tags: list[str] = Field(description="2-3 short tags")
    image_url: str | None = Field(description="The source URL of the image corresponding to this deal/activity, from the markdown image syntax. Return null if none.")

class DealListExtraction(BaseModel):
    deals: list[DealExtractionWithImage] = Field(description="List of deals/activities extracted from the article")


def html_to_markdown(elem):
    """Recursive converter from lxml HTML element to readable markdown."""
    tag = elem.tag
    if tag in ['script', 'style', 'noscript', 'iframe']:
        return ""
    
    child_texts = []
    
    text = elem.text or ""
    if text.strip() or elem.tag == 'p':
        child_texts.append(text.strip())
        
    for child in elem:
        child_text = html_to_markdown(child)
        if child_text:
            child_texts.append(child_text)
        tail = child.tail or ""
        if tail.strip():
            child_texts.append(tail.strip())
            
    content = " ".join([t for t in child_texts if t])
    
    if tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
        return f"\n\n### {content}\n\n"
    elif tag == 'p':
        return f"\n{content}\n"
    elif tag == 'img':
        src = elem.get('src')
        alt = elem.get('alt') or elem.get('title') or "Image"
        if src and ('wp-content' in src or 'uploads' in src):
            return f"\n![{alt}]({src})\n"
        return ""
    elif tag == 'li':
        return f"\n- {content}"
    elif tag in ['ul', 'ol']:
        return f"\n{content}\n"
    elif tag == 'article' or tag == 'div':
        return content
    elif tag == 'a':
        href = elem.get('href')
        if href:
            return f"[{content}]({href})"
        return content
    elif tag in ['strong', 'b']:
        return f"**{content}**"
    elif tag in ['em', 'i']:
        return f"*{content}*"
    
    return content


def download_and_upload_image(img_url, article_slug, index):
    """Downloads image from TSL and uploads it to Supabase deal-images bucket."""
    if not img_url:
        return None
    try:
        print(f"    Downloading image: {img_url}")
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = requests.get(img_url, headers=headers, timeout=15)
        if resp.status_code == 200:
            file_data = resp.content
            # Get original filename
            orig_filename = img_url.split('/')[-1] or "image.jpg"
            orig_filename = orig_filename.split('?')[0]  # strip query params
            
            # Clean filename
            file_name = f"tsl_{article_slug}_{index}_{orig_filename}"
            mime_type, _ = guess_type(orig_filename)
            if not mime_type:
                mime_type = "image/jpeg"
            
            print(f"    Uploading to Supabase bucket deal-images: {file_name}")
            supabase.storage.from_('deal-images').upload(
                path=file_name,
                file=file_data,
                file_options={"content-type": mime_type}
            )
            public_url = supabase.storage.from_('deal-images').get_public_url(file_name)
            return public_url
    except Exception as e:
        print(f"    ⚠️ Image upload failed: {e}")
    return None


async def process_article(url, openai_sem, dry_run=False):
    """Fetches a single article, extracts deals, and saves to DB."""
    from scrapling.fetchers import StealthyFetcher
    
    # Extract article slug
    article_slug = url.rstrip('/').split('/')[-1]
    if not article_slug:
        print(f"Skipping URL {url} — cannot parse article slug.")
        return 0

    deal_prefix = f"thesmartlocal:{article_slug}:"

    # Check if we already processed this article (skip checking if dry-run)
    if not dry_run:
        loop = asyncio.get_running_loop()
        try:
            existing = await loop.run_in_executor(
                None, lambda: supabase.table('deals').select('id').like('id', f"{deal_prefix}%").limit(1).execute()
            )
            if existing.data:
                print(f"Skipping article: {url} (already crawled).")
                return 0
        except Exception as e:
            print(f"Warning: Could not check existing database records for {url}: {e}")

    print("-" * 60)
    print(f"Scraping Article: {url}")
    
    try:
        loop = asyncio.get_running_loop()
        page = await loop.run_in_executor(
            None, lambda: StealthyFetcher.fetch(url, headless=True)
        )
        status = getattr(page, "status", None)
        if status != 200:
            print(f"Failed to fetch article {url} — HTTP Status: {status}")
            return 0
            
        content_container = page.css('article, .entry-content, .post-content')
        if not content_container:
            print(f"Could not find main content container on page {url}")
            return 0
            
        # Parse featured image
        featured_image = None
        og_image = page.css('meta[property="og:image"]')
        if og_image:
            featured_image = og_image[0].attrib.get('content')

        raw_html = content_container[0].get()
        doc = lxml.html.fromstring(raw_html)
        markdown = html_to_markdown(doc)
        
        # Limit text size to prevent token overflow
        input_text = markdown[:35000]
        
        print(f"  Sending text to OpenAI ({len(input_text)} chars)...")
        if not openai_client:
            print("  ⚠️ Skipping OpenAI parsing — no client configured.")
            return 0
            
        async with openai_sem:
            response = await loop.run_in_executor(
                None,
                lambda: openai_client.beta.chat.completions.parse(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are an AI assistant that extracts deals, promos, and activities from articles. "
                                "Analyze the markdown text and return a list of structured deal/activity objects. "
                                "For each deal, match it with its corresponding image URL from the markdown "
                                "if available. If the article is not about deals/promos/activities at all, return an empty list."
                            )
                        },
                        {"role": "user", "content": f"Extract deals from this article:\n\n{input_text}"}
                    ],
                    response_format=DealListExtraction,
                )
            )
            
        extracted_data = response.choices[0].message.parsed
        deals_list = extracted_data.deals if extracted_data else []
        print(f"  AI extracted {len(deals_list)} candidate deals.")
        
        if dry_run:
            print("\n--- DRY RUN RESULTS ---")
            for i, deal in enumerate(deals_list):
                print(f"Deal #{i+1}:")
                print(f"  Title: {deal.title}")
                print(f"  Category: {deal.category}")
                print(f"  Price: {deal.price}")
                print(f"  Location: {deal.location}")
                print(f"  Image Link: {deal.image_url}")
                print(f"  Description: {deal.description}")
            return len(deals_list)

        saved_count = 0
        for index, extracted in enumerate(deals_list):
            deal_id = f"{deal_prefix}{index}"
            
            # Normalize and enrich
            normalized = normalize_deal_data(extracted)
            
            # Handle Image Upload
            image_source = extracted.image_url or featured_image
            image_url = None
            if image_source:
                image_url = await loop.run_in_executor(
                    None, download_and_upload_image, image_source, article_slug, index
                )
            
            # Enrich deal with coordinates, price amounts, embeddings
            async with openai_sem:
                rag_data = await loop.run_in_executor(
                    None, enrich_deal_for_rag, normalized, url, "thesmartlocal"
                )
            
            deal_data = {
                "id": deal_id,
                "title": normalized["title"],
                "category": normalized["category"],
                "description": normalized["description"],
                "image_url": image_url,
                "price": normalized["price"],
                "time_info": normalized["time_info"],
                "location": normalized["location"],
                "discount": normalized["discount"],
                "vibe": normalized["vibe"],
                "tags": normalized["tags"],
                "source_link": url,
                "channel_name": "thesmartlocal",
                "message_id": index,
                **rag_data,
            }
            
            # DB Insert with retry logic
            success = False
            for attempt in range(1, 4):
                try:
                    await loop.run_in_executor(
                        None, lambda: supabase.table('deals').insert(deal_data).execute()
                    )
                    success = True
                    break
                except Exception as db_err:
                    wait_time = 2 ** attempt
                    print(f"    ⚠️ DB insert attempt {attempt} failed, retrying in {wait_time}s: {db_err}")
                    await asyncio.sleep(wait_time)
            
            if success:
                print(f"  ✅ Saved Deal: {normalized['title']}")
                saved_count += 1
            else:
                print(f"  ❌ Failed to save Deal: {normalized['title']}")
                
        return saved_count
        
    except Exception as e:
        print(f"Error processing article {url}: {e}")
        return 0


async def main():
    parser = argparse.ArgumentParser(description="Scrape food, activities, and events from TheSmartLocal.")
    parser.path = parser.add_argument("--dry-run", action="store_true", help="Print extracted deals without saving to database/storage.")
    parser.add_argument("--limit", type=int, default=10, help="Maximum number of new articles to crawl (default: 10).")
    parser.add_argument("--url", type=str, help="Specific article URL to scrape directly.")
    args = parser.parse_args()

    # Ensure bucket exists (skip in dry run)
    if not args.dry_run:
        try:
            supabase.storage.create_bucket('deal-images', options={'public': True})
            print("Ensured bucket 'deal-images' exists.")
        except Exception:
            pass

    # Cap concurrent OpenAI API calls to avoid rate limits
    openai_sem = asyncio.Semaphore(5)

    if args.url:
        print(f"Targeting single URL: {args.url}")
        added = await process_article(args.url, openai_sem, dry_run=args.dry_run)
        print(f"Finished processing. Total deals added/processed: {added}")
    else:
        from scrapling.fetchers import StealthyFetcher
        print("Crawling homepage for article links...")
        
        try:
            page = StealthyFetcher.fetch("https://thesmartlocal.com/", headless=True)
            anchors = page.css('a')
            
            article_urls = set()
            for a in anchors:
                href = a.attrib.get('href')
                if href:
                    full_url = page.urljoin(href)
                    if "/read/" in full_url:
                        # Exclude static list indices, categories, tags, authors
                        if not re.search(r'/(tag|category|author)/', full_url) and full_url.rstrip('/').endswith(('/read', '/read/')) is False:
                            # Normalize URL by removing trailing slash if any, then appending it for standard formatting
                            normalized_url = full_url.rstrip('/') + '/'
                            article_urls.add(normalized_url)
            
            print(f"Found {len(article_urls)} unique candidate articles.")
            
            # Fetch already processed URLs to skip
            existing_urls = set()
            if not args.dry_run:
                try:
                    res = supabase.table('deals').select('source_url').execute()
                    if res.data:
                        existing_urls = {item['source_url'] for item in res.data if item.get('source_url')}
                except Exception as e:
                    print(f"Warning: Could not fetch list of existing URLs: {e}")
            
            filtered_urls = [url for url in article_urls if url not in existing_urls]
            print(f"Filtered out {len(article_urls) - len(filtered_urls)} already processed articles.")
            print(f"{len(filtered_urls)} articles remain for processing.")
            
            # Sort URLs to process newer/older consistently or limit
            filtered_urls = sorted(filtered_urls)[:args.limit]
            print(f"Processing up to {len(filtered_urls)} articles...")
            
            tasks = [process_article(url, openai_sem, args.dry_run) for url in filtered_urls]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            total_added = 0
            for r in results:
                if isinstance(r, int):
                    total_added += r
                elif isinstance(r, Exception):
                    print(f"Article processing task failed: {r}")
                    
            print("-" * 60)
            print(f"Crawl completed. Added {total_added} deals in total.")
            
            if total_added > 0 and not args.dry_run:
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(None, trigger_revalidate)
                
        except Exception as e:
            print(f"Error crawling homepage: {e}")


if __name__ == "__main__":
    asyncio.run(main())
