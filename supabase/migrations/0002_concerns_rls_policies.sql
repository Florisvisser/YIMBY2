-- Phase 2 demo: open insert + select voor anon role.
-- Geen UPDATE/DELETE policies — voorkomt tampering van bestaande zienswijzen.

create policy "anon kan zienswijze indienen"
  on concerns
  for insert
  to anon
  with check (true);

create policy "anon kan zienswijzen lezen"
  on concerns
  for select
  to anon
  using (true);
