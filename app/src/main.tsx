import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router.tsx'
import { ProgressProvider } from './lib/progress/store'

import './styles/tokens.css'
import './styles/fonts.css'
import './styles/base.css'
import 'highlight.js/styles/github-dark.css'
import 'katex/dist/katex.min.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider>
      <RouterProvider router={router} />
    </ProgressProvider>
  </StrictMode>,
)
