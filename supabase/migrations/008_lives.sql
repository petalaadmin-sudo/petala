-- Tabela de sessões de live
create table if not exists public.lives (
  id uuid default gen_random_uuid() primary key,
  criadora_id uuid references public.creators(id) on delete cascade,
  canal text not null unique,
  titulo text,
  ativa boolean default true,
  espectadores int default 0,
  iniciada_em timestamp with time zone default now(),
  encerrada_em timestamp with time zone
);

-- Índices
create index if not exists lives_criadora_id_idx on public.lives(criadora_id);
create index if not exists lives_ativa_idx on public.lives(ativa);

-- RLS
alter table public.lives enable row level security;

create policy "Lives visíveis para todos"
  on public.lives for select
  using (true);

create policy "Criadora gerencia sua live"
  on public.lives for all
  using (
    criadora_id in (
      select id from public.creators where user_id = auth.uid()
    )
  );