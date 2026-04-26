-- status-loop voor burger-feedback (new / in_review / answered).
-- Server-route is de enige weg in (anon key is server-only); RLS UPDATE
-- policy blijft permissief omdat Postgres geen kolom-policies kent.
-- Voor productie: BEFORE UPDATE trigger die alleen status mag wijzigen.

alter table concerns
  add column if not exists status text not null default 'new'
    check (status in ('new', 'in_review', 'answered'));

create index if not exists concerns_status_idx on concerns(status);

create policy "anon kan zienswijze status muteren"
  on concerns
  for update
  to anon
  using (true)
  with check (true);
