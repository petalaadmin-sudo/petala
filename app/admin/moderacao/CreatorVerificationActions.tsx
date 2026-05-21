'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type VerificationAction = 'approve' | 'reject'

type CreatorVerificationActionsProps = {
  verificationId: string
  status: string | null
}

const ACTION_LABELS: Record<VerificationAction, string> = {
  approve: 'Aprovar',
  reject: 'Rejeitar',
}

export default function CreatorVerificationActions({
  verificationId,
  status,
}: CreatorVerificationActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loadingAction, setLoadingAction] = useState<VerificationAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canReview = status === 'pending'

  const runAction = async (action: VerificationAction) => {
    if (!canReview || loadingAction) return

    const rejectionReason = action === 'reject'
      ? window.prompt('Motivo da rejeicao:')?.trim()
      : null

    if (action === 'reject' && !rejectionReason) {
      setError('Informe o motivo da rejeicao.')
      return
    }

    setLoadingAction(action)
    setError(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Sessao expirada. Faca login novamente.')
      }

      const response = await fetch('/api/admin/criadoras/verificacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          verification_id: verificationId,
          action,
          rejection_reason: rejectionReason || undefined,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || result?.success === false) {
        throw new Error(result?.error ?? 'Falha ao revisar verificacao.')
      }

      router.refresh()
    } catch (err) {
      console.error('[CreatorVerificationActions]', err)
      setError(err instanceof Error ? err.message : 'Falha ao revisar verificacao.')
    } finally {
      setLoadingAction(null)
    }
  }

  if (!canReview) {
    return <span className="text-white/20 text-xs">-</span>
  }

  return (
    <div className="flex min-w-[150px] flex-col gap-2">
      <div className="flex gap-1">
        {(Object.keys(ACTION_LABELS) as VerificationAction[]).map(action => {
          const isReject = action === 'reject'
          const disabled = loadingAction !== null

          return (
            <button
              key={action}
              type="button"
              disabled={disabled}
              onClick={() => runAction(action)}
              className={`rounded-md px-2 py-1 text-[10px] font-medium disabled:cursor-not-allowed disabled:opacity-45 ${
                isReject
                  ? 'bg-red-900/35 text-red-300 hover:bg-red-900/50'
                  : 'bg-green-600/80 text-white hover:bg-green-600'
              }`}
            >
              {loadingAction === action ? '...' : ACTION_LABELS[action]}
            </button>
          )
        })}
      </div>
      {error && (
        <div className="max-w-[180px] text-[10px] leading-relaxed text-red-300">
          {error}
        </div>
      )}
    </div>
  )
}
