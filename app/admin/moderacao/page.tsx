import { requireAdminPage } from '@/lib/auth/require-admin-page'
import { createAdminClient } from '@/lib/supabase/server'
import CreatorVerificationActions from './CreatorVerificationActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

type VerificationStatus = 'pending' | 'approved' | 'rejected'

type CreatorVerificationRow = {
  id: string
  creator_id: string
  user_id: string
  status: VerificationStatus | string | null
  submitted_at: string | null
  reviewed_at: string | null
}

type CreatorRow = {
  id: string
  name: string | null
  photo_url: string | null
  bio: string | null
}

type UserRow = {
  id: string
  email: string | null
  created_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  return new Date(value).toLocaleString('pt-BR')
}

export default async function AdminModeracaoPage() {
  await requireAdminPage()

  const admin = createAdminClient() as any

  const { data: verificationData, error: verificationError } = await admin
    .from('creator_verifications')
    .select('id, creator_id, user_id, status, submitted_at, reviewed_at')
    .order('submitted_at', { ascending: false })
    .limit(50)

  const verifications = (verificationData ?? []) as CreatorVerificationRow[]

  const creatorIds = [...new Set(verifications.map(verification => verification.creator_id))]
  const userIds = [...new Set(verifications.map(verification => verification.user_id))]

  const { data: creatorData, error: creatorError } = creatorIds.length
    ? await admin
      .from('creators')
      .select('id, name, photo_url, bio')
      .in('id', creatorIds)
    : { data: [], error: null }

  const { data: userData, error: userError } = userIds.length
    ? await admin
      .from('users')
      .select('id, email, created_at')
      .in('id', userIds)
    : { data: [], error: null }

  const creatorsById = new Map(
    ((creatorData ?? []) as CreatorRow[]).map(creator => [creator.id, creator])
  )
  const usersById = new Map(
    ((userData ?? []) as UserRow[]).map(user => [user.id, user])
  )

  const pendentes = verifications.filter(v => v.status === 'pending')
  const aprovadas = verifications.filter(v => v.status === 'approved')
  const rejeitadas = verifications.filter(v => v.status === 'rejected')
  const queryError = verificationError ?? creatorError ?? userError

  return (
    <div>
      <h1 className="mb-6 text-xl font-medium text-white">Moderacao e Seguranca</h1>

      {queryError && (
        <div className="mb-6 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          Nao foi possivel carregar verificacoes de criadoras.
        </div>
      )}

      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: 'Pendentes', value: pendentes.length, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
          { label: 'Aprovadas', value: aprovadas.length, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
          { label: 'Rejeitadas', value: rejeitadas.length, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-lg border p-4 ${stat.bg}`}>
            <div className={`text-2xl font-medium ${stat.color}`}>{stat.value}</div>
            <div className="mt-1 text-xs text-white/30">{stat.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-sm text-white/50">Verificacoes de criadoras</h2>
      <div className="overflow-hidden rounded-lg border border-white/5 bg-[#111]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs text-white/30">Criadora</th>
                <th className="px-4 py-3 text-left text-xs text-white/30">Email</th>
                <th className="px-4 py-3 text-left text-xs text-white/30">Status</th>
                <th className="px-4 py-3 text-left text-xs text-white/30">Enviado em</th>
                <th className="px-4 py-3 text-left text-xs text-white/30">Revisado em</th>
                <th className="px-4 py-3 text-left text-xs text-white/30">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map(verification => {
                const creator = creatorsById.get(verification.creator_id)
                const user = usersById.get(verification.user_id)

                return (
                  <tr key={verification.id} className="border-b border-white/5 transition-all hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm text-white/70">{creator?.name || '-'}</td>
                    <td className="px-4 py-3 text-xs text-white/40">{user?.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        verification.status === 'approved' ? 'bg-green-400/20 text-green-400' :
                        verification.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                        'bg-red-400/20 text-red-400'
                      }`}>
                        {verification.status === 'approved' ? 'Aprovada' :
                         verification.status === 'pending' ? 'Pendente' : 'Rejeitada'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/30">
                      {formatDate(verification.submitted_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/30">
                      {formatDate(verification.reviewed_at)}
                    </td>
                    <td className="px-4 py-3">
                      <CreatorVerificationActions verificationId={verification.id} status={verification.status} />
                    </td>
                  </tr>
                )
              })}

              {!verifications.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-white/30">
                    Nenhuma verificacao encontrada.
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
