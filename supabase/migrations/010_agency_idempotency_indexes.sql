-- Indices de seguranca/idempotencia para provisionamento de agencias.
-- Nao altera dados existentes, colunas, roles ou fluxos financeiros.

create unique index if not exists idx_agencies_lower_email_unique
  on public.agencies (lower(email))
  where email is not null;

create unique index if not exists idx_agency_users_agency_user_unique
  on public.agency_users (agency_id, user_id);

create index if not exists idx_agency_users_active_user
  on public.agency_users (user_id)
  where active = true;
