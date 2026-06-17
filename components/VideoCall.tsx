'use client'
import { useEffect, useRef, useState } from 'react'
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng'
import { createClient } from '@/lib/supabase/client'

interface VideoCallProps {
  sessionId?: string
  onEnd?: () => void
  onError?: (message: string, code?: string) => void
}

type AgoraTokenResponse = {
  token?: string
  appId?: string
  channelName?: string
  uid?: number
  agoraRole?: 'host' | 'audience'
  error?: string
  code?: string
}

export default function VideoCall({ sessionId, onEnd, onError }: VideoCallProps) {
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const tracksRef = useRef<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(null)
  const [joined, setJoined] = useState(false)
  const [remoteJoined, setRemoteJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localTracks, setLocalTracks] = useState<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(null)
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    if (!sessionId) {
      const message = 'Sessao de video ausente'
      setError(message)
      onError?.(message, 'SESSION_ID_REQUIRED')
      return
    }

    let cancelled = false

    const setup = async () => {
      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng')
      if (cancelled) return

      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
      clientRef.current = client

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType)
        if (mediaType === 'video' && remoteVideoRef.current) {
          user.videoTrack?.play(remoteVideoRef.current, { fit: 'cover' })
          setRemoteJoined(true)
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play()
        }
      })

      client.on('user-unpublished', (_user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteJoined(false)
        }
      })

      const join = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const accessToken = session?.access_token

          if (!accessToken) {
            throw new Error('Nao autenticado')
          }

          const res = await fetch('/api/agora-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ session_id: sessionId }),
          })

          const tokenData = (await res.json()) as AgoraTokenResponse

          if (!res.ok || !tokenData.token || !tokenData.appId || !tokenData.channelName || !tokenData.uid) {
            const message = tokenData.code === 'VIDEO_NOT_READY'
              ? 'Vídeo em preparação. Aguarde a ativação segura do fluxo.'
              : tokenData.error ?? 'Token de video negado'
            const tokenError = new Error(message) as Error & { code?: string }
            tokenError.code = tokenData.code
            throw tokenError
          }

          if (cancelled) return

          const agoraRole = tokenData.agoraRole ?? 'host'
          client.setClientRole(agoraRole)

          await client.join(tokenData.appId, tokenData.channelName, tokenData.token, tokenData.uid)
          if (cancelled) return

          if (agoraRole === 'host') {
            const tracks = await AgoraRTC.createMicrophoneAndCameraTracks()
            if (cancelled) {
              tracks[0].close()
              tracks[1].close()
              return
            }
            tracksRef.current = tracks
            setLocalTracks(tracks)
            await client.publish(tracks)
          }
          setJoined(true)
        } catch (err) {
          console.error('[VideoCall]', err)
          const message = err instanceof Error ? err.message : 'Erro ao entrar no video'
          const code = typeof (err as { code?: unknown })?.code === 'string'
            ? (err as { code: string }).code
            : undefined
          setError(message)
          onError?.(message, code)
        }
      }

      join()
    }

    void setup().catch((err) => {
      console.error('[VideoCall setup]', err)
      const message = err instanceof Error ? err.message : 'Erro ao preparar video'
      setError(message)
      onError?.(message)
    })

    return () => {
      cancelled = true
      const tracks = tracksRef.current
      tracks?.[0].close()
      tracks?.[1].close()
      tracksRef.current = null
      setLocalTracks(null)
      setJoined(false)
      setRemoteJoined(false)
      void clientRef.current?.leave().catch((err) => console.error('[VideoCall leave]', err))
    }
  }, [onError, sessionId, supabase])

  useEffect(() => {
    if (localTracks && localVideoRef.current) {
      localTracks[1].play(localVideoRef.current, { fit: 'cover' })
    }
  }, [localTracks])

  const handleEnd = async () => {
    tracksRef.current?.[0].close()
    tracksRef.current?.[1].close()
    tracksRef.current = null
    setLocalTracks(null)
    setJoined(false)
    setRemoteJoined(false)

    try {
      await clientRef.current?.leave()
    } catch (err) {
      console.error('[VideoCall end]', err)
    } finally {
      onEnd?.()
    }
  }

  return (
    <div className="relative flex h-full min-h-[320px] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div ref={remoteVideoRef} className="absolute inset-0 bg-[#111]" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {!joined && !error && (
          <p className="rounded-full bg-black/60 px-4 py-2 text-xs text-white/80">
            Conectando video seguro...
          </p>
        )}
        {joined && !remoteJoined && (
          <p className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/70">
            Aguardando participante remoto
          </p>
        )}
      </div>
      <div ref={localVideoRef} className="absolute bottom-3 right-3 h-28 w-36 overflow-hidden rounded-xl border border-white/20 bg-[#222]" />
      <div className="absolute bottom-3 left-3 flex gap-3">
        <button
          onClick={handleEnd}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-full text-sm font-semibold"
        >
          Encerrar video
        </button>
      </div>
      {error && (
        <div className="absolute inset-x-4 top-4 rounded-xl border border-red-500/25 bg-red-950/80 p-3 text-xs text-red-100">
          {error}
        </div>
      )}
    </div>
  )
}
