-- Schedule server-side cleanup of abandoned chat/video sessions.
-- Uses Supabase pg_cron directly instead of Vercel Cron, keeping the
-- timeout close to the database function that owns the financial rules.

create extension if not exists pg_cron with schema extensions;

select cron.unschedule('expire-stale-chat-sessions')
where exists (
  select 1
  from cron.job
  where jobname = 'expire-stale-chat-sessions'
);

select cron.schedule(
  'expire-stale-chat-sessions',
  '* * * * *',
  $$select public.expire_stale_chat_sessions(90);$$
);
