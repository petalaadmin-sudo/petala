// app/auth/login/page.tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense, useCallback } from 'react'

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

function LoginContent() {
  const [supabase] = useState(() => createClient())
  const params = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginMode, setLoginMode] = useState<'password' | 'email'>('password')
  const [loading, setLoading] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [authError, setAuthError] = useState('')
  const [routeMessage, setRouteMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [refInfo, setRefInfo] = useState<{ name: string } | null>(null)

  const redirectAfterPasswordLogin = useCallback(async (accessToken: string, refreshToken?: string) => {
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
  }, [router])

  useEffect(() => {
    let cancelled = false

    const redirectExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (cancelled) return true

      if (session?.access_token) {
        void redirectAfterPasswordLogin(session.access_token, session.refresh_token)
        return true
      }

      return false
    }

    void redirectExistingSession().then((didRedirect) => {
      if (cancelled || didRedirect || window.location.hash.includes('access_token')) return

      const notice = params.get('notice')
      const error = params.get('error')
      const clearAuthQuery = () => {
        const cleanUrl = new URL(window.location.href)

        cleanUrl.searchParams.delete('notice')
        cleanUrl.searchParams.delete('error')
        window.history.replaceState(
          null,
          '',
          `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`,
        )
      }

      if (notice === 'email_confirmed_login') {
        setLoginMode('password')
        setRouteMessage({
          tone: 'info',
          text: 'E-mail confirmado com sucesso. Entre com sua senha para continuar.',
        })
        clearAuthQuery()
      } else if (error === 'email_link_session') {
        setLoginMode('email')
        setRouteMessage({
          tone: 'error',
          text: 'Não conseguimos abrir uma sessão com este link. Solicite um novo link ou entre com sua senha.',
        })
        clearAuthQuery()
      } else if (error === 'auth_link_invalid') {
        setRouteMessage({
          tone: 'error',
          text: 'Este link expirou ou não é mais válido. Tente entrar novamente.',
        })
        clearAuthQuery()
      } else if (error === 'session_error' || error === 'callback_error') {
        setRouteMessage({
          tone: 'error',
          text: 'Não conseguimos concluir sua entrada automaticamente. Entre novamente para continuar.',
        })
        clearAuthQuery()
      } else {
        setRouteMessage(null)
      }

      const ref = params.get('ref')
      if (!ref) return
      const code = ref.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
      document.cookie = `pending_ref=${encodeURIComponent(code)}; path=/; max-age=600; SameSite=Lax`
      fetch(`/api/indicacao/validar?code=${code}`)
        .then(r => r.json())
        .then(d => { if (d.valid) setRefInfo({ name: d.name }) })
        .catch(() => {})
    })

    return () => {
      cancelled = true
    }
  }, [params, redirectAfterPasswordLogin, supabase])

  const loginWith = async (provider: 'google' | 'apple') => {
    setLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/api/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) setLoading(null)
  }

  const loginWithEmail = async () => {
    if (!email) return
    setLoading('email')
    setAuthError('')
    setRouteMessage(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${location.origin}/api/auth/callback?flow=email` },
    })
    setLoading(null)
    if (error) {
      setAuthError('Não foi possível enviar o link agora. Tente novamente em instantes.')
      return
    }

    setSent(true)
  }

  const loginWithPassword = async () => {
    if (!email || !password) return

    setLoading('password')
    setAuthError('')
    setRouteMessage(null)

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error || !session?.access_token) {
        setAuthError('E-mail ou senha inválidos.')
        setLoading(null)
        return
      }

      await redirectAfterPasswordLogin(session.access_token, session.refresh_token)
    } catch (error) {
      console.error('[auth/login] password login', error)
      setAuthError('Não foi possível entrar agora. Tente novamente em instantes.')
      setLoading(null)
    }
  }

  if (sent) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-4xl mb-4">📩</div>
        <h2 className="text-white text-lg font-medium mb-2">Verifique seu e-mail</h2>
        <p className="text-white/40 text-sm">Link enviado para <span className="text-white/70">{email}</span></p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">
      <div className="absolute top-[-60px] right-[-80px] w-72 h-72 rounded-full bg-[#ff4d7d] opacity-[0.06]" />
      <div className="absolute bottom-[-40px] left-[-60px] w-52 h-52 rounded-full bg-[#ff4d7d] opacity-[0.06]" />

      {refInfo && (
        <div className="w-full max-w-xs mb-6 bg-[#0e1e14] border border-green-500/25 rounded-xl px-4 py-3 relative z-10">
          <div className="flex items-center gap-2">
            <span>🎁</span>
            <div>
              <div className="text-green-400 text-xs font-medium">Convite de {refInfo.name}</div>
              <div className="text-white/35 text-[10px]">Ganhe 50 pétalas grátis ao se cadastrar</div>
            </div>
          </div>
        </div>
      )}

      <div className="text-5xl mb-3 relative z-10">🌸</div>
      <h1 className="text-white text-2xl font-medium mb-1 relative z-10">pé<span className="text-[#ff4d7d]">tala</span></h1>
      <p className="text-white/35 text-xs mb-10 relative z-10">conteúdo exclusivo de verdade</p>

      <div className="w-full max-w-xs flex flex-col gap-3 mb-6 relative z-10">
        {(['google', 'apple'] as const).map(p => (
          <button key={p} onClick={() => loginWith(p)} disabled={!!loading}
            className="w-full bg-[#161616] border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3 text-white text-sm active:scale-95 transition-all disabled:opacity-50">
            <span>{p === 'google' ? '🌐' : '🍎'}</span>
            {loading === p ? 'Carregando...' : `Continuar com ${p === 'google' ? 'Google' : 'Apple'}`}
          </button>
        ))}
      </div>

      <div className="w-full max-w-xs flex items-center gap-3 mb-5 relative z-10">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-white/25 text-xs">ou use seu e-mail</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      {routeMessage && (
        <div className={`w-full max-w-xs mb-5 rounded-xl border px-4 py-3 text-xs leading-relaxed relative z-10 ${
          routeMessage.tone === 'info'
            ? 'bg-green-400/10 border-green-400/20 text-green-200'
            : 'bg-red-400/10 border-red-400/20 text-red-200'
        }`}>
          {routeMessage.text}
        </div>
      )}

      <div className="w-full max-w-xs flex flex-col gap-3 relative z-10">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#111] border border-white/8 p-1">
          <button
            type="button"
            onClick={() => {
              setLoginMode('password')
              setAuthError('')
              setRouteMessage(null)
            }}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              loginMode === 'password'
                ? 'bg-white/10 text-white'
                : 'text-white/35 hover:text-white/60'
            }`}
          >
            Senha
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('email')
              setAuthError('')
              setRouteMessage(null)
            }}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              loginMode === 'email'
                ? 'bg-white/10 text-white'
                : 'text-white/35 hover:text-white/60'
            }`}
          >
            Link por e-mail
          </button>
        </div>

        {loginMode === 'password' ? (
          <>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loginWithPassword()} placeholder="seu@email.com"
              className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/40" />
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loginWithPassword()} placeholder="senha"
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/40" />
              <button
                type="button"
                onClick={() => setShowPassword(value => !value)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/35 transition hover:bg-white/5 hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d7d]/40"
              >
                <PasswordVisibilityIcon visible={showPassword} />
              </button>
            </div>
            {authError && (
              <p className="text-red-300/80 text-xs leading-relaxed">{authError}</p>
            )}
            <button onClick={loginWithPassword} disabled={!email || !password || !!loading}
              className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50">
              {loading === 'password' ? 'Entrando...' : 'Entrar com senha'}
            </button>
            <a href="/auth/recuperar-senha" className="text-center text-white/35 hover:text-white/60 text-xs mt-1">
              Esqueci minha senha
            </a>
          </>
        ) : (
          <>
            <p className="text-white/35 text-xs leading-relaxed">
              Receba um link seguro no seu e-mail para entrar sem usar senha.
            </p>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loginWithEmail()} placeholder="seu@email.com"
              className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/40" />
            {authError && (
              <p className="text-red-300/80 text-xs leading-relaxed">{authError}</p>
            )}
            <button onClick={loginWithEmail} disabled={!email || !!loading}
              className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50">
              {loading === 'email' ? 'Enviando...' : 'Enviar link por e-mail'}
            </button>
          </>
        )}
      </div>

      <p className="text-white/20 text-xs text-center mt-6 leading-relaxed max-w-xs relative z-10">
        Ao entrar você confirma ter <span className="text-[#ff4d7d]/50">18 anos ou mais</span> e aceita nossos Termos de Uso
      </p>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>
}
