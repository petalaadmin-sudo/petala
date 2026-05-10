// app/api/fotos/deletar/route.ts
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { deleteObject } from '@/lib/r2'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { photo_id } = await request.json()
    if (!photo_id) return NextResponse.json({ error: 'photo_id obrigatório' }, { status: 400 })

    const admin = createAdminClient()

    // Busca e valida propriedade
    const { data: photo } = await admin
      .from('album_photos')
      .select('*, creators!inner(user_id)')
      .eq('id', photo_id)
      .single()

    if (!photo)                        return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })
    if (photo.creators.user_id !== user.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

    // Deleta do R2 (foto + blur)
    await Promise.allSettled([
      deleteObject(photo.r2_key),
      photo.r2_key_blur ? deleteObject(photo.r2_key_blur) : Promise.resolve(),
    ])

    // Deleta do banco (cascade deleta photo_unlocks)
    await admin.from('album_photos').delete().eq('id', photo_id)

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[/api/fotos/deletar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
