-- published_reports tabel voor ondertekende participatieverslagen.
-- Anon mag SELECT (burger-portal leest) en INSERT (gemeente publiceert via server-route).
-- De server-route (SUPABASE_ANON_KEY is server-only) is de gatekeeper voor INSERT.

create table if not exists published_reports (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'schapenweide',
  signed_at timestamptz not null default now(),
  reference text not null unique,        -- "SP-2026-0001" etc.
  title text not null,
  summary text not null,
  sections jsonb not null                -- gevalideerd via zod aan schrijf-zijde
);

create index on published_reports (project_id, signed_at desc);

alter table published_reports enable row level security;

create policy "anon_select" on published_reports for select using (true);
create policy "anon_insert" on published_reports for insert with check (true);
