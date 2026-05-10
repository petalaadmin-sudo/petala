'use client'
import { useEffect, useRef, useState } from 'react'
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng'

interface VideoCallProps {
  channelName: string
  uid: number
  role: 'host' | 'audience'
  onEnd?: () => void
}

export default function VideoCall({ channelName, uid, role, onEnd }: VideoCallProps) {
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const [joined, setJoined] = useState(false)
  const [localTracks, setLocalTracks] = useState<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(null)
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!uid) return
    let cancelled = false

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!
    const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
    clientRef.current = client

    client.setClientRole(role === 'host' ? 'host' : 'audience')

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
        const res = await fetch('/api/agora-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelName, uid }),
        })
        const { token } = await res.json()
        if (cancelled) return
        await client.join(appId, channelName, token, uid)
        if (cancelled) return
        if (role === 'host') {
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
      }
    }

    join()

    return () => {
      cancelled = true
      localTracks?.[0].close()
      localTracks?.[1].close()
      client.leave()
    }
  }, [uid, channelName, role])

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
        ref={role === 'host' ? localVideoRef : remoteVideoRef}
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
      {role === 'audience' && (
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
      )}
      <div className="flex gap-4 mt-4">
        <button
          onClick={handleEnd}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold"
        >
          Encerrar
        </button>
      </div>
      {!joined && <p className="text-white">Conectando...</p>}
    </div>
  )
}