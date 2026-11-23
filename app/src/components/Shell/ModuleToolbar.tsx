import { useMemo } from 'react'
import { FiList } from 'react-icons/fi'
import { useProgress } from '../../lib/progress/store'
import { sectionSlug } from '../../lib/progress/slug'
import { FavoriteButton } from './FavoriteButton'
import styles from './Shell.module.css'

type Props = { moduloId: string; source: string | null }

export function ModuleToolbar({ moduloId, source }: Props) {
  const { state } = useProgress()

  const headings = useMemo(() => {
    if (!source) return [] as { title: string; key: string }[]
    const out: { title: string; key: string }[] = []
    const re = /^##\s+(.+?)\s*$/gm
    let m: RegExpExecArray | null
    let i = 0
    while ((m = re.exec(source)) !== null) {
      out.push({ title: m[1], key: `${sectionSlug(m[1])}-${i++}` })
    }
    return out
  }, [source])

  const total = headings.length
  const done = headings.filter((h) => state.sections[`${moduloId}|${h.key}`]).length
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div className={styles.toolbar}>
      <div className={styles.progressWrap} aria-label={`Progreso: ${pct}%`}>
        <div className={styles.progressBar} style={{ width: `${pct}%` }} />
        <span className={styles.progressLabel}>
          {done}/{total} · {pct}%
        </span>
      </div>
      {total > 0 && (
        <details className={styles.tocDetails}>
          <summary className={styles.tocSummary}>
            <FiList /> Secciones
          </summary>
          <ul className={styles.tocList}>
            {headings.map((h) => (
              <li key={h.key}>
                <a href={`#${h.key}`}>{h.title}</a>
              </li>
            ))}
          </ul>
        </details>
      )}
      <FavoriteButton moduloId={moduloId} />
    </div>
  )
}
