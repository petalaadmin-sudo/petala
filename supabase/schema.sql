-- ============================================
-- PÉTALA — Schema Supabase completo
-- Execute no SQL Editor do Supabase
-- ============================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron"; -- para jobs agendados (ranking)

-- ============================================
-- TIPOS CUSTOM
-- ============================================
create type user_role as enum ('user', 'creator', 'admin');
create type session_type as enum ('text', 'video');
create type transaction_type as enum ('purchase', 'spend', 'gift_sent', 'gift_received', 'payout', 'bonus');
create type transaction_status as enum ('pending', 'completed', 'failed', 'refunded');

-- ============================================
-- TABELAS
-- ============================================

-- Usuários (espelha auth.users)
create table public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  role            user_role not null default 'user',
  username        text unique,
  balance_petals  integer not null default 0 check (balance_petals >= 0),
  vip_until       timestamptz,
  age_confirmed   boolean not null default false,
  age_confirmed_at timestamptz,
  pwa_installed   boolean not null default false,
  onesignal_player_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Criadoras
create table public.creators (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null unique references public.users(id) on delete cascade,
  name                    text not null,
  bio                     text,
  photo_url               text,
  verified                boolean not null default false,
  verified_at             timestamptz,
  active                  boolean not null default false,
  price_text_petals       integer not null default 5  check (price_text_petals > 0),
  price_video_petals      integer not null default 20 check (price_video_petals > 0),
  rating                  numeric(3,2) not null default 0,
  rating_count            integer not null default 0,
  total_gifts             integer not null default 0,
  total_earnings_petals   integer not null default 0,
  rank_weekly             integer,
  rank_updated_at         timestamptz,
  pix_key                 text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Fotos do álbum
create table public.album_photos (
  id            uuid primary key default uuid_generate_v4(),
  creator_id    uuid not null references public.creators(id) on delete cascade,
  r2_key        text not null,
  r2_key_blur   text,
  blur_hash     text,
  is_free       boolean not null default false,
  price_petals  integer not null default 50 check (price_petals >= 0),
  unlock_count  integer not null default 0,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- Desbloqueios de fotos
create table public.photo_unlocks (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  photo_id      uuid not null references public.album_photos(id) on delete cascade,
  petals_spent  integer not null,
  created_at    timestamptz not null default now(),
  unique(user_id, photo_id)  -- cada usuário só desbloqueia uma vez
);

-- Sessões de chat
create table public.chat_sessions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id),
  creator_id          uuid not null references public.creators(id),
  type                session_type not null default 'text',
  daily_room_name     text,
  started_at          timestamptz not null default now(),
  ended_at            timestamptz,
  duration_seconds    integer,
  petals_charged      integer not null default 0,
  rating              smallint check (rating between 1 and 5),
  rating_comment      text
);

-- Presentes
create table public.gifts (
  id                      uuid primary key default uuid_generate_v4(),
  from_user_id            uuid not null references public.users(id),
  to_creator_id           uuid not null references public.creators(id),
  session_id              uuid references public.chat_sessions(id),
  gift_type               text not null,
  gift_emoji              text not null,
  petals_spent            integer not null check (petals_spent > 0),
  creator_petals_earned   integer not null,  -- 70% do gasto
  created_at              timestamptz not null default now()
);

-- Transações financeiras
create table public.transactions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id),
  type          transaction_type not null,
  petals_delta  integer not null,
  balance_after integer not null,
  amount_brl    numeric(10,2),
  gateway_id    text,
  ref_id        uuid,
  status        transaction_status not null default 'completed',
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

-- Pacotes de pétalas
create table public.petal_packages (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  petals        integer not null,
  bonus_petals  integer not null default 0,
  price_brl     numeric(10,2) not null,
  active        boolean not null default true,
  sort_order    integer not null default 0
);

-- VIP por criadora
create table public.vip_subscriptions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id),
  creator_id    uuid not null references public.creators(id),
  starts_at     timestamptz not null default now(),
  ends_at       timestamptz not null,
  price_brl     numeric(10,2) not null,
  gateway_id    text,
  active        boolean not null default true,
  unique(user_id, creator_id)
);

-- ============================================
-- ÍNDICES
-- ============================================
create index idx_creators_active on public.creators(active) where active = true;
create index idx_creators_rank on public.creators(rank_weekly) where rank_weekly is not null;
create index idx_gifts_creator on public.gifts(to_creator_id, created_at desc);
create index idx_gifts_user on public.gifts(from_user_id, created_at desc);
create index idx_sessions_user on public.chat_sessions(user_id, started_at desc);
create index idx_sessions_creator on public.chat_sessions(creator_id, started_at desc);
create index idx_transactions_user on public.transactions(user_id, created_at desc);
create index idx_unlocks_user on public.photo_unlocks(user_id);
create index idx_photos_creator on public.album_photos(creator_id, sort_order);

-- ============================================
-- PACOTES INICIAIS
-- ============================================
insert into public.petal_packages (name, petals, bonus_petals, price_brl, sort_order) values
  ('Semente',  100,    0, 19.90, 1),
  ('Buquê',    300,  150, 39.90, 2),
  ('Jardim',   700,  350, 79.90, 3),
  ('Paraíso', 2000, 1000, 199.90, 4);

-- ============================================
-- FUNÇÕES ATÔMICAS (evitam race conditions)
-- ============================================

-- Débita pétalas com verificação de saldo
create or replace function public.spend_petals(
  p_user_id   uuid,
  p_amount    integer,
  p_type      transaction_type,
  p_ref_id    uuid default null
) returns jsonb language plpgsql security definer as $$
declare
  v_balance integer;
  v_new_balance integer;
