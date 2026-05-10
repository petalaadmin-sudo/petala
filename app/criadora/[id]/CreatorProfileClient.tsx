// app/criadora/[id]/CreatorProfileClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlbumPhoto } from '@/components/album/AlbumPhoto'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { useCreatorPresence } from '@/lib/hooks/useCreatorPresence'

interface Photo {
  id: string
  r2_key: string
  r2_key_blur: string | null
  blur_hash: string | null
  is_free: boolean
  price_petals: number
  unlock_count: number
  is_unlocked: boolean
}

interface Creator {
  id: string
  name: string
  bio: string | null
  photo_url: string | null
  rating: number
  rating_count: number
  total_gifts: number
  rank_weekly: number | null
  price_text_petals: number
  price_video_petals: number
  verified: boolean
}

interface Props {
  creator: Creator
  photos: Photo[]
  userBalance: number
  isVip: boolean
  userId: string
}

type TabId = 'album' | 'avaliacoes' | 'sobre'

export function CreatorProfileClient({ creator, photos, userBalance, isVip, userId }: Props) {
  const router = useRouter()
  const presence = useCreatorPresence(creator.id)

  const [tab, setTab]               = useState<TabId>('album')
  const [balance, setBalance]       = useState(userBalance)
  const [photoList, setPhotoList]   = useState<Photo[]>(photos)
  const [chatOpen, setChatOpen]     = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)

  const handleUnlock = async (photoId: string) => {
    const res = await fetch('/api/fotos/desbloquear', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ photo_id: photoId }),
    })
    const data = await res.json()
    if (!res.ok) return null

    // Atualiza saldo e estado da foto localmente
    if (data.new_balance !== undefined) setBalance(data.new_balance)
    setPhotoList(prev =>
      prev.map(p => p.id === photoId ? { ...p, is_unlocked: true } : p)
    )

    return { url: data.url, new_balance: data.new_balance }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Hero */}
      <div className="relative h-64 bg-[#1a0812]">
        {creator.photo_url
          ? <img src={creator.photo_url} alt={creator.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-8xl opacity-40">🌸</div>
        }
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-[#0a0a0a]" />

        {/* Botão voltar */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/70 text-sm"
        >
          ‹
        </button>

        {/* Badges */}
        <div className="absolute top-4 right-4 flex gap-2">
          {creator.verified && (
            <div className="bg-yellow-400/15 border border-yellow-400/30 rounded-md px-2 py-1 text-yellow-400 text-[10px] font-medium">
              ✓ Verificada
            </div>
          )}
          {presence.online && (
            <div className="flex items-center gap-1 bg-green-500/15 border border-green-500/30 rounded-full px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-[10px] font-medium">Online</span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h1 className="text-white text-xl font-medium">{creator.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-yellow-400 text-xs">⭐ {creator.rating.toFixed(1)}</span>
              <span className="text-white/25 text-xs">·</span>
              <span className="text-white/40 text-xs">{creator.rating_count} avaliações</span>
              {creator.rank_weekly && (
                <>
                  <span className="text-white/25 text-xs">·</span>
                  <span className="text-[#ff4d7d] text-xs">#{creator.rank_weekly}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-[#1e1e1e] rounded-full px-3 py-1.5">
            <span className="text-xs">🌸</span>
            <span className="text-yellow-400 text-xs font-medium">{balance}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { n: creator.total_gifts, l: 'presentes' },
            { n: `${creator.price_text_petals}🌸`, l: 'por min texto' },
            { n: `${creator.price_video_petals}🌸`, l: 'por min vídeo' },
          ].map(s => (
            <div key={s.l} className="bg-[#111] rounded-xl py-2.5 text-center border border-white/5">
              <div className="text-white text-sm font-medium">{s.n}</div>
              <div className="text-white/30 text-[9px] mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setChatOpen(true)}
            disabled={!presence.online}
            className="flex-[2] bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform"
          >
            {presence.online ? '💬 Iniciar chat' : '💤 Offline'}
          </button>
          <button className="flex-1 bg-[#1e1e1e] text-white/60 rounded-xl py-3 text-sm border border-white/8">
            🎁
          </button>
          <button className="w-12 bg-[#1e1e1e] text-white/60 rounded-xl py-3 text-sm border border-white/8">
            🤍
          </button>
        </div>

        {/* VIP banner */}
        {!isVip && (
          <div className="bg-[#1a1000] border border-yellow-400/20 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
            <span className="text-xl">👑</span>
            <div className="flex-1">
              <div className="text-yellow-400 text-xs font-medium">VIP — acesso a todas as fotos</div>
              <div className="text-white/30 text-[10px]">desbloqueio completo + desconto em chats</div>
            </div>
            <button className="bg-yellow-400 text-[#1a0800] rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap">
              R$ 49,90
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/8 mb-4">
          {(['album', 'avaliacoes', 'sobre'] as TabId[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'text-[#ff4d7d] border-[#ff4d7d]'
                  : 'text-white/30 border-transparent'
              }`}
            >
              {t === 'album' ? 'Álbum' : t === 'avaliacoes' ? 'Avaliações' : 'Sobre'}
            </button>
          ))}
        </div>

        {/* Aba: Álbum */}
        {tab === 'album' && (
          <div className="grid grid-cols-3 gap-0.5 mb-20">
            {photoList.map(photo => (
              <AlbumPhoto
                key={photo.id}
                photo={photo}
                isUnlocked={photo.is_unlocked}
                isVip={isVip}
                userBalance={balance}
                onUnlock={handleUnlock}
                onInsufficientBalance={() => setShowBuyModal(true)}
              />
            ))}
            {photoList.length === 0 && (
              <div className="col-span-3 py-10 text-center text-white/25 text-sm">
                Nenhuma foto publicada ainda
              </div>
            )}
          </div>
        )}

        {/* Aba: Avaliações */}
        {tab === 'avaliacoes' && (
          <div className="flex flex-col gap-3 mb-20">
            {creator.rating_count === 0 ? (
              <div className="py-10 text-center text-white/25 text-sm">Ainda sem avaliações</div>
            ) : (
              // Avaliações estáticas — em produção viria do banco
              [
                { user: 'Carlos M.', stars: 5, text: 'Incrível! Super atenciosa e o conteúdo é exclusivo mesmo.', time: 'há 2 dias' },
                { user: 'João R.',   stars: 5, text: 'Melhor criadora do app, sem dúvida. Vale cada pétala.', time: 'há 4 dias' },
                { user: 'Pedro L.',  stars: 4, text: 'Chat muito bom, ela é natural e descontraída.', time: 'há 1 semana' },
              ].map((r, i) => (
                <div key={i} className="bg-[#111] rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-[#1e1e1e] flex items-center justify-center text-sm">👤</div>
                    <span className="text-white/60 text-xs flex-1">{r.user}</span>
                    <span className="text-yellow-400 text-xs">{'⭐'.repeat(r.stars)}</span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">{r.text}</p>
                  <p className="text-white/20 text-[10px] mt-1">{r.time}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Aba: Sobre */}
        {tab === 'sobre' && (
          <div className="flex flex-col gap-3 mb-20">
            {creator.bio && (
              <div className="bg-[#111] rounded-xl p-4 border border-white/5">
                <div className="text-white/30 text-[10px] uppercase tracking-wider mb-2">Bio</div>
                <p className="text-white/60 text-sm leading-relaxed">{creator.bio}</p>
              </div>
            )}
            <div className="bg-[#111] rounded-xl p-4 border border-white/5">
              <div className="text-white/30 text-[10px] uppercase tracking-wider mb-3">Preços</div>
              {[
                { label: 'Chat de texto', value: `${creator.price_text_petals} 🌸 / min` },
                { label: 'Chat de vídeo', value: `${creator.price_video_petals} 🌸 / min` },
                { label: 'Foto exclusiva', value: 'a partir de 50 🌸' },
                { label: 'VIP mensal', value: 'R$ 49,90' },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-white/40 text-xs">{row.label}</span>
                  <span className="text-yellow-400 text-xs font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat overlay */}
      {chatOpen && (
        <ChatWindow
          creator={creator}
          initialBalance={balance}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* Modal comprar pétalas (placeholder) */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center">
          <div className="bg-[#161616] rounded-t-2xl w-full max-w-sm px-5 pb-8 pt-4 border-t border-white/8">
            <div className="w-8 h-1 bg-white/15 rounded-full mx-auto mb-4" />
            <h3 className="text-white font-medium text-center mb-2">Pétalas insuficientes</h3>
            <p className="text-white/40 text-xs text-center mb-4">Compre mais pétalas para desbloquear esta foto</p>
            <button
              onClick={() => setShowBuyModal(false)}
              className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium mb-2"
            >
              Comprar pétalas 🌸
            </button>
            <button onClick={() => setShowBuyModal(false)} className="w-full text-white/25 text-xs py-1">
              agora não
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
