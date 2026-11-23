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
    <>
      <div className={styles.progressBarWrap} aria-label={`Progreso: ${pct}%`}>
        <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
        <span className={styles.progressLabel}>
          {done}/{total} · {pct}%
        </span>
      </div>
      <div className={styles.moduleActions}>
        {total > 0 && (
          <details className={styles.tocDetails}>
            <summary className={styles.tocSummary}>
              <FiList /> Secciones
            </summary>
            <ul className={styles.tocList}>
              {headings.map((h) => (
                <li key={h.key}>
                  <a
                    href={`#${h.key}`}
                    onClick={(e) => {
                      e.preventDefault()
                      const el = document.getElementById(h.key)
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      const details = e.currentTarget.closest('details')
                      if (details) details.removeAttribute('open')
                    }}
                  >
                    {h.title}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
        <FavoriteButton moduloId={moduloId} />
      </div>
    </>
  )
}
