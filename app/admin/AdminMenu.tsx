'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const MENU = [
  { href: '/admin', icon: '📊', label: 'Dashboard' },
  { href: '/admin/analytics', icon: '📉', label: 'Analytics' },
  { href: '/admin/usuarios', icon: '👥', label: 'Usuários' },
  { href: '/admin/criadoras', icon: '🌸', label: 'Criadoras' },
  { href: '/admin/financeiro', icon: '💰', label: 'Financeiro' },
  { href: '/agencia', icon: '🏢', label: 'Agência' },
  { href: '/admin/agencias', icon: '📋', label: 'Agências' },
  { href: '/admin/moderacao', icon: '🛡️', label: 'Moderação' },
  { href: '/admin/trust', icon: '🔒', label: 'Trust & Safety' },
  { href: '/admin/lives', icon: '🎥', label: 'Lives' },
  { href: '/admin/petalas', icon: '✨', label: 'Pétalas' },
  { href: '/admin/marketing', icon: '📈', label: 'Marketing' },
  { href: '/admin/suporte', icon: '🎧', label: 'Suporte' },
]

export function AdminMenu() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[#0d0d0d] border-r border-white/5 flex flex-col z-50">
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌸</span>
          <span className="text-white font-medium text-sm">Admin Pétala</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {MENU.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm transition-all ${
                active
                  ? 'bg-[#ff4d7d]/15 text-[#ff4d7d]'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-5 py-4 border-t border-white/5">
        <Link href="/feed" className="text-white/20 text-xs hover:text-white/40 transition-all">
          ← Voltar ao app
        </Link>
      </div>
    </aside>
  )
}
