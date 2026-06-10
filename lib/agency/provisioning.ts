import type { User } from '@supabase/supabase-js'
import { enviarEmailPrimeiroAcessoAgencia } from '@/lib/email'

type SupabaseAdmin = any

export type AgencyApplicationForProvisioning = {
  id: string
  agency_name: string | null
  responsible_name: string | null
  email: string | null
  whatsapp: string | null
  country: string | null
  notes: string | null
}

type PublicUser = {
  id: string
  email: string | null
  role: string | null
  operational_channel: string | null
  signup_channel: string | null
}

type Agency = {
  id: string
  notes?: string | null
}

type AuthUserResolution = {
  user: User
  inviteLink: string | null
}

type ProvisionAgencyApplicationParams = {
  admin: SupabaseAdmin
  application: AgencyApplicationForProvisioning
  redirectTo: string
}

const AUTH_USERS_PAGE_SIZE = 1000

export class AgencyProvisioningError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = 'AgencyProvisioningError'
    this.status = status
  }
}

const normalizeEmail = (value: string | null | undefined) => value?.trim().toLowerCase() ?? ''

const isDuplicateError = (error: { code?: string } | null | undefined) => error?.code === '23505'

const agencyNotes = (application: AgencyApplicationForProvisioning) =>
  [application.notes?.trim(), `Origem: candidatura de agencia ${application.id}`]
    .filter(Boolean)
    .join('\n\n') || null

const assertUserRoleIsAllowed = (user: PublicUser) => {
  const channel = user.operational_channel ?? user.signup_channel

  if (user.role === 'admin' || channel === 'admin') {
    throw new AgencyProvisioningError(
      'Este email ja pertence a uma conta administrativa. A candidatura permanece pendente para revisao manual.',
      409
    )
  }

  if (user.role === 'creator' || channel === 'creator') {
    throw new AgencyProvisioningError(
      'Este email ja pertence a uma conta de criadora. A candidatura permanece pendente para revisao manual.',
      409
    )
  }

  if (channel === 'user') {
    throw new AgencyProvisioningError(
      'Este email ja pertence a uma conta de usuario. Use uma conta propria de agencia.',
      409
    )
  }

  if (!channel) {
    throw new AgencyProvisioningError(
      'Este email pertence a uma conta sem canal operacional definido. Resolva manualmente antes de aprovar.',
      409
    )
  }

  if (channel !== 'agency') {
    throw new AgencyProvisioningError(
      'Este email ja pertence a uma conta com canal nao permitido para agencia.',
      409
    )
  }

  if (user.role && user.role !== 'user') {
    throw new AgencyProvisioningError(
      'Este email ja pertence a um usuario com role nao permitida para agencia.',
      409
    )
  }
}

async function getPublicUserByEmail(admin: SupabaseAdmin, email: string): Promise<PublicUser | null> {
  const { data, error } = await admin
    .from('users')
    .select('id, email, role, operational_channel, signup_channel')
    .eq('email', email)
    .limit(2)

  if (error) {
    throw new AgencyProvisioningError('Falha ao verificar usuario publico existente.')
  }

  const users = (data ?? []) as PublicUser[]

  if (users.length > 1) {
    throw new AgencyProvisioningError(
      'Existe mais de um perfil publico com este email. Resolva manualmente antes de aprovar.',
      409
    )
  }

  return users[0] ?? null
}

async function getPublicUserById(admin: SupabaseAdmin, userId: string): Promise<PublicUser | null> {
  const { data, error } = await admin
    .from('users')
    .select('id, email, role, operational_channel, signup_channel')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new AgencyProvisioningError('Falha ao verificar perfil publico do usuario.')
  }

  return (data as PublicUser | null) ?? null
}

