-- Restrict legacy SECURITY DEFINER functions that should not be callable
-- directly by anon/authenticated clients.
--
-- These functions either mutate financial/session state or are legacy helpers
-- that are now invoked only from server-side/service-role flows or database
-- internals. Keep direct client execution closed; future replacements should
-- also be created with service_role-only EXECUTE grants.
--
-- Intentionally not included in this migration:
-- - public.credit_petals
-- - public.start_creator_presence_log
-- - public.end_creator_presence_log
--
-- Those functions still have browser/client callers today and need app changes
-- or stronger internal guards before their anon/authenticated grants can be
-- safely revoked.

do $$
declare
  v_function_names text[] := array[
    'spend_petals',
    'charge_chat_minute',
    'record_creator_earning',
    'record_creator_weekly_bonus',
    'request_creator_payout',
    'request_agency_payout',
    'pay_video_referral_commission',
    'on_first_purchase',
    'try_release_welcome_bonus',
    'register_referral',
    'reorder_photos',
    'increment_photo_unlock',
    'handle_new_user',
    'handle_new_creator',
    'handle_new_user_referral'
  ];
  v_function record;
  v_signature text;
begin
  for v_function in
    select
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as identity_arguments
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(v_function_names)
  loop
    v_signature := format(
      '%I.%I(%s)',
      v_function.schema_name,
      v_function.function_name,
      v_function.identity_arguments
    );

    execute format('revoke execute on function %s from public', v_signature);
    execute format('revoke execute on function %s from anon', v_signature);
    execute format('revoke execute on function %s from authenticated', v_signature);
    execute format('grant execute on function %s to service_role', v_signature);
  end loop;
end $$;
