import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { origin, search } = new URL(request.url)
  return NextResponse.redirect(`${origin}/auth/confirmar${search}`)
}
