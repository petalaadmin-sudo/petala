// lib/blurhash.ts
// Gera blur hash de uma imagem para mostrar placeholder enquanto carrega
// ou como "preview borrado" de fotos bloqueadas
// npm install sharp blurhash

import sharp from 'sharp'
import { encode } from 'blurhash'

// ── Gera o blurhash de um buffer de imagem ──
export async function generateBlurHash(
  imageBuffer: Buffer,
  options = { componentX: 4, componentY: 3 }
): Promise<string> {
  // Reduz para thumbnail pequeno antes de calcular (muito mais rápido)
  const { data, info } = await sharp(imageBuffer)
    .resize(32, 32, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // blurhash espera Uint8ClampedArray
  const pixels = new Uint8ClampedArray(data)

  return encode(
    pixels,
    info.width,
    info.height,
    options.componentX,
    options.componentY
  )
}

// ── Gera versão borrada da imagem (JPEG, muito comprimido) ──
// Salva no R2 como arquivo separado (_blur.jpg)
// Serve como preview "esfumaçado" de foto bloqueada — sem revelar conteúdo
export async function generateBlurredPreview(
  imageBuffer: Buffer
): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(40, 40, { fit: 'inside' })   // thumbnail minúsculo
    .blur(12)                             // borrado pesado
    .jpeg({ quality: 40 })               // comprimido (apenas placeholder)
    .toBuffer()
}

// ── Extrai dimensões da imagem ──
export async function getImageDimensions(
  imageBuffer: Buffer
): Promise<{ width: number; height: number }> {
  const meta = await sharp(imageBuffer).metadata()
  return {
    width:  meta.width  ?? 0,
    height: meta.height ?? 0,
  }
}

// ── Valida e normaliza imagem para upload ──
// Redimensiona se muito grande, converte para JPEG, remove EXIF
export async function processImageForUpload(
  inputBuffer: Buffer,
  maxWidth = 1920
): Promise<Buffer> {
  return sharp(inputBuffer)
    .rotate()                       // corrige orientação EXIF automaticamente
    .resize(maxWidth, undefined, {  // mantém proporção, limita largura
      fit: 'inside',
      withoutEnlargement: true,
    })
    .withMetadata({ exif: {} })     // remove EXIF (privacidade — sem GPS)
    .jpeg({ quality: 88, progressive: true })
    .toBuffer()
}
