import { createClient } from '@/lib/supabase/server'
import CreatorVerificationActions from './CreatorVerificationActions'

export default async function AdminModeracaoPage() {
  const supabase = createClient()

  const { data: verifications } = await supabase
    .from('creator_verifications')
    .select(`
      *,
      creators(id, name, photo_url, bio),
      users(email, created_at)
    `)
    .order('submitted_at', { ascending: false })
    .limit(50)

  const pendentes = verifications?.filter(v => v.status === 'pending') ?? []
  const aprovadas = verifications?.filter(v => v.status === 'approved') ?? []
  const rejeitadas = verifications?.filter(v => v.status === 'rejected') ?? []

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Moderação e Segurança</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pendentes', value: pendentes.length, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
          { label: 'Aprovadas', value: aprovadas.length, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
          { label: 'Rejeitadas', value: rejeitadas.length, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.bg}`}>
            <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Verificações */}
      <h2 className="text-white/50 text-sm mb-4">Verificações de criadoras</h2>
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Criadora</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Email</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Status</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Enviado em</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Revisado em</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {verifications?.map(v => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                  <td className="px-4 py-3 text-white/70 text-sm">{(v.creators as any)?.name || '—'}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{(v.users as any)?.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      v.status === 'approved' ? 'bg-green-400/20 text-green-400' :
                      v.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-red-400/20 text-red-400'
                    }`}>
                      {v.status === 'approved' ? '✓ Aprovada' :
                       v.status === 'pending' ? '⏳ Pendente' : '✕ Rejeitada'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs">
                    {new Date(v.submitted_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs">
                    {v.reviewed_at ? new Date(v.reviewed_at).toLocaleString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <CreatorVerificationActions verificationId={v.id} status={v.status} />
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
