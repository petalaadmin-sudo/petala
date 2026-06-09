'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

function getAuthParam(
  searchParams: URLSearchParams,
  hashParams: URLSearchParams,
  key: string,
) {
  return searchParams.get(key) ?? hashParams.get(key)
}

function isExpiredAuthLinkError(error: string | null, errorCode: string | null, errorDescription: string | null) {
  const combined = `${error ?? ''} ${errorCode ?? ''} ${errorDescription ?? ''}`.toLowerCase()

  return (
    errorCode === 'otp_expired' ||
    combined.includes('otp_expired') ||
    combined.includes('email link is invalid') ||
    combined.includes('expired') ||
    combined.includes('invalid')
  )
}

export function AuthUrlErrorRedirect() {
  const router = useRouter()

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const error = getAuthParam(searchParams, hashParams, 'error')
    const errorCode = getAuthParam(searchParams, hashParams, 'error_code')
    const errorDescription = getAuthParam(searchParams, hashParams, 'error_description')

    if (!error && !errorCode && !errorDescription) return

    const loginError = isExpiredAuthLinkError(error, errorCode, errorDescription)
      ? 'auth_link_expired'
      : 'session_error'

    router.replace(`/auth/login?error=${loginError}`)
  }, [router])

  return null
}
