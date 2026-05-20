-- Candidaturas de agencias parceiras
-- Mantem leads pendentes separados de agencies, agency_users e auth.users.

create table if not exists public.agency_applications (
  id uuid primary key default uuid_generate_v4(),
  agency_name text not null,
  responsible_name text not null,
  email text not null,
  whatsapp text not null,
  country text not null,
  recruitment_experience text not null,
  expected_creators_count integer not null check (expected_creators_count > 0),
  social_links text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'blocked')),
  review_notes text,
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_agency_applications_pending_email
  on public.agency_applications (lower(email))
  where status = 'pending';

create index if not exists idx_agency_applications_status_created
  on public.agency_applications(status, created_at desc);

alter table public.agency_applications enable row level security;

drop trigger if exists set_agency_applications_updated_at on public.agency_applications;
create trigger set_agency_applications_updated_at
  before update on public.agency_applications
  for each row execute procedure public.set_updated_at();
