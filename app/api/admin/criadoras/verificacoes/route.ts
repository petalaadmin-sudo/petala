import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type VerificationAction = 'approve' | 'reject'

type VerificationActionBody = {
  verification_id?: unknown
  action?: unknown
  rejection_reason?: unknown
}

type CreatorVerification = {
  id: string
  creator_id: string
  user_id: string
  status: string | null
}

type CreatorRecord = {
  id: string
  user_id: string
  verified: boolean | null
  verified_at: string | null
  active: boolean | null
  agency_id: string | null
}

type AgencyCreatorInvite = {
  id: string
  agency_id: string
  verified_at: string | null
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ALLOWED_ACTIONS = new Set<VerificationAction>(['approve', 'reject'])

const asText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

async function getPendingInvite(admin: any, creator: CreatorRecord) {
  const { data, error } = await admin
    .from('agency_creator_invites')
    .select('id, agency_id, verified_at')
    .eq('creator_id', creator.id)
    .eq('user_id', creator.user_id)
    .eq('status', 'pending_verification')
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error('Falha ao buscar convite de agencia.')
  }

  return (data as AgencyCreatorInvite | null) ?? null
}

async function markInviteVerified(admin: any, invite: AgencyCreatorInvite, now: string) {
  const { error } = await admin
    .from('agency_creator_invites')
    .update({
      status: 'verified',
      verified_at: invite.verified_at ?? now,
    })
    .eq('id', invite.id)

  if (error) {
    throw new Error('Falha ao confirmar convite da agencia.')
  }
}

async function linkAgencyOnApproval(admin: any, creator: CreatorRecord, now: string) {
  const invite = await getPendingInvite(admin, creator)

  if (!invite) {
    return {
      agency_linked: Boolean(creator.agency_id),
      agency_link_reason: creator.agency_id ? 'creator_already_linked' : 'no_pending_invite',
    }
  }

  if (creator.agency_id) {
    if (creator.agency_id === invite.agency_id) {
      await markInviteVerified(admin, invite, now)

      return {
        agency_linked: true,
        agency_link_reason: 'creator_already_linked_to_invite_agency',
        agency_id: creator.agency_id,
        invite_id: invite.id,
      }
    }

    return {
      agency_linked: false,
      agency_link_reason: 'creator_already_linked_to_other_agency',
      agency_id: creator.agency_id,
      invite_id: invite.id,
    }
  }

  const { data: updatedCreator, error: linkError } = await admin
    .from('creators')
    .update({ agency_id: invite.agency_id })
    .eq('id', creator.id)
    .is('agency_id', null)
    .select('id, agency_id')
    .maybeSingle()

  if (linkError) {
    throw new Error('Falha ao vincular creator a agencia.')
  }

  if (!updatedCreator?.agency_id) {
    return {
      agency_linked: false,
      agency_link_reason: 'creator_link_changed_during_approval',
      invite_id: invite.id,
    }
  }

  await markInviteVerified(admin, invite, now)

  return {
    agency_linked: true,
    agency_link_reason: 'linked_from_pending_invite',
    agency_id: invite.agency_id,
    invite_id: invite.id,
  }
}

