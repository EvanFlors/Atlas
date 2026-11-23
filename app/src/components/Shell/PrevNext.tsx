import { Link } from 'react-router-dom'
import { Button } from '../ui/Button/Button'
import { getAdjacent } from '../../lib/md/adjacent'

type Props = { categoriaId: string; moduloId: string }

export function PrevNext({ categoriaId, moduloId }: Props) {
  const { prev, next } = getAdjacent(categoriaId, moduloId)
  if (!prev && !next) return null
  return (
    <nav
      aria-label="Navegación entre módulos"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-7)',
        paddingTop: 'var(--space-5)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div>
        {prev && (
          <Link to={`/${categoriaId}/${prev.id}`} style={{ textDecoration: 'none' }}>
            <Button variant="ghost">← {prev.id} · {prev.label}</Button>
          </Link>
        )}
      </div>
      <div>
        {next && (
          <Link to={`/${categoriaId}/${next.id}`} style={{ textDecoration: 'none' }}>
            <Button variant="ghost">{next.id} · {next.label} →</Button>
          </Link>
        )}
      </div>
    </nav>
  )
}
