// app/api/criadora/verificar/route.ts
// Recebe os documentos via FormData, salva no R2 (bucket privado),
// notifica admin via e-mail e marca a criadora como pending_review.

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const form = await request.formData()
    const documento = form.get('documento') as File | null
    const selfie    = form.get('selfie')    as File | null
    const cpf       = form.get('cpf')       as string | null

    if (!documento || !selfie || !cpf) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    // Valida CPF (11 dígitos)
    const cpfClean = cpf.replace(/\D/g, '')
    if (cpfClean.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Busca criadora
    const { data: creator } = await admin
      .from('creators')
      .select('id, verified')
      .eq('user_id', user.id)
      .single()

    if (!creator) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    if (creator.verified) return NextResponse.json({ error: 'Já verificada' }, { status: 409 })

    // Upload dos docs para R2 (bucket privado — sem URL pública)
    const R2_URL    = process.env.NEXT_PUBLIC_APP_URL
    const timestamp = Date.now()
    const docKey    = `verificacao/${creator.id}/${timestamp}_documento.jpg`
    const selfieKey = `verificacao/${creator.id}/${timestamp}_selfie.jpg`

    // Salva localmente via Supabase Storage (alternativa ao R2 para docs privados)
    const [docRes, selfieRes] = await Promise.all([
      admin.storage.from('verificacoes').upload(docKey, await documento.arrayBuffer(), {
        contentType: 'image/jpeg',
        upsert: true,
      }),
      admin.storage.from('verificacoes').upload(selfieKey, await selfie.arrayBuffer(), {
        contentType: 'image/jpeg',
        upsert: true,
      }),
    ])

    // Atualiza criadora com CPF e status pending
    await admin
      .from('creators')
      .update({
        pix_key: cpfClean,  // usa CPF como chave Pix padrão
        verified: false,     // será aprovada manualmente pelo admin
      })
      .eq('id', creator.id)

    // Salva na tabela de verificações pendentes (para o painel admin)
    await admin.from('creator_verifications').upsert({
      creator_id:   creator.id,
      user_id:      user.id,
      doc_key:      docKey,
      selfie_key:   selfieKey,
      cpf_hash:     cpfClean,  // em produção: armazenar como hash bcrypt
      status:       'pending',
      submitted_at: new Date().toISOString(),
    }).onConflict(['creator_id'])

    // Notifica admin por e-mail (Resend)
    const RESEND_KEY = process.env.RESEND_API_KEY
    if (RESEND_KEY) {
      await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from:    'noreply@petala.app',
          to:      ['admin@petala.app'],
          subject: `[Pétala] Nova verificação — criadora ${creator.id}`,
          html:    `<p>Nova criadora aguardando verificação.</p><p>Creator ID: ${creator.id}</p><p>Acesse o painel admin para aprovar.</p>`,
        }),
      }).catch(console.error)
    }

    return NextResponse.json({ success: true, message: 'Documentos recebidos. Revisão em até 24h.' })

  } catch (err) {
    console.error('[/api/criadora/verificar]', err)
    return NextResponse.json({ error: 'Erro ao processar documentos' }, { status: 500 })
  }
}
