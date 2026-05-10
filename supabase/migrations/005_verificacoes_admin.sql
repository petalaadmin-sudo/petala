-- supabase/migrations/005_verificacoes_admin.sql

-- ============================================================
-- TABELA DE VERIFICAÇÕES DE CRIADORAS
-- ============================================================
create table public.creator_verifications (
  id                uuid primary key default uuid_generate_v4(),
  creator_id        uuid not null unique references public.creators(id) on delete cascade,
  user_id           uuid not null references public.users(id),
  doc_key           text,                  -- chave no Supabase Storage
  selfie_key        text,
  cpf_hash          text,                  -- em produção: hash bcrypt
  status            text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason  text,
  submitted_at      timestamptz not null default now(),
  reviewed_at       timestamptz,
  reviewed_by       uuid references public.users(id)
);

-- Índice para o painel admin
create index idx_verifications_status on public.creator_verifications(status, submitted_at asc);

-- RLS — apenas admin e a própria criadora podem ver
alter table public.creator_verifications enable row level security;

create policy "verifications_select_own" on public.creator_verifications
  for select using (
    user_id = auth.uid() or
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "verifications_insert_own" on public.creator_verifications
  for insert with check (user_id = auth.uid());

create policy "verifications_update_admin" on public.creator_verifications
  for update using (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- SUPABASE STORAGE — bucket privado para documentos
-- Execute no dashboard: Storage → New bucket
-- Nome: verificacoes
-- Public: FALSE (privado)
-- ============================================================
-- Não é possível criar buckets via SQL — faça manualmente no dashboard:
-- 1. Acesse: app.supabase.com → seu projeto → Storage
-- 2. "New bucket" → nome: verificacoes → desmarque "Public bucket"
-- 3. O acesso é feito via supabase.storage.from('verificacoes')

-- ============================================================
-- PROMOVER USUÁRIO PARA ADMIN (execute manualmente)
-- ============================================================
-- Substitua o e-mail abaixo pelo seu e-mail de admin:
-- UPDATE public.users SET role = 'admin' WHERE email = 'admin@petala.app';

-- ============================================================
-- FUNÇÃO AUXILIAR — verifica se usuário é admin
-- ============================================================
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists(
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- VIEW DO ADMIN — criadoras com status de verificação
-- ============================================================
create or replace view public.admin_creator_overview as
  select
    c.id,
    c.name,
    c.photo_url,
    c.verified,
    c.active,
    c.rating,
    c.total_gifts,
    c.rank_weekly,
    c.price_video_petals,
    u.email,
    u.created_at as user_since,
    cv.status    as verification_status,
    cv.submitted_at
  from public.creators c
  join public.users u on u.id = c.user_id
  left join public.creator_verifications cv on cv.creator_id = c.id
  order by c.created_at desc;

-- RLS na view
create policy "admin_overview_select" on public.creators
  for select using (
    user_id = auth.uid() or public.is_admin() or active = true
  );
