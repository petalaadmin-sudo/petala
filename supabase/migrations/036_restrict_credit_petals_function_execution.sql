-- Restrict public.credit_petals EXECUTE grants now that direct browser usage
-- has been removed from the age-confirmation flow.
--
-- public.credit_petals is a legacy financial mutation function. It may still be
-- invoked by server-side/service-role flows while those are migrated to
-- credit_petals_with_lot, but it must not be callable directly by anon or
-- authenticated clients.
--
-- This migration intentionally does not alter function bodies and does not touch
-- public.credit_petals_with_lot or any other legacy helper.

do $$
declare
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
      and p.proname = 'credit_petals'
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
