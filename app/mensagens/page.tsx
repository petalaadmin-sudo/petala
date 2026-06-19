// app/mensagens/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { CreatorAvatarImage } from '@/components/ui/CreatorAvatarImage'

interface Session {
  id: string
  creator_id: string
  type: string
  started_at: string
  ended_at: string | null
  petals_charged: number
  creators: { name: string; photo_url: string | null }
  last_message?: string
}

export default function MensagensPage() {
  const supabase = createClient()
  const [sessions, setSessions]   = useState<Session[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('chat_sessions')
        .select(`
          id, creator_id, type, started_at, ended_at, petals_charged,
          creators!inner ( name, photo_url )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(30)

      if (data) setSessions(data as any)
      setLoading(false)
    }
    load()
  }, [])

  const fmtDate = (d: string) => {
    const dt = new Date(d)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - dt.getTime()) / 86400000)
    if (diffDays === 0) return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'ontem'
    if (diffDays < 7)  return dt.toLocaleDateString('pt-BR', { weekday: 'short' })
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const fmtDuration = (s: Session) => {
    if (!s.ended_at) return '● ao vivo'
    const secs = Math.floor((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000)
    const m = Math.floor(secs / 60)
    return `${m}min · ${s.petals_charged}🌸`
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-8 h-8 border-2 border-[#ff4d7d]/30 border-t-[#ff4d7d] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">

      <div className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-white/5">
        <div>
          <h1 className="text-white text-lg font-medium">Mensagens</h1>
          <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-white/35">
            Suas conversas e criadoras salvas aparecerão aqui conforme os recursos forem liberados.
          </p>
        </div>
        <span className="text-white/25 text-xs">{sessions.length} registros</span>
      </div>

      <div className="px-5 py-4">
        <Link
          href="/favoritos"
          className="group flex items-center gap-4 rounded-2xl border border-white/8 bg-[#111]/95 p-4 active:scale-[0.98] transition-transform"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ff4d7d]/20 bg-[#ff4d7d]/10 text-[11px] font-semibold tracking-[0.18em] text-[#ff8aaa]">
            FV
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white text-sm font-medium">Favoritos</div>
            <p className="mt-1 text-xs leading-relaxed text-white/40">
              Criadoras salvas para acessar depois.
            </p>
          </div>
          <span className="text-white/20 text-lg transition-colors group-active:text-white/40">›</span>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <div className="text-4xl mb-4">💬</div>
          <h2 className="text-white text-base font-medium mb-2">Nenhuma conversa ainda</h2>
          <p className="text-white/30 text-sm leading-relaxed mb-6">
            Quando as conversas estiverem disponíveis, elas aparecerão aqui.
          </p>
          <Link href="/feed"
            className="bg-[#ff4d7d] text-white rounded-xl px-6 py-3 text-sm font-medium">
            Ir para o feed
          </Link>
        </div>
      ) : (
        <div className="flex flex-col">
          {sessions.map(s => (
            <Link
              key={s.id}
              href={`/criadora/${s.creator_id}`}
              className="flex items-center gap-3 px-5 py-4 border-b border-white/5 active:bg-white/[0.02] transition-colors"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#1e1e1e] border border-white/8 overflow-hidden flex items-center justify-center text-2xl">
                  <CreatorAvatarImage
                    creatorId={s.creator_id}
                    photoUrl={s.creators.photo_url}
                    name={s.creators.name}
                    className="w-full h-full object-cover"
                    fallbackClassName="w-full h-full flex items-center justify-center bg-[#1e1e1e] text-2xl text-white/70"
                  />
                </div>
                {!s.ended_at && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-[#0a0a0a]" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-white text-sm font-medium truncate">{s.creators.name}</span>
                  <span className="text-white/25 text-[10px] flex-shrink-0 ml-2">{fmtDate(s.started_at)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{s.type === 'video' ? '📹' : '💬'}</span>
                  <span className={`text-xs truncate ${!s.ended_at ? 'text-green-400' : 'text-white/35'}`}>
                    {fmtDuration(s)}
                  </span>
                </div>
              </div>

              {/* Seta */}
              <span className="text-white/15 text-sm flex-shrink-0">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
