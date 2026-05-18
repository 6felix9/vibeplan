# VibePlan

VibePlan is a Next.js App Router application for planning Singapore activity
itineraries. This cleanup keeps the frontend experience and mock data only while
the data aggregation backend is rebuilt.

## Project Structure

- `src/app/` - pages and mock API routes, including `/api/generate`,
  `/api/explore`, loading, results, history, and profile.
- `src/components/` - reusable UI and feature components.
- `src/lib/mock-api-data.ts` - centralized mock itinerary data.
- `src/app/assets/` and `public/` - static assets used by the UI.

## Local Setup

Install dependencies:

```bash
npm install
```

Run the Next.js app:

```bash
npm run dev
```

No backend API keys, database credentials, or map service keys are required for
the mock app.

## Useful Commands

```bash
npm run build
npm run lint
npm run start
```

## Deployment

Deploy the Next.js app to Vercel or any compatible Node host. See
`DEPLOYMENT.md` for the current mock-only checklist.
