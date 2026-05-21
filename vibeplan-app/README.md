# VibePlan — Next.js app

This directory holds the Next.js App Router frontend. It is the app half of the [VibePlan monorepo](../README.md).

Users browse a discover feed of live Singapore deals (scraped by the sibling [`telegram-scraper-python/`](../telegram-scraper-python/AGENTS.md) service) and generate AI-powered activity itineraries via a RAG pipeline backed by Supabase pgvector.

## Project structure

```
src/
├── app/
│   ├── (home)/page.tsx       Discover home (server component, cached deals)
│   ├── loading/              Itinerary generation loading page
│   ├── results/              Itinerary results page
│   ├── saved/                Saved activities
│   ├── history/              Past itineraries
│   ├── profile/              User profile
│   ├── about/                About page
│   └── api/
│       ├── itinerary/        POST — generates an itinerary via RAG
│       ├── itinerary/swap/   POST — swaps a single itinerary activity
│       ├── history/          GET — fetches saved itinerary history
│       └── revalidate/       POST — busts the deals cache on demand
├── components/               UI components (HomeDiscover, Sidebar, etc.)
└── lib/
    ├── deals.ts              Fetches + caches deals (unstable_cache, tag "deals")
    ├── itinerary/            RAG pipeline (repository, pipeline, types)
    └── hooks/                Client-side hooks (useSavedActivities)
```

## Deals cache and revalidation

Deals are cached server-side for 1 hour (`src/lib/deals.ts`, `revalidate: 3600`, tag `"deals"`). When the scraper inserts new deals it calls `POST /api/revalidate`, which calls `revalidateTag("deals")` and causes the next page load to fetch fresh data immediately — no wait for the timer.

`REVALIDATE_SECRET` must be set on the server; the scraper sends it as `Authorization: Bearer <secret>`.

## Local setup

```bash
npm install
npm run dev        # http://localhost:3000
```

Copy `.env.example` to `.env.local` and fill in your Supabase and Mapbox credentials. Without Supabase/OpenAI credentials the app falls back to static mock data; without `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` the itinerary map shows a setup fallback.

## RAG setup

Run `rag_migration.sql` in the Supabase SQL Editor, then backfill embeddings for existing rows:

```bash
cd ../telegram-scraper-python
python scrape_to_supabase.py backfill-embeddings
```

## Commands

```bash
npm run dev     # development server
npm run build   # production build
npm run lint    # ESLint
npm run start   # serve production build
```

## Deployment

See the root [`DEPLOYMENT.md`](../DEPLOYMENT.md) for Vercel setup, required env vars, and the full deployment checklist.
