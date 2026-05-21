# VibePlan Deployment

This repository runs as a Next.js app with optional live Supabase-backed RAG
routes. Without service environment variables it falls back to mock data.

## Vercel

1. Connect the repository to Vercel.
2. Set the framework preset to Next.js.
3. Add `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` for live RAG.
4. Run `rag_migration.sql` in Supabase and backfill deal embeddings before
   expecting `retrievalMode: "supabase"` results.

## Verification

```bash
npm run build
npm run lint
```

Then verify the app can load a mock itinerary through `/loading`, render
`/results`, and show the static `/profile` page.
