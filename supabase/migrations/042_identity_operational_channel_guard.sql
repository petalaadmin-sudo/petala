-- ============================================================
-- IDENTITY OPERATIONAL CHANNEL GUARD
-- ============================================================
-- Separa o canal operacional da conta do role usado para autorizacao.
-- O objetivo e impedir mistura acidental entre usuario, criadora,
-- agencia e admin.

alter table public.users
  add column if not exists operational_channel text,
  add column if not exists signup_channel text,
  add column if not exists role_locked_at timestamptz,
  add column if not exists role_locked_reason text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_operational_channel_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_operational_channel_check
      check (
        operational_channel is null
        or operational_channel in ('user', 'creator', 'agency', 'admin')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_signup_channel_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_signup_channel_check
      check (
        signup_channel is null
        or signup_channel in ('user', 'creator', 'agency', 'admin')
      );
  end if;
end $$;

-- Admins sem conflito operacional.
update public.users u
set operational_channel = coalesce(u.operational_channel, 'admin'),
    signup_channel = coalesce(u.signup_channel, 'admin'),
    role_locked_at = coalesce(u.role_locked_at, now()),
    role_locked_reason = coalesce(u.role_locked_reason, 'backfill_admin')
where u.role = 'admin'::public.user_role
  and u.operational_channel is null
  and not exists (
    select 1 from public.creators c where c.user_id = u.id
  )
  and not exists (
    select 1
    from public.agency_users au
    where au.user_id = u.id
      and au.active is true
  );

-- Criadoras existentes sem vinculo ativo como agencia.
update public.users u
set operational_channel = coalesce(u.operational_channel, 'creator'),
    signup_channel = coalesce(u.signup_channel, 'creator'),
    role_locked_at = coalesce(u.role_locked_at, now()),
    role_locked_reason = coalesce(
      u.role_locked_reason,
      case
        when exists (
          select 1
          from public.creators c2
          where c2.user_id = u.id
            and (c2.verified is true or c2.active is true)
        ) then 'backfill_creator'
        else 'backfill_creator_pending_review'
      end
    )
where u.role <> 'admin'::public.user_role
  and u.operational_channel is null
  and exists (
    select 1 from public.creators c where c.user_id = u.id
  )
  and not exists (
    select 1
    from public.agency_users au
    where au.user_id = u.id
      and au.active is true
  );

-- Usuarios de agencia existentes sem creator conflitante.
update public.users u
set operational_channel = coalesce(u.operational_channel, 'agency'),
    signup_channel = coalesce(u.signup_channel, 'agency'),
    role_locked_at = coalesce(u.role_locked_at, now()),
    role_locked_reason = coalesce(u.role_locked_reason, 'backfill_agency')
where u.role <> 'admin'::public.user_role
  and u.operational_channel is null
  and not exists (
    select 1 from public.creators c where c.user_id = u.id
  )
  and exists (
    select 1
    from public.agency_users au
    where au.user_id = u.id
      and au.active is true
  );

-- Consumidores comuns sem creator/agencia/admin.
update public.users u
set operational_channel = coalesce(u.operational_channel, 'user'),
    signup_channel = coalesce(u.signup_channel, 'user'),
    role_locked_at = coalesce(u.role_locked_at, now()),
    role_locked_reason = coalesce(u.role_locked_reason, 'backfill_user')
where u.role = 'user'::public.user_role
  and u.operational_channel is null
  and not exists (
    select 1 from public.creators c where c.user_id = u.id
  )
  and not exists (
    select 1
    from public.agency_users au
    where au.user_id = u.id
      and au.active is true
  )
  and not exists (
    select 1
    from public.agencies a
    where lower(trim(a.email)) = lower(trim(u.email))
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_signup_channel text;
begin
  v_signup_channel := lower(nullif(trim(coalesce(new.raw_user_meta_data->>'signup_channel', '')), ''));

  if v_signup_channel not in ('user', 'creator', 'agency') then
    v_signup_channel := 'user';
  end if;

  insert into public.users (
    id,
    email,
    role,
    signup_channel,
    operational_channel,
    role_locked_at,
    role_locked_reason
  )
  values (
    new.id,
    new.email,
    'user',
    v_signup_channel,
    v_signup_channel,
    now(),
    'signup_' || v_signup_channel
  )
  on conflict (id) do update
  set email = excluded.email,
      signup_channel = coalesce(public.users.signup_channel, excluded.signup_channel),
      operational_channel = coalesce(public.users.operational_channel, excluded.operational_channel),
      role_locked_at = coalesce(public.users.role_locked_at, excluded.role_locked_at),
      role_locked_reason = coalesce(public.users.role_locked_reason, excluded.role_locked_reason);

  return new;
end;
$$;

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
  v_operational_channel text;
  v_signup_channel text;
  v_creator record;
  v_verification record;
  v_confirmed_role public.user_role;
  v_confirmed_channel text;
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

  select role, operational_channel, signup_channel
    into v_user_role, v_operational_channel, v_signup_channel
  from public.users
  where id = p_user_id
  for update;

  if not found then
    if p_email is null then
      raise exception 'email is required for user profile creation';
    end if;

    insert into public.users (
      id,
      email,
      role,
      signup_channel,
      operational_channel,
      role_locked_at,
      role_locked_reason
    )
    values (
      p_user_id,
      p_email,
      'user'::public.user_role,
      'creator',
      'creator',
      now(),
      'creator_onboarding_missing_public_user'
    )
    returning role, operational_channel, signup_channel
      into v_user_role, v_operational_channel, v_signup_channel;
  end if;

  if v_user_role = 'admin'::public.user_role or v_operational_channel = 'admin' then
    raise exception 'admin account cannot become creator through onboarding';
  end if;

  if v_operational_channel is null and v_signup_channel = 'creator' then
    update public.users
    set operational_channel = 'creator',
        role_locked_at = coalesce(role_locked_at, now()),
        role_locked_reason = coalesce(role_locked_reason, 'creator_onboarding_channel_recovery')
    where id = p_user_id
    returning operational_channel into v_operational_channel;
  end if;

  if coalesce(v_operational_channel, '') <> 'creator' then
    raise exception 'account operational channel is not creator';
  end if;

  if v_user_role not in ('user'::public.user_role, 'creator'::public.user_role) then
    raise exception 'account role is not allowed for creator onboarding';
  end if;

  if exists (
    select 1
    from public.agency_users au
    where au.user_id = p_user_id
      and au.active is true
  ) then
    raise exception 'account has active agency link';
  end if;

  if p_email is not null and exists (
    select 1
    from public.agencies a
    where lower(trim(a.email)) = lower(trim(p_email))
  ) then
    raise exception 'account email belongs to agency';
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
  set role = 'creator'::public.user_role,
      operational_channel = 'creator',
      signup_channel = coalesce(signup_channel, 'creator'),
      role_locked_at = coalesce(role_locked_at, now()),
      role_locked_reason = coalesce(role_locked_reason, 'creator_onboarding_submit')
  where id = p_user_id
  returning role, operational_channel
    into v_confirmed_role, v_confirmed_channel;

  if v_confirmed_role <> 'creator'::public.user_role or v_confirmed_channel <> 'creator' then
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
    'operational_channel', v_confirmed_channel,
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
