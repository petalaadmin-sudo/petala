// app/api/fotos/perfil-url/route.ts
// Entrega a foto de perfil publica da criadora via proxy seguro do R2.

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createPrivateUrl, R2ConfigError } from '@/lib/r2'

export const dynamic = 'force-dynamic'

function isUuid(value: string | null) {
  return Boolean(value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i))
}

function fallbackImage(status = 200) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="Foto de perfil indisponivel"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a0f1b"/><stop offset="0.52" stop-color="#111"/><stop offset="1" stop-color="#28121b"/></linearGradient></defs><rect width="960" height="540" fill="url(#g)"/><circle cx="480" cy="250" r="78" fill="#ffffff" fill-opacity=".08"/><text x="480" y="282" text-anchor="middle" font-family="Arial, sans-serif" font-size="78" fill="#ffffff" fill-opacity=".38">P</text></svg>`

  return new NextResponse(svg, {
    status,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}

function logProfilePhotoError(stage: string, err: unknown) {
  if (err instanceof R2ConfigError) {
    console.error('[/api/fotos/perfil-url] erro de configuracao R2', {
      stage,
      missing: err.missing,
      code: err.code,
    })
    return
  }

  if (err instanceof Error) {
    console.error('[/api/fotos/perfil-url] erro ao carregar foto', {
      stage,
      name: err.name,
      message: err.message,
    })
    return
  }

  console.error('[/api/fotos/perfil-url] erro desconhecido ao carregar foto', { stage })
}

function extractProfilePhotoKey(photoUrl: string | null, userId: string) {
  if (!photoUrl) return null

  try {
    const parsed = new URL(photoUrl)

    if (parsed.protocol !== 'https:') return null

    const path = decodeURIComponent(parsed.pathname).replace(/^\/+/, '')
    const creatorsIndex = path.indexOf('creators/')
    const key = creatorsIndex >= 0 ? path.slice(creatorsIndex) : path

    if (key.includes('..') || key.includes('\\')) return null
    if (!key.startsWith(`creators/${userId}/profile/`)) return null
    if (!/\.(jpe?g|png|webp)$/i.test(key)) return null

    return key
  } catch {
    return null
  }
}

async function proxyPrivateImage(key: string) {
  const signedUrl = await createPrivateUrl(key, 300)
  const response = await fetch(signedUrl, { cache: 'no-store' })

  if (!response.ok || !response.body) {
    return fallbackImage()
  }

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      'Content-Type': response.headers.get('Content-Type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
    },
  })
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const creatorId = url.searchParams.get('creator_id')

    if (!isUuid(creatorId)) {
      return fallbackImage()
    }

    const admin = createAdminClient()
    const { data: creator, error } = await admin
      .from('creators')
      .select('id, user_id, photo_url, verified, active')
      .eq('id', creatorId)
      .eq('verified', true)
      .eq('active', true)
      .maybeSingle()

    if (error) {
      console.error('[/api/fotos/perfil-url] erro ao buscar criadora', {
        code: error.code,
        message: error.message,
      })
      return fallbackImage()
    }

    if (!creator) {
      return fallbackImage()
    }

    const key = extractProfilePhotoKey(creator.photo_url, creator.user_id)

    if (!key) {
      return fallbackImage()
    }

    try {
      return await proxyPrivateImage(key)
    } catch (err) {
      logProfilePhotoError('proxy_private_image', err)
      return fallbackImage()
    }
  } catch (err) {
    logProfilePhotoError('unexpected', err)
    return fallbackImage()
  }
}
