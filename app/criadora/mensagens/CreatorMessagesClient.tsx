'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CreatorAreaContext } from '@/components/criadora/CreatorAreaShell'
import { createClient } from '@/lib/supabase/client'

type ChatRequest = {
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

function userLabel(request: ChatRequest) {
  return request.user?.username || request.user?.email || `Usuario ${request.user_id.slice(0, 8)}`
}

export function CreatorMessagesClient({ creator }: { creator: CreatorAreaContext }) {
  const supabase = useMemo(() => createClient(), [])
  const [requests, setRequests] = useState<ChatRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const getAccessToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }, [supabase])

  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)

    try {
      const accessToken = await getAccessToken()

      if (!accessToken) {
        setError('Sessao expirada. Entre novamente para ver solicitacoes.')
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
        setError(data.error ?? 'Falha ao carregar solicitacoes.')
        return
      }

      setRequests(Array.isArray(data.requests) ? data.requests : [])
      setError(null)
    } catch (err) {
      console.error('[creator messages]', err)
      setError('Erro ao carregar solicitacoes.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    void loadRequests()

    const interval = window.setInterval(() => {
      void loadRequests(true)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [loadRequests])

  const respondRequest = async (requestId: string, action: 'accept' | 'decline') => {
    setActionId(requestId)
    setNotice(null)
    setError(null)

    try {
      const accessToken = await getAccessToken()

      if (!accessToken) {
        setError('Sessao expirada. Entre novamente para responder solicitacoes.')
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
            : { session_id: requestId, reason: 'creator_declined_from_messages' }
        ),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Falha ao responder solicitacao.')
        return
      }

      setNotice(
        action === 'accept'
          ? 'Solicitacao aceita. A ativacao completa da chamada sera finalizada em etapa futura.'
          : 'Solicitacao recusada.'
      )
      await loadRequests(true)
    } catch (err) {
      console.error('[creator message action]', err)
      setError('Erro ao responder solicitacao.')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-3xl border border-white/8 bg-[#111] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Pedidos pendentes</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/40">
              {creator.name || 'Sua conta'} recebe aqui pedidos de texto e video aguardando resposta.
            </p>
          </div>
          <button
            onClick={() => loadRequests()}
            disabled={loading}
            className="rounded-xl border border-white/10 px-3 py-2 text-[11px] text-white/60 disabled:opacity-40"
          >
            Atualizar
          </button>
        </div>
      </section>

      {notice && (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-xs text-green-300">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-white/8 bg-[#111] p-4">
        {loading && requests.length === 0 ? (
          <div className="py-8 text-center text-xs text-white/30">Carregando solicitacoes...</div>
        ) : requests.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-sm font-medium text-white">Nenhuma solicitacao pendente</div>
            <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-white/35">
              Conversas ativas e historico serao organizados aqui nos proximos blocos.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map(request => {
              const busy = actionId === request.id

              return (
                <div key={request.id} className="rounded-2xl border border-white/8 bg-[#0d0d0d] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#ff4d7d]/12 px-2.5 py-1 text-[10px] font-medium text-[#ff8aaa]">
                          {requestTypeLabel(request.type)}
                        </span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-white/45">
                          {request.status}
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
                        onClick={() => respondRequest(request.id, 'accept')}
                        disabled={Boolean(actionId)}
                        className="rounded-xl bg-[#ff4d7d] px-4 py-2 text-[11px] font-medium text-white disabled:opacity-40"
                      >
                        {busy ? '...' : 'Aceitar'}
                      </button>
                      <button
                        onClick={() => respondRequest(request.id, 'decline')}
                        disabled={Boolean(actionId)}
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
        )}
      </section>
    </div>
  )
}
