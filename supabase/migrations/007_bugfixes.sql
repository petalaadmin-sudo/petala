-- supabase/migrations/007_bugfixes.sql
-- Fecha os 4 bugs técnicos identificados

-- ============================================================
-- BUG 4: View creator_rankings não existia
-- ============================================================
drop view if exists public.creator_rankings;

create or replace view public.creator_rankings as
  select
    c.id                                          as creator_id,
    c.name,
    c.photo_url,
    c.rating,
    c.rank_weekly,
    -- presentes na semana atual
    coalesce(w.total_gifts_week, 0)               as total_gifts_week,
    -- presentes no mês atual
    coalesce(m.total_gifts_month, 0)              as total_gifts_month,
    -- rank calculado em tempo real (fallback se rank_weekly não atualizado)
    coalesce(c.rank_weekly,
      row_number() over (order by coalesce(w.total_gifts_week, 0) desc)
    )::integer                                    as rank_week,
    -- status online atual
    coalesce(p.online, false)                     as online,
    coalesce(p.in_session, false)                 as in_session
  from public.creators c
  left join public.creator_presence p on p.creator_id = c.id
  left join (
    select to_creator_id, count(*) as total_gifts_week
    from public.gifts
    where created_at >= date_trunc('week', now())
    group by to_creator_id
  ) w on w.to_creator_id = c.id
  left join (
    select to_creator_id, count(*) as total_gifts_month
    from public.gifts
    where created_at >= date_trunc('month', now())
    group by to_creator_id
  ) m on m.to_creator_id = c.id
  where c.active = true
  order by coalesce(w.total_gifts_week, 0) desc;

-- ============================================================
-- BUG 3: Função atômica para incrementar unlock_count
-- ============================================================
create or replace function public.increment_unlock_count(p_photo_id uuid)
returns void language sql security definer as $$
  update public.album_photos
  set unlock_count = unlock_count + 1
  where id = p_photo_id;
$$;

-- ============================================================
-- BUG 2: Função que o webhook Pix deve chamar após pagamento
-- Seta first_purchase_done e tenta liberar bônus de indicação
-- ============================================================
create or replace function public.on_first_purchase(p_user_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_already boolean;
  v_bonus   jsonb;
begin
  -- Verifica se já foi marcado (idempotência)
  select first_purchase_done into v_already from public.users where id = p_user_id;
  if v_already then
    return jsonb_build_object('already_done', true);
  end if;

  -- Marca primeira compra
  update public.users
  set first_purchase_done = true
  where id = p_user_id;

  -- Tenta liberar bônus de indicação
  v_bonus := public.try_release_welcome_bonus(p_user_id);

  return jsonb_build_object(
    'first_purchase_marked', true,
    'bonus_result', v_bonus
  );
end;
$$;

-- ============================================================
-- BUG 2 (complemento): corrige try_release_welcome_bonus
-- para usar auth.users.email_confirmed_at via join correto
-- ============================================================
create or replace function public.try_release_welcome_bonus(p_user_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_user       record;
  v_auth_user  record;
  v_ref        record;
  v_verified   boolean;
begin
  select * into v_user from public.users where id = p_user_id;
  if not found then return jsonb_build_object('released', false, 'reason', 'user not found'); end if;

  -- Verifica confirmação via phone_verified OU email confirmado na tabela auth
  select email_confirmed_at is not null as confirmed
  into v_verified
  from auth.users
  where id = p_user_id;

  if not (v_user.phone_verified or v_verified) then
    return jsonb_build_object('released', false, 'reason', 'not verified');
  end if;

  if not v_user.first_purchase_done then
    return jsonb_build_object('released', false, 'reason', 'no purchase yet');
  end if;

  -- Busca indicação pendente (usuário→usuário apenas)
  select * into v_ref
  from public.referrals
  where referred_id = p_user_id
    and referrer_type = 'user'
    and referred_type = 'user'
    and not welcome_bonus_referred_paid
    and not blocked;

  if not found then return jsonb_build_object('released', false, 'reason', 'no eligible referral'); end if;

  -- Idempotência: tenta atualizar só se ainda não pago
  update public.referrals
  set welcome_bonus_referred_paid = true,
      welcome_bonus_referrer_paid = true,
      welcome_bonus_paid_at       = now()
  where id = v_ref.id
    and not welcome_bonus_referred_paid;

  if not found then return jsonb_build_object('released', false, 'reason', 'already processed'); end if;

  -- Credita 50 🌸 para cada lado
  perform public.credit_petals(p_user_id,         50, 'bonus');
  perform public.credit_petals(v_ref.referrer_id,  50, 'bonus');

  update public.users set referral_bonus_paid = true where id = p_user_id;

  return jsonb_build_object('released', true, 'petals_each', 50);
end;
$$;

-- ============================================================
-- Atualiza job de ranking semanal para usar a nova view
-- ============================================================
select cron.unschedule('update-weekly-ranking') where exists (
  select 1 from cron.job where jobname = 'update-weekly-ranking'
);

select cron.schedule(
  'update-weekly-ranking',
  '0 * * * *',
  $$
    update public.creators c
    set rank_weekly     = r.rank,
        rank_updated_at = now()
    from (
      select
        to_creator_id,
        row_number() over (order by count(*) desc)::integer as rank
      from public.gifts
      where created_at >= date_trunc('week', now())
      group by to_creator_id
    ) r
    where c.id = r.to_creator_id and c.active = true;
  $$
);
