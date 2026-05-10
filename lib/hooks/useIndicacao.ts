// lib/hooks/useIndicacao.ts
'use client'

import { useState, useEffect, useCallback } from 'react'

interface IndicacaoStatus {
  referral_code: string | null
  has_referrer: boolean
  bonus_paid: boolean
  first_purchase_done: boolean
  total_referred: number
  pending_bonuses: number
  total_commission_petals: number
  referrals: { id: string; referred_type: string; welcome_bonus_referrer_paid: boolean; total_commission_earned: number; created_at: string }[]
  recent_commissions: { commission_petals: number; created_at: string }[]
}

interface UseIndicacaoReturn {
  status: IndicacaoStatus | null
  loading: boolean
  applying: boolean
  error: string | null
  codeInput: string
  setCodeInput: (v: string) => void
  applyCode: () => Promise<boolean>
  copyLink: () => void
  copied: boolean
  shareLink: () => void
  reload: () => void
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://petala.app'

export function useIndicacao(): UseIndicacaoReturn {
  const [status, setStatus]     = useState<IndicacaoStatus | null>(null)
  const [loading, setLoading]   = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [copied, setCopied]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/indicacao/status')
      if (res.ok) setStatus(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const applyCode = async (): Promise<boolean> => {
    if (!codeInput.trim()) return false
    setApplying(true)
    setError(null)
    try {
      const res = await fetch('/api/indicacao/registrar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ referral_code: codeInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return false }
      await load()
      return true
    } catch (err: any) {
      setError('Erro ao aplicar código')
      return false
    } finally {
      setApplying(false)
    }
  }

  const referralLink = status?.referral_code
    ? `${APP_URL}/?ref=${status.referral_code}`
    : null

  const copyLink = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = referralLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const shareLink = () => {
    if (!referralLink) return
    if (navigator.share) {
      navigator.share({
        title: 'Pétala — conteúdo exclusivo',
        text:  'Entra com meu link e ganha 50 pétalas grátis!',
        url:   referralLink,
      }).catch(() => copyLink())
    } else {
      copyLink()
    }
  }

  return {
    status, loading, applying, error,
    codeInput, setCodeInput,
    applyCode, copyLink, copied, shareLink,
    reload: load,
  }
}
