type MediaProps = {
  name: string
  videoUrl?: string | null
  imageUrl?: string | null
  muscleGroup?: string
  className?: string
}

/** Preferencia: imagen referenciada → video preview → icono de grupo. */
export function ExerciseMediaThumb({ name, videoUrl, imageUrl, muscleGroup, className }: MediaProps) {
  const fallback = `/exercises/icons/${(muscleGroup ?? 'chest').toLowerCase()}.svg`
  const cls = className ?? 'exercise-media-thumb'

  if (imageUrl) {
    return (
      <img
        className={cls}
        src={imageUrl}
        alt=""
        onError={(e) => {
          const img = e.currentTarget
          if (videoUrl && img.dataset.triedVideo !== '1') {
            img.dataset.triedVideo = '1'
            // Reemplazar por video si la imagen remota falla
            const parent = img.parentElement
            if (!parent) {
              img.src = fallback
              return
            }
            const video = document.createElement('video')
            video.className = cls
            video.src = `${videoUrl}#t=0.1`
            video.muted = true
            video.playsInline = true
            video.preload = 'metadata'
            video.setAttribute('aria-label', name)
            img.replaceWith(video)
            return
          }
          img.onerror = null
          img.src = fallback
        }}
      />
    )
  }

  if (videoUrl) {
    return (
      <video
        className={cls}
        src={`${videoUrl}#t=0.1`}
        muted
        playsInline
        preload="metadata"
        aria-label={name}
      />
    )
  }

  return <img className={cls} src={fallback} alt="" />
}
