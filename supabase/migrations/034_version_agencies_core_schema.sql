-- Versiona o schema estrutural de agencias e usuarios de agencia.
-- Estas tabelas nao devem ser acessadas diretamente por clientes comuns.
-- Acesso operacional deve passar por server-side/service role ou RPCs auditadas.
-- Futuras policies devem ser criadas com escopo minimo e revisao propria.

create extension if not exists "uuid-ossp";

create table if not exists public.agencies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  responsible_name text,
  email text,
  whatsapp text,
  telegram text,
  country text,
  pix_key text,
  payment_method text default 'pix',
  commission_percent numeric not null default 30,
  active boolean not null default false,
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  invite_code text not null default public.generate_unique_agency_invite_code()
);

alter table public.agencies
  add column if not exists id uuid,
  add column if not exists name text,
  add column if not exists responsible_name text,
  add column if not exists email text,
  add column if not exists whatsapp text,
  add column if not exists telegram text,
  add column if not exists country text,
  add column if not exists pix_key text,
  add column if not exists payment_method text,
  add column if not exists commission_percent numeric,
  add column if not exists active boolean,
  add column if not exists approved_at timestamptz,
  add column if not exists notes text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz,
  add column if not exists invite_code text;

alter table public.agencies
  alter column id set default uuid_generate_v4(),
  alter column payment_method set default 'pix',
  alter column commission_percent set default 30,
  alter column active set default false,
  alter column created_at set default now(),
  alter column updated_at set default now(),
  alter column invite_code set default public.generate_unique_agency_invite_code();

update public.agencies
set
  commission_percent = coalesce(commission_percent, 30),
  active = coalesce(active, false),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where commission_percent is null
  or active is null
  or created_at is null
  or updated_at is null;

do $$
declare
  agency_row record;
begin
  for agency_row in
    select id
    from public.agencies
    where invite_code is null
    order by created_at, id
  loop
    update public.agencies
    set invite_code = public.generate_unique_agency_invite_code()
    where id = agency_row.id
      and invite_code is null;
  end loop;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.agencies'::regclass
      and contype = 'p'
  ) then
    alter table public.agencies
      add constraint agencies_pkey primary key (id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from public.agencies where id is null) then
    alter table public.agencies alter column id set not null;
  end if;

  if not exists (select 1 from public.agencies where name is null) then
    alter table public.agencies alter column name set not null;
  end if;

  if not exists (select 1 from public.agencies where commission_percent is null) then
    alter table public.agencies alter column commission_percent set not null;
  end if;

  if not exists (select 1 from public.agencies where active is null) then
    alter table public.agencies alter column active set not null;
  end if;

  if not exists (select 1 from public.agencies where created_at is null) then
    alter table public.agencies alter column created_at set not null;
  end if;

  if not exists (select 1 from public.agencies where updated_at is null) then
    alter table public.agencies alter column updated_at set not null;
  end if;

  if not exists (select 1 from public.agencies where invite_code is null) then
    alter table public.agencies alter column invite_code set not null;
  end if;
end $$;

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

create index if not exists idx_agencies_active
  on public.agencies (active);

create index if not exists idx_agencies_email
  on public.agencies (email);

create unique index if not exists idx_agencies_invite_code_unique
  on public.agencies (invite_code);

create unique index if not exists idx_agencies_lower_email_unique
  on public.agencies (lower(email))
  where email is not null;

alter table public.agencies enable row level security;

comment on table public.agencies is
  'Operational agency records. Do not expose directly to common clients; use server-side service role or audited RPCs. Future RLS policies must be narrowly scoped.';

