// app/criadora/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CreatorProfileClient } from './CreatorProfileClient'

interface Props {
  params: { id: string }
}

// Server Component — busca dados da criadora
export default async function CreatorProfilePage({ params }: Props) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Busca criadora + fotos + VIP status em paralelo
  const [creatorRes, photosRes, userRes, vipRes] = await Promise.all([
    supabase
      .from('creators')
      .select('id, name, bio, photo_url, rating, rating_count, total_gifts, rank_weekly, price_text_petals, price_video_petals, verified')
      .eq('id', params.id)
      .eq('active', true)
      .single(),

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

  return (
    <CreatorProfileClient
      creator={creatorRes.data}
      photos={photosRes.data ?? []}
      userBalance={userRes.data?.balance_petals ?? 0}
      isVip={!!vipRes.data}
      userId={user.id}
    />
  )
}
