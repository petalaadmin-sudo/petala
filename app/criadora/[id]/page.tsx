// app/criadora/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CreatorProfileClient } from './CreatorProfileClient'

interface Props {
  params: { id: string }
}

type AnonymousAlbumPhoto = {
  id: string
  blur_hash: string | null
  is_free: boolean
  price_petals: number
  unlock_count: number | null
}

// Server Component - busca dados da criadora
export default async function CreatorProfilePage({ params }: Props) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const creatorQuery = supabase
    .from('creators')
    .select('id, name, bio, photo_url, rating, rating_count, total_gifts, rank_weekly, price_text_petals, price_video_petals, verified')
    .eq('id', params.id)
    .eq('active', true)
    .eq('verified', true)
    .maybeSingle()

  if (!user) {
    const [creatorRes, photosRes] = await Promise.all([
      creatorQuery,
      supabase
        .from('album_photos')
        .select('id, blur_hash, is_free, price_petals, unlock_count, sort_order')
        .eq('creator_id', params.id)
        .eq('is_free', true)
        .eq('price_petals', 0)
        .order('sort_order', { ascending: false }),
    ])

    if (!creatorRes.data) notFound()

    const creator = {
      ...creatorRes.data,
      photo_url: creatorRes.data.photo_url
        ? `/api/fotos/perfil-url?creator_id=${encodeURIComponent(creatorRes.data.id)}`
        : null,
    }

    const publicPhotos = ((photosRes.data ?? []) as AnonymousAlbumPhoto[]).map(photo => ({
      id:           photo.id,
      r2_key:       '',
      r2_key_blur:  null,
      blur_hash:    photo.blur_hash,
      is_free:      true,
      price_petals: 0,
      unlock_count: photo.unlock_count ?? 0,
      is_unlocked:  true,
    }))

    return (
      <CreatorProfileClient
        creator={creator}
        photos={publicPhotos}
        userBalance={0}
        isVip={false}
        userId=""
      />
    )
  }

  // Busca criadora + fotos + VIP status em paralelo para usuario autenticado
  const [creatorRes, photosRes, userRes, vipRes] = await Promise.all([
    creatorQuery,

    supabase.rpc('get_creator_album', {
      p_creator_id: params.id,
      p_user_id:    user.id,
    }),

    supabase
      .from('users')
      .select('balance_petals')
      .eq('id', user.id)
      .single(),

    supabase
      .from('vip_subscriptions')
      .select('id, ends_at')
      .eq('user_id', user.id)
      .eq('creator_id', params.id)
      .eq('active', true)
      .gt('ends_at', new Date().toISOString())
      .single(),
  ])

  if (!creatorRes.data) notFound()

  const creator = {
    ...creatorRes.data,
    photo_url: creatorRes.data.photo_url
      ? `/api/fotos/perfil-url?creator_id=${encodeURIComponent(creatorRes.data.id)}`
      : null,
  }

  return (
    <CreatorProfileClient
      creator={creator}
      photos={photosRes.data ?? []}
      userBalance={userRes.data?.balance_petals ?? 0}
      isVip={!!vipRes.data}
      userId={user.id}
    />
  )
}
