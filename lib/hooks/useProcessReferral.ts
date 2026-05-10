// lib/hooks/useProcessReferral.ts
// Chamado no layout do app após login.
// Se ?process_referral=1 estiver na URL, lê o código do localStorage e registra.
'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function useProcessReferral() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const pathname     = usePathname()

  useEffect(() => {
    if (searchParams.get('process_referral') !== '1') return

    const process = async () => {
      const code = localStorage.getItem('pending_referral_code')

      if (code) {
        try {
          await fetch('/api/indicacao/registrar', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ referral_code: code }),
          })
        } catch (err) {
          console.error('[useProcessReferral]', err)
        } finally {
          localStorage.removeItem('pending_referral_code')
        }
      }

      // Remove o query param da URL sem recarregar a página
      const params = new URLSearchParams(searchParams.toString())
      params.delete('process_referral')
      const newUrl = pathname + (params.toString() ? `?${params}` : '')
      router.replace(newUrl)
    }

    process()
  }, [searchParams])
}
