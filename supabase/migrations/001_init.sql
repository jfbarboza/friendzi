-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Enums
create type question_type as enum ('SCALE', 'MC');
create type session_status as enum ('waiting_p2', 'p1_submitted', 'complete');
create type player_role as enum ('p1', 'p2');

-- Question sets
create table question_sets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

-- Clusters (groupings within a question set)
create table clusters (
  id               uuid primary key default gen_random_uuid(),
  question_set_id  uuid not null references question_sets(id) on delete cascade,
  name             text not null,
  order_index      int  not null default 0
);

-- Questions
create table questions (
  id               uuid primary key default gen_random_uuid(),
  question_set_id  uuid not null references question_sets(id) on delete cascade,
  cluster_id       uuid not null references clusters(id) on delete cascade,
  text             text not null,
  type             question_type not null,
  options          jsonb,           -- null for SCALE; array of {label,description,value} for MC
  narrative_tags   text[],          -- optional tags for narrative engine
  order_index      int  not null default 0
);

-- Sessions
create table sessions (
  id               uuid primary key default gen_random_uuid(),
  question_set_id  uuid not null references question_sets(id),
  p1_token         uuid not null unique default gen_random_uuid(),
  p2_token         uuid not null unique default gen_random_uuid(),
  p1_name          text,
  p2_name          text,
  status           session_status not null default 'waiting_p2',
  created_at       timestamptz not null default now()
);

-- Answers
create table answers (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references sessions(id) on delete cascade,
  player_role      player_role not null,
  question_id      uuid not null references questions(id) on delete cascade,
  own_value        numeric(4,2) not null,
  predicted_value  numeric(4,2) not null,
  unique (session_id, player_role, question_id)
);

-- Reports (cached computation)
create table reports (
  session_id      uuid primary key references sessions(id) on delete cascade,
  belief_gap      numeric(5,3) not null,
  p1_surprise     numeric(5,3) not null,
  p2_surprise     numeric(5,3) not null,
  avg_surprise    numeric(5,3) not null,
  symmetry_score  numeric(5,3) not null,
  cluster_scores  jsonb not null,
  question_gaps   jsonb not null,
  profile         int  not null,
  gpa             numeric(4,2) not null,
  letter_grade    text not null,
  score           int  not null,
  generated_at    timestamptz not null default now()
);

-- Indexes
create index on sessions(p1_token);
create index on sessions(p2_token);
create index on answers(session_id, player_role);
create index on questions(question_set_id, order_index);
create index on clusters(question_set_id, order_index);

-- Enable Realtime on sessions so the waiting room can subscribe
alter publication supabase_realtime add table sessions;
