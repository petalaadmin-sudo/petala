import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type CreatorAreaApiCreator = {
  id: string
  user_id: string
  verified: boolean | null
  active: boolean | null
}

type CreatorAreaApiAccount = {
  role: string | null
  operational_channel: string | null
  role_locked_reason: string | null
}

type CreatorAreaApiAgencyUser = {
  id: string
}

type CreatorAreaApiSuccess = {
  ok: true
  user: User
  creator: CreatorAreaApiCreator
  admin: any
}

type CreatorAreaApiFailure = {
  ok: false
  response: NextResponse
}

export type CreatorAreaApiAuth = CreatorAreaApiSuccess | CreatorAreaApiFailure

function jsonError(status: number, code: string, error: string) {
  return NextResponse.json({ success: false, code, error }, { status })
}

async function getAuthenticatedUser(request: Request, admin: any): Promise<User | null> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null

  if (token) {
    const {
      data: { user },
      error,
    } = await admin.auth.getUser(token)

    if (!error && user) return user
  }

  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  return user
}

export async function requireCreatorAreaApi(request: Request): Promise<CreatorAreaApiAuth> {
  const admin = createAdminClient() as any
  const user = await getAuthenticatedUser(request, admin)

  if (!user) {
    return {
      ok: false,
      response: jsonError(401, 'AUTH_REQUIRED', 'Nao autenticado'),
    }
  }

  const [userRes, agencyUserRes, creatorRes] = await Promise.all([
    admin
      .from('users')
      .select('role, operational_channel, role_locked_reason')
      .eq('id', user.id)
      .maybeSingle(),
    admin
      .from('agency_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('active', true)
      .limit(1)
      .maybeSingle(),
    admin
      .from('creators')
      .select('id, user_id, verified, active, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (userRes.error || agencyUserRes.error || creatorRes.error) {
    console.error('[require creator area api]', userRes.error ?? agencyUserRes.error ?? creatorRes.error)

    return {
      ok: false,
      response: jsonError(500, 'CREATOR_AREA_LOOKUP_FAILED', 'Erro ao validar acesso da criadora'),
    }
  }

  const account = userRes.data as CreatorAreaApiAccount | null
  const agencyUser = agencyUserRes.data as CreatorAreaApiAgencyUser | null

  if (
    !account ||
    account.role !== 'creator' ||
    account.operational_channel !== 'creator' ||
    account.role_locked_reason === 'backfill_creator_pending_review' ||
    agencyUser
  ) {
    return {
      ok: false,
      response: jsonError(403, 'CREATOR_AREA_FORBIDDEN', 'Acesso permitido apenas para criadoras ativas'),
    }
  }

  const creator = creatorRes.data as CreatorAreaApiCreator | null

  if (!creator) {
    return {
      ok: false,
      response: jsonError(403, 'CREATOR_NOT_FOUND', 'Perfil de criadora nao encontrado'),
    }
  }

  if (creator.verified !== true || creator.active !== true) {
    return {
      ok: false,
      response: jsonError(403, 'CREATOR_NOT_ACTIVE', 'Criadora ainda nao esta habilitada'),
    }
  }

  return {
    ok: true,
    user,
    creator,
    admin,
  }
}
