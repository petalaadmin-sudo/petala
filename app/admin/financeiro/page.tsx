import { createClient } from '@/lib/supabase/server'

export default async function AdminFinanceiroPage() {
  const supabase = createClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, user_id, type, petals_delta, amount_brl, status, created_at, metadata, users(email)')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: allUsers } = await supabase
    .from('users')
    .select('id')

  const totalReceita = transactions
    ?.filter(t => t.status === 'completed' && t.type === 'purchase')
    .reduce((sum, t) => sum + Number(t.amount_brl || 0), 0) ?? 0

  const totalHoje = transactions
    ?.filter(t => {
      const hoje = new Date()
      const data = new Date(t.created_at)
      return t.status === 'completed' && t.type === 'purchase' && data.toDateString() === hoje.toDateString()
    })
    .reduce((sum, t) => sum + Number(t.amount_brl || 0), 0) ?? 0

  const totalTransacoes = transactions?.filter(t => t.status === 'completed' && t.type === 'purchase').length ?? 0
  const ticketMedio = totalTransacoes > 0 ? totalReceita / totalTransacoes : 0
  const totalUsers = Math.max(allUsers?.length ?? 1, 1)
  const arpu = totalReceita / totalUsers
  const lucroLiquido = totalReceita * 0.7
  const lucroPlatforma = totalReceita * 0.3

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Financeiro</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Receita total', value: `R$ ${totalReceita.toFixed(2)}`, icon: '💰', color: 'text-yellow-400' },
          { label: 'Receita hoje', value: `R$ ${totalHoje.toFixed(2)}`, icon: '📅', color: 'text-green-400' },
          { label: 'Ticket médio', value: `R$ ${ticketMedio.toFixed(2)}`, icon: '🎫', color: 'text-white' },
          { label: 'Transações', value: totalTransacoes, icon: '🔄', color: 'text-white' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'ARPU', value: `R$ ${arpu.toFixed(2)}`, icon: '👤', color: 'text-blue-400', desc: 'Receita por usuário' },
          { label: 'Lucro plataforma (30%)', value: `R$ ${lucroPlatforma.toFixed(2)}`, icon: '🏦', color: 'text-[#ff4d7d]', desc: 'Comissão Pétala' },
          { label: 'Repasse criadoras (70%)', value: `R$ ${lucroLiquido.toFixed(2)}`, icon: '🌸', color: 'text-green-400', desc: 'Para as criadoras' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
            <div className="text-white/15 text-[10px] mt-0.5">{s.desc}</div>
          </div>
        ))}
      </div>

      <h2 className="text-white/50 text-sm mb-4">Transações recentes</h2>
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Usuário</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Tipo</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Pétalas</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Valor</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Plataforma</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Status</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.map(t => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                  <td className="px-4 py-3 text-white/50 text-xs">{(t.users as any)?.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-white/5 text-white/40 px-2 py-0.5 rounded-full">{t.type}</span>
                  </td>
                  <td className="px-4 py-3 text-[#ff4d7d] text-sm">{t.petals_delta} 🌸</td>
                  <td className="px-4 py-3 text-yellow-400 text-sm font-medium">
                    {t.amount_brl ? `R$ ${Number(t.amount_brl).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-[#ff4d7d] text-xs">
                    {t.amount_brl ? `R$ ${(Number(t.amount_brl) * 0.3).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      t.status === 'completed' ? 'bg-green-400/20 text-green-400' :
                      t.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-red-400/20 text-red-400'
                    }`}>
                      {t.status}
                    </span>
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