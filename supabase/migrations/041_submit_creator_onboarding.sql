-- ============================================================
-- CREATOR ONBOARDING TRANSACIONAL
-- ============================================================
-- Finaliza o onboarding de criadora em uma unica transacao de banco:
-- 1. garante public.users;
-- 2. cria/atualiza public.creators por user_id;
-- 3. cria/atualiza public.creator_verifications como pending;
-- 4. promove public.users.role para creator;
-- 5. retorna o estado confirmado.

create or replace function public.submit_creator_onboarding(
  p_user_id uuid,
  p_email text,
  p_name text,
  p_bio text default null,
  p_photo_url text default null,
  p_pix_key text default null,
  p_price_text_petals integer default 50,
  p_price_video_petals integer default 120
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_role public.user_role;
  v_creator record;
  v_verification record;
  v_confirmed_role public.user_role;
begin
  if p_user_id is null then
    raise exception 'user_id is required';
  end if;

  p_email := nullif(btrim(coalesce(p_email, '')), '');
  p_name := btrim(coalesce(p_name, ''));
  p_bio := nullif(btrim(coalesce(p_bio, '')), '');
  p_photo_url := nullif(btrim(coalesce(p_photo_url, '')), '');
  p_pix_key := regexp_replace(coalesce(p_pix_key, ''), '\D', '', 'g');

  if p_name = '' or length(p_name) > 30 then
    raise exception 'invalid creator name';
  end if;

  if p_bio is not null and length(p_bio) > 150 then
    raise exception 'invalid creator bio';
  end if;

  if p_pix_key !~ '^\d{11}$' then
    raise exception 'invalid pix cpf';
  end if;

  if p_photo_url is not null and p_photo_url !~* '^https://' then
    raise exception 'invalid photo url';
  end if;

  if p_price_text_petals <> 50 or p_price_video_petals <> 120 then
    raise exception 'invalid creator prices';
  end if;

  select role
    into v_user_role
  from public.users
  where id = p_user_id
  for update;

  if not found then
    if p_email is null then
      raise exception 'email is required for user profile creation';
    end if;

    insert into public.users (id, email, role)
    values (p_user_id, p_email, 'user'::public.user_role)
    returning role into v_user_role;
  end if;

  if v_user_role = 'admin'::public.user_role then
    raise exception 'admin account cannot become creator through onboarding';
  end if;

  insert into public.creators (
    user_id,
    name,
    bio,
    photo_url,
    price_text_petals,
    price_video_petals,
    pix_key,
    verified,
    active
  ) values (
    p_user_id,
    p_name,
    p_bio,
    p_photo_url,
    p_price_text_petals,
    p_price_video_petals,
    p_pix_key,
    false,
    false
  )
  on conflict (user_id) do update
  set name = excluded.name,
      bio = excluded.bio,
      photo_url = coalesce(excluded.photo_url, public.creators.photo_url),
      price_text_petals = excluded.price_text_petals,
      price_video_petals = excluded.price_video_petals,
      pix_key = excluded.pix_key,
      updated_at = now()
  returning id, user_id, verified, active, photo_url
  into v_creator;

  insert into public.creator_verifications (
    creator_id,
    user_id,
    status,
    submitted_at
  ) values (
    v_creator.id,
    p_user_id,
    'pending',
    now()
  )
  on conflict (creator_id) do update
  set user_id = excluded.user_id,
      status = case
        when public.creator_verifications.status = 'approved' then public.creator_verifications.status
        else 'pending'
      end,
      submitted_at = case
        when public.creator_verifications.status = 'approved' then public.creator_verifications.submitted_at
        else now()
      end,
      rejection_reason = case
        when public.creator_verifications.status = 'approved' then public.creator_verifications.rejection_reason
        else null
      end,
      reviewed_at = case
        when public.creator_verifications.status = 'approved' then public.creator_verifications.reviewed_at
        else null
      end,
      reviewed_by = case
        when public.creator_verifications.status = 'approved' then public.creator_verifications.reviewed_by
        else null
      end
  returning id, status
  into v_verification;

  update public.users
  set role = 'creator'::public.user_role
  where id = p_user_id
  returning role into v_confirmed_role;

  if v_confirmed_role <> 'creator'::public.user_role then
    raise exception 'creator role confirmation failed';
  end if;

  select id, user_id, verified, active, photo_url
    into v_creator
  from public.creators
  where user_id = p_user_id;

  if not found then
    raise exception 'creator confirmation failed';
  end if;

  return jsonb_build_object(
    'success', true,
    'creator_id', v_creator.id,
    'user_id', p_user_id,
    'role', v_confirmed_role::text,
    'verified', coalesce(v_creator.verified, false),
    'active', coalesce(v_creator.active, false),
    'photo_url', v_creator.photo_url,
    'verification_id', v_verification.id,
    'verification_status', v_verification.status
  );
end;
$$;

revoke execute on function public.submit_creator_onboarding(
  uuid,
  text,
  text,
  text,
  text,
  text,
  integer,
  integer
) from public;

revoke execute on function public.submit_creator_onboarding(
  uuid,
  text,
  text,
  text,
  text,
  text,
  integer,
  integer
) from anon, authenticated;

grant execute on function public.submit_creator_onboarding(
  uuid,
  text,
  text,
  text,
  text,
  text,
  integer,
  integer
) to service_role;
