import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json().catch(() => null)

    if (typeof body?.online !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Campo online deve ser booleano', code: 'INVALID_ONLINE_VALUE' },
        { status: 400 }
      )
    }

    const admin = createAdminClient() as any

    const { data: creator, error: creatorError } = await admin
      .from('creators')
      .select('id, verified, active')
      .eq('user_id', auth.user.id)
      .maybeSingle()

    if (creatorError) {
      console.error('[/api/criadora/presenca] creator lookup', creatorError)
      return NextResponse.json(
        { success: false, error: 'Erro ao validar criadora', code: 'CREATOR_LOOKUP_FAILED' },
        { status: 500 }
      )
    }

    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Perfil de criadora nao encontrado', code: 'CREATOR_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (!creator.verified || !creator.active) {
      return NextResponse.json(
        { success: false, error: 'Criadora ainda nao esta habilitada', code: 'CREATOR_NOT_ACTIVE' },
        { status: 403 }
      )
    }

    const now = new Date().toISOString()

    const { data: updatedPresence, error: updateError } = await admin
      .from('creator_presence')
      .update({
        online: body.online,
        last_seen_at: now,
      })
      .eq('creator_id', creator.id)
      .select('creator_id, online, last_seen_at')
      .maybeSingle()

    if (updateError) {
      console.error('[/api/criadora/presenca] update presence', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar presenca', code: 'PRESENCE_UPDATE_FAILED' },
        { status: 500 }
      )
    }

    if (updatedPresence) {
      return NextResponse.json({
        success: true,
        creator_id: updatedPresence.creator_id,
        online: updatedPresence.online,
        last_seen_at: updatedPresence.last_seen_at,
      })
    }

    const { data: insertedPresence, error: insertError } = await admin
      .from('creator_presence')
      .insert({
        creator_id: creator.id,
        online: body.online,
        last_seen_at: now,
        in_session: false,
      })
      .select('creator_id, online, last_seen_at')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        const { data: retriedPresence, error: retryError } = await admin
          .from('creator_presence')
          .update({
            online: body.online,
            last_seen_at: now,
          })
          .eq('creator_id', creator.id)
          .select('creator_id, online, last_seen_at')
          .single()

        if (!retryError && retriedPresence) {
          return NextResponse.json({
            success: true,
            creator_id: retriedPresence.creator_id,
            online: retriedPresence.online,
            last_seen_at: retriedPresence.last_seen_at,
          })
        }

        console.error('[/api/criadora/presenca] retry presence update', retryError)
      }

      console.error('[/api/criadora/presenca] insert presence', insertError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar presenca', code: 'PRESENCE_INSERT_FAILED' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      creator_id: insertedPresence.creator_id,
      online: insertedPresence.online,
      last_seen_at: insertedPresence.last_seen_at,
    })
  } catch (err) {
    console.error('[/api/criadora/presenca]', err)
    return NextResponse.json(
      { success: false, error: 'Erro interno', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
