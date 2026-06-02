'use client'

import { useMemo, useState } from 'react'

type OpportunityFilter =
  | 'Todos'
  | 'Online agora'
  | 'Favoritaram voce'
  | 'Visitaram seu perfil'
  | 'Novos'
  | 'Compativeis'
  | 'Video'
  | 'Chat'

type OpportunityPreview = {
  id: string
  title: string
  status: string
  priority: string
  signal: string
  note: string
  tags: string[]
  filters: OpportunityFilter[]
  gradient: string
  initials: string
}

type CreatorFeedClientProps = {
  creatorName: string | null
}

const FILTERS: OpportunityFilter[] = [
  'Todos',
  'Online agora',
  'Favoritaram voce',
  'Visitaram seu perfil',
  'Novos',
  'Compativeis',
  'Video',
  'Chat',
]

const OPPORTUNITY_PREVIEWS: OpportunityPreview[] = [
  {
    id: 'online-now',
    title: 'Online agora',
    status: 'Disponivel',
    priority: 'Alta prioridade',
    signal: 'Interacao recente',
    note: 'Janela boa para responder quando houver sinal real.',
    tags: ['chat', 'recente'],
    filters: ['Online agora', 'Chat', 'Compativeis'],
    gradient: 'from-[#ff4d7d] via-[#a855f7] to-[#2563eb]',
    initials: 'ON',
  },
  {
    id: 'favorite',
    title: 'Favoritou voce',
    status: 'Interesse salvo',
    priority: 'Quente',
    signal: 'Sinal forte',
    note: 'Favoritos poderao priorizar a fila sem abordagem automatica.',
    tags: ['favorito', 'perfil'],
    filters: ['Favoritaram voce', 'Compativeis'],
    gradient: 'from-[#f59e0b] via-[#fb7185] to-[#ef4444]',
    initials: 'FV',
  },
  {
    id: 'profile-visit',
    title: 'Visitou seu perfil',
    status: 'Visita recente',
    priority: 'Acompanhar',
    signal: 'Curiosidade ativa',
    note: 'Visitas ajudam a entender interesse sem expor dados sensiveis.',
    tags: ['visita', 'perfil'],
    filters: ['Visitaram seu perfil', 'Chat'],
    gradient: 'from-[#06b6d4] via-[#3b82f6] to-[#4f46e5]',
    initials: 'VP',
  },
  {
    id: 'video-ready',
    title: 'Possivel video',
    status: 'Somente futuro',
    priority: 'Bloqueado',
    signal: 'Aceite obrigatorio',
    note: 'Convite so entra quando consentimento e billing estiverem prontos.',
    tags: ['video', 'aceite'],
    filters: ['Video', 'Compativeis'],
    gradient: 'from-[#22c55e] via-[#14b8a6] to-[#0ea5e9]',
    initials: 'VD',
  },
  {
    id: 'new-user',
    title: 'Novo no app',
    status: 'Primeira descoberta',
    priority: 'Observar',
    signal: 'Perfil novo',
    note: 'Entrada futura para usuarios recentes com contexto minimo.',
    tags: ['novo', 'descoberta'],
    filters: ['Novos', 'Chat'],
    gradient: 'from-[#a855f7] via-[#ec4899] to-[#f43f5e]',
    initials: 'NV',
  },
  {
    id: 'match',
    title: 'Match promissor',
    status: 'Sinais combinados',
    priority: 'Promissor',
    signal: 'Boa afinidade',
    note: 'Ordenacao futura deve combinar sinais reais sem incentivar spam.',
    tags: ['match', 'sinais'],
    filters: ['Compativeis', 'Online agora', 'Video'],
    gradient: 'from-[#84cc16] via-[#22c55e] to-[#14b8a6]',
    initials: 'MP',
  },
]

