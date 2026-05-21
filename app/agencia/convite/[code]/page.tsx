import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import InviteCaptureClient from './InviteCaptureClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AgencyInvitePageProps = {
  params: {
    code?: string
  }
}

type AgencyInvite = {
  id: string
  name: string | null
  invite_code: string
  active: boolean | null
}

const INVITE_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/

export default async function AgencyInvitePage({ params }: AgencyInvitePageProps) {
  const code = params.code?.trim().toUpperCase() ?? ''
  const hasValidFormat = INVITE_CODE_PATTERN.test(code)
  let agency: AgencyInvite | null = null

  if (hasValidFormat) {
    const admin = createAdminClient() as any
    const { data, error } = await admin
      .from('agencies')
      .select('id, name, invite_code, active')
      .eq('invite_code', code)
      .eq('active', true)
      .maybeSingle()

    if (error) {
      console.error('[agencia/convite] agencies', error)
    } else {
      agency = data as AgencyInvite | null
    }
  }

  if (!agency) {
    return <InvalidInvite />
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111] p-6 sm:p-8 shadow-2xl shadow-black/30">
        <div className="text-[#ff4d7d] text-xs font-medium uppercase tracking-[0.22em]">
          Convite de agencia
        </div>

        <h1 className="mt-4 text-3xl sm:text-4xl font-medium leading-tight">
          {agency.name ?? 'Uma agencia parceira'} convidou voce para ser Creator verificada na Bloom
        </h1>

        <p className="mt-4 text-white/55 text-sm sm:text-base leading-relaxed">
          Voce recebeu um convite para entrar no fluxo de creator vinculada a uma agencia parceira. Para seguir, ainda e necessario criar seu perfil, concluir o onboarding e passar pela verificacao da plataforma.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
            <div className="text-white/30 text-[11px] uppercase tracking-wide">Agencia</div>
            <div className="mt-2 text-white text-sm font-medium">{agency.name ?? 'Agencia parceira'}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
            <div className="text-white/30 text-[11px] uppercase tracking-wide">Codigo do convite</div>
            <div className="mt-2 text-white text-sm font-mono font-medium tracking-wide">{code}</div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[#ff4d7d]/20 bg-[#130b0f] p-4">
          <p className="text-white/60 text-sm leading-relaxed">
            O convite sera guardado neste navegador para as proximas etapas. A vinculacao com a agencia so acontece depois que seu perfil for aprovado na verificacao.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <InviteCaptureClient code={code} />
          <Link
            href="/agencia/parceiros"
            className="w-full sm:w-auto rounded-xl border border-white/10 px-5 py-3 text-center text-sm font-medium text-white/60 hover:border-white/20 hover:text-white transition-colors"
          >
            Ver programa Bloom
          </Link>
        </div>
      </section>
    </main>
  )
}

function InvalidInvite() {
  return (
    <main className="min-h-screen bg-[#070707] text-white flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#111] p-6 sm:p-8 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-400/25 bg-red-500/10 text-red-300">
          !
        </div>

        <h1 className="mt-5 text-2xl sm:text-3xl font-medium">
          Convite invalido ou expirado
        </h1>

        <p className="mt-3 text-white/50 text-sm leading-relaxed">
          Nao encontramos uma agencia ativa para este codigo. O link pode ter sido digitado incorretamente, expirado ou deixado de estar disponivel.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/criadora/onboarding"
            className="rounded-xl bg-[#ff4d7d] px-5 py-3 text-sm font-medium text-white hover:bg-[#ff6a92] transition-colors"
          >
            Continuar como creator
          </Link>
          <Link
            href="/agencia/parceiros"
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-white/60 hover:border-white/20 hover:text-white transition-colors"
          >
            Ver programa Bloom
          </Link>
        </div>
      </section>
    </main>
  )
}
