import { Link, useLocation } from 'react-router-dom'
import { CATALOG } from '../../lib/md/catalog'

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return null
  const [categoriaId, moduloId] = parts
  const cat = CATALOG.categorias.find((c) => c.id === categoriaId)
  if (!cat) return null

  return (
    <nav
      aria-label="Ruta"
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--space-4)',
      }}
    >
      <Link to="/" style={{ color: 'inherit' }}>Home</Link>
      <span>/</span>
      {moduloId ? (
        <>
          <Link to={`/${cat.id}`} style={{ color: 'inherit' }}>{cat.label}</Link>
          <span>/</span>
          <span style={{ color: 'var(--color-text)' }}>{moduloId}</span>
        </>
      ) : (
        <span style={{ color: 'var(--color-text)' }}>{cat.label}</span>
      )}
    </nav>
  )
}
