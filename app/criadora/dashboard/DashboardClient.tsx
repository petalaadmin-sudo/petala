// app/criadora/dashboard/page.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCreatorSelfPresence } from '@/lib/hooks/useCreatorPresence'
import { PhotoUploader } from '@/components/album/PhotoUploader'
import { useRouter } from 'next/navigation'
import { CreatorAreaNav, type CreatorAreaContext } from '@/components/criadora/CreatorAreaShell'

interface DashStats {
  totalGifts: number
  rating: number
  ratingCount: number
  rankWeekly: number | null
  sessionsToday: number
  recentGifts: { gift_emoji: string; from_user_id: string; petals_spent: number; created_at: string }[]
}

interface ChatRequest {
  id: string
  user_id: string
  type: 'text' | 'video'
  status: string
  requested_at: string | null
  request_expires_at: string | null
  started_at: string | null
  user: {
    id: string
    email: string | null
    username: string | null
  } | null
}

type DashboardView = 'home' | 'requests' | 'content' | 'earnings'

type DashboardClientProps = {
  initialCreator: CreatorAreaContext
}

function formatDateTime(value: string | null) {
  if (!value) return '-'

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function requestTypeLabel(type: ChatRequest['type']) {
  return type === 'video' ? 'Video' : 'Texto'
}

function requestStatusLabel(status: string) {
  if (status === 'pending_creator_acceptance') return 'Pendente'
  if (status === 'requested') return 'Solicitada'
  if (status === 'accepted') return 'Aceita'
  return status
}

function userLabel(request: ChatRequest) {
  return request.user?.username || request.user?.email || `Usuario ${request.user_id.slice(0, 8)}`
}

export function DashboardClient({ initialCreator }: DashboardClientProps) {
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  const creatorId = initialCreator.id
  const creatorName = initialCreator.name ?? ''
  const creatorVerified = initialCreator.verified
  const creatorActive = initialCreator.active
  const [stats, setStats] = useState<DashStats | null>(null)
  const [view, setView] = useState<DashboardView>('home')
  const [online, setOnlineState] = useState(false)
  const [presenceSaving, setPresenceSaving] = useState(false)
  const [presenceError, setPresenceError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<ChatRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestsError, setRequestsError] = useState<string | null>(null)
  const [requestNotice, setRequestNotice] = useState<string | null>(null)
  const [requestActionId, setRequestActionId] = useState<string | null>(null)

  const { setOnline, syncDesiredOnline } = useCreatorSelfPresence(creatorId)

  const getAccessToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }, [supabase])

  const loadRequests = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!creatorId) return

    if (!options.silent) {
      setRequestsLoading(true)
    }

    try {
      const accessToken = await getAccessToken()

      if (!accessToken) {
        setRequestsError('Sessao expirada. Entre novamente para ver solicitacoes.')
        return
      }

      const res = await fetch('/api/chat/solicitacoes', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        setRequestsError(data.error ?? 'Falha ao carregar solicitacoes.')
        return
      }

      setRequests(Array.isArray(data.requests) ? data.requests : [])
      setRequestsError(null)
    } catch (err) {
      console.error('[creator requests]', err)
      setRequestsError('Erro ao carregar solicitacoes.')
    } finally {
      if (!options.silent) {
        setRequestsLoading(false)
      }
    }
  }, [creatorId, getAccessToken])

  const handleRequestAction = async (requestId: string, action: 'accept' | 'decline') => {
    setRequestActionId(requestId)
    setRequestNotice(null)
    setRequestsError(null)

    try {
      const accessToken = await getAccessToken()

      if (!accessToken) {
        setRequestsError('Sessao expirada. Entre novamente para responder solicitacoes.')
        return
      }

      const res = await fetch(action === 'accept' ? '/api/chat/aceitar' : '/api/chat/recusar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(
          action === 'accept'
            ? { session_id: requestId }
            : { session_id: requestId, reason: 'creator_declined_from_dashboard' }
        ),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        setRequestsError(data.error ?? 'Falha ao responder solicitacao.')
        return
      }

      setRequestNotice(
        action === 'accept'
          ? 'Solicitacao aceita. A ativacao completa da chamada sera finalizada em etapa futura.'
          : 'Solicitacao recusada.'
      )
      await loadRequests({ silent: true })
    } catch (err) {
      console.error('[creator request action]', err)
      setRequestsError('Erro ao responder solicitacao.')
    } finally {
      setRequestActionId(null)
    }
  }

  useEffect(() => {
    const load = async () => {
      const { data: creatorStats } = await supabase
        .from('creators')
        .select('total_gifts, rating, rating_count, rank_weekly')
        .eq('id', creatorId)
        .maybeSingle()

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: sessionsToday } = await supabase
        .from('chat_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .gte('started_at', today.toISOString())

      const { data: presence } = await supabase
        .from('creator_presence')
        .select('online')
        .eq('creator_id', creatorId)
        .single()

      setOnlineState(presence?.online ?? false)

      const { data: recentGifts } = await supabase
        .from('gifts')
        .select('gift_emoji, from_user_id, petals_spent, created_at')
        .eq('to_creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalGifts: creatorStats?.total_gifts ?? initialCreator.total_gifts ?? 0,
        rating: creatorStats?.rating ?? 0,
        ratingCount: creatorStats?.rating_count ?? 0,
        rankWeekly: creatorStats?.rank_weekly ?? initialCreator.rank_weekly,
        sessionsToday: sessionsToday ?? 0,
        recentGifts: recentGifts ?? [],
      })

      setLoading(false)
    }

    void load()
  }, [creatorId, initialCreator.rank_weekly, initialCreator.total_gifts, supabase])

  useEffect(() => {
    if (!creatorId) return
    syncDesiredOnline(online)
  }, [creatorId, online, syncDesiredOnline])

  useEffect(() => {
    if (!creatorId) return

    void loadRequests()

    const interval = window.setInterval(() => {
      void loadRequests({ silent: true })
    }, 5000)

    return () => window.clearInterval(interval)
  }, [creatorId, loadRequests])

  const toggleOnline = async () => {
    const nextOnline = !online
    const previousOnline = online

    setPresenceSaving(true)
    setPresenceError(null)
    setOnlineState(nextOnline)

    try {
      const presence = await setOnline(nextOnline)
      if (presence) {
        setOnlineState(Boolean(presence.online))
      }
    } catch (err) {
      console.error('[creator presence toggle]', err)
      setOnlineState(previousOnline)
      setPresenceError('Nao foi possivel atualizar sua presenca. Tente novamente.')
    } finally {
      setPresenceSaving(false)
    }
  }

  const requestCards = (items: ChatRequest[]) => {
    if (requestsLoading && items.length === 0) {
      return <div className="py-6 text-center text-xs text-white/30">Carregando solicitacoes...</div>
    }

    if (items.length === 0) {
      return <div className="py-6 text-center text-xs text-white/30">Nenhuma solicitacao pendente</div>
    }

    return (
      <div className="flex flex-col gap-3">
        {items.map((request) => {
          const actionBusy = requestActionId === request.id

          return (
            <div key={request.id} className="rounded-2xl border border-white/8 bg-[#111] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#ff4d7d]/12 px-2.5 py-1 text-[10px] font-medium text-[#ff8aaa]">
                      {requestTypeLabel(request.type)}
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-white/45">
                      {requestStatusLabel(request.status)}
                    </span>
                  </div>
                  <div className="mt-3 truncate text-sm font-medium text-white">{userLabel(request)}</div>
                  <div className="mt-1 text-[11px] text-white/35">
                    Solicitado: {formatDateTime(request.requested_at ?? request.started_at)}
                  </div>
                  <div className="text-[11px] text-white/35">
                    Expira: {formatDateTime(request.request_expires_at)}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    onClick={() => handleRequestAction(request.id, 'accept')}
                    disabled={Boolean(requestActionId)}
                    className="rounded-xl bg-[#ff4d7d] px-4 py-2 text-[11px] font-medium text-white disabled:opacity-40"
                  >
                    {actionBusy ? '...' : 'Aceitar'}
                  </button>
                  <button
                    onClick={() => handleRequestAction(request.id, 'decline')}
                    disabled={Boolean(requestActionId)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-[11px] font-medium text-white/60 disabled:opacity-40"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff4d7d]/30 border-t-[#ff4d7d]" />
      </div>
    )
  }

  const pendingCount = requests.length
  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 text-white">
      <header className="px-4 pb-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#ff8aaa]">Creator Bloom</p>
            <h1 className="mt-2 truncate text-2xl font-semibold">Oi, {creatorName || 'criadora'}</h1>
            <p className="mt-1 text-xs text-white/35">{todayLabel}</p>
          </div>
          <div className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
            creatorVerified
              ? 'border-green-400/25 bg-green-400/10 text-green-300'
              : 'border-yellow-400/25 bg-yellow-400/10 text-yellow-300'
          }`}>
            {creatorVerified ? 'Verificada' : 'Em verificacao'}
          </div>
        </div>
      </header>

      <main className="px-4">
        <CreatorAreaNav active="dashboard" className="mb-4" />

        <section className={`rounded-3xl border p-5 ${
          online
            ? 'border-green-400/25 bg-[#07150d]'
            : 'border-white/8 bg-[#111]'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-green-400' : 'bg-white/20'}`} />
                <span className={`text-sm font-medium ${online ? 'text-green-300' : 'text-white/50'}`}>
                  {online ? 'Online agora' : 'Offline'}
                </span>
              </div>
              <h2 className="mt-4 text-xl font-semibold leading-tight">
                {online ? 'Voce esta disponivel para novas solicitacoes.' : 'Entre online quando estiver pronta para atender.'}
              </h2>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/45">
                O status controla a visibilidade no feed. O app nao vai religar sua presenca depois de um offline manual.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2 text-center">
              <div className="text-lg font-semibold">{pendingCount}</div>
              <div className="text-[10px] text-white/35">pendentes</div>
            </div>
          </div>

          <button
            onClick={toggleOnline}
            disabled={presenceSaving}
            className={`mt-5 w-full rounded-2xl py-3 text-sm font-semibold transition-colors disabled:opacity-45 ${
              online
                ? 'border border-white/12 bg-white/8 text-white'
                : 'bg-[#ff4d7d] text-white'
            }`}
          >
            {presenceSaving ? 'Atualizando...' : online ? 'Ficar offline' : 'Ficar online'}
          </button>
        </section>

        <nav className="mt-4 grid grid-cols-4 gap-2">
          {([
            ['home', 'Inicio'],
            ['requests', 'Pedidos'],
            ['content', 'Conteudo'],
            ['earnings', 'Ganhos'],
          ] as [DashboardView, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`rounded-2xl py-2.5 text-[11px] font-medium transition-colors ${
                view === id
                  ? 'bg-[#ff4d7d] text-white'
                  : 'border border-white/8 bg-[#111] text-white/45'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {requestNotice && (
          <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-xs text-green-300">
            {requestNotice}
          </div>
        )}

        {presenceError && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {presenceError}
          </div>
        )}

        {requestsError && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {requestsError}
          </div>
        )}

        {view === 'home' && stats && (
          <div className="mt-4 flex flex-col gap-4">
            <section className="rounded-3xl border border-white/8 bg-[#111] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Solicitacoes pendentes</h2>
                  <p className="mt-1 text-[11px] text-white/35">
                    Aceitar ainda nao inicia cobranca nem chamada completa.
                  </p>
                </div>
                <button
                  onClick={() => setView('requests')}
                  className="rounded-xl border border-white/10 px-3 py-2 text-[11px] text-white/60"
                >
                  Ver todas
                </button>
              </div>
              {requestCards(requests.slice(0, 2))}
            </section>

            <section className="grid grid-cols-2 gap-3">
              {[
                { label: 'Ganhos', value: 'Em validacao', sub: 'Ledger financeiro em preparacao', tone: 'text-yellow-300' },
                { label: 'Sessoes hoje', value: stats.sessionsToday, sub: 'texto e video', tone: 'text-[#ff8aaa]' },
                { label: 'Presentes', value: stats.totalGifts, sub: 'total recebido', tone: 'text-white' },
                { label: 'Avaliacao', value: stats.rating.toFixed(2), sub: `${stats.ratingCount} avaliacoes`, tone: 'text-yellow-300' },
              ].map(item => (
                <div key={item.label} className="rounded-2xl border border-white/8 bg-[#111] p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/30">{item.label}</div>
                  <div className={`mt-2 text-xl font-semibold ${item.tone}`}>{item.value}</div>
                  <div className="mt-1 text-[10px] text-white/30">{item.sub}</div>
                </div>
              ))}
            </section>

            <section className="rounded-3xl border border-white/8 bg-[#111] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Atalhos</h2>
                <span className="text-[10px] text-white/25">operacao diaria</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => creatorId && router.push(`/criadora/${creatorId}`)}
                  className="rounded-2xl border border-white/8 bg-[#0d0d0d] px-3 py-3 text-left text-xs text-white/70"
                >
                  Perfil publico
                  <span className="mt-1 block text-[10px] text-white/30">Veja como usuarios enxergam seu perfil</span>
                </button>
                <button
                  onClick={() => setView('content')}
                  className="rounded-2xl border border-white/8 bg-[#0d0d0d] px-3 py-3 text-left text-xs text-white/70"
                >
                  Conteudo
                  <span className="mt-1 block text-[10px] text-white/30">Publique uma nova foto no album</span>
                </button>
                <button
                  onClick={() => router.push('/criadora/verificacao')}
                  className="rounded-2xl border border-white/8 bg-[#0d0d0d] px-3 py-3 text-left text-xs text-white/70"
                >
                  Verificacao
                  <span className="mt-1 block text-[10px] text-white/30">
                    {creatorActive ? 'Perfil ativo' : 'Acompanhe seu status'}
                  </span>
                </button>
                <button
                  disabled
                  className="rounded-2xl border border-white/8 bg-[#0d0d0d] px-3 py-3 text-left text-xs text-white/35 disabled:opacity-70"
                >
                  Lives em preparacao
                  <span className="mt-1 block text-[10px] text-white/25">Sem rota antiga ou canal livre</span>
                </button>
                <button
                  disabled
                  className="rounded-2xl border border-white/8 bg-[#0d0d0d] px-3 py-3 text-left text-xs text-white/35 disabled:opacity-70"
                >
                  Suporte e configuracoes
                  <span className="mt-1 block text-[10px] text-white/25">Central dedicada em preparacao</span>
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-white/8 bg-[#111] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Presentes recentes</h2>
                {stats.rankWeekly && (
                  <span className="rounded-full bg-yellow-400/10 px-2.5 py-1 text-[10px] text-yellow-300">
                    #{stats.rankWeekly} semana
                  </span>
                )}
              </div>
              {stats.recentGifts.length === 0 ? (
                <div className="py-5 text-center text-xs text-white/30">Nenhum presente ainda</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {stats.recentGifts.map((gift, index) => (
                    <div key={`${gift.created_at}-${index}`} className="flex items-center gap-3 rounded-2xl bg-[#0d0d0d] px-3 py-3">
                      <span className="text-lg">{gift.gift_emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-white/65">Presente recebido</div>
                        <div className="mt-0.5 text-[10px] text-white/30">
                          {formatDateTime(gift.created_at)}
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-white/35">
                        {gift.petals_spent} petalas
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {view === 'requests' && (
          <section className="mt-4 rounded-3xl border border-white/8 bg-[#111] p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Solicitacoes de chat</h2>
                <p className="mt-1 text-xs leading-relaxed text-white/35">
                  A etapa atual permite aceitar ou recusar. A ativacao completa sera conectada em bloco futuro.
                </p>
              </div>
              <button
                onClick={() => loadRequests()}
                disabled={requestsLoading}
                className="rounded-xl border border-white/10 px-3 py-2 text-[11px] text-white/60 disabled:opacity-40"
              >
                Atualizar
              </button>
            </div>
            {requestCards(requests)}
          </section>
        )}

        {view === 'content' && (
          <section className="mt-4">
            <div className="mb-4 rounded-3xl border border-white/8 bg-[#111] p-4">
              <h2 className="text-base font-semibold">Conteudo e album</h2>
              <p className="mt-2 text-xs leading-relaxed text-white/40">
                Publique fotos gratuitas ou bloqueadas por petalas. Ganhos sacaveis so serao exibidos quando o ledger financeiro estiver conectado.
              </p>
            </div>
            <PhotoUploader onUploaded={(photo) => { console.log('Foto publicada:', photo.photo_id) }} />
          </section>
        )}

        {view === 'earnings' && (
          <section className="mt-4 flex flex-col gap-4">
            <div className="rounded-3xl border border-white/8 bg-[#111] p-5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">Ganhos</div>
              <h2 className="mt-3 text-2xl font-semibold text-yellow-300">Em validacao</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/45">
                O saldo sacavel sera exibido apenas quando o painel financeiro estiver conectado ao ledger de ganhos elegiveis.
              </p>
            </div>

            <div className="rounded-3xl border border-green-500/20 bg-[#0d1a10] p-4">
              <p className="text-xs leading-relaxed text-green-300/75">
                Pagamentos serao processados semanalmente as segundas-feiras, as 15:00 no horario oficial da plataforma (America/Sao_Paulo). Para criadoras fora do Brasil, o horario local podera variar conforme o pais.
              </p>
            </div>

            <button
              disabled
              className="w-full rounded-2xl bg-[#ff4d7d] py-4 text-sm font-semibold text-white opacity-40"
            >
              Solicitar saque indisponivel
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
