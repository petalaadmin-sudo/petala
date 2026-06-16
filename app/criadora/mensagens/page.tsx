import { CreatorAreaShell } from '@/components/criadora/CreatorAreaShell'
import { requireCreatorAreaPage } from '@/lib/auth/require-creator-area'
import { CreatorMessagesClient } from './CreatorMessagesClient'

export default async function CreatorMessagesPage() {
  const { creator } = await requireCreatorAreaPage()

  return (
    <CreatorAreaShell
      section="mensagens"
      title="Mensagens"
      subtitle="Central para pedidos de texto, conversas e solicitações pendentes. O aceite está em preparação e não ativa cobrança por aqui."
      creator={creator}
    >
      <CreatorMessagesClient creator={creator} />
    </CreatorAreaShell>
  )
}
