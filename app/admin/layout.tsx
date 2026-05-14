import { AdminMenu } from './AdminMenu'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <AdminMenu />
      <main className="flex-1 ml-56 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}