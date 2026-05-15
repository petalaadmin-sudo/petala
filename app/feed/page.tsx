'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCreatorPresence } from '@/lib/hooks/useCreatorPresence'
import { ChatWindow } from '@/components/chat/ChatWindow'
import Link from 'next/link'

interface Creator {
  id: string
  name: string
  photo_url: string | null
  bio: string | null
  price_text_petals: number
  price_video_petals: number
  rating: number
  total_gifts: number
  rank_weekly: number | null
}

function FeedCard({
  creator,
  isActive,
  userBalance,
  onChatOpen,
  isFavorited,
  onToggleFavorite,
}: {
  creator: Creator
  isActive: boolean
  userBalance: number
  onChatOpen: (creator: Creator) => void
  isFavorited: boolean
  onToggleFavorite: (creatorId: string) => void
}) {
  const presence = useCreatorPresence(creator.id)
  const [liked, setLiked] = useState(false)

  return (
    <div className="relative w-full h-full flex-shrink-0 snap-start overflow-hidden bg-[#0a0a0a]">

      <div className="absolute inset-0">
        {creator.photo_url ? (
          <img
            src={creator.photo_url}
            alt={creator.name}
            className="w-full h-full object-cover"
            loading={isActive ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2a0a1a] to-[#0a0a0a] flex items-center justify-center text-8xl opacity-50">
            🌸
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85" />
      </div>

      <div className="absolute top-0 left-0 right-0 px-4 pt-4 flex items-center justify-between z-10">
        <div className="text-white text-lg font-medium tracking-tight">
          pé<span className="text-[#ff4d7d]">tala</span>
        </div>
        <div className="flex items-center gap-2">
          {presence.online && (
            <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/35 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Online agora</span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute right-3 bottom-36 flex flex-col items-center gap-4 z-10">
        <Link href={`/criadora/${creator.id}`}>
          <div className="w-12 h-12 rounded-full border-2 border-[#ff4d7d] overflow-hidden bg-[#2a1220]">
            {creator.photo_url
              ? <img src={creator.photo_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-xl">🌸</div>
            }
          </div>
        </Link>

        {/* Like */}
        <button
          onClick={() => setLiked(v => !v)}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${liked ? 'bg-[#ff4d7d]/20' : 'bg-black/40'}`}>
            {liked ? '❤️' : '🤍'}
          </div>
          <span className="text-white/60 text-[10px]">curtir</span>
        </button>

        {/* Favoritar */}
        <button
          onClick={() => onToggleFavorite(creator.id)}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${isFavorited ? 'bg-yellow-400/20' : 'bg-black/40'}`}>
            {isFavorited ? '⭐' : '☆'}
          </div>
          <span className="text-white/60 text-[10px]">favorito</span>
        </button>

        {/* Presente */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-xl">🎁</div>
          <span className="text-white/60 text-[10px]">{creator.total_gifts}</span>
        </button>

        {/* Compartilhar */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-xl">📤</div>
          <span className="text-white/60 text-[10px]">compartilhar</span>
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-16 px-4 pb-6 z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white text-lg font-medium">{creator.name}</span>
          {creator.rank_weekly && creator.rank_weekly <= 10 && (
            <span className="bg-yellow-400/15 border border-yellow-400/30 rounded-md px-1.5 py-0.5 text-yellow-400 text-[10px] font-medium">
              #{creator.rank_weekly} semana
            </span>
          )}
        </div>
        <p className="text-white/60 text-xs leading-relaxed mb-3 line-clamp-2">
          {creator.bio ?? 'Conteúdo exclusivo para você 🌸'}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => onChatOpen(creator)}
            disabled={!presence.online}
            className="flex-[2] bg-[#ff4d7d] text-white rounded-xl py-2.5 text-xs font-medium disabled:opacity-40 active:scale-95 transition-transform"
          >
            {presence.online ? `📹 Chat — ${creator.price_text_petals}🌸/min` : '💤 Offline'}
          </button>
          <Link
            href={`/criadora/${creator.id}`}
            className="flex-1 bg-white/10 text-white rounded-xl py-2.5 text-xs font-medium text-center border border-white/10"
          >
            📸 Álbum
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function FeedPage() {
  const supabase = createClient()
  const [creators, setCreators] = useState<Creator[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userBalance, setUserBalance] = useState(0)
  const [chatCreator, setChatCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [creatorsRes, balanceRes, favoritesRes] = await Promise.all([
        supabase
          .from('creators')
          .select('id, name, photo_url, bio, price_text_petals, price_video_petals, rating, total_gifts, rank_weekly')
          .eq('active', true)
          .order('rank_weekly', { ascending: true, nullsFirst: false })
          .limit(20),
        supabase
          .from('users')
          .select('balance_petals')
          .eq('id', user.id)
          .single(),
        supabase
          .from('favorites')
          .select('creator_id')
          .eq('user_id', user.id),
      ])

      if (creatorsRes.data) setCreators(creatorsRes.data)
      if (balanceRes.data) setUserBalance(balanceRes.data.balance_petals)
      if (favoritesRes.data) setFavorites(new Set(favoritesRes.data.map(f => f.creator_id)))
      setLoading(false)
    }
    load()
  }, [])

  const toggleFavorite = useCallback(async (creatorId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (favorites.has(creatorId)) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('creator_id', creatorId)
      setFavorites(prev => { const next = new Set(prev); next.delete(creatorId); return next })
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, creator_id: creatorId })
      setFavorites(prev => new Set([...prev, creatorId]))
    }
  }, [favorites])

  useEffect(() => {
    if (!containerRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute('data-idx') ?? '0', 10)
            setCurrentIdx(idx)
          }
        })
      },
      { threshold: 0.6, root: containerRef.current }
    )

    const cards = containerRef.current.querySelectorAll('[data-idx]')
    cards.forEach(card => observerRef.current?.observe(card))

    return () => observerRef.current?.disconnect()
  }, [creators])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff4d7d]/30 border-t-[#ff4d7d] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div
        ref={containerRef}
        className="h-[calc(100vh-64px)] overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {creators.map((creator, idx) => (
          <div
            key={creator.id}
            data-idx={idx}
            className="w-full h-[calc(100vh-64px)] snap-start"
          >
            <FeedCard
              creator={creator}
              isActive={idx === currentIdx}
              userBalance={userBalance}
              onChatOpen={setChatCreator}
              isFavorited={favorites.has(creator.id)}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        ))}

        {creators.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-white/30 gap-3">
            <span className="text-4xl">🌸</span>
            <span className="text-sm">Nenhuma criadora online no momento</span>
          </div>
        )}
      </div>

      <div className="absolute top-12 left-0 right-0 flex gap-1 px-4 z-20 pointer-events-none">
        {creators.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-0.5 rounded-full transition-colors ${i === currentIdx ? 'bg-white' : 'bg-white/20'}`}
          />
        ))}
      </div>

      <div className="absolute top-4 right-4 z-30 bg-black/50 rounded-full px-3 py-1.5 flex items-center gap-1.5 pointer-events-none">
        <span className="text-xs">🌸</span>
        <span className="text-yellow-400 text-xs font-medium">{userBalance}</span>
      </div>

      {chatCreator && (
        <ChatWindow
          creator={chatCreator}
          initialBalance={userBalance}
          onClose={() => setChatCreator(null)}
        />
      )}
    </>
  )
}