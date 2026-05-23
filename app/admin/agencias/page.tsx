import { createAdminClient } from '@/lib/supabase/server'
import AgencyApplicationActions from './AgencyApplicationActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

type AgencyApplicationStatus = 'pending' | 'approved' | 'rejected' | 'blocked'

type AgencyApplication = {
  id: string
  agency_name: string | null
  responsible_name: string | null
  email: string | null
  whatsapp: string | null
  country: string | null
  recruitment_experience: string | null
  expected_creators_count: number | null
  social_links: string | null
  notes: string | null
  status: AgencyApplicationStatus | string | null
  review_notes: string | null
  reviewed_at: string | null
  created_at: string | null
}

type AdminAgency = {
  agency_id: string
  name: string | null
  responsible_name: string | null
  email: string | null
  whatsapp: string | null
  telegram: string | null
  country: string | null
  payment_method: string | null
  commission_percent: number | null
  active: boolean | null
  approved_at: string | null
  invite_code: string | null
  created_at: string | null
  updated_at: string | null
  users_count: number | null
  active_users_count: number | null
  creators_count: number | null
  active_creators_count: number | null
}

const STATUSES: Array<{ id: 'all' | AgencyApplicationStatus; label: string; tone: string }> = [
  { id: 'all', label: 'Todos', tone: 'border-white/10 bg-white/[0.03] text-white' },
  { id: 'pending', label: 'Pendentes', tone: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-300' },
  { id: 'approved', label: 'Aprovadas', tone: 'border-green-400/20 bg-green-400/10 text-green-300' },
  { id: 'rejected', label: 'Rejeitadas', tone: 'border-red-400/20 bg-red-400/10 text-red-300' },
  { id: 'blocked', label: 'Bloqueadas', tone: 'border-white/10 bg-white/[0.03] text-white/50' },
]

const statusLabel = (status: string | null | undefined) => {
  if (status === 'pending') return 'Pendente'
  if (status === 'approved') return 'Aprovada'
  if (status === 'rejected') return 'Rejeitada'
  if (status === 'blocked') return 'Bloqueada'
  return status ?? '-'
}

const statusClass = (status: string | null | undefined) => {
  if (status === 'pending') return 'bg-yellow-400/15 text-yellow-300'
  if (status === 'approved') return 'bg-green-400/15 text-green-300'
  if (status === 'rejected') return 'bg-red-400/15 text-red-300'
  if (status === 'blocked') return 'bg-white/10 text-white/45'
  return 'bg-white/5 text-white/35'
}

const int = (value: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR').format(Number(value ?? 0))

const date = (value: string | null | undefined) => {
  if (!value) return '-'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleString('pt-BR')
}

const text = (value: string | null | undefined) => value || '-'

export default async function AdminAgenciasPage() {
  const admin = createAdminClient() as any

  const [agenciesResult, applicationsResult] = await Promise.all([
    admin.rpc('admin_list_agencies', {
      p_limit: 100,
      p_offset: 0,
      p_status: 'all',
      p_search: null,
    }),
    admin
      .from('agency_applications')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  if (agenciesResult.error) {
    console.error('[admin/agencias] admin_list_agencies', agenciesResult.error)
  }

  if (applicationsResult.error) {
    console.error('[admin/agencias] agency_applications', applicationsResult.error)
  }

  const agencies = (agenciesResult.data ?? []) as AdminAgency[]
  const applications = (applicationsResult.data ?? []) as AgencyApplication[]
  const countByStatus = (status: AgencyApplicationStatus) =>
    applications.filter(application => application.status === status).length

  const grouped = {
    pending: applications.filter(application => application.status === 'pending'),
    approved: applications.filter(application => application.status === 'approved'),
    rejected: applications.filter(application => application.status === 'rejected'),
    blocked: applications.filter(application => application.status === 'blocked'),
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-white text-xl font-medium">Agencias parceiras</h1>
        <p className="text-white/35 text-xs mt-1">Agencias aprovadas e candidaturas recebidas.</p>
      </header>

      {agenciesResult.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200 text-sm">
          Erro ao carregar agencias cadastradas.
        </div>
      )}

      {!agenciesResult.error && <AgencySection agencies={agencies} />}

      {applicationsResult.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200 text-sm">
          Erro ao carregar candidaturas.
        </div>
      )}

      {!applicationsResult.error && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {STATUSES.map(status => {
              const value = status.id === 'all' ? applications.length : countByStatus(status.id)
              return (
                <div key={status.id} className={`rounded-xl p-4 border ${status.tone}`}>
                  <div className="text-2xl font-medium">{int(value)}</div>
                  <div className="text-xs mt-1 opacity-70">{status.label}</div>
                </div>
              )
            })}
          </section>

          <ApplicationSection title="Pendentes" applications={grouped.pending} />
          <ApplicationSection title="Aprovadas" applications={grouped.approved} />
          <ApplicationSection title="Rejeitadas" applications={grouped.rejected} />
          <ApplicationSection title="Bloqueadas" applications={grouped.blocked} />
        </>
      )}
    </div>
  )
}

function AgencySection({ agencies }: { agencies: AdminAgency[] }) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-white text-sm font-medium">Agencias cadastradas</h2>
        <span className="text-white/30 text-xs">{int(agencies.length)} agencias</span>
      </div>

      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px]">
            <thead>
              <tr className="border-b border-white/5">
                {[
                  'Agencia',
                  'Responsavel',
                  'Email',
                  'WhatsApp',
                  'Pais',
                  'Status',
                  'Comissao',
                  'Usuarios',
                  'Criadoras',
                  'Convite',
                  'Aprovada em',
                  'Criada em',
                ].map(header => (
                  <th key={header} className="text-left text-white/30 text-xs px-4 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agencies.map(agency => (
                <tr key={agency.agency_id} className="border-b border-white/5 hover:bg-white/[0.02] align-top">
                  <td className="px-4 py-3 text-white text-xs font-medium">{text(agency.name)}</td>
                  <td className="px-4 py-3 text-white/55 text-xs">{text(agency.responsible_name)}</td>
                  <td className="px-4 py-3 text-white/55 text-xs">{text(agency.email)}</td>
                  <td className="px-4 py-3 text-white/55 text-xs">{text(agency.whatsapp)}</td>
                  <td className="px-4 py-3 text-white/55 text-xs">{text(agency.country)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-1 rounded-full ${agency.active ? 'bg-green-400/15 text-green-300' : 'bg-white/10 text-white/45'}`}>
                      {agency.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/55 text-xs">{agency.commission_percent ?? 0}%</td>
                  <td className="px-4 py-3 text-white/55 text-xs">
                    {int(agency.active_users_count)} ativos / {int(agency.users_count)} total
                  </td>
                  <td className="px-4 py-3 text-white/55 text-xs">
                    {int(agency.active_creators_count)} ativas / {int(agency.creators_count)} total
                  </td>
                  <td className="px-4 py-3 text-white/45 text-xs">{text(agency.invite_code)}</td>
                  <td className="px-4 py-3 text-white/35 text-xs">{date(agency.approved_at)}</td>
                  <td className="px-4 py-3 text-white/35 text-xs">{date(agency.created_at)}</td>
                </tr>
              ))}

              {agencies.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-white/30 text-xs">
                    Nenhuma agencia cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function ApplicationSection({
  title,
  applications,
}: {
  title: string
  applications: AgencyApplication[]
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-white text-sm font-medium">{title}</h2>
        <span className="text-white/30 text-xs">{int(applications.length)} candidaturas</span>
      </div>

      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px]">
            <thead>
              <tr className="border-b border-white/5">
                {[
                  'Agencia',
                  'Responsavel',
                  'Email',
                  'WhatsApp',
                  'Pais',
                  'Criadoras',
                  'Experiencia',
                  'Links sociais',
                  'Observacoes',
                  'Status',
                  'Criada em',
                  'Revisada em',
                  'Notas da revisao',
                  'Acoes',
                ].map(header => (
                  <th key={header} className="text-left text-white/30 text-xs px-4 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map(application => (
                <tr key={application.id} className="border-b border-white/5 hover:bg-white/[0.02] align-top">
                  <td className="px-4 py-3 text-white text-xs font-medium">{text(application.agency_name)}</td>
                  <td className="px-4 py-3 text-white/55 text-xs">{text(application.responsible_name)}</td>
                  <td className="px-4 py-3 text-white/55 text-xs">{text(application.email)}</td>
                  <td className="px-4 py-3 text-white/55 text-xs">{text(application.whatsapp)}</td>
                  <td className="px-4 py-3 text-white/55 text-xs">{text(application.country)}</td>
                  <td className="px-4 py-3 text-white/55 text-xs">{int(application.expected_creators_count)}</td>
                  <td className="px-4 py-3 text-white/45 text-xs max-w-[260px] whitespace-pre-wrap">{text(application.recruitment_experience)}</td>
                  <td className="px-4 py-3 text-white/45 text-xs max-w-[220px] whitespace-pre-wrap">{text(application.social_links)}</td>
                  <td className="px-4 py-3 text-white/45 text-xs max-w-[260px] whitespace-pre-wrap">{text(application.notes)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-1 rounded-full ${statusClass(application.status)}`}>
                      {statusLabel(application.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/35 text-xs">{date(application.created_at)}</td>
                  <td className="px-4 py-3 text-white/35 text-xs">{date(application.reviewed_at)}</td>
                  <td className="px-4 py-3 text-white/45 text-xs max-w-[240px] whitespace-pre-wrap">{text(application.review_notes)}</td>
                  <td className="px-4 py-3">
                    <AgencyApplicationActions applicationId={application.id} status={application.status} />
                  </td>
                </tr>
              ))}

              {applications.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-white/30 text-xs">
                    Nenhuma candidatura nesta categoria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
