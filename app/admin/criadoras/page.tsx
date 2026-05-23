import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

type AdminCreator = {
  creator_id: string
  user_id: string
  email: string | null
  username: string | null
  user_role: string | null
  creator_name: string | null
  verified: boolean | null
  active: boolean | null
  price_text_petals: number | null
  price_video_petals: number | null
  rating: number | null
  rating_count: number | null
  total_gifts: number | null
  total_earnings_petals: number | null
  agency_id: string | null
  agency_name: string | null
  created_at: string | null
  updated_at: string | null
  role_mismatch: boolean | null
  status_label: string | null
}

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

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('pt-BR')
}

function statusText(value: string | null) {
  if (value === 'active_verified') return 'Ativa/verificada'
  if (value === 'pending_verification') return 'Pendente'
  if (value === 'role_mismatch') return 'Role divergente'
  if (value === 'missing_user') return 'Sem usuario'
  if (value === 'inactive') return 'Inativa'
  if (value === 'active') return 'Ativa'
  return value ?? '-'
}

function statusClass(value: string | null) {
  if (value === 'active_verified') return 'bg-green-400/20 text-green-400'
  if (value === 'pending_verification') return 'bg-yellow-400/20 text-yellow-300'
  if (value === 'role_mismatch' || value === 'missing_user') return 'bg-red-400/20 text-red-300'
  if (value === 'inactive') return 'bg-white/5 text-white/30'
  return 'bg-white/5 text-white/40'
}

function yesNo(value: boolean | null | undefined) {
  return value ? 'Sim' : 'Nao'
}

export default async function AdminCriadorasPage() {
  const admin = createAdminClient() as any

  const { data, error } = await admin.rpc('admin_list_creators', {
    p_limit: 100,
    p_offset: 0,
    p_status: 'all',
    p_search: null,
  })

  if (error) {
    console.error('[admin/criadoras] admin_list_creators', error)
    return <AdminError message="Erro ao carregar criadoras." />
  }

  const creators = (data ?? []) as AdminCreator[]

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-2">Criadoras</h1>

      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Nome</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Email</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Username</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Status</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Role</th>
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
              {creators.map(creator => (
                <tr key={creator.creator_id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                  <td className="px-4 py-3 text-white/70 text-sm font-medium">{creator.creator_name ?? '-'}</td>
                  <td className="px-4 py-3 text-white/50 text-sm">{creator.email ?? '-'}</td>
                  <td className="px-4 py-3 text-white/50 text-sm">{creator.username ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass(creator.status_label)}`}>
                      {statusText(creator.status_label)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${creator.role_mismatch ? 'bg-red-400/20 text-red-300' : 'bg-white/5 text-white/40'}`}>
                      {creator.user_role ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">{creator.agency_name ?? creator.agency_id ?? '-'}</td>
                  <td className="px-4 py-3 text-[#ff4d7d] text-xs">{creator.price_text_petals ?? 0} petalas</td>
                  <td className="px-4 py-3 text-[#ff4d7d] text-xs">{creator.price_video_petals ?? 0} petalas</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{creator.total_gifts ?? 0}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {Number(creator.rating ?? 0).toFixed(1)} ({creator.rating_count ?? 0})
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">{yesNo(creator.verified)}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{yesNo(creator.active)}</td>
                  <td className="px-4 py-3 text-white/30 text-xs">{formatDate(creator.created_at)}</td>
                </tr>
              ))}

              {creators.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-white/30 text-sm">
                    Nenhuma criadora encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
