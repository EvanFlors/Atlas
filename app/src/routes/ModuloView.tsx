import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { Markdown } from '../components/Markdown/Markdown'
import { PrevNext } from '../components/Shell/PrevNext'
import { ModuleToolbar } from '../components/Shell/ModuleToolbar'
import { loadModule, ModuleNotFound } from '../lib/md/loader'
import { CATALOG } from '../lib/md/catalog'
import { useProgress } from '../lib/progress/store'
import NotFound from './NotFound'

export default function ModuloView() {
  const { categoria, modulo } = useParams<{ categoria: string; modulo: string }>()
  const { pathname } = useLocation()
  const { setLast } = useProgress()
  const cat = CATALOG.categorias.find((c) => c.id === categoria)
  const mod = cat?.modulos.find((m) => m.id === modulo)

  const [source, setSource] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mod) return
    setSource(null)
    setError(null)
    loadModule(mod.path)
      .then(setSource)
      .catch((e: unknown) => {
        if (e instanceof ModuleNotFound) setError(e.message)
        else setError(String(e))
      })
  }, [mod])

  useEffect(() => {
    if (mod) setLast(pathname)
  }, [mod, pathname, setLast])

  if (!cat || !mod) return <NotFound />
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>
  return (
    <>
      <ModuleToolbar moduloId={mod.id} source={source} />
      <Markdown source={source} currentCategoriaFolder={cat.folder} moduloId={mod.id} />
      <PrevNext categoriaId={cat.id} moduloId={mod.id} />
    </>
  )
}
