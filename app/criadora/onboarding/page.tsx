// app/criadora/onboarding/page.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Step = 'bio' | 'foto' | 'precos' | 'publicar'
const STEPS: Step[] = ['bio', 'foto', 'precos', 'publicar']
type AgencyInviteStatus = 'onboarding_started' | 'pending_verification'
type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'channel_blocked' | 'channel_review_required'
type AuthMode = 'signup' | 'login'
type AuthAction = 'signup' | 'login' | 'email'
type OperationalChannel = 'user' | 'creator' | 'agency' | 'admin'

type OnboardingSubmitResponse = {
  success?: boolean
  creator_id?: string
  error?: string
  code?: string
}

const PENDING_AGENCY_INVITE_CODE_KEY = 'pending_agency_invite_code'
const AGENCY_INVITE_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/
const FIXED_TEXT_FIRST_MINUTE_PETALS = 10
const FIXED_TEXT_PRICE_PETALS = 50
const FIXED_VIDEO_PRICE_PETALS = 120
const CPF_DIGIT_LIMIT = 11

const onlyDigits = (value: string) => value.replace(/\D/g, '')

function getAuthParam(
  searchParams: URLSearchParams,
  hashParams: URLSearchParams,
  key: string,
) {
  return searchParams.get(key) ?? hashParams.get(key)
}

function isExpiredAuthLinkError(error: string | null, errorCode: string | null, errorDescription: string | null) {
  const combined = `${error ?? ''} ${errorCode ?? ''} ${errorDescription ?? ''}`.toLowerCase()

  return (
    errorCode === 'otp_expired' ||
    combined.includes('otp_expired') ||
    combined.includes('email link is invalid') ||
    combined.includes('expired') ||
    combined.includes('invalid') ||
    combined.includes('expirou') ||
    combined.includes('inválido') ||
    combined.includes('invalido')
  )
}

function getOnboardingAuthUrlMessage() {
  if (typeof window === 'undefined') return null

  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const error = getAuthParam(searchParams, hashParams, 'error')
  const errorCode = getAuthParam(searchParams, hashParams, 'error_code')
  const errorDescription = getAuthParam(searchParams, hashParams, 'error_description')

  if (!error && !errorCode && !errorDescription) return null

  return isExpiredAuthLinkError(error, errorCode, errorDescription)
    ? 'Este link expirou ou já foi usado. Entre com a conta correta para continuar o onboarding.'
    : 'Não conseguimos concluir sua entrada automaticamente. Entre novamente para continuar o onboarding.'
}

