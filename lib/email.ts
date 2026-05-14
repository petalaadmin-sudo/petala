import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function enviarEmailBoasVindas(email: string, nome: string) {
  await resend.emails.send({
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

export async function enviarEmailCompraPetals(
  email: string,
  nome: string,
  petals: number,
  pacote: string,
  valor: number
) {
  await resend.emails.send({
    from: 'Pétala <onboarding@resend.dev>',
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