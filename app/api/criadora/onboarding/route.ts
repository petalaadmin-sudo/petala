import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/server'
import {
  deleteObject,
  getPublicUrl,
  isValidImageType,
  MAX_FILE_SIZE_BYTES,
  R2ConfigError,
  uploadObject,
} from '@/lib/r2'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const FIXED_TEXT_PRICE_PETALS = 50
const FIXED_VIDEO_PRICE_PETALS = 120
const CPF_PATTERN = /^\d{11}$/

type UploadedPhoto = {
  key: string
  url: string
}

type SubmitCreatorOnboardingResult = {
  success?: boolean
  creator_id?: string
  user_id?: string
  role?: string
  operational_channel?: string
  verified?: boolean
  active?: boolean
  photo_url?: string | null
  verification_id?: string
  verification_status?: string
}

type AccountChannelRow = {
  id: string
  email: string | null
  role: string | null
  operational_channel: string | null
  signup_channel: string | null
  role_locked_reason: string | null
}

function asTrimmedText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

function asOptionalText(value: FormDataEntryValue | null) {
  const text = asTrimmedText(value)
  return text.length > 0 ? text : null
}

function asExpectedPrice(value: FormDataEntryValue | null, expected: number) {
  if (value === null || value === undefined || value === '') return expected
  return Number(value)
}

function photoExtension(contentType: string) {
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  return 'jpg'
}

function logPhotoError(stage: string, err: unknown) {
  if (err instanceof R2ConfigError) {
    console.error('[criadora/onboarding] erro de configuracao R2', {
      stage,
      missing: err.missing,
      code: err.code,
    })
    return
  }

  if (err instanceof Error) {
    console.error('[criadora/onboarding] erro ao processar foto', {
      stage,
      name: err.name,
      message: err.message,
    })
    return
  }

  console.error('[criadora/onboarding] erro desconhecido ao processar foto', { stage })
}

function errorResponse(code: string, error: string, status: number) {
  return NextResponse.json({ success: false, code, error }, { status })
}

async function cleanupUploadedPhoto(photo: UploadedPhoto | null) {
  if (!photo) return

  try {
    await deleteObject(photo.key)
  } catch (err) {
    logPhotoError('cleanup_uploaded_photo', err)
  }
}

async function uploadProfilePhoto(userId: string, value: FormDataEntryValue | null) {
  if (value === null) {
    return { ok: true as const, photo: null }
  }

  if (!(value instanceof File) || value.size <= 0) {
    return {
      ok: false as const,
      response: errorResponse(
        'CREATOR_ONBOARDING_INVALID_PHOTO',
        'A foto de perfil enviada não é válida.',
        400
      ),
    }
  }

  if (!isValidImageType(value.type)) {
    return {
      ok: false as const,
      response: errorResponse(
        'CREATOR_ONBOARDING_INVALID_PHOTO_TYPE',
        'Use uma foto em JPEG, PNG ou WebP.',
        400
      ),
    }
  }

  if (value.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false as const,
      response: errorResponse(
        'CREATOR_ONBOARDING_PHOTO_TOO_LARGE',
        'A foto é muito grande. Use uma imagem de até 20MB.',
        400
      ),
    }
  }

  const key = `creators/${userId}/profile/${Date.now()}-${crypto.randomUUID()}.${photoExtension(value.type)}`

  try {
    await uploadObject({
      key,
      body: new Uint8Array(await value.arrayBuffer()),
      contentType: value.type,
    })

    return {
      ok: true as const,
      photo: {
        key,
        url: getPublicUrl(key),
      },
    }
  } catch (err) {
    logPhotoError('upload_profile_photo', err)
    await cleanupUploadedPhoto({ key, url: '' })

    return {
      ok: false as const,
      response: errorResponse(
        'CREATOR_ONBOARDING_PHOTO_UPLOAD_ERROR',
        'Não foi possível salvar sua foto de perfil. Tente novamente.',
        500
      ),
    }
  }
}

