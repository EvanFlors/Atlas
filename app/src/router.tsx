import { createBrowserRouter } from 'react-router-dom'

import { Shell } from './components/Shell/Shell'
import Home from './routes/Home'
import CategoriaView from './routes/CategoriaView'
import ModuloView from './routes/ModuloView'
import NotFound from './routes/NotFound'
import UIGallery from './routes/UIGallery'
import MDPreview from './routes/MDPreview'

export const router = createBrowserRouter([
    {
        element: <Shell />,
        children: [
            { path: '/', element: <Home /> },
            { path: '/:categoria', element: <CategoriaView /> },
            { path: '/:categoria/:modulo', element: <ModuloView /> },
            { path: '*', element: <NotFound /> },
        ],
    },
    ...(import.meta.env.DEV
        ? [
              { path: '/_ui', element: <UIGallery /> },
              { path: '/_md/:categoria/:modulo', element: <MDPreview /> },
          ]
        : []),
])
