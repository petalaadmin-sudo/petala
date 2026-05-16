// lib/auth/api-auth.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'

type AuthSuccess = {
  ok: true
  user: User
  token: string
}

type AuthFailure = {
  ok: false
  response: NextResponse
}

export type AuthResult = AuthSuccess | AuthFailure

export function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    return null
  }

  return token
}

export function getRequestIP(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  )
}

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const token = getBearerToken(request)

    if (!token) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: 'Não autenticado' },
          { status: 401 }
        ),
      }
    }

    const admin = createAdminClient()
    const {
      data: { user },
      error,
    } = await admin.auth.getUser(token)

    if (error || !user) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: 'Sessão inválida' },
          { status: 401 }
        ),
      }
    }

    return {
      ok: true,
      user,
      token,
    }
  } catch (err) {
    console.error('[requireAuth]', err)

    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Erro de autenticação' },
        { status: 500 }
      ),
    }
  }
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const auth = await requireAuth(request)

  if (!auth.ok) {
    return auth
  }

  const admin = createAdminClient()

  const { data: userData, error } = await admin
    .from('users')
    .select('role')
    .eq('id', auth.user.id)
    .single()

  if (error || userData?.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      ),
    }
  }

  return auth
}