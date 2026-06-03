// app/api/fotos/upload-url/route.ts
// Passo 1: frontend pede URL de upload
// Passo 2: frontend faz PUT direto no R2 (sem passar pelo servidor)
// Passo 3: frontend chama /api/fotos/confirmar com a key

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createUploadUrl, generatePhotoKey, isValidImageType, MAX_FILE_SIZE_BYTES, R2ConfigError } from '@/lib/r2'
import { NextResponse } from 'next/server'

const PAID_PHOTO_UPLOAD_DISABLED = {
  code: 'PAID_PHOTO_UPLOAD_DISABLED',
  error: 'Fotos pagas serão reativadas após o fluxo financeiro auditável.',
}

const FREE_PHOTO_PRICE = 0

function logUploadError(stage: string, err: unknown) {
  if (err instanceof R2ConfigError) {
    console.error('[/api/fotos/upload-url] erro de configuracao R2', {
      stage,
      missing: err.missing,
      code: err.code,
    })
    return
  }

  if (err instanceof Error) {
    console.error('[/api/fotos/upload-url] erro no upload de foto', {
      stage,
      name: err.name,
      message: err.message,
    })
    return
  }

  console.error('[/api/fotos/upload-url] erro desconhecido no upload de foto', { stage })
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { content_type, file_size, is_free = false } = await request.json().catch(() => ({}))

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

    if (typeof file_size !== 'number' || !Number.isFinite(file_size) || file_size <= 0) {
      return NextResponse.json(
        { code: 'PHOTO_UPLOAD_INVALID_FILE_SIZE', error: 'Tamanho do arquivo inválido.' },
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
    const { data: creator, error: creatorError } = await admin
      .from('creators')
      .select('id, verified')
      .eq('user_id', user.id)
      .maybeSingle()

    if (creatorError) {
      console.error('[/api/fotos/upload-url] erro ao buscar criadora', {
        code: creatorError.code,
        message: creatorError.message,
      })
      return NextResponse.json(
        { code: 'PHOTO_UPLOAD_CREATOR_LOOKUP_ERROR', error: 'Não foi possível validar a criadora.' },
        { status: 500 }
      )
    }

    if (!creator) {
      return NextResponse.json({ error: 'Perfil de criadora não encontrado' }, { status: 403 })
    }

    if (!creator.verified) {
      return NextResponse.json({ error: 'Conta ainda não verificada' }, { status: 403 })
    }

    // Gera chave única para a foto principal e para o blur
    const photoId = crypto.randomUUID()
    const photoKey = generatePhotoKey(creator.id)
    const blurKey  = photoKey.replace('.jpg', '_blur.jpg')

    let uploadUrl: string
    let blurUploadUrl: string

    try {
      // Gera URLs de upload pré-assinadas (expiram em 5 minutos)
      const [photoUpload, blurUpload] = await Promise.all([
        createUploadUrl({ key: photoKey, contentType: 'image/jpeg' }),
        createUploadUrl({ key: blurKey,  contentType: 'image/jpeg' }),
      ])

      uploadUrl = photoUpload.uploadUrl
      blurUploadUrl = blurUpload.uploadUrl
    } catch (err) {
      logUploadError('create_upload_url', err)
      return NextResponse.json(
        { code: 'PHOTO_UPLOAD_STORAGE_ERROR', error: 'Armazenamento de fotos indisponível. Tente novamente em instantes.' },
        { status: 500 }
      )
    }

    // Cria registro no banco como 'pending' (sem url ainda)
    const { data: photo, error: dbError } = await admin
      .from('album_photos')
      .insert({
        id:           photoId,
        creator_id:   creator.id,
        r2_key:       photoKey,
        r2_key_blur:  blurKey,
        is_free:      true,
        price_petals: FREE_PHOTO_PRICE,
        sort_order:   Date.now(),
      })
      .select()
      .single()

    if (dbError || !photo) {
      console.error('[/api/fotos/upload-url] erro ao criar registro da foto', {
        code: dbError?.code,
        message: dbError?.message,
        details: dbError?.details,
        hint: dbError?.hint,
      })
      return NextResponse.json(
        { code: 'PHOTO_UPLOAD_DB_ERROR', error: 'Não foi possível criar o registro da foto.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      photo_id:       photo.id,
      upload_url:     uploadUrl,       // PUT a foto aqui
      blur_upload_url: blurUploadUrl,  // PUT o blur aqui
      photo_key:      photoKey,
      blur_key:       blurKey,
    })

  } catch (err) {
    logUploadError('unexpected', err)
    return NextResponse.json(
      { code: 'PHOTO_UPLOAD_INTERNAL_ERROR', error: 'Erro interno ao preparar upload da foto.' },
      { status: 500 }
    )
  }
}
