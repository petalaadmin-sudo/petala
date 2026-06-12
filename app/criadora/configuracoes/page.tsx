import Link from 'next/link'
import { CreatorAreaShell } from '@/components/criadora/CreatorAreaShell'
import { requireCreatorAreaPage } from '@/lib/auth/require-creator-area'

export default async function CreatorSettingsPage() {
  const { creator } = await requireCreatorAreaPage()

  return (
    <CreatorAreaShell
      section="configuracoes"
      title="Configurações"
      subtitle="Preferências de conta, segurança e operação da criadora, sem alterar dados financeiros por aqui."
      creator={creator}
    >
      <div className="flex flex-col gap-4">
        <section className="rounded-3xl border border-white/8 bg-[#111] p-5">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#ff8aaa]">Conta</div>
          <h2 className="mt-3 text-xl font-semibold">Central de preferências</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            Esta tela prepara a organização de segurança, notificações, disponibilidade e suporte. Nenhuma configuração financeira é alterada aqui.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-3">
          {[
            ['Segurança', 'Senha, sessão e acesso da conta serão agrupados aqui.'],
            ['Notificações', 'Preferências de alertas para mensagens, vídeo e disponibilidade.'],
            ['Disponibilidade', 'Janelas de atendimento e status operacional da criadora.'],
            ['Suporte', 'Canal para ajuda, moderação e orientações de plataforma.'],
          ].map(([label, body]) => (
            <div key={label} className="rounded-2xl border border-white/8 bg-[#111] p-4">
              <h3 className="text-sm font-semibold text-white">{label}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/40">{body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#0d0d0d] p-4">
          <h2 className="text-sm font-semibold">Verificação</h2>
          <p className="mt-2 text-xs leading-relaxed text-white/40">
            Status de aprovação e revisão de perfil continuam na tela de verificação.
          </p>
          <Link
            href="/criadora/verificacao"
            className="mt-4 block rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white/70"
          >
            Abrir verificação
          </Link>
        </section>
      </div>
    </CreatorAreaShell>
  )
}
