// components/ui/ModalComprarPetalas.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useComprarPetalas } from '@/lib/hooks/useComprarPetalas'

interface Package {
  id: string
  name: string
  petals: number
  bonus_petals: number
  price_brl: number
  sort_order: number
}

interface Props {
  onClose: () => void
  onSuccess?: (newBalance: number) => void
}

// Ícone por pacote
const ICONS: Record<string, string> = {
  Semente: '🌱',
  Buquê:   '💐',
  Jardim:  '🌺',
  Paraíso: '👑',
}

export function ModalComprarPetalas({ onClose, onSuccess }: Props) {
  const [packages, setPackages] = useState<Package[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { status, pixData, newBalance, error, comprar, resetar } = useComprarPetalas()

  // Carrega pacotes disponíveis
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('petal_packages')
      .select('*')
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) {
          setPackages(data)
          // Pré-seleciona o mais popular (2º pacote)
          if (data.length >= 2) setSelected(data[1].id)
        }
      })
  }, [])

  // Quando pagamento confirmado
  useEffect(() => {
    if (status === 'pago' && newBalance !== null) {
      setTimeout(() => {
        onSuccess?.(newBalance)
        onClose()
      }, 2500)
    }
  }, [status, newBalance])

  const handleComprar = async () => {
    if (!selected) return
    await comprar(selected)
  }

  const handleCopiar = async () => {
    if (!pixData?.qr_code) return
    await navigator.clipboard.writeText(pixData.qr_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedPkg = packages.find(p => p.id === selected)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-sm bg-[#161616] rounded-t-2xl border-t border-white/8 px-4 pb-8 pt-3 animate-slide-up">
        <div className="w-8 h-1 bg-white/15 rounded-full mx-auto mb-4" />

        {/* ── TELA 1: Seleção de pacote ── */}
        {(status === 'idle' || status === 'loading') && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-sm font-medium">Comprar Pétalas</h2>
              <button onClick={onClose} className="text-white/30 text-xs">fechar</button>
            </div>

            <div className="flex flex-col gap-3 mb-5">
              {packages.map((pkg, i) => {
                const isPopular = i === 1
                const totalPetals = pkg.petals + pkg.bonus_petals
                return (
                  <button
                    key={pkg.id}
                    onClick={() => setSelected(pkg.id)}
                    className={`w-full rounded-xl p-3 flex items-center gap-3 text-left transition-all border ${
                      selected === pkg.id
                        ? 'border-[#ff4d7d] bg-[#1e0d14]'
                        : 'border-white/6 bg-[#111]'
                    }`}
                  >
                    <span className="text-2xl w-8 text-center">{ICONS[pkg.name] ?? '🌸'}</span>
                    <div className="flex-1">
                      <div className="text-white text-xs font-medium">{pkg.name}</div>
                      <div className="text-white/40 text-xs">
                        {pkg.petals} pétalas
                        {pkg.bonus_petals > 0 && (
                          <span className="text-[#00dc64] ml-1">+{pkg.bonus_petals} bônus</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm font-medium">
                        R$ {Number(pkg.price_brl).toFixed(2).replace('.', ',')}
                      </div>
                      {isPopular && (
                        <div className="text-[8px] text-[#ff4d7d] font-medium">mais popular</div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Resumo do selecionado */}
            {selectedPkg && (
              <div className="bg-[#0d0d0d] rounded-xl p-3 mb-4 flex justify-between items-center">
                <div>
                  <div className="text-white/40 text-xs">você recebe</div>
                  <div className="text-[#FFD700] text-base font-medium">
                    🌸 {selectedPkg.petals + selectedPkg.bonus_petals} pétalas
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-xs">total</div>
                  <div className="text-white text-base font-medium">
                    R$ {Number(selectedPkg.price_brl).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleComprar}
              disabled={!selected || status === 'loading'}
              className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium active:scale-95 transition-all disabled:opacity-50"
            >
              {status === 'loading' ? 'Gerando Pix…' : 'Pagar com Pix'}
            </button>

            <p className="text-white/20 text-xs text-center mt-3">
              🔒 Pagamento seguro · processado em instantes
            </p>
          </>
        )}

        {/* ── TELA 2: QR Code Pix ── */}
        {status === 'aguardando_pix' && pixData && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-sm font-medium">Pagar com Pix</h2>
              <button onClick={() => { resetar(); onClose() }} className="text-white/30 text-xs">cancelar</button>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-xl w-48 h-48 flex items-center justify-center">
                {pixData.qr_code_image ? (
                  <img
                    src={`data:image/png;base64,${pixData.qr_code_image}`}
                    alt="QR Code Pix"
                    className="w-full h-full"
                  />
                ) : (
                  <div className="text-black/30 text-xs text-center">QR Code</div>
                )}
              </div>
            </div>

            {/* Valor */}
            <div className="text-center mb-4">
              <div className="text-white text-xl font-medium">
                R$ {pixData.amount_brl.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-white/40 text-xs mt-1">
                🌸 {pixData.petals} pétalas após confirmação
              </div>
            </div>

            {/* Copia e cola */}
            <button
              onClick={handleCopiar}
              className="w-full bg-[#1e1e1e] border border-white/8 rounded-xl py-3 text-sm text-white/70 mb-3 active:scale-95 transition-all"
            >
              {copied ? '✓ Copiado!' : '📋 Copiar código Pix (copia e cola)'}
            </button>

            {/* Spinner de aguardando */}
            <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
              <div className="w-3 h-3 border border-white/20 border-t-white/70 rounded-full animate-spin" />
              aguardando confirmação do pagamento…
            </div>
          </>
        )}

        {/* ── TELA 3: Confirmado ── */}
        {status === 'pago' && (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#0e1e14] border border-[#00dc64]/30 flex items-center justify-center text-3xl">
              ✓
            </div>
            <div className="text-white text-base font-medium">Pétalas adicionadas!</div>
            <div className="text-[#FFD700] text-2xl font-medium">🌸 {pixData?.petals}</div>
            <div className="text-white/40 text-xs">seu novo saldo: {newBalance} pétalas</div>
          </div>
        )}

        {/* ── TELA 4: Expirado / Erro ── */}
        {(status === 'expirado' || status === 'erro') && (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="text-4xl">{status === 'expirado' ? '⏱' : '⚠️'}</div>
            <div className="text-white text-sm font-medium">
              {status === 'expirado' ? 'Pix expirado' : 'Erro no pagamento'}
            </div>
            <div className="text-white/40 text-xs text-center">
              {error ?? 'O tempo para pagar acabou. Tente novamente.'}
            </div>
            <button
              onClick={resetar}
              className="mt-2 bg-[#ff4d7d] text-white rounded-xl px-6 py-2.5 text-sm font-medium"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
