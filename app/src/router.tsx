import { createBrowserRouter } from 'react-router-dom'

import Home from './routes/Home'
import UIGallery from './routes/UIGallery'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
    },
    ...(import.meta.env.DEV ? [{
        path: '/_ui',
        element: <UIGallery />,
    }]: [])
])