# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js App Router application. Main source code lives in `src/`.

- `src/app/`: pages and API routes, including `/api/generate`, `/api/explore`, auth callback, loading, results, history, and profile routes.
- `src/components/`: reusable UI and feature components. Shared primitives are in `src/components/ui/`.
- `src/lib/`: Supabase clients, Jotai atoms, hooks, and utilities.
- `public/`: static assets served by Next.js.
- `chromadb_api.py`: FastAPI bridge for ChromaDB vector search.
- `supabase-migration-itineraries.sql`: Supabase table, indexes, and RLS policies.

There is no dedicated `tests/` directory yet. Add tests near the code they cover or under a future `src/**/*.test.ts(x)` convention.

## Build, Test, and Development Commands

- `npm run dev`: start the Next.js development server.
- `python3 chromadb_api.py`: start the ChromaDB FastAPI bridge on port `8001`.
- `npm run build`: create a production Next.js build.
- `npm run start`: run the production build.
- `npm run lint`: run ESLint over the repository.
- `pip3 install -r requirements.txt`: install Python dependencies for the ChromaDB bridge.

Local generation requires both the Next.js server and ChromaDB bridge to be running.

## Coding Style & Naming Conventions

Use TypeScript for app code and Python for the ChromaDB bridge. Follow existing formatting: two-space indentation in TS/TSX, semicolons are mixed but acceptable, and imports use the `@/` alias for `src/`.

Name React components in PascalCase, hooks as `useSomething`, utility files in camelCase, and route files according to Next.js conventions (`page.tsx`, `route.ts`). Keep server-only Supabase access in `src/lib/supabase-server.ts` or API routes, and browser access through `src/lib/supabase.ts`.

## Testing Guidelines

No automated test framework is currently configured in `package.json`. Before submitting changes, run `npm run lint` and, for behavior changes, manually verify the affected flow in the browser. For itinerary generation changes, verify login, `/loading`, `/api/generate`, `/results?id=...`, and history display.

When adding tests, prefer React Testing Library for components and focused API route/unit tests for data transformation logic.

## Commit & Pull Request Guidelines

Recent commits use short, direct messages such as `Clean up`, `add display user name`, and `update ui bugs`. Keep commits concise and imperative, for example: `fix itinerary public toggle` or `add profile loading state`.

Pull requests should include a short summary, affected routes/components, required environment variables, manual verification steps, and screenshots for UI changes. Link related issues when available.

## Security & Configuration Tips

Do not commit `.env.local` or secrets. Required runtime values include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `EXA_API_KEY`, `CHROMADB_API_URL`, and optional Google Maps settings. Respect Supabase RLS policies when adding database queries.
