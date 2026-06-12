'use client'

import { useMemo, useState } from 'react'

type OpportunityFilter =
  | 'Todos'
  | 'Online agora'
  | 'Favoritaram você'
  | 'Visitaram seu perfil'
  | 'Novos'
  | 'Compatíveis'
  | 'Vídeo'
  | 'Chat'

type OpportunityPreview = {
  id: string
  title: string
  status: string
  signal: string
  note: string
  tags: string[]
  filters: OpportunityFilter[]
  gradient: string
  initials: string
  intensity: 'Alta' | 'Media' | 'Nova' | 'Futura'
}

type CreatorFeedClientProps = {
  creatorName: string | null
}

const FILTERS: OpportunityFilter[] = [
  'Todos',
  'Online agora',
  'Favoritaram você',
  'Visitaram seu perfil',
  'Novos',
  'Compatíveis',
  'Vídeo',
  'Chat',
]

const OPPORTUNITY_PREVIEWS: OpportunityPreview[] = [
  {
    id: 'online-now',
    title: 'Online agora',
    status: 'Interesse em tempo real',
    signal: 'Responder primeiro',
    note: 'Prioridade para responder quando houver interesse confirmado.',
    tags: ['chat', 'recente'],
    filters: ['Online agora', 'Chat', 'Compatíveis'],
    gradient: 'from-[#ff4d7d] via-[#a855f7] to-[#2563eb]',
    initials: 'ON',
    intensity: 'Alta',
  },
  {
    id: 'favorite',
    title: 'Favoritou você',
    status: 'Sinal salvo',
    signal: 'Interesse forte',
    note: 'Favoritos ajudam a identificar quem demonstrou intenção clara.',
    tags: ['favorito', 'perfil'],
    filters: ['Favoritaram você', 'Compatíveis'],
    gradient: 'from-[#f59e0b] via-[#fb7185] to-[#ef4444]',
    initials: 'FV',
    intensity: 'Alta',
  },
  {
    id: 'profile-visit',
    title: 'Visitou seu perfil',
    status: 'Aquecimento recente',
    signal: 'Curiosidade ativa',
    note: 'Visitas recentes ajudam a priorizar atenção sem expor dados sensíveis.',
    tags: ['visita', 'perfil'],
    filters: ['Visitaram seu perfil', 'Chat'],
    gradient: 'from-[#06b6d4] via-[#3b82f6] to-[#4f46e5]',
    initials: 'VP',
    intensity: 'Media',
  },
  {
    id: 'video-ready',
    title: 'Possível vídeo',
    status: 'Somente com aceite',
    signal: 'Consentimento primeiro',
    note: 'Convites de vídeo ficarão disponíveis apenas com segurança e aceite.',
    tags: ['vídeo', 'aceite'],
    filters: ['Vídeo', 'Compatíveis'],
    gradient: 'from-[#22c55e] via-[#14b8a6] to-[#0ea5e9]',
    initials: 'VD',
    intensity: 'Futura',
  },
  {
    id: 'new-user',
    title: 'Novo no app',
    status: 'Primeiro contato',
    signal: 'Descoberta',
    note: 'Novos perfis poderão aparecer com contexto mínimo e seguro.',
    tags: ['novo', 'descoberta'],
    filters: ['Novos', 'Chat'],
    gradient: 'from-[#a855f7] via-[#ec4899] to-[#f43f5e]',
    initials: 'NV',
    intensity: 'Nova',
  },
  {
    id: 'match',
    title: 'Match promissor',
    status: 'Sinais combinados',
    signal: 'Boa afinidade',
    note: 'Sinais combinados ajudam a priorizar oportunidades melhores.',
    tags: ['match', 'sinais'],
    filters: ['Compatíveis', 'Online agora', 'Vídeo'],
    gradient: 'from-[#84cc16] via-[#22c55e] to-[#14b8a6]',
    initials: 'MP',
    intensity: 'Alta',
  },
]

