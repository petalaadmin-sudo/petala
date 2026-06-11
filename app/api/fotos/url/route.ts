// app/api/fotos/url/route.ts
// Assina leitura de fotos gratuitas depois de validar o registro no banco.

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createPrivateUrl, R2ConfigError } from '@/lib/r2'

export const dynamic = 'force-dynamic'

function isUuid(value: string | null) {
  return Boolean(value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i))
}

function fallbackImage(status = 200) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640" role="img" aria-label="Foto indisponivel"><rect width="640" height="640" fill="#141014"/><circle cx="320" cy="300" r="70" fill="#fff" fill-opacity=".07"/><text x="320" y="333" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" fill="#fff" fill-opacity=".3">P</text></svg>`

  return new NextResponse(svg, {
    status,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}

function isExpectedPhotoKey(key: string | null | undefined, creatorId: string) {
  return typeof key === 'string' && key.startsWith(`creators/${creatorId}/`) && !key.includes('..')
}

function logPhotoUrlError(stage: string, err: unknown) {
  if (err instanceof R2ConfigError) {
    console.error('[/api/fotos/url] erro de configuracao R2', {
      stage,
      missing: err.missing,
      code: err.code,
    })
    return
  }

  if (err instanceof Error) {
    console.error('[/api/fotos/url] erro ao assinar foto', {
      stage,
      name: err.name,
      message: err.message,
    })
    return
  }

  console.error('[/api/fotos/url] erro desconhecido ao assinar foto', { stage })
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const photoId = url.searchParams.get('photo_id')
    const key = url.searchParams.get('key')

    if (!isUuid(photoId) && !key) {
      return fallbackImage()
    }

    const admin = createAdminClient()
    let query = admin
      .from('album_photos')
      .select('id, creator_id, r2_key, is_free, price_petals, creators!inner(id, verified, active)')
      .limit(1)

    if (isUuid(photoId)) {
      query = query.eq('id', photoId)
    } else {
      query = query.eq('r2_key', key)
    }

    const { data: photo, error } = await query.maybeSingle()

    if (error) {
      console.error('[/api/fotos/url] erro ao buscar foto', {
        code: error.code,
        message: error.message,
      })
      return fallbackImage()
    }

    if (!photo) {
      return fallbackImage()
    }

    const creator = Array.isArray(photo.creators) ? photo.creators[0] : photo.creators

    if (!creator || creator.verified !== true || creator.active !== true) {
      return fallbackImage()
    }

    if (!isExpectedPhotoKey(photo.r2_key, photo.creator_id)) {
      return fallbackImage()
    }

    if (photo.is_free !== true || Number(photo.price_petals) !== 0) {
      return fallbackImage()
    }

    try {
      const signedUrl = await createPrivateUrl(photo.r2_key, 300)
      const imageResponse = await fetch(signedUrl, { cache: 'no-store' })

      if (!imageResponse.ok || !imageResponse.body) {
        return fallbackImage()
      }

      return new NextResponse(imageResponse.body, {
        status: 200,
        headers: {
          'Content-Type': imageResponse.headers.get('Content-Type') ?? 'image/jpeg',
          'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
        },
      })
    } catch (err) {
      logPhotoUrlError('create_private_url', err)
      return fallbackImage()
    }
  } catch (err) {
    logPhotoUrlError('unexpected', err)
    return fallbackImage()
  }
}
