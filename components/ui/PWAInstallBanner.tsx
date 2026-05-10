// components/ui/PWAInstallBanner.tsx
'use client'

import { usePWA } from '@/lib/hooks/usePWA'
import { useState } from 'react'

interface Props {
  onDismiss?: () => void
  onInstalled?: () => void
}

export function PWAInstallBanner({ onDismiss, onInstalled }: Props) {
  const { canInstall, isIOS, isInstalled, install } = usePWA()
  const [installing, setInstalling] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Não mostra se já instalou ou foi dispensado
  if (isInstalled || dismissed) return null

  // Não mostra se não pode instalar e não é iOS
  if (!canInstall && !isIOS) return null

  const handleInstall = async () => {
    if (isIOS) return // iOS só tem instrução manual

    setInstalling(true)
    const success = await install()
    setInstalling(false)

    if (success) onInstalled?.()
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      {/* Overlay */}
      <div
        className="absolute inset-0 -top-screen bg-black/60"
        style={{ top: '-100vh' }}
        onClick={handleDismiss}
      />

      {/* Sheet */}
      <div className="relative bg-[#161616] rounded-t-2xl border-t border-white/10 px-4 pb-8 pt-3">
        {/* Handle */}
        <div className="w-8 h-1 bg-white/15 rounded-full mx-auto mb-4" />

        {/* Header do app */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-[#1a0d14] border border-[#ff4d7d]/30 flex items-center justify-center text-2xl">
            🌸
          </div>
          <div className="flex-1">
            <div className="text-white text-sm font-medium">Pétala</div>
            <div className="text-white/40 text-xs">petala.app · acesso instantâneo</div>
          </div>
        </div>

        {/* Descrição */}
        <p className="text-white/40 text-xs leading-relaxed mb-4">
          Adicione à tela inicial para abrir como app, receber notificações quando sua criadora favorita estiver online e ter acesso mais rápido.
        </p>

        {/* Instrução iOS */}
        {isIOS && (
          <div className="bg-black/40 rounded-xl p-3 mb-4 border border-white/5">
            <p className="text-white/50 text-xs leading-relaxed">
              Toque em{' '}
              <span className="text-white font-medium">Compartilhar</span>
              {' '}→{' '}
              <span className="text-white font-medium">Adicionar à Tela de Início</span>
            </p>
          </div>
        )}

        {/* Benefícios */}
        <div className="flex flex-col gap-2 mb-4">
          {[
            'Abre sem precisar do browser',
            'Notificações quando sua criadora está online',
            'Carregamento mais rápido',
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff4d7d] flex-shrink-0" />
              <span className="text-white/55 text-xs">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        {!isIOS && (
          <button
            onClick={handleInstall}
            disabled={installing}
            className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium mb-2 disabled:opacity-60 active:scale-95 transition-transform"
          >
            {installing ? 'Instalando…' : 'Adicionar à tela inicial'}
          </button>
        )}

        <button
          onClick={handleDismiss}
          className="w-full text-white/25 text-xs py-1"
        >
          agora não
        </button>
      </div>
    </div>
  )
}
