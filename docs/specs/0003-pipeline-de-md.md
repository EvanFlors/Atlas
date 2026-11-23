# 0003 · Pipeline de .md

**Status**: Accepted
**Date**: 2026-11-22
**Feature**: scope.md · Feature 3 (Fundación)
**Build approach**: Tracer Bullet

## Summary

Cómo los 66 `.md` de `../contenidos/` llegan a un componente React: Vite los descubre al construir, cada archivo se carga perezoso al entrar a su ruta (un chunk por módulo), y `react-markdown` + `remark-gfm` los parsean y mapean a los primitivos del sistema de diseño (`Link`, `List`, `Code`, `Card`). También expone un catálogo tipado (`{categorias, modulos}`) derivado del árbol, listo para alimentar al sidebar en Feature 4. Sin backend, sin fetch runtime, sin reescribir contenido. Resaltado de sintaxis y Mermaid quedan para Feature 7.

## Requirements

- **AC-1**: `app/src/lib/md/catalog.ts` exporta una constante tipada `CATALOG` con la forma `{ categorias: Categoria[] }`, derivada en build time de la estructura de `contenidos/`. Cada categoría tiene `id` (`excel`), `label` (`Excel`), `folder` (`Excel`), y `modulos: Modulo[]`. Cada módulo tiene `id` (`H01`), `label` (`H01 — Fundamentos de Excel y las hojas de cálculo`), `path` (`Excel/H01.md`).
- **AC-2**: `app/src/lib/md/loader.ts` exporta `loadModule(path: string): Promise<string>` que devuelve el contenido crudo del `.md`. La implementación usa `import.meta.glob` con `{ query: '?raw', import: 'default' }` sin `eager`, así cada `.md` es un chunk propio.
- **AC-3**: `app/src/components/Markdown/Markdown.tsx` exporta `<Markdown source={string} />`, que parsea el string y renderiza con los primitivos del sistema de diseño. GFM (tablas, task lists, strikethrough) funciona.
- **AC-4**: El mapeo de nodos cubre:
  - `h1..h4`: etiquetas nativas con tokens de tipografía (hereda de `base.css`).
  - `p`: etiqueta nativa.
  - `a[href]`: `<Link>` del sistema; interno si es una ruta relativa a un módulo (`H02.md`, `../Google_Sheets/G01.md`) o un ancla (`#seccion`); externo en los demás casos.
  - `ul`, `ol`: `<List>` con variantes `bulleted` y `numbered`.
  - `li`: etiqueta nativa.
  - `code` inline y `pre > code` bloque: `<Code>` (sin highlighting; viene en F7).
  - `blockquote`: `<Card>` con una variante visual (ver Design).
  - `table`, `thead`, `tbody`, `tr`, `th`, `td`: etiquetas nativas con estilos globales mínimos (ver Design).
  - `img`: `<figure>` con `<img>` + `<figcaption>` usando el `alt` como leyenda. Carga lazy nativa, `loading="lazy"`, `decoding="async"`. En error de carga, se oculta el `<img>` y queda visible la leyenda como fallback legible. **El contenido real usa imágenes remotas (URLs https://…)**, así el chasis debe aguantar: layout no se rompe, offline no revienta.
  - `hr`, `strong`, `em`, `del`: etiquetas nativas.
  - `code` de lenguaje `mermaid` (dentro de `pre`): placeholder de texto hasta F7 (muestra `code` plano con una etiqueta "diagrama Mermaid, pendiente F7").
- **AC-5**: Existe una página de prueba estable (`/_md/:categoria/:modulo` solo en dev) que acepta parámetros y renderiza el `.md` correspondiente. Permite abrir `http://localhost:5173/_md/Excel/H01` y ver el módulo H01 completo.
- **AC-6**: El bundle inicial **no** incluye el texto de ningún `.md`. Al entrar a la ruta de prueba, se descarga solo el chunk del módulo visitado (verificable en DevTools → Network al navegar).
- **AC-7**: Si `loadModule` recibe una ruta que no existe, lanza un error claro (`ModuleNotFound: contenidos/Excel/HXX.md`). El componente `<Markdown />` renderiza un mensaje de error legible cuando recibe `source` vacío o `null`.
- **AC-9**: Las imágenes remotas (`![alt](https://...)`) se renderizan como `<figure>` con la imagen y una leyenda tomada del `alt`. La imagen tiene `loading="lazy"`, `decoding="async"` y `max-width: 100%`. Si la carga falla (offline, 404, bloqueo), la imagen se oculta y la leyenda queda visible como texto alternativo.
- **AC-8**: `npx tsc -b` pasa sin errores. `npm run build` produce `app/dist/` con 66 chunks pequeños (uno por `.md`) además del bundle principal.

## Decision

**Piezas elegidas:**

| Pieza | Elección | Por qué (una línea) |
|---|---|---|
| Descubrimiento | `import.meta.glob('../../../contenidos/**/*.md', { query: '?raw', import: 'default' })` | Vite ya sabe; cero config adicional; funciona idéntico en dev y prod. |
| Carga | Lazy (sin `eager`); cada archivo es un chunk propio | 66 módulos no tienen que estar en el bundle inicial; solo lo que el usuario abre. |
| Parser | `react-markdown` v10+ | Estándar de facto en React para Markdown runtime; API `components` hecha para mapear a primitivos. |
| Plugin GFM | `remark-gfm` v4+ | Una línea para tablas, strikethrough, task lists; el contenido real los usa constantemente. |
| Catálogo | Derivado al cargar el módulo `catalog.ts`, no en build time separado | El propio `import.meta.glob` ya corre en build; derivar `CATALOG` es cero coste. |
| Mapeo link | Función `isInternalContentLink(href)` detecta rutas a otros `.md`; usa `<Link>` interno o externo | Centraliza la decisión; test unitario fácil si aparece. |
| Placeholder Mermaid | Render de `<pre><code>` con un bloque de aviso | Legible; invita al reemplazo en F7 sin romper el render hoy. |

**Dependencias nuevas:** 2.

```json
{
  "dependencies": {
    "react-markdown": "^10.1.0",
    "remark-gfm": "^4.0.1"
  }
}
```

**Implementation skills:** ninguno específico del proyecto (no hay `AGENTS.md`).

## Design

### Estructura de archivos

```
app/src/
├── lib/
│   └── md/
│       ├── catalog.ts        ← export CATALOG derivado del glob
│       ├── loader.ts         ← export loadModule(path)
│       ├── isInternalLink.ts ← helper puro, testeable
│       └── types.ts          ← Categoria, Modulo, CatalogShape
├── components/
│   └── Markdown/
│       ├── Markdown.tsx      ← <Markdown source={string} />
│       └── Markdown.module.css ← estilos de tabla, blockquote wrapper, hr
└── routes/
    └── MDPreview.tsx         ← AC-5, ruta /_md/:categoria/:modulo en dev
```

### `types.ts`

```ts
export type ModuloId = string           // "H01", "G02", "V05", "A10"
export type CategoriaId = 'excel' | 'google-sheets' | 'vba' | 'apps-script'

export interface Modulo {
  id: ModuloId                          // "H01"
  label: string                         // "H01 — Fundamentos de Excel ..."
  path: string                          // "Excel/H01.md" (ruta dentro de contenidos/)
}

export interface Categoria {
  id: CategoriaId                       // "excel"
  label: string                         // "Excel"
  folder: string                        // "Excel" (nombre en disco)
  modulos: Modulo[]
}

export interface CatalogShape {
  categorias: Categoria[]
}
```

### `catalog.ts`

```ts
import type { CatalogShape, Categoria, Modulo, CategoriaId } from './types'

// glob EAGER + raw: en build time, Vite incrusta el texto crudo de cada .md.
// Lo usamos SOLO para derivar títulos; la carga real de contenido (loader.ts) es lazy.
const RAW = import.meta.glob('../../../contenidos/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const FOLDER_TO_ID: Record<string, CategoriaId> = {
  Excel: 'excel',
  Google_Sheets: 'google-sheets',
  VBA: 'vba',
  Apps_Script: 'apps-script',
}

const FOLDER_TO_LABEL: Record<string, string> = {
  Excel: 'Excel',
  Google_Sheets: 'Google Sheets',
  VBA: 'VBA',
  Apps_Script: 'Apps Script',
}

function firstH1(raw: string): string | null {
  const match = raw.match(/^#\s+(.+?)\s*$/m)
  return match ? match[1].trim() : null
}

function parsePath(fullPath: string): { folder: string; filename: string; id: string } {
  // ../../../contenidos/Excel/H01.md -> folder=Excel, filename=H01.md, id=H01
  const relative = fullPath.split('/contenidos/')[1]
  const [folder, filename] = relative.split('/')
  const id = filename.replace(/\.md$/, '')
  return { folder, filename, id }
}

const modulosByFolder: Record<string, Modulo[]> = {}
for (const [fullPath, raw] of Object.entries(RAW)) {
  const { folder, filename, id } = parsePath(fullPath)
  const label = firstH1(raw) ?? id
  const mod: Modulo = { id, label, path: `${folder}/${filename}` }
  ;(modulosByFolder[folder] ||= []).push(mod)
}

// Orden alfabético por id de módulo (H01, H02... G01, G02...).
for (const folder of Object.keys(modulosByFolder)) {
  modulosByFolder[folder].sort((a, b) => a.id.localeCompare(b.id))
}

const categorias: Categoria[] = Object.keys(FOLDER_TO_ID)
  .filter((folder) => modulosByFolder[folder]?.length)
  .map((folder) => ({
    id: FOLDER_TO_ID[folder],
    label: FOLDER_TO_LABEL[folder],
    folder,
    modulos: modulosByFolder[folder],
  }))

export const CATALOG: CatalogShape = { categorias }
```

**Nota de rendimiento:** este `eager: true` sí carga los 66 archivos al importar `catalog.ts`, pero SOLO para extraer el h1 (una regex). El bundle inicial crece con los títulos, no con el contenido completo. Si eso se vuelve un problema (improbable con 66 cortos h1), separamos el catálogo en un endpoint aparte. Por ahora es la vía recta.

### `loader.ts`

```ts
const RAW_LAZY = import.meta.glob('../../../contenidos/**/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

export class ModuleNotFound extends Error {
  constructor(public readonly path: string) {
    super(`ModuleNotFound: contenidos/${path}`)
    this.name = 'ModuleNotFound'
  }
}

/**
 * Carga el contenido crudo de un .md dentro de contenidos/.
 * path es relativo a contenidos/, por ejemplo "Excel/H01.md".
 */
export async function loadModule(path: string): Promise<string> {
  const key = Object.keys(RAW_LAZY).find((k) => k.endsWith(`/contenidos/${path}`))
  if (!key) throw new ModuleNotFound(path)
  return await RAW_LAZY[key]()
}
```

### `isInternalLink.ts`

```ts
/**
 * Un link es "interno a contenidos" si apunta a un .md de contenidos/ (relativo),
 * o si es una ruta de la app, o un ancla. Los demás son externos.
 */
export function isInternalContentLink(href: string): boolean {
  if (!href) return false
  if (href.startsWith('#')) return true                   // ancla interna
  if (href.startsWith('/')) return true                   // ruta absoluta de la app
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return false    // mailto:, http(s):, tel: ...
  if (href.endsWith('.md') || href.includes('.md#')) return true
  return false                                            // otros relativos: tratar como externos (seguro)
}
```

### `Markdown.tsx` (mapeo de nodos)

```tsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from '../ui/Link/Link'
import { List } from '../ui/List/List'
import { Code } from '../ui/Code/Code'
import { Card } from '../ui/Card/Card'
import { isInternalContentLink } from '../../lib/md/isInternalLink'
import styles from './Markdown.module.css'

interface Props {
  source: string | null | undefined
}

export function Markdown({ source }: Props) {
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
              return <Link to={href}>{children}</Link>
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
          code({ className, children, ...rest }) {
            const lang = /language-(\w+)/.exec(className ?? '')?.[1]
            // code "inline" vs bloque: react-markdown v10 ya no pasa `inline`.
            // Detectamos por si viene dentro de <pre> en el componente pre() de abajo.
            if (lang === 'mermaid') {
              return (
                <Code block className={styles.mermaidPending}>
                  {children}
                </Code>
              )
            }
            return <code {...rest}>{children}</code>
          },
          pre({ children }) {
            // En react-markdown, el bloque de código llega como <pre><code lang=...>texto</code></pre>.
            // Lo sustituimos por nuestro <Code block>.
            return <Code block>{(children as any)?.props?.children ?? children}</Code>
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
              <figure className={styles.figure}>
                <img
                  src={typeof src === 'string' ? src : ''}
                  alt={alt ?? ''}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
                {alt ? <figcaption>{alt}</figcaption> : null}
              </figure>
            )
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
```

**Notas:**
- Los `h1..h4`, `p`, `strong`, `em`, `del`, `hr`, `li`, `img` no se overridean: `react-markdown` los emite nativos y heredan estilos de `base.css`.
- El `code` inline usa la etiqueta nativa (`<code>`) para que `base.css` lo haga mono; el bloque pasa por `<Code block>` para el estilo de "chasis" (fondo, padding, scroll horizontal).
- La lógica de "code inline vs bloque" en react-markdown v10 cambió: ya no se pasa el flag `inline`. Usamos el `components.pre` para detectar bloques. Si en el futuro `react-markdown` facilita de nuevo esta distinción, simplificar.
- Mermaid: hoy es un bloque de texto con una clase CSS que lo identifica visualmente ("pendiente F7"). En F7, `components.code` para `lang === 'mermaid'` llama al renderer real.

### `Markdown.module.css`

```css
.root {
  max-width: 72ch;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.root h1,
.root h2,
.root h3,
.root h4 {
  line-height: var(--leading-tight);
  margin-top: var(--space-5);
}
.root h1 { font-size: var(--text-3xl); }
.root h2 { font-size: var(--text-2xl); }
.root h3 { font-size: var(--text-xl); }
.root h4 { font-size: var(--text-lg); color: var(--color-text-muted); }

.root p { line-height: var(--leading-normal); }

.tableWrap {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.table {
  border-collapse: collapse;
  width: 100%;
  font-size: var(--text-sm);
}
.table th,
.table td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  vertical-align: top;
}
.table th {
  background: var(--color-bg-elevated);
  font-weight: 600;
}
.table tr:last-child td {
  border-bottom: none;
}

.quote {
  border-left: 3px solid var(--color-accent);
  background: var(--color-bg-elevated);
}

.figure {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
}

.figure img {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.figure figcaption {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: var(--leading-normal);
}

.mermaidPending::before {
  content: "📊 Diagrama Mermaid (pendiente Feature 7)";
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}

.error {
  color: var(--color-text-muted);
  font-style: italic;
}
```

### `MDPreview.tsx` (ruta de prueba, solo dev)

```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Markdown } from '../components/Markdown/Markdown'
import { loadModule, ModuleNotFound } from '../lib/md/loader'
import { CATALOG } from '../lib/md/catalog'

export default function MDPreview() {
  const { categoria, modulo } = useParams<{ categoria: string; modulo: string }>()
  const [source, setSource] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!categoria || !modulo) return
    setSource(null)
    setError(null)
    loadModule(`${categoria}/${modulo}.md`)
      .then(setSource)
      .catch((e: unknown) => {
        if (e instanceof ModuleNotFound) setError(e.message)
        else setError(String(e))
      })
  }, [categoria, modulo])

  return (
    <main style={{ padding: 'var(--space-6)', maxWidth: '960px', margin: '0 auto' }}>
      <nav style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
        Vista previa: {categoria} / {modulo}.md · {CATALOG.categorias.length} categorías,{' '}
        {CATALOG.categorias.reduce((n, c) => n + c.modulos.length, 0)} módulos.
      </nav>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <Markdown source={source} />
    </main>
  )
}
```

Registrar en `router.tsx`:

```tsx
...(import.meta.env.DEV
  ? [
      { path: '/_ui', element: <UIGallery /> },
      { path: '/_md/:categoria/:modulo', element: <MDPreview /> },
    ]
  : []),
```

## Build plan

Orden Tracer Bullet (atraviesas descubrir → cargar → parsear → renderizar → ver H01 completo en el navegador, luego engordas):

1. **Instalar deps.**
   ```bash
   cd app
   npm install react-markdown remark-gfm
   ```

2. **Tipos.** Crear `app/src/lib/md/types.ts` con las interfaces (Modulo, Categoria, CatalogShape).

3. **Loader lazy.** Crear `app/src/lib/md/loader.ts` con `import.meta.glob` lazy + `loadModule` + `ModuleNotFound`. No usar `eager`.

4. **Catálogo.** Crear `app/src/lib/md/catalog.ts` con `import.meta.glob` eager raw, parse del primer h1, mapeo folder→categoria.

5. **Helper interno.** Crear `app/src/lib/md/isInternalLink.ts`.

6. **Componente Markdown base.** Crear `app/src/components/Markdown/{Markdown.tsx, Markdown.module.css}` con el mapeo completo descrito arriba.

7. **Ruta de prueba.** Crear `app/src/routes/MDPreview.tsx` y añadir la ruta `/_md/:categoria/:modulo` a `router.tsx` dentro del guard `import.meta.env.DEV`.

8. **Verificar circuito completo.** `npm run dev`, abrir `http://localhost:5173/_md/Excel/H01`. Debes ver H01 entero: h1, tablas, listas, blockquote, bloques de código.
   - Prueba también `/_md/Google_Sheets/G01` (tiene Mermaid: verás el aviso de F7).
   - Prueba `/_md/Excel/HXX`: debe mostrar el error de "ModuleNotFound".

9. **Chequear lazy loading.** DevTools → Network, recarga. Al entrar a `/_md/Excel/H01` debe bajar un chunk JS con el contenido de `H01.md` (tamaño del h1 + texto + mermaid). Entra a `/_md/Excel/H02`: debe bajar OTRO chunk, no reusar el anterior.

10. **Añadir link a la galería.** En `UIGallery.tsx`, añadir una sección con enlaces de prueba a 2 módulos (uno por categoría basta) para tener acceso rápido.

11. **Build de producción.** `npm run build`. Debe terminar en verde. En `app/dist/assets/`, debes ver ≥66 archivos pequeños `.js` (uno por módulo), además del bundle principal. Si solo ves un bundle gigante, la lazyness no funcionó.

12. **Añadir a `design.md`** una mención del componente `<Markdown />`: cómo se usa (`<Markdown source={raw} />`) y qué nodos mapea a primitivos. Dos párrafos bastan.

13. **Commit** (si git ya existe): `feat: pipeline de markdown con catálogo lazy y mapeo a primitivos (feature 3)`.

**Self-check**: AC-1..AC-8 se verifican a mano navegando `/_md/Excel/H01`, mirando DevTools → Network, y corriendo `npm run build`. No se escriben tests unitarios en esta spec; `isInternalLink.ts` es un candidato natural para test si subimos esta feature a Beta.

## Consequences

- El mapeo **sí incluye `remark-gfm`** aunque el scope lo había agrupado con Feature 7. Razón: el contenido real usa tablas por todos lados, y sin GFM el circuito Tracer Bullet renderiza un desastre. El coste es una línea de dep; el beneficio es que Feature 3 es demostrable con contenido real. Feature 7 deja de incluir GFM y se queda con lo caro de verdad (syntax highlighting + Mermaid).
- `react-markdown` hace parsing en runtime. 66 archivos lazy-loaded significa que la primera visita a cada módulo tarda un pelín más (descarga el chunk + parsea). En práctica son milisegundos sobre `.md` de ~30KB.
- El bundle inicial crece un poco (el import de `catalog.ts` carga los 66 textos para extraer el h1). Si el bundle inicial escala mal, separar el catálogo en un endpoint aparte o pre-computar los títulos en build time con un script.
- `catalogo.json` legacy (2.8MB en la raíz) **no se usa**. Se queda intocado por si Feature 10 (progreso) necesita su shape para compat con quien ya lo tenga guardado.
- Los links a otros módulos (`[otro](H02.md)`) se renderizan como `<Link to="H02.md">`. Esto FUNCIONA en Feature 4 cuando el shell monta `/:categoria/:modulo` y `H02.md` se resuelve relativo a la ruta actual, PERO depende del shell. Si lo pruebas antes de Feature 4, el link no lleva a ningún sitio real (es esperado).
- Imágenes: el contenido real tiene decenas de `![alt](https://…)` apuntando a dominios externos (Microsoft Learn, blogs, imágenes web). Se renderizan como `<figure>` con leyenda y `loading="lazy"`. **Dependen de conexión a internet** (el LEEME.md ya lo advierte). En offline o si el host bloquea hotlinking, la imagen desaparece y la leyenda queda como texto alternativo, sin romper el layout. Si en el futuro aparecen imágenes LOCALES dentro de `contenidos/` (ej. `./images/foo.png`), habrá que decidir estrategia (publicar en `public/` o escribir un remark plugin que las resuelva al pasar por Vite); por ahora no aplica.
- Mermaid aparece como un bloque de texto con un aviso. Legible, no ideal; se arregla en Feature 7.

## Follow-up

- [ ] En Feature 4 (shell), consumir `CATALOG` para construir el sidebar; las rutas `/:categoria/:modulo` resuelven módulo via `loadModule`.
- [ ] En Feature 7, reemplazar el placeholder de Mermaid por un `MermaidBlock` que llame a `mermaid.render()` (import dinámico); añadir `rehype-highlight` o `shiki` para syntax highlighting en `<Code block>`.
- [ ] Si el bundle inicial crece por el catálogo, mover el parse de h1 a un script Vite custom que emita `catalog.json` al construir.
- [ ] Si aparecen imágenes LOCALES (relativas, dentro de `contenidos/`), decidir estrategia (public/ absoluta vs remark-image-loader). Hoy todas las imágenes son remotas y se manejan como tal.
- [ ] Añadir a un futuro `AGENTS.md` que los `.md` de `contenidos/` son el único origen de contenido; no se duplica en código.

## Rationale

**Por qué `react-markdown` y no un compilador a MDX.** MDX permite JSX dentro del `.md`, pero nuestro contenido es texto puro escrito por humanos. Introducir `.mdx` obligaría a reescribir los 66 archivos o duplicar un pipeline. Runtime parsing con `react-markdown` es exactamente la pieza faltante: lee string, emite JSX, mapea nodos a nuestros primitivos. Es 15KB gzipped y mantiene cero fricción con el autor del contenido.

**Por qué lazy y no eager.** Eager (`eager: true` sobre todos los `.md`) mete los ~2MB de texto crudo en el bundle inicial. Eso retrasa el LCP de la home que no necesita ningún módulo. Lazy hace que entrar a H01 descargue solo H01 (~30KB). Vite hace el code splitting automático; el único coste es un `await import()` por módulo.

**Por qué derivar el catálogo del tree, no reusar `catalogo.json`.** `catalogo.json` (2.8MB) fue generado para el `index.html` legacy. Reusarlo introduce una fuente de verdad duplicada: si cambia un `.md`, hay que regenerar el JSON. Derivar del tree al construir elimina esa deuda. Feature 10 (progreso) todavía podrá leer el JSON legacy si necesita compat con quien exportó desde el sitio viejo, pero el catálogo del app nuevo no depende de él.

**Por qué incluir GFM en Feature 3 (deviación del scope).** El scope agrupaba GFM, resaltado y Mermaid en Feature 7. Con el contenido real a la vista (tablas en cada módulo), GFM es lo que convierte Feature 3 en "renderiza el .md" vs "renderiza algo que parece el .md". Una línea de dep (`remark-gfm`) a cambio de un circuito Tracer Bullet creíble.

**Por qué una ruta de prueba `/_md/...` y no renderizar en `/_ui`.** La galería `/_ui` es para primitivos. La preview de Markdown merece su propia ruta parametrizada porque así puedes navegar a cualquier módulo real y ver cómo se ve. En Feature 4 esta ruta se convertirá en la real (`/:categoria/:modulo`); por ahora vive en `/_md/...` para no pisar nombres.

## References

- react-markdown: https://github.com/remarkjs/react-markdown
- remark-gfm: https://github.com/remarkjs/remark-gfm
- Vite `import.meta.glob`: https://vite.dev/guide/features.html#glob-import

(basis: documentación oficial y práctica común de la comunidad React al noviembre de 2026)
