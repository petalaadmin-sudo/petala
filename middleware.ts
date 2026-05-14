import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/cadastro', '/auth/callback', '/auth/confirmar', '/auth/idade', '/auth/bloqueado', '/feed', '/perfil', '/ranking', '/mensagens', '/indicacao', '/criadora', '/live', '/api', '/pix']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  if (!user && !PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  if (user && (pathname === '/auth/login' || pathname === '/auth/cadastro')) {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|screenshots|sw.js|workbox-.*\\.js|api).*)',
  ],
}