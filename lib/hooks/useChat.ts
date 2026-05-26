// lib/hooks/useChat.ts
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ── Tipos ──────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  session_id: string
  sender_id: string
  sender_role: 'user' | 'creator' | 'system'
  content: string
  type: 'text' | 'gift' | 'system'
  gift_emoji: string | null
  gift_petals: number | null
  created_at: string
}

export interface ChatSession {
  session_id: string
  type: 'text' | 'video'
  price_per_min: number
  started_at: string
}

type MinuteBillingResponse = {
  success?: boolean
  error?: string
  code?: string
  session_ended?: boolean
  new_balance?: number
  required?: number
  current_balance?: number
  duration_seconds?: number
  paid_until_seconds?: number
  petals_charged?: number
}

type ChatType = 'text' | 'video'

type MinuteChargeOutcome = {
  ok: boolean
  sessionEnded?: boolean
  ignored?: boolean
  error?: string
  result?: MinuteBillingResponse
}

type EndSessionOptions = {
  rating?: number
  comment?: string
  keepalive?: boolean
  cleanupUnpaid?: boolean
  silent?: boolean
}

interface UseChatOptions {
  creatorId: string
  chatType?: ChatType
  onBalanceUpdate?: (newBalance: number) => void
  onSessionEnded?: (summary: { duration: number; petals: number }) => void
}

interface UseChatReturn {
  // Estado
  session: ChatSession | null
  messages: ChatMessage[]
  balance: number
  status: 'idle' | 'starting' | 'active' | 'ending' | 'ended' | 'error'
  error: string | null
  elapsedSeconds: number
  serverDurationSeconds: number | null
  isTyping: boolean

