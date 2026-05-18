# VibePlan Deployment

This repository currently runs as a mock-only Next.js app. The data aggregation
backend has been removed so it can be rebuilt separately.

## Vercel

1. Connect the repository to Vercel.
2. Set the framework preset to Next.js.
3. Deploy without backend API environment variables.

## Verification

```bash
npm run build
npm run lint
```

Then verify the app can generate a mock itinerary through `/loading`, render
`/results`, and show mock entries in `/explore`, `/history`, and `/profile`.
