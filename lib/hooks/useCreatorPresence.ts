// lib/hooks/useCreatorPresence.ts
'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PresenceState {
  online: boolean
  inSession: boolean
  lastSeen: string | null
}

// Monitora presenca de uma criadora, usado na tela de perfil/chat.
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

    supabase
      .from('creator_presence')
      .select('online, in_session, last_seen_at')
      .eq('creator_id', creatorId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) {
          setPresence({
            online: data.online,
            inSession: data.in_session,
            lastSeen: data.last_seen_at,
          })
        }
      })

    const channelName = `creator-presence:${creatorId}:${crypto.randomUUID()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_presence',
          filter: `creator_id=eq.${creatorId}`,
        },
        (payload) => {
          if (cancelled) return

          const p = payload.new as any
          setPresence({
            online: p.online,
            inSession: p.in_session,
            lastSeen: p.last_seen_at,
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

// Hook para a criadora gerenciar a propria presenca.
// O heartbeat respeita a intencao manual: offline nao volta sozinho.
export function useCreatorSelfPresence(creatorId: string) {
  const [supabase] = useState(() => createClient())
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const presenceLogKeyRef = useRef<string | null>(null)
  const desiredOnlineRef = useRef(false)

  const writePresence = useCallback(async (online: boolean) => {
    if (!creatorId) return

    const { error: presenceError } = await supabase
      .from('creator_presence')
      .upsert({
        creator_id: creatorId,
        online,
        last_seen_at: new Date().toISOString(),
        in_session: false,
      })

    if (presenceError) {
      console.warn('[useCreatorSelfPresence] creator_presence upsert', presenceError)
      throw presenceError
    }

    if (online) {
      if (!presenceLogKeyRef.current) {
        presenceLogKeyRef.current = `presence:${creatorId}:${crypto.randomUUID()}`
      }

      const { error } = await supabase.rpc('start_creator_presence_log', {
        p_creator_id: creatorId,
        p_source: 'app_presence',
        p_idempotency_key: presenceLogKeyRef.current,
      })

      if (error) {
        console.warn('[useCreatorSelfPresence] start_creator_presence_log', error)
      }

      return
    }

    const { error } = await supabase.rpc('end_creator_presence_log', {
      p_creator_id: creatorId,
      p_source: 'app_presence',
    })

    if (error) {
      console.warn('[useCreatorSelfPresence] end_creator_presence_log', error)
    }

    presenceLogKeyRef.current = null
  }, [creatorId, supabase])

  const syncDesiredOnline = useCallback((online: boolean) => {
    desiredOnlineRef.current = online

    if (!online) {
      presenceLogKeyRef.current = null
    }
  }, [])

  const setOnline = useCallback(async (online: boolean) => {
    desiredOnlineRef.current = online
    await writePresence(online)
  }, [writePresence])

  useEffect(() => {
    if (!creatorId) return

    heartbeatRef.current = setInterval(() => {
      if (desiredOnlineRef.current) {
        void writePresence(true)
      }
    }, 30_000)

    const handleVisibility = () => {
      if (!desiredOnlineRef.current) return

      if (document.visibilityState === 'hidden') {
        void writePresence(false)
      } else {
        void writePresence(true)
      }
    }

    const handleBeforeUnload = () => {
      if (desiredOnlineRef.current) {
        void writePresence(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleBeforeUnload)

      if (desiredOnlineRef.current) {
        void writePresence(false)
      }
    }
  }, [creatorId, writePresence])

  return { setOnline, syncDesiredOnline }
}
