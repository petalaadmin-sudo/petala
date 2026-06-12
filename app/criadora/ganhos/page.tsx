import { CreatorAreaShell } from '@/components/criadora/CreatorAreaShell'
import { requireCreatorAreaPage } from '@/lib/auth/require-creator-area'

export default async function CreatorEarningsPage() {
  const { creator } = await requireCreatorAreaPage()

  return (
    <CreatorAreaShell
      section="ganhos"
      title="Ganhos"
      subtitle="Painel reservado para ganhos reais quando a validação financeira estiver conectada."
      creator={creator}
    >
      <div className="flex flex-col gap-4">
        <section className="rounded-3xl border border-white/8 bg-[#111] p-5">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/30">Ganhos elegíveis</div>
          <h2 className="mt-3 text-2xl font-semibold text-yellow-300">Em validação</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            Valores disponíveis para pagamento só serão exibidos quando esta tela estiver conectada à validação financeira de ganhos elegíveis.
          </p>
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#111] p-4">
          <h2 className="text-sm font-semibold">Estados financeiros em preparação</h2>
          <div className="mt-4 flex flex-col gap-3">
            {[
              ['Pendente', 'Ganhos aguardando janela de validação operacional.'],
              ['Disponível', 'Valor liberado pela validação financeira e elegível para pagamento.'],
              ['Bloqueado', 'Valores retidos por KYC, fraude, chargeback ou auditoria.'],
              ['Pago', 'Histórico de pagamentos processados pela plataforma.'],
            ].map(([label, body]) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-[#0d0d0d] p-3">
                <div className="text-xs font-medium text-white">{label}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-white/35">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-green-500/20 bg-[#0d1a10] p-4">
          <h2 className="text-sm font-semibold text-green-300">Agenda operacional</h2>
          <p className="mt-2 text-xs leading-relaxed text-green-300/75">
            A agenda de pagamentos será exibida quando o fluxo de pagamento estiver validado. Horários e disponibilidade podem variar conforme regras operacionais e validação financeira.
          </p>
        </section>

        <button
          disabled
          className="w-full rounded-2xl bg-[#ff4d7d] py-4 text-sm font-semibold text-white opacity-40"
        >
          Solicitar pagamento indisponível
        </button>
      </div>
    </CreatorAreaShell>
  )
}
