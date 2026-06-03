// components/album/AlbumPhoto.tsx
// Exibe uma foto do álbum:
// - Se gratuita ou já desbloqueada: foto real
// - Se bloqueada: blur hash como placeholder + overlay de cadeado
// - Ao clicar em bloqueada: abre modal de desbloqueio
'use client'

import { useState, useEffect } from 'react'
import { decode } from 'blurhash'

interface Photo {
  id: string
  r2_key: string
  r2_key_blur: string | null
  blur_hash: string | null
  is_free: boolean
  price_petals: number
  unlock_count: number
}

interface Props {
  photo: Photo
  isUnlocked: boolean       // já foi desbloqueado por este usuário
  isVip?: boolean           // VIP tem acesso a tudo
  userBalance: number
  onUnlock: (photoId: string) => Promise<{ url: string; new_balance?: number } | null>
  onInsufficientBalance: () => void  // abre modal de compra de pétalas
}

const PAID_UNLOCK_DISABLED_MESSAGE =
  'Desbloqueio pago em manutenção financeira. Fotos gratuitas continuam disponíveis.'

// ── Renderiza blur hash em canvas e converte para data URL ──
function blurHashToDataUrl(hash: string, width = 32, height = 32): string {
  try {
    const pixels = decode(hash, width, height)
    const canvas  = document.createElement('canvas')
    canvas.width  = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.createImageData(width, height)
    imageData.data.set(pixels)
    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL()
  } catch {
    return ''
  }
}

export function AlbumPhoto({
  photo,
  isUnlocked,
  isVip = false,
}: Props) {
  const [blurDataUrl, setBlurDataUrl] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const canAccess = photo.is_free || isUnlocked || isVip

  // Gera blur hash como data URL (só no browser)
  useEffect(() => {
    if (photo.blur_hash) {
      setBlurDataUrl(blurHashToDataUrl(photo.blur_hash))
    }
  }, [photo.blur_hash])

  return (
    <>
      <div
        className="relative aspect-square bg-[#161616] overflow-hidden rounded-sm cursor-pointer group"
        onClick={() => !canAccess && setShowModal(true)}
      >
        {/* Foto real (desbloqueada) */}
        {canAccess && (
          <img
            src={`/api/fotos/url?key=${photo.r2_key}`}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* Foto bloqueada — blur hash + overlay */}
        {!canAccess && (
          <>
            {/* Blur hash como background */}
            {blurDataUrl ? (
              <img
                src={blurDataUrl}
                alt=""
                className="w-full h-full object-cover scale-110 blur-sm"
                aria-hidden
              />
            ) : (
              <div className="w-full h-full bg-[#1a0812]" />
            )}

            {/* Overlay escuro com cadeado */}
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
              <div className="text-xl">🔒</div>
              <div className="text-yellow-400 text-[10px] font-medium bg-black/50 rounded-md px-2 py-0.5 text-center">
                Indisponível
              </div>
            </div>
          </>
        )}

        {/* Badge "grátis" */}
        {photo.is_free && (
          <div className="absolute top-1.5 left-1.5 bg-green-500/20 border border-green-500/40 rounded-md px-1.5 py-0.5 text-green-400 text-[8px] font-medium">
            grátis
          </div>
        )}

        {/* Badge "popular" (muitos desbloqueios) */}
        {!photo.is_free && photo.unlock_count > 50 && (
          <div className="absolute top-1.5 right-1.5 text-sm">🔥</div>
        )}

      </div>

      {/* Modal de desbloqueio */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-[#161616] rounded-t-2xl w-full max-w-sm px-5 pb-8 pt-4 border-t border-white/8 animate-slide-up">
            <div className="w-8 h-1 bg-white/15 rounded-full mx-auto mb-4" />

            {/* Preview blur */}
            {blurDataUrl && (
              <div className="w-20 h-20 mx-auto rounded-xl overflow-hidden mb-4 border border-[#ff4d7d]/20">
                <img src={blurDataUrl} className="w-full h-full object-cover blur-sm scale-110" alt="" />
              </div>
            )}

            <h3 className="text-white text-sm font-medium text-center mb-1">
              Foto paga indisponível
            </h3>
            <p className="text-white/35 text-xs text-center mb-5">
              {PAID_UNLOCK_DISABLED_MESSAGE}
            </p>

            {/* Opções */}
            <div className="flex flex-col gap-3 mb-4">
              {/* Pagamento bloqueado até existir fluxo financeiro auditável */}
              <button
                disabled
                className="flex items-center justify-between bg-[#0d0d0d] border border-white/8 rounded-xl px-4 py-3 opacity-55 cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">🌸</span>
                  <div className="text-left">
                    <div className="text-white text-xs font-medium">Em manutenção financeira</div>
                    <div className="text-white/30 text-[10px]">sem débito, sem saldo simulado</div>
                  </div>
                </div>
                <div className="text-yellow-400 text-xs font-medium">Bloqueado</div>
              </button>

              {/* VIP — acesso a tudo */}
              <button disabled className="flex items-center justify-between bg-[#1a1000] border border-yellow-400/20 rounded-xl px-4 py-3 opacity-55 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <span className="text-base">👑</span>
                  <div className="text-left">
                    <div className="text-yellow-400 text-xs font-medium">VIP em revisão</div>
                    <div className="text-white/30 text-[10px]">sem nova cobrança por aqui</div>
                  </div>
                </div>
                <div className="text-yellow-400 text-xs font-medium">Em breve</div>
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full text-white/25 text-xs py-1"
            >
              agora não
            </button>
          </div>
        </div>
      )}
    </>
  )
}
