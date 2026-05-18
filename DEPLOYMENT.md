# VibePlan Deployment

This repository runs as a frontend-only mock Next.js app. There are no service
routes, auth callbacks, database clients, or server services required.

## Vercel

1. Connect the repository to Vercel.
2. Set the framework preset to Next.js.
3. Deploy without service environment variables.

## Verification

```bash
npm run build
npm run lint
```

Then verify the app can load a mock itinerary through `/loading`, render
`/results`, and show the static `/profile` page.
