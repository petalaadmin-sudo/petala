// lib/hooks/usePix.ts
'use client'

import { useEffect, useRef, useState } from 'react'

type PixStatus = 'idle' | 'creating' | 'waiting' | 'paid' | 'expired' | 'error'

const PIX_UNAVAILABLE_MESSAGE = 'Pix em preparação. Use cartão ou tente novamente mais tarde.'

const PIX_UNAVAILABLE_CODES = new Set([
  'PIX_UNAVAILABLE',
  'PAGGUE_API_URL_NOT_CONFIGURED',
  'PAGGUE_API_KEY_NOT_CONFIGURED',
  'PAGGUE_WEBHOOK_SECRET_NOT_CONFIGURED',
])

interface PixCharge {
  charge_id: string
  pix_qr_code: string
  pix_qr_image: string
  expires_at: string
  amount_brl: number
  total_petals: number
  package_name: string
}

interface UsePixReturn {
  status: PixStatus
  charge: PixCharge | null
  newBalance: number | null
  petalsCredited: number | null
  error: string | null
  createCharge: (packageId: string) => Promise<void>
  reset: () => void
  copyQrCode: () => void
  copied: boolean
}

function getSafePixErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'Erro ao criar cobrança'

  const errorPayload = payload as { code?: unknown; error?: unknown }
  const code = typeof errorPayload.code === 'string' ? errorPayload.code : ''
  const message = typeof errorPayload.error === 'string' ? errorPayload.error : ''

  if (
    PIX_UNAVAILABLE_CODES.has(code) ||
    message.toLowerCase().includes('gateway pix nao configurado') ||
    message.toLowerCase().includes('paggue')
  ) {
    return PIX_UNAVAILABLE_MESSAGE
  }

  return message || 'Erro ao criar cobrança'
}

export function usePix(): UsePixReturn {
  const [status, setStatus] = useState<PixStatus>('idle')
  const [charge, setCharge] = useState<PixCharge | null>(null)
  const [newBalance, setNewBalance] = useState<number | null>(null)
  const [petalsCredited, setPetalsCredited] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const expiryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimers = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    if (expiryTimeoutRef.current) {
      clearTimeout(expiryTimeoutRef.current)
      expiryTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => clearTimers()
  }, [])

  const startPolling = (chargeId: string) => {
    clearTimers()

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pix/status?charge_id=${chargeId}`)
        if (!res.ok) return

        const data = await res.json()

        if (data.status === 'paid') {
          clearTimers()
          setNewBalance(data.new_balance)
          setPetalsCredited(data.petals_credited)
          setStatus('paid')
        } else if (data.status === 'expired' || data.status === 'cancelled') {
          clearTimers()
          setStatus('expired')
        }
      } catch (err) {
        console.error('[usePix polling]', err)
      }
    }, 3000)

    expiryTimeoutRef.current = setTimeout(() => {
      if (pollingRef.current) {
        clearTimers()
        setStatus(current => current === 'waiting' ? 'expired' : current)
      }
    }, 35 * 60 * 1000)
  }

  const createCharge = async (packageId: string) => {
    clearTimers()
    setStatus('creating')
    setError(null)
    setCharge(null)
    setNewBalance(null)
    setPetalsCredited(null)
    setCopied(false)

    try {
      const res = await fetch('/api/pix/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: packageId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(getSafePixErrorMessage(err))
      }

      const data: PixCharge = await res.json()
      setCharge(data)
      setStatus('waiting')
      startPolling(data.charge_id)
    } catch (err: any) {
      console.error('[usePix createCharge]', err)
      clearTimers()
      setError(err.message ?? 'Erro desconhecido')
      setStatus('error')
    }
  }

  const copyQrCode = async () => {
    if (!charge?.pix_qr_code) return

    try {
      await navigator.clipboard.writeText(charge.pix_qr_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const el = document.createElement('textarea')
      el.value = charge.pix_qr_code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const reset = () => {
    clearTimers()
    setStatus('idle')
    setCharge(null)
    setNewBalance(null)
    setPetalsCredited(null)
    setError(null)
    setCopied(false)
  }

  return {
    status,
    charge,
    newBalance,
    petalsCredited,
    error,
    createCharge,
    reset,
    copyQrCode,
    copied,
  }
}
