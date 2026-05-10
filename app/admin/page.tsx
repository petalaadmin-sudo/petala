// app/admin/page.tsx
// Painel de administração — PROTEGIDO por verificação de role admin
// Acesse em: /admin (apenas usuários com role='admin' no banco)

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminPainelClient } from './AdminPainelClient'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verifica se é admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') redirect('/feed')

  // Busca verificações pendentes
  const { data: pending } = await supabase
    .from('creator_verifications')
    .select(`
      *,
      creators!inner (id, name, photo_url, price_text_petals, price_video_petals, bio),
      users!inner (email, created_at)
    `)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })

  // Busca stats gerais
  const [creatorsCount, usersCount, txTotal] = await Promise.all([
    supabase.from('creators').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('transactions').select('amount_brl').eq('status', 'completed').eq('type', 'purchase'),
  ])

  const totalRevenue = txTotal.data?.reduce((sum, tx) => sum + Number(tx.amount_brl || 0), 0) ?? 0

  return (
    <AdminPainelClient
      pending={pending ?? []}
      stats={{
        creators: creatorsCount.count ?? 0,
        users:    usersCount.count ?? 0,
        revenue:  totalRevenue,
      }}
    />
  )
}
