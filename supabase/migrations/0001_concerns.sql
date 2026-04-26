-- concerns table for citizen submissions.
-- Seeded JSON (50 items) blijft naast deze tabel bestaan; getConcerns() merget seed + DB.

create table if not exists concerns (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'schapenweide'
    check (project_id = 'schapenweide'),
  postcode text not null
    check (postcode ~ '^[1-9][0-9]{3}\s?[A-Z]{2}$'),
  neighbourhood text not null,
  street_reference text,
  category text not null
    check (category in (
      'traffic_parking',
      'building_height',
      'green_nature',
      'noise_livability'
    )),
  severity smallint not null check (severity between 1 and 5),
  concern_text text not null
    check (char_length(concern_text) between 10 and 1500),
  persona_type text not null default 'underrepresented_resident'
    check (persona_type in (
      'young_family',
      'elderly_resident',
      'commuter',
      'local_business',
      'underrepresented_resident'
    )),
  submitted_at timestamptz not null default now()
);

create index if not exists concerns_category_idx on concerns(category);
create index if not exists concerns_submitted_at_idx on concerns(submitted_at desc);

-- RLS aan: anon mag INSERT + SELECT (zie 0002), geen UPDATE/DELETE.
alter table concerns enable row level security;
