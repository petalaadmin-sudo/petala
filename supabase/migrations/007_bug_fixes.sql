-- supabase/migrations/007_bug_fixes.sql
-- Corrige 4 bugs identificados após revisão completa

-- ============================================================
-- BUG 3: Função atômica para incrementar unlock_count
-- ============================================================
create or replace function public.increment_photo_unlock(p_photo_id uuid)
returns void language sql security definer as $$
  update public.album_photos
  set unlock_count = unlock_count + 1
  where id = p_photo_id;
$$;

-- ============================================================
-- BUG 2: Função chamada pelo webhook do Pix após pagamento
-- Seta first_purchase_done = true e tenta liberar bônus
-- ============================================================
create or replace function public.on_first_purchase(p_user_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_already_done boolean;
  v_bonus_result jsonb;
begin
  -- Verifica se já foi marcado (idempotência)
  select first_purchase_done into v_already_done
  from public.users where id = p_user_id;

  -- Marca primeira compra (mesmo que já tenha sido feita — idempotente)
  update public.users
  set first_purchase_done = true
  where id = p_user_id;

  -- Tenta liberar bônus de indicação
  v_bonus_result := public.try_release_welcome_bonus(p_user_id);

  return jsonb_build_object(
    'first_purchase_was_new', not coalesce(v_already_done, false),
    'bonus_result', v_bonus_result
  );
end;
$$;

-- ============================================================
-- BUG 4: View creator_rankings usada na página /ranking
-- Campos esperados pelo frontend:
--   creator_id, name, photo_url, total_gifts_week,
--   total_gifts_month, rank_week, rank_month, online
-- ============================================================
drop view if exists public.creator_rankings;

create view public.creator_rankings as
with gifts_week as (
  select
    to_creator_id,
    count(*) as total_week
  from public.gifts
  where created_at >= now() - interval '7 days'
  group by to_creator_id
),
gifts_month as (
  select
    to_creator_id,
    count(*) as total_month
  from public.gifts
  where created_at >= now() - interval '30 days'
  group by to_creator_id
)
select
  c.id                                       as creator_id,
  c.name,
  c.photo_url,
  coalesce(gw.total_week, 0)::integer        as total_gifts_week,
  coalesce(gm.total_month, 0)::integer       as total_gifts_month,
  rank() over (order by coalesce(gw.total_week, 0) desc)::integer  as rank_week,
  rank() over (order by coalesce(gm.total_month, 0) desc)::integer as rank_month,
  coalesce(cp.online, false)                 as online
from public.creators c
left join gifts_week  gw on gw.to_creator_id = c.id
left join gifts_month gm on gm.to_creator_id = c.id
left join public.creator_presence cp on cp.creator_id = c.id
where c.active = true
order by rank_week asc;

-- ============================================================
-- BUG 1 (SQL side): garante que email_confirmed_at é lido
-- de auth.users ao verificar elegibilidade de bônus
-- ============================================================

-- Atualiza try_release_welcome_bonus para ler email_confirmed_at
-- da tabela auth.users (não public.users que não tem esse campo)
create or replace function public.try_release_welcome_bonus(p_user_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_user       record;
  v_auth_user  record;
  v_ref        record;
  v_email_ok   boolean;
begin
  select * into v_user from public.users where id = p_user_id;
  if not found then return jsonb_build_object('released', false, 'reason', 'user not found'); end if;

  -- BUG FIX: lê email_confirmed_at de auth.users
  select email_confirmed_at into v_auth_user
  from auth.users where id = p_user_id;

  v_email_ok := (v_auth_user.email_confirmed_at is not null) or v_user.phone_verified;

  if not v_email_ok then
    return jsonb_build_object('released', false, 'reason', 'not verified');
  end if;

  if not v_user.first_purchase_done then
    return jsonb_build_object('released', false, 'reason', 'no purchase');
  end if;

  -- Busca indicação de usuário pendente (não aplica para criadora→criadora)
  select * into v_ref
  from public.referrals
  where referred_id = p_user_id
    and not welcome_bonus_referred_paid
    and not blocked;

  if not found then
    return jsonb_build_object('released', false, 'reason', 'no pending referral');
  end if;

  -- Lock contra duplo processamento
  update public.referrals
  set welcome_bonus_referred_paid = true,
      welcome_bonus_referrer_paid = true,
      welcome_bonus_paid_at       = now()
  where id = v_ref.id
    and not welcome_bonus_referred_paid;  -- condição atômica

  if not found then
    return jsonb_build_object('released', false, 'reason', 'already processed');
  end if;

  -- Credita 50 pétalas para cada um
  perform public.credit_petals(p_user_id,       50, 'bonus');
  perform public.credit_petals(v_ref.referrer_id, 50, 'bonus');

  update public.users set referral_bonus_paid = true where id = p_user_id;

  return jsonb_build_object('released', true, 'petals_each', 50);
end;
$$;

-- ============================================================
-- EXTRA: Corrige a função generate_referral_code para usar
-- exists() de forma compatível com todas as versões do PG
-- ============================================================
create or replace function public.generate_referral_code()
returns text language plpgsql as $$
declare
  chars       text    := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code        text    := '';
  i           integer;
  code_exists boolean;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, (floor(random() * length(chars)) + 1)::integer, 1);
    end loop;
    select exists(select 1 from public.users where referral_code = code) into code_exists;
    exit when not code_exists;
  end loop;
  return code;
end;
$$;
