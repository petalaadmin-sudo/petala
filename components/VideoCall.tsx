'use client'
import { useEffect, useRef, useState } from 'react'
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng'
import { createClient } from '@/lib/supabase/client'

interface VideoCallProps {
  sessionId?: string
  onEnd?: () => void
}

type AgoraTokenResponse = {
  token?: string
  appId?: string
  channelName?: string
  uid?: number
  agoraRole?: 'host' | 'audience'
  error?: string
}

export default function VideoCall({ sessionId, onEnd }: VideoCallProps) {
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localTracks, setLocalTracks] = useState<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(null)
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    if (!sessionId) {
      setError('Sessao de video ausente')
      return
    }

    let cancelled = false

    const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
    clientRef.current = client

    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType)
      if (mediaType === 'video' && remoteVideoRef.current) {
        user.videoTrack?.play(remoteVideoRef.current, { fit: 'cover' })
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play()
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
          throw new Error(tokenData.error ?? 'Token de video negado')
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
          setLocalTracks(tracks)
          await client.publish(tracks)
        }
        setJoined(true)
      } catch (err) {
        console.error('Erro ao entrar na live:', err)
        setError(err instanceof Error ? err.message : 'Erro ao entrar no video')
      }
    }

    join()

    return () => {
      cancelled = true
      localTracks?.[0].close()
      localTracks?.[1].close()
      client.leave()
    }
  }, [sessionId, supabase])

  useEffect(() => {
    if (localTracks && localVideoRef.current) {
      localTracks[1].play(localVideoRef.current, { fit: 'cover' })
    }
  }, [localTracks])

  const handleEnd = async () => {
    localTracks?.[0].close()
    localTracks?.[1].close()
    await clientRef.current?.leave()
    onEnd?.()
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-black min-h-screen">
      <div
        ref={remoteVideoRef}
        style={{
          width: '100%',
          maxWidth: '672px',
          height: '400px',
          backgroundColor: '#111',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
        }}
      />
      <div
        ref={localVideoRef}
        style={{
          width: '160px',
          height: '120px',
          backgroundColor: '#222',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
        }}
      />
      <div className="flex gap-4 mt-4">
        <button
          onClick={handleEnd}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold"
        >
          Encerrar
        </button>
      </div>
      {error && <p className="text-red-300 text-sm">{error}</p>}
      {!joined && !error && <p className="text-white">Conectando...</p>}
    </div>
  )
}
