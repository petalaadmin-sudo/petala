'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePix } from '@/lib/hooks/usePix'

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

type PaymentMethod = 'card' | 'pix'

export function PixCheckout({ packages, currentBalance, onSuccess }: Props) {
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError] = useState<string | null>(null)
  const supabase = createClient()
  const {
    status: pixStatus,
    charge,
    newBalance,
    petalsCredited,
    error: pixError,
    createCharge,
    reset: resetPix,
    copyQrCode,
    copied,
  } = usePix()

  const pixBusy = pixStatus === 'creating' || pixStatus === 'waiting'
  const isBusy = stripeLoading || pixBusy || pixStatus === 'paid'

  useEffect(() => {
    if (pixStatus !== 'paid' || newBalance === null) return

    const timeout = window.setTimeout(() => {
      onSuccess?.(newBalance)
    }, 1400)

    return () => window.clearTimeout(timeout)
  }, [newBalance, onSuccess, pixStatus])

  const formatPrice = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`

  const formatExpiration = (value?: string) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const qrImageSrc = charge?.pix_qr_image
    ? charge.pix_qr_image.startsWith('data:')
      ? charge.pix_qr_image
      : `data:image/png;base64,${charge.pix_qr_image}`
    : null

  const selectedTotal = selectedPkg ? selectedPkg.petals + selectedPkg.bonus_petals : 0
  const pixExpiration = formatExpiration(charge?.expires_at)

  const selectPackage = (pkg: Package) => {
    if (isBusy) return
    setSelectedPkg(pkg)
    setStripeError(null)
    if (pixStatus !== 'idle') resetPix()
  }

  const selectPaymentMethod = (method: PaymentMethod) => {
    if (isBusy) return
    setPaymentMethod(method)
    setStripeError(null)
    if (method === 'card' && pixStatus !== 'idle') resetPix()
  }

  const comprarCartao = async () => {
    if (!selectedPkg) return
    setStripeLoading(true)
    setStripeError(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('Sessao nao encontrada')
      setStripeError('Sessao nao encontrada. Entre novamente para comprar.')
      setStripeLoading(false)
      return
    }

    try {
      const res = await fetch('/api/stripe/criar-sessao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ packageName: selectedPkg.name }),
      })

      const { url, error } = await res.json()
      if (url) {
        window.location.href = url
        return
      }

      console.error(error)
      setStripeError(error ?? 'Erro ao abrir checkout do cartao.')
      setStripeLoading(false)
    } catch (error) {
      console.error('[PixCheckout Stripe]', error)
      setStripeError('Erro ao abrir checkout do cartao.')
      setStripeLoading(false)
    }
  }

  const comprarPix = async () => {
    if (!selectedPkg || pixBusy) return
    setStripeError(null)
    await createCharge(selectedPkg.id)
  }

  return (
    <div className="px-4 pb-6 pt-2">
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="text-white/40 text-xs">Seu saldo:</span>
        <span className="text-yellow-400 text-sm font-medium">🌸 {currentBalance} pétalas</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 rounded-xl bg-[#0d0d0d] p-1 border border-white/8">
        {([
          ['card', 'Cartão'],
          ['pix', 'Pix'],
        ] as const).map(([method, label]) => (
          <button
            key={method}
            type="button"
            onClick={() => selectPaymentMethod(method)}
            disabled={isBusy}
            className={`rounded-lg py-2 text-xs font-medium transition-colors disabled:opacity-60 ${
              paymentMethod === method
                ? 'bg-[#ff4d7d] text-white'
                : 'text-white/45 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {packages.map((pkg) => {
          const total = pkg.petals + pkg.bonus_petals
          const isSelected = selectedPkg?.id === pkg.id
          const isPopular = pkg.name === 'Buquê'

          return (
            <button
              key={pkg.id}
              onClick={() => selectPackage(pkg)}
              disabled={isBusy}
              className={`relative rounded-xl p-3 border text-left transition-all active:scale-95 disabled:opacity-60 ${
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
              <div className="text-white text-sm font-medium">{formatPrice(pkg.price_brl)}</div>
            </button>
          )
        })}
      </div>

      {paymentMethod === 'card' && (
        <>
          <button
            onClick={comprarCartao}
            disabled={!selectedPkg || isBusy}
            className="w-full bg-[#ff4d7d] text-white rounded-xl py-3.5 text-sm font-medium disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {stripeLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Redirecionando...
              </>
            ) : (
              `Comprar no cartão${selectedPkg ? ` - ${formatPrice(selectedPkg.price_brl)}` : ''}`
            )}
          </button>

          {stripeError && (
            <p className="text-red-300 text-xs text-center mt-3">{stripeError}</p>
          )}

          <p className="text-white/20 text-xs text-center mt-3">Pagamento seguro via Stripe</p>
        </>
      )}

      {paymentMethod === 'pix' && (
        <div className="space-y-3">
          {(pixStatus === 'idle' || pixStatus === 'error' || pixStatus === 'expired') && (
            <>
              <button
                onClick={comprarPix}
                disabled={!selectedPkg || isBusy}
                className="w-full bg-[#ff4d7d] text-white rounded-xl py-3.5 text-sm font-medium disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {pixStatus === 'creating' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Gerando Pix...
                  </>
                ) : (
                  `Gerar Pix${selectedPkg ? ` - ${formatPrice(selectedPkg.price_brl)}` : ''}`
                )}
              </button>

              {selectedPkg && (
                <p className="text-white/30 text-xs text-center">
                  Você receberá {selectedTotal} pétalas após a confirmação do pagamento.
                </p>
              )}
            </>
          )}

          {pixStatus === 'creating' && (
            <div className="rounded-xl border border-white/8 bg-[#0d0d0d] p-4 flex items-center justify-center gap-2 text-white/45 text-xs">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
              Gerando cobrança Pix...
            </div>
          )}

          {pixStatus === 'waiting' && charge && (
            <div className="rounded-xl border border-white/8 bg-[#0d0d0d] p-4">
              <div className="text-white text-sm font-medium text-center mb-3">Pagar com Pix</div>

              <div className="flex justify-center mb-3">
                <div className="bg-white rounded-xl p-3 w-44 h-44 flex items-center justify-center">
                  {qrImageSrc ? (
                    <img src={qrImageSrc} alt="QR Code Pix" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-black/40 text-xs text-center">QR Code indisponível</div>
                  )}
                </div>
              </div>

              <div className="text-center mb-3">
                <div className="text-white text-sm font-medium">{formatPrice(charge.amount_brl)}</div>
                <div className="text-yellow-400 text-xs mt-1">{charge.total_petals} pétalas</div>
                {pixExpiration && (
                  <div className="text-white/30 text-[11px] mt-1">Expira em {pixExpiration}</div>
                )}
              </div>

              {charge.pix_qr_code && (
                <>
                  <textarea
                    readOnly
                    value={charge.pix_qr_code}
                    className="w-full h-16 resize-none rounded-lg border border-white/8 bg-[#111] p-2 text-[10px] text-white/45 outline-none"
                  />
                  <button
                    onClick={copyQrCode}
                    className="mt-2 w-full rounded-lg border border-white/8 bg-[#161616] py-2 text-xs text-white/70 active:scale-95 transition-all"
                  >
                    {copied ? 'Código copiado' : 'Copiar código Pix'}
                  </button>
                </>
              )}

              <div className="mt-3 flex items-center justify-center gap-2 text-white/30 text-xs">
                <div className="w-3 h-3 border border-white/20 border-t-white/70 rounded-full animate-spin" />
                Aguardando confirmação...
              </div>
            </div>
          )}

          {pixStatus === 'paid' && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center">
              <div className="text-green-300 text-sm font-medium">Pagamento confirmado</div>
              <div className="text-white/45 text-xs mt-1">
                {petalsCredited ?? charge?.total_petals ?? selectedTotal} pétalas adicionadas.
              </div>
              {newBalance !== null && (
                <div className="text-yellow-400 text-xs mt-2">Novo saldo: {newBalance} pétalas</div>
              )}
            </div>
          )}

          {pixStatus === 'expired' && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-center text-yellow-100 text-xs">
              Este Pix expirou. Gere uma nova cobrança para continuar.
            </div>
          )}

          {pixError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-red-100 text-xs">
              {pixError}
            </div>
          )}

          <p className="text-white/20 text-xs text-center">Pagamento seguro via Pix</p>
        </div>
      )}
    </div>
  )
}
