import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminMenu } from './AdminMenu'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') redirect('/feed')

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <AdminMenu />
      <main className="flex-1 ml-56 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}