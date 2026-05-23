import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function AdminError({ message }: { message: string }) {
  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Criadoras</h1>

      <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 text-red-200 text-sm">
        {message}
      </div>
    </div>
  )
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-BR')
}

export default async function AdminCriadorasPage() {
  const supabase = createAdminClient()

  const { data: creators, error: creatorsError } = await supabase
    .from('creators')
    .select('id, user_id, name, active, verified, verified_at, created_at, price_text_petals, price_video_petals, total_gifts, total_earnings_petals, rating, rating_count, agency_id')
    .order('created_at', { ascending: false })
    .limit(100)

  if (creatorsError) {
    console.error('[admin/criadoras] Failed to load creators', creatorsError)
    return <AdminError message="Erro ao carregar criadoras." />
  }

  const creatorRows = creators ?? []
  const userIds = Array.from(new Set(creatorRows.map(c => c.user_id).filter((id): id is string => Boolean(id))))
  const agencyIds = Array.from(new Set(creatorRows.map(c => c.agency_id).filter((id): id is string => Boolean(id))))

  let relatedUsers: { id: string; email: string | null; username: string | null }[] = []
  let agencies: { id: string; name: string }[] = []

  if (userIds.length > 0) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, username')
      .in('id', userIds)

    if (error) {
      console.error('[admin/criadoras] Failed to load creator users', error)
      return <AdminError message="Erro ao carregar usuarios das criadoras." />
    }

    relatedUsers = data ?? []
  }

  if (agencyIds.length > 0) {
    const { data, error } = await supabase
      .from('agencies')
      .select('id, name')
      .in('id', agencyIds)

    if (error) {
      console.error('[admin/criadoras] Failed to load agencies', error)
      return <AdminError message="Erro ao carregar agencias das criadoras." />
    }

    agencies = data ?? []
  }

  const usersById = new Map(relatedUsers.map(user => [user.id, user]))
  const agenciesById = new Map(agencies.map(agency => [agency.id, agency]))

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-2">Criadoras</h1>

      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Nome</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Email</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Username</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Agencia</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Texto</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Video</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Gifts</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Rating</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Verificada</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Ativa</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {creatorRows.map(c => {
                const user = usersById.get(c.user_id)
                const agency = c.agency_id ? agenciesById.get(c.agency_id) : null

                return (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                    <td className="px-4 py-3 text-white/70 text-sm font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-white/50 text-sm">{user?.email ?? '-'}</td>
                    <td className="px-4 py-3 text-white/50 text-sm">{user?.username ?? '-'}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{agency?.name ?? c.agency_id ?? '-'}</td>
                    <td className="px-4 py-3 text-[#ff4d7d] text-xs">{c.price_text_petals} petalas</td>
                    <td className="px-4 py-3 text-[#ff4d7d] text-xs">{c.price_video_petals} petalas</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{c.total_gifts}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {Number(c.rating ?? 0).toFixed(1)} ({c.rating_count ?? 0})
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.verified ? 'bg-green-400/20 text-green-400' : 'bg-white/5 text-white/30'}`}>
                        {c.verified ? 'Sim' : 'Nao'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.active ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                        {c.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs">{formatDate(c.created_at)}</td>
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