async function rejectPendingInvites(admin: any, creator: CreatorRecord, now: string) {
  const { data, error } = await admin
    .from('agency_creator_invites')
    .update({
      status: 'rejected',
      rejected_at: now,
    })
    .eq('creator_id', creator.id)
    .eq('user_id', creator.user_id)
    .eq('status', 'pending_verification')
    .select('id')

  if (error) {
    throw new Error('Falha ao rejeitar convite da agencia.')
  }

  return Array.isArray(data) ? data.length : 0
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)

  if (auth.ok === false) {
    return auth.response
  }

  let body: VerificationActionBody

  try {
    body = (await request.json()) as VerificationActionBody
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body invalido.' },
      { status: 400 }
    )
  }

  const verificationId = asText(body.verification_id)
  const action = asText(body.action) as VerificationAction
  const rejectionReason = asText(body.rejection_reason)

  if (!UUID_PATTERN.test(verificationId)) {
    return NextResponse.json(
      { success: false, error: 'verification_id invalido.' },
      { status: 400 }
    )
  }

  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json(
      { success: false, error: 'action invalida.' },
      { status: 400 }
    )
  }

  if (action === 'reject' && !rejectionReason) {
    return NextResponse.json(
      { success: false, error: 'rejection_reason obrigatorio para rejeicao.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient() as any
  const now = new Date().toISOString()

  try {
    const { data: verificationData, error: verificationError } = await admin
      .from('creator_verifications')
      .select('id, creator_id, user_id, status')
      .eq('id', verificationId)
      .maybeSingle()

    if (verificationError) {
      console.error('[admin/criadoras/verificacoes] creator_verifications', verificationError)

      return NextResponse.json(
        { success: false, error: 'Falha ao buscar verificacao.' },
        { status: 500 }
      )
    }

    if (!verificationData) {
      return NextResponse.json(
        { success: false, error: 'Verificacao nao encontrada.' },
        { status: 404 }
      )
    }

    const verification = verificationData as CreatorVerification

    const { data: creatorData, error: creatorError } = await admin
      .from('creators')
      .select('id, user_id, verified, verified_at, active, agency_id')
      .eq('id', verification.creator_id)
      .maybeSingle()

    if (creatorError) {
      console.error('[admin/criadoras/verificacoes] creators', creatorError)

      return NextResponse.json(
        { success: false, error: 'Falha ao buscar creator.' },
        { status: 500 }
      )
    }

    if (!creatorData) {
      return NextResponse.json(
        { success: false, error: 'Creator nao encontrada.' },
        { status: 404 }
      )
    }

    const creator = creatorData as CreatorRecord

    if (creator.user_id !== verification.user_id) {
      return NextResponse.json(
        { success: false, error: 'Verificacao nao pertence a creator informada.' },
        { status: 409 }
      )
    }

    if (action === 'approve') {
      if (verification.status === 'rejected') {
        return NextResponse.json(
          { success: false, error: 'Verificacao ja rejeitada.' },
          { status: 409 }
        )
      }

      const { error: creatorUpdateError } = await admin
        .from('creators')
        .update({
          verified: true,
          verified_at: creator.verified_at ?? now,
          active: true,
        })
        .eq('id', creator.id)

      if (creatorUpdateError) {
        console.error('[admin/criadoras/verificacoes] approve creator', creatorUpdateError)

        return NextResponse.json(
          { success: false, error: 'Falha ao aprovar creator.' },
          { status: 500 }
        )
      }

      const { error: verificationUpdateError } = await admin
        .from('creator_verifications')
        .update({
          status: 'approved',
          reviewed_at: now,
          reviewed_by: auth.user.id,
        })
        .eq('id', verification.id)

      if (verificationUpdateError) {
        console.error('[admin/criadoras/verificacoes] approve verification', verificationUpdateError)

        return NextResponse.json(
          { success: false, error: 'Falha ao atualizar verificacao.' },
          { status: 500 }
        )
      }

      const agencyLink = await linkAgencyOnApproval(admin, creator, now)

      return NextResponse.json({
        success: true,
        data: {
          creator_id: creator.id,
          status: 'approved',
          ...agencyLink,
        },
      })
    }

    if (verification.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'Verificacao ja aprovada.' },
        { status: 409 }
      )
    }

    const { error: creatorUpdateError } = await admin
      .from('creators')
      .update({
        verified: false,
        verified_at: null,
        active: false,
      })
      .eq('id', creator.id)

    if (creatorUpdateError) {
      console.error('[admin/criadoras/verificacoes] reject creator', creatorUpdateError)

      return NextResponse.json(
        { success: false, error: 'Falha ao manter creator rejeitada.' },
        { status: 500 }
      )
    }

    const { error: verificationUpdateError } = await admin
      .from('creator_verifications')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_at: now,
        reviewed_by: auth.user.id,
      })
      .eq('id', verification.id)

    if (verificationUpdateError) {
      console.error('[admin/criadoras/verificacoes] reject verification', verificationUpdateError)

      return NextResponse.json(
        { success: false, error: 'Falha ao rejeitar verificacao.' },
        { status: 500 }
      )
    }

    const rejectedInvitesCount = await rejectPendingInvites(admin, creator, now)

    return NextResponse.json({
      success: true,
      data: {
        creator_id: creator.id,
        status: 'rejected',
        agency_linked: false,
        rejected_invites_count: rejectedInvitesCount,
      },
    })
  } catch (error) {
    console.error('[admin/criadoras/verificacoes]', error)

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno ao revisar verificacao.' },
      { status: 500 }
    )
  }
}
