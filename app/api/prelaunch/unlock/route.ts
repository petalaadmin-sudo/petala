import { NextResponse } from 'next/server'
import {
  buildPrelaunchCookieValue,
  getPrelaunchConfig,
  getPrelaunchCookieName,
  verifyPrelaunchAccessCode,
} from '@/lib/prelaunch'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const config = getPrelaunchConfig()

    if (!config.enabled) {
      return NextResponse.json({ ok: true, lock_enabled: false })
    }

    if (!config.configured) {
      console.error('[prelaunch/unlock] lock ativo sem senha ou segredo configurado')
      return NextResponse.json(
        { ok: false, error: 'Acesso temporariamente indisponivel' },
        { status: 503 }
      )
    }

    const body = await request.json().catch(() => null)
    const submittedCode = typeof body?.code === 'string'
      ? body.code
      : typeof body?.password === 'string'
        ? body.password
        : ''

    const validation = verifyPrelaunchAccessCode(submittedCode)
    if (!validation.ok) {
      return NextResponse.json({ ok: false, error: 'Codigo invalido' }, { status: 401 })
    }

    const cookieValue = await buildPrelaunchCookieValue()
    if (!cookieValue) {
      console.error('[prelaunch/unlock] falha ao gerar cookie de acesso')
      return NextResponse.json(
        { ok: false, error: 'Acesso temporariamente indisponivel' },
        { status: 503 }
      )
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(getPrelaunchCookieName(), cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: config.maxAgeSeconds,
    })

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')

    return response
  } catch (error) {
    console.error('[prelaunch/unlock]', error)
    return NextResponse.json(
      { ok: false, error: 'Nao foi possivel liberar o acesso' },
      { status: 500 }
    )
  }
}
