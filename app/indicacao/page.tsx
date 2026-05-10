// app/indicacao/page.tsx
'use client'

import { useIndicacao } from '@/lib/hooks/useIndicacao'

export default function IndicacaoPage() {
  const {
    status, loading, applying, error,
    codeInput, setCodeInput,
    applyCode, copyLink, copied, shareLink,
  } = useIndicacao()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff4d7d]/30 border-t-[#ff4d7d] rounded-full animate-spin" />
      </div>
    )
  }

  const referralLink = status?.referral_code
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://petala.app'}/?ref=${status.referral_code}`
    : null

  const isCreator = status?.referrals?.some(r => r.referred_type === 'creator')

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">

      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-white text-xl font-medium">Indicações</h1>
        <p className="text-white/35 text-sm mt-1">Convide amigos e ganhe pétalas</p>
      </div>

      {/* ── Seu link único ── */}
      <div className="mx-4 mt-4 bg-gradient-to-br from-[#1a0d14] to-[#0d0a14] border border-[#ff4d7d]/25 rounded-2xl p-5">
        <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Seu código único</div>
        <div className="text-white text-3xl font-medium tracking-[0.15em] mb-1">
          {status?.referral_code ?? '—'}
        </div>
        <div className="text-white/30 text-xs mb-4 truncate">{referralLink}</div>
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex-1 bg-[#ff4d7d] text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            {copied ? '✓ Copiado!' : '📋 Copiar link'}
          </button>
          <button
            onClick={shareLink}
            className="w-12 bg-white/10 text-white rounded-xl flex items-center justify-center text-lg border border-white/10"
          >
            📤
          </button>
        </div>
      </div>

      {/* ── Como funciona ── */}
      <div className="mx-4 mt-4 bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <span className="text-white text-xs font-medium">Como funciona</span>
        </div>
        <div className="divide-y divide-white/5">
          {[
            {
              icon: '🔗',
              title: 'Compartilhe seu link',
              sub: 'Envie para amigos ou cole em redes sociais',
            },
            {
              icon: '📱',
              title: 'Amigo cria a conta',
              sub: 'Ele usa seu código ou link no cadastro',
            },
            {
              icon: '✅',
              title: 'Ambos ganham 50 pétalas',
              sub: 'Após verificação e primeira compra do indicado',
            },
          ].map(item => (
            <div key={item.title} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-[#1a0d14] border border-[#ff4d7d]/15 flex items-center justify-center text-lg flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <div className="text-white text-xs font-medium">{item.title}</div>
                <div className="text-white/35 text-[10px] mt-0.5">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bônus para criadoras ── */}
      <div className="mx-4 mt-3 bg-[#1a1000] border border-yellow-400/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🎬</span>
          <span className="text-yellow-400 text-xs font-medium">Bônus exclusivo para criadoras</span>
        </div>
        <p className="text-white/45 text-xs leading-relaxed">
          Quando você indica outra <strong className="text-white/70">criadora</strong>, recebe <strong className="text-yellow-400">10% dos ganhos dela em chamadas de vídeo e lives</strong>, automaticamente. Não se aplica a presentes, fotos ou mensagens.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3 mx-4 mt-4">
        {[
          { label: 'Indicados',     value: status?.total_referred ?? 0,          color: 'text-white' },
          { label: 'Bônus pendentes', value: status?.pending_bonuses ?? 0,       color: 'text-yellow-400' },
          { label: 'Comissão total', value: `${status?.total_commission_petals ?? 0}🌸`, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] rounded-xl p-3 border border-white/5 text-center">
            <div className={`text-lg font-medium ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-[9px] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Aplicar código (se ainda não tem indicador) ── */}
      {!status?.has_referrer && (
        <div className="mx-4 mt-4 bg-[#111] rounded-xl border border-white/5 p-4">
          <div className="text-white text-xs font-medium mb-3">Você foi indicado por alguém?</div>
          <div className="flex gap-2">
            <input
              value={codeInput}
              onChange={e => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="CÓDIGO"
              maxLength={6}
              className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm text-center tracking-widest placeholder:text-white/20 outline-none focus:border-[#ff4d7d]/40 uppercase"
            />
            <button
              onClick={applyCode}
              disabled={codeInput.length < 4 || applying}
              className="bg-[#ff4d7d] text-white rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-40"
            >
              {applying ? '…' : 'Aplicar'}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          <p className="text-white/20 text-[10px] mt-2 leading-relaxed">
            Bônus liberado após verificação de conta + primeira compra mínima.
          </p>
        </div>
      )}

      {status?.has_referrer && !status.bonus_paid && (
        <div className="mx-4 mt-4 bg-[#0e1e14] border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">⏳</span>
            <span className="text-green-400 text-xs font-medium">Bônus pendente — 50 🌸 te esperam</span>
          </div>
          <p className="text-white/40 text-xs leading-relaxed">
            {!status.first_purchase_done
              ? 'Faça sua primeira compra de pétalas para liberar as 50 pétalas de boas-vindas.'
              : 'Verifique seu e-mail ou telefone para liberar as 50 pétalas de boas-vindas.'}
          </p>
        </div>
      )}

      {/* ── Histórico de indicados ── */}
      {(status?.referrals?.length ?? 0) > 0 && (
        <div className="mx-4 mt-4 bg-[#111] rounded-xl border border-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
            <span className="text-white text-xs font-medium">Seus indicados</span>
            <span className="text-white/30 text-[10px]">{status?.total_referred} total</span>
          </div>
          {status?.referrals.slice(0, 5).map((r, i) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
              <div className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center text-sm flex-shrink-0">
                {r.referred_type === 'creator' ? '👩' : '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white/60 text-xs">
                  {r.referred_type === 'creator' ? 'Criadora' : 'Usuário'} indicado
                </div>
                <div className="text-white/25 text-[10px]">
                  {new Date(r.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="text-right">
                {r.welcome_bonus_referrer_paid ? (
                  <div className="text-green-400 text-xs">+50 🌸 pago</div>
                ) : (
                  <div className="text-yellow-400/60 text-xs">pendente</div>
                )}
                {r.referred_type === 'creator' && r.total_commission_earned > 0 && (
                  <div className="text-green-400/70 text-[10px]">+{r.total_commission_earned}🌸 comissão</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Comissões recentes de vídeo ── */}
      {(status?.recent_commissions?.length ?? 0) > 0 && (
        <div className="mx-4 mt-3 bg-[#111] rounded-xl border border-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <span className="text-white text-xs font-medium">Comissões de vídeo recebidas</span>
          </div>
          {status?.recent_commissions.slice(0, 5).map((c, i) => (
            <div key={i} className="flex justify-between items-center px-4 py-2.5 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">🎬</span>
                <span className="text-white/50 text-xs">Chamada de vídeo</span>
              </div>
              <div className="text-right">
                <div className="text-green-400 text-xs font-medium">+{c.commission_petals} 🌸</div>
                <div className="text-white/20 text-[9px]">
                  {new Date(c.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Regras ── */}
      <div className="mx-4 mt-4 bg-[#111] rounded-xl border border-white/5 p-4">
        <div className="text-white/30 text-[10px] uppercase tracking-wider mb-3">Regras do programa</div>
        {[
          'Cada conta tem um código único e permanente',
          'Uma conta só pode ter um indicador',
          'Bônus de usuário: apenas após verificação + primeira compra',
          'Comissão de vídeo (criadora): 10% dos ganhos de vídeo/live da indicada',
          'Comissão não se aplica a presentes, fotos ou mensagens',
          'Indicadores não recebem comissão sobre comissões de outros',
          'Contas duplicadas ou fraudulentas serão bloqueadas',
        ].map((rule, i) => (
          <div key={i} className="flex gap-2 mb-2 last:mb-0">
            <span className="text-white/20 text-xs flex-shrink-0">{i + 1}.</span>
            <span className="text-white/35 text-xs leading-relaxed">{rule}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
