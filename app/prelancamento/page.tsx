'use client'

import { FormEvent, useState } from 'react'

export default function PrelaunchPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!code.trim() || loading) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/prelaunch/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.ok) {
        if (response.status === 401) {
          setError('Código não reconhecido. Confira o acesso recebido e tente novamente.')
        } else if (response.status === 503) {
          setError('Acesso temporariamente indisponível. A equipe precisa concluir a configuração do ambiente.')
        } else {
          setError('Não foi possível validar o acesso agora. Tente novamente em instantes.')
        }
        setLoading(false)
        return
      }

      window.location.assign('/')
    } catch {
      setError('Não foi possível validar o acesso agora. Tente novamente em instantes.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#08080a] text-white flex items-center justify-center px-5 py-10 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff4d7d1f,transparent_36%),radial-gradient(circle_at_bottom,#ffffff0f,transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff4d7d]/50 to-transparent" />

      <section className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#ff4d7d]/12 border border-[#ff4d7d]/20 flex items-center justify-center text-2xl">
            🌸
          </div>
          <p className="text-[#ff8dad] text-xs font-medium uppercase tracking-[0.28em] mb-3">
            acesso restrito
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Pétala está em preparação</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/48">
            Estamos finalizando o ambiente de pré-lançamento. O acesso é reservado para equipe,
            parceiros e convidados autorizados.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/40 backdrop-blur"
        >
          <label htmlFor="prelaunch-code" className="block text-xs font-medium text-white/50 mb-2">
            Código de acesso
          </label>
          <input
            id="prelaunch-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="off"
            inputMode="text"
            placeholder="Digite seu código"
            className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-white/22 outline-none focus:border-[#ff4d7d]/55"
          />

          {error && (
            <p className="mt-3 rounded-2xl border border-red-400/15 bg-red-400/10 px-3 py-2 text-xs leading-relaxed text-red-100/85">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!code.trim() || loading}
            className="mt-4 w-full rounded-2xl bg-[#ff4d7d] px-4 py-3 text-sm font-medium text-white transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? 'Validando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-white/28">
          Ambiente privado. Se você recebeu um convite, use o código enviado pela equipe.
        </p>
      </section>
    </main>
  )
}
