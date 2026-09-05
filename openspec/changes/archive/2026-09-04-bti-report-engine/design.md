## Context

The existing `lib/scoring/algorithm.ts` already generates `ReportData` for any question set — belief gaps, surprise factors, cluster scores, GPA, and template-based narrative copy. `lib/scoring/narrative.ts` renders that into band labels and investment areas. The report route at `app/api/sessions/[id]/report/route.ts` reads from a `reports` table (generation happens elsewhere, likely triggered when both players submit).

The `question_sets` table has no concept of report strategy today — every question set uses the same algorithmic path.

See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- A `report_strategy` column on `question_sets` that controls which generation path runs
- A general-purpose `generateNarrative()` function that enriches any `ReportData` with AI copy
- The dispatch happens at report generation time; no change to the question display flow
- BTI question set behavior is unchanged

**Non-Goals:**
- Replacing or modifying `lib/scoring/algorithm.ts` — it stays as-is
- Question-set-specific prompt tuning per question (a future concern)
- Streaming the AI response to the client

## Decisions

### 1. Dispatch reads `report_strategy` from the question set at generation time

**Decision:** When report generation is triggered, the pipeline fetches the session's question set record, reads `report_strategy`, and branches: `"algorithmic"` calls only `lib/scoring/`; `"engine"` calls `lib/scoring/` then `generateNarrative()`.

**Why:** The decision belongs at the boundary where we know what question set we're dealing with, not in the scoring engine (which is question-set-agnostic) or in the narrative generator (which shouldn't know about routing).

**Alternative considered:** A separate API route per strategy. Rejected — the question set config is the source of truth; callers should not need to know which route to hit.

### 2. `generateNarrative()` takes `ReportData` as input, not raw answers

**Decision:** The AI call receives the already-computed `ReportData` — gaps, cluster scores, surprise factors — not the raw answers. The algorithmic engine always runs first.

**Why:** The existing engine extracts the signal from raw answers efficiently and reliably. The AI's job is to articulate that signal in richer prose, not to re-derive it. This also means the stored report always has consistent numeric outputs regardless of whether the AI call succeeds.

**Alternative considered:** Sending raw answers to the AI and letting it do all computation. Rejected — the algorithmic output is the ground truth; AI hallucinating a different gap score would be worse than a less polished narrative.

### 3. `null` return contract for `generateNarrative()`

**Decision:** On any failure — network error, `JSON.parse` throw, missing API key — `generateNarrative()` returns `null`. The caller silently falls back to the algorithmic report.

**Why:** AI narrative is an enhancement, not a requirement. A failed Anthropic call must never block a player from seeing their report. The degraded experience (algorithmic narrative only) is still a complete report.

### 4. `report_strategy` enforced as a database check constraint

**Decision:** `report_strategy TEXT NOT NULL DEFAULT 'algorithmic' CHECK (report_strategy IN ('algorithmic', 'engine'))`.

**Why:** Prevents invalid values from reaching the dispatch logic at runtime. The enum is small and stable enough to live in a DB constraint rather than a separate type table.

### 5. Raw fetch over `@anthropic-ai/sdk`

**Decision:** Use raw `fetch` to call the Anthropic Messages API.

**Why:** No additional dependency for a single endpoint call. The JKC technical spec provides the exact headers and body shape. The SDK adds convenience we don't need here.

## Risks / Trade-offs

- **AI call latency** → `generateNarrative()` adds ~3–8s to report generation. This is acceptable if generation is triggered in the background when both players submit, not on the client request path. Mitigation: confirm generation is background-triggered before wiring the engine path.
- **Prompt drift** → As question sets evolve, the system prompt may need updating to stay relevant. Mitigation: keep the prompt close to the narrative module, not embedded in a migration.
- **Cost** → Every `"engine"` report triggers an Anthropic API call. Mitigation: start with a single advanced question set on `"engine"` and monitor before expanding.

## Open Questions

*(none — all resolved)*

> **Resolved:** Report generation is triggered inline in `app/api/sessions/[id]/answers/route.ts` inside `generateAndCacheReport()`, called when `newStatus === 'complete'` (both players have submitted). The dispatch goes in that function. Because the AI call adds 3–8s on the inline path, `generateNarrative()` should be run with `void` (fire-and-forget after upsert) rather than awaited — the session is already marked complete, so the player does not need to wait for the narrative before seeing their report.
