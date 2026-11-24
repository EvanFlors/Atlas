import { useEffect } from 'react'
import { FiX } from 'react-icons/fi'
import styles from './Markdown.module.css'

type Props = { src: string; alt: string; onClose: () => void }

export function ImageModal({ src, alt, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      className={styles.modalBackdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Imagen ampliada"
    >
      <img
        src={src}
        alt={alt}
        className={styles.modalImg}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={onClose}
        className={styles.modalClose}
        aria-label="Cerrar"
      >
        <FiX />
      </button>
    </div>
  )
}
