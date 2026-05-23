import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

type ConsumerUser = {
  id: string
  email: string | null
  username: string | null
  role: string | null
  balance_petals: number | null
  vip_until: string | null
  created_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('pt-BR')
}

function AdminUsuariosError() {
  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Usuarios</h1>

      <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 text-red-200 text-sm">
        Erro ao carregar usuarios.
      </div>
    </div>
  )
}

export default async function AdminUsuariosPage() {
  const admin = createAdminClient() as any

  const { data, error } = await admin.rpc('admin_list_consumer_users', {
    p_limit: 100,
    p_offset: 0,
    p_search: null,
  })

  if (error) {
    console.error('[admin/usuarios] admin_list_consumer_users', error)
    return <AdminUsuariosError />
  }

  const users = (data ?? []) as ConsumerUser[]

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Usuarios</h1>

      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Email</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Username</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Petalas</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Role</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">VIP</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                  <td className="px-4 py-3 text-white/70 text-sm">{user.email ?? '-'}</td>
                  <td className="px-4 py-3 text-white/50 text-sm">{user.username || '-'}</td>
                  <td className="px-4 py-3 text-[#ff4d7d] text-sm font-medium">{user.balance_petals ?? 0} petalas</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                      {user.role ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs">{formatDate(user.vip_until)}</td>
                  <td className="px-4 py-3 text-white/30 text-xs">{formatDate(user.created_at)}</td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/30 text-sm">
                    Nenhum consumidor encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
