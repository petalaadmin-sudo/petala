'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MIN_PASSWORD_LENGTH = 8

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      {visible ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
          <path d="M9.88 4.24A9.5 9.5 0 0 1 12 4c5 0 8.5 4 10 8a13.4 13.4 0 0 1-3.17 4.68" />
          <path d="M6.61 6.61A13.15 13.15 0 0 0 2 12c1.5 4 5 8 10 8a9.4 9.4 0 0 0 4.06-.9" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  )
}

export default function DefinirSenhaPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
        setError('Link expirado ou inválido. Solicite um novo link de recuperação.')
        setCheckingSession(false)
        return
      }

      const code = new URLSearchParams(window.location.search).get('code')

      if (code) {
        const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)

        if (codeError) {
          if (!active) return
          setError('Link expirado ou inválido. Solicite um novo link de recuperação.')
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
        setError('Link expirado ou inválido. Solicite um novo link de recuperação.')
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
      setError('As senhas não conferem.')
      return
    }

    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setLoading(false)
      setError('Não foi possível definir a senha agora. Solicite um novo link e tente novamente.')
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
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="nova senha"
                disabled={!hasSession}
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/40 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(value => !value)}
                disabled={!hasSession}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/35 transition hover:bg-white/5 hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d7d]/40 disabled:opacity-40"
              >
                <PasswordVisibilityIcon visible={showPassword} />
              </button>
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && submit()}
                placeholder="confirmar senha"
                disabled={!hasSession}
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/40 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(value => !value)}
                disabled={!hasSession}
                aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/35 transition hover:bg-white/5 hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d7d]/40 disabled:opacity-40"
              >
                <PasswordVisibilityIcon visible={showConfirmPassword} />
              </button>
            </div>

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
