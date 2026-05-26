'use client'

import { useParams, useRouter } from 'next/navigation'

export default function LivePage() {
  const params = useParams()
  const router = useRouter()
  const canal = decodeURIComponent(params.canal as string)

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
        <div className="text-3xl mb-3">🎥</div>
        <h1 className="text-white text-lg font-semibold mb-2">Video privado em teste</h1>
        <p className="text-white/55 text-sm leading-relaxed mb-2">
          O canal antigo "{canal}" nao emite mais token Agora livre.
        </p>
        <p className="text-white/45 text-xs leading-relaxed mb-5">
          Tokens agora exigem uma sessao de video ativa, paga e validada pelo servidor.
        </p>
        <button
          onClick={() => router.back()}
          className="w-full rounded-xl bg-[#ff4d7d] py-3 text-sm font-medium text-white"
        >
          Voltar
        </button>
      </div>
    </div>
  )
}
