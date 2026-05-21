'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminSuportePage() {
  const supabase = createClient()
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [usuarioEncontrado, setUsuarioEncontrado] = useState<any>(null)
  const [buscando, setBuscando] = useState(false)
  const [ajuste, setAjuste] = useState({ amount: '', motivo: '' })
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    async function load() {
      const [recentUsersRes, recentTxRes] = await Promise.all([
        supabase.from('users').select('id, email, username, balance_petals, created_at, role').order('created_at', { ascending: false }).limit(10),
        supabase.from('transactions').select('id, user_id, type, petals_delta, amount_brl, status, created_at, users(email)').eq('status', 'completed').order('created_at', { ascending: false }).limit(10),
      ])

      setDados({ recentUsers: recentUsersRes.data, recentTx: recentTxRes.data })
      setLoading(false)
    }
    load()
  }, [])

  async function buscarUsuario() {
    if (!busca) return
    setBuscando(true)
    setUsuarioEncontrado(null)
    setMensagem('')

    const { data } = await supabase
      .from('users')
      .select('id, email, username, balance_petals, created_at, role, first_purchase_done, referred_by')
      .or(`email.eq.${busca},username.eq.${busca}`)
      .single()

    if (data) {
      // Busca transações do usuário
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', data.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setUsuarioEncontrado({ ...data, transactions: txs })
    } else {
      setMensagem('❌ Usuário não encontrado')
    }
    setBuscando(false)
  }

  async function ajustarSaldo() {
    if (!usuarioEncontrado || !ajuste.amount) return
    const novoSaldo = Math.max(0, (usuarioEncontrado.balance_petals || 0) + Number(ajuste.amount))
    
    await supabase.from('users').update({ balance_petals: novoSaldo }).eq('id', usuarioEncontrado.id)
    await supabase.from('transactions').insert({
      user_id: usuarioEncontrado.id,
      type: Number(ajuste.amount) > 0 ? 'bonus' : 'adjustment',
      petals_delta: Number(ajuste.amount),
      balance_after: novoSaldo,
      amount_brl: 0,
      status: 'completed',
      metadata: { reason: ajuste.motivo || 'suporte_admin' },
    })

    setUsuarioEncontrado((u: any) => ({ ...u, balance_petals: novoSaldo }))
    setMensagem(`✅ Saldo ajustado para ${novoSaldo} pétalas`)
    setAjuste({ amount: '', motivo: '' })
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-white/30 text-sm">Carregando...</div></div>

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Atendimento e Suporte</h1>

      {/* Buscar usuário */}
      <div className="bg-[#111] rounded-xl p-5 border border-white/5 mb-6">
        <h2 className="text-white text-sm font-medium mb-4">🔍 Buscar usuário</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Email ou username"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscarUsuario()}
            className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 outline-none focus:border-[#ff4d7d]/50"
          />
          <button
            onClick={buscarUsuario}
            disabled={buscando}
            className="bg-[#ff4d7d] text-white rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {buscando ? '...' : 'Buscar'}
          </button>
        </div>
        {mensagem && <div className="mt-3 text-sm text-white/60">{mensagem}</div>}
      </div>

      {/* Resultado da busca */}
      {usuarioEncontrado && (
        <div className="bg-[#111] rounded-xl p-5 border border-white/5 mb-6">
          <h2 className="text-white text-sm font-medium mb-4">👤 {usuarioEncontrado.email}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Saldo', value: `${usuarioEncontrado.balance_petals} 🌸`, color: 'text-[#ff4d7d]' },
              { label: 'Username', value: usuarioEncontrado.username || '—', color: 'text-white' },
              { label: 'Role', value: usuarioEncontrado.role, color: 'text-yellow-400' },
              { label: 'Cadastro', value: new Date(usuarioEncontrado.created_at).toLocaleDateString('pt-BR'), color: 'text-white/50' },
            ].map(s => (
              <div key={s.label} className="bg-[#0d0d0d] rounded-xl p-3 border border-white/5">
                <div className={`text-sm font-medium ${s.color}`}>{s.value}</div>
                <div className="text-white/20 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Ajuste de saldo */}
          <div className="border-t border-white/5 pt-4 mt-4">
            <h3 className="text-white/50 text-xs mb-3">Ajustar saldo</h3>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Pétalas (+/-)"
                value={ajuste.amount}
                onChange={e => setAjuste(a => ({ ...a, amount: e.target.value }))}
                className="w-36 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/20 outline-none"
              />
              <input
                type="text"
                placeholder="Motivo"
                value={ajuste.motivo}
                onChange={e => setAjuste(a => ({ ...a, motivo: e.target.value }))}
                className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/20 outline-none"
              />
              <button onClick={ajustarSaldo} className="bg-white/10 text-white rounded-xl px-4 py-2 text-sm hover:bg-white/15 transition-all">
                Aplicar
              </button>
            </div>
          </div>

          {/* Transações do usuário */}
          {usuarioEncontrado.transactions?.length > 0 && (
            <div className="border-t border-white/5 pt-4 mt-4">
              <h3 className="text-white/50 text-xs mb-3">Últimas transações</h3>
              <div className="flex flex-col gap-2">
                {usuarioEncontrado.transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between bg-[#0d0d0d] rounded-lg px-3 py-2">
                    <span className="text-white/40 text-xs">{tx.type}</span>
                    <span className="text-[#ff4d7d] text-xs">{tx.petals_delta > 0 ? '+' : ''}{tx.petals_delta} 🌸</span>
                    <span className="text-white/20 text-xs">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Usuários recentes */}
      <h2 className="text-white/50 text-sm mb-4">Usuários recentes</h2>
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-white/30 text-xs px-4 py-3">Email</th>
              <th className="text-left text-white/30 text-xs px-4 py-3">Saldo</th>
              <th className="text-left text-white/30 text-xs px-4 py-3">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {dados.recentUsers?.map((u: any) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 cursor-pointer transition-all"
                onClick={() => { setBusca(u.email); setUsuarioEncontrado(null) }}>
                <td className="px-4 py-3 text-white/70 text-xs">{u.email}</td>
                <td className="px-4 py-3 text-[#ff4d7d] text-xs">{u.balance_petals} 🌸</td>
                <td className="px-4 py-3 text-white/30 text-xs">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
