// lib/r2.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET ?? process.env.R2_BUCKET_NAME ?? 'petala-fotos'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? process.env.NEXT_PUBLIC_R2_PUBLIC_URL
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ENDPOINT = process.env.R2_ENDPOINT ?? (
  R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined
)

export class R2ConfigError extends Error {
  code = 'R2_CONFIG_MISSING'

  constructor(public missing: string[]) {
    super(`R2 configuration missing: ${missing.join(', ')}`)
  }
}

function requireSigningConfig() {
  const missing: string[] = []

  if (!R2_ACCESS_KEY) missing.push('R2_ACCESS_KEY_ID')
  if (!R2_SECRET_KEY) missing.push('R2_SECRET_ACCESS_KEY')
  if (!R2_ENDPOINT) missing.push('R2_ENDPOINT')
  if (!R2_BUCKET) missing.push('R2_BUCKET')

  if (missing.length > 0) {
    throw new R2ConfigError(missing)
  }
}

function requirePublicUrl() {
  if (!R2_PUBLIC_URL) {
    throw new R2ConfigError(['R2_PUBLIC_URL'])
  }
}

function createR2Client() {
  requireSigningConfig()

  return new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId:     R2_ACCESS_KEY!,
      secretAccessKey: R2_SECRET_KEY!,
    },
  })
}

export async function createUploadUrl(params: {
  key: string
  contentType: string
  expiresInSeconds?: number
}): Promise<{ uploadUrl: string; key: string }> {
  const r2 = createR2Client()
  const command = new PutObjectCommand({
    Bucket:      R2_BUCKET,
    Key:         params.key,
    ContentType: params.contentType,
    Metadata: {
      'uploaded-at': new Date().toISOString(),
    },
  })
  const uploadUrl = await getSignedUrl(r2, command, {
    expiresIn: params.expiresInSeconds ?? 300,
  })
  return { uploadUrl, key: params.key }
}

export async function createPrivateUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const r2 = createR2Client()
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key:    key,
  })
  return getSignedUrl(r2, command, { expiresIn: expiresInSeconds })
}

export function getPublicUrl(key: string): string {
  requirePublicUrl()
  return `${R2_PUBLIC_URL}/${key}`
}

export async function deleteObject(key: string): Promise<void> {
  const r2 = createR2Client()
  await r2.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key:    key,
  }))
}

export function generatePhotoKey(creatorId: string, suffix = ''): string {
  const uuid = crypto.randomUUID()
  const ts   = Date.now()
  return `creators/${creatorId}/${ts}-${uuid}${suffix}.jpg`
}

export function isValidImageType(contentType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(contentType)
}

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
