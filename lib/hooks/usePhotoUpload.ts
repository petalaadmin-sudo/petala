// lib/hooks/usePhotoUpload.ts
'use client'

import { useState, useCallback } from 'react'

type UploadStatus = 'idle' | 'processing' | 'uploading' | 'confirming' | 'done' | 'error'

interface UploadedPhoto {
  photo_id: string
  blur_hash: string
  public_url: string
  blur_url: string
}

interface UsePhotoUploadReturn {
  status: UploadStatus
  progress: number          // 0–100
  error: string | null
  result: UploadedPhoto | null
  upload: (file: File, options: UploadOptions) => Promise<UploadedPhoto | null>
  reset: () => void
}

interface UploadOptions {
  is_free?: boolean
  price_petals?: number
}

export function usePhotoUpload(): UsePhotoUploadReturn {
  const [status, setStatus]     = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError]       = useState<string | null>(null)
  const [result, setResult]     = useState<UploadedPhoto | null>(null)

  const upload = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadedPhoto | null> => {

    setStatus('processing')
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      // ── ETAPA 1: Pede URL de upload ao servidor (10%) ──
      setProgress(10)
      const urlRes = await fetch('/api/fotos/upload-url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: file.type || 'image/jpeg',
          file_size:    file.size,
          is_free:      options.is_free ?? false,
          price_petals: options.price_petals ?? 50,
        }),
      })

      if (!urlRes.ok) {
        const err = await urlRes.json()
        throw new Error(err.error ?? 'Erro ao obter URL de upload')
      }

      const { photo_id, upload_url, blur_upload_url } = await urlRes.json()
      setProgress(20)

      // ── ETAPA 2: Comprime imagem no browser antes de enviar ──
      // Usa canvas para reduzir tamanho sem depender do servidor
      const compressedBlob = await compressImage(file, 1920, 0.88)
      const blurBlob       = await compressImage(file, 40, 0.4, true)
      setProgress(35)

      // ── ETAPA 3: Upload direto no R2 com progresso ──
      setStatus('uploading')

      await Promise.all([
        uploadWithProgress(upload_url, compressedBlob, (pct) => {
          // Progresso do upload principal: de 35% a 75%
          setProgress(35 + Math.round(pct * 0.4))
        }),
        // Blur sobe em paralelo (menor, muito rápido)
        fetch(blur_upload_url, {
          method:  'PUT',
          headers: { 'Content-Type': 'image/jpeg' },
          body:    blurBlob,
        }),
      ])

      setProgress(80)

      // ── ETAPA 4: Confirma no servidor (gera blur hash final) ──
      setStatus('confirming')
      const confirmRes = await fetch('/api/fotos/confirmar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ photo_id }),
      })

      if (!confirmRes.ok) {
        const err = await confirmRes.json()
        throw new Error(err.error ?? 'Erro ao confirmar foto')
      }

      const uploaded: UploadedPhoto = await confirmRes.json()
      setProgress(100)
      setStatus('done')
      setResult(uploaded)
      return uploaded

    } catch (err: any) {
      console.error('[usePhotoUpload]', err)
      setError(err.message ?? 'Erro desconhecido')
      setStatus('error')
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress(0)
    setError(null)
    setResult(null)
  }, [])

  return { status, progress, error, result, upload, reset }
}

// ── Comprime imagem no browser usando Canvas API ──
async function compressImage(
  file: File,
  maxWidth: number,
  quality: number,
  blur = false
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const scale  = Math.min(1, maxWidth / img.width)
      const width  = Math.round(img.width  * scale)
      const height = Math.round(img.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height

      const ctx = canvas.getContext('2d')!
      if (blur) {
        ctx.filter = 'blur(8px)'
      }
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob falhou')),
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Falha ao carregar imagem'))
    img.src = url
  })
}

// ── Upload com progresso via XMLHttpRequest ──
// fetch() não suporta progresso de upload nativamente
function uploadWithProgress(
  url: string,
  blob: Blob,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(e.loaded / e.total)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload falhou: HTTP ${xhr.status}`))
    })

    xhr.addEventListener('error', () => reject(new Error('Erro de rede no upload')))
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelado')))

    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', 'image/jpeg')
    xhr.send(blob)
  })
}
