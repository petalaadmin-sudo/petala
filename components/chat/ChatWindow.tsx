// components/chat/ChatWindow.tsx
'use client'

import { useChat, GIFT_CATALOG } from '@/lib/hooks/useChat'
import { useCreatorPresence } from '@/lib/hooks/useCreatorPresence'
import { useEffect, useRef, useState } from 'react'

interface Creator {
  id: string
  name: string
  photo_url: string | null
  price_text_petals: number
}

type ChatType = 'text' | 'video'

interface Props {
  creator: Creator
  chatType?: ChatType
  initialBalance: number
  onBalanceUpdate?: (balance: number) => void
  onClose: () => void
}

// Formata segundos em mm:ss
const fmtTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// ── Componente de mensagem individual ──────────────────────
function MessageBubble({ msg, isMe }: { msg: any; isMe: boolean }) {
  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-1">
        <span className="text-white/25 text-xs bg-white/5 rounded-full px-3 py-1">
          {msg.content}
        </span>
      </div>
    )
  }

  if (msg.type === 'gift') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-yellow-400/10 border border-yellow-400/25 rounded-2xl px-4 py-2 flex items-center gap-2">
          <span className="text-2xl">{msg.gift_emoji}</span>
          <div>
            <div className="text-white text-xs font-medium">{msg.content}</div>
            <div className="text-yellow-400/70 text-xs">{msg.gift_petals} 🌸</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isMe
            ? 'bg-[#ff4d7d] text-white rounded-br-md'
            : 'bg-[#1e1e1e] text-white/85 rounded-bl-md'
        }`}
      >
        {msg.content}
      </div>
    </div>
  )
}

// ── Componente principal ────────────────────────────────────
export function ChatWindow({ creator, chatType = 'text', initialBalance, onBalanceUpdate, onClose }: Props) {
  const presence = useCreatorPresence(creator.id)
  const isVideo = chatType === 'video'
  const priceLabel = isVideo ? '120 🌸/min' : '10 🌸 primeiro minuto · depois 50 🌸/min'
  const activePriceLabel = isVideo ? 'vídeo em teste · 120 🌸/min' : '10 🌸 + 50 🌸/min'
  const startLabel = isVideo ? 'Iniciar vídeo' : 'Iniciar chat'
  const endedLabel = isVideo ? 'Vídeo encerrado' : 'Chat encerrado'

  const {
    session, messages, balance, status, error,
    elapsedSeconds, serverDurationSeconds, isTyping,
    startChat, endChat, sendMessage, sendGift, setIsTyping,
  } = useChat({
    creatorId: creator.id,
    chatType,
    onBalanceUpdate,
  })

  const [input, setInput]         = useState('')
  const [showGifts, setShowGifts] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [rating, setRating]       = useState(0)
  const [giftFeedback, setGiftFeedback] = useState<string | null>(null)
  const [floatingGifts, setFloatingGifts] = useState<{ id: string; emoji: string; x: number }[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const endedDisplaySeconds = serverDurationSeconds ?? elapsedSeconds

  // Scroll automático ao receber mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Remove floating gifts após animação
  useEffect(() => {
    if (floatingGifts.length === 0) return
    const t = setTimeout(() => setFloatingGifts([]), 3000)
    return () => clearTimeout(t)
  }, [floatingGifts])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || status !== 'active') return
    sendMessage(trimmed)
    setInput('')
    setIsTyping(false)
  }

  const handleGift = async (giftType: string, emoji: string) => {
    setShowGifts(false)
    const result = await sendGift(giftType)

    if (result) {
      // Animação de presentes flutuando
      const newGifts = Array.from({ length: 4 }, () => ({
        id:    crypto.randomUUID(),
        emoji,
        x:     20 + Math.random() * 60,
      }))
      setFloatingGifts(newGifts)
      setGiftFeedback(`${emoji} Presente enviado!`)
      setTimeout(() => setGiftFeedback(null), 2500)
    } else {
      setGiftFeedback('Saldo insuficiente 😕')
      setTimeout(() => setGiftFeedback(null), 2500)
    }
  }

  const handleEnd = async () => {
    await endChat(rating || undefined)
    setShowEndModal(false)
  }

  // ── TELA: Idle / Iniciando ──────────────────────────────
  if (status === 'idle' || status === 'starting' || status === 'error') {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
        <div className="bg-[#161616] rounded-t-2xl w-full max-w-sm p-5 border-t border-white/8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#2a1220] border-2 border-[#ff4d7d] flex items-center justify-center text-2xl">
              🌺
            </div>
            <div>
              <div className="text-white font-medium">{creator.name}</div>
              <div className={`text-xs ${presence.online ? 'text-green-400' : 'text-white/30'}`}>
                {presence.online ? '● Online agora' : '● Offline'}
              </div>
            </div>
          </div>

          {isVideo ? (
            <div className="bg-black/40 rounded-xl p-3 mb-4 border border-white/5">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white/40">Custo</span>
                <span className="text-yellow-400 font-medium">{priceLabel}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Seu saldo</span>
                <span className="text-white font-medium">{initialBalance} 🌸</span>
              </div>
            </div>
          ) : (
          <div className="bg-black/40 rounded-xl p-3 mb-4 border border-white/5">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white/40">Custo</span>
              <span className="text-yellow-400 font-medium">10 🌸 primeiro minuto · depois 50 🌸/min</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Seu saldo</span>
              <span className="text-white font-medium">{initialBalance} 🌸</span>
            </div>
          </div>
          )}

          {!presence.online && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-3 mb-4 text-xs text-red-300">
              Esta criadora está offline no momento. Tente mais tarde.
            </div>
          )}

          {isVideo && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 text-xs text-yellow-100">
              Vídeo em teste interno. A cobrança por minuto já está ativa, mas a chamada Agora ainda não será aberta automaticamente.
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-3 mb-4 text-xs text-red-300">
              {error}
            </div>
          )}

          <button
            onClick={startChat}
            disabled={!presence.online || status === 'starting'}
            className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2 mb-2"
          >
            {status === 'starting' ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Iniciando…</>
            ) : startLabel}
          </button>
          <button onClick={onClose} className="w-full text-white/25 text-xs py-2">cancelar</button>
        </div>
      </div>
    )
  }

  // ── TELA: Encerrado ─────────────────────────────────────
  if (status === 'ended') {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-5">
        <div className="bg-[#161616] rounded-2xl p-5 w-full max-w-sm border border-white/8">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">✨</div>
            <div className="text-white font-medium">{endedLabel}</div>
            <div className="text-white/40 text-xs mt-1">{fmtTime(endedDisplaySeconds)} de conversa</div>
          </div>

          {!rating && (
            <>
              <div className="text-white/40 text-xs text-center mb-3">Como foi a experiência?</div>
              <div className="flex justify-center gap-2 mb-4">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setRating(s)} className="text-2xl">
                    {s <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium"
          >
            Voltar ao feed
          </button>
        </div>
      </div>
    )
  }

  // ── TELA: Chat ativo ────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#111] flex-shrink-0">
        <button onClick={() => setShowEndModal(true)} className="text-white/40 text-sm mr-1">‹</button>
        <div className="w-9 h-9 rounded-full bg-[#2a1220] border-2 border-[#ff4d7d] flex items-center justify-center text-lg flex-shrink-0">
          🌺
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium">{creator.name}</div>
          <div className="text-green-400 text-xs">● Online · {activePriceLabel}</div>
        </div>
        <div className="text-right">
          <div className="text-yellow-400 text-xs font-medium">🌸 {balance}</div>
          <div className="text-white/30 text-xs">{fmtTime(elapsedSeconds)}</div>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-3 relative">
        {/* Floating gifts */}
        {floatingGifts.map(g => (
          <div
            key={g.id}
            className="absolute text-2xl animate-float-up pointer-events-none"
            style={{ left: `${g.x}%`, bottom: '100px' }}
          >
            {g.emoji}
          </div>
        ))}

        {isVideo && (
          <div className="h-full flex items-center justify-center">
            <div className="bg-white/6 border border-white/10 rounded-2xl p-5 text-center max-w-xs">
              <div className="text-3xl mb-3">🎥</div>
              <div className="text-white text-sm font-medium mb-1">Vídeo em teste</div>
              <div className="text-white/45 text-xs leading-relaxed">
                A sessão de vídeo está aberta para validar billing. A cobrança de 120 pétalas/min já está ativa; Agora/token ainda não foi liberado neste fluxo.
              </div>
            </div>
          </div>
        )}

        {!isVideo && messages.map(msg => {
          const { data: { user } } = { data: { user: null } } as any
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMe={msg.sender_role === 'user'}
            />
          )
        })}

        {!isVideo && isTyping && (
          <div className="flex justify-start mb-1">
            <div className="bg-[#1e1e1e] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Toast de feedback do presente */}
      {giftFeedback && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs rounded-full px-4 py-2 z-10">
          {giftFeedback}
        </div>
      )}

      {/* Painel de presentes */}
      {showGifts && !isVideo && (
        <div className="bg-[#111] border-t border-white/5 px-4 py-3 flex-shrink-0">
          <div className="flex gap-4 overflow-x-auto pb-1">
            {GIFT_CATALOG.map(g => (
              <button
                key={g.type}
                onClick={() => handleGift(g.type, g.emoji)}
                disabled={balance < g.petals}
                className="flex flex-col items-center gap-1 flex-shrink-0 disabled:opacity-35"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1e1e1e] flex items-center justify-center text-xl border border-white/6">
                  {g.emoji}
                </div>
                <div className="text-yellow-400 text-[9px] font-medium">{g.petals}🌸</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      {isVideo ? (
        <div className="px-3 py-3 border-t border-white/5 bg-[#111] flex items-center gap-2 flex-shrink-0">
          <div className="flex-1 text-white/45 text-xs">
            Cobrança ativa: 120 🌸/min
          </div>
          <button
            onClick={() => setShowEndModal(true)}
            className="bg-[#ff4d7d] text-white rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            Encerrar vídeo
          </button>
        </div>
      ) : (
      <div className="px-3 py-3 border-t border-white/5 bg-[#111] flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => setShowGifts(v => !v)}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-colors ${
            showGifts ? 'bg-[#ff4d7d]/20 border border-[#ff4d7d]/40' : 'bg-[#1e1e1e]'
          }`}
        >
          🎁
        </button>

        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setIsTyping(e.target.value.length > 0) }}
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
          placeholder="Manda uma mensagem…"
          className="flex-1 bg-[#1e1e1e] border border-white/8 rounded-full px-4 py-2.5 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/30 min-w-0"
        />

        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-9 h-9 rounded-full bg-[#ff4d7d] flex items-center justify-center text-sm disabled:opacity-30 flex-shrink-0"
        >
          ➤
        </button>
      </div>
      )}

      {/* Modal de encerrar */}
      {showEndModal && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
          <div className="bg-[#161616] rounded-2xl p-5 mx-4 w-full max-w-xs border border-white/8">
            <h3 className="text-white font-medium text-center mb-2">{isVideo ? 'Encerrar vídeo?' : 'Encerrar chat?'}</h3>
            <p className="text-white/40 text-xs text-center mb-4">
              Você conversou por {fmtTime(elapsedSeconds)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndModal(false)}
                className="flex-1 bg-[#1e1e1e] text-white/60 rounded-xl py-2.5 text-sm"
              >
                Continuar
              </button>
              <button
                onClick={handleEnd}
                className="flex-1 bg-[#ff4d7d] text-white rounded-xl py-2.5 text-sm font-medium"
              >
                Encerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
