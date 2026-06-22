// app/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthUrlErrorRedirect } from './AuthUrlErrorRedirect'

type SplashPageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

const productHighlights = [
  {
    title: 'Criadoras verificadas',
    description: 'Perfis selecionados para uma experiência privada, segura e premium.',
  },
  {
    title: 'Pétalas e benefícios',
    description: 'Créditos internos para presentes, acesso premium e recursos exclusivos.',
  },
  {
    title: 'Ranking e favoritos',
    description: 'Acompanhe suas criadoras favoritas e descubra quem está em destaque.',
  },
]

const valueSignals = ['Feed visual', 'Presentes', 'Status', 'Favoritos']

function getSearchParam(searchParams: SplashPageProps['searchParams'], key: string) {
  const value = searchParams?.[key]

  return Array.isArray(value) ? value[0] : value
}

function isExpiredAuthLinkError(error?: string, errorCode?: string, errorDescription?: string) {
  const combined = `${error ?? ''} ${errorCode ?? ''} ${errorDescription ?? ''}`.toLowerCase()

  return (
    errorCode === 'otp_expired' ||
    combined.includes('otp_expired') ||
    combined.includes('email link is invalid') ||
    combined.includes('expired') ||
    combined.includes('invalid')
  )
}

function getAuthErrorRedirect(searchParams: SplashPageProps['searchParams']) {
  const error = getSearchParam(searchParams, 'error')
  const errorCode = getSearchParam(searchParams, 'error_code')
  const errorDescription = getSearchParam(searchParams, 'error_description')

  if (!error && !errorCode && !errorDescription) return null

  if (isExpiredAuthLinkError(error, errorCode, errorDescription)) {
    return '/auth/login?error=auth_link_expired'
  }

  return '/auth/login?error=session_error'
}

// Esta é uma Server Component, sem 'use client'.
export default function SplashPage({ searchParams }: SplashPageProps) {
  const authErrorRedirect = getAuthErrorRedirect(searchParams)

  if (authErrorRedirect) {
    redirect(authErrorRedirect)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080608] px-5 py-8 text-white">
      <AuthUrlErrorRedirect />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-center">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ff8aaa]">
              Pétala/Bloom
            </p>
            <p className="mt-1 text-xs text-white/40">pré-lançamento fechado</p>
          </div>
          <Link
            href="/auth/login"
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-white/70 transition hover:border-[#ff4d7d]/50 hover:text-white"
          >
            Fazer login
          </Link>
        </header>

        <section className="grid gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#ff4d7d]/25 bg-[#ff4d7d]/10 px-3 py-1 text-xs font-medium text-[#ffc1d0]">
              plataforma premium para experiências privadas
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Entre no universo privado das criadoras verificadas.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/62">
              Descubra criadoras, envie presentes e desbloqueie experiências com pétalas em um ambiente discreto, visual e feito para quem busca exclusividade.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/cadastro"
                className="rounded-2xl bg-[#ff4d7d] px-6 py-4 text-center text-sm font-semibold text-white shadow-[0_18px_45px_rgba(255,77,125,0.22)] transition active:scale-[0.98]"
              >
                Entrar no pré-lançamento
              </Link>
              <Link
                href="/feed"
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-center text-sm font-semibold text-white/82 transition hover:border-white/20 hover:bg-white/[0.06] active:scale-[0.98]"
              >
                Explorar criadoras
              </Link>
            </div>

            <p className="mt-4 text-xs leading-5 text-white/38">
              Pétalas são créditos internos de uso fechado dentro da plataforma. Recursos premium são liberados conforme disponibilidade e regras da conta.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
            <div className="rounded-[1.5rem] border border-white/8 bg-[#120c10] p-4">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Bloom privado</p>
                  <p className="text-xs text-white/42">feed, ranking e benefícios</p>
                </div>
                <div className="rounded-full border border-[#ff4d7d]/30 bg-[#ff4d7d]/12 px-3 py-1 text-xs font-medium text-[#ff9bb5]">
                  verificado
                </div>
              </div>

              <div className="grid gap-3">
                {productHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/8 bg-black/24 p-4"
                  >
                    <h2 className="text-sm font-semibold text-white">{item.title}</h2>
                    <p className="mt-1 text-xs leading-5 text-white/48">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                {valueSignals.map((signal) => (
                  <div
                    key={signal}
                    className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2 text-center text-xs font-medium text-white/62"
                  >
                    {signal}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
