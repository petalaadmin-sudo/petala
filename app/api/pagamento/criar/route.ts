import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

const PACOTES = [
  { id: 'starter', title: '360 Pétalas', petalas: 360, price: 15.10 },
  { id: 'popular', title: '650 Pétalas', petalas: 650, price: 25.80 },
  { id: 'plus', title: '1.250 Pétalas', petalas: 1250, price: 46.50 },
  { id: 'premium', title: '1.800 Pétalas', petalas: 1800, price: 61.60 },
  { id: 'pro', title: '3.500 Pétalas', petalas: 3500, price: 113.70 },
  { id: 'elite', title: '7.000 Pétalas', petalas: 7000, price: 215.60 },
  { id: 'master', title: '15.000 Pétalas', petalas: 15000, price: 454.20 },
  { id: 'diamond', title: '35.000 Pétalas', petalas: 35000, price: 1036.00 },
]

export async function POST(request: Request) {
  const { pacoteId, userId } = await request.json()
  const pacote = PACOTES.find(p => p.id === pacoteId)
  if (!pacote) return NextResponse.json({ error: 'Pacote inválido' }, { status: 400 })

  const preference = new Preference(client)
  const result = await preference.create({
    body: {
      items: [{
        id: pacote.id,
        title: pacote.title,
        quantity: 1,
        unit_price: pacote.price,
        currency_id: 'BRL',
      }],
      metadata: { user_id: userId, petalas: pacote.petalas },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/pix/sucesso`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/pix`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/pix/pendente`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pagamento/webhook`,
    }
  })

  return NextResponse.json({ url: result.init_point })
}