// app/api/fotos/confirmar/route.ts
// Chamado pelo frontend APÓS o upload direto no R2 ser concluído.
// Baixa a imagem, processa (resize + remoção EXIF), gera blur hash,
// sobe versão processada + blur, atualiza banco.

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createPrivateUrl, createUploadUrl, getPublicUrl } from '@/lib/r2'
import {
  generateBlurHash,
  generateBlurredPreview,
  processImageForUpload,
} from '@/lib/blurhash'
import { NextResponse } from 'next/server'

const UPLOAD_FETCH_ATTEMPTS = 3

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { photo_id } = await request.json()
    if (!photo_id) return NextResponse.json({ error: 'photo_id obrigatório' }, { status: 400 })

    const admin = createAdminClient()

    // Busca a foto e valida que pertence à criadora autenticada
    const { data: photo, error: photoError } = await admin
      .from('album_photos')
      .select('*, creators!inner(user_id)')
      .eq('id', photo_id)
      .maybeSingle()

    if (photoError) {
      console.error('[/api/fotos/confirmar] erro ao buscar foto', {
        code: photoError.code,
        message: photoError.message,
      })
      return NextResponse.json({ error: 'Erro ao buscar foto' }, { status: 500 })
    }

    if (!photo) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })

    if (photo.creators.user_id !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    if (!photo.r2_key_blur) {
      return NextResponse.json(
        { error: 'Registro de foto incompleto' },
        { status: 500 }
      )
    }

    // ── 1. Baixa a imagem que o browser acabou de fazer upload ──
    const { buffer: rawBuffer, status: fetchStatus } = await fetchUploadedObject(photo.r2_key)

    if (!rawBuffer) {
      console.error('[/api/fotos/confirmar] objeto R2 ainda indisponivel apos PUT', {
        status: fetchStatus,
      })
      return NextResponse.json(
        { code: 'PHOTO_UPLOAD_OBJECT_NOT_READY', error: 'Foto ainda não disponível no R2. Tente novamente em instantes.' },
        { status: 422 }
      )
    }

    // ── 2. Processa imagem: resize, remove EXIF, JPEG otimizado ──
    const processedBuffer = await processImageForUpload(rawBuffer, 1920)

    // ── 3. Gera blur hash (para placeholder CSS) ──
    const blurHash = await generateBlurHash(processedBuffer)

    // ── 4. Gera preview borrado (para foto bloqueada) ──
    const blurBuffer = await generateBlurredPreview(processedBuffer)

    // ── 5. Faz upload da versão processada de volta no R2 ──
    // (substitui o arquivo original que o browser enviou)
    const [processedUpload, blurUpload] = await Promise.all([
      createUploadUrl({ key: photo.r2_key, contentType: 'image/jpeg' }),
      createUploadUrl({ key: photo.r2_key_blur, contentType: 'image/jpeg' }),
    ])

    const [uploadProcessed, uploadBlur] = await Promise.all([
      // Foto processada
      fetch(processedUpload.uploadUrl, {
        method:  'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body:    processedBuffer,
      }),
      // Blur preview — vai para a key _blur.jpg
      fetch(blurUpload.uploadUrl, {
        method:  'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body:    blurBuffer,
      }),
    ])

    if (!uploadProcessed.ok || !uploadBlur.ok) {
      console.error('[/api/fotos/confirmar] falha ao reprocessar imagem no R2', {
        processedStatus: uploadProcessed.status,
        blurStatus: uploadBlur.status,
      })
      throw new Error('Falha ao reprocessar imagem no R2')
    }

    // ── 6. Atualiza banco com blur hash ──
    const { error: updateError } = await admin
      .from('album_photos')
      .update({ blur_hash: blurHash })
      .eq('id', photo_id)

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
      success:    true,
      photo_id,
      blur_hash:  blurHash,
      public_url: publicUrl,
      blur_url:   blurUrl,
    })

  } catch (err) {
    console.error('[/api/fotos/confirmar]', err)
    return NextResponse.json({ error: 'Erro ao processar imagem' }, { status: 500 })
  }
}
