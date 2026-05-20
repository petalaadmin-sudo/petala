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

type ApplicationType = 'agency' | 'creator'

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

const steps = [
  {
    title: 'Escolha seu perfil',
    description: 'Candidate-se como agência parceira ou creator verificada.',
  },
  {
    title: 'Siga o fluxo correto',
    description: 'Agências enviam a candidatura nesta página. Creators seguem para onboarding e verificação.',
  },
  {
    title: 'Nossa equipe analisa',
    description: 'A aprovação segue critérios de segurança, qualidade e conformidade da plataforma.',
  },
  {
    title: 'Receba acesso',
    description: 'Agências aprovadas acessam o painel. Creators aprovadas seguem para seu dashboard.',
  },
]

const benefits = [
  'Comissão sobre creators vinculadas',
  'Painel de performance por agência',
  'Ranking e metas Bloom',
  'Acompanhamento de ganhos',
  'Suporte para crescimento',
]

const profiles = [
  {
    title: 'Agência parceira',
    description: 'Recrute, oriente e acompanhe creators vinculadas. Receba 30% sobre ganhos sacáveis elegíveis, conforme regras da plataforma.',
    action: 'Quero ser agência',
    href: '#candidatura',
    applicationType: 'agency' as ApplicationType,
  },
  {
    title: 'Creator verificada',
    description: 'Crie seu perfil, passe pela verificação e monetize sua presença por meio de experiências privadas dentro da plataforma.',
    action: 'Quero ser creator',
    href: '#candidatura',
    applicationType: 'creator' as ApplicationType,
  },
]

const earnings = [
  {
    title: 'Comissão da agência',
    description: '30% sobre ganhos elegíveis das creators vinculadas.',
  },
  {
    title: 'Crescimento por performance',
    description: 'Quanto mais creators ativas e consistentes sua agência acompanha, maior pode ser sua comissão.',
  },
  {
    title: 'Painel transparente',
    description: 'Acompanhe creators, metas, performance e comissão gerada no painel da agência.',
  },
  {
    title: 'Regras de elegibilidade',
    description: 'Bônus, testes, créditos promocionais, fraudes, chargebacks e valores não sacáveis não entram no cálculo da comissão.',
  },
]

const creatorEarnings = [
  {
    title: 'Ganhos por atividade',
    description: 'Monetize interações privadas e chamadas dentro da plataforma.',
  },
  {
    title: 'Horários flexíveis',
    description: 'Atue nos horários em que puder estar disponível.',
  },
  {
    title: 'Perfil verificado',
    description: 'Tenha uma presença mais confiável dentro da Bloom.',
  },
  {
    title: 'Suporte e crescimento',
    description: 'Receba orientação para melhorar consistência, atendimento e performance.',
  },
]

const requirements = [
  'Experiência com recrutamento, comunidade ou influenciadoras',
  'Comunicação profissional com equipe e creators',
  'Capacidade de acompanhar evolução e consistência da base',
  'Respeito às regras, políticas e padrões da plataforma',
  'Informações verdadeiras durante toda a candidatura',
]

const faqs = [
  {
    question: 'O cadastro é automático?',
    answer: 'Não. Toda candidatura passa por análise antes de receber acesso.',
  },
  {
    question: 'Preciso pagar para ser agência?',
    answer: 'Não nesta etapa. A candidatura ao programa de agências não tem custo.',
  },
  {
    question: 'Quando recebo acesso?',
    answer: 'Após aprovação da equipe Bloom, você recebe as instruções de primeiro acesso.',
  },
  {
    question: 'Posso cadastrar creators de outros países?',
    answer: 'Sim, sujeito às regras da plataforma e aos critérios de verificação aplicáveis.',
  },
  {
    question: 'Como recebo comissão?',
    answer: 'A comissão segue o modelo definido pela plataforma para creators vinculadas.',
  },
]

