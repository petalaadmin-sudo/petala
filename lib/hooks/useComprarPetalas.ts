// lib/hooks/useComprarPetalas.ts
'use client'

import { useState, useEffect, useCallback } from 'react'

type Status = 'idle' | 'loading' | 'aguardando_pix' | 'pago' | 'expirado' | 'erro'

interface PixData {
  transaction_id: string
  charge_id: string
  qr_code: string
  qr_code_image: string   // base64 PNG
  amount_brl: number
  petals: number
  expires_at: string
}

interface UseComprarPetalasReturn {
  status: Status
  pixData: PixData | null
  newBalance: number | null
  error: string | null
  comprar: (packageId: string) => Promise<void>
  resetar: () => void
}

export function useComprarPetalas(): UseComprarPetalasReturn {
  const [status, setStatus] = useState<Status>('idle')
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [newBalance, setNewBalance] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Limpa o polling quando o componente desmonta
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [pollingInterval])

  const comprar = useCallback(async (packageId: string) => {
    setStatus('loading')
    setError(null)

    try {
      // 1. Cria cobrança Pix
      const res = await fetch('/api/pix/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: packageId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao criar cobrança')
      }

      const data: PixData = await res.json()
      setPixData(data)
      setStatus('aguardando_pix')

      // 2. Polling a cada 3s — verifica se pagamento foi confirmado
      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/pix/status?transaction_id=${data.transaction_id}`)
          const statusData = await statusRes.json()

          if (statusData.status === 'completed') {
            clearInterval(interval)
            setNewBalance(statusData.new_balance)
            setStatus('pago')
          } else if (statusData.status === 'failed') {
            clearInterval(interval)
            setStatus('expirado')
          }
        } catch {
          // Falha silenciosa no polling — tenta de novo no próximo ciclo
        }
      }, 3000)

      setPollingInterval(interval)

      // 3. Para o polling quando o Pix expirar (30 min)
      const expiresAt = new Date(data.expires_at).getTime()
      const msUntilExpiry = expiresAt - Date.now()
      if (msUntilExpiry > 0) {
        setTimeout(() => {
          clearInterval(interval)
          setStatus((prev) => prev === 'aguardando_pix' ? 'expirado' : prev)
        }, msUntilExpiry)
      }

    } catch (err: any) {
      setError(err.message ?? 'Erro inesperado')
      setStatus('erro')
    }
  }, [])

  const resetar = useCallback(() => {
    if (pollingInterval) clearInterval(pollingInterval)
    setStatus('idle')
    setPixData(null)
    setNewBalance(null)
    setError(null)
  }, [pollingInterval])

  return { status, pixData, newBalance, error, comprar, resetar }
}
