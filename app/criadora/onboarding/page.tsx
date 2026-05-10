// app/criadora/onboarding/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Step = 'bio' | 'foto' | 'precos' | 'publicar'
const STEPS: Step[] = ['bio', 'foto', 'precos', 'publicar']

export default function CreatorOnboardingPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [step, setStep]     = useState<Step>('bio')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // Dados coletados nas etapas
  const [name, setName]         = useState('')
  const [bio, setBio]           = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [priceText, setPriceText]   = useState(5)
  const [priceVideo, setPriceVideo] = useState(20)
  const [pixKey, setPixKey]         = useState('')

  const stepIndex = STEPS.indexOf(step)
  const progress  = ((stepIndex + 1) / STEPS.length) * 100

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handlePublish = async () => {
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // 1. Cria o registro de criadora
      const { data: creator, error: createErr } = await supabase
        .from('creators')
        .insert({
          user_id:            user.id,
          name:               name.trim(),
          bio:                bio.trim() || null,
          price_text_petals:  priceText,
          price_video_petals: priceVideo,
          pix_key:            pixKey.trim() || null,
          active:             false, // só ativa após verificação
        })
        .select()
        .single()

      if (createErr) throw new Error(createErr.message)

      // 2. Atualiza role do usuário
      await supabase
        .from('users')
        .update({ role: 'creator' })
        .eq('id', user.id)

      // 3. Upload da foto de perfil se selecionada
      if (photoFile && creator) {
        const urlRes = await fetch('/api/fotos/upload-url', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ content_type: photoFile.type, file_size: photoFile.size, is_free: true, price_petals: 0 }),
        })
        const { upload_url, photo_key } = await urlRes.json()

        await fetch(upload_url, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: photoFile })

        // Usa a foto como foto de perfil
        await supabase
          .from('creators')
          .update({ photo_url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${photo_key}` })
          .eq('id', creator.id)
      }

      router.push('/criadora/verificacao')
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

      {/* Header com progresso */}
      <div className="px-5 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white text-sm font-medium">Criar perfil de criadora</div>
          <div className="text-white/30 text-xs">{stepIndex + 1} de {STEPS.length}</div>
        </div>
        <div className="h-1 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full bg-[#ff4d7d] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Conteúdo da etapa */}
      <div className="flex-1 px-5 py-2 overflow-y-auto">

        {/* ── Bio ── */}
        {step === 'bio' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-white text-xl font-medium mb-1">Como você quer ser chamada?</h2>
              <p className="text-white/35 text-sm">Esse nome aparece para todos os usuários</p>
            </div>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider block mb-2">Nome de perfil</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Yasmin, Luna, Mel..."
                maxLength={30}
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#ff4d7d]/40"
              />
            </div>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider block mb-2">Bio (opcional)</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Fale um pouco sobre você, o que você oferece, seus horários..."
                maxLength={150}
                rows={4}
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#ff4d7d]/40 resize-none"
              />
              <div className="text-right text-white/20 text-xs mt-1">{bio.length}/150</div>
            </div>
          </div>
        )}

        {/* ── Foto ── */}
        {step === 'foto' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-white text-xl font-medium mb-1">Sua foto de perfil</h2>
              <p className="text-white/35 text-sm">Criadoras com foto recebem 3× mais chats</p>
            </div>

            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="" className="w-full aspect-square object-cover rounded-2xl" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm">Trocar foto</span>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-white/15 rounded-2xl aspect-square flex flex-col items-center justify-center gap-3 bg-[#0d0d0d]">
                  <div className="text-4xl">📸</div>
                  <div className="text-white/40 text-sm">Toque para escolher foto</div>
                  <div className="text-white/20 text-xs">JPEG, PNG · recomendado 800×800px</div>
                </div>
              )}
            </label>

            {/* Regras */}
            <div className="bg-[#161616] rounded-xl p-4 border border-white/5">
              <div className="text-white/40 text-xs mb-3 uppercase tracking-wider">Requisitos</div>
              {[
                'Rosto visível e bem iluminado',
                'Sem filtros excessivos',
                'Somente você na foto',
                'Mínimo 400×400px',
              ].map(r => (
                <div key={r} className="flex items-center gap-2 mb-2 last:mb-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff4d7d] flex-shrink-0" />
                  <span className="text-white/50 text-xs">{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Preços ── */}
        {step === 'precos' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-white text-xl font-medium mb-1">Defina seus preços</h2>
              <p className="text-white/35 text-sm">Você pode ajustar a qualquer momento</p>
            </div>

            {/* Seletor de preço */}
            {[
              { label: 'Chat de texto', sub: 'por minuto', value: priceText, set: setPriceText, options: [3, 5, 8, 10, 15] },
              { label: 'Chat de vídeo', sub: 'por minuto', value: priceVideo, set: setPriceVideo, options: [10, 15, 20, 30, 50] },
            ].map(item => (
              <div key={item.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white text-sm font-medium">{item.label}</div>
                    <div className="text-white/30 text-xs">{item.sub}</div>
                  </div>
                  <div className="text-yellow-400 text-lg font-medium">{item.value} 🌸</div>
                </div>
                <div className="flex gap-2">
                  {item.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => item.set(opt)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                        item.value === opt
                          ? 'bg-[#ff4d7d] text-white'
                          : 'bg-[#1a1a1a] text-white/40 border border-white/8'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Estimativa de ganho */}
            <div className="bg-[#0e1e14] border border-green-500/20 rounded-xl p-4">
              <div className="text-green-400 text-xs font-medium mb-2">Estimativa de ganho (2h/dia)</div>
              <div className="text-white text-lg font-medium">
                R$ {(priceVideo * 120 * 0.7 * 0.035).toFixed(0)}/mês
              </div>
              <div className="text-white/30 text-xs mt-1">baseado em chats de vídeo · você recebe 70%</div>
            </div>

            {/* Pix para saque */}
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider block mb-2">Chave Pix para recebimento</label>
              <input
                value={pixKey}
                onChange={e => setPixKey(e.target.value)}
                placeholder="seu@email.com, CPF ou telefone"
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#ff4d7d]/40"
              />
            </div>
          </div>
        )}

        {/* ── Publicar ── */}
        {step === 'publicar' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-white text-xl font-medium mb-1">Quase lá! 🎉</h2>
              <p className="text-white/35 text-sm">Revise seu perfil antes de enviar para aprovação</p>
            </div>

            {/* Resumo */}
            <div className="bg-[#161616] rounded-2xl border border-white/8 overflow-hidden">
              {photoPreview && (
                <img src={photoPreview} alt="" className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="text-white font-medium text-lg mb-1">{name || 'Sem nome'}</div>
                <div className="text-white/40 text-sm mb-3">{bio || '—'}</div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-[#0d0d0d] rounded-lg p-2 text-center">
                    <div className="text-yellow-400 text-sm font-medium">{priceText} 🌸</div>
                    <div className="text-white/25 text-[10px]">texto/min</div>
                  </div>
                  <div className="flex-1 bg-[#0d0d0d] rounded-lg p-2 text-center">
                    <div className="text-yellow-400 text-sm font-medium">{priceVideo} 🌸</div>
                    <div className="text-white/25 text-[10px]">vídeo/min</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Próximos passos */}
            <div className="bg-[#111] rounded-xl p-4 border border-white/5">
              <div className="text-white text-xs font-medium mb-3">O que acontece depois:</div>
              {[
                { icon: '📋', text: 'Você envia seus documentos para verificação' },
                { icon: '⏱',  text: 'Nossa equipe revisa em até 24 horas' },
                { icon: '✅', text: 'Perfil ativo — você começa a receber chats' },
              ].map((s, i) => (
                <div key={i} className="flex gap-3 mb-2 last:mb-0">
                  <span className="text-sm flex-shrink-0">{s.icon}</span>
                  <span className="text-white/45 text-xs leading-relaxed">{s.text}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/25 rounded-xl p-3 text-red-300 text-xs">{error}</div>
            )}
          </div>
        )}

      </div>

      {/* Botão de ação */}
      <div className="px-5 py-5 flex-shrink-0 border-t border-white/5">
        <button
          onClick={() => {
            if (step === 'publicar') { handlePublish(); return }
            const nextIdx = stepIndex + 1
            if (nextIdx < STEPS.length) setStep(STEPS[nextIdx])
          }}
          disabled={
            saving ||
            (step === 'bio' && !name.trim()) ||
            (step === 'publicar' && !name.trim())
          }
          className="w-full bg-[#ff4d7d] text-white rounded-xl py-4 text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Criando perfil…</>
          ) : step === 'publicar' ? 'Enviar para aprovação' : 'Continuar'}
        </button>

        {stepIndex > 0 && !saving && (
          <button
            onClick={() => setStep(STEPS[stepIndex - 1])}
            className="w-full text-white/25 text-xs py-3 mt-1"
          >
            ← Voltar
          </button>
        )}
      </div>
    </div>
  )
}
