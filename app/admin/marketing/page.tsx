import { createClient } from '@/lib/supabase/server'

export default async function AdminMarketingPage() {
  const supabase = createClient()

  const { data: referrals } = await supabase
    .from('users')
    .select('id, email, username, referral_code, referred_by, first_purchase_done, created_at')
    .not('referral_code', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: commissions } = await supabase
    .from('comissões_de_indicação')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const totalIndicacoes = referrals?.filter(u => u.referred_by).length ?? 0
  const totalComissoes = commissions?.reduce((sum, c) => sum + Number(c.amount || 0), 0) ?? 0

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Marketing e Crescimento</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total indicações', value: totalIndicacoes, icon: '🔗', color: 'text-white' },
          { label: 'Com compra', value: referrals?.filter(u => u.first_purchase_done).length ?? 0, icon: '✅', color: 'text-green-400' },
          { label: 'Comissões pagas', value: `${totalComissoes} 🌸`, icon: '💸', color: 'text-[#ff4d7d]' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Programa de indicação */}
      <h2 className="text-white/50 text-sm mb-4">Programa de indicação</h2>
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Email</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Código</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Indicado por</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">1ª compra</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {referrals?.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                  <td className="px-4 py-3 text-white/50 text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-[#ff4d7d] text-xs font-mono">{u.referral_code || '—'}</td>
                  <td className="px-4 py-3 text-white/30 text-xs">{u.referred_by ? '✓ Sim' : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.first_purchase_done ? 'bg-green-400/20 text-green-400' : 'bg-white/5 text-white/30'
                    }`}>
                      {u.first_purchase_done ? '✓ Sim' : 'Não'}
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
    </div>
  )
}