-- Canonical admin account classification RPCs.
-- Keeps account list rules in SQL instead of duplicating filters in admin pages.

create or replace function public.admin_list_consumer_users(
  p_limit integer default 100,
  p_offset integer default 0,
  p_search text default null
)
returns table (
  id uuid,
  email text,
  username text,
  role text,
  balance_petals integer,
  vip_until timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with params as (
    select
      least(greatest(coalesce(p_limit, 100), 1), 500)::integer as safe_limit,
      greatest(coalesce(p_offset, 0), 0)::integer as safe_offset,
      nullif(trim(p_search), '') as search_term
  )
  select
    u.id,
    u.email,
    u.username,
    u.role::text as role,
    u.balance_petals,
    u.vip_until,
    u.created_at
  from public.users u
  cross join params p
  where u.role = 'user'::public.user_role
    and not exists (
      select 1
      from public.creators c
      where c.user_id = u.id
    )
    and not exists (
      select 1
      from public.agency_users au
      where au.user_id = u.id
    )
    and not exists (
      select 1
      from public.agencies a
      where lower(trim(a.email)) = lower(trim(u.email))
    )
    and (
      p.search_term is null
      or u.email ilike '%' || p.search_term || '%'
      or coalesce(u.username, '') ilike '%' || p.search_term || '%'
    )
  order by u.created_at desc
  limit (select safe_limit from params)
  offset (select safe_offset from params);
$$;

create or replace function public.admin_list_creators(
  p_limit integer default 100,
  p_offset integer default 0,
  p_status text default 'all',
  p_search text default null
)
returns table (
  creator_id uuid,
  user_id uuid,
  email text,
  username text,
  user_role text,
  creator_name text,
  verified boolean,
  active boolean,
  price_text_petals integer,
  price_video_petals integer,
  rating numeric,
  rating_count integer,
  total_gifts integer,
  total_earnings_petals integer,
  agency_id uuid,
  agency_name text,
  created_at timestamptz,
  updated_at timestamptz,
  role_mismatch boolean,
  status_label text
)
language sql
security definer
set search_path = public
as $$
  with params as (
    select
      least(greatest(coalesce(p_limit, 100), 1), 500)::integer as safe_limit,
      greatest(coalesce(p_offset, 0), 0)::integer as safe_offset,
      lower(coalesce(nullif(trim(p_status), ''), 'all')) as status_filter,
      nullif(trim(p_search), '') as search_term
  ),
  classified as (
    select
      c.id as creator_id,
      c.user_id,
      u.email,
      u.username,
      u.role::text as user_role,
      c.name as creator_name,
      c.verified,
      c.active,
      c.price_text_petals,
      c.price_video_petals,
      c.rating,
      c.rating_count,
      c.total_gifts,
      c.total_earnings_petals,
      c.agency_id,
      a.name as agency_name,
      c.created_at,
      c.updated_at,
      (coalesce(u.role::text, '') <> 'creator') as role_mismatch,
      case
        when u.id is null then 'missing_user'
        when coalesce(u.role::text, '') <> 'creator' then 'role_mismatch'
        when c.active is not true then 'inactive'
        when c.verified is true and c.active is true then 'active_verified'
        when c.verified is not true then 'pending_verification'
        else 'active'
      end as status_label
    from public.creators c
    left join public.users u on u.id = c.user_id
    left join public.agencies a on a.id = c.agency_id
  )
  select
    c.creator_id,
    c.user_id,
    c.email,
    c.username,
    c.user_role,
    c.creator_name,
    c.verified,
    c.active,
    c.price_text_petals,
    c.price_video_petals,
    c.rating,
    c.rating_count,
    c.total_gifts,
    c.total_earnings_petals,
    c.agency_id,
    c.agency_name,
    c.created_at,
    c.updated_at,
    c.role_mismatch,
    c.status_label
  from classified c
  cross join params p
  where (
      p.status_filter = 'all'
      or (p.status_filter = 'active' and c.active is true)
      or (p.status_filter = 'inactive' and c.active is not true)
      or (p.status_filter = 'verified' and c.verified is true)
      or (p.status_filter = 'unverified' and c.verified is not true)
      or (p.status_filter = 'role_mismatch' and c.role_mismatch is true)
    )
    and (
      p.search_term is null
      or c.creator_name ilike '%' || p.search_term || '%'
      or coalesce(c.email, '') ilike '%' || p.search_term || '%'
      or coalesce(c.username, '') ilike '%' || p.search_term || '%'
      or coalesce(c.agency_name, '') ilike '%' || p.search_term || '%'
    )
  order by c.created_at desc
  limit (select safe_limit from params)
  offset (select safe_offset from params);
$$;

create or replace function public.admin_list_agencies(
  p_limit integer default 100,
  p_offset integer default 0,
  p_status text default 'all',
  p_search text default null
)
returns table (
  agency_id uuid,
  name text,
  responsible_name text,
  email text,
  whatsapp text,
  telegram text,
  country text,
  payment_method text,
  commission_percent numeric,
  active boolean,
  approved_at timestamptz,
  invite_code text,
  created_at timestamptz,
  updated_at timestamptz,
  users_count bigint,
  active_users_count bigint,
  creators_count bigint,
  active_creators_count bigint
)
language sql
security definer
set search_path = public
as $$
  with params as (
    select
      least(greatest(coalesce(p_limit, 100), 1), 500)::integer as safe_limit,
      greatest(coalesce(p_offset, 0), 0)::integer as safe_offset,
      lower(coalesce(nullif(trim(p_status), ''), 'all')) as status_filter,
      nullif(trim(p_search), '') as search_term
  )
  select
    a.id as agency_id,
    a.name,
    a.responsible_name,
    a.email,
    a.whatsapp,
    a.telegram,
    a.country,
    a.payment_method,
    a.commission_percent,
    a.active,
    a.approved_at,
    a.invite_code,
    a.created_at,
    a.updated_at,
    coalesce(au.users_count, 0)::bigint as users_count,
    coalesce(au.active_users_count, 0)::bigint as active_users_count,
    coalesce(cr.creators_count, 0)::bigint as creators_count,
    coalesce(cr.active_creators_count, 0)::bigint as active_creators_count
  from public.agencies a
  cross join params p
  left join lateral (
    select
      count(*)::bigint as users_count,
      count(*) filter (where active is true)::bigint as active_users_count
    from public.agency_users au
    where au.agency_id = a.id
  ) au on true
  left join lateral (
    select
      count(*)::bigint as creators_count,
      count(*) filter (where active is true)::bigint as active_creators_count
    from public.creators c
    where c.agency_id = a.id
  ) cr on true
  where (
      p.status_filter = 'all'
      or (p.status_filter = 'active' and a.active is true)
      or (p.status_filter = 'inactive' and a.active is not true)
      or (p.status_filter = 'approved' and a.approved_at is not null)
      or (p.status_filter = 'pending' and a.approved_at is null)
    )
    and (
      p.search_term is null
      or a.name ilike '%' || p.search_term || '%'
      or coalesce(a.responsible_name, '') ilike '%' || p.search_term || '%'
      or coalesce(a.email, '') ilike '%' || p.search_term || '%'
      or coalesce(a.whatsapp, '') ilike '%' || p.search_term || '%'
      or coalesce(a.telegram, '') ilike '%' || p.search_term || '%'
      or coalesce(a.country, '') ilike '%' || p.search_term || '%'
      or coalesce(a.invite_code, '') ilike '%' || p.search_term || '%'
    )
  order by a.created_at desc
  limit (select safe_limit from params)
  offset (select safe_offset from params);
$$;

create or replace function public.admin_list_account_anomalies()
returns table (
  anomaly_type text,
  severity text,
  entity_type text,
  entity_id uuid,
  user_id uuid,
  email text,
  description text,
  metadata jsonb
)
language sql
security definer
set search_path = public
as $$
  select *
  from (
  select
    'creator_user_role_mismatch'::text as anomaly_type,
    'warning'::text as severity,
    'creator'::text as entity_type,
    c.id as entity_id,
    c.user_id,
    u.email,
    'Creator record is linked to a user whose role is not creator.'::text as description,
    jsonb_build_object(
      'creator_name', c.name,
      'user_role', u.role::text,
      'active', c.active,
      'verified', c.verified
    ) as metadata
  from public.creators c
  join public.users u on u.id = c.user_id
  where coalesce(u.role::text, '') <> 'creator'

  union all

  select
    'agency_user_role_unexpected'::text,
    'warning'::text,
    'agency_user'::text,
    au.id,
    au.user_id,
    u.email,
    'Agency user is linked to a public user whose role is not user.'::text,
    jsonb_build_object(
      'agency_id', au.agency_id,
      'agency_user_role', au.role,
      'user_role', u.role::text,
      'active', au.active
    )
  from public.agency_users au
  join public.users u on u.id = au.user_id
  where coalesce(u.role::text, '') <> 'user'

  union all

  select
    'user_email_matches_agency_email'::text,
    'warning'::text,
    'user'::text,
    u.id,
    u.id,
    u.email,
    'User has role user, but the email also belongs to an agency.'::text,
    jsonb_build_object(
      'agency_id', a.id,
      'agency_name', a.name,
      'agency_active', a.active
    )
  from public.users u
  join public.agencies a
    on lower(trim(a.email)) = lower(trim(u.email))
  where u.role = 'user'::public.user_role

  union all

  select
    'creator_missing_user'::text,
    'critical'::text,
    'creator'::text,
    c.id,
    c.user_id,
    null::text,
    'Creator record references a missing public user.'::text,
    jsonb_build_object(
      'creator_name', c.name,
      'active', c.active,
      'verified', c.verified
    )
  from public.creators c
  left join public.users u on u.id = c.user_id
  where u.id is null

  union all

  select
    'agency_user_missing_agency'::text,
    'critical'::text,
    'agency_user'::text,
    au.id,
    au.user_id,
    u.email,
    'Agency user record references a missing agency.'::text,
    jsonb_build_object(
      'agency_id', au.agency_id,
      'agency_user_role', au.role,
      'active', au.active
    )
  from public.agency_users au
  left join public.agencies a on a.id = au.agency_id
  left join public.users u on u.id = au.user_id
  where a.id is null

  union all

  select
    'agency_without_active_responsible_user'::text,
    'warning'::text,
    'agency'::text,
    a.id,
    null::uuid,
    a.email,
    'Agency has no active agency_users record.'::text,
    jsonb_build_object(
      'agency_name', a.name,
      'active', a.active,
      'approved_at', a.approved_at
    )
  from public.agencies a
  where not exists (
    select 1
    from public.agency_users au
    where au.agency_id = a.id
      and au.active is true
  )

  union all

  select
    'creator_active_unverified'::text,
    'critical'::text,
    'creator'::text,
    c.id,
    c.user_id,
    u.email,
    'Creator is active but not verified.'::text,
    jsonb_build_object(
      'creator_name', c.name,
      'active', c.active,
      'verified', c.verified
    )
  from public.creators c
  left join public.users u on u.id = c.user_id
  where c.active is true
    and c.verified is not true
  ) anomalies
  order by
    case anomalies.severity
      when 'critical' then 1
      when 'warning' then 2
      else 3
    end,
    anomalies.anomaly_type,
    anomalies.email nulls last;
$$;

revoke all on function public.admin_list_consumer_users(integer, integer, text) from public;
revoke all on function public.admin_list_consumer_users(integer, integer, text) from anon;
revoke all on function public.admin_list_consumer_users(integer, integer, text) from authenticated;
grant execute on function public.admin_list_consumer_users(integer, integer, text) to service_role;

revoke all on function public.admin_list_creators(integer, integer, text, text) from public;
revoke all on function public.admin_list_creators(integer, integer, text, text) from anon;
revoke all on function public.admin_list_creators(integer, integer, text, text) from authenticated;
grant execute on function public.admin_list_creators(integer, integer, text, text) to service_role;

revoke all on function public.admin_list_agencies(integer, integer, text, text) from public;
revoke all on function public.admin_list_agencies(integer, integer, text, text) from anon;
revoke all on function public.admin_list_agencies(integer, integer, text, text) from authenticated;
grant execute on function public.admin_list_agencies(integer, integer, text, text) to service_role;

revoke all on function public.admin_list_account_anomalies() from public;
revoke all on function public.admin_list_account_anomalies() from anon;
revoke all on function public.admin_list_account_anomalies() from authenticated;
grant execute on function public.admin_list_account_anomalies() to service_role;