async function validateCreatorAccountChannel(admin: any, userId: string, email: string | null) {
  const { data: userData, error: userError } = await admin
    .from('users')
    .select('id, email, role, operational_channel, signup_channel, role_locked_reason')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    console.error('[criadora/onboarding] users channel lookup', userError)
    return errorResponse(
      'ACCOUNT_CHANNEL_LOOKUP_ERROR',
      'Não foi possível validar a conta conectada.',
      500
    )
  }

  const account = userData as AccountChannelRow | null
  const channel = account?.operational_channel ?? account?.signup_channel ?? null

  if (!account) {
    return errorResponse(
      'ACCOUNT_CHANNEL_MISSING',
      'Não foi possível confirmar o canal desta conta. Entre novamente pelo fluxo de criadora.',
      403
    )
  }

  if (account.role === 'admin' || channel === 'admin') {
    return errorResponse(
      'ACCOUNT_ADMIN_NOT_ALLOWED',
      'Esta conta não pode criar perfil de criadora pelo fluxo público.',
      403
    )
  }

  if (channel !== 'creator') {
    return errorResponse(
      'ACCOUNT_CHANNEL_MISMATCH',
      'Esta conta já está vinculada a outro tipo de uso. Entre com uma conta própria de criadora.',
      409
    )
  }

  if (account.role_locked_reason === 'backfill_creator_pending_review') {
    return errorResponse(
      'ACCOUNT_CHANNEL_REVIEW_REQUIRED',
      'Esta conta precisa de revisão antes de continuar como criadora.',
      409
    )
  }

  const { data: agencyUser, error: agencyUserError } = await admin
    .from('agency_users')
    .select('id')
    .eq('user_id', userId)
    .eq('active', true)
    .limit(1)
    .maybeSingle()

  if (agencyUserError) {
    console.error('[criadora/onboarding] agency_users channel lookup', agencyUserError)
    return errorResponse(
      'ACCOUNT_AGENCY_LOOKUP_ERROR',
      'Não foi possível validar vínculos desta conta.',
      500
    )
  }

  if (agencyUser) {
    return errorResponse(
      'ACCOUNT_AGENCY_CONFLICT',
      'Esta conta já possui vínculo de agência e não pode criar perfil de criadora.',
      409
    )
  }

  const normalizedEmail = email?.trim().toLowerCase() || account.email?.trim().toLowerCase() || null

  if (normalizedEmail) {
    const { data: agencyEmail, error: agencyEmailError } = await admin
      .from('agencies')
      .select('id')
      .ilike('email', normalizedEmail.replace(/([%_\\])/g, '\\$1'))
      .limit(1)
      .maybeSingle()

    if (agencyEmailError) {
      console.error('[criadora/onboarding] agencies email lookup', agencyEmailError)
      return errorResponse(
        'ACCOUNT_AGENCY_EMAIL_LOOKUP_ERROR',
        'Não foi possível validar o e-mail desta conta.',
        500
      )
    }

    if (agencyEmail) {
      return errorResponse(
        'ACCOUNT_AGENCY_CONFLICT',
        'Este e-mail já está vinculado a uma agência e não pode criar perfil de criadora.',
        409
      )
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  let uploadedPhoto: UploadedPhoto | null = null

  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return auth.response
    }

    let form: FormData

    try {
      form = await request.formData()
    } catch {
      return errorResponse('CREATOR_ONBOARDING_INVALID_FORM', 'Dados inválidos.', 400)
    }

    const userId = auth.user.id
    const name = asTrimmedText(form.get('name'))
    const bio = asOptionalText(form.get('bio'))
    const pixCpf = asTrimmedText(form.get('pix_cpf')).replace(/\D/g, '')
    const priceTextPetals = asExpectedPrice(form.get('price_text_petals'), FIXED_TEXT_PRICE_PETALS)
    const priceVideoPetals = asExpectedPrice(form.get('price_video_petals'), FIXED_VIDEO_PRICE_PETALS)

    if (!name || name.length > 30) {
      return errorResponse('CREATOR_ONBOARDING_INVALID_NAME', 'Informe um nome de perfil válido.', 400)
    }

    if (bio && bio.length > 150) {
      return errorResponse('CREATOR_ONBOARDING_INVALID_BIO', 'A bio deve ter no máximo 150 caracteres.', 400)
    }

    if (!CPF_PATTERN.test(pixCpf)) {
      return errorResponse('CREATOR_ONBOARDING_INVALID_PIX_CPF', 'Informe um CPF Pix com 11 números.', 400)
    }

    if (priceTextPetals !== FIXED_TEXT_PRICE_PETALS || priceVideoPetals !== FIXED_VIDEO_PRICE_PETALS) {
      return errorResponse(
        'CREATOR_ONBOARDING_INVALID_PRICES',
        'Os preços do perfil não conferem com as regras atuais da plataforma.',
        400
      )
    }

    const admin = createAdminClient() as any
    const accountError = await validateCreatorAccountChannel(admin, userId, auth.user.email ?? null)

    if (accountError) {
      return accountError
    }

    const photoResult = await uploadProfilePhoto(userId, form.get('photo'))

    if (!photoResult.ok) {
      return photoResult.response
    }

    uploadedPhoto = photoResult.photo

    const { data: rpcData, error: rpcError } = await admin.rpc('submit_creator_onboarding', {
      p_user_id: userId,
      p_email: auth.user.email ?? null,
      p_name: name,
      p_bio: bio,
      p_photo_url: uploadedPhoto?.url ?? null,
      p_pix_key: pixCpf,
      p_price_text_petals: FIXED_TEXT_PRICE_PETALS,
      p_price_video_petals: FIXED_VIDEO_PRICE_PETALS,
    })

    const rpcResult = rpcData as SubmitCreatorOnboardingResult | null

    if (rpcError || !rpcResult?.success || !rpcResult.creator_id) {
      console.error('[criadora/onboarding] submit_creator_onboarding', rpcError ?? rpcResult)
      await cleanupUploadedPhoto(uploadedPhoto)
      return errorResponse(
        'CREATOR_ONBOARDING_RPC_ERROR',
        'Não foi possível enviar seu perfil para aprovação.',
        500
      )
    }

    const { data: confirmedCreator, error: confirmedCreatorError } = await admin
      .from('creators')
      .select('id, user_id, verified, active, photo_url')
      .eq('user_id', userId)
      .maybeSingle()

    const { data: confirmedUser, error: confirmedUserError } = await admin
      .from('users')
      .select('id, role, operational_channel')
      .eq('id', userId)
      .maybeSingle()

    const { data: confirmedVerification, error: confirmedVerificationError } = await admin
      .from('creator_verifications')
      .select('id, creator_id, user_id, status')
      .eq('creator_id', rpcResult.creator_id)
      .eq('user_id', userId)
      .maybeSingle()

    const verificationStatus = confirmedVerification?.status
    const hasValidVerification = verificationStatus === 'pending' || verificationStatus === 'approved'

    if (
      confirmedCreatorError ||
      confirmedUserError ||
      confirmedVerificationError ||
      !confirmedCreator ||
      confirmedCreator.user_id !== userId ||
      confirmedUser?.role !== 'creator' ||
      confirmedUser?.operational_channel !== 'creator' ||
      !confirmedVerification ||
      !hasValidVerification
    ) {
      console.error('[criadora/onboarding] post-rpc validation failed', {
        creator_error: confirmedCreatorError,
        user_error: confirmedUserError,
        verification_error: confirmedVerificationError,
        has_creator: Boolean(confirmedCreator),
        user_role: confirmedUser?.role,
        operational_channel: confirmedUser?.operational_channel,
        verification_status: verificationStatus,
      })

      return errorResponse(
        'CREATOR_ONBOARDING_CONFIRMATION_ERROR',
        'Não foi possível confirmar a criação do perfil.',
        500
      )
    }

    return NextResponse.json({
      success: true,
      creator_id: confirmedCreator.id,
      user_id: userId,
      role: confirmedUser.role,
      operational_channel: confirmedUser.operational_channel,
      verified: Boolean(confirmedCreator.verified),
      active: Boolean(confirmedCreator.active),
      photo_url: confirmedCreator.photo_url,
      verification_id: confirmedVerification.id,
      verification_status: verificationStatus,
    })
  } catch (err) {
    console.error('[criadora/onboarding]', err)
    await cleanupUploadedPhoto(uploadedPhoto)

    return errorResponse(
      'CREATOR_ONBOARDING_INTERNAL_ERROR',
      'Erro interno ao enviar o perfil para aprovação.',
      500
    )
  }
}
