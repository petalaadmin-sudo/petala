import { CreatorAreaShell } from '@/components/criadora/CreatorAreaShell'
import { requireCreatorAreaPage } from '@/lib/auth/require-creator-area'

export default async function CreatorFeedPage() {
  const { creator } = await requireCreatorAreaPage()

  return (
    <CreatorAreaShell
      section="feed"
      title="Feed de oportunidades"
      subtitle="Um espaco para acompanhar usuarios relevantes e oportunidades futuras, sem convites automaticos nesta etapa."
      creator={creator}
    >
      <div className="flex flex-col gap-4">
        <section className="rounded-3xl border border-white/8 bg-[#111] p-5">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#ff8aaa]">Em preparacao</div>
          <h2 className="mt-3 text-xl font-semibold">Usuarios interessados</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            Esta area sera usada para destacar usuarios com interacoes recentes, favoritos e sinais de interesse. Nada aqui inicia conversa, chamada ou cobranca automaticamente.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-3">
          {[
            {
              title: 'Sinais de interesse',
              body: 'Favoritos, visitas ao perfil e historico recente poderao aparecer aqui quando a central estiver conectada.',
            },
            {
              title: 'Convites com consentimento',
              body: 'Convites iniciados pela creator serao tratados em bloco futuro com aceite do usuario antes de qualquer cobranca.',
            },
            {
              title: 'Operacao responsavel',
              body: 'A plataforma nao deve incentivar spam. O feed sera focado em oportunidades reais e auditaveis.',
            },
          ].map(item => (
            <div key={item.title} className="rounded-2xl border border-white/8 bg-[#111] p-4">
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/40">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#0d0d0d] p-4">
          <h2 className="text-sm font-semibold">Seu perfil como origem</h2>
          <p className="mt-2 text-xs leading-relaxed text-white/40">
            {creator.name || 'Seu perfil'} continuara sendo o ponto principal para usuarios abrirem chat, video ou visualizarem conteudo publico.
          </p>
        </section>
      </div>
    </CreatorAreaShell>
  )
}
