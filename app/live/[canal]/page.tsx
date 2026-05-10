'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
const VideoCall = dynamic(() => import('@/components/VideoCall'), { ssr: false })

export default function LivePage() {
  const params = useParams()
  const canal = decodeURIComponent(params.canal as string)
  const [uid, setUid] = useState<number>(0)
  const [role, setRole] = useState<'host' | 'audience'>('audience')
  const [ready, setReady] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: creator } = await supabase
          .from('creators')
          .select('id, name')
          .eq('user_id', user.id)
          .single()
        const newUid = Math.floor(Math.random() * 100000) + 1
        setUid(newUid)
        if (creator && creator.name === canal) {
          setRole('host')
        }
      }
      setReady(true)
    }
    getUser()
  }, [canal])

  if (!ready || !uid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <p className="text-white">Conectando...</p>
      </div>
    )
  }

  return (
    <VideoCall
      channelName={canal}
      uid={uid}
      role={role}
      onEnd={() => window.history.back()}
    />
  )
}