'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ConfirmarContent() {
  const supabase = createClient()
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const code = params.get('code')
    if (!code) { router.push('/auth/login?error=no_code'); return }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        router.push('/auth/login?error=session_error')
      } else {
        router.push('/feed')
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white/40 text-sm">Entrando...</div>
    </div>
  )
}

export default function ConfirmarPage() {
  return <Suspense><ConfirmarContent /></Suspense>
}