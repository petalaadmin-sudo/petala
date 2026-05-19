// app/auth/confirmar/page.tsx
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ConfirmarPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        router.push('/auth/login?error=session_error')
        return
      }

      // Salva cookies para compatibilidade com middleware/rotas antigas
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax; Secure`
      document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=86400; SameSite=Lax; Secure`

      // Aguarda o trigger criar o registro em public.users
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Processa indicação pendente
      const pendingCode = localStorage.getItem('pending_referral_code')

      if (pendingCode && session.user?.id) {
        try {
          const res = await fetch('/api/indicacao/registrar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
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

      // Verifica se é admin
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('[auth/confirmar] erro ao buscar role:', error)
          router.push('/feed')
          return
        }

        const redirectRes = await fetch('/api/auth/redirect-target', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
        const redirectData = await redirectRes.json()

        if (redirectRes.ok && redirectData?.success && redirectData.redirectTo) {
          router.push(redirectData.redirectTo)
          return
        }

        if (userData?.role === 'admin') router.push('/admin')
        else router.push('/feed')
      } catch (err) {
        console.error('[auth/confirmar] erro inesperado:', err)
        router.push('/feed')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white/40 text-sm">Entrando...</div>
    </div>
  )
}
