import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ApplicationPayload = {
  agency_name?: unknown
  responsible_name?: unknown
  email?: unknown
  whatsapp?: unknown
  country?: unknown
  recruitment_experience?: unknown
  expected_creators_count?: unknown
  social_links?: unknown
  notes?: unknown
}

const asText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const trimTo = (value: string, max: number) => value.slice(0, max)

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ApplicationPayload

    const agencyName = trimTo(asText(payload.agency_name), 140)
    const responsibleName = trimTo(asText(payload.responsible_name), 140)
    const email = trimTo(asText(payload.email).toLowerCase(), 180)
    const whatsapp = trimTo(asText(payload.whatsapp), 40)
    const country = trimTo(asText(payload.country), 80)
    const recruitmentExperience = trimTo(asText(payload.recruitment_experience), 3000)
    const socialLinks = trimTo(asText(payload.social_links), 2000) || null
    const notes = trimTo(asText(payload.notes), 3000) || null
    const expectedCreatorsCount = Number(payload.expected_creators_count)

    if (!agencyName || !responsibleName || !email || !whatsapp || !country || !recruitmentExperience) {
      return NextResponse.json(
        { success: false, error: 'Preencha todos os campos obrigatorios.' },
        { status: 400 }
      )
    }

    if (!isEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Informe um email valido.' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(expectedCreatorsCount) || expectedCreatorsCount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Informe uma estimativa valida de criadoras.' },
        { status: 400 }
      )
    }

    const admin = createAdminClient() as any

    const { data: existing, error: existingError } = await admin
      .from('agency_applications')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle()

    if (existingError) {
      console.error('[agencia/applications] duplicate check', existingError)
      return NextResponse.json(
        { success: false, error: 'Erro ao verificar candidatura.' },
        { status: 500 }
      )
    }

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ja existe uma candidatura pendente para este email.' },
        { status: 409 }
      )
    }

    const { error: insertError } = await admin.from('agency_applications').insert({
      agency_name: agencyName,
      responsible_name: responsibleName,
      email,
      whatsapp,
      country,
      recruitment_experience: recruitmentExperience,
      expected_creators_count: expectedCreatorsCount,
      social_links: socialLinks,
      notes,
      status: 'pending',
    })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Ja existe uma candidatura pendente para este email.' },
          { status: 409 }
        )
      }

      console.error('[agencia/applications] insert', insertError)
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar candidatura.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Candidatura recebida. Nossa equipe vai revisar seus dados.',
    })
  } catch (err) {
    console.error('[agencia/applications]', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao processar candidatura.' },
      { status: 500 }
    )
  }
}
