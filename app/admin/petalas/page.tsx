import { createClient } from '@/lib/supabase/server'

export default async function AdminPetalasPage() {
  const supabase = createClient()

  const { data: pacotes } = await supabase
    .from('pacotes_de_pétalas')
    .select('*')
    .order('price', { ascending: true })

  const { data: topUsers } = await supabase
    .from('users')
    .select('id, email, username, balance_petals')
    .order('balance_petals', { ascending: false })
    .limit(10)

  const { data: txStats } = await supabase
    .from('transactions')
    .select('petals_delta, type, status')
    .eq('status', 'completed')

  const totalPetalasVendidas = txStats
    ?.filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + (t.petals_delta || 0), 0) ?? 0

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Sistema de Pétalas</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: 'Total pétalas vendidas', value: totalPetalasVendidas.toLocaleString('pt-BR'), icon: '🌸', color: 'text-[#ff4d7d]' },
          { label: 'Pacotes disponíveis', value: pacotes?.length ?? 0, icon: '📦', color: 'text-white' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pacotes */}
      <h2 className="text-white/50 text-sm mb-4">Pacotes de pétalas</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {pacotes?.map(p => (
          <div key={p.id} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-[#ff4d7d] text-lg font-medium">{p.petals?.toLocaleString('pt-BR')} 🌸</div>
            <div className="text-white/50 text-sm mt-1">{p.name}</div>
            <div className="text-yellow-400 text-sm font-medium mt-2">
              R$ {(p.price / 100).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Top usuários por saldo */}
      <h2 className="text-white/50 text-sm mb-4">Top usuários por saldo</h2>
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-white/30 text-xs px-4 py-3">#</th>
              <th className="text-left text-white/30 text-xs px-4 py-3">Email</th>
              <th className="text-left text-white/30 text-xs px-4 py-3">Username</th>
              <th className="text-left text-white/30 text-xs px-4 py-3">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {topUsers?.map((u, i) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                <td className="px-4 py-3 text-white/20 text-sm">{i + 1}</td>
                <td className="px-4 py-3 text-white/50 text-xs">{u.email}</td>
                <td className="px-4 py-3 text-white/40 text-xs">{u.username || '—'}</td>
                <td className="px-4 py-3 text-[#ff4d7d] text-sm font-medium">
                  {u.balance_petals?.toLocaleString('pt-BR')} 🌸
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}