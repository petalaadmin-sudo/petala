import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=${error}`)
  }

  if (code) {
    return NextResponse.redirect(`${origin}/auth/confirmar?code=${code}`)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}