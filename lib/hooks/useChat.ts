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

interface UseChatOptions {
  creatorId: string
  chatType?: 'text' | 'video'
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
  const [isTyping, setIsTyping]     = useState(false)

  const channelRef    = useRef<RealtimeChannel | null>(null)
  const billingRef    = useRef<NodeJS.Timeout | null>(null)
  const elapsedRef    = useRef<NodeJS.Timeout | null>(null)
  const sessionIdRef  = useRef<string | null>(null)

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
  }, [])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopBilling()
      channelRef.current?.unsubscribe()
    }
  }, [])

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
            stopBilling()
            setStatus('ended')
            onSessionEnded?.({
              duration: updated.duration_seconds,
              petals:   updated.petals_charged,
            })
          }
        }
      )
      .subscribe()

    channelRef.current = channel
  }, [supabase])

  // ── Billing por minuto ───────────────────────────────────
  const startBilling = useCallback((sessionId: string, pricePerMin: number) => {
    // Timer de exibição (segundos decorridos)
    elapsedRef.current = setInterval(() => {
      setElapsed(s => s + 1)
    }, 1000)

    // Billing real a cada 60 segundos
    billingRef.current = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: result } = await supabase.rpc('charge_chat_minute', {
        p_session_id: sessionId,
        p_user_id:    user.id,
      })

      if (result?.success) {
        setBalance(result.new_balance)
        onBalanceUpdate?.(result.new_balance)
      } else if (result?.session_ended) {
        // Saldo insuficiente — sessão encerrada pelo servidor
        stopBilling()
        setStatus('ended')
        setError('Saldo insuficiente — sessão encerrada')
        onSessionEnded?.({ duration: elapsedSeconds, petals: 0 })
      }
    }, 60_000)
  }, [supabase, elapsedSeconds])

  const stopBilling = () => {
    if (billingRef.current) { clearInterval(billingRef.current); billingRef.current = null }
    if (elapsedRef.current)  { clearInterval(elapsedRef.current);  elapsedRef.current = null }
  }

  // ── Ações públicas ───────────────────────────────────────

  const startChat = async () => {
    setStatus('starting')
    setError(null)

    try {
      const res = await fetch('/api/chat/iniciar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ creator_id: creatorId, type: chatType }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao iniciar chat')
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
      setSession(chatSession)
      setStatus('active')

      subscribeToSession(data.session_id)
      startBilling(data.session_id, data.price_per_min)

    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    }
  }

  const endChat = async (rating?: number, comment?: string) => {
    if (!session) return
    setStatus('ending')
    stopBilling()

    try {
      await fetch('/api/chat/encerrar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          session_id:      session.session_id,
          rating,
          rating_comment:  comment,
        }),
      })

      channelRef.current?.unsubscribe()
      setStatus('ended')
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
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
      await fetch('/api/chat/mensagem', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/chat/mensagem', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          session_id: session.session_id,
          type:       'gift',
          gift_type:  giftType,
          content:    '',
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
    isTyping,
    startChat,
    endChat,
    sendMessage,
    sendGift,
    setIsTyping,
  }
}
