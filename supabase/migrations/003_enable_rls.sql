-- Enable RLS on every table.
-- Server-side API routes use the service role key which bypasses RLS,
-- so they are unaffected. These policies govern direct anon/authenticated
-- access via the public anon key.

alter table question_sets  enable row level security;
alter table questions      enable row level security;
alter table clusters       enable row level security;
alter table sessions       enable row level security;
alter table answers        enable row level security;
alter table reports        enable row level security;

-- Public catalog: anyone can read question sets, questions, and clusters.
create policy "anon_read_question_sets"
  on question_sets for select to anon, authenticated using (true);

create policy "anon_read_questions"
  on questions for select to anon, authenticated using (true);

create policy "anon_read_clusters"
  on clusters for select to anon, authenticated using (true);

-- Sessions: anon read required for the waiting page realtime subscription
-- and the join page token resolution. No anon writes.
create policy "anon_read_sessions"
  on sessions for select to anon, authenticated using (true);

-- Answers and reports: no anon access.
-- All reads and writes go through server-side API routes (service role key).