begin
  -- Lock na linha do usuário para evitar race condition
  select balance_petals into v_balance
  from public.users
  where id = p_user_id
  for update;

  if v_balance < p_amount then
    return jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
  end if;

  v_new_balance := v_balance - p_amount;

  update public.users
  set balance_petals = v_new_balance, updated_at = now()
  where id = p_user_id;

  insert into public.transactions (user_id, type, petals_delta, balance_after, ref_id)
  values (p_user_id, p_type, -p_amount, v_new_balance, p_ref_id);

  return jsonb_build_object('success', true, 'new_balance', v_new_balance);
end;
$$;

-- Credita pétalas (compra, bônus, etc)
create or replace function public.credit_petals(
  p_user_id   uuid,
  p_amount    integer,
  p_type      transaction_type,
  p_ref_id    uuid default null
) returns jsonb language plpgsql security definer as $$
declare
  v_new_balance integer;
begin
  update public.users
  set balance_petals = balance_petals + p_amount, updated_at = now()
  where id = p_user_id
  returning balance_petals into v_new_balance;

  insert into public.transactions (user_id, type, petals_delta, balance_after, ref_id)
  values (p_user_id, p_type, p_amount, v_new_balance, p_ref_id);

  return jsonb_build_object('success', true, 'new_balance', v_new_balance);
end;
$$;

-- Envia presente (débita usuário + credita criadora 70%)
create or replace function public.send_gift(
  p_from_user   uuid,
  p_to_creator  uuid,
  p_gift_type   text,
  p_gift_emoji  text,
  p_petals      integer,
  p_session_id  uuid default null
) returns jsonb language plpgsql security definer as $$
declare
  v_creator_user_id uuid;
  v_creator_earn    integer;
  v_spend_result    jsonb;
  v_gift_id         uuid;
begin
  -- Débita do usuário
  v_spend_result := public.spend_petals(p_from_user, p_petals, 'gift_sent');

  if not (v_spend_result->>'success')::boolean then
    return v_spend_result;
  end if;

  -- Criadora recebe 70%
  v_creator_earn := floor(p_petals * 0.7);

  select user_id into v_creator_user_id
  from public.creators where id = p_to_creator;

  -- Credita criadora
  perform public.credit_petals(v_creator_user_id, v_creator_earn, 'gift_received');

  -- Registra presente
  insert into public.gifts (from_user_id, to_creator_id, session_id, gift_type, gift_emoji, petals_spent, creator_petals_earned)
  values (p_from_user, p_to_creator, p_session_id, p_gift_type, p_gift_emoji, p_petals, v_creator_earn)
  returning id into v_gift_id;

  -- Atualiza contador da criadora
  update public.creators
  set total_gifts = total_gifts + 1,
      total_earnings_petals = total_earnings_petals + v_creator_earn,
      updated_at = now()
  where id = p_to_creator;

  return jsonb_build_object('success', true, 'gift_id', v_gift_id);
end;
$$;

-- Trigger: cria registro em public.users quando usuário se registra no Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at before update on public.users
  for each row execute procedure public.set_updated_at();

create trigger set_creators_updated_at before update on public.creators
  for each row execute procedure public.set_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.users enable row level security;
alter table public.creators enable row level security;
alter table public.album_photos enable row level security;
alter table public.photo_unlocks enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.gifts enable row level security;
alter table public.transactions enable row level security;
alter table public.petal_packages enable row level security;
alter table public.vip_subscriptions enable row level security;

-- users: cada um vê só o próprio
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- creators: qualquer autenticado pode ver criadoras ativas
create policy "creators_select_active" on public.creators for select using (active = true or user_id = auth.uid());
create policy "creators_update_own" on public.creators for update using (user_id = auth.uid());
create policy "creators_insert_own" on public.creators for insert with check (user_id = auth.uid());

-- album_photos: qualquer autenticado vê (controle de acesso no app)
create policy "photos_select_auth" on public.album_photos for select using (auth.uid() is not null);
create policy "photos_insert_own" on public.album_photos for insert
  with check (creator_id in (select id from public.creators where user_id = auth.uid()));

-- photo_unlocks: usuário vê os próprios
create policy "unlocks_select_own" on public.photo_unlocks for select using (user_id = auth.uid());
create policy "unlocks_insert_own" on public.photo_unlocks for insert with check (user_id = auth.uid());

-- transactions: usuário vê as próprias
create policy "tx_select_own" on public.transactions for select using (user_id = auth.uid());

-- gifts: usuário vê os que enviou, criadora vê os que recebeu
create policy "gifts_select" on public.gifts for select
  using (from_user_id = auth.uid() or to_creator_id in (select id from public.creators where user_id = auth.uid()));

-- petal_packages: qualquer um pode ver
create policy "packages_select" on public.petal_packages for select using (active = true);

-- vip: usuário vê os próprios
create policy "vip_select_own" on public.vip_subscriptions for select using (user_id = auth.uid());

-- ============================================
-- RANKING SEMANAL (job agendado)
-- ============================================
select cron.schedule(
  'update-weekly-ranking',
  '0 * * * *',  -- a cada hora
  $$
  update public.creators c
  set rank_weekly = r.rank,
      rank_updated_at = now()
  from (
    select
      to_creator_id,
      rank() over (order by count(*) desc) as rank
    from public.gifts
    where created_at > now() - interval '7 days'
    group by to_creator_id
  ) r
  where c.id = r.to_creator_id;
  $$
);