async function findAuthUserByEmail(admin: SupabaseAdmin, email: string): Promise<User | null> {
  let page = 1

  while (page) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PAGE_SIZE,
    })

    if (error) {
      throw new AgencyProvisioningError('Falha ao buscar usuario Auth por email.')
    }

    const users = (data?.users ?? []) as User[]
    const found = users.find(user => normalizeEmail(user.email) === email)

    if (found) return found

    page = Number((data as { nextPage?: number | null } | null)?.nextPage ?? 0)
  }

  return null
}

async function createAuthUser(admin: SupabaseAdmin, application: AgencyApplicationForProvisioning, email: string, redirectTo: string): Promise<AuthUserResolution> {
  const metadata = {
    name: application.responsible_name ?? application.agency_name ?? null,
    agency_name: application.agency_name ?? null,
    source: 'agency_application',
    signup_channel: 'agency',
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: metadata,
  })

  if (!error && data?.user) {
    return { user: data.user as User, inviteLink: null }
  }

  if (error && /already|registered|exists/i.test(error.message)) {
    const existing = await findAuthUserByEmail(admin, email)
    if (existing) return { user: existing, inviteLink: null }
  }

  const invite = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo,
      data: metadata,
    },
  })

  if (invite.error || !invite.data?.user) {
    throw new AgencyProvisioningError('Falha ao criar usuario Auth sem senha temporaria.')
  }

  return {
    user: invite.data.user as User,
    inviteLink: invite.data.properties?.action_link ?? null,
  }
}

async function resolveAuthUser(
  admin: SupabaseAdmin,
  application: AgencyApplicationForProvisioning,
  email: string,
  publicUser: PublicUser | null,
  redirectTo: string
): Promise<AuthUserResolution> {
  if (publicUser) {
    const { data, error } = await admin.auth.admin.getUserById(publicUser.id)

    if (error || !data?.user) {
      throw new AgencyProvisioningError('Perfil publico encontrado, mas usuario Auth nao foi localizado.')
    }

    if (normalizeEmail(data.user.email) !== email) {
      throw new AgencyProvisioningError('Perfil publico e usuario Auth possuem emails divergentes.', 409)
    }

    return { user: data.user as User, inviteLink: null }
  }

  const existingAuthUser = await findAuthUserByEmail(admin, email)
  if (existingAuthUser) return { user: existingAuthUser, inviteLink: null }

  return createAuthUser(admin, application, email, redirectTo)
}

async function ensurePublicUser(admin: SupabaseAdmin, authUser: User, email: string, now: string): Promise<PublicUser> {
  const existing = await getPublicUserById(admin, authUser.id)

  if (existing) {
    assertUserRoleIsAllowed(existing)

    if (normalizeEmail(existing.email) !== email) {
      const { data, error } = await admin
        .from('users')
        .update({ email })
        .eq('id', authUser.id)
        .select('id, email, role, operational_channel, signup_channel')
        .maybeSingle()

      if (error || !data) {
        throw new AgencyProvisioningError('Falha ao normalizar email do perfil publico.')
      }

      return data as PublicUser
    }

    return existing
  }

  const { data, error } = await admin
    .from('users')
    .insert({
      id: authUser.id,
      email,
      role: 'user',
      signup_channel: 'agency',
      operational_channel: 'agency',
      role_locked_at: now,
      role_locked_reason: 'agency_provisioning',
    })
    .select('id, email, role, operational_channel, signup_channel')
    .maybeSingle()

  if (!error && data) return data as PublicUser

  if (isDuplicateError(error)) {
    const retry = await getPublicUserById(admin, authUser.id)
    if (retry) {
      assertUserRoleIsAllowed(retry)
      return retry
    }
  }

  throw new AgencyProvisioningError('Falha ao garantir perfil publico do usuario.')
}

async function findAgencyByEmail(admin: SupabaseAdmin, email: string): Promise<Agency | null> {
  const { data, error } = await admin
    .from('agencies')
    .select('id, notes')
    .ilike('email', email.replace(/([%_\\])/g, '\\$1'))
    .limit(2)

  if (error) {
    throw new AgencyProvisioningError('Falha ao verificar agencia existente.')
  }

  const agencies = (data ?? []) as Agency[]
  return agencies[0] ?? null
}

