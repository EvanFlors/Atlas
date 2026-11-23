import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Link } from '../ui/Link/Link'
import { List } from '../ui/List/List'
import { Code } from '../ui/Code/Code'
import { Card } from '../ui/Card/Card'
import { MermaidBlock } from './MermaidBlock'
import { SectionHeading } from './SectionHeading'
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

// Precompute section keys por línea del source. Determinista; inmune al double-invoke
// de StrictMode (que rompe contadores mutantes en el renderer de react-markdown).
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

export function Markdown({ source, currentCategoriaFolder, moduloId }: Props) {
  const keyByLine = useMemo(() => (source ? buildKeyByLine(source) : new Map<number, string>()), [source])

  if (!source) {
    return <p className={styles.error}>Contenido no disponible.</p>
  }

  return (
    <div className={styles.root}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
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
            return (
              <span className={styles.figure}>
                <img
                  src={typeof src === 'string' ? src : ''}
                  alt={alt ?? ''}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
                {alt ? <span className={styles.caption}>{alt}</span> : null}
              </span>
            )
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
