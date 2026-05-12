// app/auth/login/page.tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

function LoginContent() {
  const supabase = createClient()
  const params = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [refInfo, setRefInfo] = useState<{ name: string } | null>(null)

  useEffect(() => {
    if (window.location.hash.includes('access_token')) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) router.push('/auth/idade')
      })
      return
    }

    const ref = params.get('ref')
    if (!ref) return
    const code = ref.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    document.cookie = `pending_ref=${encodeURIComponent(code)}; path=/; max-age=600; SameSite=Lax`
    fetch(`/api/indicacao/validar?code=${code}`)
      .then(r => r.json())
      .then(d => { if (d.valid) setRefInfo({ name: d.name }) })
      .catch(() => {})
  }, [params])

  const loginWith = async (provider: 'google' | 'apple') => {
    setLoading(provider)
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/api/auth/callback` },
    })
  }

  const loginWithEmail = async () => {
    if (!email) return
    setLoading('email')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    })
    setLoading(null)
    if (!error) setSent(true)
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
            Continuar com {p === 'google' ? 'Google' : 'Apple'}
          </button>
        ))}
      </div>

      <div className="w-full max-w-xs flex items-center gap-3 mb-5 relative z-10">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-white/25 text-xs">ou use seu e-mail</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      <div className="w-full max-w-xs flex flex-col gap-2 relative z-10">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loginWithEmail()} placeholder="seu@email.com"
          className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/40" />
        <button onClick={loginWithEmail} disabled={!email || !!loading}
          className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50">
          {loading === 'email' ? 'Enviando…' : 'Entrar com e-mail'}
        </button>
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