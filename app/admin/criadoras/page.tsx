import { createClient } from '@/lib/supabase/server'

export default async function AdminCriadorasPage() {
  const supabase = createClient()

  const { data: creators } = await supabase
    .from('criadores')
    .select('id, name, bio, active, verified, verified_at, created_at, price_text_petals, price_video_petals, category')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: pending } = await supabase
    .from('verificações_do_criador')
    .select('id, creator_id, submitted_at, status')
    .eq('status', 'pending')

  const { data: gifts } = await supabase
    .from('gifts')
    .select('creator_id, petals_amount')

  const { data: lives } = await supabase
    .from('vidas')
    .select('creator_id, status, started_at, ended_at')

  function getNivel(petalsTotal: number) {
    if (petalsTotal >= 10000) return { label: 'Diamante', color: 'text-blue-400', bg: 'bg-blue-400/20' }
    if (petalsTotal >= 5000) return { label: 'Ouro', color: 'text-yellow-400', bg: 'bg-yellow-400/20' }
    if (petalsTotal >= 1000) return { label: 'Prata', color: 'text-white/70', bg: 'bg-white/10' }
    return { label: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-400/20' }
  }

  function getScore(creatorId: string) {
    const totalGifts = gifts?.filter(g => g.creator_id === creatorId)
      .reduce((sum, g) => sum + (g.petals_amount || 0), 0) ?? 0
    const totalLives = lives?.filter(l => l.creator_id === creatorId).length ?? 0
    const score = Math.min(100, Math.round((totalGifts / 100) + (totalLives * 5)))
    return { totalGifts, totalLives, score }
  }

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-2">Criadoras</h1>

      {pending && pending.length > 0 && (
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="text-yellow-400 text-sm">
            ⚠️ {pending.length} verificação(ões) pendente(s)
          </div>
          <a href="/admin/moderacao" className="text-yellow-400 text-xs underline">Revisar</a>
        </div>
      )}

      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Nome</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Nível</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Score</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Gifts</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Lives</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Preço texto</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Verificada</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Ativa</th>
              </tr>
            </thead>
            <tbody>
              {creators?.map(c => {
                const { totalGifts, totalLives, score } = getScore(c.id)
                const nivel = getNivel(totalGifts)
                return (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                    <td className="px-4 py-3 text-white/70 text-sm font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${nivel.bg} ${nivel.color}`}>
                        {nivel.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-white/5 rounded-full h-1.5">
                          <div className="bg-[#ff4d7d] h-1.5 rounded-full" style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-white/40 text-xs">{score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#ff4d7d] text-xs">{totalGifts} 🌸</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{totalLives}</td>
                    <td className="px-4 py-3 text-[#ff4d7d] text-xs">{c.price_text_petals} 🌸</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.verified ? 'bg-green-400/20 text-green-400' : 'bg-white/5 text-white/30'}`}>
                        {c.verified ? '✓ Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.active ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                        {c.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}