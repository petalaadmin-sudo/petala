'use client'

import type { Session } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthConfirmClient() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const handledRef = useRef(false)

  useEffect(() => {
    let active = true
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null

    const loginPathForFailure = (reason: 'link' | 'session' = 'session') => {
      const flow = new URLSearchParams(window.location.search).get('flow')

      if (flow === 'signup') {
        return '/auth/login?notice=email_confirmed_login'
      }

      if (flow === 'email' || reason === 'link') {
        return '/auth/login?error=email_link_session'
      }

      return '/auth/login?error=session_error'
    }

    const failLogin = (reason: 'link' | 'session' = 'session') => {
      if (!active || handledRef.current) return

      handledRef.current = true
      router.replace(loginPathForFailure(reason))
    }

    const finishLogin = async (session: Session) => {
      if (!active || handledRef.current) return

      handledRef.current = true

      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax; Secure`
      document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=86400; SameSite=Lax; Secure`

      // Aguarda o trigger criar/atualizar o registro em public.users antes do redirecionamento.
      await new Promise(resolve => setTimeout(resolve, 2000))

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

      try {
        const redirectRes = await fetch('/api/auth/redirect-target', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
        const redirectData = await redirectRes.json().catch(() => null)

        if (!active) return

        if (redirectRes.ok && redirectData?.success && redirectData.redirectTo) {
          router.replace(redirectData.redirectTo)
          return
        }

        router.replace('/feed')
      } catch (err) {
        console.error('[auth/confirmar] erro inesperado:', err)

        if (active) {
          router.replace('/feed')
        }
      }
    }

    const loadSession = async () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const hashError = hash.get('error_description') || hash.get('error')

      if (hashError) {
        failLogin('link')
        return
      }

      const code = new URLSearchParams(window.location.search).get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.error('[auth/confirmar] erro ao trocar code por sessão:', error)
          failLogin('session')
          return
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.access_token) {
        await finishLogin(session)
        return
      }

      fallbackTimer = setTimeout(async () => {
        const {
          data: { session: lateSession },
        } = await supabase.auth.getSession()

        if (lateSession?.access_token) {
          await finishLogin(lateSession)
          return
        }

        failLogin()
      }, 2500)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        void finishLogin(session)
      }
    })

    void loadSession()

    return () => {
      active = false
      if (fallbackTimer) clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white/40 text-sm">Entrando...</div>
    </div>
  )
}
