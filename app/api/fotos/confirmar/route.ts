// app/api/fotos/confirmar/route.ts
// Chamado pelo frontend APÓS o upload direto no R2 ser concluído.
// Baixa a imagem, processa (resize + remoção EXIF), gera blur hash,
// sobe versão processada + blur, atualiza banco.

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getPublicUrl, deleteObject } from '@/lib/r2'
import {
  generateBlurHash,
  generateBlurredPreview,
  processImageForUpload,
} from '@/lib/blurhash'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { photo_id } = await request.json()
    if (!photo_id) return NextResponse.json({ error: 'photo_id obrigatório' }, { status: 400 })

    const admin = createAdminClient()

    // Busca a foto e valida que pertence à criadora autenticada
    const { data: photo } = await admin
      .from('album_photos')
      .select('*, creators!inner(user_id)')
      .eq('id', photo_id)
      .single()

    if (!photo) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })

    if (photo.creators.user_id !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // ── 1. Baixa a imagem que o browser acabou de fazer upload ──
    const publicUrl = getPublicUrl(photo.r2_key)
    const fetchRes  = await fetch(publicUrl)

    if (!fetchRes.ok) {
      return NextResponse.json(
        { error: 'Foto ainda não disponível no R2. Tente novamente em instantes.' },
        { status: 422 }
      )
    }

    const rawBuffer = Buffer.from(await fetchRes.arrayBuffer())

    // ── 2. Processa imagem: resize, remove EXIF, JPEG otimizado ──
    const processedBuffer = await processImageForUpload(rawBuffer, 1920)

    // ── 3. Gera blur hash (para placeholder CSS) ──
    const blurHash = await generateBlurHash(processedBuffer)

    // ── 4. Gera preview borrado (para foto bloqueada) ──
    const blurBuffer = await generateBlurredPreview(processedBuffer)

    // ── 5. Faz upload da versão processada de volta no R2 ──
    // (substitui o arquivo original que o browser enviou)
    const [uploadProcessed, uploadBlur] = await Promise.all([
      // Foto processada
      fetch(publicUrl, {
        method:  'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body:    processedBuffer,
      }),
      // Blur preview — vai para a key _blur.jpg
      fetch(getPublicUrl(photo.r2_key_blur!), {
        method:  'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body:    blurBuffer,
      }),
    ])

    if (!uploadProcessed.ok || !uploadBlur.ok) {
      throw new Error('Falha ao reprocessar imagem no R2')
    }

    // ── 6. Atualiza banco com blur hash ──
    await admin
      .from('album_photos')
      .update({ blur_hash: blurHash })
      .eq('id', photo_id)

    return NextResponse.json({
      success:    true,
      photo_id,
      blur_hash:  blurHash,
      public_url: publicUrl,
      blur_url:   getPublicUrl(photo.r2_key_blur!),
    })

  } catch (err) {
    console.error('[/api/fotos/confirmar]', err)
    return NextResponse.json({ error: 'Erro ao processar imagem' }, { status: 500 })
  }
}
