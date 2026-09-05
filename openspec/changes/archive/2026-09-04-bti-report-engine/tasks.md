## 1. Database

- [x] 1.1 Write a Supabase migration adding `report_strategy TEXT NOT NULL DEFAULT 'algorithmic' CHECK (report_strategy IN ('algorithmic', 'engine'))` to the `question_sets` table and verify the migration runs cleanly with `supabase db push`
- [x] 1.2 Verify existing question sets (including BTI) default to `"algorithmic"` after the migration by querying the `question_sets` table and confirming no nulls and no unexpected values

## 2. AI Narrative Module

- [x] 2.1 Add `ANTHROPIC_API_KEY` to `.env.local` (obtain from console.anthropic.com) and verify it is readable server-side via `process.env.ANTHROPIC_API_KEY` in a test log and does not appear in any client bundle
- [x] 2.2 Create `lib/engine/narrative.ts` exporting `generateNarrative(report: ReportData, p1Name: string, p2Name: string): Promise<NarrativeJSON | null>` using raw fetch to `https://api.anthropic.com/v1/messages` with model `claude-sonnet-4-6` and verify a real API call returns a non-null result
- [x] 2.3 Implement markdown fence stripping (` ```json ` and ` ``` `) before `JSON.parse()` and verify a fenced model response parses without throwing
- [x] 2.4 Implement the `null` return contract: catch all errors (network, parse, missing key) and return `null` — verify by temporarily unsetting `ANTHROPIC_API_KEY` and confirming the function returns `null` without throwing
- [x] 2.5 Add the tone directive, evidence rule, and specificity rule to the system prompt and verify the returned narrative JSON includes `evidence_questions` and `confidence` fields on each major claim

## 3. Dispatch Logic

- [x] 3.1 In `generateAndCacheReport()` in `app/api/sessions/[id]/answers/route.ts`, fetch `report_strategy` alongside the question set data and verify it is available at dispatch time
- [x] 3.2 For `report_strategy = "algorithmic"`: confirm the existing `computeReport()` path runs unchanged and verify the BTI question set still generates a report correctly after this change
- [x] 3.3 For `report_strategy = "engine"`: after upserting the algorithmic report, fire `generateNarrative()` with `void` (non-awaited) and store the returned narrative JSON in a `narrative_json` column on the `reports` table — verify the column is populated on the next read after the AI call completes
- [x] 3.4 Add a `narrative_json` column (`jsonb`, nullable) to the `reports` table via a new migration and verify the report GET route returns it when present

## 4. Validation

- [x] 4.1 Set an advanced question set's `report_strategy` to `"engine"` in the database and run a full session end-to-end, confirming the `narrative_json` column is populated in `reports` after both players submit
- [x] 4.2 Confirm the BTI question set (`report_strategy = "algorithmic"`) produces an identical report to before this change — no regression in existing behavior
- [x] 4.3 Simulate an Anthropic API failure (wrong key) on an `"engine"` session and confirm the report is still stored with the algorithmic data and no error is surfaced to the player
