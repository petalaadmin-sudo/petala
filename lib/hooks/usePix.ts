// lib/hooks/usePix.ts
'use client'

import { useState, useEffect, useRef } from 'react'

type PixStatus = 'idle' | 'creating' | 'waiting' | 'paid' | 'expired' | 'error'

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

export function usePix(): UsePixReturn {
  const [status, setStatus] = useState<PixStatus>('idle')
  const [charge, setCharge] = useState<PixCharge | null>(null)
  const [newBalance, setNewBalance] = useState<number | null>(null)
  const [petalsCredited, setPetalsCredited] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Para o polling quando desmonta ou quando pago
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const startPolling = (chargeId: string) => {
    // Polling a cada 3 segundos
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pix/status?charge_id=${chargeId}`)
        const data = await res.json()

        if (data.status === 'paid') {
          clearInterval(pollingRef.current!)
          setNewBalance(data.new_balance)
          setPetalsCredited(data.petals_credited)
          setStatus('paid')
        } else if (data.status === 'expired' || data.status === 'cancelled') {
          clearInterval(pollingRef.current!)
          setStatus('expired')
        }
      } catch (err) {
        console.error('[usePix polling]', err)
        // Não para o polling por erro de rede — tenta de novo
      }
    }, 3000)

    // Timeout de segurança: para de fazer polling depois de 35 minutos
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        setStatus(s => s === 'waiting' ? 'expired' : s)
      }
    }, 35 * 60 * 1000)
  }

  const createCharge = async (packageId: string) => {
    setStatus('creating')
    setError(null)
    setCharge(null)

    try {
      const res = await fetch('/api/pix/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: packageId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao criar cobrança')
      }

      const data: PixCharge = await res.json()
      setCharge(data)
      setStatus('waiting')
      startPolling(data.charge_id)

    } catch (err: any) {
      console.error('[usePix createCharge]', err)
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
      // Fallback para dispositivos sem clipboard API
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
    if (pollingRef.current) clearInterval(pollingRef.current)
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
