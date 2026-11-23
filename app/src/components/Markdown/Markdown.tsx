import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from '../ui/Link/Link'
import { List } from '../ui/List/List'
import { Code } from '../ui/Code/Code'
import { Card } from '../ui/Card/Card'
import { isInternalContentLink } from '../../lib/md/isInternalLink'
import { translateContentHref } from '../../lib/md/translateLinks'
import styles from './Markdown.module.css'

interface Props {
    source: string | null | undefined
    currentCategoriaFolder?: string
}

export function Markdown({ source, currentCategoriaFolder }: Props) {
    if (!source) {
        return <p className={styles.error}>Contenido no disponible.</p>
    }

  return (
    <div className={styles.root}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
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
          code({ className, children }) {
            // Solo código INLINE llega aquí sin pasar por pre().
            return <code className={className}>{children}</code>
          },
          pre({ children }) {
            // react-markdown emite <pre><code class="language-xxx">texto</code></pre>.
            // Extraemos lang e inner del <code> interno.
            const codeEl = children as any
            const codeClassName: string = codeEl?.props?.className ?? ''
            const inner = codeEl?.props?.children ?? children
            const lang = /language-(\w+)/.exec(codeClassName)?.[1]
            if (lang === 'mermaid') {
              return (
                <Code block className={styles.mermaidPending}>
                  {inner}
                </Code>
              )
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
