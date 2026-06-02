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
  name: string
  status: string
  signal: string
  bio: string
  tags: string[]
  filters: OpportunityFilter[]
  tone: string
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
    id: 'preview-online-chat',
    name: 'Previa de usuario online',
    status: 'Online agora',
    signal: 'Interagiu recentemente',
    bio: 'Formato compacto para destacar usuarios com disponibilidade e historico recente.',
    tags: ['chat', 'recente', 'sinal forte'],
    filters: ['Online agora', 'Chat', 'Compativeis'],
    tone: 'from-[#ff4d7d] to-[#7c3aed]',
  },
  {
    id: 'preview-favorite',
    name: 'Previa de favorito',
    status: 'Interesse salvo',
    signal: 'Favoritou voce',
    bio: 'Quando o backend estiver conectado, favoritos poderao aparecer como oportunidade prioritaria.',
    tags: ['favorito', 'perfil', 'prioridade'],
    filters: ['Favoritaram voce', 'Compativeis'],
    tone: 'from-[#f59e0b] to-[#ef4444]',
  },
  {
    id: 'preview-visit',
    name: 'Previa de visita',
    status: 'Viu seu perfil',
    signal: 'Visitou perfil',
    bio: 'Visitas recentes poderao ajudar a creator a entender demanda sem criar convite automatico.',
    tags: ['visita', 'curiosidade', 'perfil'],
    filters: ['Visitaram seu perfil', 'Chat'],
    tone: 'from-[#06b6d4] to-[#2563eb]',
  },
  {
    id: 'preview-video',
    name: 'Previa de video',
    status: 'Possivel chamada',
    signal: 'Sinal futuro de video',
    bio: 'Convites de video serao preparados com aceite explicito do usuario antes de qualquer cobranca.',
    tags: ['video', 'aceite', 'futuro'],
    filters: ['Video', 'Compativeis'],
    tone: 'from-[#22c55e] to-[#14b8a6]',
  },
  {
    id: 'preview-new',
    name: 'Previa de usuario novo',
    status: 'Novo no app',
    signal: 'Chegou recentemente',
    bio: 'Novos usuarios poderao aparecer com contexto minimo e sem exposicao de dados sensiveis.',
    tags: ['novo', 'descoberta', 'seguro'],
    filters: ['Novos', 'Chat'],
    tone: 'from-[#a855f7] to-[#ec4899]',
  },
  {
    id: 'preview-compatible',
    name: 'Previa compativel',
    status: 'Boa compatibilidade',
    signal: 'Perfil com sinais combinados',
    bio: 'A ordenacao futura deve combinar sinais reais sem incentivar spam ou abordagem em massa.',
    tags: ['match', 'sinais', 'operacao'],
    filters: ['Compativeis', 'Online agora', 'Video'],
    tone: 'from-[#84cc16] to-[#16a34a]',
  },
]

export function CreatorFeedClient({ creatorName }: CreatorFeedClientProps) {
  const [activeFilter, setActiveFilter] = useState<OpportunityFilter>('Todos')

  const filteredOpportunities = useMemo(() => {
    if (activeFilter === 'Todos') return OPPORTUNITY_PREVIEWS
    return OPPORTUNITY_PREVIEWS.filter(item => item.filters.includes(activeFilter))
  }, [activeFilter])

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-3xl border border-white/8 bg-[#111] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#ff8aaa]">
              Previa operacional
            </div>
            <h2 className="mt-2 text-lg font-semibold">Oportunidades em grade compacta</h2>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/40">
              {creatorName || 'Sua area'} vera aqui usuarios reais quando favoritos, visitas, disponibilidade e sinais de interesse estiverem conectados ao backend.
            </p>
          </div>
          <div className="hidden rounded-2xl border border-white/8 bg-black/20 px-3 py-2 text-center sm:block">
            <div className="text-lg font-semibold">{filteredOpportunities.length}</div>
            <div className="text-[10px] text-white/35">previas</div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-medium transition-colors ${
                activeFilter === filter
                  ? 'border-[#ff4d7d] bg-[#ff4d7d] text-white'
                  : 'border-white/8 bg-[#0d0d0d] text-white/45 hover:text-white/70'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filteredOpportunities.map(item => (
          <article key={item.id} className="rounded-3xl border border-white/8 bg-[#111] p-3">
            <div className="flex items-start gap-3">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone}`}>
                <span className="text-sm font-semibold text-white">{item.name.slice(10, 12).trim() || 'U'}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-white">{item.name}</h3>
                  <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/35">
                    Em preparacao
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-white/35">{item.status}</p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/8 bg-[#0d0d0d] px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#ff8aaa]">{item.signal}</div>
              <p className="mt-1 text-xs leading-relaxed text-white/45">{item.bio}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map(tag => (
                <span key={tag} className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-white/40">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {['Ver perfil', 'Mensagem', 'Video'].map(action => (
                <button
                  key={action}
                  disabled
                  className="rounded-xl border border-white/8 bg-white/[0.03] px-2 py-2 text-[10px] font-medium text-white/30"
                >
                  {action}
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] text-white/25">Acoes em breve, sem chamada de API neste bloco.</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-yellow-400/20 bg-yellow-400/8 p-4">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-yellow-200">Regra futura de video</div>
        <h2 className="mt-2 text-base font-semibold text-yellow-100">Convite com aceite antes de cobranca</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 text-xs leading-relaxed text-yellow-100/70 sm:grid-cols-3">
          <div className="rounded-2xl bg-black/15 p-3">
            <div className="font-semibold text-yellow-100">1o minuto</div>
            <p className="mt-1">30 petalas quando o usuario aceitar.</p>
          </div>
          <div className="rounded-2xl bg-black/15 p-3">
            <div className="font-semibold text-yellow-100">Depois</div>
            <p className="mt-1">120 petalas por minuto.</p>
          </div>
          <div className="rounded-2xl bg-black/15 p-3">
            <div className="font-semibold text-yellow-100">Consentimento</div>
            <p className="mt-1">Nada inicia cobranca antes do aceite do usuario.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#0d0d0d] p-4">
        <h2 className="text-sm font-semibold">Estado vazio seguro</h2>
        <p className="mt-2 text-xs leading-relaxed text-white/40">
          Oportunidades reais aparecerao aqui conforme usuarios interagirem com seu perfil. Esta tela mostra apenas a estrutura visual e nao representa usuarios reais.
        </p>
      </section>
    </div>
  )
}
