'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

export type CreatorAreaSection =
  | 'dashboard'
  | 'feed'
  | 'mensagens'
  | 'chamadas'
  | 'ganhos'
  | 'perfil'
  | 'configuracoes'

export type CreatorAreaContext = {
  id: string
  name: string | null
  bio: string | null
  photo_url: string | null
  verified: boolean
  active: boolean
  rank_weekly: number | null
  total_gifts: number | null
}

type CreatorAreaShellProps = {
  section: CreatorAreaSection
  title: string
  subtitle: string
  creator: CreatorAreaContext
  children: ReactNode
}

type CreatorAreaNavProps = {
  active: CreatorAreaSection
  className?: string
}

const NAV_ITEMS: { section: CreatorAreaSection; label: string; href: string }[] = [
  { section: 'dashboard', label: 'Inicio', href: '/criadora/dashboard' },
  { section: 'feed', label: 'Feed', href: '/criadora/feed' },
  { section: 'mensagens', label: 'Mensagens', href: '/criadora/mensagens' },
  { section: 'chamadas', label: 'Chamadas', href: '/criadora/chamadas' },
  { section: 'ganhos', label: 'Ganhos', href: '/criadora/ganhos' },
  { section: 'perfil', label: 'Perfil', href: '/criadora/perfil' },
  { section: 'configuracoes', label: 'Ajustes', href: '/criadora/configuracoes' },
]

export function CreatorAreaNav({ active, className = '' }: CreatorAreaNavProps) {
  return (
    <nav className={`-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 ${className}`}>
      {NAV_ITEMS.map(item => (
        <Link
          key={item.section}
          href={item.href}
          className={`shrink-0 rounded-2xl border px-3.5 py-2 text-[11px] font-medium transition-colors ${
            active === item.section
              ? 'border-[#ff4d7d] bg-[#ff4d7d] text-white'
              : 'border-white/8 bg-[#111] text-white/45 hover:text-white/70'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

export function CreatorAreaShell({ section, title, subtitle, children }: CreatorAreaShellProps) {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 text-white">
      <header className="px-4 pb-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#ff8aaa]">Creator Bloom</p>
            <h1 className="mt-2 truncate text-2xl font-semibold">{title}</h1>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/40">{subtitle}</p>
          </div>
          <div className="shrink-0 rounded-full border border-green-400/25 bg-green-400/10 px-3 py-1.5 text-[11px] font-medium text-green-300">
            Verificada
          </div>
        </div>

        <CreatorAreaNav active={section} className="mt-4" />
      </header>

      <section className="px-4">
        {children}
      </section>
    </main>
  )
}
