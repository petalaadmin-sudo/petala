// app/criadora/onboarding/page.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Step = 'bio' | 'foto' | 'precos' | 'publicar'
const STEPS: Step[] = ['bio', 'foto', 'precos', 'publicar']
type AgencyInviteStatus = 'onboarding_started' | 'pending_verification'
type AuthStatus = 'checking' | 'authenticated' | 'anonymous'
type AuthMode = 'signup' | 'login'
type AuthAction = 'signup' | 'login' | 'email'

const PENDING_AGENCY_INVITE_CODE_KEY = 'pending_agency_invite_code'
const AGENCY_INVITE_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/
const FIXED_TEXT_FIRST_MINUTE_PETALS = 10
const FIXED_TEXT_PRICE_PETALS = 50
const FIXED_VIDEO_PRICE_PETALS = 120
const CPF_DIGIT_LIMIT = 11

const onlyDigits = (value: string) => value.replace(/\D/g, '')

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, CPF_DIGIT_LIMIT)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return null

  const cookie = document.cookie
    .split(';')
    .map(item => item.trim())
    .find(item => item.startsWith(`${name}=`))

  if (!cookie) return null

  try {
    return decodeURIComponent(cookie.slice(name.length + 1))
  } catch {
    return cookie.slice(name.length + 1)
  }
}

function clearPendingAgencyInviteCode() {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(PENDING_AGENCY_INVITE_CODE_KEY)
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }

  document.cookie = `${PENDING_AGENCY_INVITE_CODE_KEY}=; path=/; max-age=0; SameSite=Lax`
}

function getPendingAgencyInviteCode() {
  if (typeof window === 'undefined') return null

  let rawCode: string | null = null

  try {
    rawCode = localStorage.getItem(PENDING_AGENCY_INVITE_CODE_KEY)
  } catch {
    rawCode = null
  }

  rawCode = rawCode || getCookieValue(PENDING_AGENCY_INVITE_CODE_KEY)

  if (!rawCode) return null

  const code = rawCode.trim().toUpperCase()

  if (!AGENCY_INVITE_CODE_PATTERN.test(code)) {
    clearPendingAgencyInviteCode()
    return null
  }

  return code
}

