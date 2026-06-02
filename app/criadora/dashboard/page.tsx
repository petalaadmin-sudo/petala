import { requireCreatorAreaPage } from '@/lib/auth/require-creator-area'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const { creator } = await requireCreatorAreaPage()

  return <DashboardClient initialCreator={creator} />
}
