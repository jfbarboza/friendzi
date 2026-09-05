## Why

The existing algorithmic engine in `lib/scoring/` already generates reports for all question sets — it computes belief gaps, cluster scores, surprise factors, and narrative copy deterministically. That solution is appropriate for the BTI level: fast, predictable, and cheap to run.

Advanced question sets (Inner Compass and beyond) surface deeper, more complex responses that the template-based algorithm cannot do justice to. Those sets warrant AI-generated narrative analysis — contextual, evidence-grounded, and calibrated to the actual answer patterns — rather than pre-authored band descriptions.

The missing piece is the ability to configure which report strategy a question set uses, and to have the AI engine ready when an advanced set needs it.

## What Changes

- New `report_strategy` field on question sets: `"algorithmic"` routes to the existing `lib/scoring/` pipeline; `"engine"` routes to the new Anthropic-powered narrative generator
- New AI engine (`lib/engine/`) that accepts any question set's report data and generates narrative JSON via Anthropic — contextual, evidence-backed, calibrated to the specific answers
- Report generation pipeline updated to dispatch based on the question set's configured strategy
- BTI question set remains on `"algorithmic"` — no change to its current behavior
- Advanced question sets (Inner Compass, future sets) configured to use `"engine"`

## Capabilities

### New Capabilities

- `question-set/report-strategy`: A configuration field (`"algorithmic" | "engine"`) on each question set that controls which report generation path is used. The dispatch happens at report generation time, not at question display time.
- `engine/narrative`: AI-powered narrative generation that takes a structured report (from the existing algorithmic engine) and returns richer, question-specific narrative copy via Anthropic. Includes evidence rules, tone directive, and JSON fence stripping.

### Modified Capabilities

- `question-set/report-strategy` adds a field to the existing question set data model — any change to the `question_sets` table schema counts as a requirement change.

## Impact

- **`question_sets` table**: new `report_strategy` column (`text`, default `"algorithmic"`)
- **Report generation pipeline**: dispatch logic added at the point where report is triggered
- **New files**: `lib/engine/narrative.ts`, `app/api/sessions/[id]/report/route.ts` updated (or a new route for engine-based reports)
- **New dependency**: `ANTHROPIC_API_KEY` env var (server-side only)
- **No impact on BTI**: existing algorithmic path and report UI unchanged
