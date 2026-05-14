import { createClient } from '@/lib/supabase/server'

export default async function AdminSuportePage() {
  const supabase = createClient()

  const { data: recentUsers } = await supabase
    .from('users')
    .select('id, email, username, balance_petals, created_at, role')
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('id, user_id, type, petals_delta, amount_brl, status, created_at, users(email)')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Atendimento e Suporte</h1>

      {/* Info */}
      <div className="bg-[#111] rounded-xl p-4 border border-white/5 mb-6">
        <p className="text-white/40 text-sm">
          Use esta seção para consultar dados de usuários e transações recentes para ajudar no suporte.
          Sistema de tickets em breve.
        </p>
      </div>

      {/* Usuários recentes */}
      <h2 className="text-white/50 text-sm mb-4">Usuários recentes</h2>
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Email</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Username</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Saldo</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Role</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers?.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                  <td className="px-4 py-3 text-white/70 text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{u.username || '—'}</td>
                  <td className="px-4 py-3 text-[#ff4d7d] text-xs">{u.balance_petals} 🌸</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-white/5 text-white/30'
                    }`}>
                      {u.role}
                    </span>
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

      {/* Transações recentes */}
      <h2 className="text-white/50 text-sm mb-4">Transações recentes</h2>
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Email</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Tipo</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Pétalas</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Valor</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions?.map(t => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                  <td className="px-4 py-3 text-white/50 text-xs">{(t.users as any)?.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-white/5 text-white/40 px-2 py-0.5 rounded-full">
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#ff4d7d] text-xs">{t.petals_delta} 🌸</td>
                  <td className="px-4 py-3 text-yellow-400 text-xs">
                    {t.amount_brl ? `R$ ${Number(t.amount_brl).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs">
                    {new Date(t.created_at).toLocaleString('pt-BR')}
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