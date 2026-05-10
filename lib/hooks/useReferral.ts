// lib/hooks/useReferral.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { buildInviteUrl, type ReferralStats } from '@/lib/referral'

interface UseReferralReturn {
  stats: ReferralStats | null
  referralCode: string | null
  inviteUrl: string
  loading: boolean
  copied: boolean
  copyLink: () => void
  shareLink: () => void
  commissionHistory: CommissionItem[]
  referralHistory: ReferralItem[]
}

interface CommissionItem {
  id: string
  commission_petals: number
  petals_session: number
  created_at: string
}

interface ReferralItem {
  id: string
  status: string
  coins_referrer: number
  created_at: string
  completed_at: string | null
}

export function useReferral(): UseReferralReturn {
  const supabase = createClient()

  const [stats, setStats]             = useState<ReferralStats | null>(null)
  const [referralCode, setCode]       = useState<string | null>(null)
  const [commissions, setCommissions] = useState<CommissionItem[]>([])
  const [referrals, setReferrals]     = useState<ReferralItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [copied, setCopied]           = useState(false)

  const appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? 'https://petala.app'

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [statsRes, codeRes, commissionsRes, referralsRes] = await Promise.all([
        // Stats via view
        supabase.from('my_referral_stats').select('*').eq('user_id', user.id).single(),
        // Código do usuário
        supabase.from('users').select('referral_code').eq('id', user.id).single(),
        // Histórico de comissões (se criadora)
        supabase
          .from('creator_referral_commissions')
          .select('id, commission_petals, petals_session, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        // Histórico de indicações de usuários
        supabase
          .from('user_referrals')
          .select('id, status, coins_referrer, created_at, completed_at')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      if (statsRes.data)      setStats(statsRes.data)
      if (codeRes.data?.referral_code) setCode(codeRes.data.referral_code)
      if (commissionsRes.data) setCommissions(commissionsRes.data)
      if (referralsRes.data)  setReferrals(referralsRes.data)
      setLoading(false)
    }

    load()
  }, [])

  const inviteUrl = referralCode ? buildInviteUrl(referralCode, appUrl) : ''

  const copyLink = useCallback(async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
    } catch {
      // Fallback
      const el = document.createElement('textarea')
      el.value = inviteUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }, [inviteUrl])

  const shareLink = useCallback(() => {
    if (!inviteUrl) return
    if (navigator.share) {
      navigator.share({
        title: 'Entre no Pétala comigo 🌸',
        text:  'Crie sua conta e ganhe 50 pétalas de presente!',
        url:   inviteUrl,
      }).catch(() => {}) // usuário pode cancelar
    } else {
      copyLink()
    }
  }, [inviteUrl, copyLink])

  return {
    stats,
    referralCode,
    inviteUrl,
    loading,
    copied,
    copyLink,
    shareLink,
    commissionHistory: commissions,
    referralHistory:   referrals,
  }
}
