'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CreatorStatus = {
  id: string
  name: string | null
  verified: boolean | null
  active: boolean | null
  created_at: string | null
}

type VerificationStatus = {
  id: string
  status: 'pending' | 'approved' | 'rejected' | null
}

type AccountChannelStatus = {
  role: string | null
  operational_channel: string | null
  signup_channel: string | null
  role_locked_reason: string | null
}

type PageState =
  | 'loading'
  | 'unauthenticated'
  | 'channel_conflict'
  | 'missing_creator'
  | 'missing_verification'
  | 'pending'
  | 'approved'
  | 'error'

export default function CreatorVerificationPage() {
  const supabase = useMemo(() => createClient(), [])
  const [state, setState] = useState<PageState>('loading')
  const [creator, setCreator] = useState<CreatorStatus | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (!mounted) return

        if (authError || !user) {
          setState('unauthenticated')
          return
        }

        const { data: accountData, error: accountError } = await (supabase as any)
          .from('users')
          .select('role, operational_channel, signup_channel, role_locked_reason')
          .eq('id', user.id)
          .maybeSingle()

        if (!mounted) return

        if (accountError) {
          console.error('[criadora/verificacao] users', accountError)
          setState('error')
          return
        }

        const account = accountData as AccountChannelStatus | null
        const accountChannel = account?.operational_channel ?? account?.signup_channel ?? null

        if (!account || account.role === 'admin' || accountChannel !== 'creator') {
          setState('channel_conflict')
          return
        }

        const { data, error } = await (supabase as any)
          .from('creators')
          .select('id, name, verified, active, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!mounted) return

        if (error) {
          console.error('[criadora/verificacao] creators', error)
          setState('error')
          return
        }

        if (!data) {
          setState('missing_creator')
          return
        }

        const creatorStatus = data as CreatorStatus

        if (
          account.role_locked_reason === 'backfill_creator_pending_review' &&
          creatorStatus.verified !== true &&
          creatorStatus.active !== true
        ) {
          setState('channel_conflict')
          return
        }

        const { data: verification, error: verificationError } = await (supabase as any)
          .from('creator_verifications')
          .select('id, status')
          .eq('creator_id', creatorStatus.id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (!mounted) return

        if (verificationError) {
          console.error('[criadora/verificacao] creator_verifications', verificationError)
          setState('error')
          return
        }

        const verificationStatus = (verification as VerificationStatus | null)?.status
        const hasSubmittedVerification =
          verificationStatus === 'pending' || verificationStatus === 'approved'

        if (!hasSubmittedVerification) {
          setCreator(creatorStatus)
          setState('missing_verification')
          return
        }

        setCreator(creatorStatus)
        setState(
          creatorStatus.verified || creatorStatus.active || verificationStatus === 'approved'
            ? 'approved'
            : 'pending'
        )
      } catch (err) {
        console.error('[criadora/verificacao]', err)
        if (mounted) setState('error')
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [supabase])

  if (state === 'loading') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff4d7d]/30 border-t-[#ff4d7d] rounded-full animate-spin" />
      </main>
    )
  }

  if (state === 'unauthenticated') {
    return (
      <VerificationShell
        eyebrow="Sessão necessária"
        title="Entre para acompanhar seu perfil"
        body="Não encontramos uma sessão ativa neste navegador. Entre novamente para continuar o onboarding de criadora."
        actionHref="/criadora/onboarding"
        actionLabel="Entrar e continuar"
      />
    )
  }

  if (state === 'channel_conflict') {
    return (
      <VerificationShell
        eyebrow="Conta em outro canal"
        title="Use uma conta própria de criadora"
        body="Esta conta não está vinculada ao canal de criadora. Volte ao onboarding com uma conta própria de criadora para enviar o perfil com segurança."
        actionHref="/criadora/onboarding"
        actionLabel="Voltar ao onboarding"
      />
    )
  }

  if (state === 'missing_creator') {
    return (
      <VerificationShell
        eyebrow="Perfil não encontrado"
        title="Crie seu perfil de criadora"
        body="Ainda não encontramos um perfil de criadora para esta conta. Volte ao onboarding para criar e enviar seu perfil."
        actionHref="/criadora/onboarding"
        actionLabel="Voltar ao onboarding"
      />
    )
  }

  if (state === 'missing_verification') {
    return (
      <VerificationShell
        eyebrow="Envio não confirmado"
        title="Finalize o envio do perfil"
        body="Encontramos seu perfil, mas não encontramos uma solicitação de aprovação vinculada a esta conta. Volte ao onboarding para reenviar com segurança."
        actionHref="/criadora/onboarding"
        actionLabel="Voltar ao onboarding"
        creatorName={creator?.name}
      />
    )
  }

  if (state === 'approved') {
    return (
      <VerificationShell
        eyebrow="Perfil aprovado"
        title="Seu perfil já está ativo"
        body="Sua conta de criadora já foi aprovada. Você pode acessar seu painel e acompanhar sua atividade."
        actionHref="/criadora/dashboard"
        actionLabel="Ir para o painel"
        creatorName={creator?.name}
      />
    )
  }

  if (state === 'error') {
    return (
      <VerificationShell
        eyebrow="Erro ao carregar"
        title="Não foi possível carregar seu status"
        body="Tente atualizar a página. Se o problema continuar, volte ao onboarding para confirmar se seu perfil foi criado."
        actionHref="/criadora/onboarding"
        actionLabel="Voltar ao onboarding"
      />
    )
  }

  return (
    <VerificationShell
      eyebrow="Perfil enviado"
      title="Perfil enviado para aprovação"
      body="Recebemos seu perfil de criadora. Nossa equipe vai revisar os dados antes de liberar sua conta na plataforma."
      actionHref="/feed"
      actionLabel="Voltar ao início"
      creatorName={creator?.name}
    />
  )
}

function VerificationShell({
  eyebrow,
  title,
  body,
  actionHref,
  actionLabel,
  creatorName,
}: {
  eyebrow: string
  title: string
  body: string
  actionHref: string
  actionLabel: string
  creatorName?: string | null
}) {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl shadow-black/30">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#ff4d7d]/25 bg-[#ff4d7d]/10 text-[#ff8aaa]">
          B
        </div>

        <div className="text-center">
          <p className="text-[#ff4d7d] text-xs font-medium uppercase tracking-wide">{eyebrow}</p>
          <h1 className="mt-3 text-2xl font-medium leading-tight">{title}</h1>
          {creatorName && (
            <p className="mt-2 text-white/45 text-sm">{creatorName}</p>
          )}
          <p className="mt-4 text-white/50 text-sm leading-relaxed">{body}</p>
        </div>

        <div className="mt-6 rounded-xl border border-white/8 bg-[#0d0d0d] p-4">
          <div className="text-white/30 text-[11px] uppercase tracking-wide">Próximo passo</div>
          <p className="mt-2 text-white/55 text-sm leading-relaxed">
            Aguarde a revisão. Quando o perfil for aprovado, o painel de criadora será liberado automaticamente.
          </p>
        </div>

        <Link
          href={actionHref}
          className="mt-6 block w-full rounded-xl bg-[#ff4d7d] px-4 py-3 text-center text-sm font-medium text-white active:scale-95 transition-transform"
        >
          {actionLabel}
        </Link>
      </section>
    </main>
  )
}
