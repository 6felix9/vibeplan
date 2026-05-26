# VibePlan App — Repository Guidelines

This is the Next.js App Router frontend, part of the [VibePlan monorepo](../README.md). The sibling `telegram-scraper-python/` scrapes deals into Supabase; this app reads them and serves itineraries.

## Project structure

- `src/app/` — App Router pages: `(home)`, `loading`, `results`, `saved`, `history`, `profile`, `about`.
- `src/app/api/` — Route handlers: `itinerary/`, `itinerary/swap/`, `history/`, `revalidate/`.
- `src/components/` — Reusable UI and feature components. Shared primitives are in `src/components/ui/`.
- `src/lib/` — Data fetching, utilities, and mock data fallbacks.
- `public/` — Static assets.

## Deals cache and revalidation

Deals are fetched and cached in `src/lib/deals.ts` via `unstable_cache` (tag `"deals"`, 1h TTL). The `POST /api/revalidate` route calls `revalidateTag("deals")` to bust the cache on demand — this is called by the scraper after each run so new deals appear immediately. `REVALIDATE_SECRET` env var is required; the scraper authenticates via `Authorization: Bearer <secret>`.

## Deal coordinates and map display

`Deal.lat` and `Deal.lng` are nullable (`number | null`). Deals with null coordinates have no geocodable location (chain-wide promotions, online-only, or posts with no address) and are excluded from map display. `ItineraryActivity.coordinates` is optional for the same reason — `ItineraryMap` filters to valid coordinates before rendering pins. The `distanceScore()` function in `api/itinerary/swap/` returns `Infinity` for null-coord deals so they rank last on proximity swaps.

## Build, test, and development commands

- `npm run dev` — start the development server.
- `npm run build` — production build.
- `npm run start` — serve the production build.
- `npm run lint` — run ESLint.

## Coding style and naming conventions

Use TypeScript. Two-space indentation, imports use the `@/` alias for `src/`. Name React components in PascalCase, hooks as `useSomething`, utility files in camelCase, route files per Next.js conventions (`page.tsx`, `route.ts`).

## Testing guidelines

No automated test framework is configured. Before submitting changes run `npm run lint`. For behaviour changes, manually verify the affected flow in the browser. For itinerary changes, verify `/loading` → `/results?results=...`.

## Commit and pull request guidelines

Short imperative messages: `add profile loading state`, `fix deals cache`. PRs should include affected routes/components, required env vars, manual verification steps, and screenshots for UI changes.

## Security and configuration

Do not commit `.env.local` or secrets. Required env vars:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — client-side Supabase reads.
- `SUPABASE_SERVICE_ROLE_KEY` — server-side itinerary RAG.
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL` — itinerary generation.
- `REVALIDATE_SECRET` — secret for the `/api/revalidate` cache-bust endpoint.

If Supabase/OpenAI credentials are omitted the app falls back to mock data.

## Deployment

See the root [`DEPLOYMENT.md`](../DEPLOYMENT.md).
