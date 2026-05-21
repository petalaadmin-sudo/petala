import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type InviteStatus = 'onboarding_started' | 'pending_verification'

type InvitePayload = {
  invite_code?: unknown
  status?: unknown
  creator_id?: unknown
}

type AgencyInvite = {
  id: string
  invite_code: string
}

type ExistingInvite = {
  id: string
  agency_id: string
  invite_code: string
  user_id: string
  creator_id: string | null
  status: string | null
  accepted_at: string | null
}

const INVITE_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ACTIVE_STATUSES = ['signed_up', 'onboarding_started', 'pending_verification', 'verified']
const ALLOWED_STATUSES = new Set<InviteStatus>(['onboarding_started', 'pending_verification'])
const ACTIVE_USER_INDEX = 'idx_agency_creator_invites_active_user_unique'
const AGENCY_USER_INDEX = 'idx_agency_creator_invites_agency_user_unique'
const ACTIVE_INVITE_ERROR = 'Este usuário já possui um convite ativo de outra agência.'
const CREATOR_ID_CONFLICT_ERROR = 'Este convite ja esta vinculado a outra creator.'

const asText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const isDuplicateError = (error: { code?: string } | null | undefined) => error?.code === '23505'

const errorText = (error: { message?: string; details?: string; hint?: string } | null | undefined) =>
  [error?.message, error?.details, error?.hint].filter(Boolean).join(' ')

const isActiveUserConflict = (error: { message?: string; details?: string; hint?: string } | null | undefined) =>
  errorText(error).includes(ACTIVE_USER_INDEX)

const isAgencyUserConflict = (error: { message?: string; details?: string; hint?: string } | null | undefined) =>
  errorText(error).includes(AGENCY_USER_INDEX)

const nextStatusFor = (currentStatus: string | null, requestedStatus: InviteStatus) => {
  if (currentStatus === 'verified' || currentStatus === 'rejected') {
    return currentStatus
  }

  if (requestedStatus === 'onboarding_started' && currentStatus === 'pending_verification') {
    return currentStatus
  }

  return requestedStatus
}

async function hasActiveInviteInAnotherAgency(admin: any, userId: string, agencyId: string) {
  const { data, error } = await admin
    .from('agency_creator_invites')
    .select('id')
    .eq('user_id', userId)
    .neq('agency_id', agencyId)
    .in('status', ACTIVE_STATUSES)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return Boolean(data)
}

async function updateExistingInvite(params: {
  admin: any
  existing: ExistingInvite
  code: string
  requestedStatus: InviteStatus
  creatorId: string | null
}) {
  const { admin, existing, code, requestedStatus, creatorId } = params
  const now = new Date().toISOString()
  const nextStatus = nextStatusFor(existing.status, requestedStatus)
  const updatePayload: Record<string, unknown> = {
    invite_code: code,
    status: nextStatus,
  }

  if (creatorId) {
    updatePayload.creator_id = existing.creator_id ?? creatorId
  }

  if (!existing.accepted_at && (nextStatus === 'onboarding_started' || nextStatus === 'pending_verification')) {
    updatePayload.accepted_at = now
  }

  const { data, error } = await admin
    .from('agency_creator_invites')
    .update(updatePayload)
    .eq('id', existing.id)
    .select('id, agency_id, invite_code, user_id, creator_id, status, accepted_at')
    .single()

  return { data, error }
}