create table if not exists public.agency_users (
  id uuid primary key default uuid_generate_v4(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'owner',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agency_users
  add column if not exists id uuid,
  add column if not exists agency_id uuid,
  add column if not exists user_id uuid,
  add column if not exists role text,
  add column if not exists active boolean,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

alter table public.agency_users
  alter column id set default uuid_generate_v4(),
  alter column role set default 'owner',
  alter column active set default true,
  alter column created_at set default now(),
  alter column updated_at set default now();

update public.agency_users
set
  role = coalesce(role, 'owner'),
  active = coalesce(active, true),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where role is null
  or active is null
  or created_at is null
  or updated_at is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.agency_users'::regclass
      and contype = 'p'
  ) then
    alter table public.agency_users
      add constraint agency_users_pkey primary key (id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from public.agency_users where id is null) then
    alter table public.agency_users alter column id set not null;
  end if;

  if not exists (select 1 from public.agency_users where agency_id is null) then
    alter table public.agency_users alter column agency_id set not null;
  end if;

  if not exists (select 1 from public.agency_users where user_id is null) then
    alter table public.agency_users alter column user_id set not null;
  end if;

  if not exists (select 1 from public.agency_users where role is null) then
    alter table public.agency_users alter column role set not null;
  end if;

  if not exists (select 1 from public.agency_users where active is null) then
    alter table public.agency_users alter column active set not null;
  end if;

  if not exists (select 1 from public.agency_users where created_at is null) then
    alter table public.agency_users alter column created_at set not null;
  end if;

  if not exists (select 1 from public.agency_users where updated_at is null) then
    alter table public.agency_users alter column updated_at set not null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agency_users_role_check'
      and conrelid = 'public.agency_users'::regclass
  ) then
    alter table public.agency_users
      add constraint agency_users_role_check
      check (role in ('owner', 'manager', 'staff'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.agency_users'::regclass
      and c.contype = 'f'
      and c.confrelid = 'public.agencies'::regclass
      and c.conkey = array[
        (
          select a.attnum::smallint
          from pg_attribute a
          where a.attrelid = 'public.agency_users'::regclass
            and a.attname = 'agency_id'
        )
      ]
      and c.confkey = array[
        (
          select a.attnum::smallint
          from pg_attribute a
          where a.attrelid = 'public.agencies'::regclass
            and a.attname = 'id'
        )
      ]
  ) then
    alter table public.agency_users
      add constraint agency_users_agency_id_fkey
      foreign key (agency_id) references public.agencies(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.agency_users'::regclass
      and c.contype = 'f'
      and c.confrelid = 'public.users'::regclass
      and c.conkey = array[
        (
          select a.attnum::smallint
          from pg_attribute a
          where a.attrelid = 'public.agency_users'::regclass
            and a.attname = 'user_id'
        )
      ]
      and c.confkey = array[
        (
          select a.attnum::smallint
          from pg_attribute a
          where a.attrelid = 'public.users'::regclass
            and a.attname = 'id'
        )
      ]
  ) then
    alter table public.agency_users
      add constraint agency_users_user_id_fkey
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agency_users_agency_user_unique'
      and conrelid = 'public.agency_users'::regclass
  ) then
    alter table public.agency_users
      add constraint agency_users_agency_user_unique
      unique (agency_id, user_id);
  end if;
end $$;

create index if not exists idx_agency_users_active
  on public.agency_users (active);

create index if not exists idx_agency_users_active_user
  on public.agency_users (user_id)
  where active = true;

create index if not exists idx_agency_users_agency_id
  on public.agency_users (agency_id);

create index if not exists idx_agency_users_user_id
  on public.agency_users (user_id);

-- Producao possui redundancia historica entre a constraint
-- agency_users_agency_user_unique e o indice idx_agency_users_agency_user_unique.
-- Esta migration preserva objetos existentes e cria apenas a constraint canonica
-- quando ausente; o saneamento da duplicidade fica para auditoria propria.

alter table public.agency_users enable row level security;

comment on table public.agency_users is
  'Operational agency membership records. Do not expose directly to common clients; use server-side service role or audited RPCs. Future RLS policies must be narrowly scoped.';
