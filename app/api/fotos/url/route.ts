// app/api/fotos/url/route.ts
// Assina leitura de fotos gratuitas depois de validar o registro no banco.

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createPrivateUrl, R2ConfigError } from '@/lib/r2'

export const dynamic = 'force-dynamic'

const PAID_PHOTO_URL_DISABLED = {
  code: 'PAID_PHOTO_URL_DISABLED',
  error: 'Fotos pagas permanecem indisponiveis enquanto o fluxo financeiro auditavel e implementado.',
}

function isUuid(value: string | null) {
  return Boolean(value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i))
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
      return NextResponse.json(
        { code: 'PHOTO_URL_INVALID_REQUEST', error: 'Foto nao informada.' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { code: 'PHOTO_URL_LOOKUP_FAILED', error: 'Nao foi possivel carregar a foto.' },
        { status: 500 }
      )
    }

    if (!photo) {
      return NextResponse.json(
        { code: 'PHOTO_NOT_FOUND', error: 'Foto nao encontrada.' },
        { status: 404 }
      )
    }

    const creator = Array.isArray(photo.creators) ? photo.creators[0] : photo.creators

    if (!creator || creator.verified !== true || creator.active !== true) {
      return NextResponse.json(
        { code: 'PHOTO_NOT_AVAILABLE', error: 'Foto indisponivel.' },
        { status: 404 }
      )
    }

    if (!isExpectedPhotoKey(photo.r2_key, photo.creator_id)) {
      return NextResponse.json(
        { code: 'PHOTO_KEY_INVALID', error: 'Foto indisponivel.' },
        { status: 404 }
      )
    }

    if (photo.is_free !== true || Number(photo.price_petals) !== 0) {
      return NextResponse.json(PAID_PHOTO_URL_DISABLED, { status: 423 })
    }

    try {
      const signedUrl = await createPrivateUrl(photo.r2_key, 300)
      return NextResponse.json({ url: signedUrl })
    } catch (err) {
      logPhotoUrlError('create_private_url', err)
      return NextResponse.json(
        { code: 'PHOTO_URL_STORAGE_ERROR', error: 'Foto temporariamente indisponivel.' },
        { status: 500 }
      )
    }
  } catch (err) {
    logPhotoUrlError('unexpected', err)
    return NextResponse.json(
      { code: 'PHOTO_URL_INTERNAL_ERROR', error: 'Erro interno ao carregar foto.' },
      { status: 500 }
    )
  }
}
