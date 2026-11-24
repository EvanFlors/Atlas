import { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { Shell } from './components/Shell/Shell'
import Home from './routes/Home'
import CategoriaView from './routes/CategoriaView'
import NotFound from './routes/NotFound'

// Lazy: rutas pesadas (traen react-markdown + rehype-highlight + mermaid).
// Mantener fuera del bundle inicial baja ~150KB gzip del main.
const ModuloView = lazy(() => import('./routes/ModuloView'))
const UIGallery = lazy(() => import('./routes/UIGallery'))
const MDPreview = lazy(() => import('./routes/MDPreview'))

function withSuspense(node: React.ReactNode) {
  return (
    <Suspense fallback={<p style={{ padding: 'var(--space-5)', color: 'var(--color-text-muted)' }}>Cargando…</p>}>
      {node}
    </Suspense>
  )
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export const router = createBrowserRouter(
  [
    {
      element: <Shell />,
      children: [
        { path: '/', element: <Home /> },
        { path: '/:categoria', element: <CategoriaView /> },
        { path: '/:categoria/:modulo', element: withSuspense(<ModuloView />) },
        { path: '*', element: <NotFound /> },
      ],
    },
    ...(import.meta.env.DEV
      ? [
          { path: '/_ui', element: withSuspense(<UIGallery />) },
          { path: '/_md/:categoria/:modulo', element: withSuspense(<MDPreview />) },
        ]
      : []),
  ],
  { basename },
)