function clearOnboardingAuthUrl() {
  if (typeof window === 'undefined') return

  window.history.replaceState(null, '', window.location.pathname)
}

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
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null)
  const [accountChannel, setAccountChannel] = useState<OperationalChannel | null>(null)
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
      setAuthUserEmail(null)
      setAccountChannel(null)
      setAuthStatus('anonymous')
    }

    const authUrlMessage = getOnboardingAuthUrlMessage()

    if (authUrlMessage) {
      setAuthError(null)
      setAuthMessage(authUrlMessage)
      clearOnboardingAuthUrl()

      supabase.auth.signOut()
        .catch(err => {
          console.warn('[creator onboarding] auth url sign out error', err)
        })
        .finally(setAnonymous)

      return () => {
        mounted = false
      }
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

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role, operational_channel, signup_channel, role_locked_reason')
          .eq('id', user.id)
          .maybeSingle()

        if (!mounted) return

        if (profileError) {
          console.warn('[creator onboarding] profile channel validation error', profileError)
          setAnonymous()
          return
        }

        const userMetadata = user.user_metadata as { signup_channel?: string } | null
        const metadataChannel = userMetadata?.signup_channel === 'creator' ? 'creator' : null
        const profileRow = profile as {
          role?: string | null
          operational_channel?: OperationalChannel | null
          signup_channel?: OperationalChannel | null
          role_locked_reason?: string | null
        } | null
        const channel = profileRow?.operational_channel ?? profileRow?.signup_channel ?? metadataChannel

        setAuthUserId(user.id)
        setAuthUserEmail(user.email ?? null)
        setAccountChannel(channel ?? null)

        if (profileRow?.role_locked_reason === 'backfill_creator_pending_review') {
          setAuthStatus('channel_review_required')
          return
        }

        if (profileRow?.role === 'admin' || (channel && channel !== 'creator') || (!channel && profileRow)) {
          setAuthStatus('channel_blocked')
          return
        }

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
        setAuthUserEmail(session.user.email ?? null)
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
            data: {
              signup_channel: 'creator',
            },
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
            setAuthUserEmail(null)
            setAccountChannel(null)
            return
          }

          const { data: profile } = await supabase
            .from('users')
            .select('role, operational_channel, signup_channel, role_locked_reason')
            .eq('id', user.id)
            .maybeSingle()
          const profileRow = profile as {
            role?: string | null
            operational_channel?: OperationalChannel | null
            signup_channel?: OperationalChannel | null
            role_locked_reason?: string | null
          } | null
          const channel = profileRow?.operational_channel ?? profileRow?.signup_channel ?? 'creator'

          setAuthUserId(user.id)
          setAuthUserEmail(user.email ?? null)
          setAccountChannel(channel)

          if (profileRow?.role_locked_reason === 'backfill_creator_pending_review') {
            setAuthStatus('channel_review_required')
            return
          }

          if (profileRow?.role === 'admin' || channel !== 'creator') {
            setAuthStatus('channel_blocked')
            return
          }

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
        setAuthUserEmail(null)
        setAccountChannel(null)
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role, operational_channel, signup_channel, role_locked_reason')
        .eq('id', user.id)
        .maybeSingle()
      const profileRow = profile as {
        role?: string | null
        operational_channel?: OperationalChannel | null
        signup_channel?: OperationalChannel | null
        role_locked_reason?: string | null
      } | null
      const channel = profileRow?.operational_channel ?? profileRow?.signup_channel ?? null

      setAuthUserId(user.id)
      setAuthUserEmail(user.email ?? null)
      setAccountChannel(channel)

      if (profileRow?.role_locked_reason === 'backfill_creator_pending_review') {
        setAuthStatus('channel_review_required')
        return
      }

      if (profileRow?.role === 'admin' || channel !== 'creator') {
        setAuthStatus('channel_blocked')
        return
      }

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
          data: {
            signup_channel: 'creator',
          },
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

  const handleUseAnotherAccount = async () => {
    setAuthAction('login')
    setAuthError(null)
    setAuthMessage(null)

    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('[creator onboarding] sign out for channel switch', err)
    } finally {
      setAuthUserId(null)
      setAuthUserEmail(null)
      setAccountChannel(null)
      setAuthPassword('')
      setAuthStatus('anonymous')
      setAuthAction(null)
    }
  }

  const handlePublish = async () => {
    setSaving(true)
    setError(null)

    try {
      if (authStatus !== 'authenticated' || accountChannel !== 'creator') {
        throw new Error('Esta conta não está liberada para criar perfil de criadora. Entre com uma conta própria de criadora.')
      }

      if (!pixCpfIsValid) {
        throw new Error('Informe um CPF Pix com 11 numeros. E-mail, telefone, chave aleatoria e CNPJ nao sao aceitos.')
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Entre novamente para enviar seu perfil com segurança.')
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (!user || user.id !== authUserId) {
        setAuthStatus('anonymous')
        setAuthUserId(null)
        setAuthUserEmail(null)
        setAccountChannel(null)
        throw new Error('Não foi possível confirmar sua sessão. Entre novamente para continuar.')
      }

      if (!authUserEmail) {
        throw new Error('Não foi possível confirmar o e-mail da sessão. Entre novamente para continuar.')
      }

      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('bio', bio.trim())
      formData.append('pix_cpf', pixCpf)
      formData.append('price_text_petals', String(FIXED_TEXT_PRICE_PETALS))
      formData.append('price_video_petals', String(FIXED_VIDEO_PRICE_PETALS))

      if (photoFile) {
        formData.append('photo', photoFile)
      }

      const response = await fetch('/api/criadora/onboarding', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      const result = await response.json().catch(() => null) as OnboardingSubmitResponse | null

      if (!response.ok || !result?.success || !result.creator_id) {
        throw new Error(result?.error ?? 'Não foi possível enviar seu perfil para aprovação.')
      }

      const inviteRegistered = await registerAgencyInvite('pending_verification', result.creator_id)

      if (inviteRegistered) {
        clearPendingAgencyInviteCode()
      }

      router.push('/criadora/verificacao')
      return

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

  if (authStatus === 'channel_review_required') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-5 py-8">
        <section className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6 text-center shadow-2xl shadow-black/30">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#ff4d7d]/25 bg-[#ff4d7d]/10 text-[#ff8aaa]">
            B
          </div>
          <p className="text-[#ff4d7d] text-xs font-medium uppercase tracking-wide">Revisão necessária</p>
          <h1 className="mt-3 text-2xl font-medium leading-tight">Confirme sua conta de criadora</h1>
          <p className="mt-4 text-white/50 text-sm leading-relaxed">
            A conta {authUserEmail ? <span className="text-white/75">{authUserEmail}</span> : 'conectada'} possui um perfil de criadora antigo que precisa de revisão antes de continuar. Para criar um novo perfil, use uma conta própria de criadora.
          </p>

          <button
            type="button"
            onClick={handleUseAnotherAccount}
            disabled={!!authAction}
            className="mt-6 w-full rounded-xl bg-[#ff4d7d] px-4 py-3 text-sm font-medium text-white disabled:opacity-50 active:scale-95 transition-transform"
          >
            {authAction ? 'Saindo...' : 'Usar outra conta'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/feed')}
            disabled={!!authAction}
            className="mt-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/55 disabled:opacity-50 active:scale-95 transition-transform"
          >
            Voltar ao app
          </button>
        </section>
      </main>
    )
  }

  if (authStatus === 'channel_blocked') {
    const channelLabel = accountChannel === 'agency'
      ? 'agência'
      : accountChannel === 'admin'
        ? 'admin'
        : 'usuário'

    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-5 py-8">
        <section className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6 text-center shadow-2xl shadow-black/30">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#ff4d7d]/25 bg-[#ff4d7d]/10 text-[#ff8aaa]">
            B
          </div>
          <p className="text-[#ff4d7d] text-xs font-medium uppercase tracking-wide">Conta em outro canal</p>
          <h1 className="mt-3 text-2xl font-medium leading-tight">Use uma conta própria de criadora</h1>
          <p className="mt-4 text-white/50 text-sm leading-relaxed">
            A conta {authUserEmail ? <span className="text-white/75">{authUserEmail}</span> : 'conectada'} já está vinculada ao canal de {channelLabel}. Para criar perfil de criadora, entre com uma conta separada para esse uso.
          </p>

          <button
            type="button"
            onClick={handleUseAnotherAccount}
            disabled={!!authAction}
            className="mt-6 w-full rounded-xl bg-[#ff4d7d] px-4 py-3 text-sm font-medium text-white disabled:opacity-50 active:scale-95 transition-transform"
          >
            {authAction ? 'Saindo...' : 'Usar outra conta'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/feed')}
            disabled={!!authAction}
            className="mt-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/55 disabled:opacity-50 active:scale-95 transition-transform"
          >
            Voltar ao app
          </button>
        </section>
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
        <div className="mt-4 rounded-xl border border-white/8 bg-[#111] px-4 py-3">
          <div className="text-white/30 text-[11px] uppercase tracking-wide">Conta conectada</div>
          <div className="mt-1 text-white/70 text-sm break-all">{authUserEmail ?? 'Sessão autenticada'}</div>
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
