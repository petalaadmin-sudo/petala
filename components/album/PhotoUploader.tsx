// components/album/PhotoUploader.tsx
// Usado na área da criadora para fazer upload de novas fotos
'use client'

import { usePhotoUpload } from '@/lib/hooks/usePhotoUpload'
import { useRef, useState, DragEvent } from 'react'

interface Props {
  onUploaded?: (photo: { photo_id: string; blur_hash: string; public_url: string }) => void
}

const PRICE_OPTIONS = [
  { label: '50 🌸',  value: 50  },
  { label: '100 🌸', value: 100 },
  { label: '150 🌸', value: 150 },
]

export function PhotoUploader({ onUploaded }: Props) {
  const { status, progress, error, result, upload, reset } = usePhotoUpload()

  const [preview, setPreview]     = useState<string | null>(null)
  const [isFree, setIsFree]       = useState(false)
  const [price, setPrice]         = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return

    // Preview local imediato
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    const file = inputRef.current?.files?.[0]
    if (!file) return

    const uploaded = await upload(file, { is_free: isFree, price_petals: isFree ? 0 : price })
    if (uploaded) onUploaded?.(uploaded)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
      // Injeta no input para o handleUpload encontrar
      const dt = new DataTransfer()
      dt.items.add(file)
      if (inputRef.current) inputRef.current.files = dt.files
    }
  }

  // ── ESTADO: Concluído ──────────────────────────────────────
  if (status === 'done' && result) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/35 flex items-center justify-center text-2xl">
          ✓
        </div>
        <div>
          <div className="text-white text-sm font-medium text-center">Foto publicada!</div>
          <div className="text-white/35 text-xs text-center mt-1">já aparece no seu álbum</div>
        </div>
        {preview && (
          <img src={preview} alt="" className="w-24 h-24 object-cover rounded-xl border border-white/10" />
        )}
        <button
          onClick={() => { reset(); setPreview(null) }}
          className="bg-[#ff4d7d] text-white rounded-xl px-6 py-2.5 text-sm font-medium"
        >
          Adicionar outra foto
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Área de drop / preview */}
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl h-44 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            isDragging
              ? 'border-[#ff4d7d] bg-[#ff4d7d]/5'
              : 'border-white/15 bg-[#0d0d0d] hover:border-[#ff4d7d]/40'
          }`}
        >
          <div className="text-3xl">📸</div>
          <div className="text-white/40 text-xs text-center leading-relaxed">
            Toque para escolher<br />ou arraste a foto aqui
          </div>
          <div className="text-white/20 text-[10px]">JPEG, PNG ou WebP · máx 20MB</div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden h-44">
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <button
            onClick={() => { setPreview(null); reset(); if (inputRef.current) inputRef.current.value = '' }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white/70 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {/* Configurações de preço */}
      <div className="bg-[#111] rounded-xl p-4 border border-white/5">
        {/* Toggle grátis */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white text-xs font-medium">Foto gratuita</div>
            <div className="text-white/30 text-[10px]">aparece para todos sem custo</div>
          </div>
          <button
            onClick={() => setIsFree(v => !v)}
            className={`w-10 h-6 rounded-full transition-colors relative ${isFree ? 'bg-[#ff4d7d]' : 'bg-white/10'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isFree ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Seletor de preço (só se não for grátis) */}
        {!isFree && (
          <div>
            <div className="text-white/40 text-[10px] mb-2 uppercase tracking-wider">Preço para desbloquear</div>
            <div className="flex gap-2">
              {PRICE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPrice(opt.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    price === opt.value
                      ? 'bg-[#ff4d7d] text-white'
                      : 'bg-[#1a1a1a] text-white/50 border border-white/8'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progresso */}
      {(status === 'processing' || status === 'uploading' || status === 'confirming') && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/40">
              {status === 'processing'  ? 'Processando imagem…'
               : status === 'uploading'  ? 'Enviando para o servidor…'
               : 'Finalizando…'}
            </span>
            <span className="text-white/40">{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#ff4d7d] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/25 rounded-xl p-3 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Botão de envio */}
      <button
        onClick={handleUpload}
        disabled={!preview || status !== 'idle'}
        className="w-full bg-[#ff4d7d] text-white rounded-xl py-3 text-sm font-medium disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {status !== 'idle' ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publicando…</>
        ) : (
          `Publicar foto${!isFree ? ` · ${price} 🌸` : ' · gratuita'}`
        )}
      </button>

      <p className="text-white/20 text-[10px] text-center leading-relaxed">
        Ao publicar você confirma que tem os direitos da imagem e que ela segue as diretrizes da plataforma.
      </p>
    </div>
  )
}