  // Ações
  startChat: () => Promise<void>
  endChat: (rating?: number, comment?: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  sendGift: (giftType: string) => Promise<{ new_balance: number } | null>
  setIsTyping: (v: boolean) => void
}

// ── Catálogo de presentes (espelho do backend) ──────────────
export const GIFT_CATALOG = [
  { type: 'heart',   emoji: '❤️',  name: 'Coração', petals: 5   },
  { type: 'rose',    emoji: '🌹',  name: 'Rosa',    petals: 15  },
  { type: 'cake',    emoji: '🎂',  name: 'Bolo',    petals: 30  },
  { type: 'teddy',   emoji: '🧸',  name: 'Ursinho', petals: 50  },
  { type: 'diamond', emoji: '💎',  name: 'Diamante',petals: 100 },
  { type: 'star',    emoji: '🌟',  name: 'Estrela', petals: 150 },
  { type: 'rocket',  emoji: '🚀',  name: 'Foguete', petals: 200 },
  { type: 'crown',   emoji: '👑',  name: 'Coroa',   petals: 500 },
]

// ── Hook principal ──────────────────────────────────────────
export function useChat({
  creatorId,
  chatType = 'text',
  onBalanceUpdate,
  onSessionEnded,
}: UseChatOptions): UseChatReturn {
  const supabase = createClient()

  const [session, setSession]       = useState<ChatSession | null>(null)
  const [messages, setMessages]     = useState<ChatMessage[]>([])
  const [balance, setBalance]       = useState(0)
  const [status, setStatus]         = useState<UseChatReturn['status']>('idle')
  const [error, setError]           = useState<string | null>(null)
  const [elapsedSeconds, setElapsed] = useState(0)
  const [serverDurationSeconds, setServerDurationSeconds] = useState<number | null>(null)
  const [isTyping, setIsTyping]     = useState(false)

  const channelRef    = useRef<RealtimeChannel | null>(null)
  const billingRef    = useRef<NodeJS.Timeout | null>(null)
  const elapsedRef    = useRef<NodeJS.Timeout | null>(null)
  const sessionIdRef  = useRef<string | null>(null)
  const accessTokenRef = useRef<string | null>(null)
  const statusRef = useRef<UseChatReturn['status']>('idle')
  const endingRef = useRef(false)
  const cleanupActiveSessionRef = useRef<((keepalive?: boolean) => void) | null>(null)

  const getAccessToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? null
    accessTokenRef.current = token
    return token
  }, [supabase])

  const stopBilling = useCallback(() => {
    if (billingRef.current) { clearInterval(billingRef.current); billingRef.current = null }
    if (elapsedRef.current)  { clearInterval(elapsedRef.current);  elapsedRef.current = null }
  }, [])

  const applyServerDuration = useCallback((duration: number | null | undefined) => {
    if (typeof duration !== 'number' || !Number.isFinite(duration)) return null
    const safeDuration = Math.max(0, Math.floor(duration))
    setServerDurationSeconds(safeDuration)
    setElapsed(safeDuration)
    return safeDuration
  }, [])

  const applyBalance = useCallback((newBalance: unknown) => {
    if (typeof newBalance !== 'number') return
    setBalance(newBalance)
    onBalanceUpdate?.(newBalance)
  }, [onBalanceUpdate])

  const requestEndSession = useCallback(async (
    sessionId: string,
    options: EndSessionOptions = {}
  ) => {
    const accessToken = options.keepalive ? accessTokenRef.current : await getAccessToken()

    if (!accessToken) {
      if (!options.silent) {
        setError('Nao autenticado')
        statusRef.current = 'error'
        setStatus('error')
      }
      return { ok: false, data: {} as any }
    }

    const request = fetch('/api/chat/encerrar', {
      method: 'POST',
      keepalive: Boolean(options.keepalive),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        session_id: sessionId,
        rating: options.rating,
        rating_comment: options.comment,
        cleanup_unpaid: Boolean(options.cleanupUnpaid),
      }),
    })

    if (options.keepalive) {
      void request.catch((err) => console.error('[useChat cleanup]', err))
      return { ok: true, data: {} as any }
    }

    const res = await request
    const data = await res.json().catch(() => ({}))
    applyBalance(data.new_balance)

    return { ok: res.ok, data }
  }, [applyBalance, getAccessToken])

  const chargeMinute = useCallback(async (sessionId: string): Promise<MinuteChargeOutcome> => {
    if (sessionIdRef.current !== sessionId) {
      return { ok: false, ignored: true }
    }

    const accessToken = await getAccessToken()
    if (!accessToken) {
      stopBilling()
      setError('Nao autenticado')
      statusRef.current = 'error'
      setStatus('error')
      return { ok: false, error: 'Nao autenticado' }
    }

    const res = await fetch('/api/chat/minuto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ session_id: sessionId }),
    })

    const result = (await res.json().catch(() => ({}))) as MinuteBillingResponse

    if (result.session_ended) {
      const duration = applyServerDuration(result.duration_seconds ?? result.paid_until_seconds)
      stopBilling()
      sessionIdRef.current = null
      statusRef.current = 'ended'
      setStatus('ended')
      setError(result.error ?? 'Sessao encerrada')
      onSessionEnded?.({
        duration: duration ?? 0,
        petals: result.petals_charged ?? 0,
      })
      return { ok: false, sessionEnded: true, error: result.error, result }
    }

    if (!res.ok || !result.success) {
      setError(result.error ?? 'Falha ao cobrar minuto do chat')
      return { ok: false, error: result.error ?? 'Falha ao cobrar minuto do chat', result }
    }

    applyBalance(result.new_balance)
    return { ok: true, result }
  }, [applyBalance, applyServerDuration, getAccessToken, onSessionEnded, stopBilling])

  // Busca saldo inicial do usuário
  useEffect(() => {
    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('balance_petals')
        .eq('id', user.id)
        .single()
      if (data) setBalance(data.balance_petals)
    }
    fetchBalance()
  }, [supabase])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  const cleanupActiveSession = useCallback((keepalive = false) => {
    const activeSessionId = sessionIdRef.current
    const currentStatus = statusRef.current

    if (!activeSessionId || endingRef.current) return
    if (currentStatus !== 'active' && currentStatus !== 'starting') return

    endingRef.current = true
    statusRef.current = 'ending'
    stopBilling()
    channelRef.current?.unsubscribe()
    void requestEndSession(activeSessionId, {
      keepalive,
      cleanupUnpaid: true,
      silent: true,
    })
  }, [requestEndSession, stopBilling])

  useEffect(() => {
    cleanupActiveSessionRef.current = cleanupActiveSession
  }, [cleanupActiveSession])

  // Cleanup ao desmontar
  useEffect(() => {
    const cleanupWithKeepalive = () => {
      cleanupActiveSessionRef.current?.(true)
    }

    window.addEventListener('pagehide', cleanupWithKeepalive)
    window.addEventListener('beforeunload', cleanupWithKeepalive)

    return () => {
      cleanupWithKeepalive()
      window.removeEventListener('pagehide', cleanupWithKeepalive)
      window.removeEventListener('beforeunload', cleanupWithKeepalive)
      stopBilling()
      channelRef.current?.unsubscribe()
    }
  }, [stopBilling])

  // ── Supabase Realtime ────────────────────────────────────
  const subscribeToSession = useCallback((sessionId: string) => {
    // Inscreve no canal de mensagens desta sessão específica
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage
          setMessages(prev => {
            // Evita duplicata (mensagem já inserida otimisticamente)
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      )
      // Escuta encerramento da sessão pela criadora
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'chat_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as any
          if (updated.ended_at) {
            const duration = applyServerDuration(updated.duration_seconds)
            stopBilling()
            sessionIdRef.current = null
            statusRef.current = 'ended'
            setStatus('ended')
            onSessionEnded?.({
              duration: duration ?? updated.duration_seconds,
              petals:   updated.petals_charged,
            })
          }
        }
      )
      .subscribe()

    channelRef.current = channel
  }, [applyServerDuration, onSessionEnded, stopBilling, supabase])

  // ── Billing por minuto ───────────────────────────────────
  const startBilling = useCallback((sessionId: string) => {
    // Timer de exibição (segundos decorridos)
    elapsedRef.current = setInterval(() => {
      setElapsed(s => s + 1)
    }, 1000)

    // Billing real a cada 60 segundos
    billingRef.current = setInterval(() => {
      void chargeMinute(sessionId)
    }, 60_000)
  }, [chargeMinute])

  // ── Ações públicas ───────────────────────────────────────

  const startChat = async () => {
    statusRef.current = 'starting'
    setStatus('starting')
    setError(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setError('Não autenticado')
        statusRef.current = 'error'
        setStatus('error')
        return
      }

      const res = await fetch('/api/chat/iniciar', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body:    JSON.stringify({ creator_id: creatorId, type: chatType }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao iniciar chat')
        statusRef.current = 'error'
        setStatus('error')
        return
      }

      const chatSession: ChatSession = {
        session_id:    data.session_id,
        type:          data.type,
        price_per_min: data.price_per_min,
        started_at:    data.started_at,
      }

      sessionIdRef.current = data.session_id
      endingRef.current = false
      setServerDurationSeconds(null)
      setElapsed(0)
      setSession(chatSession)

      applyBalance(data.new_balance)

      if (chatSession.type === 'video') {
        const firstCharge = await chargeMinute(data.session_id)

        if (!firstCharge.ok) {
          stopBilling()
          channelRef.current?.unsubscribe()
          await requestEndSession(data.session_id, {
            cleanupUnpaid: true,
            silent: true,
          })
          sessionIdRef.current = null
          setSession(null)
          setError(firstCharge.error ?? 'Nao foi possivel cobrar o primeiro minuto do video')
          statusRef.current = 'error'
          setStatus('error')
          return
        }
      }

      subscribeToSession(data.session_id)
      startBilling(data.session_id)
      statusRef.current = 'active'
      setStatus('active')

    } catch (err: any) {
      setError(err.message)
      statusRef.current = 'error'
      setStatus('error')
    }
  }

  const endChat = async (rating?: number, comment?: string) => {
    if (!session || endingRef.current) return
    endingRef.current = true
    statusRef.current = 'ending'
    setStatus('ending')
    stopBilling()

    try {
      const { ok, data } = await requestEndSession(session.session_id, {
        rating,
        comment,
        cleanupUnpaid: true,
      })

      if (!ok) {
        if (data.session_ended) {
          const duration = applyServerDuration(data.duration_seconds ?? data.paid_until_seconds)
          channelRef.current?.unsubscribe()
          sessionIdRef.current = null
          statusRef.current = 'ended'
          setStatus('ended')
          setError(data.error ?? 'Sessao encerrada')
          onSessionEnded?.({
            duration: duration ?? 0,
            petals: data.petals_charged ?? 0,
          })
          return
        }

        setError(data.error ?? 'Erro ao encerrar chat')
        statusRef.current = 'error'
        setStatus('error')
        endingRef.current = false
        return
      }

      channelRef.current?.unsubscribe()
      const duration = applyServerDuration(data.duration_seconds)
      sessionIdRef.current = null
      statusRef.current = 'ended'
      setStatus('ended')
      onSessionEnded?.({
        duration: duration ?? elapsedSeconds,
        petals: data.petals_charged ?? 0,
      })
    } catch (err: any) {
      setError(err.message)
      statusRef.current = 'error'
      setStatus('error')
      endingRef.current = false
    }
  }

  const sendMessage = async (content: string) => {
    if (!session || status !== 'active') return

    // Inserção otimista — adiciona a mensagem localmente antes da resposta
    const { data: { user } } = await supabase.auth.getUser()
    const optimistic: ChatMessage = {
      id:          crypto.randomUUID(),
      session_id:  session.session_id,
      sender_id:   user?.id ?? '',
      sender_role: 'user',
      content:     content.trim(),
      type:        'text',
      gift_emoji:  null,
      gift_petals: null,
      created_at:  new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id))
        setError('Não autenticado')
        return
      }

      await fetch('/api/chat/mensagem', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body:    JSON.stringify({
          session_id: session.session_id,
          content,
          type: 'text',
        }),
      })
    } catch (err) {
      // Remove otimista em caso de falha
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      console.error('[sendMessage]', err)
    }
  }

  const sendGift = async (giftType: string) => {
    if (!session || status !== 'active') return null

    try {
      const clientRequestId = crypto.randomUUID()
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setError('Não autenticado')
        return null
      }

      const res = await fetch('/api/chat/mensagem', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body:    JSON.stringify({
          session_id:        session.session_id,
          type:              'gift',
          gift_type:         giftType,
          content:           '',
          client_request_id: clientRequestId,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return null
      }

      setBalance(data.new_balance)
      onBalanceUpdate?.(data.new_balance)
      return { new_balance: data.new_balance }

    } catch (err) {
      console.error('[sendGift]', err)
      return null
    }
  }

  return {
    session,
    messages,
    balance,
    status,
    error,
    elapsedSeconds,
    serverDurationSeconds,
    isTyping,
    startChat,
    endChat,
    sendMessage,
    sendGift,
    setIsTyping,
  }
}
