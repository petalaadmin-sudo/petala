'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

type InviteCaptureClientProps = {
  code: string
}

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export default function InviteCaptureClient({ code }: InviteCaptureClientProps) {
  const router = useRouter()

  useEffect(() => {
    localStorage.setItem('pending_agency_invite_code', code)
    document.cookie = `pending_agency_invite_code=${encodeURIComponent(code)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
  }, [code])

  return (
    <button
      type="button"
      onClick={() => router.push('/criadora/onboarding')}
      className="w-full sm:w-auto rounded-xl bg-[#ff4d7d] px-5 py-3 text-sm font-medium text-white hover:bg-[#ff6a92] active:scale-95 transition-all"
    >
      Continuar como creator
    </button>
  )
}
