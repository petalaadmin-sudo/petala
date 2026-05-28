-- Gift eligibility spend.
-- Replaces the legacy gift flow so gifts consume user_petal_lots through
-- spend_petals_with_eligibility and keep users.balance_petals reconciled.

alter table public.gifts
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null,
  add column if not exists message_id uuid references public.chat_messages(id) on delete set null,
  add column if not exists idempotency_key text,
  add column if not exists eligible_petals_spent integer not null default 0,
  add column if not exists non_eligible_petals_spent integer not null default 0,
  add column if not exists agency_eligible_petals_spent integer not null default 0,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists idx_gifts_idempotency_key_unique
  on public.gifts (idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_gifts_transaction_id
  on public.gifts (transaction_id)
  where transaction_id is not null;

create index if not exists idx_gifts_message_id
  on public.gifts (message_id)
  where message_id is not null;

drop function if exists public.send_gift(uuid, uuid, text, text, integer, uuid);

create or replace function public.send_gift(
  p_from_user uuid,
  p_to_creator uuid,
  p_gift_type text,
  p_gift_emoji text,
  p_petals integer,
  p_session_id uuid default null,
  p_idempotency_key text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_idempotency_key text := nullif(btrim(p_idempotency_key), '');
  v_gift_type text := nullif(btrim(p_gift_type), '');
  v_gift_emoji text := nullif(btrim(p_gift_emoji), '');
  v_session record;
  v_creator record;
  v_existing_gift record;
  v_spend_result jsonb;
  v_transaction_id uuid;
  v_gift_id uuid;
  v_message_id uuid;
  v_new_balance integer;
  v_eligible_spent integer := 0;
  v_non_eligible_spent integer := 0;
  v_agency_eligible_spent integer := 0;
  v_creator_earn integer := 0;
begin
  if p_from_user is null or p_to_creator is null then
    return jsonb_build_object('success', false, 'error', 'Usuario e creator obrigatorios', 'code', 'INVALID_PARTICIPANTS');
  end if;

  if p_session_id is null then
    return jsonb_build_object('success', false, 'error', 'session_id obrigatorio para gift', 'code', 'INVALID_SESSION');
  end if;

  if p_petals is null or p_petals <= 0 then
    return jsonb_build_object('success', false, 'error', 'Valor invalido', 'code', 'INVALID_AMOUNT');
  end if;

  if v_gift_type is null or v_gift_emoji is null then
    return jsonb_build_object('success', false, 'error', 'Gift invalido', 'code', 'INVALID_GIFT');
  end if;

  if v_idempotency_key is null then
    return jsonb_build_object('success', false, 'error', 'idempotency_key obrigatoria', 'code', 'INVALID_IDEMPOTENCY_KEY');
  end if;

  perform pg_advisory_xact_lock(hashtext(v_idempotency_key)::bigint);

  select
    g.*,
    t.balance_after as transaction_balance_after
  into v_existing_gift
  from public.gifts g
  left join public.transactions t on t.id = g.transaction_id
  where g.idempotency_key = v_idempotency_key
  for update of g;

  if found then
    if v_existing_gift.from_user_id = p_from_user
       and v_existing_gift.to_creator_id = p_to_creator
       and v_existing_gift.session_id is not distinct from p_session_id
       and v_existing_gift.gift_type = v_gift_type
       and v_existing_gift.gift_emoji = v_gift_emoji
       and v_existing_gift.petals_spent = p_petals then

      select u.balance_petals
      into v_new_balance
      from public.users u
      where u.id = p_from_user;

      return jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'gift_id', v_existing_gift.id,
        'message_id', v_existing_gift.message_id,
        'transaction_id', v_existing_gift.transaction_id,
        'new_balance', coalesce(v_existing_gift.transaction_balance_after, v_new_balance),
        'eligible_petals_spent', coalesce(v_existing_gift.eligible_petals_spent, 0),
        'non_eligible_petals_spent', coalesce(v_existing_gift.non_eligible_petals_spent, 0),
        'agency_eligible_petals_spent', coalesce(v_existing_gift.agency_eligible_petals_spent, 0),
        'creator_petals_earned', coalesce(v_existing_gift.creator_petals_earned, 0)
      );
    end if;

    return jsonb_build_object(
      'success', false,
      'error', 'idempotency_key ja usada com parametros diferentes',
      'code', 'IDEMPOTENCY_KEY_CONFLICT'
    );
  end if;

  select
    cs.id,
    cs.user_id,
    cs.creator_id,
    cs.type,
    cs.ended_at
  into v_session
  from public.chat_sessions cs
  where cs.id = p_session_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Sessao invalida', 'code', 'INVALID_SESSION');
  end if;

  if v_session.ended_at is not null then
    return jsonb_build_object('success', false, 'error', 'Sessao encerrada', 'code', 'SESSION_ENDED');
  end if;

  if v_session.user_id <> p_from_user then
    return jsonb_build_object('success', false, 'error', 'Usuario nao autorizado para esta sessao', 'code', 'UNAUTHORIZED');
  end if;

  if v_session.creator_id <> p_to_creator then
    return jsonb_build_object('success', false, 'error', 'Creator divergente da sessao', 'code', 'CREATOR_SESSION_MISMATCH');
  end if;

  select
    c.id,
    c.user_id,
    c.active
  into v_creator
  from public.creators c
  where c.id = p_to_creator;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Creator nao encontrada', 'code', 'CREATOR_NOT_FOUND');
  end if;

  v_spend_result := public.spend_petals_with_eligibility(
    p_user_id => p_from_user,
    p_amount => p_petals,
    p_type => 'gift_sent',
    p_source_type => 'gift',
    p_idempotency_key => v_idempotency_key,
    p_source_id => p_session_id::text,
    p_ref_id => p_session_id,
    p_metadata => jsonb_build_object(
      'source', 'gift',
      'source_type', 'gift',
      'session_id', p_session_id,
      'session_type', v_session.type,
      'creator_id', p_to_creator,
      'gift_type', v_gift_type,
      'gift_emoji', v_gift_emoji,
      'gift_petals', p_petals
    ),
    p_materialize_legacy => true
  );

  if not coalesce((v_spend_result->>'success')::boolean, false) then
    return jsonb_build_object(
      'success', false,
      'error', coalesce(v_spend_result->>'error', 'Falha ao enviar presente'),
      'code', coalesce(v_spend_result->>'code', 'GIFT_SPEND_FAILED'),
      'required', p_petals,
      'new_balance', nullif(v_spend_result->>'new_balance', '')::integer,
      'available_petals', nullif(v_spend_result->>'available_petals', '')::integer,
      'reconciliation', v_spend_result->'reconciliation'
    );
  end if;

  v_transaction_id := (v_spend_result->>'transaction_id')::uuid;
  v_new_balance := (v_spend_result->>'new_balance')::integer;
  v_eligible_spent := coalesce((v_spend_result->>'eligible_petals_spent')::integer, 0);
  v_non_eligible_spent := coalesce((v_spend_result->>'non_eligible_petals_spent')::integer, 0);
  v_agency_eligible_spent := coalesce((v_spend_result->>'agency_eligible_petals_spent')::integer, 0);
  v_creator_earn := floor(v_eligible_spent * 0.7)::integer;

  insert into public.gifts (
    from_user_id,
    to_creator_id,
    session_id,
    gift_type,
    gift_emoji,
    petals_spent,
    creator_petals_earned,
    transaction_id,
    idempotency_key,
    eligible_petals_spent,
    non_eligible_petals_spent,
    agency_eligible_petals_spent,
    metadata
  ) values (
    p_from_user,
    p_to_creator,
    p_session_id,
    v_gift_type,
    v_gift_emoji,
    p_petals,
    v_creator_earn,
    v_transaction_id,
    v_idempotency_key,
    v_eligible_spent,
    v_non_eligible_spent,
    v_agency_eligible_spent,
    jsonb_build_object(
      'source_type', 'gift',
      'session_id', p_session_id,
      'session_type', v_session.type,
      'transaction_id', v_transaction_id,
      'idempotency_key', v_idempotency_key,
      'creator_petals_earned_from_eligible_petals', true
    )
  )
  returning id into v_gift_id;

  insert into public.chat_messages (
    session_id,
    sender_id,
    sender_role,
    content,
    type,
    gift_emoji,
    gift_petals
  ) values (
    p_session_id,
    p_from_user,
    'user',
    'enviou um presente ' || v_gift_emoji,
    'gift',
    v_gift_emoji,
    p_petals
  )
  returning id into v_message_id;

  update public.gifts
  set message_id = v_message_id,
      metadata = metadata || jsonb_build_object('message_id', v_message_id)
  where id = v_gift_id;

  update public.creators
  set total_gifts = total_gifts + 1,
      total_earnings_petals = total_earnings_petals + v_creator_earn,
      updated_at = now()
  where id = p_to_creator;

  update public.transactions
  set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'gift_id', v_gift_id,
    'message_id', v_message_id,
    'creator_petals_earned', v_creator_earn,
    'eligible_petals_spent', v_eligible_spent,
    'non_eligible_petals_spent', v_non_eligible_spent,
    'agency_eligible_petals_spent', v_agency_eligible_spent
  )
  where id = v_transaction_id;

  return jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'gift_id', v_gift_id,
    'message_id', v_message_id,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'eligible_petals_spent', v_eligible_spent,
    'non_eligible_petals_spent', v_non_eligible_spent,
    'agency_eligible_petals_spent', v_agency_eligible_spent,
    'creator_petals_earned', v_creator_earn
  );
end;
$$;

revoke all on function public.send_gift(uuid, uuid, text, text, integer, uuid, text) from public;
revoke all on function public.send_gift(uuid, uuid, text, text, integer, uuid, text) from anon;
revoke all on function public.send_gift(uuid, uuid, text, text, integer, uuid, text) from authenticated;
grant execute on function public.send_gift(uuid, uuid, text, text, integer, uuid, text) to service_role;
