import { CreatorAreaShell } from '@/components/criadora/CreatorAreaShell'
import { requireCreatorAreaPage } from '@/lib/auth/require-creator-area'

export default async function CreatorCallsPage() {
  const { creator } = await requireCreatorAreaPage()

  return (
    <CreatorAreaShell
      section="chamadas"
      title="Chamadas"
      subtitle="Central futura para chamadas de video recebidas e convites enviados pela creator, sempre com aceite do usuario antes de cobranca."
      creator={creator}
    >
      <div className="flex flex-col gap-4">
        <section className="rounded-3xl border border-white/8 bg-[#111] p-5">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#ff8aaa]">Video privado</div>
          <h2 className="mt-3 text-xl font-semibold">Fluxo com aceite obrigatorio</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            Chamadas iniciadas pela creator serao implementadas em bloco proprio com notificacao, aceite do usuario, antifraude e billing idempotente. Nenhuma cobranca deve comecar antes do aceite.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl border border-white/8 bg-[#111] p-4">
            <h3 className="text-sm font-semibold text-white">Recebidas</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Solicitacoes de video recebidas pelo usuario aparecerao aqui quando o fluxo de chamada estiver conectado.
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#111] p-4">
            <h3 className="text-sm font-semibold text-white">Enviadas</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Convites enviados pela creator ficarao separados de conversas comuns para facilitar acompanhamento e expiracao.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-yellow-400/20 bg-yellow-400/8 p-4">
          <h3 className="text-sm font-semibold text-yellow-200">Regra futura aprovada</h3>
          <div className="mt-3 flex flex-col gap-2 text-xs leading-relaxed text-yellow-100/70">
            <p>Primeiro minuto promocional: 30 petalas.</p>
            <p>Depois: 120 petalas por minuto.</p>
            <p>O usuario sempre precisa aceitar antes de qualquer cobranca.</p>
          </div>
        </section>
      </div>
    </CreatorAreaShell>
  )
}
