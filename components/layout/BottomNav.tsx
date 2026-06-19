// components/layout/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  role: string
  unreadMessages?: number
}

export function BottomNav({ role, unreadMessages = 0 }: Props) {
  const pathname = usePathname()
  const activePathname =
    pathname === '/favoritos' || pathname === '/mensagens'
      ? '/perfil'
      : pathname

  const tabs = [
    { href: '/feed',       icon: '🔥', label: 'Feed'    },
    { href: '/ranking',    icon: '🏆', label: 'Ranking' },
    { href: '/indicacao', icon: '🌸', label: 'Indicar' },
    {
      href:  role === 'creator' ? '/criadora/dashboard' : '/perfil',
      icon:  role === 'creator' ? '📊' : '👤',
      label: role === 'creator' ? 'Painel' : 'Perfil',
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0d0d0d] border-t border-white/5 flex z-40">
      {tabs.map(tab => {
        const isActive = activePathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center gap-1 py-2 relative"
          >
            <span className="text-base leading-none">{tab.icon}</span>
            <span className={`text-[9px] font-medium ${isActive ? 'text-[#ff4d7d]' : 'text-white/25'}`}>
              {tab.label}
            </span>
            {tab.badge ? (
              <span className="absolute top-1.5 right-1/4 w-2 h-2 bg-[#ff4d7d] rounded-full border border-[#0d0d0d]" />
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
