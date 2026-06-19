"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface Props {
  role: string
  unreadMessages?: number
}

type NavIconProps = {
  active: boolean
}

function FeedIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 3.5c4.4 0 7.9 3.2 8.7 7.6a1.7 1.7 0 0 1-1.7 2h-3.3a3.8 3.8 0 0 0-7.4 0H5a1.7 1.7 0 0 1-1.7-2C4.1 6.7 7.6 3.5 12 3.5Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8.6 16.4h6.8M9.7 19.2h4.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function RankingIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M8 5.5h8v3.1a4 4 0 0 1-8 0V5.5Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M6.4 6.7H4.8a2 2 0 0 0 2 2h1M17.6 6.7h1.6a2 2 0 0 1-2 2h-1M12 13v3.6M8.9 19h6.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function MessagesIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M5.4 5.8h13.2a2.2 2.2 0 0 1 2.2 2.2v6.9a2.2 2.2 0 0 1-2.2 2.2H11l-4.2 3v-3H5.4a2.2 2.2 0 0 1-2.2-2.2V8a2.2 2.2 0 0 1 2.2-2.2Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M7.8 10.2h8.4M7.8 13.4h5.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function ProfileIcon({ active }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 12.2a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4.9 20.1a7.2 7.2 0 0 1 14.2 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

export function BottomNav({ role }: Props) {
  const pathname = usePathname()
  const profileHref = role === "creator" ? "/criadora/dashboard" : "/perfil"
  const profileLabel = role === "creator" ? "Painel" : "Perfil"
  const activePathname =
    pathname === "/favoritos"
      ? "/mensagens"
      : pathname === "/indicacao"
        ? "/perfil"
        : pathname

  const tabs = [
    { href: "/feed", label: "Feed", Icon: FeedIcon },
    { href: "/ranking", label: "Ranking", Icon: RankingIcon },
    { href: "/mensagens", label: "Mensagens", Icon: MessagesIcon },
    { href: profileHref, label: profileLabel, Icon: ProfileIcon },
  ]

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-40 mx-auto max-w-md px-3">
      <div className="grid grid-cols-4 rounded-3xl border border-white/10 bg-[#0d0d0d]/95 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        {tabs.map(({ href, label, Icon }) => {
          const isActive = activePathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl transition-all ${
                isActive
                  ? "bg-[#ff4d7d]/15 text-[#ff8aaa] shadow-[inset_0_0_0_1px_rgba(255,77,125,0.22)]"
                  : "text-white/35 active:bg-white/[0.04]"
              }`}
            >
              <Icon active={isActive} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