async function getExistingInvite(admin: any, agencyId: string, userId: string) {
  return admin
    .from('agency_creator_invites')
    .select('id, agency_id, invite_code, user_id, creator_id, status, accepted_at')
    .eq('agency_id', agencyId)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return (auth as { ok: false; response: NextResponse }).response
    }

    let payload: InvitePayload

    try {
      payload = (await request.json()) as InvitePayload
    } catch {
      return NextResponse.json(
        { success: false, error: 'JSON invalido.' },
        { status: 400 }
      )
    }

    const code = asText(payload.invite_code).toUpperCase()
    const status = asText(payload.status) as InviteStatus
    const creatorId = asText(payload.creator_id) || null

    if (!INVITE_CODE_PATTERN.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Codigo de convite invalido.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { success: false, error: 'Status de convite invalido.' },
        { status: 400 }
      )
    }

    if (status === 'pending_verification' && !creatorId) {
      return NextResponse.json(
        { success: false, error: 'creator_id e obrigatorio para pending_verification.' },
        { status: 400 }
      )
    }

    if (creatorId && !UUID_PATTERN.test(creatorId)) {
      return NextResponse.json(
        { success: false, error: 'Creator invalida.' },
        { status: 400 }
      )
    }

    const admin = createAdminClient() as any

    const { data: agency, error: agencyError } = await admin
      .from('agencies')
      .select('id, invite_code')
      .eq('invite_code', code)
      .eq('active', true)
      .maybeSingle()

    if (agencyError) {
      console.error('[agencia/creator-invite/registrar] agencies', agencyError)
      return NextResponse.json(
        { success: false, error: 'Erro ao validar convite da agencia.' },
        { status: 500 }
      )
    }

    const activeAgency = agency as AgencyInvite | null

    if (!activeAgency) {
      return NextResponse.json(
        { success: false, error: 'Convite de agencia invalido ou inativo.' },
        { status: 404 }
      )
    }

    if (creatorId) {
      const { data: creator, error: creatorError } = await admin
        .from('creators')
        .select('id, user_id')
        .eq('id', creatorId)
        .maybeSingle()

      if (creatorError) {
        console.error('[agencia/creator-invite/registrar] creators', creatorError)
        return NextResponse.json(
          { success: false, error: 'Erro ao validar creator.' },
          { status: 500 }
        )
      }

      if (!creator) {
        return NextResponse.json(
          { success: false, error: 'Creator nao encontrada.' },
          { status: 404 }
        )
      }

      if (creator.user_id !== auth.user.id) {
        return NextResponse.json(
          { success: false, error: 'Creator nao pertence ao usuario autenticado.' },
          { status: 403 }
        )
      }
    }

    const { data: existingInvite, error: existingError } = await getExistingInvite(
      admin,
      activeAgency.id,
      auth.user.id
    )

    if (existingError) {
      console.error('[agencia/creator-invite/registrar] existing invite', existingError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar convite existente.' },
        { status: 500 }
      )
    }

    if (existingInvite) {
      const existing = existingInvite as ExistingInvite

      if (existing.creator_id && creatorId && existing.creator_id !== creatorId) {
        return NextResponse.json(
          { success: false, error: CREATOR_ID_CONFLICT_ERROR },
          { status: 409 }
        )
      }

      const nextStatus = nextStatusFor(existingInvite.status, status)

      if (ACTIVE_STATUSES.includes(nextStatus)) {
        const hasOtherActiveInvite = await hasActiveInviteInAnotherAgency(
          admin,
          auth.user.id,
          activeAgency.id
        )

        if (hasOtherActiveInvite) {
          return NextResponse.json(
            { success: false, error: ACTIVE_INVITE_ERROR },
            { status: 409 }
          )
        }
      }

      const { data, error } = await updateExistingInvite({
        admin,
        existing,
        code,
        requestedStatus: status,
        creatorId,
      })

      if (error) {
        if (isDuplicateError(error) && isActiveUserConflict(error)) {
          return NextResponse.json(
            { success: false, error: ACTIVE_INVITE_ERROR },
            { status: 409 }
          )
        }

        console.error('[agencia/creator-invite/registrar] update invite', error)
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar convite da agencia.' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    }

    const hasOtherActiveInvite = await hasActiveInviteInAnotherAgency(
      admin,
      auth.user.id,
      activeAgency.id
    )

    if (hasOtherActiveInvite) {
      return NextResponse.json(
        { success: false, error: ACTIVE_INVITE_ERROR },
        { status: 409 }
      )
    }

    const insertPayload: Record<string, unknown> = {
      agency_id: activeAgency.id,
      invite_code: code,
      user_id: auth.user.id,
      status,
      accepted_at: new Date().toISOString(),
    }

    if (creatorId) {
      insertPayload.creator_id = creatorId
    }

    const { data: insertedInvite, error: insertError } = await admin
      .from('agency_creator_invites')
      .insert(insertPayload)
      .select('id, agency_id, invite_code, user_id, creator_id, status, accepted_at')
      .single()

    if (!insertError) {
      return NextResponse.json({ success: true, data: insertedInvite })
    }

    if (isDuplicateError(insertError)) {
      if (isActiveUserConflict(insertError)) {
        return NextResponse.json(
          { success: false, error: ACTIVE_INVITE_ERROR },
          { status: 409 }
        )
      }

      if (isAgencyUserConflict(insertError)) {
        const { data: racedInvite, error: racedError } = await getExistingInvite(
          admin,
          activeAgency.id,
          auth.user.id
        )

        if (racedError || !racedInvite) {
          console.error('[agencia/creator-invite/registrar] raced invite', racedError)
          return NextResponse.json(
            { success: false, error: 'Erro ao recuperar convite existente.' },
            { status: 500 }
          )
        }

        const existing = racedInvite as ExistingInvite

        if (existing.creator_id && creatorId && existing.creator_id !== creatorId) {
          return NextResponse.json(
            { success: false, error: CREATOR_ID_CONFLICT_ERROR },
            { status: 409 }
          )
        }

        const { data, error } = await updateExistingInvite({
          admin,
          existing,
          code,
          requestedStatus: status,
          creatorId,
        })

        if (error) {
          if (isDuplicateError(error) && isActiveUserConflict(error)) {
            return NextResponse.json(
              { success: false, error: ACTIVE_INVITE_ERROR },
              { status: 409 }
            )
          }

          console.error('[agencia/creator-invite/registrar] raced update', error)
          return NextResponse.json(
            { success: false, error: 'Erro ao atualizar convite existente.' },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true, data })
      }
    }

    console.error('[agencia/creator-invite/registrar] insert invite', insertError)
    return NextResponse.json(
      { success: false, error: 'Erro ao registrar convite da agencia.' },
      { status: 500 }
    )
  } catch (err) {
    console.error('[agencia/creator-invite/registrar]', err)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao registrar convite da agencia.' },
      { status: 500 }
    )
  }
}
