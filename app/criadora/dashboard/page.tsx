import { requireCreatorAreaPage } from '@/lib/auth/require-creator-area'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  await requireCreatorAreaPage()

  return <DashboardClient />
}
