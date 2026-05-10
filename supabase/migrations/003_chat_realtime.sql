-- supabase/migrations/003_chat_realtime.sql

-- ============================================================
-- MENSAGENS DO CHAT
-- ============================================================
create table public.chat_messages (
  id            uuid primary key default uuid_generate_v4(),
  session_id    uuid not null references public.chat_sessions(id) on delete cascade,
  sender_id     uuid not null references public.users(id),
  sender_role   text not null check (sender_role in ('user', 'creator')),
  content       text not null check (length(content) between 1 and 2000),
  type          text not null default 'text' check (type in ('text', 'gift', 'system')),
  -- se type = 'gift', guarda o emoji e o valor
  gift_emoji    text,
  gift_petals   integer,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- Índice para buscar mensagens de uma sessão em ordem
create index idx_messages_session on public.chat_messages(session_id, created_at asc);

-- ============================================================
-- PRESENÇA ONLINE DAS CRIADORAS
-- (atualizada via heartbeat a cada 30s pelo cliente)
-- ============================================================
create table public.creator_presence (
  creator_id    uuid primary key references public.creators(id) on delete cascade,
  online        boolean not null default false,
  last_seen_at  timestamptz not null default now(),
  in_session    boolean not null default false  -- ocupada em sessão?
);

-- Insere presença quando criadora é criada
create or replace function public.handle_new_creator()
returns trigger language plpgsql security definer as $$
begin
  insert into public.creator_presence (creator_id, online, in_session)
  values (new.id, false, false)
  on conflict (creator_id) do nothing;
  return new;
end;
$$;

create trigger on_creator_created
  after insert on public.creators
  for each row execute procedure public.handle_new_creator();

-- ============================================================
-- FUNÇÃO: cobrar pétalas por minuto de chat
-- Chamada pelo frontend a cada minuto enquanto sessão ativa
-- ============================================================
create or replace function public.charge_chat_minute(
  p_session_id  uuid,
  p_user_id     uuid
) returns jsonb language plpgsql security definer as $$
declare
  v_session     record;
  v_price       integer;
  v_spend_result jsonb;
begin
  -- Busca a sessão e valida que pertence ao usuário
  select cs.*, c.price_text_petals, c.price_video_petals
  into v_session
  from public.chat_sessions cs
  join public.creators c on c.id = cs.creator_id
  where cs.id = p_session_id
    and cs.user_id = p_user_id
    and cs.ended_at is null;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Sessão inválida ou encerrada');
  end if;

  v_price := case v_session.type
    when 'video' then v_session.price_video_petals
    else              v_session.price_text_petals
  end;

  -- Débita pétalas do usuário
  v_spend_result := public.spend_petals(
    p_user_id, v_price, 'spend', p_session_id
  );

  if not (v_spend_result->>'success')::boolean then
    -- Saldo insuficiente — encerra sessão automaticamente
    update public.chat_sessions
    set ended_at = now(),
        duration_seconds = extract(epoch from now() - started_at)::integer
    where id = p_session_id;

    return jsonb_build_object(
      'success', false,
      'error', 'Saldo insuficiente',
      'session_ended', true
    );
  end if;

  -- Atualiza total cobrado na sessão
  update public.chat_sessions
  set petals_charged = petals_charged + v_price
  where id = p_session_id;

  -- Credita 70% para a criadora
  declare
    v_creator_user_id uuid;
    v_creator_earn    integer := floor(v_price * 0.7);
  begin
    select user_id into v_creator_user_id
    from public.creators where id = v_session.creator_id;

    perform public.credit_petals(
      v_creator_user_id, v_creator_earn, 'gift_received', p_session_id
    );
  end;

  return jsonb_build_object(
    'success', true,
    'petals_charged', v_price,
    'new_balance', (v_spend_result->>'new_balance')::integer
  );
end;
$$;

-- ============================================================
-- HABILITA REALTIME nas tabelas necessárias
-- Execute no Supabase Dashboard → Database → Replication
-- ou via SQL:
-- ============================================================

-- Mensagens: usuário e criadora recebem novas mensagens em tempo real
alter publication supabase_realtime add table public.chat_messages;

-- Presença: feed mostra quem está online
alter publication supabase_realtime add table public.creator_presence;

-- Sessões: usuário detecta quando criadora encerra sessão
alter publication supabase_realtime add table public.chat_sessions;

-- ============================================================
-- RLS para mensagens
-- ============================================================
alter table public.chat_messages enable row level security;
alter table public.creator_presence enable row level security;

-- Usuário vê mensagens das próprias sessões
create policy "messages_select_participant" on public.chat_messages
  for select using (
    session_id in (
      select id from public.chat_sessions
      where user_id = auth.uid()
         or creator_id in (select id from public.creators where user_id = auth.uid())
    )
  );

create policy "messages_insert_participant" on public.chat_messages
  for insert with check (
    sender_id = auth.uid() and
    session_id in (
      select id from public.chat_sessions
      where user_id = auth.uid()
         or creator_id in (select id from public.creators where user_id = auth.uid())
    )
  );

-- Presença: qualquer autenticado pode ver
create policy "presence_select_auth" on public.creator_presence
  for select using (auth.uid() is not null);

-- Criadora atualiza a própria presença
create policy "presence_update_own" on public.creator_presence
  for update using (
    creator_id in (select id from public.creators where user_id = auth.uid())
  );
