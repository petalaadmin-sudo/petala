"use client"

import { useEffect, useState, type SyntheticEvent } from "react"

type PhotoSourceMode = "original" | "signed" | "fallback"

type CreatorAvatarImageProps = {
  creatorId: string
  photoUrl?: string | null
  name?: string | null
  className?: string
  fallbackClassName?: string
}

function getFallbackLabel(name?: string | null) {
  const trimmedName = name?.trim()

  if (!trimmedName) {
    return "P"
  }

  return trimmedName.charAt(0).toUpperCase()
}

export function CreatorAvatarImage({
  creatorId,
  photoUrl,
  name,
  className = "h-full w-full object-cover",
  fallbackClassName = "flex h-full w-full items-center justify-center bg-[#2a1220] text-white/70",
}: CreatorAvatarImageProps) {
  const [photoSourceMode, setPhotoSourceMode] = useState<PhotoSourceMode>("original")

  const originalPhotoSrc = photoUrl || null
  const signedPhotoSrc = originalPhotoSrc
    ? `/api/fotos/perfil-url?creator_id=${encodeURIComponent(creatorId)}`
    : null

  const currentPhotoSrc =
    photoSourceMode === "original"
      ? originalPhotoSrc
      : photoSourceMode === "signed"
        ? signedPhotoSrc
        : null

  useEffect(() => {
    setPhotoSourceMode("original")
  }, [creatorId, originalPhotoSrc, signedPhotoSrc])

  function handlePhotoError(event: SyntheticEvent<HTMLImageElement>) {
    const failedSrc = event.currentTarget.getAttribute("src")

    setPhotoSourceMode((currentMode) => {
      if (currentMode === "original" && failedSrc === originalPhotoSrc && signedPhotoSrc) {
        return "signed"
      }

      if (currentMode === "signed" && failedSrc === signedPhotoSrc) {
        return "fallback"
      }

      return currentMode
    })
  }

  if (currentPhotoSrc) {
    return (
      <img
        src={currentPhotoSrc}
        alt={name ?? "Criadora"}
        className={className}
        onError={handlePhotoError}
      />
    )
  }

  return (
    <div
      className={fallbackClassName}
      aria-label={name ? `Foto de ${name}` : "Foto da criadora"}
    >
      {getFallbackLabel(name)}
    </div>
  )
}
