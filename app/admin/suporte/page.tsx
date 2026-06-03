'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FINANCIAL_ACTION_BLOCKED_MESSAGE =
  'Ajustes manuais de pétalas estão temporariamente bloqueados. Um fluxo auditável com lote, ledger, motivo obrigatório e idempotência será implementado em bloco financeiro próprio.'

export default function AdminSuportePage() {
  const supabase = createClient()
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [usuarioEncontrado, setUsuarioEncontrado] = useState<any>(null)
  const [buscando, setBuscando] = useState(false)
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
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', data.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setUsuarioEncontrado({ ...data, transactions: txs })
    } else {
      setMensagem('Usuario nao encontrado')
    }
    setBuscando(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-white/30 text-sm">Carregando...</div></div>

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Atendimento e Suporte</h1>

      <div className="bg-[#111] rounded-xl p-5 border border-white/5 mb-6">
        <h2 className="text-white text-sm font-medium mb-4">Buscar usuario</h2>
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

      {usuarioEncontrado && (
        <div className="bg-[#111] rounded-xl p-5 border border-white/5 mb-6">
          <h2 className="text-white text-sm font-medium mb-4">{usuarioEncontrado.email}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Saldo', value: `${usuarioEncontrado.balance_petals} petalas`, color: 'text-[#ff4d7d]' },
              { label: 'Username', value: usuarioEncontrado.username || '-', color: 'text-white' },
              { label: 'Role', value: usuarioEncontrado.role, color: 'text-yellow-400' },
              { label: 'Cadastro', value: new Date(usuarioEncontrado.created_at).toLocaleDateString('pt-BR'), color: 'text-white/50' },
            ].map(s => (
              <div key={s.label} className="bg-[#0d0d0d] rounded-xl p-3 border border-white/5">
                <div className={`text-sm font-medium ${s.color}`}>{s.value}</div>
                <div className="text-white/20 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-4 mt-4">
            <h3 className="text-white/50 text-xs mb-3">Ajustar saldo</h3>
            <div className="mb-4 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-yellow-100 text-xs leading-relaxed">
              {FINANCIAL_ACTION_BLOCKED_MESSAGE}
            </div>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Petalas (+/-)"
                disabled
                className="w-36 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/20 outline-none disabled:cursor-not-allowed disabled:opacity-45"
              />
              <input
                type="text"
                placeholder="Motivo"
                disabled
                className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/20 outline-none disabled:cursor-not-allowed disabled:opacity-45"
              />
              <button disabled className="bg-white/10 text-white rounded-xl px-4 py-2 text-sm opacity-40 cursor-not-allowed">
                Bloqueado
              </button>
            </div>
          </div>

          {usuarioEncontrado.transactions?.length > 0 && (
            <div className="border-t border-white/5 pt-4 mt-4">
              <h3 className="text-white/50 text-xs mb-3">Ultimas transacoes</h3>
              <div className="flex flex-col gap-2">
                {usuarioEncontrado.transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between bg-[#0d0d0d] rounded-lg px-3 py-2">
                    <span className="text-white/40 text-xs">{tx.type}</span>
                    <span className="text-[#ff4d7d] text-xs">{tx.petals_delta > 0 ? '+' : ''}{tx.petals_delta} petalas</span>
                    <span className="text-white/20 text-xs">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <h2 className="text-white/50 text-sm mb-4">Usuarios recentes</h2>
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
              <tr
                key={u.id}
                className="border-b border-white/5 hover:bg-white/2 cursor-pointer transition-all"
                onClick={() => { setBusca(u.email); setUsuarioEncontrado(null) }}
              >
                <td className="px-4 py-3 text-white/70 text-xs">{u.email}</td>
                <td className="px-4 py-3 text-[#ff4d7d] text-xs">{u.balance_petals} petalas</td>
                <td className="px-4 py-3 text-white/30 text-xs">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
