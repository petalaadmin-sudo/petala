-- Refines consumer classification to ignore inactive historical agency links.

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
        and au.active is true
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

revoke all on function public.admin_list_consumer_users(integer, integer, text) from public;
revoke all on function public.admin_list_consumer_users(integer, integer, text) from anon;
revoke all on function public.admin_list_consumer_users(integer, integer, text) from authenticated;
grant execute on function public.admin_list_consumer_users(integer, integer, text) to service_role;
