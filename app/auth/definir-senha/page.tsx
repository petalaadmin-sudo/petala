'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MIN_PASSWORD_LENGTH = 8

export default function DefinirSenhaPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadSession = async () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const hashError = hash.get('error_description') || hash.get('error')

      if (hashError) {
        if (!active) return
        setError('Link expirado ou invalido. Solicite um novo link de recuperacao.')
        setCheckingSession(false)
        return
      }

      const code = new URLSearchParams(window.location.search).get('code')

      if (code) {
        const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)

        if (codeError) {
          if (!active) return
          setError('Link expirado ou invalido. Solicite um novo link de recuperacao.')
          setCheckingSession(false)
          return
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!active) return

      setHasSession(Boolean(session?.access_token))
      if (!session?.access_token) {
        setError('Link expirado ou invalido. Solicite um novo link de recuperacao.')
      }
      setCheckingSession(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return

      if (session?.access_token) {
        setHasSession(true)
        setError('')
      }
    })

    loadSession()

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const redirectAfterPasswordChange = async (accessToken: string, refreshToken?: string) => {
    document.cookie = `sb-access-token=${accessToken}; path=/; max-age=3600; SameSite=Lax; Secure`

    if (refreshToken) {
      document.cookie = `sb-refresh-token=${refreshToken}; path=/; max-age=86400; SameSite=Lax; Secure`
    }

    const redirectRes = await fetch('/api/auth/redirect-target', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const redirectData = await redirectRes.json().catch(() => null)

    if (redirectRes.ok && redirectData?.success && redirectData.redirectTo) {
      router.push(redirectData.redirectTo)
      return
    }

    router.push('/feed')
  }

  const submit = async () => {
    if (loading || !hasSession) return

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas nao conferem.')
      return
    }

    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setLoading(false)
      setError('Nao foi possivel definir a senha. Solicite um novo link e tente novamente.')
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      router.push('/auth/confirmar')
      return
    }

    await redirectAfterPasswordChange(session.access_token, session.refresh_token)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-xs">
        <h1 className="text-white text-2xl font-medium mb-2">Definir senha</h1>
        <p className="text-white/35 text-xs mb-8 leading-relaxed">
          Crie uma senha segura para acessar sua conta com e-mail e senha.
        </p>

        {checkingSession ? (
          <div className="text-white/35 text-sm">Validando link...</div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="nova senha"
              disabled={!hasSession}
              className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/40 disabled:opacity-50"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && submit()}
              placeholder="confirmar senha"
              disabled={!hasSession}
              className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/40 disabled:opacity-50"
            />

            {error && (
              <p className="bg-red-400/10 border border-red-400/15 rounded-xl px-4 py-3 text-red-300 text-xs leading-relaxed">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={!hasSession || loading}
              className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar senha'}
            </button>

            <a href="/auth/recuperar-senha" className="text-center text-white/35 hover:text-white/60 text-xs mt-2">
              Solicitar novo link
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
