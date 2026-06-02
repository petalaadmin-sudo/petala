export type AccountRedirectTarget =
  | '/admin'
  | '/agencia'
  | '/criadora/dashboard'
  | '/criadora/verificacao'
  | '/criadora/onboarding'
  | '/feed'

type ResolveRedirectOptions = {
  strict?: boolean
  logPrefix?: string
}

type ResolveRedirectResult = {
  redirectTo: AccountRedirectTarget
  reason: string
}

type SupabaseLike = {
  from: (table: string) => any
}

function logLookupError(prefix: string | undefined, table: string, error: unknown) {
  if (!prefix) return
  console.error(`[${prefix}] ${table}`, error)
}

function handleLookupError(
  options: ResolveRedirectOptions,
  table: string,
  error: unknown
) {
  logLookupError(options.logPrefix, table, error)

  if (options.strict) {
    throw new Error(`REDIRECT_TARGET_${table.toUpperCase()}_LOOKUP_FAILED`)
  }
}

export async function resolveAccountRedirectTarget(
  client: SupabaseLike,
  userId: string,
  options: ResolveRedirectOptions = {}
): Promise<ResolveRedirectResult> {
  const { data: userData, error: userError } = await client
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    handleLookupError(options, 'users', userError)
  }

  if (userData?.role === 'admin') {
    return { redirectTo: '/admin', reason: 'admin_role' }
  }

  if (userData?.role === 'creator') {
    const { data: creator, error: creatorError } = await client
      .from('creators')
      .select('id, verified, active, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (creatorError) {
      handleLookupError(options, 'creators', creatorError)
    }

    if (creator) {
      if (creator.verified && creator.active) {
        return { redirectTo: '/criadora/dashboard', reason: 'active_verified_creator_role' }
      }

      return { redirectTo: '/criadora/verificacao', reason: 'creator_role_pending_verification_or_activation' }
    }

    return { redirectTo: '/criadora/onboarding', reason: 'creator_role_without_creator_profile' }
  }

  const { data: agencyUser, error: agencyError } = await client
    .from('agency_users')
    .select('id, agencies!inner(active)')
    .eq('user_id', userId)
    .eq('active', true)
    .eq('agencies.active', true)
    .limit(1)
    .maybeSingle()

  if (agencyError) {
    handleLookupError(options, 'agency_users', agencyError)
  }

  if (agencyUser) {
    return { redirectTo: '/agencia', reason: 'active_agency_user_and_agency' }
  }

  return { redirectTo: '/feed', reason: 'default_user' }
}
