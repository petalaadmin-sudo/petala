// lib/hooks/usePWA.ts
'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detecta iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    // Detecta se já está rodando como PWA instalado
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(standalone)
    setIsInstalled(standalone)

    // Android/Chrome — captura o evento antes de mostrar
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Detecta quando o app é instalado
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!installPrompt) return false

    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
      setInstallPrompt(null)
      return true
    }

    return false
  }

  return {
    // true se pode instalar via prompt nativo (Android/Chrome)
    canInstall: !!installPrompt && !isInstalled,
    // true se é iOS (instrução manual: "Compartilhar → Adicionar à Tela Inicial")
    isIOS,
    isInstalled,
    isStandalone,
    install,
  }
}
