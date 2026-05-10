'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function ConfirmarContent() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const code = params.get('code')
    if (!code) {
      router.push('/auth/login?error=no_code')
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error('Erro:', error)
        router.push('/auth/login?error=auth_failed')
      } else {
        router.push('/auth/idade')
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