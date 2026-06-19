// app/feed/layout.tsx
export default async function FeedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col max-w-md mx-auto relative">
      <main className="flex-1 pb-16">
        {children}
      </main>
    </div>
  )
}
