'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function ConfirmarContent() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/auth/idade')
      } else {
        supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            router.push('/auth/idade')
          } else {
            router.push('/auth/login?error=auth_failed')
          }
        })
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#ff4d7d]/30 border-t-[#ff4d7d] rounded-full animate-spin" />
    </div>
  )
}

export default function ConfirmarPage() {
  return <Suspense><ConfirmarContent /></Suspense>
}