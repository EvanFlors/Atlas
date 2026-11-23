import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Markdown } from '../components/Markdown/Markdown'
import { loadModule, ModuleNotFound } from '../lib/md/loader'
import { CATALOG } from '../lib/md/catalog'

export default function MDPreview() {
  const { categoria, modulo } = useParams<{ categoria: string; modulo: string }>()
  const [source, setSource] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!categoria || !modulo) return
    setSource(null)
    setError(null)
    loadModule(`${categoria}/${modulo}.md`)
      .then(setSource)
      .catch((e: unknown) => {
        if (e instanceof ModuleNotFound) setError(e.message)
        else setError(String(e))
      })
  }, [categoria, modulo])

    return (
        <main
        style={{
            padding: 'var(--space-6)',
            maxWidth: '960px',
            margin: '0 auto',
        }}
        >
            <nav
                style={{
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
                }}
            >
                Vista previa: {categoria} / {modulo}.md · {CATALOG.categorias.length} categorías,{' '}
                {CATALOG.categorias.reduce((n, c) => n + c.modulos.length, 0)} módulos.
            </nav>
            {error && <p style={{ color: 'crimson' }}>{error}</p>}
            <Markdown source={source} />
        </main>
    )
}