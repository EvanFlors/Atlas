import { useParams, Link } from 'react-router-dom'
import { CATALOG } from '../lib/md/catalog'
import { Breadcrumbs } from '../components/Shell/Breadcrumbs'
import NotFound from './NotFound'

export default function CategoriaView() {
  const { categoria } = useParams<{ categoria: string }>()
  const cat = CATALOG.categorias.find((c) => c.id === categoria)
  if (!cat) return <NotFound />
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        maxWidth: '72ch',
      }}
    >
      <Breadcrumbs />
      <h1>{cat.label}</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        {cat.modulos.length} módulos. Elige uno para empezar.
      </p>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {cat.modulos.map((mod) => (
          <li key={mod.id}>
            <Link to={`/${cat.id}/${mod.id}`}>{mod.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
