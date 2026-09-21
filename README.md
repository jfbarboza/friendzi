# Friendzi

A two-player compatibility quiz app. Two people answer the same questions independently — each also predicts their partner's answers — and receive a shared report analyzing their alignment, blind spots, and fault lines.

## Getting Started

```bash
npm install
npm run dev
```

### Environment variables

Create a `.env.local` file at the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>

# Anthropic (required for engine question sets)
ANTHROPIC_API_KEY=sk-ant-...

# Admin / dev access (see Dev Mode below)
ADMIN_TOKEN=<any secret string>

# Base URL (used in share links)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

On Vercel, add all of these under **Settings → Environment Variables**.

## Question Sets

Question sets are seeded via the admin API:

```bash
curl -X POST "http://localhost:3000/api/admin/seed?slug=inner-compass&token=<ADMIN_TOKEN>"
curl -X POST "http://localhost:3000/api/admin/seed?slug=discover-your-truth&token=<ADMIN_TOKEN>"
curl -X POST "http://localhost:3000/api/admin/seed?slug=breaking-the-ice&token=<ADMIN_TOKEN>"
```

Each slug maps to a seed file in `lib/seeds/`. The endpoint is idempotent — safe to re-run.

### Report strategies

Each question set has a `report_strategy` column in Supabase (`algorithmic` by default). Engine question sets additionally generate an AI narrative via Anthropic:

```sql
update question_sets set report_strategy = 'engine' where slug in ('inner-compass', 'discover-your-truth');
```

**Narrative generation note:** question sets with many questions or long question texts produce a larger JSON output. `max_tokens` in `lib/engine/narrative.ts` is currently set to `4096` — sufficient for question sets with up to ~7 clusters and 50 questions. If you add larger question sets, increase this value accordingly.

## Dev Mode

Dev mode adds an **⚡ Auto-fill & Submit** button to the quiz that fills every question with random values and submits instantly. It is only visible on a specific URL — it is never shown in normal gameplay.

### Enabling dev mode

Add `?dev=<ADMIN_TOKEN>` to any quiz URL:

```
/session/<token>/quiz?dev=<your ADMIN_TOKEN value>
```

The token is validated server-side. If it doesn't match `process.env.ADMIN_TOKEN`, the button never renders. The `ADMIN_TOKEN` value is never sent to the client.

### Typical dev workflow

1. Start a new session from the home page (pick the question set you want to test).
2. Open the P1 quiz link and append `?dev=<ADMIN_TOKEN>` in the browser.
3. Click **⚡ Auto-fill & Submit** — P1 submits instantly.
4. Open the P2 join link in a second tab, navigate to the quiz, and append `?dev=<ADMIN_TOKEN>`.
5. Click **⚡ Auto-fill & Submit** — report generates and both players are redirected.

## Migrations

Migration files live in `supabase/migrations/` and serve as the source of truth for schema history. Apply them in order via the Supabase SQL editor (Dashboard → SQL Editor):

| File | Description |
|---|---|
| `001_init.sql` | Initial schema — sessions, questions, clusters, answers, reports |
| `002_report_strategy.sql` | Adds `report_strategy` to `question_sets`, `narrative_json` to `reports` |
| `003_enable_rls.sql` | Enables Row Level Security on all tables |

## Deployment

The app deploys to Vercel. All environment variables must be set in the Vercel dashboard before deploying.

The `ANTHROPIC_API_KEY` is required for engine sessions to generate narratives. Without it, `generateNarrative` returns null silently and the report falls back to the algorithmic view.
