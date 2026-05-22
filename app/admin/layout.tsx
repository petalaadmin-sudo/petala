import { AdminMenu } from './AdminMenu'
import { requireAdminPage } from '@/lib/auth/require-admin-page'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage()

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <AdminMenu />
      <main className="flex-1 ml-56 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
