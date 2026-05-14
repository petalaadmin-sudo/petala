import { createClient } from '@/lib/supabase/server'

export default async function AdminCriadorasPage() {
  const supabase = createClient()

  const { data: creators } = await supabase
    .from('creators')
    .select('id, name, bio, active, verified, verified_at, created_at, price_text_petals, price_video_petals, category')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: pending } = await supabase
    .from('creator_verifications')
    .select('id, creator_id, submitted_at, status')
    .eq('status', 'pending')

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-2">Criadoras</h1>

      {/* Pendentes */}
      {pending && pending.length > 0 && (
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="text-yellow-400 text-sm">
            ⚠️ {pending.length} verificação{pending.length > 1 ? 'ões' : ''} pendente{pending.length > 1 ? 's' : ''}
          </div>
          <a href="/admin" className="text-yellow-400 text-xs underline">Revisar</a>
        </div>
      )}

      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Nome</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Categoria</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Preço texto</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Preço vídeo</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Verificada</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Ativa</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {creators?.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                  <td className="px-4 py-3 text-white/70 text-sm font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{c.category || '—'}</td>
                  <td className="px-4 py-3 text-[#ff4d7d] text-sm">{c.price_text_petals} 🌸</td>
                  <td className="px-4 py-3 text-[#ff4d7d] text-sm">{c.price_video_petals} 🌸</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.verified ? 'bg-green-400/20 text-green-400' : 'bg-white/5 text-white/30'
                    }`}>
                      {c.verified ? '✓ Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.active ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
                    }`}>
                      {c.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs">
                    {new Date(c.created_at).toLocaleDateString('pt-BR')}
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