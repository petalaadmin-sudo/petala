// app/admin/AdminPainelClient.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Verification {
  id: string
  creator_id: string
  user_id: string
  doc_key: string
  selfie_key: string
  submitted_at: string
  creators: { id: string; name: string; photo_url: string | null; bio: string | null }
  users: { email: string; created_at: string }
}

interface Props {
  pending: Verification[]
  stats: { creators: number; users: number; revenue: number }
}

export function AdminPainelClient({ pending: initialPending, stats }: Props) {
  const supabase = createClient()
  const [pending, setPending] = useState(initialPending)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selected, setSelected] = useState<Verification | null>(null)

  const handleApprove = async (v: Verification) => {
    setProcessing(v.id)
    try {
      // Ativa a criadora
      await supabase
        .from('creators')
        .update({ verified: true, verified_at: new Date().toISOString(), active: true })
        .eq('id', v.creator_id)

      // Marca verificação como aprovada
      await supabase
        .from('creator_verifications')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', v.id)

      // Notifica a criadora via OneSignal (placeholder)
      console.log(`Aprovada: ${v.creator_id}`)

      setPending(prev => prev.filter(p => p.id !== v.id))
      setSelected(null)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (v: Verification, reason: string) => {
    setProcessing(v.id)
    try {
      await supabase
        .from('creator_verifications')
        .update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() })
        .eq('id', v.id)

      setPending(prev => prev.filter(p => p.id !== v.id))
      setSelected(null)
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-10">

      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🌸</span>
          <h1 className="text-white text-lg font-medium">Painel Admin — Pétala</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-5 py-4">
        {[
          { label: 'Criadoras ativas', value: stats.creators, color: 'text-[#ff4d7d]' },
          { label: 'Usuários totais',  value: stats.users,    color: 'text-white' },
          { label: 'Receita total',    value: `R$ ${stats.revenue.toFixed(0)}`, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] rounded-xl p-3 border border-white/5 text-center">
            <div className={`text-xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-[9px] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Verificações pendentes */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-sm font-medium">Verificações pendentes</h2>
          <span className="bg-[#ff4d7d]/20 text-[#ff4d7d] text-xs rounded-full px-2 py-0.5 font-medium">
            {pending.length}
          </span>
        </div>

        {pending.length === 0 ? (
          <div className="bg-[#111] rounded-xl p-8 border border-white/5 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-white/40 text-sm">Nenhuma verificação pendente</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map(v => (
              <div
                key={v.id}
                className="bg-[#111] rounded-xl border border-white/5 overflow-hidden"
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                    {v.creators.photo_url
                      ? <img src={v.creators.photo_url} className="w-full h-full object-cover" alt="" />
                      : '🌸'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{v.creators.name}</div>
                    <div className="text-white/30 text-xs truncate">{v.users.email}</div>
                    <div className="text-white/20 text-[10px] mt-0.5">
                      Enviado {new Date(v.submitted_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(selected?.id === v.id ? null : v)}
                    className="text-white/30 text-xs bg-[#1e1e1e] rounded-lg px-3 py-1.5"
                  >
                    {selected?.id === v.id ? 'Fechar' : 'Ver'}
                  </button>
                </div>

                {/* Painel de revisão */}
                {selected?.id === v.id && (
                  <div className="border-t border-white/5 p-4 flex flex-col gap-3">
                    {/* Docs */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-white/25 text-[9px] uppercase tracking-wider mb-1">Documento</div>
                        <div className="bg-[#0d0d0d] rounded-lg h-24 flex items-center justify-center text-2xl border border-white/5">
                          📄
                        </div>
                      </div>
                      <div>
                        <div className="text-white/25 text-[9px] uppercase tracking-wider mb-1">Selfie</div>
                        <div className="bg-[#0d0d0d] rounded-lg h-24 flex items-center justify-center text-2xl border border-white/5">
                          🤳
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {v.creators.bio && (
                      <div className="bg-[#0d0d0d] rounded-lg p-3 border border-white/5">
                        <div className="text-white/25 text-[9px] uppercase tracking-wider mb-1">Bio</div>
                        <div className="text-white/50 text-xs leading-relaxed">{v.creators.bio}</div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(v)}
                        disabled={!!processing}
                        className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
                      >
                        {processing === v.id ? '…' : '✓ Aprovar'}
                      </button>
                      <button
                        onClick={() => handleReject(v, 'Documento ilegível ou inválido')}
                        disabled={!!processing}
                        className="flex-1 bg-red-900/40 text-red-400 rounded-xl py-2.5 text-sm border border-red-500/25 disabled:opacity-50"
                      >
                        ✕ Rejeitar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
