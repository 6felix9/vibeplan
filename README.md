<div align="center">

# Vibeplan

<img src="vibeplan-app/src/app/assets/Icon Logo.png" alt="Vibeplan Icon" height="120" style="vertical-align: middle;" />&nbsp;&nbsp;<img src="vibeplan-app/src/app/assets/Full Logo.png" alt="Vibeplan" height="120" style="vertical-align: middle;" />

*Find deals like never before*

</div>

A Singapore deals discovery and itinerary planner. Users browse live deals scraped from Telegram channels and generate AI-powered activity plans.

## How it works

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SCRAPER  ·  GitHub Actions cron every 6h
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Telegram channels
   (deal messages)
         │
         ▼
   OpenAI extraction
   (name, price, location,
    category, expiry…)
         │
         ▼
   Supabase
   ┌──────────────────────────────────┐
   │  deals table                     │
   │  pgvector embeddings             │  ◄── written here
   └──────────────────────────────────┘
         │
         ▼
   POST /api/revalidate
   (bust the home page cache
    so new deals appear live)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 WEB APP  ·  Next.js on Vercel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 / (home page)
 ┌──────────────────────────────────┐
 │  deal catalogue                  │  ◄── Supabase read
 │  cached 1h, busted by scraper    │
 └──────────────────────────────────┘

 User types a query
 e.g. "date night in Tiong Bahru under $80"
         │
         ▼
   /loading  →  POST /api/itinerary
         │
         ▼
  ┌─────────────────────────────────────────────────┐
  │  Planner Agent                                  │
  │  · parses query into constraints                │
  │    (area, budget, vibe, categories)             │
  │  · calls search_deals tool                      │
  │    → semantic search over pgvector embeddings   │
  └───────────────────┬─────────────────────────────┘
                      │  candidate deals
                      ▼
  ┌─────────────────────────────────────────────────┐
  │  Curation Agent                                 │
  │  · ranks candidates                             │
  │  · selects 2–5 deals by area, budget, timing    │
  └───────────────────┬─────────────────────────────┘
                      │  shortlisted deals
                      ▼
  ┌─────────────────────────────────────────────────┐
  │  Formatter Agent                                │
  │  · builds time-blocked itinerary                │
  │  · adds travel cues and budget totals           │
  │  · falls back to deterministic build if needed  │
  └───────────────────┬─────────────────────────────┘
                      │
                      ▼
            /results page
            (save, swap stops, view map)
```

## Repo structure

```
.
├── vibeplan-app/              Next.js app — deployed to Vercel
├── telegram-scraper-python/   Telegram deal scraper — runs as GitHub Action
├── supabase/                  Supabase migrations and config
└── .github/workflows/
    └── scrape.yml             Cron job: scrape + revalidate every 6h
```

## Scraped channels

The scraper currently pulls from these Telegram channels (defined in `TARGET_CHANNELS` in `telegram-scraper-python/scrape_to_supabase.py`):

| Channel | Type | Handle / Link |
|---|---|---|
| NUS Foodies | Public | `@nusfoodies` |
| This Counted | Public | `@ThisCounted` |
| goodlobang | Public | `@goodlobang` |
| confirmgood | Public | `@confirmgood` |
| *(private channel)* | Private | `https://t.me/+K0Cj1uIDRDtjM2U1` |

To add a new channel, append to `TARGET_CHANNELS` — bare username for public channels, full `https://t.me/+...` URL for private invite links.

## Quick start

### App

See [`vibeplan-app/README.md`](vibeplan-app/README.md) for local setup, env vars, and commands.

```bash
cd vibeplan-app
npm install
npm run dev        # http://localhost:3000
```

### Scraper

See [`telegram-scraper-python/AGENTS.md`](telegram-scraper-python/AGENTS.md) for full details.

```bash
cd telegram-scraper-python
source venv/bin/activate
python scrape_to_supabase.py
```

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the complete Vercel + GitHub Actions setup, required secrets, and RAG initialisation.

## Origin

This project is adapted from a [Cursor hackathon](https://github.com/cursor-hackathon-19ju) project, then extended into the current monorepo with a live Telegram scraper, Supabase RAG, and automated cache revalidation.

## License

MIT — see [`LICENSE`](LICENSE).
