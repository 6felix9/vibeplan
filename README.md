# VibePlan

A Singapore deals discovery and itinerary planner. Users browse live deals scraped from Telegram channels and generate AI-powered activity plans.

## How it works

```
GitHub Action (cron every 6h)
  └── telegram-scraper-python/
        scrapes Telegram channels → extracts deals via OpenAI
        → inserts into Supabase deals table
        → if new deals: POST /api/revalidate (busts the cached discover page)

Supabase
  └── deals table ← scraper writes, app reads

vibeplan-app/ (Next.js on Vercel)
  └── / (home)      — serves cached deals (1h TTL, busted on scraper run)
  └── /api/revalidate — clears the deals cache on demand (secret-protected)
  └── /loading → /results — AI itinerary planner (RAG over deals via pgvector)
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
