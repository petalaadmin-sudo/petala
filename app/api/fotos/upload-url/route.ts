// app/api/fotos/upload-url/route.ts
// Passo 1: frontend pede URL de upload
// Passo 2: frontend faz PUT direto no R2 (sem passar pelo servidor)
// Passo 3: frontend chama /api/fotos/confirmar com a key

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createUploadUrl, generatePhotoKey, isValidImageType, MAX_FILE_SIZE_BYTES } from '@/lib/r2'
import { NextResponse } from 'next/server'

const PAID_PHOTO_UPLOAD_DISABLED = {
  code: 'PAID_PHOTO_UPLOAD_DISABLED',
  error: 'Fotos pagas serão reativadas após o fluxo financeiro auditável.',
}

const FREE_PHOTO_PRICE_PLACEHOLDER = 50

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { content_type, file_size, is_free = false } = await request.json()

    if (is_free !== true) {
      return NextResponse.json(PAID_PHOTO_UPLOAD_DISABLED, { status: 423 })
    }

    // Valida tipo
    if (!isValidImageType(content_type)) {
      return NextResponse.json(
        { error: 'Tipo inválido. Use JPEG, PNG ou WebP.' },
        { status: 400 }
      )
    }

    // Valida tamanho (max 20MB)
    if (file_size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: 20MB.` },
        { status: 400 }
      )
    }

    // Verifica que o usuário é uma criadora verificada
    const admin = createAdminClient()
    const { data: creator } = await admin
      .from('creators')
      .select('id, verified')
      .eq('user_id', user.id)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Perfil de criadora não encontrado' }, { status: 403 })
    }

    if (!creator.verified) {
      return NextResponse.json({ error: 'Conta ainda não verificada' }, { status: 403 })
    }

    // Gera chave única para a foto principal e para o blur
    const photoKey = generatePhotoKey(creator.id)
    const blurKey  = photoKey.replace('.jpg', '_blur.jpg')

    // Gera URLs de upload pré-assinadas (expiram em 5 minutos)
    const [{ uploadUrl }, { uploadUrl: blurUploadUrl }] = await Promise.all([
      createUploadUrl({ key: photoKey, contentType: 'image/jpeg' }),
      createUploadUrl({ key: blurKey,  contentType: 'image/jpeg' }),
    ])

    // Cria registro no banco como 'pending' (sem url ainda)
    const { data: photo, error: dbError } = await admin
      .from('album_photos')
      .insert({
        creator_id:   creator.id,
        r2_key:       photoKey,
        r2_key_blur:  blurKey,
        is_free:      true,
        price_petals: FREE_PHOTO_PRICE_PLACEHOLDER,
        sort_order:   Date.now(),
      })
      .select()
      .single()

    if (dbError || !photo) {
      throw new Error('Falha ao criar registro: ' + dbError?.message)
    }

    return NextResponse.json({
      photo_id:       photo.id,
      upload_url:     uploadUrl,       // PUT a foto aqui
      blur_upload_url: blurUploadUrl,  // PUT o blur aqui
      photo_key:      photoKey,
      blur_key:       blurKey,
    })

  } catch (err) {
    console.error('[/api/fotos/upload-url]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
