// app/api/fotos/desbloquear/route.ts
// Retorna URL assinada para fotos gratuitas, já desbloqueadas ou acessíveis por VIP.
// Desbloqueio pago está temporariamente bloqueado até existir fluxo financeiro auditável.

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createPrivateUrl } from '@/lib/r2'
import { NextResponse } from 'next/server'

const PAID_PHOTO_UNLOCK_DISABLED = {
  code: 'PHOTO_UNLOCK_PAID_DISABLED',
  error: 'Desbloqueio pago de fotos temporariamente indisponível enquanto o fluxo financeiro auditável é implementado.',
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { photo_id } = await request.json()
    if (!photo_id) return NextResponse.json({ error: 'photo_id obrigatório' }, { status: 400 })

    const admin = createAdminClient()

    // Busca a foto
    const { data: photo } = await admin
      .from('album_photos')
      .select('id, r2_key, is_free, price_petals, creator_id')
      .eq('id', photo_id)
      .single()

    if (!photo) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })

    // Se foto gratuita, apenas retorna URL sem débito
    if (photo.is_free) {
      const url = await createPrivateUrl(photo.r2_key, 3600)
      return NextResponse.json({ url, already_unlocked: true })
    }

    // Verifica se o usuário já desbloqueou esta foto
    const { data: existingUnlock } = await admin
      .from('photo_unlocks')
      .select('id')
      .eq('user_id', user.id)
      .eq('photo_id', photo_id)
      .single()

    if (existingUnlock) {
      // Já desbloqueou — só gera nova URL assinada sem cobrar de novo
      const url = await createPrivateUrl(photo.r2_key, 3600)
      return NextResponse.json({ url, already_unlocked: true })
    }

    // Verifica VIP — VIP tem acesso a todas as fotos da criadora
    const { data: vip } = await admin
      .from('vip_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('creator_id', photo.creator_id)
      .eq('active', true)
      .gt('ends_at', new Date().toISOString())
      .single()

    if (vip) {
      // VIP — acesso sem débito, mas registra o acesso
      const { error: unlockError } = await admin.from('photo_unlocks').insert({
        user_id:      user.id,
        photo_id:     photo.id,
        petals_spent: 0,
      })

      if (unlockError && unlockError.code !== '23505') {
        console.error('[/api/fotos/desbloquear] erro ao registrar acesso VIP', {
          code: unlockError.code,
          message: unlockError.message,
        })
        return NextResponse.json({ error: 'Não foi possível registrar acesso VIP' }, { status: 500 })
      }

      const url = await createPrivateUrl(photo.r2_key, 3600)
      return NextResponse.json({ url, vip_access: true })
    }

    return NextResponse.json(PAID_PHOTO_UNLOCK_DISABLED, { status: 423 })

  } catch (err) {
    console.error('[/api/fotos/desbloquear]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