export default function AgencyPartnersPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [applicationType, setApplicationType] = useState<ApplicationType | ''>('')
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

    if (applicationType !== 'agency') {
      setError('Selecione Agência parceira para enviar uma candidatura de agência.')
      setLoading(false)
      return
    }

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
      <main className="min-h-screen bg-[#070707] flex items-center justify-center px-5 py-10">
        <section className="w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl p-7 text-center shadow-2xl shadow-black/30">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff4d7d]/15 text-[#ff4d7d]">
            ✓
          </div>
          <div className="text-[#ff4d7d] text-xs font-medium uppercase tracking-[0.24em]">Bloom Partners</div>
          <h1 className="text-white text-2xl font-medium mt-3">Candidatura recebida</h1>
          <p className="text-white/50 text-sm leading-relaxed mt-3">
            Obrigado pelo interesse. Nossa equipe vai revisar os dados e entrar em contato se a agência for aprovada para a próxima etapa.
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="mt-6 bg-[#ff4d7d] text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-[#ff6a92] transition-colors"
          >
            Enviar outra candidatura
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        <header className="min-h-[78vh] flex flex-col justify-center border-b border-white/10 pb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-[#ff4d7d]/25 bg-[#ff4d7d]/10 px-3 py-1 text-[#ff9ab6] text-xs font-medium uppercase tracking-[0.22em]">
              Bloom Partners
            </div>
            <h1 className="text-4xl sm:text-6xl font-medium mt-6 leading-tight">
              Faça parte da <span className="text-[#ff4d7d]">Bloom</span>
            </h1>
            <p className="text-white/55 text-base sm:text-lg leading-relaxed mt-5 max-w-2xl">
              A Bloom conecta creators verificadas, agências parceiras e usuários em uma experiência privada, segura e profissional. Escolha como quer participar da plataforma.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-8">
              <a
                href="#candidatura"
                className="inline-flex justify-center rounded-xl bg-[#ff4d7d] px-5 py-3 text-sm font-medium text-white hover:bg-[#ff6a92] transition-colors"
              >
                Quero me candidatar
              </a>
              <p className="text-white/35 text-xs leading-relaxed">
                Candidatura sujeita à análise da equipe Bloom.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-12">
            {[
              ['Painel', 'Performance semanal'],
              ['Metas', 'Acompanhamento claro'],
              ['Ranking', 'Visão competitiva'],
              ['Comissão', 'Ganhos por creators'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[#ff4d7d] text-xs font-medium uppercase tracking-wide">{label}</div>
                <div className="text-white/70 text-sm mt-2">{value}</div>
              </div>
            ))}
          </div>
        </header>

        <section className="py-16 border-b border-white/10">
          <SectionHeading
            eyebrow="Perfis"
            title="Duas formas de participar"
            description="A Bloom conecta creators verificadas, agências parceiras e usuários em uma experiência privada, segura e profissional."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {profiles.map(profile => (
              <article key={profile.title} className="rounded-2xl border border-white/10 bg-[#111] p-6">
                <h3 className="text-white text-xl font-medium">{profile.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed mt-4">{profile.description}</p>
                <a
                  href={profile.href}
                  onClick={() => setApplicationType(profile.applicationType)}
                  className="mt-6 inline-flex justify-center rounded-xl bg-[#ff4d7d] px-5 py-3 text-sm font-medium text-white hover:bg-[#ff6a92] transition-colors"
                >
                  {profile.action}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="py-16 border-b border-white/10">
          <SectionHeading
            eyebrow="Como funciona"
            title="Um processo simples, com análise humana"
            description="A parceria começa com uma candidatura e avança apenas quando existe aderência operacional e confiança para liberar o painel."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-white/10 bg-[#111] p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff4d7d] text-white text-sm font-medium">
                  {index + 1}
                </div>
                <h3 className="text-white text-base font-medium mt-5">{step.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed mt-3">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-16 border-b border-white/10">
          <SectionHeading
            eyebrow="Benefícios"
            title="Estrutura para operar com clareza"
            description="O programa foi pensado para agências que querem acompanhar creators com visão de performance, metas e retorno."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-8">
            {benefits.map(benefit => (
              <div key={benefit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[#ff4d7d] text-lg leading-none">•</div>
                <p className="text-white/70 text-sm mt-2">{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 border-b border-white/10">
          <div className="rounded-2xl border border-[#ff4d7d]/20 bg-[#130b0f] p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-8 items-start">
              <div>
                <div className="text-[#ff4d7d] text-xs font-medium uppercase tracking-[0.22em]">Modelo de ganhos</div>
                <h2 className="text-white text-2xl sm:text-3xl font-medium mt-3 leading-tight">Modelo de ganhos para agências</h2>
                <p className="text-white/55 text-sm leading-relaxed mt-4">
                  Agências parceiras recebem 30% sobre os ganhos sacáveis elegíveis das creators vinculadas, conforme as regras antifraude e de validação da plataforma.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {earnings.map(item => (
                  <article key={item.title} className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
                    <h3 className="text-white text-sm font-medium">{item.title}</h3>
                    <p className="text-white/45 text-sm leading-relaxed mt-3">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-white/10">
          <SectionHeading
            eyebrow="Creators"
            title="Ganhos para creators"
            description="Creators verificadas podem monetizar sua presença na Bloom por meio de interações privadas, chamadas e atividade consistente, sempre conforme as regras de elegibilidade da plataforma."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            {creatorEarnings.map(item => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-[#111] p-5">
                <h3 className="text-white text-sm font-medium">{item.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed mt-3">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-16 border-b border-white/10">
          <SectionHeading
            eyebrow="Requisitos"
            title="O que buscamos em uma agência parceira"
            description="A Bloom prioriza parceiros com operação responsável, comunicação clara e capacidade real de acompanhar creators."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
            {requirements.map(requirement => (
              <div key={requirement} className="flex gap-3 rounded-2xl border border-white/10 bg-[#111] p-4">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#ff4d7d] flex-none" />
                <p className="text-white/55 text-sm leading-relaxed">{requirement}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 border-b border-white/10">
          <SectionHeading
            eyebrow="Perguntas frequentes"
            title="Antes de enviar sua candidatura"
            description="Algumas respostas rápidas sobre aprovação, acesso e modelo de parceria."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {faqs.map(faq => (
              <article key={faq.question} className="rounded-2xl border border-white/10 bg-[#111] p-5">
                <h3 className="text-white text-sm font-medium">{faq.question}</h3>
                <p className="text-white/45 text-sm leading-relaxed mt-3">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="candidatura" className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[0.75fr_1.25fr] gap-8 items-start">
            <div className="lg:sticky lg:top-8">
              <SectionHeading
                eyebrow="Candidatura"
                title="Conte sobre sua operação"
                description="Preencha os dados com atenção. Informações verdadeiras ajudam nossa equipe a avaliar a parceria com mais rapidez."
              />
              <p className="text-white/30 text-xs leading-relaxed mt-5">
                O envio não cria acesso automático ao painel. Todas as candidaturas são revisadas antes da aprovação.
              </p>
            </div>

            <form onSubmit={submit} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 sm:p-6">
                <div className="md:col-span-2">
                  <span className="block text-white/35 text-xs uppercase tracking-wide mb-3">
                    Quero me candidatar como *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {profiles.map(profile => (
                      <label
                        key={profile.applicationType}
                        className={`block rounded-2xl border p-4 cursor-pointer transition-colors ${
                          applicationType === profile.applicationType
                            ? 'border-[#ff4d7d] bg-[#ff4d7d]/10'
                            : 'border-white/10 bg-[#0d0d0d] hover:border-white/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name="application_type"
                          value={profile.applicationType}
                          checked={applicationType === profile.applicationType}
                          onChange={() => setApplicationType(profile.applicationType)}
                          required
                          className="sr-only"
                        />
                        <span className="block text-white text-sm font-medium">{profile.title}</span>
                        <span className="block text-white/40 text-xs leading-relaxed mt-2">{profile.description}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {applicationType === 'creator' && (
                  <div className="md:col-span-2 rounded-2xl border border-[#ff4d7d]/20 bg-[#130b0f] p-5">
                    <h3 className="text-white text-lg font-medium">Fluxo de creator verificada</h3>
                    <p className="text-white/50 text-sm leading-relaxed mt-3">
                      O cadastro de creators continua pelo fluxo de onboarding e verificação.
                    </p>
                    <a
                      href="/criadora/onboarding"
                      className="mt-5 inline-flex justify-center rounded-xl bg-[#ff4d7d] px-5 py-3 text-sm font-medium text-white hover:bg-[#ff6a92] transition-colors"
                    >
                      Continuar como creator
                    </a>
                  </div>
                )}

                {applicationType === 'agency' && (
                  <>
                    <Field label="Nome da agência" required>
                      <input
                        value={form.agency_name}
                        onChange={event => updateField('agency_name', event.target.value)}
                        required
                        maxLength={140}
                        className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#ff4d7d]/50"
                      />
                    </Field>

                    <Field label="Responsável" required>
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

                    <Field label="País" required>
                      <input
                        value={form.country}
                        onChange={event => updateField('country', event.target.value)}
                        required
                        maxLength={80}
                        className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#ff4d7d]/50"
                      />
                    </Field>

                    <Field label="Creators esperadas" required>
                      <input
                        type="number"
                        min={1}
                        value={form.expected_creators_count}
                        onChange={event => updateField('expected_creators_count', event.target.value)}
                        required
                        className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#ff4d7d]/50"
                      />
                    </Field>

                    <Field label="Experiência com recrutamento" required wide>
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
                        placeholder="Instagram, site, portfólio ou perfis relevantes"
                        className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#ff4d7d]/50 resize-none"
                      />
                    </Field>

                    <Field label="Observações" wide>
                      <textarea
                        value={form.notes}
                        onChange={event => updateField('notes', event.target.value)}
                        maxLength={3000}
                        rows={4}
                        className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#ff4d7d]/50 resize-none"
                      />
                    </Field>
                  </>
                )}
              </div>

              {error && (
                <div className="mx-5 sm:mx-6 mb-5 bg-red-950/40 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {applicationType === 'agency' && (
                <div className="border-t border-white/10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-white/30 text-xs leading-relaxed">
                    Enviar candidatura não cria acesso automático ao painel.
                  </p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#ff4d7d] text-white rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-50 hover:bg-[#ff6a92] transition-colors"
                  >
                    {loading ? 'Enviando...' : 'Enviar candidatura'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div>
      <div className="text-[#ff4d7d] text-xs font-medium uppercase tracking-[0.22em]">{eyebrow}</div>
      <h2 className="text-white text-2xl sm:text-3xl font-medium mt-3 leading-tight">{title}</h2>
      <p className="text-white/45 text-sm leading-relaxed mt-3 max-w-2xl">{description}</p>
    </div>
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
