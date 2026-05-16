// lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const rateLimitByIP = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(5, '1 m'),
  prefix:    'rl:ip:bonus',
  analytics: true,
})

export const rateLimitByUser = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(3, '1 h'),
  prefix:    'rl:user:bonus',
  analytics: true,
})

export async function checkRateLimit(
  ip: string,
  userId: string
): Promise<NextResponse | null> {

  const [byIP, byUser] = await Promise.all([
    rateLimitByIP.limit(ip),
    rateLimitByUser.limit(userId),
  ])

  if (!byIP.success) {
    return NextResponse.json(
      {
        success: false,
        error:   'Muitas tentativas. Aguarde um momento.',
        retry_after: Math.ceil((byIP.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After':           String(Math.ceil((byIP.reset - Date.now()) / 1000)),
          'X-RateLimit-Limit':     String(byIP.limit),
          'X-RateLimit-Remaining': String(byIP.remaining),
          'X-RateLimit-Reset':     String(byIP.reset),
        },
      }
    )
  }

  if (!byUser.success) {
    return NextResponse.json(
      {
        success: false,
        error:   'Limite de coleta atingido.',
        retry_after: Math.ceil((byUser.reset - Date.now()) / 1000),
      },
      { status: 429 }
    )
  }

  return null
}