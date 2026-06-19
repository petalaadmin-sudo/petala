"use client"

import { usePathname } from "next/navigation"
import { BottomNav } from "@/components/layout/BottomNav"

const USER_NAV_ROUTES = new Set([
  "/feed",
  "/ranking",
  "/indicacao",
  "/perfil",
  "/favoritos",
  "/mensagens",
])

export function UserBottomNavGate() {
  const pathname = usePathname()

  if (!USER_NAV_ROUTES.has(pathname)) {
    return null
  }

  return <BottomNav role="user" />
}
