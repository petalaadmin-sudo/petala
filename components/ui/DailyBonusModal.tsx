// components/ui/DailyBonusModal.tsx
'use client'
import { useEffect, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onClaim: () => void
  claiming: boolean
  result: {
    success?: boolean
    petals_earned?: number
    streak?: number
    streak_broken?: boolean
    is_milestone?: boolean
    multiplier?: number
  } | null
  status: {
    streak: number
    next_petals: number
    can_claim: boolean
  } | null
}

const STREAK_MILESTONES = [
  { day: 3,  label: 'Dia 3',  petals: 7,  emoji: '🌸' },
  { day: 7,  label: 'Semana', petals: 10, emoji: '💎' },
  { day: 14, label: '2 sem',  petals: 15, emoji: '👑' },
  { day: 30, label: 'Mês',    petals: 25, emoji: '🌟' },
]

export function DailyBonusModal({ open, onClose, onClaim, claiming, result, status }: Props) {
  const [phase, setPhase]         = useState<'idle' | 'success'>('idle')
  const [particles, setParticles] = useState<number[]>([])

  useEffect(() => {
    if (!open) {
      setPhase('idle')
      setParticles([])
    }
  }, [open])

  useEffect(() => {
    if (result?.success) {
      setPhase('success')
      setParticles(Array.from({ length: 12 }, (_, i) => i))
    }
  }, [result])

  if (!open) return null

  const currentStreak = result?.streak ?? status?.streak ?? 0
  const nextPetals    = status?.next_petals ?? 5

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4 mb-6 bg-[#111] border border-white/10 rounded-3xl overflow-hidden">

        {/* Partículas */}
        {particles.map(i => (
          <div
            key={i}
            className="absolute text-lg pointer-events-none animate-bounce"
            style={{
              left: `${10 + (i * 7.5) % 80}%`,
              top:  `${10 + (i * 5) % 30}%`,
              animationDelay:    `${i * 0.1}s`,
              animationDuration: '1s',
            }}
          >
            🌸
          </div>
        ))}

        {/* Header */}
        <div className="relative bg-gradient-to-b from-[#ff4d7d]/20 to-transparent px-6 pt-8 pb-4 text-center">
          <div className="text-5xl mb-2">
            {phase === 'success'
              ? (result?.is_milestone ? '🏆' : '🌸')
              : '🎁'
            }
          </div>
          <h2 className="text-white text-lg font-semibold">
            {phase === 'success'
              ? result?.streak_broken
                ? 'Bem-vindo de volta!'
                : result?.is_milestone
                  ? `Marco: ${result.streak} dias! 🏆`
                  : 'Bônus coletado!'
              : 'Bônus diário'
            }
          </h2>
          {phase === 'success' && result?.streak_broken && (
            <p className="text-orange-400/70 text-xs mt-1">Seu streak recomeçou do dia 1</p>
          )}
        </div>

        {/* Pétalas ganhas */}
        {phase === 'success' && result?.petals_earned && (
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-[#ff4d7d]">
              +{result.petals_earned}
            </div>
            <div className="text-white/50 text-sm mt-1">
              🌸 pétalas
              {result.multiplier && result.multiplier > 1 && (
                <span className="text-green-400 ml-2">({result.multiplier}x bônus)</span>
              )}
            </div>
          </div>
        )}

        {/* Preview antes de coletar */}
        {phase === 'idle' && (
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-white/90">+{nextPetals}</div>
            <div className="text-white/40 text-sm mt-1">🌸 pétalas disponíveis</div>
          </div>
        )}

        {/* Streak */}
        <div className="px-6 pb-4">
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-xs uppercase tracking-wider">Streak atual</span>
              <span className="text-[#ff4d7d] font-bold text-sm">
                🔥 {currentStreak} {currentStreak === 1 ? 'dia' : 'dias'}
              </span>
            </div>

            <div className="flex gap-1.5">
              {STREAK_MILESTONES.map((m, idx) => {
                const prevDay = idx === 0 ? 0 : STREAK_MILESTONES[idx - 1].day
                const reached = currentStreak >= m.day
                const active  = currentStreak >= prevDay && currentStreak < m.day
                return (
                  <div key={m.day} className="flex-1 text-center">
                    <div className={`h-1.5 rounded-full mb-1.5 transition-all ${
                      reached ? 'bg-[#ff4d7d]' : active ? 'bg-[#ff4d7d]/40' : 'bg-white/10'
                    }`} />
                    <div className={`text-[10px] ${reached ? 'text-[#ff4d7d]' : 'text-white/30'}`}>
                      {m.emoji}
                    </div>
                    <div className={`text-[9px] mt-0.5 ${reached ? 'text-white/60' : 'text-white/20'}`}>
                      {m.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Multiplicadores */}
        {phase === 'idle' && (
          <div className="px-6 pb-4">
            <div className="grid grid-cols-4 gap-2">
              {STREAK_MILESTONES.map(m => (
                <div
                  key={m.day}
                  className={`rounded-xl p-2 text-center border ${
                    currentStreak >= m.day
                      ? 'border-[#ff4d7d]/40 bg-[#ff4d7d]/10'
                      : 'border-white/5 bg-white/3'
                  }`}
                >
                  <div className="text-lg">{m.emoji}</div>
                  <div className={`text-[10px] font-medium mt-0.5 ${
                    currentStreak >= m.day ? 'text-[#ff4d7d]' : 'text-white/30'
                  }`}>
                    +{m.petals} 🌸
                  </div>
                  <div className="text-[9px] text-white/20">dia {m.day}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão */}
        <div className="px-6 pb-6">
          {phase === 'idle' ? (
            <button
              onClick={onClaim}
              disabled={claiming}
              className="w-full bg-[#ff4d7d] text-white rounded-2xl py-4 font-semibold text-base active:scale-95 transition-all disabled:opacity-50"
            >
              {claiming ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Coletando...
                </span>
              ) : (
                '🌸 Coletar bônus'
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-white/8 text-white rounded-2xl py-4 font-medium text-sm active:scale-95 transition-all border border-white/10"
            >
              Ir para o feed →
            </button>
          )}
        </div>

      </div>
    </div>
  )
}