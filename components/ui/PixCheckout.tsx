'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Package {
  id: string
  name: string
  petals: number
  bonus_petals: number
  price_brl: number
}

interface Props {
  packages: Package[]
  currentBalance: number
  onSuccess?: (newBalance: number) => void
  onClose?: () => void
}

export function PixCheckout({ packages, currentBalance, onClose }: Props) {
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const comprar = async () => {
    if (!selectedPkg) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const res = await fetch('/api/stripe/criar-sessao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageName: selectedPkg.name, userId: user.id }),
    })

    const { url, error } = await res.json()
    if (url) {
      window.location.href = url
    } else {
      console.error(error)
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pb-6 pt-2">
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="text-white/40 text-xs">Seu saldo:</span>
        <span className="text-yellow-400 text-sm font-medium">🌸 {currentBalance} pétalas</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {packages.map((pkg) => {
          const total = pkg.petals + pkg.bonus_petals
          const isSelected = selectedPkg?.id === pkg.id
          const isPopular = pkg.name === 'Buquê'

          return (
            <button
              key={pkg.id}
              onClick={() => setSelectedPkg(pkg)}
              className={`relative rounded-xl p-3 border text-left transition-all active:scale-95 ${
                isSelected
                  ? 'border-[#ff4d7d] bg-[#1e0d14]'
                  : 'border-white/8 bg-[#111]'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#ff4d7d] rounded-md px-2 py-0.5 text-white text-[9px] font-medium whitespace-nowrap">
                  mais popular
                </div>
              )}
              <div className="text-xl mb-1">
                {pkg.name === 'Semente' ? '🌱' :
                 pkg.name === 'Buquê' ? '💐' :
                 pkg.name === 'Jardim' ? '🌺' :
                 pkg.name === 'Paraíso' ? '✨' :
                 pkg.name === 'Pétala de Ouro' ? '🏅' :
                 pkg.name === 'Florescer' ? '🌷' :
                 pkg.name === 'Plena Flor' ? '🌹' : '💎'}
              </div>
              <div className="text-white text-sm font-medium">{total} <span className="text-yellow-400 text-xs">🌸</span></div>
              {pkg.bonus_petals > 0 && (
                <div className="text-green-400 text-[10px] mb-1">+{pkg.bonus_petals} bônus</div>
              )}
              <div className="text-white text-sm font-medium">
                R$ {pkg.price_brl.toFixed(2).replace('.', ',')}
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={comprar}
        disabled={!selectedPkg || loading}
        className="w-full bg-[#ff4d7d] text-white rounded-xl py-3.5 text-sm font-medium disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Redirecionando…
          </>
        ) : (
          `Comprar${selectedPkg ? ` — R$ ${selectedPkg.price_brl.toFixed(2).replace('.', ',')}` : ''}`
        )}
      </button>

      <p className="text-white/20 text-xs text-center mt-3">🔒 Pagamento seguro via Stripe</p>
    </div>
  )
}