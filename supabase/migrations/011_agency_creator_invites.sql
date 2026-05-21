-- Base SQL para convites de creators por agencias.

create extension if not exists pgcrypto;

alter table public.agencies
  add column if not exists invite_code text;

create or replace function public.generate_agency_invite_code()
returns text
language plpgsql
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := gen_random_bytes(8);
  code text := '';
  i integer;
begin
  for i in 0..7 loop
    code := code || substr(chars, (get_byte(bytes, i) % length(chars)) + 1, 1);
  end loop;

  return code;
end;
$$;

create or replace function public.generate_unique_agency_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  loop
    code := public.generate_agency_invite_code();

    exit when not exists (
      select 1
      from public.agencies
      where invite_code = code
    );
  end loop;

  return code;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agencies_invite_code_format'
      and conrelid = 'public.agencies'::regclass
  ) then
    alter table public.agencies
      add constraint agencies_invite_code_format
      check (invite_code is null or invite_code ~ '^[A-HJ-NP-Z2-9]{8}$');
  end if;
end $$;

create unique index if not exists idx_agencies_invite_code_unique
  on public.agencies (invite_code);

alter table public.agencies
  alter column invite_code set default public.generate_unique_agency_invite_code();

do $$
declare
  agency_row record;
  candidate text;
begin
  for agency_row in
    select id
    from public.agencies
    where invite_code is null
    order by created_at, id
  loop
    loop
      candidate := public.generate_agency_invite_code();

      begin
        update public.agencies
        set invite_code = candidate
        where id = agency_row.id
          and invite_code is null;

        exit;
      exception when unique_violation then
        -- Tenta outro codigo em caso de colisao.
      end;
    end loop;
  end loop;
end $$;

alter table public.agencies
  alter column invite_code set not null;

create table if not exists public.agency_creator_invites (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id),
  invite_code text not null,
  email text,
  whatsapp text,
  user_id uuid references public.users(id),
  creator_id uuid references public.creators(id),
  status text not null default 'opened',
  accepted_at timestamptz,
  verified_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint agency_creator_invites_status_check
    check (status in (
      'opened',
      'signed_up',
      'onboarding_started',
      'pending_verification',
      'verified',
      'rejected',
      'expired'
    )),

  constraint agency_creator_invites_invite_code_format
    check (invite_code ~ '^[A-HJ-NP-Z2-9]{8}$')
);

drop trigger if exists set_agency_creator_invites_updated_at
  on public.agency_creator_invites;

create trigger set_agency_creator_invites_updated_at
  before update on public.agency_creator_invites
  for each row execute procedure public.set_updated_at();

alter table public.agency_creator_invites enable row level security;

create index if not exists idx_agency_creator_invites_agency_id
  on public.agency_creator_invites (agency_id);

create index if not exists idx_agency_creator_invites_invite_code
  on public.agency_creator_invites (invite_code);

create index if not exists idx_agency_creator_invites_user_id
  on public.agency_creator_invites (user_id);

create index if not exists idx_agency_creator_invites_creator_id
  on public.agency_creator_invites (creator_id);
