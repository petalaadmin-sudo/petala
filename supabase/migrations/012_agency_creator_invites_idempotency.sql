-- Garante idempotencia para registro de convites de creators por agencia.
-- Uma mesma agencia nao deve ter mais de um convite para o mesmo user_id.

create unique index if not exists idx_agency_creator_invites_agency_user_unique
  on public.agency_creator_invites (agency_id, user_id)
  where user_id is not null;

-- Uma mesma usuaria nao deve ficar em processo ativo por duas agencias ao mesmo tempo.
create unique index if not exists idx_agency_creator_invites_active_user_unique
  on public.agency_creator_invites (user_id)
  where user_id is not null
    and status in (
      'signed_up',
      'onboarding_started',
      'pending_verification',
      'verified'
    );
