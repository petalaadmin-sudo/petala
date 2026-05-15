// app/auth/confirmar/page.tsx
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ConfirmarPage() {
  const supabase = createClient()
  const router   = useRouter()

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        router.push('/auth/login?error=session_error')
        return
      }

      // Salva cookies para o middleware
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax; Secure`
      document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=86400; SameSite=Lax; Secure`

      // Processa indicação pendente
      const pendingCode = localStorage.getItem('pending_referral_code')
      if (pendingCode && session.user?.id) {
        try {
          const res = await fetch('/api/indicacao/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referral_code: pendingCode,
              user_id: session.user.id,
            }),
          })
          const data = await res.json()
          console.log('[indicacao]', data)
        } catch (err) {
          console.error('[indicacao] Erro:', err)
        } finally {
          localStorage.removeItem('pending_referral_code')
        }
      }

      router.push('/feed')
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white/40 text-sm">Entrando...</div>
    </div>
  )
}