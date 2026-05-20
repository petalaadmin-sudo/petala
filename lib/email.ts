import { Resend } from 'resend'

type EmailPrimeiroAcessoAgenciaParams = {
  email: string
  agencyName: string
  responsibleName: string
  actionLink: string
}

const getEmailFrom = () => {
  const from = process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM

  if (!from) {
    throw new Error('RESEND_FROM_EMAIL ou EMAIL_FROM nao configurado')
  }

  return from
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

export async function enviarEmailBoasVindas(email: string, nome: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  return await resend.emails.send({
    from: 'Pétala <onboarding@resend.dev>',
    to: email,
    subject: '🌸 Bem-vindo ao Pétala!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e91e8c;">🌸 Bem-vindo ao Pétala!</h1>
        <p>Olá${nome ? `, ${nome}` : ''}!</p>
        <p>Sua conta foi criada com sucesso. Explore os melhores criadores de conteúdo e aproveite!</p>
        <a href="https://petala.app/feed" style="background: #e91e8c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
          Acessar Pétala
        </a>
        <p style="margin-top: 32px; color: #999; font-size: 12px;">Pétala — conteúdo exclusivo</p>
      </div>
    `,
  })
}

export async function enviarEmailPrimeiroAcessoAgencia({
  email,
  agencyName,
  responsibleName,
  actionLink,
}: EmailPrimeiroAcessoAgenciaParams) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY nao configurada')
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const safeName = escapeHtml(responsibleName)
  const safeAgencyName = escapeHtml(agencyName)
  const safeActionLink = escapeHtml(actionLink)

  const result = await resend.emails.send({
    from: getEmailFrom(),
    to: email,
    subject: 'Bloom: acesso da agencia aprovado',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e91e8c;">Acesso Bloom aprovado</h1>
        <p>Ola${safeName ? `, ${safeName}` : ''}!</p>
        <p>A candidatura da agencia <strong>${safeAgencyName}</strong> foi aprovada.</p>
        <p>Use o link abaixo para definir sua senha e acessar o painel da agencia.</p>
        <a href="${safeActionLink}" style="background: #e91e8c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
          Definir senha
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 13px;">Se voce nao solicitou este acesso, ignore este email.</p>
        <p style="margin-top: 32px; color: #999; font-size: 12px;">Bloom</p>
      </div>
    `,
  })

  if (result.error) {
    throw new Error(`Falha ao enviar email de primeiro acesso: ${result.error.message}`)
  }

  return result
}

export async function enviarEmailCompraPetals(
  email: string,
  nome: string,
  petals: number,
  pacote: string,
  valor: number
) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'Pétala <noreply@petala.app>',
    to: email,
    subject: '🌸 Compra confirmada — Pétalas adicionadas!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e91e8c;">🌸 Compra confirmada!</h1>
        <p>Olá${nome ? `, ${nome}` : ''}!</p>
        <p>Sua compra foi processada com sucesso:</p>
        <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p><strong>Pacote:</strong> ${pacote}</p>
          <p><strong>Pétalas adicionadas:</strong> ${petals.toLocaleString('pt-BR')} 🌸</p>
          <p><strong>Valor pago:</strong> R$ ${valor.toFixed(2)}</p>
        </div>
        <a href="https://petala.app/feed" style="background: #e91e8c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
          Usar minhas Pétalas
        </a>
        <p style="margin-top: 32px; color: #999; font-size: 12px;">Pétala — conteúdo exclusivo</p>
      </div>
    `,
  })
}
