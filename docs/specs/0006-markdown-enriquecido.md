# 0006 · Markdown enriquecido (highlight + Mermaid)

**Status**: Accepted
**Date**: 2026-11-23
**Feature**: scope.md · Feature 7 (Slice 2 Render)
**Build approach**: Skateboard

## Summary

Suma dos piezas al `<Markdown />` existente: syntax highlighting en bloques de código (`rehype-highlight` + highlight.js, un plugin rehype) y render de diagramas Mermaid (lazy import del paquete, render client-side con fallback al texto plano). GFM ya entró en Feature 3; aquí no se toca.

## Requirements

- **AC-1**: Bloques de código con lenguaje (` ```ts `, ` ```python `, ` ```sql `, ` ```vba `) se renderizan con syntax highlighting en ambos temas (light y dark).
- **AC-2**: Bloques de código sin lenguaje o con un lenguaje desconocido se renderizan sin colores pero con el chasis mono de Feature 3 (no revientan).
- **AC-3**: Bloques ` ```mermaid ` se renderizan como diagramas SVG mediante lazy import del paquete `mermaid`.
- **AC-4**: Si falla la carga de `mermaid` (offline, 404) o un diagrama tiene sintaxis inválida, el bloque muestra el código fuente como texto plano dentro del chasis `<Code block>`. No revienta la página.
- **AC-5**: El bundle principal no crece más de ~50KB gzip por `rehype-highlight`. `mermaid` sigue fuera del bundle principal (chunk propio, lazy).
- **AC-6**: `npm run build` sigue en verde, chunks siguen separados por módulo.
- **AC-7**: `app/src/components/Markdown/Markdown.module.css` se actualiza con los estilos de `highlight.js` adaptados a nuestros tokens (fondo `var(--color-code-bg)`, scroll horizontal, etc.).

## Decision

| Pieza | Elección | Por qué (una línea) |
|---|---|---|
| Syntax highlight | `rehype-highlight` v7+ | Plugin rehype, encaja con el pipeline que ya tenemos; highlight.js común y conocido. |
| Mermaid | Paquete `mermaid` con lazy import dentro de `<MermaidBlock>` | Keeps ~500KB fuera del bundle principal; render en `useEffect` cuando el componente monta. |
| Tema de highlight | Un CSS importado (`github.css` para light, `github-dark.css` para dark) con switch vía atributo `data-theme` en `<html>` | Ya tenemos el toggle de tema con data-theme; aplicar `.hljs` dentro de cada rama es natural. |

**Dependencias nuevas:** 2 (`rehype-highlight`, `mermaid`).

## Design

### Pipeline markdown

El único cambio en `Markdown.tsx`:

```tsx
import rehypeHighlight from 'rehype-highlight'
import { MermaidBlock } from './MermaidBlock'

// ...

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
  components={{
    // ... resto igual
    pre({ children }) {
      const codeEl = children as any
      const codeClassName: string = codeEl?.props?.className ?? ''
      const inner = codeEl?.props?.children ?? children
      const lang = /language-(\w+)/.exec(codeClassName)?.[1]
      if (lang === 'mermaid') {
        return <MermaidBlock source={String(inner).trim()} />
      }
      return <Code block>{inner}</Code>  // el plugin rehype-highlight ya aplicó clases hljs al inner
    },
    // ...
  }}
>
```

### `MermaidBlock.tsx`

```tsx
import { useEffect, useRef, useState } from 'react'
import { Code } from '../ui/Code/Code'

type Props = { source: string }

