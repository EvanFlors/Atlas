import { Link } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { getAdjacent } from '../../lib/md/adjacent'
import styles from './Shell.module.css'

type Props = { categoriaId: string; moduloId: string }

export function PrevNext({ categoriaId, moduloId }: Props) {
  const { prev, next } = getAdjacent(categoriaId, moduloId)
  if (!prev && !next) return null
  return (
    <nav aria-label="Navegación entre módulos" className={styles.prevNext}>
      {prev ? (
        <Link to={`/${categoriaId}/${prev.id}`} className={`${styles.prevNextLink} ${styles.prevNextPrev}`}>
          <FiArrowLeft className={styles.prevNextIcon} />
          <span className={styles.prevNextText}>
            <span className={styles.prevNextDir}>Anterior</span>
            <span className={styles.prevNextName}>{prev.label}</span>
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link to={`/${categoriaId}/${next.id}`} className={`${styles.prevNextLink} ${styles.prevNextNext}`}>
          <span className={styles.prevNextText}>
            <span className={styles.prevNextDir}>Siguiente</span>
            <span className={styles.prevNextName}>{next.label}</span>
          </span>
          <FiArrowRight className={styles.prevNextIcon} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
