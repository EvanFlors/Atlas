import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import { Link } from '../ui/Link/Link'
import { List } from '../ui/List/List'
import { Code } from '../ui/Code/Code'
import { Card } from '../ui/Card/Card'
import { MermaidBlock } from './MermaidBlock'
import { SectionHeading } from './SectionHeading'
import { ImageModal } from './ImageModal'
import { isInternalContentLink } from '../../lib/md/isInternalLink'
import { translateContentHref } from '../../lib/md/translateLinks'
import { sectionSlug } from '../../lib/progress/slug'
import styles from './Markdown.module.css'

interface Props {
  source: string | null | undefined
  currentCategoriaFolder?: string
  moduloId?: string
}

function nodeText(node: any): string {
  if (!node) return ''
  if (node.value) return node.value as string
  if (node.children) return node.children.map(nodeText).join('')
  return ''
}

function buildKeyByLine(source: string): Map<number, string> {
  const map = new Map<number, string>()
  const lines = source.split('\n')
  let i = 0
  lines.forEach((line, idx) => {
    const m = /^##\s+(.+?)\s*$/.exec(line)
    if (m) {
      map.set(idx + 1, `${sectionSlug(m[1])}-${i++}`)
    }
  })
  return map
}

// Convierte las fórmulas matemáticas a $$...$$ (display math) para que remark-math
// las procese. Reconoce dos sintaxis del contenido:
//   [P(X)=\binom{5}{2}...] → $$...$$
//   $\sigma^2=\frac{...}$  → $$...$$
// Requiere que el contenido tenga al menos un \comando LaTeX dentro para evitar
// falsos positivos con moneda ($35.50) o refs de Excel ($A$1).
// remark-math corre con singleDollarTextMath: false, así `$` suelto no se procesa.
function preprocessLatex(src: string): string {
  const BLOCK = '$$'
  // Brackets que contienen un \comando LaTeX dentro.
  let out = src.replace(
    /\[([^\]\n]*\\[a-zA-Z]+[^\]\n]*)\]/g,
    (_, body: string) => `${BLOCK}${body}${BLOCK}`,
  )
  // $...$ cuyo contenido arranca con \comando LaTeX.
  out = out.replace(
    /\$(\\[a-zA-Z]+[^$\n]*?)\$/g,
    (_, body: string) => `${BLOCK}${body}${BLOCK}`,
  )
  return out
}

export function Markdown({ source, currentCategoriaFolder, moduloId }: Props) {
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null)

  const processed = useMemo(() => (source ? preprocessLatex(source) : ''), [source])
  const keyByLine = useMemo(() => (processed ? buildKeyByLine(processed) : new Map<number, string>()), [processed])

  if (!source) {
    return <p className={styles.error}>Contenido no disponible.</p>
  }

  return (
    <div className={styles.root}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: false }]]}
        rehypePlugins={[
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
          [rehypeKatex, { throwOnError: false, strict: false }],
        ]}
        components={{
          a({ href, children, ...rest }) {
            if (href && isInternalContentLink(href)) {
              const translated = translateContentHref(href, currentCategoriaFolder)
              return <Link to={translated}>{children}</Link>
            }
            return (
              <Link external href={href ?? '#'} {...rest}>
                {children}
              </Link>
            )
          },
          ul(props) {
            return <List variant="bulleted">{props.children}</List>
          },
          ol(props) {
            return <List as="ol" variant="numbered">{props.children}</List>
          },
          h2({ node, children }: any) {
            if (!moduloId) return <h2>{children}</h2>
            const line = node?.position?.start?.line
            const key = (line && keyByLine.get(line)) ?? `${sectionSlug(nodeText(node))}-0`
            return (
              <SectionHeading moduloId={moduloId} sectionKey={key}>
                {children}
              </SectionHeading>
            )
          },
          code({ className, children }) {
            return <code className={className}>{children}</code>
          },
          pre({ children }) {
            const codeEl = children as any
            const codeClassName: string = codeEl?.props?.className ?? ''
            const inner = codeEl?.props?.children ?? children
            const lang = /language-(\w+)/.exec(codeClassName)?.[1]
            if (lang === 'mermaid') {
              return <MermaidBlock source={String(inner).trim()} />
            }
            return <Code block>{inner}</Code>
          },
          blockquote({ children }) {
            return <Card className={styles.quote}>{children}</Card>
          },
          table({ children }) {
            return (
              <div className={styles.tableWrap}>
                <table className={styles.table}>{children}</table>
              </div>
            )
          },
          img({ src, alt }) {
            const url = typeof src === 'string' ? src : ''
            const caption = alt ?? ''
            return (
              <span className={styles.figure}>
                <button
                  type="button"
                  onClick={() => setZoom({ src: url, alt: caption })}
                  className={styles.figureBtn}
                  aria-label={caption ? `Ampliar imagen: ${caption}` : 'Ampliar imagen'}
                >
                  <img
                    src={url}
                    alt={caption}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </button>
                {caption ? <span className={styles.caption}>{caption}</span> : null}
              </span>
            )
          },
        }}
      >
        {processed}
      </ReactMarkdown>
      {zoom && <ImageModal src={zoom.src} alt={zoom.alt} onClose={() => setZoom(null)} />}
    </div>
  )
}