export function MermaidBlock({ source }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    import('mermaid')
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, theme: resolvedTheme() })
        try {
          const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`
          const { svg } = await mermaid.render(id, source)
          if (!cancelled) setSvg(svg)
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : String(e))
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [source])

  if (error) {
    return <Code block>{source}</Code>  // fallback: texto plano
  }
  if (!svg) {
    return <Code block>{source}</Code>  // mientras carga, texto plano
  }
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />
}

function resolvedTheme(): 'default' | 'dark' {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default'
}
```

shortcut: el tema de Mermaid se decide al montar; si el usuario cambia de tema mientras ve un diagrama, no se re-renderiza. Upgrade cuando sea molesto: escuchar `MutationObserver` sobre `data-theme` del `<html>`.

### CSS de highlight.js

Imports en `app/src/styles/`:
- `highlight.css` (nuevo): `@import 'highlight.js/styles/github.css';` dentro de un selector `:root[data-theme="light"]`, y el dark dentro de `:root[data-theme="dark"]`. Simplest: dos @imports a dos archivos y uno u otro aplica por selector.

Alternativa aun más lazy: importar solo un tema (github-dark) y ajustar colores que no funcionen bien con fondo claro, pues el sitio ya se usa mayormente en dark. Decido eso y, si molesta, se añade el otro.

## Build plan

Tareas discretas para `/develop` (orden Skateboard: entregas pequeñas, cada una verificable):

1. **Tarea A · Syntax highlighting**: instalar `rehype-highlight`, importar CSS de highlight.js, actualizar Markdown.tsx para usar el plugin rehype, verificar en `/excel/H06` que bloques de código tienen color.

2. **Tarea B · Mermaid render básico**: instalar `mermaid`, crear `MermaidBlock.tsx`, reemplazar el placeholder en Markdown.tsx por `<MermaidBlock>`, verificar que `/google-sheets/G01` muestra el flowchart como SVG.

3. **Tarea C · Fallbacks y edge cases**: provocar un error de sintaxis en un bloque Mermaid (ej. sintaxis inválida), verificar que cae al código fuente sin romper. Simular offline y confirmar fallback.

4. **Tarea D · Tema dark/light**: comprobar que syntax highlight se ve bien en ambos. Si molesta, aplicar la estrategia dual (dos imports CSS con selector `data-theme`).

5. **Tarea E · Build y verify**: `npm run build`, chequear tamaño del bundle principal (≤~200KB gzip objetivo) y que `mermaid` queda en chunk propio.

6. **Tarea F · Cierre**: actualizar `design.md`, marcar scope `done`, spec `Accepted`, commit único.

## Consequences

- El bundle de `mermaid` (~500KB raw / ~150KB gzip) solo se descarga en módulos que incluyen diagramas. Los demás módulos no lo ven.
- `rehype-highlight` + highlight.js común crece el bundle inicial en ~40-50KB gzip (aceptable).
- Mermaid renderiza client-side: la primera vez que entras a un módulo con diagrama, hay un flash de "código plano" durante ~500ms mientras carga el paquete. El fallback hace que no haya pantalla vacía.
- Diagramas Mermaid cambian de color según `data-theme` al cargarse. Si el usuario cambia tema con el toggle, el diagrama ya pintado se queda con el tema anterior hasta recargar la página (shortcut documentado).
- Sin conexión: `mermaid` no carga → fallback. Es lo que pide el scope.

## Follow-up

- [ ] Si el flash de código-plano-mientras-carga molesta visualmente, considerar un skeleton de altura fija.
- [ ] Si el cambio de tema con diagramas ya pintados molesta, añadir `MutationObserver` o re-render al cambiar tema.
- [ ] Si hay módulos con muchos diagramas Mermaid, considerar preload del paquete en la ruta del módulo.

## Rationale

**Por qué `rehype-highlight` y no shiki.** Shiki da highlighting de nivel VSCode pero pesa 500KB+ raw; para un portal de aprendizaje con ejemplos de código cortos, highlight.js alcanza y pesa 1/10. Encima rehype-highlight es un plugin natural para la pipeline rehype que ya usamos.

**Por qué el paquete `mermaid` y no el CDN que usaba el sitio legacy.** CDN vs offline: el scope prioriza render cuando hay conexión, fallback a texto plano cuando no. Un paquete npm con lazy import nos da ambos sin añadir un `<script>` global. También evita bloquear el bundle inicial.

**Por qué un solo tema de highlight.** Minimizar el esfuerzo. Si al verificar sale feo en un tema, se añade el segundo. YAGNI hasta que duela.

## References

- rehype-highlight: https://github.com/rehypejs/rehype-highlight
- highlight.js langs: https://github.com/highlightjs/highlight.js/tree/main/src/languages
- Mermaid npm: https://www.npmjs.com/package/mermaid

(basis: documentación oficial al noviembre de 2026)
