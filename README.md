# VibePlan

VibePlan is a Next.js App Router application for planning Singapore activity
itineraries. It supports pulling live deals and user-saved activities from Supabase when configured, or falling back to local mock data.

## Project Structure

- `src/app/` - frontend routes for discover, loading, results, saved, about,
  and profile.
- `src/components/` - reusable UI and feature components.
- `src/lib/` - local mock data and browser-only utilities.
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

To run with live database data, copy `.env.example` to `.env.local` and add your Supabase credentials. If left blank, the app will run entirely using local mock data.

## Useful Commands

```bash
npm run build
npm run lint
npm run start
```

## Deployment

Deploy the Next.js app to Vercel or any compatible Node host. See
`DEPLOYMENT.md` for the current mock-only checklist.
