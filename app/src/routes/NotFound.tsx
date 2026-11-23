import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        maxWidth: '72ch',
      }}
    >
      <h1>No encontrado</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Esta ruta no corresponde a ninguna categoría o módulo del catálogo.
      </p>
      <Link to="/">Volver al inicio</Link>
    </div>
  )
}
