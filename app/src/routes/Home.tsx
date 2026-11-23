import { Link } from 'react-router-dom'
import { CATALOG } from '../lib/md/catalog'
import { Card } from '../components/ui/Card/Card'

export default function Home() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)',
        maxWidth: '72ch',
      }}
    >
      <h1>ATLAS · Portal de aprendizaje</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        66 módulos sobre Excel, Google Sheets, VBA y Apps Script. Elige una categoría para empezar.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {CATALOG.categorias.map((cat) => (
          <Link key={cat.id} to={`/${cat.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card>
              <strong>{cat.label}</strong>
              <p
                style={{
                  color: 'var(--color-text-muted)',
                  marginTop: 'var(--space-1)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {cat.modulos.length} módulos
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
