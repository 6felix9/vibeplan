# VibePlan Deployment

This monorepo deploys two services: the **Next.js app** to Vercel and the **Telegram scraper** as a GitHub Actions cron job. Both share Supabase as the data store and coordinate cache revalidation via a shared secret.

---

## 1. Vercel (Next.js app)

1. **Import the repo** — in the Vercel dashboard, import `6felix9/vibeplan`.
2. **Set Root Directory** to `vibeplan-app` (Vercel detects Next.js automatically from there).
3. **Add environment variables:**

   | Variable | Required | Notes |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Supabase anon/publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | yes | Service role key (server-side RAG) |
   | `OPENAI_API_KEY` | yes | For itinerary generation |
   | `OPENAI_MODEL` | optional | Defaults to `gpt-4.1-mini` |
   | `OPENAI_EMBEDDING_MODEL` | optional | Defaults to `text-embedding-3-small` |
   | `REVALIDATE_SECRET` | yes | A random secret string — must match the GitHub secret |

4. **(Optional) Skip rebuilds on scraper-only pushes** — under Settings → Git → Ignored Build Step, set the command to:
   ```
   git diff --quiet HEAD^ HEAD -- vibeplan-app/
   ```
   This prevents a Vercel redeploy when only scraper files change.

---

## 2. GitHub Actions (Telegram scraper)

The workflow at `.github/workflows/scrape.yml` runs every 6 hours and can also be triggered manually from the Actions tab.

### Required repo secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|---|---|
| `TELEGRAM_API_ID` | Integer API ID from [my.telegram.org](https://my.telegram.org) |
| `TELEGRAM_API_HASH` | String API hash from my.telegram.org |
| `TELEGRAM_SESSION` | Base64-encoded Telegram session file (see below) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (insert/update on deals table + storage) |
| `OPENAI_API_KEY` | OpenAI API key |
| `REVALIDATE_URL` | `https://<your-app>.vercel.app/api/revalidate` |
| `REVALIDATE_SECRET` | Same value as the Vercel env var |

### Generating the Telegram session secret

Run the scraper once locally to create the session file, then encode it:

```bash
cd telegram-scraper-python
source venv/bin/activate
python scrape_to_supabase.py   # logs in and creates scraper_session.session
base64 -i scraper_session.session | pbcopy   # macOS: copies to clipboard
```

Paste the output as the `TELEGRAM_SESSION` secret. If the session ever invalidates (Telegram revokes it), re-run the scraper locally to regenerate, then update the secret.

---

## 3. RAG initialisation (first-time setup)

1. Run `rag_migration.sql` in the **Supabase SQL Editor** to add the pgvector-backed search function.
2. Backfill embeddings for any existing deals:
   ```bash
   cd telegram-scraper-python
   source venv/bin/activate
   python scrape_to_supabase.py backfill-embeddings
   ```
   New scraper runs include embeddings automatically.

---

## 4. Cache revalidation flow

After a successful scrape run that inserted new deals, the scraper automatically calls:

```
POST https://<app>.vercel.app/api/revalidate
Authorization: Bearer <REVALIDATE_SECRET>
```

This calls `revalidateTag("deals")` in Next.js, causing the next page load to fetch fresh data from Supabase instead of serving the 1-hour cached version.

---

## 5. Verification

```bash
# App
cd vibeplan-app
npm run build
npm run lint
```

- Trigger the scrape workflow manually via **Actions → Scrape deals → Run workflow**.
- After it completes, visit the Vercel URL and confirm new deals appear on the home page.
- Verify `/loading → /results` produces an itinerary using live Supabase data when `retrievalMode` is `"supabase"`.
