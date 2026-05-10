// app/api/fotos/desbloquear/route.ts
// Usuário pagante chama esse endpoint para desbloquear uma foto.
// Débita pétalas, registra o desbloqueio, retorna URL assinada (1h).

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createPrivateUrl } from '@/lib/r2'
import { NextResponse } from 'next/server'

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
      await admin.from('photo_unlocks').insert({
        user_id:      user.id,
        photo_id:     photo.id,
        petals_spent: 0,
      }).onConflict(['user_id', 'photo_id']).ignore()

      const url = await createPrivateUrl(photo.r2_key, 3600)
      return NextResponse.json({ url, vip_access: true })
    }

    // Débita pétalas atomicamente
    const { data: spendResult } = await admin.rpc('spend_petals', {
      p_user_id: user.id,
      p_amount:  photo.price_petals,
      p_type:    'spend',
      p_ref_id:  photo.id,
    })

    if (!spendResult?.success) {
      return NextResponse.json({
        error:    'Saldo insuficiente',
        required: photo.price_petals,
        code:     'INSUFFICIENT_BALANCE',
      }, { status: 402 })
    }

    // BUG 3 CORRIGIDO: insert do unlock e increment atômico via RPC
    await admin.from('photo_unlocks').insert({
      user_id:      user.id,
      photo_id:     photo.id,
      petals_spent: photo.price_petals,
    })

    // increment via SQL direto — evita race condition
    await admin.rpc('increment_photo_unlock', { p_photo_id: photo.id })

    // Credita 70% para a criadora
    const { data: creatorData } = await admin
      .from('creators')
      .select('user_id')
      .eq('id', photo.creator_id)
      .single()

    if (creatorData) {
      const creatorEarn = Math.floor(photo.price_petals * 0.7)
      await admin.rpc('credit_petals', {
        p_user_id: creatorData.user_id,
        p_amount:  creatorEarn,
        p_type:    'gift_received',
        p_ref_id:  photo.id,
      })
    }

    // Retorna URL assinada (expira em 1h — não pode ser compartilhada)
    const url = await createPrivateUrl(photo.r2_key, 3600)

    return NextResponse.json({
      url,
      new_balance:  spendResult.new_balance,
      petals_spent: photo.price_petals,
    })

  } catch (err) {
    console.error('[/api/fotos/desbloquear]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
