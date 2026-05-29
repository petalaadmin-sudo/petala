-- Restrict execution of financial payout SECURITY DEFINER functions.
-- These functions mutate payout state and must never be callable directly by
-- anon/authenticated clients. They are executed only by trusted server-side code
-- using the service_role key after application-level admin authorization.
--
-- This migration is intentionally tolerant of new/staging environments where
-- the legacy payout functions may not exist yet. When the full financial payout
-- objects are versioned, those functions must also be created with restricted
-- execution privileges from birth.

do $$
begin
  if to_regprocedure('public.update_payout_status(uuid, text, uuid, text, text)') is not null then
    revoke execute on function public.update_payout_status(uuid, text, uuid, text, text) from public;
    revoke execute on function public.update_payout_status(uuid, text, uuid, text, text) from anon, authenticated;
    grant execute on function public.update_payout_status(uuid, text, uuid, text, text) to service_role;
  end if;

  if to_regprocedure('public.approve_payout(uuid, uuid, text)') is not null then
    revoke execute on function public.approve_payout(uuid, uuid, text) from public;
    revoke execute on function public.approve_payout(uuid, uuid, text) from anon, authenticated;
    grant execute on function public.approve_payout(uuid, uuid, text) to service_role;
  end if;

  if to_regprocedure('public.mark_payout_paid(uuid, uuid, text)') is not null then
    revoke execute on function public.mark_payout_paid(uuid, uuid, text) from public;
    revoke execute on function public.mark_payout_paid(uuid, uuid, text) from anon, authenticated;
    grant execute on function public.mark_payout_paid(uuid, uuid, text) to service_role;
  end if;

  if to_regprocedure('public.reject_payout(uuid, uuid, text, text)') is not null then
    revoke execute on function public.reject_payout(uuid, uuid, text, text) from public;
    revoke execute on function public.reject_payout(uuid, uuid, text, text) from anon, authenticated;
    grant execute on function public.reject_payout(uuid, uuid, text, text) to service_role;
  end if;

  if to_regprocedure('public.block_payout(uuid, uuid, text, text)') is not null then
    revoke execute on function public.block_payout(uuid, uuid, text, text) from public;
    revoke execute on function public.block_payout(uuid, uuid, text, text) from anon, authenticated;
    grant execute on function public.block_payout(uuid, uuid, text, text) to service_role;
  end if;
end $$;
