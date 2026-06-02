import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { CreatorAreaContext } from '@/components/criadora/CreatorAreaShell'

type CreatorAreaAuth = {
  user: User
  creator: CreatorAreaContext
}

type UserRoleRow = {
  role: string | null
}

type CreatorRow = CreatorAreaContext

export async function requireCreatorAreaPage(): Promise<CreatorAreaAuth> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  const admin = createAdminClient() as any
  const [userRes, creatorRes] = await Promise.all([
    admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle(),
    admin
      .from('creators')
      .select('id, name, bio, photo_url, verified, active, rank_weekly, total_gifts, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const userRole = (userRes.data as UserRoleRow | null)?.role ?? null
  const creator = creatorRes.data as CreatorRow | null

  if (userRes.error || creatorRes.error) {
    console.error('[require creator area]', userRes.error ?? creatorRes.error)
    redirect('/feed')
  }

  if (!creator) {
    redirect(userRole === 'creator' ? '/criadora/onboarding' : '/feed')
  }

  if (!creator.verified || !creator.active) {
    redirect('/criadora/verificacao')
  }

  return {
    user,
    creator: {
      id: creator.id,
      name: creator.name,
      bio: creator.bio,
      photo_url: creator.photo_url,
      verified: Boolean(creator.verified),
      active: Boolean(creator.active),
      rank_weekly: creator.rank_weekly,
      total_gifts: creator.total_gifts,
    },
  }
}
