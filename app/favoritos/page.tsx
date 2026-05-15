'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function FavoritosPage() {
  const supabase = createClient()
  const [favoritos, setFavoritos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('favorites')
        .select('creator_id, created_at, creators(id, name, photo_url, bio, price_text_petals)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setFavoritos(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function removerFavorito(creatorId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('creator_id', creatorId)
    setFavoritos(prev => prev.filter(f => f.creator_id !== creatorId))
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#ff4d7d]/30 border-t-[#ff4d7d] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/feed" className="text-white/40 text-sm">← Voltar</Link>
        <h1 className="text-white text-lg font-medium">Minhas favoritas</h1>
        <span className="bg-[#ff4d7d]/20 text-[#ff4d7d] text-xs rounded-full px-2 py-0.5">{favoritos.length}</span>
      </div>

      {favoritos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <span className="text-4xl">⭐</span>
          <p className="text-white/30 text-sm">Nenhuma favorita ainda</p>
          <Link href="/feed" className="text-[#ff4d7d] text-sm">Explorar criadoras</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {favoritos.map(f => {
            const creator = f.creators
            if (!creator) return null
            return (
              <div key={f.creator_id} className="bg-[#111] rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                <Link href={`/criadora/${creator.id}`}>
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#2a1220] flex-shrink-0">
                    {creator.photo_url
                      ? <img src={creator.photo_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                    }
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/criadora/${creator.id}`}>
                    <div className="text-white font-medium text-sm">{creator.name}</div>
                  </Link>
                  <div className="text-white/40 text-xs mt-0.5 truncate">{creator.bio || 'Conteúdo exclusivo 🌸'}</div>
                  <div className="text-[#ff4d7d] text-xs mt-1">{creator.price_text_petals} 🌸/msg</div>
                </div>
                <button
                  onClick={() => removerFavorito(f.creator_id)}
                  className="text-yellow-400 text-xl flex-shrink-0"
                >
                  ⭐
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}