import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  getPrelaunchConfig,
  getPrelaunchCookieName,
  isPrelaunchLockEnabled,
  verifyPrelaunchCookie,
} from '@/lib/prelaunch'

const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/cadastro',
  '/auth/callback',
  '/auth/confirm',
  '/auth/confirmar',
  '/auth/recuperar-senha',
  '/auth/definir-senha',
  '/auth/idade',
  '/auth/bloqueado',
  '/manifest.json',
  '/feed',
  '/perfil',
  '/ranking',
  '/mensagens',
  '/indicacao',
  '/criadora',
  '/live',
  '/api',
  '/pix',
  '/agencia',
  '/favoritos',
]

// Keep this exact list in sync with lib/legal/public-documents.ts.
const PUBLIC_LEGAL_ROUTES = [
  '/termos',
  '/termos/usuario',
  '/termos/criadora',
  '/termos/agencia',
  '/privacidade',
  '/politicas/conteudo',
  '/politicas/petalas-reembolso',
]

function withNoStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  response.headers.set('CDN-Cache-Control', 'no-store')
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store')
  return response
}

function withPrelaunchHeaders(response: NextResponse) {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
  return withNoStore(response)
}

function isPrelaunchBypass(pathname: string) {
  return (
    PUBLIC_LEGAL_ROUTES.includes(pathname) ||
    pathname === '/prelancamento' ||
    pathname === '/robots.txt' ||
    pathname === '/api/prelaunch/unlock' ||
    pathname === '/api/auth/callback' ||
    pathname === '/api/stripe/webhook' ||
    pathname === '/api/pix/webhook' ||
    pathname === '/api/cron/expire-chat-sessions' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/screenshots/') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    /^\/workbox-.*\.js$/.test(pathname)
  )
}

function prelaunchApiBlocked(status: number, error: string) {
  return withPrelaunchHeaders(NextResponse.json({ ok: false, error }, { status }))
}

async function handlePrelaunchLock(request: NextRequest) {
  if (!isPrelaunchLockEnabled()) return null

  const { pathname } = request.nextUrl

  if (isPrelaunchBypass(pathname)) {
    return withPrelaunchHeaders(NextResponse.next({ request }))
  }

  const prelaunchConfig = getPrelaunchConfig()

  if (!prelaunchConfig.configured) {
    if (pathname.startsWith('/api/')) {
      return prelaunchApiBlocked(503, 'PRELAUNCH_LOCK_NOT_CONFIGURED')
    }

    return withPrelaunchHeaders(NextResponse.redirect(new URL('/prelancamento', request.url)))
  }

  const hasAccess = await verifyPrelaunchCookie(
    request.cookies.get(getPrelaunchCookieName())?.value
  )

  if (hasAccess) return null

  if (pathname.startsWith('/api/')) {
    return prelaunchApiBlocked(423, 'PRELAUNCH_LOCKED')
  }

  return withPrelaunchHeaders(NextResponse.redirect(new URL('/prelancamento', request.url)))
}

export async function middleware(request: NextRequest) {
  const prelaunchResponse = await handlePrelaunchLock(request)
  if (prelaunchResponse) return prelaunchResponse

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: 'sb-petala-auth',
      },
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set(name, value)

          supabaseResponse = NextResponse.next({ request })

          supabaseResponse.cookies.set(name, value, options)
        },
        remove(name, options) {
          request.cookies.set(name, '')

          supabaseResponse = NextResponse.next({ request })

          supabaseResponse.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')

  const isPublicRoute = PUBLIC_ROUTES.some(
    r => pathname === r || pathname.startsWith(r + '/')
  ) || PUBLIC_LEGAL_ROUTES.includes(pathname)

  if (isAdminRoute) {
    if (!user) {
      const response = withNoStore(NextResponse.redirect(new URL('/auth/login', request.url)))
      return isPrelaunchLockEnabled() ? withPrelaunchHeaders(response) : response
    }

    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (roleError || userData?.role !== 'admin') {
      const response = withNoStore(NextResponse.redirect(new URL('/feed', request.url)))
      return isPrelaunchLockEnabled() ? withPrelaunchHeaders(response) : response
    }

    const response = withNoStore(supabaseResponse)
    return isPrelaunchLockEnabled() ? withPrelaunchHeaders(response) : response
  }

  if (!user && !isPublicRoute) {
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    return isPrelaunchLockEnabled() ? withPrelaunchHeaders(response) : response
  }

  return isPrelaunchLockEnabled() ? withPrelaunchHeaders(supabaseResponse) : supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/|favicon.ico|manifest.json|icons|screenshots|sw.js|workbox-.*\\.js).*)',
  ],
}
