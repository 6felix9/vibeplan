# VibePlan Deployment

This repo deploys as two services:

- Next.js frontend/API routes on Vercel.
- FastAPI ChromaDB bridge on Render.

## Vercel

1. Connect the repository to Vercel.
2. Set the framework preset to Next.js.
3. Add environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...
EXA_API_KEY=...
CHROMADB_API_URL=https://your-render-service.onrender.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

4. Deploy.

The `.vercelignore` file excludes Python service files, local data artifacts, notebooks, logs, and sessions from the frontend deployment.

## Render

Use `render.yaml` for the ChromaDB API bridge:

- Build command: `pip install -r requirements.txt`
- Start command: `python chromadb_api.py`
- Runtime data path expected by the API: `./data/chroma_db`

Required Render environment variables:

```bash
OPENAI_API_KEY=...
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
PYTHON_VERSION=3.11.0
```

Attach a persistent disk at `/opt/render/project/src/data` and restore the ChromaDB artifact into:

```bash
/opt/render/project/src/data/chroma_db
```

## Verification

Check the ChromaDB API:

```bash
curl https://your-render-service.onrender.com/health
```

Check the frontend:

```bash
npm run build
```

After both services are deployed, generate an itinerary through the app and confirm the `/api/generate` route can reach `CHROMADB_API_URL`.
