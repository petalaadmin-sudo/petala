// components/ui/ReferralInput.tsx
// Usado na tela de cadastro para o usuário digitar o código de indicação
'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  onValidCode?: (code: string, referrerName: string) => void
  onClear?: () => void
  initialCode?: string  // pré-preenche se vier via URL (?ref=XXX-XXXXX)
}

type ValidationState = 'idle' | 'checking' | 'valid' | 'invalid'

export function ReferralInput({ onValidCode, onClear, initialCode }: Props) {
  const [code, setCode]           = useState(initialCode?.toUpperCase() ?? '')
  const [state, setState]         = useState<ValidationState>(initialCode ? 'checking' : 'idle')
  const [referrerName, setName]   = useState<string | null>(null)
  const debounceRef               = useRef<NodeJS.Timeout | null>(null)

  const validate = async (value: string) => {
    const clean = value.toUpperCase().trim()
    if (clean.length < 9) { setState('idle'); return }

    setState('checking')

    try {
      const res  = await fetch(`/api/indicacao/validar?code=${encodeURIComponent(clean)}`)
      const data = await res.json()

      if (data.valid) {
        setState('valid')
        setName(data.referrer_name)
        onValidCode?.(clean, data.referrer_name)
      } else {
        setState('invalid')
        setName(null)
        onClear?.()
      }
    } catch {
      setState('invalid')
    }
  }

  useEffect(() => {
    if (initialCode) validate(initialCode)
  }, [initialCode])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw   = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9)
    setCode(raw)
    setState('idle')
    setName(null)
    onClear?.()

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (raw.length === 9) {
      debounceRef.current = setTimeout(() => validate(raw), 400)
    }
  }

  const borderColor =
    state === 'valid'   ? 'border-green-500/50' :
    state === 'invalid' ? 'border-red-500/40' :
    'border-white/10'

  return (
    <div>
      <label className="text-white/40 text-xs uppercase tracking-wider block mb-2">
        Código de indicação <span className="text-white/20 normal-case">(opcional)</span>
      </label>

      <div className="relative">
        <input
          value={code}
          onChange={handleChange}
          placeholder="EX: YAS-X9K2F"
          maxLength={9}
          className={`w-full bg-[#161616] border ${borderColor} rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none tracking-widest uppercase transition-colors`}
        />

        {/* Indicador de estado */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {state === 'checking' && (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          )}
          {state === 'valid' && (
            <span className="text-green-400 text-sm">✓</span>
          )}
          {state === 'invalid' && (
            <span className="text-red-400 text-sm">✕</span>
          )}
        </div>
      </div>

      {/* Feedback */}
      {state === 'valid' && referrerName && (
        <div className="flex items-center gap-2 mt-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
          <span className="text-green-400 text-sm">🌸</span>
          <span className="text-green-400 text-xs">
            Indicação de <strong>{referrerName}</strong> — você ganhará 50 pétalas ao completar o cadastro!
          </span>
        </div>
      )}

      {state === 'invalid' && code.length === 9 && (
        <p className="text-red-400/70 text-xs mt-1.5 ml-1">Código não encontrado. Verifique e tente novamente.</p>
      )}
    </div>
  )
}
