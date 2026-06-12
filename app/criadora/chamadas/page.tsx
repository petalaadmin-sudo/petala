import { CreatorAreaShell } from '@/components/criadora/CreatorAreaShell'
import { requireCreatorAreaPage } from '@/lib/auth/require-creator-area'

export default async function CreatorCallsPage() {
  const { creator } = await requireCreatorAreaPage()

  return (
    <CreatorAreaShell
      section="chamadas"
      title="Chamadas"
      subtitle="Central para chamadas de vídeo recebidas e convites, sempre com aceite do usuário antes de qualquer cobrança."
      creator={creator}
    >
      <div className="flex flex-col gap-4">
        <section className="rounded-3xl border border-white/8 bg-[#111] p-5">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#ff8aaa]">Vídeo privado</div>
          <h2 className="mt-3 text-xl font-semibold">Fluxo com aceite obrigatório</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            Chamadas iniciadas pela criadora serão liberadas em uma próxima etapa, com notificação, aceite do usuário e validações de segurança. Nenhuma cobrança deve começar antes do aceite.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl border border-white/8 bg-[#111] p-4">
            <h3 className="text-sm font-semibold text-white">Recebidas</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Solicitações de vídeo recebidas de usuários aparecerão aqui quando o fluxo de chamada estiver conectado.
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#111] p-4">
            <h3 className="text-sm font-semibold text-white">Enviadas</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Convites enviados pela criadora ficarão separados de conversas comuns para facilitar acompanhamento e expiração.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-yellow-400/20 bg-yellow-400/8 p-4">
          <h3 className="text-sm font-semibold text-yellow-200">Regra futura aprovada</h3>
          <div className="mt-3 flex flex-col gap-2 text-xs leading-relaxed text-yellow-100/70">
            <p>Primeiro minuto promocional: 30 pétalas.</p>
            <p>Depois: 120 pétalas por minuto.</p>
            <p>O usuário sempre precisa aceitar antes de qualquer cobrança.</p>
          </div>
        </section>
      </div>
    </CreatorAreaShell>
  )
}
