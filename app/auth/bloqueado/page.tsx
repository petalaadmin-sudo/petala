// app/auth/bloqueado/page.tsx
// Exibida quando o usuário confirma ter menos de 18 anos.
// Sessão é encerrada pelo gate de idade antes de redirecionar aqui.

export default function BloqueadoPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">🚫</div>
      <h1 className="text-white text-xl font-medium mb-3">
        Acesso não permitido
      </h1>
      <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-8">
        Este aplicativo é destinado exclusivamente a maiores de 18 anos conforme a legislação brasileira.
      </p>
      <a
        href="/"
        className="bg-[#1e1e1e] text-white/50 border border-white/8 rounded-xl px-8 py-3 text-sm"
      >
        Voltar ao início
      </a>
    </main>
  )
}
