-- Saneamento de dados demo/legado:
-- alinha public.users.role com public.creators para criadoras demo ativas e verificadas.
-- A migracao e idempotente e limitada aos emails listados abaixo.

with target_emails(email) as (
  values
    ('bella.demo@petala.app'),
    ('valen.demo@petala.app'),
    ('nina.demo@petala.app'),
    ('isabel.demo@petala.app'),
    ('maya.demo@petala.app'),
    ('luna.demo@petala.app'),
    ('sofia.demo@petala.app'),
    ('clara.demo@petala.app')
)
update public.users u
set role = 'creator'::public.user_role
from target_emails te
where lower(trim(u.email)) = te.email
  and u.role = 'user'::public.user_role
  and exists (
    select 1
    from public.creators c
    where c.user_id = u.id
      and c.active is true
      and c.verified is true
  );
