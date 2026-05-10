// lib/r2.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2_ACCESS_KEY  = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_KEY  = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET      = process.env.R2_BUCKET ?? 'petala-fotos'
const R2_PUBLIC_URL  = process.env.R2_PUBLIC_URL!
const R2_ENDPOINT    = process.env.R2_ENDPOINT!

const r2 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId:     R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
})

export async function createUploadUrl(params: {
  key: string
  contentType: string
  expiresInSeconds?: number
}): Promise<{ uploadUrl: string; key: string }> {
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
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key:    key,
  })
  return getSignedUrl(r2, command, { expiresIn: expiresInSeconds })
}

export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`
}

export async function deleteObject(key: string): Promise<void> {
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