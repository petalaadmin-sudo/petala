import Link from 'next/link'
import type { ReactNode } from 'react'

type LegalPageLayoutProps = {
  title: string
  description?: string
  version?: string
  updatedAt?: string
  children: ReactNode
  showIndexLink?: boolean
}

export function LegalPageLayout({
  title,
  description,
  version,
  updatedAt,
  children,
  showIndexLink = true,
}: LegalPageLayoutProps) {
  const hasMetadata = Boolean(version || updatedAt)

  return (
    <main className="min-h-screen bg-[#08080a] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,#ff4d7d1a,transparent_34%),linear-gradient(180deg,#ffffff08,transparent_18%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 sm:px-8 sm:py-12">
        <header className="border-b border-white/10 pb-6">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-white transition-colors hover:text-[#ff8dad]"
            >
              Pétala/Bloom
            </Link>

            {showIndexLink && (
              <Link
                href="/termos"
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-[#ff4d7d]/40 hover:text-white"
              >
                Ver documentos legais
              </Link>
            )}
          </div>

          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-[#ff8dad]">
            Documentos legais
          </p>

          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            {title}
          </h1>

          {description && (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/58 sm:text-base sm:leading-7">
              {description}
            </p>
          )}

          {hasMetadata && (
            <dl className="mt-6 flex flex-wrap gap-3 text-xs text-white/50">
              {version && (
                <div className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5">
                  <dt className="sr-only">Versão</dt>
                  <dd>Versão {version}</dd>
                </div>
              )}

              {updatedAt && (
                <div className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5">
                  <dt className="sr-only">Atualização</dt>
                  <dd>Atualizado em {updatedAt}</dd>
                </div>
              )}
            </dl>
          )}
        </header>

        <article className="mt-8 max-w-none text-sm leading-7 text-white/66 [&_a:hover]:text-[#ffb1c8] [&_a]:text-[#ff8dad] [&_a]:no-underline [&_h2]:mt-10 [&_h2]:scroll-mt-20 [&_h2]:border-t [&_h2]:border-white/10 [&_h2]:pt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:tracking-tight [&_h2]:text-white [&_h3]:mt-7 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_li]:my-1.5 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-5 [&_p]:leading-7 [&_strong]:text-white [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </article>
      </div>
    </main>
  )
}
