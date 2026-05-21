-- Formaliza o vinculo final entre creators aprovadas e agencias.
-- O preenchimento acontece somente no fluxo admin de aprovacao da creator.

alter table public.creators
  add column if not exists agency_id uuid references public.agencies(id);

create index if not exists idx_creators_agency_id
  on public.creators (agency_id);
