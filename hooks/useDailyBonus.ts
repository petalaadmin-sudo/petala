// hooks/useDailyBonus.ts
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BonusStatus {
  can_claim: boolean
  streak: number
  highest_streak: number
  total_claims: number
  next_claim_at: string
  next_petals: number
}

interface ClaimResult {
  success: boolean
  petals_earned?: number
  streak?: number
  multiplier?: number
  streak_broken?: boolean
  next_claim_at?: string
  is_milestone?: boolean
  error?: string
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { 'Content-Type': 'application/json' }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  }
}

export function useDailyBonus() {
  const [status, setStatus]       = useState<BonusStatus | null>(null)
  const [loading, setLoading]     = useState(true)
  const [claiming, setClaiming]   = useState(false)
  const [result, setResult]       = useState<ClaimResult | null>(null)
  const [showModal, setShowModal] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const res     = await fetch('/api/bonus/daily', { headers })
      const data    = await res.json()
      setStatus(data)

      const shownThisSession = sessionStorage.getItem('bonus_modal_shown')
      if (data.can_claim && !shownThisSession) {
        setTimeout(() => setShowModal(true), 1500)
      }
    } catch (err) {
      console.error('[useDailyBonus] erro ao buscar status:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const claim = useCallback(async () => {
    if (claiming) return
    setClaiming(true)
    try {
      const headers = await getAuthHeaders()
      const res     = await fetch('/api/bonus/daily', { method: 'POST', headers })
      const data    = await res.json()
      setResult(data)
      if (data.success) {
        sessionStorage.setItem('bonus_modal_shown', '1')
        setStatus(prev => prev ? {
          ...prev,
          can_claim: false,
          streak: data.streak,
          next_claim_at: data.next_claim_at,
        } : prev)
      }
    } catch (err) {
      console.error('[useDailyBonus] erro ao reclamar:', err)
    } finally {
      setClaiming(false)
    }
  }, [claiming])

  const closeModal = useCallback(() => {
    setShowModal(false)
    sessionStorage.setItem('bonus_modal_shown', '1')
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  return { status, loading, claiming, result, showModal, claim, closeModal }
}