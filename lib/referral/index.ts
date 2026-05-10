// lib/referral/index.ts

// Tipos
export interface ReferralStats {
  referral_code: string
  users_completed: number
  users_pending: number
  users_total: number
  coins_from_users: number
  creators_referred: number
  petals_from_creators: number
}

export interface ReferralHistoryItem {
  id: string
  type: 'user' | 'creator_commission' | 'milestone'
  description: string
  coins: number
  status: 'pending' | 'completed' | 'rejected'
  created_at: string
}

// Milestones disponíveis
export const MILESTONES = [
  {
    id:          'invited_5_creators',
    label:       'Indicou 5 produtoras ativas',
    bonus_coins: 500,
    icon:        '🌟',
    target:      5,
    type:        'creator',
  },
  {
    id:          'invited_20_users',
    label:       'Indicou 20 usuários que compraram',
    bonus_coins: 200,
    icon:        '🎯',
    target:      20,
    type:        'user',
  },
] as const

// Gera URL de convite
export function buildInviteUrl(code: string, baseUrl: string): string {
  return `${baseUrl}/?ref=${code}`
}

// Valida formato do código (XXX-XXXXX)
export function isValidReferralCode(code: string): boolean {
  return /^[A-Z]{3}-[A-Z0-9]{5}$/.test(code.toUpperCase())
}

// Extrai código do ref da URL de convite
export function extractCodeFromUrl(url: string): string | null {
  try {
    const u   = new URL(url)
    const ref = u.searchParams.get('ref')
    return ref && isValidReferralCode(ref) ? ref.toUpperCase() : null
  } catch {
    return null
  }
}
