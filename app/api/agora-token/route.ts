import { NextRequest, NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-token'

export async function POST(req: NextRequest) {
  try {
    const { channelName, uid } = await req.json()

    const appId = process.env.AGORA_APP_ID!
    const appCertificate = process.env.AGORA_APP_CERTIFICATE!
    const expirationTimeInSeconds = 3600
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs
    )

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Erro ao gerar token:', error)
    return NextResponse.json({ error: 'Erro ao gerar token' }, { status: 500 })
  }
}