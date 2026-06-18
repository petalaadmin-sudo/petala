// app/criadora/dashboard/DashboardClient.tsx
'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCreatorSelfPresence } from '@/lib/hooks/useCreatorPresence'
import { PhotoUploader } from '@/components/album/PhotoUploader'
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

type QuickAction = {
  title: string
  eyebrow: string
  description: string
  href?: string
  onClick?: () => void
  disabled?: boolean
  highlight?: boolean
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

function formatTodayLabel() {
  const value = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function requestTypeLabel(type: ChatRequest['type']) {
  return type === 'video' ? 'Vídeo' : 'Texto'
}

function requestStatusLabel(status: string) {
  if (status === 'pending_creator_acceptance') return 'Pendente'
  if (status === 'requested') return 'Solicitada'
  if (status === 'accepted') return 'Aceita'
  return status
}

function userLabel(request: ChatRequest) {
  return request.user?.username || request.user?.email || `Usuário ${request.user_id.slice(0, 8)}`
}

export function DashboardClient({ initialCreator }: DashboardClientProps) {
  const [supabase] = useState(() => createClient())

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
        setRequestsError('Sessão expirada. Entre novamente para ver solicitações.')
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
        setRequestsError(data.error ?? 'Falha ao carregar solicitações.')
        return
      }

      setRequests(Array.isArray(data.requests) ? data.requests : [])
      setRequestsError(null)
    } catch (err) {
      console.error('[creator requests]', err)
      setRequestsError('Erro ao carregar solicitações.')
    } finally {
      if (!options.silent) {
        setRequestsLoading(false)
      }
    }
  }, [creatorId, getAccessToken])

  const declineRequest = async (requestId: string) => {
    setRequestActionId(requestId)
    setRequestNotice(null)
    setRequestsError(null)

    try {
      const accessToken = await getAccessToken()

      if (!accessToken) {
        setRequestsError('Sessão expirada. Entre novamente para responder solicitações.')
        return
      }

      const res = await fetch('/api/chat/recusar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ session_id: requestId, reason: 'creator_declined_from_dashboard' }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        setRequestsError(data.error ?? 'Falha ao responder solicitação.')
        return
      }

      setRequestNotice('Solicitação recusada.')
      await loadRequests({ silent: true })
    } catch (err) {
      console.error('[creator request action]', err)
      setRequestsError('Erro ao responder solicitação.')
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
      setPresenceError('Não foi possível atualizar sua presença. Tente novamente.')
    } finally {
      setPresenceSaving(false)
    }
  }

  const requestCards = (items: ChatRequest[]) => {
    if (requestsLoading && items.length === 0) {
      return (
        <div className="rounded-2xl bg-white/[0.03] px-4 py-8 text-center text-xs text-white/35">
          Carregando solicitações...
        </div>
      )
    }

    if (items.length === 0) {
      return (
        <div className="rounded-2xl bg-white/[0.03] px-4 py-8 text-center">
          <p className="text-sm font-medium text-white/70">Nenhum pedido pendente agora</p>
          <p className="mt-2 text-xs leading-relaxed text-white/35">
            Quando houver novas solicitações, elas aparecerão aqui com prioridade para resposta.
          </p>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-3">
        {items.map((request) => {
          const actionBusy = requestActionId === request.id

          return (
            <div key={request.id} className="rounded-[28px] bg-white/[0.04] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)] ring-1 ring-white/[0.07]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#ff4d7d]/12 px-2.5 py-1 text-[10px] font-semibold text-[#ff8aaa]">
                      {requestTypeLabel(request.type)}
                    </span>
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] text-white/50">
                      {requestStatusLabel(request.status)}
                    </span>
                  </div>
                  <div className="mt-3 truncate text-sm font-semibold text-white">{userLabel(request)}</div>
                  <div className="mt-1 text-[11px] text-white/40">
                    Solicitado: {formatDateTime(request.requested_at ?? request.started_at)}
                  </div>
                  <div className="text-[11px] text-white/35">
                    Expira: {formatDateTime(request.request_expires_at)}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    disabled
                    className="rounded-2xl bg-white/[0.06] px-4 py-2 text-[11px] font-semibold text-white/35 ring-1 ring-white/[0.06]"
                  >
                    Aceite em preparação
                  </button>
                  <button
                    onClick={() => declineRequest(request.id)}
                    disabled={Boolean(requestActionId)}
                    className="rounded-2xl bg-white/[0.06] px-4 py-2 text-[11px] font-semibold text-white/60 ring-1 ring-white/[0.06] transition disabled:opacity-40"
                  >
                    {actionBusy ? '...' : 'Recusar'}
                  </button>
                  <p className="max-w-[11rem] text-[10px] leading-relaxed text-white/32">
                    Aceite será liberado quando a ativação segura do chat estiver pronta. Recusar não gera cobrança.
                  </p>
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
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff4d7d]/25 border-t-[#ff4d7d]" />
      </div>
    )
  }

  const pendingCount = requests.length
  const todayLabel = formatTodayLabel()
  const ratingValue = stats && stats.ratingCount > 0 ? stats.rating.toFixed(2) : 'Nova'

  const quickActions: QuickAction[] = [
    {
      title: online ? 'Manter visibilidade' : 'Ficar visível',
      eyebrow: online ? 'Vitrine ativa' : 'Presença',
      description: online
        ? 'Sua presença está visível na vitrine. Solicitações pagas seguem em ativação segura.'
        : 'Apareça na vitrine enquanto o fluxo seguro de conversas é preparado.',
      onClick: online ? undefined : toggleOnline,
      disabled: online || presenceSaving,
      highlight: !online,
    },
    {
      title: 'Ver oportunidades',
      eyebrow: 'Prioridade',
      description: 'Abra o feed da criadora e organize sinais de interesse.',
      href: '/criadora/feed',
      highlight: online,
    },
    {
      title: 'Responder pedidos',
      eyebrow: pendingCount > 0 ? `${pendingCount} pendente${pendingCount === 1 ? '' : 's'}` : 'Central limpa',
      description: pendingCount > 0 ? 'Responda antes que a janela expire.' : 'Sem pedidos aguardando neste momento.',
      onClick: () => setView('requests'),
    },
    {
      title: 'Publicar conteúdo',
      eyebrow: 'Álbum',
      description: 'Mantenha seu perfil vivo com novas fotos.',
      onClick: () => setView('content'),
    },
    {
      title: 'Melhorar perfil',
      eyebrow: 'Vitrine',
      description: 'Veja sua página pública e ajuste sua apresentação.',
      href: '/criadora/perfil',
    },
    {
      title: 'Ganhos em validação',
      eyebrow: 'Validação',
      description: 'O painel financeiro será exibido quando os ganhos elegíveis estiverem conectados.',
      onClick: () => setView('earnings'),
    },
  ]

  const metrics = stats
    ? [
      {
        label: 'Pedidos pendentes',
        value: pendingCount,
        sub: pendingCount > 0 ? 'aguardando resposta' : 'central limpa',
      },
      {
        label: 'Sessões hoje',
        value: stats.sessionsToday,
        sub: 'atividade registrada',
      },
      {
        label: 'Presentes',
        value: stats.totalGifts,
        sub: 'histórico recebido',
      },
      {
        label: 'Avaliação',
        value: ratingValue,
        sub: `${stats.ratingCount} avaliação${stats.ratingCount === 1 ? '' : 'ões'}`,
      },
      {
        label: 'Ganhos',
        value: 'Em validação',
        sub: 'ganhos em validação',
      },
    ]
    : []

  const shortcuts = [
    { label: 'Feed de oportunidades', href: '/criadora/feed', helper: 'Priorize sinais de interesse.' },
    { label: 'Mensagens', href: '/criadora/mensagens', helper: 'Veja pedidos e conversas.' },
    { label: 'Chamadas', href: '/criadora/chamadas', helper: 'Políticas e preparação.' },
    { label: 'Ganhos', href: '/criadora/ganhos', helper: 'Acompanhamento em validação.' },
    { label: 'Perfil', href: '/criadora/perfil', helper: 'Cuide da sua vitrine.' },
    { label: 'Configurações', href: '/criadora/configuracoes', helper: 'Conta e preferências.' },
  ]

  return (
    <div className="min-h-screen bg-[#09090b] pb-24 text-white">
      <header className="relative overflow-hidden px-4 pb-4 pt-5">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_20%_0%,rgba(255,77,125,0.28),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(250,204,21,0.14),transparent_26%)]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ff9db8]">Área da criadora</p>
              <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                Oi, {creatorName || 'criadora'}
              </h1>
              <p className="mt-1 text-xs text-white/45">{todayLabel}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 ${
                creatorVerified
                  ? 'bg-green-400/10 text-green-300 ring-green-400/20'
                  : 'bg-yellow-400/10 text-yellow-300 ring-yellow-400/20'
              }`}>
                {creatorVerified ? 'Verificada' : 'Em verificação'}
              </div>
              <div className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 ${
                creatorActive
                  ? 'bg-white/[0.06] text-white/60 ring-white/[0.08]'
                  : 'bg-yellow-400/10 text-yellow-300 ring-yellow-400/20'
              }`}>
                {creatorActive ? 'Perfil ativo' : 'Perfil em análise'}
              </div>
            </div>
          </div>

          <CreatorAreaNav active="dashboard" className="mt-5" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className={`relative overflow-hidden rounded-[32px] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.28)] ring-1 ${
          online
            ? 'bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(17,17,17,0.94)_54%,rgba(255,77,125,0.12))] ring-green-400/20'
            : 'bg-[linear-gradient(135deg,rgba(255,77,125,0.16),rgba(17,17,17,0.96)_48%,rgba(255,255,255,0.04))] ring-white/[0.08]'
        }`}>
          <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/[0.05] blur-2xl" />
          <div className="relative grid gap-5 md:grid-cols-[1.35fr_0.65fr] md:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  online ? 'bg-green-400/12 text-green-300' : 'bg-white/[0.06] text-white/55'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${online ? 'bg-green-300 shadow-[0_0_16px_rgba(74,222,128,0.8)]' : 'bg-white/25'}`} />
                  {online ? 'Visível agora' : 'Offline'}
                </span>
                <span className="rounded-full bg-black/20 px-3 py-1.5 text-xs text-white/45">
                  {pendingCount} pedido{pendingCount === 1 ? '' : 's'} pendente{pendingCount === 1 ? '' : 's'}
                </span>
              </div>

              <h2 className="mt-5 max-w-2xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                {online
                  ? 'Sua presença está visível na vitrine da criadora.'
                  : 'Fique visível para validar sua vitrine enquanto as conversas seguem em ativação segura.'}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
                Use esta tela para decidir o próximo movimento: ajustar presença, acompanhar pedidos existentes,
                cuidar do conteúdo e acompanhar ganhos quando eles estiverem em validação.
              </p>
              <p className="mt-3 text-xs text-white/38">
                O modo offline não religa sozinho. Você controla quando aparece disponível.
              </p>
            </div>

            <div className="rounded-[28px] bg-black/18 p-4 ring-1 ring-white/[0.07]">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Status</div>
              <div className="mt-3 text-3xl font-semibold">{pendingCount}</div>
              <div className="mt-1 text-xs text-white/45">solicitações aguardando</div>
              <button
                onClick={toggleOnline}
                disabled={presenceSaving}
                className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-45 ${
                  online
                    ? 'bg-white/[0.08] text-white ring-1 ring-white/[0.1]'
                    : 'bg-[#ff4d7d] text-white shadow-[0_16px_38px_rgba(255,77,125,0.28)]'
                }`}
              >
                {presenceSaving ? 'Atualizando...' : online ? 'Ficar offline' : 'Ficar visível'}
              </button>
            </div>
          </div>
        </section>

        <nav className="mt-4 grid grid-cols-4 gap-2 rounded-[26px] bg-white/[0.035] p-1.5 ring-1 ring-white/[0.06]">
          {([
            ['home', 'Início'],
            ['requests', 'Pedidos'],
            ['content', 'Conteúdo'],
            ['earnings', 'Ganhos'],
          ] as [DashboardView, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`rounded-2xl py-2.5 text-[11px] font-semibold transition-colors ${
                view === id
                  ? 'bg-white text-black'
                  : 'text-white/45 hover:bg-white/[0.04] hover:text-white/70'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {requestNotice && (
          <div className="mt-4 rounded-2xl bg-green-500/10 px-4 py-3 text-xs text-green-300 ring-1 ring-green-500/20">
            {requestNotice}
          </div>
        )}

        {presenceError && (
          <div className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-xs text-red-300 ring-1 ring-red-500/20">
            {presenceError}
          </div>
        )}

        {requestsError && (
          <div className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-xs text-red-300 ring-1 ring-red-500/20">
            {requestsError}
          </div>
        )}

        {view === 'home' && stats && (
          <div className="mt-4 flex flex-col gap-4">
            <section className="rounded-[32px] bg-white/[0.04] p-4 ring-1 ring-white/[0.07]">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff9db8]">O que fazer agora</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">Priorize a próxima ação</h2>
                </div>
                <span className="hidden rounded-full bg-white/[0.05] px-3 py-1 text-[11px] text-white/45 sm:block">
                  rotina operacional
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {quickActions.map((action) => {
                  const classes = `group rounded-[26px] p-4 text-left transition ${
                    action.highlight
                      ? 'bg-[#ff4d7d] text-white shadow-[0_18px_48px_rgba(255,77,125,0.24)]'
                      : 'bg-black/18 text-white ring-1 ring-white/[0.06] hover:bg-white/[0.055]'
                  } ${action.disabled ? 'cursor-default opacity-70' : ''}`

                  const content = (
                    <>
                      <div className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
                        action.highlight ? 'text-white/72' : 'text-white/35'
                      }`}>
                        {action.eyebrow}
                      </div>
                      <div className="mt-3 text-sm font-semibold">{action.title}</div>
                      <p className={`mt-2 text-xs leading-relaxed ${
                        action.highlight ? 'text-white/78' : 'text-white/42'
                      }`}>
                        {action.description}
                      </p>
                    </>
                  )

                  if (action.href) {
                    return (
                      <Link key={action.title} href={action.href} className={classes}>
                        {content}
                      </Link>
                    )
                  }

                  return (
                    <button
                      key={action.title}
                      type="button"
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={classes}
                    >
                      {content}
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {metrics.map(item => (
                <div key={item.label} className="rounded-[26px] bg-white/[0.04] p-4 ring-1 ring-white/[0.07]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">{item.label}</div>
                  <div className="mt-3 min-h-[2rem] text-xl font-semibold text-white">{item.value}</div>
                  <div className="mt-1 text-[10px] leading-relaxed text-white/35">{item.sub}</div>
                </div>
              ))}
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[32px] bg-white/[0.04] p-4 ring-1 ring-white/[0.07]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">Solicitações pendentes</h2>
                    <p className="mt-1 text-[11px] text-white/38">
                      O aceite está em preparação e não inicia cobrança nem chamada completa.
                    </p>
                  </div>
                  <button
                    onClick={() => setView('requests')}
                    className="rounded-2xl bg-white/[0.06] px-3 py-2 text-[11px] font-semibold text-white/60 ring-1 ring-white/[0.06]"
                  >
                    Ver todas
                  </button>
                </div>
                {requestCards(requests.slice(0, 2))}
              </div>

              <div className="rounded-[32px] bg-white/[0.04] p-4 ring-1 ring-white/[0.07]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Atalhos da criadora</h2>
                    <p className="mt-1 text-[11px] text-white/38">Atalhos principais da área interna.</p>
                  </div>
                </div>
                <div className="grid gap-2">
                  {shortcuts.map(shortcut => (
                    <Link
                      key={shortcut.href}
                      href={shortcut.href}
                      className="rounded-2xl bg-black/18 px-4 py-3 ring-1 ring-white/[0.06] transition hover:bg-white/[0.055]"
                    >
                      <div className="text-xs font-semibold text-white/78">{shortcut.label}</div>
                      <div className="mt-1 text-[11px] text-white/35">{shortcut.helper}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[32px] bg-white/[0.04] p-4 ring-1 ring-white/[0.07]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Presentes recentes</h2>
                  <p className="mt-1 text-[11px] text-white/38">Sinais de carinho recebidos no perfil.</p>
                </div>
                {stats.rankWeekly && (
                  <span className="rounded-full bg-yellow-400/10 px-2.5 py-1 text-[10px] text-yellow-300">
                    #{stats.rankWeekly} semana
                  </span>
                )}
              </div>
              {stats.recentGifts.length === 0 ? (
                <div className="rounded-2xl bg-black/18 px-4 py-8 text-center text-xs text-white/35">
                  Nenhum presente recente. Continue cuidando da presença e do perfil.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {stats.recentGifts.map((gift, index) => (
                    <div key={`${gift.created_at}-${index}`} className="flex items-center gap-3 rounded-2xl bg-black/18 px-3 py-3 ring-1 ring-white/[0.05]">
                      <span className="text-lg">{gift.gift_emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-white/70">Presente recebido</div>
                        <div className="mt-0.5 text-[10px] text-white/32">
                          {formatDateTime(gift.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {view === 'requests' && (
          <section className="mt-4 rounded-[32px] bg-white/[0.04] p-4 ring-1 ring-white/[0.07]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff9db8]">Pedidos</p>
                <h2 className="mt-2 text-xl font-semibold">Solicitações de chat</h2>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/40">
                  A etapa atual mantém os pedidos visíveis e permite recusar. O aceite será liberado quando a ativação segura do chat estiver pronta.
                </p>
              </div>
              <button
                onClick={() => loadRequests()}
                disabled={requestsLoading}
                className="rounded-2xl bg-white/[0.06] px-3 py-2 text-[11px] font-semibold text-white/60 ring-1 ring-white/[0.06] disabled:opacity-40"
              >
                Atualizar
              </button>
            </div>
            {requestCards(requests)}
          </section>
        )}

        {view === 'content' && (
          <section className="mt-4">
            <div className="mb-4 rounded-[32px] bg-white/[0.04] p-5 ring-1 ring-white/[0.07]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff9db8]">Conteúdo</p>
              <h2 className="mt-2 text-xl font-semibold">Álbum e vitrine</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
                Publique fotos gratuitas. Fotos pagas serão reativadas após a validação do fluxo financeiro.
              </p>
            </div>
            <PhotoUploader onUploaded={(photo) => { console.log('Foto publicada:', photo.photo_id) }} />
          </section>
        )}

        {view === 'earnings' && (
          <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-[32px] bg-white/[0.04] p-5 ring-1 ring-white/[0.07]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-300/80">Ganhos</p>
              <h2 className="mt-3 text-2xl font-semibold">Ganhos em validação</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/45">
                Esta área não exibe valores disponíveis, estimativas ou pagamentos até que os ganhos reais estejam conectados
                à validação financeira.
              </p>
            </div>

            <div className="rounded-[32px] bg-yellow-400/[0.07] p-5 ring-1 ring-yellow-400/15">
              <h3 className="text-sm font-semibold text-yellow-200">Acompanhamento seguro</h3>
              <p className="mt-3 text-xs leading-relaxed text-yellow-100/65">
                Use este espaço como marcador operacional. Quando o painel financeiro estiver pronto, os valores
                aparecerão com origem, elegibilidade e revisão.
              </p>
              <Link
                href="/criadora/ganhos"
                className="mt-4 inline-flex rounded-2xl bg-white/[0.08] px-4 py-2 text-xs font-semibold text-white/70 ring-1 ring-white/[0.08]"
              >
                Abrir página de ganhos
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
