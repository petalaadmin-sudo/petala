-- supabase/migrations/006_indicacoes.sql

-- Campos nas tabelas existentes
alter table public.users
  add column if not exists referral_code       text unique,
  add column if not exists referred_by         uuid references public.users(id),
  add column if not exists referral_bonus_paid boolean not null default false,
  add column if not exists phone_verified      boolean not null default false,
  add column if not exists phone               text,
  add column if not exists first_purchase_done boolean not null default false;

create unique index if not exists idx_users_referral_code on public.users(referral_code);
create index if not exists idx_users_referred_by on public.users(referred_by);

-- Tabela de indicações
create table public.referrals (
  id                          uuid primary key default uuid_generate_v4(),
  referrer_id                 uuid not null references public.users(id),
  referred_id                 uuid not null unique references public.users(id),
  referrer_type               text not null check (referrer_type in ('user','creator')),
  referred_type               text not null check (referred_type in ('user','creator')),
  welcome_bonus_referrer_paid boolean not null default false,
  welcome_bonus_referred_paid boolean not null default false,
  welcome_bonus_paid_at       timestamptz,
  referred_email_verified     boolean not null default false,
  referred_first_purchase_done boolean not null default false,
  total_commission_earned     integer not null default 0,
  commission_rate             numeric(4,2) not null default 0.10,
  referred_ip                 text,
  fraud_flags                 text[],
  blocked                     boolean not null default false,
  created_at                  timestamptz not null default now()
);

create index idx_referrals_referrer on public.referrals(referrer_id);
create index idx_referrals_referred on public.referrals(referred_id);

-- Comissões de video
create table public.referral_commissions (
  id                uuid primary key default uuid_generate_v4(),
  referral_id       uuid not null references public.referrals(id),
  referrer_id       uuid not null references public.users(id),
  referred_id       uuid not null references public.users(id),
  session_id        uuid references public.chat_sessions(id),
  petals_earned     integer not null,
  commission_petals integer not null,
  created_at        timestamptz not null default now()
);

create index idx_commissions_referrer on public.referral_commissions(referrer_id, created_at desc);

-- Gera código único 6 chars
create or replace function public.generate_referral_code()
returns text language plpgsql as $$
declare
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code   text := '';
  i      integer;
  exists_flag boolean;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    end loop;
    select count(*) > 0 into exists_flag from public.users where referral_code = code;
    exit when not exists_flag;
  end loop;
  return code;
end;
$$;

-- Trigger: gera código ao criar usuario
create or replace function public.handle_new_user_referral()
returns trigger language plpgsql security definer as $$
begin
  update public.users set referral_code = public.generate_referral_code()
  where id = new.id and referral_code is null;
  return new;
end;
$$;

drop trigger if exists on_user_created_referral on public.users;
create trigger on_user_created_referral
  after insert on public.users
  for each row execute procedure public.handle_new_user_referral();

-- Popula codigos existentes
update public.users set referral_code = public.generate_referral_code() where referral_code is null;

-- Registra indicacao
create or replace function public.register_referral(
  p_referred_id   uuid,
  p_referral_code text,
  p_referred_ip   text default null
) returns jsonb language plpgsql security definer as $$
declare
  v_referrer      record;
  v_referred      record;
  v_referrer_type text;
  v_referred_type text;
begin
  select u.*, c.id as creator_id into v_referrer
  from public.users u
  left join public.creators c on c.user_id = u.id and c.active = true
  where u.referral_code = upper(trim(p_referral_code));

  if not found then
    return jsonb_build_object('success', false, 'error', 'Codigo invalido');
  end if;

  if v_referrer.id = p_referred_id then
    return jsonb_build_object('success', false, 'error', 'Nao pode usar o proprio codigo');
  end if;

  select * into v_referred from public.users where id = p_referred_id;

  if v_referred.referred_by is not null then
    return jsonb_build_object('success', false, 'error', 'Ja possui indicador');
  end if;

  if exists(select 1 from public.referrals where referred_id = p_referred_id) then
    return jsonb_build_object('success', false, 'error', 'Indicacao ja registrada');
  end if;

  v_referrer_type := case when v_referrer.creator_id is not null then 'creator' else 'user' end;
  v_referred_type := case when v_referred.role = 'creator' then 'creator' else 'user' end;

  insert into public.referrals (referrer_id, referred_id, referrer_type, referred_type, referred_ip, commission_rate)
  values (v_referrer.id, p_referred_id, v_referrer_type, v_referred_type, p_referred_ip, 0.10);

  update public.users set referred_by = v_referrer.id where id = p_referred_id;

  return jsonb_build_object('success', true, 'referrer_type', v_referrer_type);