async function saveAgency(admin: SupabaseAdmin, application: AgencyApplicationForProvisioning, email: string, now: string): Promise<Agency> {
  const existing = await findAgencyByEmail(admin, email)
  const payload = {
    name: application.agency_name,
    responsible_name: application.responsible_name,
    email,
    whatsapp: application.whatsapp,
    country: application.country,
    commission_percent: 30,
    active: true,
    approved_at: now,
    notes: existing?.notes ?? agencyNotes(application),
    updated_at: now,
  }

  if (existing) {
    const { data, error } = await admin
      .from('agencies')
      .update(payload)
      .eq('id', existing.id)
      .select('id, notes')
      .maybeSingle()

    if (error || !data) {
      throw new AgencyProvisioningError('Falha ao atualizar agencia existente.')
    }

    return data as Agency
  }

  const { data, error } = await admin
    .from('agencies')
    .insert(payload)
    .select('id, notes')
    .maybeSingle()

  if (!error && data) return data as Agency

  if (isDuplicateError(error)) {
    const retry = await findAgencyByEmail(admin, email)
    if (retry) return saveAgency(admin, application, email, now)
  }

  throw new AgencyProvisioningError('Falha ao criar agencia.')
}

async function ensureAgencyUser(admin: SupabaseAdmin, agencyId: string, userId: string, now: string) {
  const { data: existing, error: existingError } = await admin
    .from('agency_users')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingError) {
    throw new AgencyProvisioningError('Falha ao verificar vinculo da agencia.')
  }

  if (existing?.id) {
    const { error } = await admin
      .from('agency_users')
      .update({
        role: 'owner',
        active: true,
        updated_at: now,
      })
      .eq('id', existing.id)

    if (error) throw new AgencyProvisioningError('Falha ao reativar vinculo da agencia.')
    return
  }

  const { error } = await admin.from('agency_users').insert({
    agency_id: agencyId,
    user_id: userId,
    role: 'owner',
    active: true,
  })

  if (!error) return

  if (isDuplicateError(error)) {
    await ensureAgencyUser(admin, agencyId, userId, now)
    return
  }

  throw new AgencyProvisioningError('Falha ao criar vinculo da agencia.')
}

async function generateRecoveryLink(admin: SupabaseAdmin, email: string, redirectTo: string) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })

  if (error || !data?.properties?.action_link) {
    throw new AgencyProvisioningError('Falha ao gerar link de primeiro acesso.')
  }

  return data.properties.action_link as string
}

export async function provisionAgencyApplication({
  admin,
  application,
  redirectTo,
}: ProvisionAgencyApplicationParams) {
  const email = normalizeEmail(application.email)
  const now = new Date().toISOString()

  if (!email || !application.agency_name || !application.responsible_name || !application.whatsapp || !application.country) {
    throw new AgencyProvisioningError('Candidatura possui dados obrigatorios incompletos.', 400)
  }

  const publicUserByEmail = await getPublicUserByEmail(admin, email)
  if (publicUserByEmail) assertUserRoleIsAllowed(publicUserByEmail)

  const authUser = await resolveAuthUser(admin, application, email, publicUserByEmail, redirectTo)
  const publicUser = await ensurePublicUser(admin, authUser.user, email, now)
  const agency = await saveAgency(admin, application, email, now)

  await ensureAgencyUser(admin, agency.id, publicUser.id, now)

  const firstAccessLink = authUser.inviteLink ?? await generateRecoveryLink(admin, email, redirectTo)

  await enviarEmailPrimeiroAcessoAgencia({
    email,
    agencyName: application.agency_name,
    responsibleName: application.responsible_name,
    actionLink: firstAccessLink,
  })
}
