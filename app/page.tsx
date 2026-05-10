// app/page.tsx
import Link from 'next/link'

// Esta é uma Server Component — sem 'use client'
export default function SplashPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">

      {/* Círculos decorativos de fundo */}
      <div className="absolute top-[-60px] right-[-80px] w-72 h-72 rounded-full bg-[#ff4d7d] opacity-[0.06]" />
      <div className="absolute bottom-[-40px] left-[-60px] w-52 h-52 rounded-full bg-[#ff4d7d] opacity-[0.06]" />

      {/* Logo */}
      <div className="text-6xl mb-3 animate-bounce-slow">🌸</div>
      <h1 className="text-white text-3xl font-medium mb-1">
        pé<span className="text-[#ff4d7d]">tala</span>
      </h1>
      <p className="text-white/35 text-sm mb-10">conteúdo exclusivo de verdade</p>

      {/* Prova social */}
      <div className="flex gap-6 mb-10">
        <div className="text-center">
          <div className="text-[#ff4d7d] text-xl font-medium">12k+</div>
          <div className="text-white/35 text-xs mt-1">criadoras</div>
        </div>
        <div className="w-px bg-white/10 self-stretch" />
        <div className="text-center">
          <div className="text-[#ff4d7d] text-xl font-medium">247k</div>
          <div className="text-white/35 text-xs mt-1">online agora</div>
        </div>
        <div className="w-px bg-white/10 self-stretch" />
        <div className="text-center">
          <div className="text-[#ff4d7d] text-xl font-medium">4.9★</div>
          <div className="text-white/35 text-xs mt-1">avaliação</div>
        </div>
      </div>

      {/* CTAs */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        <Link
          href="/auth/login"
          className="w-full bg-[#ff4d7d] text-white rounded-xl py-4 text-sm font-medium text-center active:scale-95 transition-transform"
        >
          Entrar no Pétala
        </Link>
        <Link
          href="/auth/login"
          className="text-white/30 text-xs text-center"
        >
          já tenho conta · <span className="text-[#ff4d7d]/60">fazer login</span>
        </Link>
      </div>

    </main>
  )
}
