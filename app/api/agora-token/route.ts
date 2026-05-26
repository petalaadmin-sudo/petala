import { NextRequest, NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-token'
import { getRequestIP, requireAuth } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/server'

const VIDEO_PRICE_PER_MINUTE = 120
const TOKEN_TTL_SECONDS = 15 * 60

function agoraUidFor(sessionId: string, userId: string, role: 'user' | 'creator') {
  const input = `${sessionId}:${userId}:${role}`
  let hash = 2166136261

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0) || 1
}

function channelNameForSession(sessionId: string) {
  return `video_session_${sessionId.replace(/-/g, '')}`
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const { session_id } = await req.json()

    if (!session_id) {
      return NextResponse.json({
        error: 'session_id obrigatorio',
        code: 'SESSION_ID_REQUIRED',
      }, { status: 400 })
    }

    const appId = process.env.AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE

    if (!appId || !appCertificate) {
      console.error('[/api/agora-token] Agora env vars ausentes')
      return NextResponse.json({
        error: 'Agora nao configurado',
        code: 'AGORA_NOT_CONFIGURED',
      }, { status: 500 })
    }

    const admin = createAdminClient() as any
    const { data: session, error: sessionError } = await admin
      .from('chat_sessions')
      .select('id, type, user_id, creator_id, ended_at, petals_charged, creators!inner(user_id)')
      .eq('id', session_id)
      .maybeSingle()

    if (sessionError) {
      console.error('[/api/agora-token] chat_sessions lookup', sessionError)
      return NextResponse.json({
        error: 'Erro ao validar sessao',
        code: 'SESSION_LOOKUP_FAILED',
      }, { status: 500 })
    }

    if (!session) {
      return NextResponse.json({
        error: 'Sessao nao encontrada',
        code: 'SESSION_NOT_FOUND',
      }, { status: 404 })
    }

    if (session.type !== 'video') {
      return NextResponse.json({
        error: 'Token Agora permitido apenas para sessao de video',
        code: 'INVALID_SESSION_TYPE',
      }, { status: 400 })
    }

    if (session.ended_at) {
      return NextResponse.json({
        error: 'Sessao de video ja encerrada',
        code: 'SESSION_ENDED',
      }, { status: 409 })
    }

    const creatorUserId = session.creators?.user_id
    const isConsumer = session.user_id === auth.user.id
    const isCreator = creatorUserId === auth.user.id

    if (!isConsumer && !isCreator) {
      return NextResponse.json({
        error: 'Usuario nao autorizado para esta sessao de video',
        code: 'UNAUTHORIZED',
      }, { status: 403 })
    }

    const { data: firstCharge, error: chargeError } = await admin
      .from('chat_minute_charges')
      .select('id')
      .eq('session_id', session.id)
      .eq('minute_number', 1)
      .eq('status', 'charged')
      .maybeSingle()

    if (chargeError) {
      console.error('[/api/agora-token] chat_minute_charges lookup', chargeError)
      return NextResponse.json({
        error: 'Erro ao validar cobranca inicial',
        code: 'CHARGE_LOOKUP_FAILED',
      }, { status: 500 })
    }

    const hasInitialCharge =
      Number(session.petals_charged ?? 0) >= VIDEO_PRICE_PER_MINUTE ||
      Boolean(firstCharge)

    if (!hasInitialCharge) {
      return NextResponse.json({
        error: 'Video ainda nao tem cobranca inicial confirmada',
        code: 'VIDEO_NOT_PAID',
      }, { status: 402 })
    }

    const participantRole = isCreator ? 'creator' : 'user'
    const channelName = channelNameForSession(session.id)
    const uid = agoraUidFor(session.id, auth.user.id, participantRole)
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + TOKEN_TTL_SECONDS

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs
    )

    return NextResponse.json({
      token,
      appId,
      channelName,
      uid,
      role: participantRole,
      agoraRole: 'host',
      expiresIn: TOKEN_TTL_SECONDS,
      expiresAt: new Date(privilegeExpiredTs * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Erro ao gerar token:', {
      ip: getRequestIP(req),
      error,
    })
    return NextResponse.json({ error: 'Erro ao gerar token' }, { status: 500 })
  }
}
