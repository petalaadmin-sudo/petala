import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/api-auth'
import {
  AgencyProvisioningError,
  provisionAgencyApplication,
  type AgencyApplicationForProvisioning,
} from '@/lib/agency/provisioning'
import { createAdminClient } from '@/lib/supabase/server'

type AgencyApplicationAction = 'approve' | 'reject' | 'block'

type AgencyApplicationActionBody = {
  application_id?: string
  action?: string
  review_notes?: string
}

const ACTION_STATUS: Record<AgencyApplicationAction, 'approved' | 'rejected' | 'blocked'> = {
  approve: 'approved',
  reject: 'rejected',
  block: 'blocked',
}

const ALLOWED_ACTIONS = Object.keys(ACTION_STATUS) as AgencyApplicationAction[]

const getPasswordSetupRedirectTo = (request: NextRequest) => {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const baseUrl = (configuredUrl || request.nextUrl.origin).replace(/\/+$/, '')

  return `${baseUrl}/auth/definir-senha`
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)

  if (auth.ok === false) {
    return auth.response
  }

  let body: AgencyApplicationActionBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body invalido' },
      { status: 400 }
    )
  }

  const applicationId = body.application_id?.trim()
  const action = body.action as AgencyApplicationAction
  const reviewNotes = body.review_notes?.trim() || null

  if (!applicationId) {
    return NextResponse.json(
      { success: false, error: 'application_id obrigatorio' },
      { status: 400 }
    )
  }

  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json(
      { success: false, error: 'action invalida' },
      { status: 400 }
    )
  }

  if ((action === 'reject' || action === 'block') && !reviewNotes) {
    return NextResponse.json(
      { success: false, error: 'review_notes obrigatorio' },
      { status: 400 }
    )
  }

  const admin = createAdminClient() as any

  const { data: application, error: applicationError } = await admin
    .from('agency_applications')
    .select('id, agency_name, responsible_name, email, whatsapp, country, notes, status')
    .eq('id', applicationId)
    .maybeSingle()

  if (applicationError) {
    console.error('[admin/agencias/applications]', applicationError)

    return NextResponse.json(
      { success: false, error: 'Falha ao buscar candidatura' },
      { status: 500 }
    )
  }

  if (!application) {
    return NextResponse.json(
      { success: false, error: 'Candidatura nao encontrada' },
      { status: 404 }
    )
  }

  if (application.status !== 'pending') {
    return NextResponse.json(
      { success: false, error: 'Candidatura ja revisada' },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()

  if (action === 'approve') {
    try {
      await provisionAgencyApplication({
        admin,
        application: application as AgencyApplicationForProvisioning,
        redirectTo: getPasswordSetupRedirectTo(request),
      })
    } catch (error) {
      console.error('[admin/agencias/applications] approve provisioning', error)

      const status = error instanceof AgencyProvisioningError ? error.status : 500
      const message = error instanceof Error ? error.message : 'Falha ao provisionar agencia'

      return NextResponse.json(
        { success: false, error: message },
        { status }
      )
    }
  }

  const { data: updated, error: updateError } = await admin
    .from('agency_applications')
    .update({
      status: ACTION_STATUS[action],
      review_notes: reviewNotes,
      reviewed_by: auth.user.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('id', applicationId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (updateError) {
    console.error('[admin/agencias/applications]', updateError)

    return NextResponse.json(
      { success: false, error: 'Falha ao revisar candidatura' },
      { status: 500 }
    )
  }

  if (!updated) {
    return NextResponse.json(
      { success: false, error: 'Candidatura ja revisada' },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true })
}
