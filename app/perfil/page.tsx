// app/perfil/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PixCheckout } from '@/components/ui/PixCheckout'
import { useRouter } from 'next/navigation'

interface UserData {
  email: string
  balance_petals: number
  vip_until: string | null
  created_at: string
}

interface Transaction {
  id: string
  type: string
  petals_delta: number
  amount_brl: number | null
  status: string
  created_at: string
  metadata: any
}

interface Package {
  id: string
  name: string
  petals: number
  bonus_petals: number
  price_brl: number
}

export default function PerfilPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [user, setUser]           = useState<UserData | null>(null)
  const [transactions, setTxs]    = useState<Transaction[]>([])
  const [packages, setPackages]   = useState<Package[]>([])
  const [tab, setTab]             = useState<'saldo' | 'historico' | 'conta'>('saldo')
  const [showCheckout, setShowCheckout] = useState(false)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth/login'); return }

      const [userRes, txRes, pkgRes] = await Promise.all([
        supabase.from('users').select('email, balance_petals, vip_until, created_at').eq('id', authUser.id).single(),
        supabase.from('transactions').select('id, type, petals_delta, amount_brl, status, created_at, metadata').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(20),
        supabase.rpc('get_petal_packages'),
      ])

      if (userRes.data)  setUser(userRes.data)
      if (txRes.data)    setTxs(txRes.data)
      if (pkgRes.data)   setPackages(pkgRes.data)
      setLoading(false)
    }
    load()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const txIcon: Record<string, string> = {
    purchase:      '💳',
    spend:         '📹',
    gift_sent:     '🎁',
    gift_received: '🎁',
    bonus:         '🎉',
    payout:        '💸',
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff4d7d]/30 border-t-[#ff4d7d] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">

      {/* Header */}
      <div className="px-4 pt-5 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-white text-lg font-medium">Meu perfil</h1>
          <p className="text-white/30 text-xs mt-0.5 truncate max-w-[200px]">{user?.email}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center text-xl">👤</div>
      </div>

      {/* Saldo em destaque */}
      <div className="mx-4 mb-4 bg-gradient-to-br from-[#1a0d14] to-[#0d0a14] border border-[#ff4d7d]/20 rounded-2xl p-5 text-center">
        <div className="text-white/40 text-xs mb-1">Seu saldo</div>
        <div className="text-4xl font-medium text-white mb-1">{user?.balance_petals ?? 0}</div>
        <div className="text-[#ff4d7d] text-sm mb-4">pétalas 🌸</div>
        <button
          onClick={() => setShowCheckout(true)}
          className="bg-[#ff4d7d] text-white rounded-xl px-8 py-2.5 text-sm font-medium active:scale-95 transition-transform"
        >
          Comprar pétalas
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mb-4">
        {(['saldo', 'historico', 'conta'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              tab === t ? 'bg-[#ff4d7d] text-white' : 'bg-[#161616] text-white/40'
            }`}
          >
            {t === 'saldo' ? '🌸 Pacotes' : t === 'historico' ? '📋 Histórico' : '⚙️ Conta'}
          </button>
        ))}
      </div>

      {/* ── Pacotes ── */}
      {tab === 'saldo' && (
        <div className="px-4 flex flex-col gap-3">
          {packages.map(pkg => {
            const total = pkg.petals + pkg.bonus_petals
            const isPopular = pkg.name === 'Buquê'
            return (
              <button
                key={pkg.id}
                onClick={() => setShowCheckout(true)}
                className={`relative flex items-center gap-4 rounded-xl p-4 border text-left active:scale-98 transition-transform ${
                  isPopular ? 'bg-[#1e0d14] border-[#ff4d7d]/40' : 'bg-[#111] border-white/8'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-2.5 left-4 bg-[#ff4d7d] rounded-md px-2 py-0.5 text-white text-[9px] font-medium">
                    mais popular
                  </div>
                )}
                <div className="text-2xl">
                  {pkg.name === 'Semente' ? '🌱' : pkg.name === 'Buquê' ? '💐' : pkg.name === 'Jardim' ? '🌺' : '✨'}
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{pkg.name}</div>
                  <div className="text-white/40 text-xs mt-0.5">
                    {pkg.petals} 🌸{pkg.bonus_petals > 0 ? ` + ${pkg.bonus_petals} bônus` : ''}
                  </div>
                </div>
                <div>
                  <div className="text-white font-medium text-right">R$ {pkg.price_brl.toFixed(2).replace('.', ',')}</div>
                  <div className="text-yellow-400 text-xs text-right">{total} 🌸 total</div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Histórico ── */}
      {tab === 'historico' && (
        <div className="px-4 flex flex-col gap-2">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-white/25 text-sm">Nenhuma transação ainda</div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 bg-[#111] rounded-xl px-4 py-3 border border-white/5">
                <span className="text-xl">{txIcon[tx.type] ?? '📦'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white/70 text-xs font-medium">
                    {tx.type === 'purchase' ? `Compra — ${tx.metadata?.package_name ?? ''}` :
                     tx.type === 'spend'    ? 'Chat de vídeo' :
                     tx.type === 'gift_sent'? 'Presente enviado' :
                     tx.type === 'bonus'    ? 'Bônus de boas-vindas' :
                     tx.type}
                  </div>
                  <div className="text-white/25 text-[10px]">
                    {new Date(tx.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-medium ${tx.petals_delta > 0 ? 'text-green-400' : 'text-[#ff4d7d]'}`}>
                    {tx.petals_delta > 0 ? '+' : ''}{tx.petals_delta} 🌸
                  </div>
                  {tx.amount_brl && (
                    <div className="text-white/25 text-[10px]">R$ {Number(tx.amount_brl).toFixed(2)}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Conta ── */}
      {tab === 'conta' && (
        <div className="px-4 flex flex-col gap-3">
          <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
            {[
              { label: 'E-mail', value: user?.email ?? '' },
              { label: 'Membro desde', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '' },
              { label: 'VIP até', value: user?.vip_until ? new Date(user.vip_until).toLocaleDateString('pt-BR') : 'Sem VIP ativo' },
            ].map(row => (
              <div key={row.label} className="flex justify-between px-4 py-3 border-b border-white/5 last:border-0">
                <span className="text-white/40 text-xs">{row.label}</span>
                <span className="text-white/70 text-xs">{row.value}</span>
              </div>
            ))}
          </div>

          <button className="w-full bg-[#111] text-white/50 rounded-xl py-3 text-sm border border-white/8 text-left px-4">
            🔒 Alterar senha
          </button>
          <button className="w-full bg-[#111] text-white/50 rounded-xl py-3 text-sm border border-white/8 text-left px-4">
            📞 Suporte
          </button>
          <button className="w-full bg-[#111] text-white/50 rounded-xl py-3 text-sm border border-white/8 text-left px-4">
            📄 Termos de uso
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-red-900/20 text-red-400 rounded-xl py-3 text-sm border border-red-500/20"
          >
            Sair da conta
          </button>
        </div>
      )}

      {/* Modal de compra */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center">
          <div className="bg-[#161616] rounded-t-2xl w-full max-w-sm border-t border-white/8">
            <div className="px-4 pt-4 pb-1 flex items-center justify-between">
              <h3 className="text-white font-medium text-sm">Comprar Pétalas 🌸</h3>
              <button onClick={() => setShowCheckout(false)} className="text-white/30 text-lg leading-none">✕</button>
            </div>
            <PixCheckout
              packages={packages}
              currentBalance={user?.balance_petals ?? 0}
              onSuccess={(newBalance) => {
                setUser(prev => prev ? { ...prev, balance_petals: newBalance } : prev)
                setShowCheckout(false)
              }}
              onClose={() => setShowCheckout(false)}
            />
          </div>
        </div>
      )}

    </div>
  )
}
