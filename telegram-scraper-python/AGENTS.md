# telegram-scraper-python

Async Python service that scrapes Singapore deals and activities from Telegram channels, extracts structured data via OpenAI, generates vector embeddings, and writes everything to Supabase. Part of the [VibePlan monorepo](../README.md) — runs as a scheduled GitHub Actions cron job (see [`DEPLOYMENT.md`](../DEPLOYMENT.md)).

After a successful run it pings the Next.js app's `/api/revalidate` endpoint to bust the cached discover page so new deals appear immediately.

## Entry points

| Command | What it does |
|---|---|
| `python scrape_to_supabase.py` | Main scrape run — fetches 35 messages per channel, processes in parallel |
| `python scrape_to_supabase.py backfill-embeddings` | Backfills `embedding` column for existing rows missing it |

Run from inside the `telegram-scraper-python/` directory with the venv activated:
```bash
source venv/bin/activate
python scrape_to_supabase.py
```

## Required environment variables (`.env`)

```
TELEGRAM_API_ID=               # integer, from my.telegram.org
TELEGRAM_API_HASH=             # string, from my.telegram.org
SUPABASE_URL=                  # or NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=     # needs insert/update on deals table + storage
OPENAI_API_KEY=                # required — messages are skipped if missing
OPENAI_EMBEDDING_MODEL=        # optional, defaults to text-embedding-3-small

# Cache revalidation (optional — skipped silently if unset)
REVALIDATE_URL=                # https://<app>.vercel.app/api/revalidate
REVALIDATE_SECRET=             # shared secret matching the Vercel REVALIDATE_SECRET env var
```

A Telegram session file (`scraper_session.session`) is created on first run — the CLI prompts for a phone number and OTP. In GitHub Actions the session is restored from a base64-encoded secret (see `DEPLOYMENT.md`).

## Architecture

```
scrape_channels()
  ├── joins private channels sequentially (invite links only)
  └── asyncio.gather → _scrape_one_channel() × N channels (concurrent)
        └── asyncio.gather → _process_message() × M messages (concurrent)
              ├── check Supabase for duplicate (run_in_executor)
              ├── extract_deal_with_openai()  ← semaphore(5), retry ×3
              ├── download + upload photo to Supabase storage (optional)
              ├── enrich_deal_for_rag() → create_embedding()  ← semaphore(5), retry ×3
              └── supabase insert  ← retry ×3 with exponential backoff
  └── if total_new > 0: trigger_revalidate() → POST /api/revalidate
```

OpenAI calls are capped at 5 concurrent requests via `asyncio.Semaphore(5)`. If extraction fails after 3 retries the message is skipped.

## Target channels

Defined in `TARGET_CHANNELS` at the top of `scrape_to_supabase.py`:
- Public channels: bare username string e.g. `"goodlobang"`
- Private channels: full invite URL e.g. `"https://t.me/+K0Cj1uIDRDtjM2U1"`

## Supabase schema expectations

Table: `deals`

Key columns written per deal:

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | `{channel_name}:{message_id}` — used for dedup |
| `title` | text | max 45 chars |
| `category` | text | one of the 10 allowed categories |
| `description` | text | |
| `image_url` | text | Supabase Storage public URL if photo present |
| `price` | text | human-readable |
| `price_amount` | float | parsed numeric value |
| `discount` | text | |
| `discount_amount` | float | parsed numeric value |
| `time_info` | text | |
| `expiry_at` | timestamptz | estimated from `time_info` |
| `location` | text | |
| `lat` / `lng` | float | estimated from known SG locations |
| `vibe` | text | 3-4 word phrase |
| `tags` | text[] | 2-3 tags |
| `source_link` | text | direct Telegram message URL |
| `channel_name` | text | |
| `message_id` | int | |
| `embedding` | vector(1536) | pgvector, nullable |
| `embedding_text` | text | source text used for embedding |
| `embedding_model` | text | model name, null if embedding missing |
| `source` | text | same as channel_name |
| `source_url` | text | same as source_link |
| `refreshed_at` | timestamptz | set on every write |

Storage bucket: `deal-images` (public). Created automatically on run if it doesn't exist.

## Allowed categories

`Artsy`, `Event`, `Food`, `Sports`, `Shopping`, `Offer`, `Outdoor`, `Games`, `Culture`, `Promo`

Anything OpenAI returns outside this set is coerced to `"Offer"`.

## Retry behaviour

- **OpenAI extraction and embedding**: `tenacity` — up to 3 attempts, exponential backoff 2s→30s, on `OpenAIError` only. Messages are skipped if extraction fails; there is no fallback parser.
- **Supabase insert**: manual loop — up to 3 attempts, backoff 2s / 4s, on any exception.

## Common tasks

**Add a new channel**: append to `TARGET_CHANNELS` in `scrape_to_supabase.py`. Use the bare username for public channels, the full `https://t.me/+...` URL for private ones.

**Change how many messages to fetch**: edit the default in `scrape_channels(limit=35)`.

**Tune OpenAI concurrency**: change `asyncio.Semaphore(5)` in `scrape_channels()`.

**Backfill embeddings for old rows**: `python scrape_to_supabase.py backfill-embeddings`
