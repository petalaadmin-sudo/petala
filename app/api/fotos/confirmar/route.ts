// app/api/fotos/confirmar/route.ts
// Chamado pelo frontend depois do upload direto no R2.
// Baixa a imagem, processa, gera blur hash, sobe versao processada e atualiza o banco.

import { createPrivateUrl, createUploadUrl, getPublicUrl } from '@/lib/r2'
import {
  generateBlurHash,
  generateBlurredPreview,
  processImageForUpload,
} from '@/lib/blurhash'
import { NextResponse } from 'next/server'
import { requireCreatorAreaApi } from '@/lib/auth/require-creator-area-api'

const UPLOAD_FETCH_ATTEMPTS = 3

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isCreatorPhotoKey(key: string | null | undefined, creatorId: string) {
  return typeof key === 'string' && key.startsWith(`creators/${creatorId}/`) && !key.includes('..')
}

async function fetchUploadedObject(key: string): Promise<{ buffer: Buffer | null; status: number | null }> {
  let lastStatus: number | null = null

  for (let attempt = 1; attempt <= UPLOAD_FETCH_ATTEMPTS; attempt += 1) {
    const signedUrl = await createPrivateUrl(key, 300)
    const res = await fetch(signedUrl, { cache: 'no-store' })

    if (res.ok) {
      return { buffer: Buffer.from(await res.arrayBuffer()), status: res.status }
    }

    lastStatus = res.status

    if (attempt < UPLOAD_FETCH_ATTEMPTS) {
      await sleep(300 * attempt)
    }
  }

  return { buffer: null, status: lastStatus }
}

export async function POST(request: Request) {
  try {
    const creatorAuth = await requireCreatorAreaApi(request)

    if (!creatorAuth.ok) {
      return creatorAuth.response
    }

    const { admin, creator } = creatorAuth
    const { photo_id } = await request.json()

    if (!photo_id) {
      return NextResponse.json({ error: 'photo_id obrigatorio' }, { status: 400 })
    }

    const { data: photo, error: photoError } = await admin
      .from('album_photos')
      .select('id, creator_id, r2_key, r2_key_blur, is_free, price_petals')
      .eq('id', photo_id)
      .eq('creator_id', creator.id)
      .maybeSingle()

    if (photoError) {
      console.error('[/api/fotos/confirmar] erro ao buscar foto', {
        code: photoError.code,
        message: photoError.message,
      })
      return NextResponse.json({ error: 'Erro ao buscar foto' }, { status: 500 })
    }

    if (!photo) {
      return NextResponse.json({ error: 'Foto nao encontrada' }, { status: 404 })
    }

    if (photo.is_free !== true || Number(photo.price_petals) !== 0) {
      return NextResponse.json(
        {
          code: 'PAID_PHOTO_CONFIRM_DISABLED',
          error: 'Fotos pagas permanecem bloqueadas.',
        },
        { status: 423 }
      )
    }

    if (
      !isCreatorPhotoKey(photo.r2_key, creator.id) ||
      !isCreatorPhotoKey(photo.r2_key_blur, creator.id)
    ) {
      return NextResponse.json(
        { error: 'Registro de foto incompleto' },
        { status: 500 }
      )
    }

    const { buffer: rawBuffer, status: fetchStatus } = await fetchUploadedObject(photo.r2_key)

    if (!rawBuffer) {
      console.error('[/api/fotos/confirmar] objeto R2 ainda indisponivel apos PUT', {
        status: fetchStatus,
      })
      return NextResponse.json(
        { code: 'PHOTO_UPLOAD_OBJECT_NOT_READY', error: 'Foto ainda nao disponivel no R2. Tente novamente em instantes.' },
        { status: 422 }
      )
    }

    const processedBuffer = await processImageForUpload(rawBuffer, 1920)
    const blurHash = await generateBlurHash(processedBuffer)
    const blurBuffer = await generateBlurredPreview(processedBuffer)

    const [processedUpload, blurUpload] = await Promise.all([
      createUploadUrl({ key: photo.r2_key, contentType: 'image/jpeg' }),
      createUploadUrl({ key: photo.r2_key_blur, contentType: 'image/jpeg' }),
    ])

    const [uploadProcessed, uploadBlur] = await Promise.all([
      fetch(processedUpload.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: processedBuffer,
      }),
      fetch(blurUpload.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blurBuffer,
      }),
    ])

    if (!uploadProcessed.ok || !uploadBlur.ok) {
      console.error('[/api/fotos/confirmar] falha ao reprocessar imagem no R2', {
        processedStatus: uploadProcessed.status,
        blurStatus: uploadBlur.status,
      })
      throw new Error('Falha ao reprocessar imagem no R2')
    }

    const { error: updateError } = await admin
      .from('album_photos')
      .update({ blur_hash: blurHash })
      .eq('id', photo.id)
      .eq('creator_id', creator.id)

    if (updateError) {
      console.error('[/api/fotos/confirmar] erro ao atualizar foto', {
        code: updateError.code,
        message: updateError.message,
      })
      return NextResponse.json({ error: 'Erro ao atualizar foto' }, { status: 500 })
    }

    const publicUrl = getPublicUrl(photo.r2_key)
    const blurUrl = getPublicUrl(photo.r2_key_blur)

    return NextResponse.json({
      success: true,
      photo_id: photo.id,
      blur_hash: blurHash,
      public_url: publicUrl,
      blur_url: blurUrl,
    })
  } catch (err) {
    console.error('[/api/fotos/confirmar]', err)
    return NextResponse.json({ error: 'Erro ao processar imagem' }, { status: 500 })
  }
}
