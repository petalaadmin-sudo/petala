// app/ranking/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CreatorAvatarImage } from '@/components/ui/CreatorAvatarImage'

export const revalidate = 300  // revalida a cada 5 minutos (ISR)

export default async function RankingPage() {
  const supabase = createClient()

  const { data: ranking } = await supabase
    .from('creator_rankings')  // view criada na migration 003
    .select('*')
    .order('rank_week', { ascending: true })
    .limit(20)

  const top3   = ranking?.slice(0, 3) ?? []
  const rest   = ranking?.slice(3)    ?? []

  // Calcula quando o ranking reseta (domingo 23:59)
  const now     = new Date()
  const sunday  = new Date(now)
  sunday.setDate(now.getDate() + (7 - now.getDay()) % 7)
  sunday.setHours(23, 59, 59, 0)
  const diffMs  = sunday.getTime() - now.getTime()
  const diffH   = Math.floor(diffMs / 3600000)
  const diffM   = Math.floor((diffMs % 3600000) / 60000)
  const resetIn = `${String(diffH).padStart(2,'0')}:${String(diffM).padStart(2,'0')}`

  const MEDAL = ['🥇','🥈','🥉']

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">

      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h1 className="text-white text-lg font-medium">Ranking semanal</h1>
        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/25 rounded-full px-2.5 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-[10px] font-medium">ao vivo</span>
        </div>
      </div>

      {/* Countdown */}
      <div className="mx-4 mb-4 bg-[#1a0d00] border border-yellow-400/15 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-yellow-400 text-xs font-medium">Ranking reseta em</div>
          <div className="text-white/30 text-[10px]">domingo 23:59</div>
        </div>
        <div className="text-yellow-400 text-xl font-medium tracking-wider">{resetIn}</div>
      </div>

      {/* Pódio */}
      {top3.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-end justify-center gap-3">
            {/* 2° lugar */}
            {top3[1] && (
              <div className="flex flex-col items-center flex-1">
                <Link href={`/criadora/${top3[1].creator_id}`}>
                  <div className="w-14 h-14 rounded-full bg-[#1e1e1e] border-2 border-gray-400 flex items-center justify-center text-2xl mb-1">
                    <CreatorAvatarImage
                      creatorId={top3[1].creator_id}
                      photoUrl={top3[1].photo_url}
                      name={top3[1].name}
                      className="w-full h-full object-cover rounded-full"
                      fallbackClassName="w-full h-full rounded-full flex items-center justify-center bg-[#1e1e1e] text-2xl text-white/70"
                    />
                  </div>
                </Link>
                <div className="text-white text-xs font-medium text-center">{top3[1].name}</div>
                <div className="text-gray-400 text-[10px]">{top3[1].total_gifts_week} 🎁</div>
                <div className="bg-[#181818] border border-gray-500/20 rounded-t-lg h-10 w-full flex items-center justify-center mt-2">
                  <span className="text-gray-400 text-lg">2</span>
                </div>
              </div>
            )}

            {/* 1° lugar */}
            {top3[0] && (
              <div className="flex flex-col items-center flex-1">
                <div className="text-lg mb-1">👑</div>
                <Link href={`/criadora/${top3[0].creator_id}`}>
                  <div className="w-18 h-18 rounded-full bg-[#1e1e1e] border-2 border-yellow-400 flex items-center justify-center text-3xl mb-1" style={{width:72,height:72}}>
                    <CreatorAvatarImage
                      creatorId={top3[0].creator_id}
                      photoUrl={top3[0].photo_url}
                      name={top3[0].name}
                      className="w-full h-full object-cover rounded-full"
                      fallbackClassName="w-full h-full rounded-full flex items-center justify-center bg-[#1e1e1e] text-3xl text-white/70"
                    />
                  </div>
                </Link>
                <div className="text-white text-xs font-medium text-center">{top3[0].name}</div>
                <div className="text-yellow-400 text-[10px]">{top3[0].total_gifts_week} 🎁</div>
                <div className="bg-[#1e1600] border border-yellow-400/20 rounded-t-lg h-14 w-full flex items-center justify-center mt-2">
                  <span className="text-yellow-400 text-lg font-medium">1</span>
                </div>
              </div>
            )}

            {/* 3° lugar */}
            {top3[2] && (
              <div className="flex flex-col items-center flex-1">
                <Link href={`/criadora/${top3[2].creator_id}`}>
                  <div className="w-12 h-12 rounded-full bg-[#1e1e1e] border-2 border-amber-600 flex items-center justify-center text-xl mb-1">
                    <CreatorAvatarImage
                      creatorId={top3[2].creator_id}
                      photoUrl={top3[2].photo_url}
                      name={top3[2].name}
                      className="w-full h-full object-cover rounded-full"
                      fallbackClassName="w-full h-full rounded-full flex items-center justify-center bg-[#1e1e1e] text-xl text-white/70"
                    />
                  </div>
                </Link>
                <div className="text-white text-xs font-medium text-center">{top3[2].name}</div>
                <div className="text-amber-600 text-[10px]">{top3[2].total_gifts_week} 🎁</div>
                <div className="bg-[#181818] border border-amber-700/20 rounded-t-lg h-8 w-full flex items-center justify-center mt-2">
                  <span className="text-amber-600 text-lg">3</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista 4–20 */}
      <div className="px-4 flex flex-col gap-2">
        <div className="flex justify-between px-1 mb-1">
          <span className="text-white/25 text-[10px] uppercase tracking-wider">Criadora</span>
          <span className="text-white/25 text-[10px] uppercase tracking-wider">Presentes</span>
        </div>
        {rest.map((c, i) => (
          <Link
            key={c.creator_id}
            href={`/criadora/${c.creator_id}`}
            className="flex items-center gap-3 bg-[#111] rounded-xl px-3 py-3 border border-white/5 active:border-[#ff4d7d]/30 transition-colors"
          >
            <span className="text-white/30 text-xs w-5 text-center font-medium">{i + 4}</span>
            <div className="w-9 h-9 rounded-full bg-[#1e1e1e] flex items-center justify-center text-base flex-shrink-0 overflow-hidden">
              <CreatorAvatarImage
                creatorId={c.creator_id}
                photoUrl={c.photo_url}
                name={c.name}
                className="w-full h-full object-cover"
                fallbackClassName="w-full h-full flex items-center justify-center bg-[#1e1e1e] text-base text-white/70"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{c.name}</div>
              <div className={`text-[10px] mt-0.5 ${c.online ? 'text-green-400' : 'text-white/25'}`}>
                {c.online ? '● online' : '● offline'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 text-xs font-medium">{c.total_gifts_week} 🎁</div>
            </div>
            {c.online && (
              <div className="w-7 h-7 rounded-lg bg-[#ff4d7d] flex items-center justify-center text-xs flex-shrink-0">
                📹
              </div>
            )}
          </Link>
        ))}
      </div>

    </div>
  )
}
