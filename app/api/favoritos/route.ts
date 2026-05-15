import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data } = await supabase
    .from('favorites')
    .select('creator_id, created_at, creators(id, name, photo_url, bio, price_text_petals, price_video_petals)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ favorites: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { creator_id } = await request.json()
  if (!creator_id) return NextResponse.json({ error: 'creator_id obrigatório' }, { status: 400 })

  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, creator_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ favorite: data })
}

export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { creator_id } = await request.json()
  if (!creator_id) return NextResponse.json({ error: 'creator_id obrigatório' }, { status: 400 })

  await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('creator_id', creator_id)

  return NextResponse.json({ ok: true })
}