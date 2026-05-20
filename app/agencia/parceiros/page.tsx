'use client'

import { useState } from 'react'

type FormState = {
  agency_name: string
  responsible_name: string
  email: string
  whatsapp: string
  country: string
  recruitment_experience: string
  expected_creators_count: string
  social_links: string
  notes: string
}

const initialForm: FormState = {
  agency_name: '',
  responsible_name: '',
  email: '',
  whatsapp: '',
  country: '',
  recruitment_experience: '',
  expected_creators_count: '',
  social_links: '',
  notes: '',
}

export default function AgencyPartnersPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const updateField = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agencia/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          expected_creators_count: Number(form.expected_creators_count),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data?.success) {
        setError(data?.error ?? 'Nao foi possivel enviar sua candidatura.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setForm(initialForm)
    } catch {
      setError('Nao foi possivel enviar sua candidatura.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5 py-10">
        <section className="w-full max-w-lg bg-[#111] border border-white/5 rounded-xl p-6 text-center">
          <div className="text-[#ff4d7d] text-xs font-medium uppercase tracking-wide">Bloom Partners</div>
          <h1 className="text-white text-2xl font-medium mt-3">Candidatura recebida</h1>
          <p className="text-white/45 text-sm leading-relaxed mt-3">
            Obrigado pelo interesse. Nossa equipe vai revisar os dados e entrar em contato se a agencia for aprovada para a proxima etapa.
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="mt-6 bg-[#ff4d7d] text-white rounded-xl px-5 py-3 text-sm font-medium"
          >
            Enviar outra candidatura
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <div className="text-[#ff4d7d] text-xs font-medium uppercase tracking-wide">Bloom Partners</div>
          <h1 className="text-white text-3xl font-medium mt-2">Candidatura para agencias</h1>
          <p className="text-white/45 text-sm leading-relaxed mt-3 max-w-2xl">
            Conte sobre sua operacao e sua experiencia com recrutamento de criadoras. A aprovacao e manual e, nesta etapa, nao cria conta nem acesso automatico.
          </p>
        </header>

        <form onSubmit={submit} className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            <Field label="Nome da agencia" required>
              <input
                value={form.agency_name}
                onChange={event => updateField('agency_name', event.target.value)}
                required
                maxLength={140}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#ff4d7d]/50"
              />
            </Field>

            <Field label="Responsavel" required>
              <input
                value={form.responsible_name}
                onChange={event => updateField('responsible_name', event.target.value)}
                required
                maxLength={140}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#ff4d7d]/50"
              />
            </Field>

            <Field label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={event => updateField('email', event.target.value)}
                required
                maxLength={180}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#ff4d7d]/50"
              />
            </Field>

            <Field label="WhatsApp" required>
              <input
                value={form.whatsapp}
                onChange={event => updateField('whatsapp', event.target.value)}
                required
                maxLength={40}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#ff4d7d]/50"
              />
            </Field>

            <Field label="Pais" required>
              <input
                value={form.country}
                onChange={event => updateField('country', event.target.value)}
                required
                maxLength={80}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#ff4d7d]/50"
              />
            </Field>

            <Field label="Criadoras esperadas" required>
              <input
                type="number"
                min={1}
                value={form.expected_creators_count}
                onChange={event => updateField('expected_creators_count', event.target.value)}
                required
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#ff4d7d]/50"
              />
            </Field>

            <Field label="Experiencia com recrutamento" required wide>
              <textarea
                value={form.recruitment_experience}
                onChange={event => updateField('recruitment_experience', event.target.value)}
                required
                maxLength={3000}
                rows={5}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#ff4d7d]/50 resize-none"
              />
            </Field>

            <Field label="Links sociais" wide>
              <textarea
                value={form.social_links}
                onChange={event => updateField('social_links', event.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Instagram, site, portfolio ou perfis relevantes"
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#ff4d7d]/50 resize-none"
              />
            </Field>

            <Field label="Observacoes" wide>
              <textarea
                value={form.notes}
                onChange={event => updateField('notes', event.target.value)}
                maxLength={3000}
                rows={4}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#ff4d7d]/50 resize-none"
              />
            </Field>
          </div>

          {error && (
            <div className="mx-5 mb-5 bg-red-950/40 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="border-t border-white/5 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-white/30 text-xs leading-relaxed">
              Enviar candidatura nao cria acesso automatico ao painel.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#ff4d7d] text-white rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar candidatura'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

function Field({
  label,
  required,
  wide,
  children,
}: {
  label: string
  required?: boolean
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <label className={`block ${wide ? 'md:col-span-2' : ''}`}>
      <span className="block text-white/35 text-xs uppercase tracking-wide mb-2">
        {label}{required ? ' *' : ''}
      </span>
      {children}
    </label>
  )
}
