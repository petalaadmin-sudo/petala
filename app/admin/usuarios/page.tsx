import { createClient } from '@/lib/supabase/server'

export default async function AdminUsuariosPage() {
  const supabase = createClient()

  const { data: users } = await supabase
    .from('users')
    .select('id, email, username, balance_petals, role, created_at, vip_until')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Usuários</h1>

      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Email</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Username</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Pétalas</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Role</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">VIP</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {users?.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                  <td className="px-4 py-3 text-white/70 text-sm">{u.email}</td>
                  <td className="px-4 py-3 text-white/50 text-sm">{u.username || '—'}</td>
                  <td className="px-4 py-3 text-[#ff4d7d] text-sm font-medium">{u.balance_petals} 🌸</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-white/5 text-white/40'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs">
                    {u.vip_until ? new Date(u.vip_until).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}