export function CreatorFeedClient({ creatorName }: CreatorFeedClientProps) {
  const [activeFilter, setActiveFilter] = useState<OpportunityFilter>('Todos')

  const filteredOpportunities = useMemo(() => {
    if (activeFilter === 'Todos') return OPPORTUNITY_PREVIEWS
    return OPPORTUNITY_PREVIEWS.filter(item => item.filters.includes(activeFilter))
  }, [activeFilter])

  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-[30px] bg-[#101010] shadow-[0_22px_90px_rgba(0,0,0,0.28)]">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(255,77,125,0.24),transparent_34%),linear-gradient(135deg,#181016,#0f1116_48%,#101720)] p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#ffb0c5]">
                Demonstracao visual
              </div>
              <h2 className="mt-4 text-2xl font-semibold leading-tight text-white">Oportunidades em breve</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/52">
                {creatorName || 'Sua area'} vera oportunidades reais quando favoritos, visitas e disponibilidade forem conectados. Nenhuma acao desta tela dispara conversa, video ou cobranca.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 xl:min-w-[330px]">
              {[
                ['Sinais', 'em leitura'],
                ['Acoes', 'bloqueadas'],
                ['Dados', 'futuros'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-black/24 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-white/32">{label}</div>
                  <div className="mt-1 text-xs font-semibold text-white/78">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0c0c0d] p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-2xl px-3 py-2.5 text-[11px] font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-white text-black shadow-[0_12px_34px_rgba(255,255,255,0.12)]'
                    : 'bg-white/[0.055] text-white/46 hover:bg-white/[0.085] hover:text-white/72'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filteredOpportunities.map(item => (
          <article key={item.id} className="group overflow-hidden rounded-[28px] bg-[#111] shadow-[0_18px_70px_rgba(0,0,0,0.2)]">
            <div className={`h-24 bg-gradient-to-br ${item.gradient}`}>
              <div className="flex h-full items-end justify-between bg-black/10 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/24 text-xs font-semibold text-white shadow-lg shadow-black/25">
                  {item.initials}
                </div>
                <div className="rounded-full bg-black/24 px-3 py-1 text-[10px] font-medium text-white/82">{item.priority}</div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-[11px] text-white/42">{item.status}</p>
                </div>
                <div className="h-2 w-2 shrink-0 rounded-full bg-[#ff4d7d] shadow-[0_0_22px_rgba(255,77,125,0.7)]" />
              </div>

              <div className="mt-4 rounded-2xl bg-black/18 p-3">
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#ff9ab7]">{item.signal}</div>
                <p className="mt-2 min-h-[34px] text-xs leading-relaxed text-white/48">{item.note}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tags.map(tag => (
                  <span key={tag} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] text-white/38">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {['Perfil', 'Mensagem', 'Video'].map(action => (
                  <button
                    key={action}
                    disabled
                    className="rounded-2xl bg-white/[0.045] px-2 py-2.5 text-[10px] font-medium text-white/28"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-[30px] bg-[#171208] shadow-[0_18px_70px_rgba(0,0,0,0.18)]">
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.16),transparent_32%),linear-gradient(135deg,rgba(255,77,125,0.08),transparent)] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-yellow-200">Video futuro</div>
              <h2 className="mt-2 text-lg font-semibold text-yellow-50">Convite com aceite antes de qualquer cobranca</h2>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-yellow-100/62">
                A regra abaixo e apenas informativa neste bloco. Nada aqui inicia chamada, convite ou faturamento.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:min-w-[360px]">
              {[
                ['1o minuto', '30 petalas'],
                ['Depois', '120/min'],
                ['Inicio', 'so com aceite'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-black/20 px-3 py-3">
                  <div className="text-[10px] text-yellow-100/42">{label}</div>
                  <div className="mt-1 text-xs font-semibold text-yellow-50">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[26px] bg-[#0e0e0f] p-4">
        <p className="text-xs leading-relaxed text-white/42">
          Oportunidades reais aparecerao aqui conforme usuarios interagirem com seu perfil. Os cards acima sao exemplos de interface e todas as acoes permanecem desabilitadas.
        </p>
      </section>
    </div>
  )
}
