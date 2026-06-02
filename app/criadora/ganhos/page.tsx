import { CreatorAreaShell } from '@/components/criadora/CreatorAreaShell'
import { requireCreatorAreaPage } from '@/lib/auth/require-creator-area'

export default async function CreatorEarningsPage() {
  const { creator } = await requireCreatorAreaPage()

  return (
    <CreatorAreaShell
      section="ganhos"
      title="Ganhos"
      subtitle="Painel reservado para ganhos reais quando o ledger financeiro elegivel estiver conectado."
      creator={creator}
    >
      <div className="flex flex-col gap-4">
        <section className="rounded-3xl border border-white/8 bg-[#111] p-5">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/30">Saldo sacavel</div>
          <h2 className="mt-3 text-2xl font-semibold text-yellow-300">Em validacao</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            O saldo sacavel sera exibido apenas quando esta tela estiver conectada ao ledger financeiro de ganhos elegiveis.
          </p>
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#111] p-4">
          <h2 className="text-sm font-semibold">Estados financeiros planejados</h2>
          <div className="mt-4 flex flex-col gap-3">
            {[
              ['Pendente', 'Ganhos aguardando janela de validacao operacional.'],
              ['Disponivel', 'Valor liberado pelo ledger e elegivel para saque.'],
              ['Bloqueado', 'Valores retidos por KYC, fraude, chargeback ou auditoria.'],
              ['Pago', 'Historico de pagamentos processados pela plataforma.'],
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
            Pagamentos serao processados semanalmente as segundas-feiras, as 15:00 no horario oficial da plataforma (America/Sao_Paulo). Para creators fora do Brasil, o horario local podera variar conforme o pais.
          </p>
        </section>

        <button
          disabled
          className="w-full rounded-2xl bg-[#ff4d7d] py-4 text-sm font-semibold text-white opacity-40"
        >
          Solicitar saque indisponivel
        </button>
      </div>
    </CreatorAreaShell>
  )
}
