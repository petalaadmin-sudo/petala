import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { requireAuth } from '@/lib/auth/api-auth'

const PACOTES: Record<string, { name: string; petals: number; price: number }> = {
  'Semente':        { name: 'Semente',        petals: 360,   price: 1510  },
  'Buquê':          { name: 'Buquê',           petals: 650,   price: 2580  },
  'Jardim':         { name: 'Jardim',          petals: 1250,  price: 4650  },
  'Paraíso':        { name: 'Paraíso',         petals: 1800,  price: 6160  },
  'Pétala de Ouro': { name: 'Pétala de Ouro',  petals: 3500,  price: 11370 },
  'Florescer':      { name: 'Florescer',       petals: 7000,  price: 21560 },
  'Plena Flor':     { name: 'Plena Flor',      petals: 15000, price: 45420 },
  'Jardim Eterno':  { name: 'Jardim Eterno',   petals: 35000, price: 103600},
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const { packageName } = body

    const pacote = PACOTES[packageName]
    if (!pacote) return NextResponse.json({ error: 'Pacote inválido' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: `${pacote.petals} Pétalas — ${pacote.name}`,
            description: 'Pétala App — Moeda virtual',
          },
          unit_amount: pacote.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/perfil?checkout=stripe`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/perfil`,
      metadata: {
        user_id: auth.user.id,
        package_name: pacote.name,
        petals: String(pacote.petals),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/criar-sessao]', err)
    return NextResponse.json({ error: 'Erro ao criar sessão' }, { status: 500 })
  }
}
