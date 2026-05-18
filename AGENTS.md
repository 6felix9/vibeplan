# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js App Router application. Main source code lives in `src/`.

- `src/app/`: pages and mock API routes, including `/api/generate`, `/api/explore`, loading, results, history, and profile routes.
- `src/components/`: reusable UI and feature components. Shared primitives are in `src/components/ui/`.
- `src/lib/`: mock data and utilities.
- `public/`: static assets served by Next.js.

There is no dedicated `tests/` directory yet. Add tests near the code they cover or under a future `src/**/*.test.ts(x)` convention.

## Build, Test, and Development Commands

- `npm run dev`: start the Next.js development server.
- `npm run build`: create a production Next.js build.
- `npm run start`: run the production build.
- `npm run lint`: run ESLint over the repository.

Local generation uses mock data only and requires only the Next.js server.

## Coding Style & Naming Conventions

Use TypeScript for app code. Follow existing formatting: two-space indentation in TS/TSX, semicolons are mixed but acceptable, and imports use the `@/` alias for `src/`.

Name React components in PascalCase, hooks as `useSomething`, utility files in camelCase, and route files according to Next.js conventions (`page.tsx`, `route.ts`).

## Testing Guidelines

No automated test framework is currently configured in `package.json`. Before submitting changes, run `npm run lint` and, for behavior changes, manually verify the affected flow in the browser. For itinerary generation changes, verify `/loading`, `/api/generate`, `/results?results=...`, and mock history display.

When adding tests, prefer React Testing Library for components and focused API route/unit tests for data transformation logic.

## Commit & Pull Request Guidelines

Recent commits use short, direct messages such as `Clean up`, `add display user name`, and `update ui bugs`. Keep commits concise and imperative, for example: `simplify mock history` or `add profile loading state`.

Pull requests should include a short summary, affected routes/components, required environment variables, manual verification steps, and screenshots for UI changes. Link related issues when available.

## Security & Configuration Tips

Do not commit `.env.local` or secrets. The current mock-only app does not require backend API keys or database credentials.