export default function CreatorOnboardingPage() {
  const supabase = useMemo(() => createClient(), [])
  const router   = useRouter()
  const onboardingStartedRegisteredRef = useRef(false)

  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking')
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('signup')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authAction, setAuthAction] = useState<AuthAction | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [hasPendingAgencyInvite, setHasPendingAgencyInvite] = useState(false)

  const [step, setStep]     = useState<Step>('bio')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // Dados coletados nas etapas
  const [name, setName]         = useState('')
  const [bio, setBio]           = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [pixCpf, setPixCpf]         = useState('')
  const [pixCpfTouched, setPixCpfTouched] = useState(false)
  const [pixCpfError, setPixCpfError] = useState<string | null>(null)

  const stepIndex = STEPS.indexOf(step)
  const progress  = ((stepIndex + 1) / STEPS.length) * 100
  const pixCpfIsValid = pixCpf.length === CPF_DIGIT_LIMIT && !pixCpfError

  useEffect(() => {
    let mounted = true

    setHasPendingAgencyInvite(Boolean(getPendingAgencyInviteCode()))

    const setAnonymous = () => {
      if (!mounted) return
      setAuthUserId(null)
      setAuthStatus('anonymous')
    }

    const verifySession = async (session?: { access_token?: string } | null) => {
      if (!mounted) return

      if (!session?.access_token) {
        setAnonymous()
        return
      }

      setAuthStatus('checking')

      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (!mounted) return

        if (error || !user) {
          setAnonymous()
          return
        }

        setAuthUserId(user.id)
        setAuthStatus('authenticated')
      } catch (err) {
        console.warn('[creator onboarding] auth user validation error', err)
        setAnonymous()
      }
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => verifySession(session))
      .catch(err => {
        console.warn('[creator onboarding] auth session error', err)
        setAnonymous()
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      void verifySession(session)

      if (session?.user) {
        setAuthError(null)
        setAuthMessage(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handlePixCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = onlyDigits(e.target.value)

    setPixCpfTouched(true)

    if (digits.length > CPF_DIGIT_LIMIT) {
      setPixCpf(digits.slice(0, CPF_DIGIT_LIMIT))
      setPixCpfError('Use um CPF com 11 numeros. CNPJ nao e aceito nesta fase.')
      return
    }

    setPixCpf(digits)
    setPixCpfError(null)
  }

  const registerAgencyInvite = useCallback(async (
    status: AgencyInviteStatus,
    creatorId?: string
  ) => {
    const inviteCode = getPendingAgencyInviteCode()

    if (!inviteCode) return false

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) return false

      const body: Record<string, string> = {
        invite_code: inviteCode,
        status,
      }

      if (creatorId) {
        body.creator_id = creatorId
      }

      const response = await fetch('/api/agencia/creator-invite/registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      })

      if (response.ok) return true

      const result = await response.json().catch(() => null)
      const apiError = result?.error ?? `HTTP ${response.status}`

      if (response.status === 400 || response.status === 404) {
        console.warn('[agency invite] clearing invalid invite', apiError)
        clearPendingAgencyInviteCode()
        return false
      }

      if (response.status === 409) {
        console.warn('[agency invite] invite conflict', apiError)
        clearPendingAgencyInviteCode()
        return false
      }

      console.warn('[agency invite] failed to register invite', apiError)
      return false
    } catch (err) {
      console.warn('[agency invite] network error while registering invite', err)
      return false
    }
  }, [supabase])

  useEffect(() => {
    if (onboardingStartedRegisteredRef.current) return
    if (authStatus !== 'authenticated' || !authUserId) return

    const inviteCode = getPendingAgencyInviteCode()
    if (!inviteCode) return

    onboardingStartedRegisteredRef.current = true
    void registerAgencyInvite('onboarding_started')
  }, [authStatus, authUserId, registerAgencyInvite])

  const authRedirectTo = () => `${window.location.origin}/criadora/onboarding`

  const handleAuthSubmit = async () => {
    const email = authEmail.trim().toLowerCase()
    const password = authPassword.trim()

    if (!email) {
      setAuthError('Informe seu e-mail.')
      return
    }

    if (!password) {
      setAuthError('Informe uma senha.')
      return
    }

    if (password.length < 6) {
      setAuthError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    setAuthAction(authMode)
    setAuthError(null)
    setAuthMessage(null)

    try {
      if (authMode === 'signup') {
        const {
          data: { session },
          error,
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: authRedirectTo(),
          },
        })

        if (error) {
          setAuthError('Nao foi possivel criar sua conta. Tente entrar ou use outro e-mail.')
          return
        }

        if (session?.access_token) {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser()

          if (userError || !user) {
            setAuthError('Nao foi possivel confirmar sua sessao. Tente entrar novamente.')
            setAuthStatus('anonymous')
            setAuthUserId(null)
            return
          }

          setAuthUserId(user.id)
          setAuthStatus('authenticated')
          return
        }

        setAuthMessage('Enviamos um link de confirmacao para seu e-mail. Ao abrir, voce volta para continuar o onboarding.')
        return
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error || !session?.access_token) {
        setAuthError('E-mail ou senha invalidos.')
        return
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setAuthError('Nao foi possivel confirmar sua sessao. Tente entrar novamente.')
        setAuthStatus('anonymous')
        setAuthUserId(null)
        return
      }

      setAuthUserId(user.id)
      setAuthStatus('authenticated')
    } catch (err) {
      console.warn('[creator onboarding] auth submit error', err)
      setAuthError('Nao foi possivel autenticar agora. Tente novamente.')
    } finally {
      setAuthAction(null)
    }
  }

  const handleEmailLink = async () => {
    const email = authEmail.trim().toLowerCase()

    if (!email) {
      setAuthError('Informe seu e-mail.')
      return
    }

    setAuthAction('email')
    setAuthError(null)
    setAuthMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: authRedirectTo(),
        },
      })

      if (error) {
        setAuthError('Nao foi possivel enviar o link. Tente novamente.')
        return
      }

      setAuthMessage('Enviamos um link de acesso para seu e-mail. Ao abrir, voce volta para continuar o onboarding.')
    } catch (err) {
      console.warn('[creator onboarding] email link error', err)
      setAuthError('Nao foi possivel enviar o link agora. Tente novamente.')
    } finally {
      setAuthAction(null)
    }
  }

  const handlePublish = async () => {
    setSaving(true)
    setError(null)

    try {
      if (!pixCpfIsValid) {
        throw new Error('Informe um CPF Pix com 11 numeros. E-mail, telefone, chave aleatoria e CNPJ nao sao aceitos.')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // 1. Cria o registro de criadora
      const { data: creator, error: createErr } = await supabase
        .from('creators')
        .insert({
          user_id:            user.id,
          name:               name.trim(),
          bio:                bio.trim() || null,
          price_text_petals:  FIXED_TEXT_PRICE_PETALS,
          price_video_petals: FIXED_VIDEO_PRICE_PETALS,
          pix_key:            pixCpf,
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

      const createdCreatorId = (creator as { id?: string } | null)?.id
      const inviteRegistered = createdCreatorId
        ? await registerAgencyInvite('pending_verification', createdCreatorId)
        : false

      if (inviteRegistered) {
        clearPendingAgencyInviteCode()
      }

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

  if (authStatus === 'checking') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff4d7d]/30 border-t-[#ff4d7d] rounded-full animate-spin" />
      </main>
    )
  }

  if (authStatus !== 'authenticated' || !authUserId) {
    const isSignup = authMode === 'signup'

    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-5 py-8">
        <section className="w-full max-w-sm">
          <div className="mb-7 text-center">
            <div className="text-4xl mb-3">🌸</div>
            <p className="text-[#ff4d7d] text-xs font-medium uppercase tracking-wide">Creator Bloom</p>
            <h1 className="text-white text-2xl font-medium mt-2">Entre para criar seu perfil</h1>
            <p className="text-white/35 text-sm mt-2 leading-relaxed">
              Sua conta fica pronta antes do onboarding para salvar convite, perfil e verificacao.
            </p>
          </div>

          {hasPendingAgencyInvite && (
            <div className="mb-4 rounded-xl border border-[#ff4d7d]/20 bg-[#130b0f] px-4 py-3">
              <div className="text-[#ff8aaa] text-xs font-medium">Convite de agencia detectado</div>
              <div className="text-white/45 text-xs mt-1">Ele sera preservado durante o acesso.</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mb-4 rounded-xl bg-[#111] p-1 border border-white/5">
            {([
              { id: 'signup' as const, label: 'Criar conta' },
              { id: 'login' as const, label: 'Entrar' },
            ]).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setAuthMode(item.id)
                  setAuthError(null)
                  setAuthMessage(null)
                }}
                className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                  authMode === item.id
                    ? 'bg-[#ff4d7d] text-white'
                    : 'text-white/35 hover:text-white/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <input
              type="email"
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuthSubmit()}
              placeholder="seu@email.com"
              autoComplete="email"
              className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/40"
            />
            <input
              type="password"
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuthSubmit()}
              placeholder={isSignup ? 'crie uma senha' : 'sua senha'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#ff4d7d]/40"
            />

            {authError && (
              <div className="rounded-xl border border-red-500/25 bg-red-900/20 px-4 py-3 text-red-300 text-xs leading-relaxed">
                {authError}
              </div>
            )}

            {authMessage && (
              <div className="rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-green-300 text-xs leading-relaxed">
                {authMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleAuthSubmit}
              disabled={!!authAction}
              className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform"
            >
              {authAction === authMode ? 'Aguarde...' : isSignup ? 'Criar conta e continuar' : 'Entrar e continuar'}
            </button>

            <button
              type="button"
              onClick={handleEmailLink}
              disabled={!authEmail.trim() || !!authAction}
              className="w-full rounded-xl border border-white/10 py-3 text-sm font-medium text-white/55 disabled:opacity-40 active:scale-95 transition-transform"
            >
              {authAction === 'email' ? 'Enviando...' : 'Receber link por e-mail'}
            </button>
          </div>

          <p className="text-white/20 text-xs text-center mt-5 leading-relaxed">
            Ao continuar voce confirma ter 18 anos ou mais.
          </p>
        </section>
      </main>
    )
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
              <h2 className="text-white text-xl font-medium mb-1">Preços fixos da plataforma</h2>
              <p className="text-white/35 text-sm">Esses valores são aplicados ao seu perfil de creator.</p>
            </div>

            {/* Precos fixos */}
            {[
              { label: 'Chat de texto', sub: '10 pétalas no 1º minuto; depois 50 pétalas/min', value: `${FIXED_TEXT_PRICE_PETALS} pétalas/min`, detail: `${FIXED_TEXT_FIRST_MINUTE_PETALS} pétalas no 1º minuto. Depois, ${FIXED_TEXT_PRICE_PETALS} pétalas por minuto.` },
              { label: 'Vídeo privado', sub: 'preço fixo da plataforma', value: `${FIXED_VIDEO_PRICE_PETALS} pétalas/min`, detail: `${FIXED_VIDEO_PRICE_PETALS} pétalas por minuto.` },
            ].map(item => (
              <div key={item.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white text-sm font-medium">{item.label}</div>
                    <div className="text-white/30 text-xs">{item.sub}</div>
                  </div>
                  <div className="text-yellow-400 text-lg font-medium">{item.value}</div>
                </div>
                <div className="rounded-lg border border-white/8 bg-[#0d0d0d] p-3">
                  <div className="text-white/60 text-sm">{item.detail}</div>
                </div>
              </div>
            ))}

            {/* Modelo de ganhos */}
            <div className="bg-[#0e1e14] border border-green-500/20 rounded-xl p-4">
              <div className="text-green-400 text-xs font-medium mb-3">Modelo de ganhos</div>
              {[
                'Ganhos calculados sobre pétalas elegíveis.',
                'Referência: US$1 a cada 850 pétalas elegíveis.',
                'Bônus, promoções e créditos não sacáveis não entram no cálculo.',
                'Agências recebem 30% sobre ganhos elegíveis da creator vinculada.',
              ].map(item => (
                <div key={item} className="flex gap-2 mb-2 last:mb-0">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="text-white/50 text-xs leading-relaxed">{item}</span>
                </div>
              ))}
            </div>

            {/* Pix para saque */}
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider block mb-2">CPF para recebimento via Pix</label>
              <input
                value={formatCpf(pixCpf)}
                onChange={handlePixCpfChange}
                onBlur={() => setPixCpfTouched(true)}
                placeholder="000.000.000-00"
                inputMode="numeric"
                autoComplete="off"
                maxLength={14}
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#ff4d7d]/40"
              />
              <p className="text-white/30 text-xs mt-2 leading-relaxed">
                Por segurança, o CPF do Pix deverá ser o mesmo CPF usado na verificação/KYC.
              </p>
              {pixCpfTouched && (pixCpfError || pixCpf.length !== CPF_DIGIT_LIMIT) && (
                <div className="mt-2 rounded-xl border border-red-500/25 bg-red-900/20 px-3 py-2 text-red-300 text-xs leading-relaxed">
                  {pixCpfError ?? 'Informe um CPF com 11 numeros. E-mail, telefone, chave aleatoria e CNPJ nao sao aceitos.'}
                </div>
              )}
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
                    <div className="text-yellow-400 text-sm font-medium">{FIXED_TEXT_PRICE_PETALS} pétalas</div>
                    <div className="text-white/25 text-[10px]">texto/min após 1º min</div>
                  </div>
                  <div className="flex-1 bg-[#0d0d0d] rounded-lg p-2 text-center">
                    <div className="text-yellow-400 text-sm font-medium">{FIXED_VIDEO_PRICE_PETALS} pétalas</div>
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
            (step === 'precos' && !pixCpfIsValid) ||
            (step === 'publicar' && (!name.trim() || !pixCpfIsValid))
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
