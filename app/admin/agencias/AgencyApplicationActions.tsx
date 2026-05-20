'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AgencyApplicationAction = 'approve' | 'reject' | 'block'

type AgencyApplicationActionsProps = {
  applicationId: string
  status: string | null
}

const ACTION_LABELS: Record<AgencyApplicationAction, string> = {
  approve: 'aprovar',
  reject: 'rejeitar',
  block: 'bloquear',
}

export default function AgencyApplicationActions({
  applicationId,
  status,
}: AgencyApplicationActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loadingAction, setLoadingAction] = useState<AgencyApplicationAction | null>(null)
  const canReview = status === 'pending'

  const runAction = async (action: AgencyApplicationAction) => {
    if (!canReview) return

    const reviewNotes = window.prompt(
      action === 'approve'
        ? 'Observacoes da revisao (opcional):'
        : 'Observacoes da revisao (obrigatorio):'
    )?.trim()

    if ((action === 'reject' || action === 'block') && !reviewNotes) {
      window.alert('Informe as observacoes para concluir esta acao.')
      return
    }

    setLoadingAction(action)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        window.alert('Sessao expirada. Faca login novamente.')
        return
      }

      const response = await fetch('/api/admin/agencias/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          application_id: applicationId,
          action,
          review_notes: reviewNotes || undefined,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || result?.success === false) {
        throw new Error(result?.error ?? 'Falha ao revisar candidatura')
      }

      router.refresh()
    } catch (error) {
      console.error('[AgencyApplicationActions]', error)
      window.alert(error instanceof Error ? error.message : 'Falha ao revisar candidatura')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="flex gap-1">
      {(Object.keys(ACTION_LABELS) as AgencyApplicationAction[]).map(action => {
        const disabled = loadingAction !== null || !canReview

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
