# VibePlan

VibePlan is a Next.js app for generating activity itineraries from user preferences. The app uses Supabase for auth/history, Exa/OpenAI for recommendation support, and a separate FastAPI bridge for semantic activity search against ChromaDB.

## What Stays In This Repo

- `src/` - the Next.js application.
- `public/assets/` - public video assets used by the About page.
- `src/app/assets/` - imported image/logo assets used by React components.
- `chromadb_api.py` - FastAPI bridge used by the Next.js API route to query ChromaDB.
- `requirements.txt` and `render.yaml` - Python API deployment support.
- `supabase-migration-itineraries.sql` - Supabase schema migration.

Generated ChromaDB stores, scraper exports, notebooks, sessions, logs, and ingestion scripts are intentionally not tracked here.

## Local Setup

Install app dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
EXA_API_KEY=your_exa_api_key
CHROMADB_API_URL=http://localhost:8001
```

Run the Next.js app:

```bash
npm run dev
```

Run the ChromaDB API bridge only when you have a local `data/chroma_db/` artifact available:

```bash
pip install -r requirements.txt
python chromadb_api.py
```

## Useful Commands

```bash
npm run build
npm run lint
npm run start
```

## Deployment

- Deploy the Next.js app to Vercel.
- Deploy `chromadb_api.py` to Render using `render.yaml`.
- Provide the ChromaDB data directory as an external runtime artifact on Render persistent disk.
- Set `CHROMADB_API_URL` in the Next.js environment to the deployed FastAPI URL.

See `DEPLOYMENT.md` for the full deployment checklist.