const INTENSITY_STYLES = {
  Alta: 'bg-[#ff4d7d]/16 text-[#ffb0c5]',
  Media: 'bg-sky-400/14 text-sky-100',
  Nova: 'bg-violet-400/14 text-violet-100',
  Futura: 'bg-emerald-400/14 text-emerald-100',
} satisfies Record<OpportunityPreview['intensity'], string>

export function CreatorFeedClient({ creatorName }: CreatorFeedClientProps) {
  const [activeFilter, setActiveFilter] = useState<OpportunityFilter>('Todos')

  const filteredOpportunities = useMemo(() => {
    if (activeFilter === 'Todos') return OPPORTUNITY_PREVIEWS
    return OPPORTUNITY_PREVIEWS.filter(item => item.filters.includes(activeFilter))
  }, [activeFilter])

  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-[32px] bg-[#0f0f10] shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
        <div className="grid gap-0 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="bg-[radial-gradient(circle_at_12%_15%,rgba(255,77,125,0.22),transparent_34%),linear-gradient(135deg,#181016,#0f1116_58%,#111827)] p-5 sm:p-6">
            <div className="max-w-2xl">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#ffb0c5]/80">
                Prioridade e atenção
              </div>
              <h2 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                Organize os sinais que merecem resposta primeiro.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/54">
                {creatorName || 'Sua área'} verá sinais de interesse conforme usuários interagirem com seu perfil. Nenhuma ação inicia conversa, vídeo ou cobrança sem consentimento.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 bg-[#0b0b0c] p-5 sm:p-6">
            <div>
              <div className="text-xs font-semibold text-white">Leitura operacional</div>
              <p className="mt-2 text-xs leading-relaxed text-white/42">
                Estrutura visual para priorizar oportunidades quando os dados reais forem conectados.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                ['Sinais', 'interesse'],
                ['Ações', 'seguras'],
                ['Vídeo', 'com aceite'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white/[0.055] px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-white/34">{label}</div>
                  <div className="mt-1 text-xs font-semibold text-white/76">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-[#101010] p-3 shadow-[0_18px_70px_rgba(0,0,0,0.18)]">
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
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filteredOpportunities.map(item => (
          <article key={item.id} className="overflow-hidden rounded-[30px] bg-[#111] shadow-[0_18px_70px_rgba(0,0,0,0.2)]">
            <div className={`h-[88px] bg-gradient-to-br ${item.gradient}`}>
              <div className="flex h-full items-end justify-between bg-black/8 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/24 text-xs font-semibold text-white shadow-lg shadow-black/25">
                  {item.initials}
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-medium ${INTENSITY_STYLES[item.intensity]}`}>
                  {item.intensity}
                </span>
              </div>
            </div>

            <div className="p-4">
              <div>
                <h3 className="truncate text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-[11px] text-white/42">{item.status}</p>
              </div>

              <div className="mt-4">
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#ff9ab7]">{item.signal}</div>
                <p className="mt-2 min-h-[38px] text-xs leading-relaxed text-white/50">{item.note}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tags.map(tag => (
                  <span key={tag} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] text-white/38">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {['Perfil', 'Mensagem', 'Vídeo'].map(action => (
                  <div
                    key={action}
                    aria-disabled="true"
                    className="rounded-2xl bg-white/[0.04] px-2 py-2.5 text-center text-[10px] font-medium text-white/26"
                  >
                    {action}
                  </div>
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
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-yellow-200">Política futura de vídeo</div>
              <h2 className="mt-2 text-lg font-semibold text-yellow-50">Convite sempre depende de aceite.</h2>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-yellow-100/62">
                Esta regra é apenas informativa aqui. O usuário precisa aceitar antes de qualquer chamada ou cobrança.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:min-w-[360px]">
              {[
                ['1º minuto', '30 pétalas'],
                ['Depois', '120/min'],
                ['Início', 'com aceite'],
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
          Os cards desta tela são exemplos de interface. Oportunidades reais aparecerão aqui somente quando os sinais forem conectados ao sistema.
        </p>
      </section>
    </div>
  )
}
