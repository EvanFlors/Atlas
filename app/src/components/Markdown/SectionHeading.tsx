import type { ReactNode } from 'react'
import { useProgress } from '../../lib/progress/store'
import styles from './Markdown.module.css'

type Props = {
  moduloId: string
  sectionKey: string
  children: ReactNode
}

export function SectionHeading({ moduloId, sectionKey, children }: Props) {
  const { isSection, toggleSection } = useProgress()
  const checked = isSection(moduloId, sectionKey)
  return (
    <h2 id={sectionKey} className={styles.sectionHeading}>
      <label className={styles.sectionCheck}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => toggleSection(moduloId, sectionKey)}
          aria-label="Marcar sección como estudiada"
        />
      </label>
      <span>{children}</span>
    </h2>
  )
}
