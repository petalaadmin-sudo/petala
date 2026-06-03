import Link from 'next/link'

export default function SucessoPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">🌸</div>
      <p className="text-[#ff4d7d] text-xs font-medium uppercase tracking-[0.18em] mb-3">
        Pagamento em análise
      </p>
      <h1 className="text-white text-xl font-medium mb-2">Estamos verificando seu pagamento</h1>
      <p className="text-white/45 text-sm leading-relaxed max-w-xs mb-8">
        A confirmação pode levar alguns instantes. Confira seu saldo e histórico no Perfil.
      </p>
      <Link
        href="/perfil"
        className="bg-[#ff4d7d] text-white rounded-xl px-8 py-3 text-sm font-medium active:scale-95 transition-transform"
      >
        Ver saldo e histórico
      </Link>
    </div>
  )
}
