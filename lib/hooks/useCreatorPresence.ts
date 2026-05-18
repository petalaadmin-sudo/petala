// lib/hooks/useCreatorPresence.ts
'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PresenceState {
  online: boolean
  inSession: boolean
  lastSeen: string | null
}

// Monitora presença de UMA criadora (usado na tela de perfil/chat)
export function useCreatorPresence(creatorId: string): PresenceState {
  const supabase = createClient()
  const [presence, setPresence] = useState<PresenceState>({
    online: false,
    inSession: false,
    lastSeen: null,
  })

  useEffect(() => {
    if (!creatorId) return

    let cancelled = false

    // Busca estado inicial
    supabase
      .from('creator_presence')
      .select('online, in_session, last_seen_at')
      .eq('creator_id', creatorId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) setPresence({
          online:     data.online,
          inSession:  data.in_session,
          lastSeen:   data.last_seen_at,
        })
      })

    // Escuta mudanças em tempo real
    const channelName = `creator-presence:${creatorId}:${crypto.randomUUID()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'creator_presence',
          filter: `creator_id=eq.${creatorId}`,
        },
        (payload) => {
          if (cancelled) return

          const p = payload.new as any
          setPresence({
            online:    p.online,
            inSession: p.in_session,
            lastSeen:  p.last_seen_at,
          })
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [creatorId])

  return presence
}

// Hook para a CRIADORA gerenciar a própria presença
// Deve ser montado no layout da área da criadora
export function useCreatorSelfPresence(creatorId: string) {
  const supabase = createClient()
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  const setOnline = async (online: boolean) => {
    await supabase
      .from('creator_presence')
      .upsert({
        creator_id:   creatorId,
        online,
        last_seen_at: new Date().toISOString(),
        in_session:   false,
      })
  }

  useEffect(() => {
    if (!creatorId) return

    // Marca como online ao montar
    setOnline(true)

    // Heartbeat a cada 30s para manter presença
    heartbeatRef.current = setInterval(() => setOnline(true), 30_000)

    // Marca offline ao desmontar (fechar aba/app)
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') setOnline(false)
      else setOnline(true)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('beforeunload', () => setOnline(false))

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
      setOnline(false)
    }
  }, [creatorId])

  return { setOnline }
}
