'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const SUCCESS_MESSAGE = 'Se este email estiver cadastrado, enviaremos instruções de recuperação.'

export default function RecuperarSenhaPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async () => {
    if (!email || loading) return

    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/definir-senha`,
    })

    if (error) {
      console.error('[recuperar-senha]', error)
    }

    setMessage(SUCCESS_MESSAGE)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-xs">
        <h1 className="text-white text-2xl font-medium mb-2">Recuperar senha</h1>
        <p className="text-white/35 text-xs mb-8 leading-relaxed">
          Informe seu e-mail para receber um link seguro de recuperacao.
        </p>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && submit()}
            placeholder="seu@email.com"
            className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/40"
          />

          <button
            type="button"
            onClick={submit}
            disabled={!email || loading}
            className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar instrucoes'}
          </button>

          {message && (
            <p className="bg-green-400/10 border border-green-400/15 rounded-xl px-4 py-3 text-green-300 text-xs leading-relaxed">
              {message}
            </p>
          )}

          <a href="/auth/login" className="text-center text-white/35 hover:text-white/60 text-xs mt-2">
            Voltar para login
          </a>
        </div>
      </div>
    </div>
  )
}
