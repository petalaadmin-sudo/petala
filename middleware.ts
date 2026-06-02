import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

function withNoStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  response.headers.set('CDN-Cache-Control', 'no-store')
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store')
  return response
}

export async function middleware(request: NextRequest) {
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
  )

  if (isAdminRoute) {
    if (!user) {
      return withNoStore(NextResponse.redirect(new URL('/auth/login', request.url)))
    }

    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (roleError || userData?.role !== 'admin') {
      return withNoStore(NextResponse.redirect(new URL('/feed', request.url)))
    }

    return withNoStore(supabaseResponse)
  }

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|screenshots|sw.js|workbox-.*\\.js|api).*)',
  ],
}