end;
$$;

-- Libera bonus boas-vindas (usuario→usuario)
create or replace function public.try_release_welcome_bonus(p_user_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_user record;
  v_ref  record;
begin
  select * into v_user from public.users where id = p_user_id;
  if not found then return jsonb_build_object('released', false); end if;

  if not (v_user.phone_verified or v_user.email_confirmed_at is not null) then
    return jsonb_build_object('released', false, 'reason', 'not verified');
  end if;

  if not v_user.first_purchase_done then
    return jsonb_build_object('released', false, 'reason', 'no purchase');
  end if;

  select * into v_ref
  from public.referrals
  where referred_id = p_user_id
    and not welcome_bonus_referred_paid
    and not blocked
    and referrer_type = 'user'
    and referred_type = 'user';

  if not found then return jsonb_build_object('released', false, 'reason', 'no referral'); end if;

  update public.referrals
  set welcome_bonus_referred_paid = true,
      welcome_bonus_referrer_paid = true,
      welcome_bonus_paid_at = now()
  where id = v_ref.id and not welcome_bonus_referred_paid;

  if not found then return jsonb_build_object('released', false, 'reason', 'already processed'); end if;

  perform public.credit_petals(p_user_id, 50, 'bonus');
  perform public.credit_petals(v_ref.referrer_id, 50, 'bonus');
  update public.users set referral_bonus_paid = true where id = p_user_id;

  return jsonb_build_object('released', true, 'petals_each', 50);
end;
$$;

-- Paga comissao de video (criadora→criadora)
create or replace function public.pay_video_referral_commission(
  p_creator_user_id uuid,
  p_petals_earned   integer,
  p_session_id      uuid
) returns void language plpgsql security definer as $$
declare
  v_ref        record;
  v_commission integer;
begin
  select r.* into v_ref
  from public.referrals r
  where r.referred_id = (select id from public.users where id = p_creator_user_id)
    and r.referred_type = 'creator'
    and not r.blocked;

  if not found then return; end if;

  v_commission := floor(p_petals_earned * v_ref.commission_rate);
  if v_commission <= 0 then return; end if;

  perform public.credit_petals(v_ref.referrer_id, v_commission, 'bonus', p_session_id);

  insert into public.referral_commissions (referral_id, referrer_id, referred_id, session_id, petals_earned, commission_petals)
  values (v_ref.id, v_ref.referrer_id, p_creator_user_id, p_session_id, p_petals_earned, v_commission);

  update public.referrals set total_commission_earned = total_commission_earned + v_commission where id = v_ref.id;
end;
$$;

-- Atualiza charge_chat_minute com comissao de video
create or replace function public.charge_chat_minute(p_session_id uuid, p_user_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_session      record;
  v_price        integer;
  v_spend_result jsonb;
  v_creator_earn integer;
begin
  select cs.*, c.price_text_petals, c.price_video_petals, c.user_id as creator_user_id
  into v_session
  from public.chat_sessions cs
  join public.creators c on c.id = cs.creator_id
  where cs.id = p_session_id and cs.user_id = p_user_id and cs.ended_at is null;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Sessao invalida');
  end if;

  v_price := case v_session.type when 'video' then v_session.price_video_petals else v_session.price_text_petals end;
  v_spend_result := public.spend_petals(p_user_id, v_price, 'spend', p_session_id);

  if not (v_spend_result->>'success')::boolean then
    update public.chat_sessions set ended_at = now(), duration_seconds = extract(epoch from now() - started_at)::integer where id = p_session_id;
    return jsonb_build_object('success', false, 'error', 'Saldo insuficiente', 'session_ended', true);
  end if;

  v_creator_earn := floor(v_price * 0.7);
  perform public.credit_petals(v_session.creator_user_id, v_creator_earn, 'gift_received', p_session_id);

  if v_session.type = 'video' then
    perform public.pay_video_referral_commission(v_session.creator_user_id, v_creator_earn, p_session_id);
  end if;

  update public.chat_sessions set petals_charged = petals_charged + v_price where id = p_session_id;

  return jsonb_build_object('success', true, 'petals_charged', v_price, 'new_balance', (v_spend_result->>'new_balance')::integer);
end;
$$;

-- RLS
alter table public.referrals enable row level security;
alter table public.referral_commissions enable row level security;

create policy "referrals_select_own" on public.referrals
  for select using (referrer_id = auth.uid() or referred_id = auth.uid());

create policy "referral_commissions_select_own" on public.referral_commissions
  for select using (referrer_id = auth.uid() or referred_id = auth.uid());
