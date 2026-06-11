import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { CreatorAreaContext } from '@/components/criadora/CreatorAreaShell'

type CreatorAreaAuth = {
  user: User
  creator: CreatorAreaContext
}

type CreatorAreaUserRow = {
  role: string | null
  operational_channel: string | null
  role_locked_reason: string | null
}

type AgencyUserRow = {
  id: string
}

type CreatorRow = CreatorAreaContext

export async function requireCreatorAreaPage(): Promise<CreatorAreaAuth> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/criadora/onboarding')
  }

  const admin = createAdminClient() as any
  const [userRes, agencyUserRes, creatorRes] = await Promise.all([
    admin
      .from('users')
      .select('role, operational_channel, role_locked_reason')
      .eq('id', user.id)
      .maybeSingle(),
    admin
      .from('agency_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('active', true)
      .limit(1)
      .maybeSingle(),
    admin
      .from('creators')
      .select('id, name, bio, photo_url, verified, active, rank_weekly, total_gifts, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const account = userRes.data as CreatorAreaUserRow | null
  const agencyUser = agencyUserRes.data as AgencyUserRow | null
  const creator = creatorRes.data as CreatorRow | null

  if (userRes.error || agencyUserRes.error || creatorRes.error) {
    console.error('[require creator area]', userRes.error ?? agencyUserRes.error ?? creatorRes.error)
    redirect('/criadora/onboarding')
  }

  if (
    !account ||
    account.role !== 'creator' ||
    account.operational_channel !== 'creator' ||
    account.role_locked_reason === 'backfill_creator_pending_review' ||
    agencyUser
  ) {
    redirect('/criadora/onboarding')
  }

  if (!creator) {
    redirect('/criadora/onboarding')
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
