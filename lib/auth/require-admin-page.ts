import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type AdminPageAuth = {
  user: User
}

type UserRoleRow = {
  role: string | null
}

export async function requireAdminPage(): Promise<AdminPageAuth> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  const admin = createAdminClient() as any
  const { data: userData, error: roleError } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const roleRow = userData as UserRoleRow | null

  if (roleError || roleRow?.role !== 'admin') {
    redirect('/feed')
  }

  return { user }
}
