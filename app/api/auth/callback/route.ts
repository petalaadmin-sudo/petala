import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { resolveAccountRedirectTarget } from '@/lib/auth/redirect-target'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type CookieToSet = {
  name: string
  value: string
  options: CookieOptions
}

function redirectWithCookies(request: NextRequest, path: string, cookiesToSet: CookieToSet[]) {
  const response = NextResponse.redirect(new URL(path, request.url))

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}

function redirectToCallbackError(request: NextRequest) {
  return NextResponse.redirect(new URL('/auth/login?error=callback_error', request.url))
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    if (url.searchParams.get('error') || url.searchParams.get('error_description')) {
      return redirectToCallbackError(request)
    }

    return NextResponse.redirect(new URL(`/auth/confirmar${url.search}`, request.url))
  }

  const cookiesToSet: CookieToSet[] = []

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        storageKey: 'sb-petala-auth',
      },
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          cookiesToSet.push({ name, value, options })
        },
        remove(name, options) {
          cookiesToSet.push({
            name,
            value: '',
            options: { ...options, maxAge: 0 },
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session?.access_token) {
    console.error('[auth/callback] exchangeCodeForSession', error)
    return redirectToCallbackError(request)
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(data.session.access_token)

  if (userError || !user) {
    console.error('[auth/callback] getUser', userError)
    return redirectToCallbackError(request)
  }

  const admin = createAdminClient() as any

  let redirectTo = '/feed'

  try {
    const target = await resolveAccountRedirectTarget(admin, user.id, {
      strict: true,
      logPrefix: 'auth/callback',
    })
    redirectTo = target.redirectTo
  } catch (err) {
    console.error('[auth/callback] redirect target', err)
    return redirectToCallbackError(request)
  }

  return redirectWithCookies(request, redirectTo, cookiesToSet)
}
