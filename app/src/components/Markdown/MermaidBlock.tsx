import { useEffect, useState } from 'react'
import { Code } from '../ui/Code/Code'

type Props = { source: string }

function resolvedTheme(): 'default' | 'dark' {
  return typeof document !== 'undefined' &&
    document.documentElement.dataset.theme === 'dark'
    ? 'dark'
    : 'default'
}

export function MermaidBlock({ source }: Props) {
  const [svg, setSvg] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    import('mermaid')
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, theme: resolvedTheme(), securityLevel: 'strict' })
        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`
        try {
          const { svg } = await mermaid.render(id, source)
          if (!cancelled) setSvg(svg)
        } catch {
          if (!cancelled) setFailed(true)
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [source])

  if (failed || !svg) {
    // shortcut: mientras carga se ve código plano; aceptable, upgrade con skeleton si molesta
    return <Code block>{source}</Code>
  }
  return <div dangerouslySetInnerHTML={{ __html: svg }} />
}
