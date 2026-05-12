'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const PACOTES = [
  { id: 'starter', petalas: 360, price: 15.10, label: 'Starter' },
  { id: 'popular', petalas: 650, price: 25.80, label: 'Popular' },
  { id: 'plus', petalas: 1250, price: 46.50, label: 'Plus' },
  { id: 'premium', petalas: 1800, price: 61.60, label: 'Premium' },
  { id: 'pro', petalas: 3500, price: 113.70, label: 'Pro' },
  { id: 'elite', petalas: 7000, price: 215.60, label: 'Elite' },
  { id: 'master', petalas: 15000, price: 454.20, label: 'Master' },
  { id: 'diamond', petalas: 35000, price: 1036.00, label: 'Diamond' },
]

export default function PagamentoPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const comprar = async (pacoteId: string) => {
    setLoading(pacoteId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const res = await fetch('/api/pagamento/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pacoteId, userId: user.id }),
    })

    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌸</div>
          <h1 className="text-white text-xl font-medium">Comprar Pétalas</h1>
          <p className="text-white/40 text-sm mt-1">Escolha seu pacote</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PACOTES.map(p => (
            <button key={p.id} onClick={() => comprar(p.id)} disabled={!!loading}
              className="bg-[#161616] border border-white/8 rounded-2xl p-4 text-left active:scale-95 transition-all disabled:opacity-50 hover:border-[#ff4d7d]/40">
              <div className="text-2xl mb-2">🌸</div>
              <div className="text-white font-medium text-sm">{p.petalas.toLocaleString('pt-BR')}</div>
              <div className="text-white/40 text-xs mb-3">pétalas</div>
              <div className="text-[#ff4d7d] font-medium text-sm">
                {loading === p.id ? '...' : `R$ ${p.price.toFixed(2).replace('.', ',')}`}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}