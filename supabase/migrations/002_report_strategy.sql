-- Add report_strategy to question_sets.
-- Controls which report generation path runs for a given question set.
-- 'algorithmic' = existing lib/scoring/ pipeline (default, no AI call)
-- 'engine'      = algorithmic first, then Anthropic narrative enrichment
alter table question_sets
  add column report_strategy text not null default 'algorithmic'
    check (report_strategy in ('algorithmic', 'engine'));

-- Add narrative_json to reports.
-- Populated asynchronously when report_strategy = 'engine'.
-- Null until the AI call completes (or forever for algorithmic reports).
alter table reports
  add column narrative_json jsonb;
