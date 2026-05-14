import { createClient } from '@/lib/supabase/server'

export default async function AdminLivesPage() {
  const supabase = createClient()

  const { data: lives } = await supabase
    .from('lives')
    .select(`
      *,
      creators(id, name, photo_url)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const ativas = lives?.filter(l => l.status === 'active') ?? []
  const encerradas = lives?.filter(l => l.status === 'ended') ?? []

  const duracaoMedia = encerradas.length > 0
    ? encerradas.reduce((sum, l) => {
        if (!l.started_at || !l.ended_at) return sum
        const dur = (new Date(l.ended_at).getTime() - new Date(l.started_at).getTime()) / 60000
        return sum + dur
      }, 0) / encerradas.length
    : 0

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Chamadas e Lives</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Ativas agora', value: ativas.length, color: 'text-green-400' },
          { label: 'Total de lives', value: lives?.length ?? 0, color: 'text-white' },
          { label: 'Duração média', value: `${duracaoMedia.toFixed(0)} min`, color: 'text-[#ff4d7d]' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Lives ativas */}
      {ativas.length > 0 && (
        <>
          <h2 className="text-green-400 text-sm mb-3">🔴 Ao vivo agora</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ativas.map(l => (
              <div key={l.id} className="bg-green-400/10 border border-green-400/20 rounded-xl p-4">
                <div className="text-white/70 text-sm font-medium">{(l.creators as any)?.name}</div>
                <div className="text-green-400 text-xs mt-1">● Ao vivo</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Histórico */}
      <h2 className="text-white/50 text-sm mb-4">Histórico de lives</h2>
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Criadora</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Status</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Início</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Fim</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Duração</th>
              </tr>
            </thead>
            <tbody>
              {lives?.map(l => {
                const dur = l.started_at && l.ended_at
                  ? ((new Date(l.ended_at).getTime() - new Date(l.started_at).getTime()) / 60000).toFixed(0)
                  : null
                return (
                  <tr key={l.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                    <td className="px-4 py-3 text-white/70 text-sm">{(l.creators as any)?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        l.status === 'active' ? 'bg-green-400/20 text-green-400' : 'bg-white/5 text-white/30'
                      }`}>
                        {l.status === 'active' ? '● Ao vivo' : 'Encerrada'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs">
                      {l.started_at ? new Date(l.started_at).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs">
                      {l.ended_at ? new Date(l.ended_at).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {dur ? `${dur} min` : '—'}
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