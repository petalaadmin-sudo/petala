// app/auth/idade/page.tsx
'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function GateIdadePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const confirmarIdade = async (confirmado: boolean) => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!confirmado) {
      await supabase.auth.signOut()
      router.push('/auth/bloqueado')
      return
    }

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        age_confirmed: true,
        age_confirmed_at: new Date().toISOString(),
        role: 'user',
        balance_petals: 0,
      }, { onConflict: 'id' })

    if (error) {
      console.error('Erro ao confirmar idade:', error)
    }

    try {
      await supabase.rpc('credit_petals', {
        p_user_id: user.id,
        p_amount: 50,
        p_type: 'bonus',
      })
    } catch (e) {
      console.error('Erro ao creditar pétalas:', e)
    }

window.location.href = '/feed'    
setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="flex-1 bg-[#110508] flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#ff4d7d] opacity-40" />
        <div className="text-5xl mb-3">🔞</div>
        <h1 className="text-white text-xl font-medium text-center mb-2">
          Conteúdo adulto
        </h1>
        <p className="text-white/40 text-sm text-center leading-relaxed max-w-xs">
          Este app contém conteúdo sensual e adulto. O acesso é permitido exclusivamente para pessoas com 18 anos ou mais.
        </p>
      </div>
      <div className="bg-[#0d0d0d] border-t border-white/5 px-5 py-6">
        <p className="text-white/30 text-xs text-center uppercase tracking-widest mb-4">
          Confirme sua idade
        </p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => confirmarIdade(true)}
            disabled={loading}
            className="bg-[#0e1e14] border border-[#00dc64]/35 rounded-xl py-4 text-center active:scale-95 transition-all disabled:opacity-50"
          >
            <div className="text-[#00dc64] text-lg font-medium">✓ Sim</div>
            <div className="text-[#00dc64]/50 text-xs mt-1">tenho 18 anos ou mais</div>
          </button>
          <button
            onClick={() => confirmarIdade(false)}
            disabled={loading}
            className="bg-[#1a0808] border border-[#E24B4A]/20 rounded-xl py-4 text-center active:scale-95 transition-all disabled:opacity-50"
          >
            <div className="text-[#E24B4A] text-lg font-medium">✕ Não</div>
            <div className="text-[#E24B4A]/40 text-xs mt-1">tenho menos de 18 anos</div>
          </button>
        </div>
        <p className="text-white/20 text-xs text-center leading-relaxed">
          Ao continuar você confirma ter lido e aceitar nossos{' '}
          <span className="text-[#ff4d7d]/50">Termos de Uso</span>
          {' '}e{' '}
          <span className="text-[#ff4d7d]/50">Política de Privacidade</span>
        </p>
      </div>
    </div>
  )
}