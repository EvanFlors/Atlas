export default function Home() {
  return (
    <main style={{ padding: 'var(--space-6)' }}>
      <h1>ATLAS · scaffold listo</h1>
      <p>React + Vite + TypeScript + React Router corriendo.</p>
      <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-muted)' }}>
        Galería de componentes en dev: <code>/_ui</code>
        <a href="/_ui" style={{ marginLeft: 'var(--space-2)' }}>Ir a galería</a>
      </p>
    </main>
  )
}