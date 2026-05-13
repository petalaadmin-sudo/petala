'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function SucessoContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sessionId = params.get('session_id')
    if (sessionId) {
      setTimeout(() => {
        setLoading(false)
      }, 2000)
    } else {
      router.push('/perfil')
    }
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#ff4d7d]/30 border-t-[#ff4d7d] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4">🌸</div>
      <h1 className="text-white text-xl font-medium mb-2">Pagamento confirmado!</h1>
      <p className="text-white/40 text-sm mb-8">Suas pétalas foram adicionadas com sucesso</p>
      <button
        onClick={() => router.push('/perfil')}
        className="bg-[#ff4d7d] text-white rounded-xl px-8 py-3 text-sm font-medium"
      >
        Ver meu saldo
      </button>
    </div>
  )
}

export default function SucessoPage() {
  return <Suspense><SucessoContent /></Suspense>
}