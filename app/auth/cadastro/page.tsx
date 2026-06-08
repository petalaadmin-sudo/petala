// app/auth/cadastro/page.tsx
// Página de cadastro que detecta ?ref= na URL automaticamente
'use client'

import { createClient } from '@/lib/supabase/client'
import { ReferralInput } from '@/components/ui/ReferralInput'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense, useCallback } from 'react'

const MIN_PASSWORD_LENGTH = 8

function CadastroContent() {
  const [supabase]    = useState(() => createClient())
  const router        = useRouter()
  const searchParams  = useSearchParams()

  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]         = useState<string | null>(null)
  const [sent, setSent]               = useState(false)
  const [authError, setAuthError]     = useState('')
  const [referralCode, setReferralCode] = useState<string | null>(null)

  // Extrai código da URL (?ref=XXX-XXXXX)
  const refFromUrl = searchParams.get('ref')

  const redirectExistingSession = useCallback(async (accessToken: string) => {
    const redirectRes = await fetch('/api/auth/redirect-target', {
      headers: { Authorization: `Bearer ${accessToken}` },
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session?.access_token) {
        void redirectExistingSession(session.access_token)
      }
    })

    return () => {
      cancelled = true
    }
  }, [redirectExistingSession, supabase])

  // Salva imediatamente no localStorage sem esperar validação
  useEffect(() => {
    if (refFromUrl) {
      localStorage.setItem('pending_referral_code', refFromUrl.toUpperCase())
    }
  }, [refFromUrl])

  const loginWith = async (provider: 'google' | 'apple') => {
    setLoading(provider)
    // Também salva aqui como garantia extra
    if (referralCode) localStorage.setItem('pending_referral_code', referralCode)
    else if (refFromUrl) localStorage.setItem('pending_referral_code', refFromUrl.toUpperCase())

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/api/auth/callback`,
      },
    })
  }

  const createAccountWithPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) return

    if (password.length < MIN_PASSWORD_LENGTH) {
      setAuthError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setAuthError('As senhas nao conferem.')
      return
    }

    setLoading('signup')
    setAuthError('')

    if (referralCode) localStorage.setItem('pending_referral_code', referralCode)
    else if (refFromUrl) localStorage.setItem('pending_referral_code', refFromUrl.toUpperCase())

    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    })

    setLoading(null)

    if (error) {
      setAuthError('Nao foi possivel criar sua conta com senha. Tente novamente ou use outro e-mail.')
      return
    }

    if (session?.access_token) {
      await redirectExistingSession(session.access_token)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">📩</div>
          <h2 className="text-white text-lg font-medium mb-2">Verifique seu e-mail</h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Enviamos um link de confirmacao para <span className="text-white/70">{email}</span>.
            Depois de confirmar, voce podera entrar com sua senha.
          </p>
          {referralCode && (
            <p className="text-green-400/70 text-xs mt-3">
              🌸 Código de indicação salvo — suas pétalas serão creditadas após a primeira compra
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-10">

      {/* Logo */}
      <div className="text-5xl mb-3">🌸</div>
      <h1 className="text-white text-2xl font-medium mb-1">
        pé<span className="text-[#ff4d7d]">tala</span>
      </h1>
      <p className="text-white/35 text-xs mb-8">crie sua conta grátis</p>

      {/* Banner de indicação */}
      {refFromUrl && !referralCode && (
        <div className="w-full max-w-xs bg-green-500/10 border border-green-500/25 rounded-xl px-4 py-3 flex items-center gap-2 mb-5">
          <span className="text-lg">🎁</span>
          <div>
            <div className="text-green-400 text-xs font-medium">Você foi convidado!</div>
            <div className="text-white/40 text-[10px]">Ganhe 50 🌸 ao criar sua conta</div>
          </div>
        </div>
      )}

      {/* OAuth */}
      <div className="w-full max-w-xs flex flex-col gap-3 mb-6">
        <button
          onClick={() => loginWith('google')}
          disabled={!!loading}
          className="w-full bg-[#161616] border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3 text-white text-sm active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="text-base">🌐</span>
          Continuar com Google
        </button>
        <button
          onClick={() => loginWith('apple')}
          disabled={!!loading}
          className="w-full bg-[#161616] border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3 text-white text-sm active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="text-base">🍎</span>
          Continuar com Apple
        </button>
      </div>

      {/* Divider */}
      <div className="w-full max-w-xs flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-white/25 text-xs">ou e-mail</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createAccountWithPassword()}
          placeholder="seu@email.com"
          className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/40"
        />

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createAccountWithPassword()}
          placeholder="senha"
          className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/40"
        />

        <input
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createAccountWithPassword()}
          placeholder="confirmar senha"
          className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/40"
        />

        {/* Campo de indicação */}
        <ReferralInput
          initialCode={refFromUrl ?? undefined}
          onValidCode={(code) => setReferralCode(code)}
          onClear={() => setReferralCode(null)}
        />

        {authError && (
          <p className="bg-red-400/10 border border-red-400/15 rounded-xl px-4 py-3 text-red-300 text-xs leading-relaxed">
            {authError}
          </p>
        )}

        <button
          onClick={createAccountWithPassword}
          disabled={!email || !password || !confirmPassword || !!loading}
          className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium active:scale-95 transition-all disabled:opacity-50"
        >
          {loading === 'signup' ? 'Criando...' : 'Criar conta com senha'}
        </button>
      </div>

      <p className="text-white/20 text-xs text-center mt-6 leading-relaxed max-w-xs">
        Ao criar conta você confirma ter <span className="text-[#ff4d7d]/50">18 anos ou mais</span> e aceita os Termos de Uso
      </p>
    </div>
  )
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#0a0a0a]" />}>
      <CadastroContent />
    </Suspense>
  )
}
