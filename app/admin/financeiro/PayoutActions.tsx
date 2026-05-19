'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type PayoutAction = 'approve' | 'paid' | 'reject' | 'block'

type PayoutActionsProps = {
  payoutId: string
  status: string | null
}

const ACTION_LABELS: Record<PayoutAction, string> = {
  approve: 'aprovar',
  paid: 'pago',
  reject: 'rejeitar',
  block: 'bloquear',
}

const FINAL_STATUSES = ['paid', 'cancelled', 'rejected', 'fraud', 'chargeback']

const ACTION_ALLOWED_STATUSES: Record<PayoutAction, string[]> = {
  approve: ['pending', 'under_review', 'blocked'],
  paid: ['approved'],
  reject: ['pending', 'approved', 'under_review', 'blocked'],
  block: ['pending', 'approved', 'under_review'],
}

export default function PayoutActions({ payoutId, status }: PayoutActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loadingAction, setLoadingAction] = useState<PayoutAction | null>(null)
  const normalizedStatus = (status ?? '').toLowerCase()
  const isFinalStatus = FINAL_STATUSES.includes(normalizedStatus)

  const isActionAllowed = (action: PayoutAction) =>
    !isFinalStatus && ACTION_ALLOWED_STATUSES[action].includes(normalizedStatus)

  const runAction = async (action: PayoutAction) => {
    if (!isActionAllowed(action)) return

    if (action === 'approve' && !window.confirm('Confirmar aprovação deste saque?')) {
      return
    }

    if (action === 'paid' && !window.confirm('Confirmar que este saque foi pago?')) {
      return
    }

    const reviewNotes = window.prompt('Observações da revisão (opcional):') ?? undefined
    let rejectionReason: string | undefined

    if (action === 'reject' || action === 'block') {
      rejectionReason = window.prompt('Motivo obrigatório:')?.trim()

      if (!rejectionReason) {
        window.alert('Informe o motivo para concluir esta ação.')
        return
      }
    }

    setLoadingAction(action)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        window.alert('Sessão expirada. Faça login novamente.')
        return
      }

      const response = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          payout_id: payoutId,
          action,
          review_notes: reviewNotes?.trim() || undefined,
          rejection_reason: rejectionReason,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || result?.success === false) {
        throw new Error(result?.error ?? 'Falha ao processar saque')
      }

      router.refresh()
    } catch (error) {
      console.error('[PayoutActions]', error)
      window.alert(error instanceof Error ? error.message : 'Falha ao processar saque')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="flex gap-1">
      {(Object.keys(ACTION_LABELS) as PayoutAction[]).map(action => {
        const disabled = loadingAction !== null || !isActionAllowed(action)

        return (
          <button
            key={action}
            type="button"
            disabled={disabled}
            onClick={() => runAction(action)}
            className={`rounded-md px-2 py-1 text-[10px] ${
              disabled
                ? 'cursor-not-allowed bg-white/5 text-white/20'
                : 'bg-white/5 text-white/55 hover:bg-white/10 hover:text-white'
            }`}
          >
            {loadingAction === action ? '...' : ACTION_LABELS[action]}
          </button>
        )
      })}
    </div>
  )
}
