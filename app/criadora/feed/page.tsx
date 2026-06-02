import { CreatorAreaShell } from '@/components/criadora/CreatorAreaShell'
import { requireCreatorAreaPage } from '@/lib/auth/require-creator-area'
import { CreatorFeedClient } from './CreatorFeedClient'

export default async function CreatorFeedPage() {
  const { creator } = await requireCreatorAreaPage()

  return (
    <CreatorAreaShell
      section="feed"
      title="Feed de oportunidades"
      subtitle="Usuarios com sinais de interesse e oportunidades futuras."
      creator={creator}
    >
      <CreatorFeedClient creatorName={creator.name} />
    </CreatorAreaShell>
  )
}
