// components/ui/PixCheckout.tsx
'use client'

import { usePix } from '@/lib/hooks/usePix'
import { useEffect, useState } from 'react'

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

export function PixCheckout({ packages, currentBalance, onSuccess, onClose }: Props) {
  const { status, charge, newBalance, petalsCredited, error, createCharge, reset, copyQrCode, copied } = usePix()
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')

  // Countdown do QR Code
  useEffect(() => {
    if (!charge?.expires_at) return

    const update = () => {
      const diff = new Date(charge.expires_at).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Expirado'); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [charge?.expires_at])

  // Notifica sucesso para o pai
  useEffect(() => {
    if (status === 'paid' && newBalance !== null) {
      onSuccess?.(newBalance)
    }
  }, [status, newBalance])

  // ── TELA: Sucesso ──────────────────────────────────────────
  if (status === 'paid') {
    return (
      <div className="flex flex-col items-center px-5 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/40 flex items-center justify-center text-3xl mb-4">
          ✓
        </div>
        <h2 className="text-white text-lg font-medium mb-1">Pétalas adicionadas!</h2>
        <p className="text-white/40 text-sm mb-6">Pagamento confirmado com sucesso</p>

        <div className="w-full bg-[#111] rounded-xl p-4 mb-4 border border-white/5">
          <div className="flex justify-between mb-2">
            <span className="text-white/40 text-xs">Pétalas creditadas</span>
            <span className="text-yellow-400 text-xs font-medium">+{petalsCredited} 🌸</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40 text-xs">Novo saldo</span>
            <span className="text-white text-xs font-medium">{newBalance} 🌸</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium active:scale-95 transition-transform"
        >
          Continuar
        </button>
      </div>
    )
  }

  // ── TELA: QR Code aguardando pagamento ─────────────────────
  if (status === 'waiting' && charge) {
    return (
      <div className="flex flex-col items-center px-5 py-6">
        <div className="flex items-center justify-between w-full mb-4">
          <button onClick={reset} className="text-white/30 text-sm">← Voltar</button>
          <span className="text-white/40 text-xs">Expira em <span className="text-orange-400">{timeLeft}</span></span>
        </div>

        {/* QR Code */}
        <div className="bg-white p-3 rounded-xl mb-4">
          {charge.pix_qr_image ? (
            <img
              src={`data:image/png;base64,${charge.pix_qr_image}`}
              alt="QR Code Pix"
              className="w-44 h-44"
            />
          ) : (
            <div className="w-44 h-44 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
              QR Code
            </div>
          )}
        </div>

        {/* Valor */}
        <div className="text-center mb-4">
          <div className="text-white text-2xl font-medium">
            R$ {charge.amount_brl.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-white/40 text-xs mt-1">
            {charge.package_name} · {charge.total_petals} 🌸
          </div>
        </div>

        {/* Copia e Cola */}
        <button
          onClick={copyQrCode}
          className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 text-sm text-white/70 mb-3 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          {copied ? '✓ Copiado!' : '📋 Copiar código Pix'}
        </button>

        {/* Status */}
        <div className="flex items-center gap-2 text-white/30 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Aguardando pagamento…
        </div>
      </div>
    )
  }

  // ── TELA: Erro ─────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center px-5 py-8 text-center">
        <div className="text-4xl mb-3">😕</div>
        <h2 className="text-white text-base font-medium mb-2">Algo deu errado</h2>
        <p className="text-white/40 text-sm mb-6">{error}</p>
        <button
          onClick={reset}
          className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  // ── TELA: Expirado ─────────────────────────────────────────
  if (status === 'expired') {
    return (
      <div className="flex flex-col items-center px-5 py-8 text-center">
        <div className="text-4xl mb-3">⏰</div>
        <h2 className="text-white text-base font-medium mb-2">QR Code expirado</h2>
        <p className="text-white/40 text-sm mb-6">O código Pix expirou. Gere um novo para continuar.</p>
        <button
          onClick={reset}
          className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium"
        >
          Gerar novo Pix
        </button>
      </div>
    )
  }

  // ── TELA: Escolha de pacote (default) ──────────────────────
  return (
    <div className="px-4 pb-6 pt-2">
      {/* Saldo atual */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="text-white/40 text-xs">Seu saldo:</span>
        <span className="text-yellow-400 text-sm font-medium">🌸 {currentBalance} pétalas</span>
      </div>

      {/* Grid de pacotes */}
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
                {pkg.name === 'Semente' ? '🌱' : pkg.name === 'Buquê' ? '💐' : pkg.name === 'Jardim' ? '🌺' : '✨'}
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

      {/* Botão de pagar */}
      <button
        onClick={() => selectedPkg && createCharge(selectedPkg.id)}
        disabled={!selectedPkg || status === 'creating'}
        className="w-full bg-[#ff4d7d] text-white rounded-xl py-3.5 text-sm font-medium disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {status === 'creating' ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Gerando Pix…
          </>
        ) : (
          `Pagar com Pix${selectedPkg ? ` — R$ ${selectedPkg.price_brl.toFixed(2).replace('.', ',')}` : ''}`
        )}
      </button>

      <p className="text-white/20 text-xs text-center mt-3">🔒 Pagamento instantâneo e seguro via Pix</p>
    </div>
  )
}
