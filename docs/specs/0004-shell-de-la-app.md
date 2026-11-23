# 0004 · Shell de la app (layout, sidebar, routing)

**Status**: Accepted
**Date**: 2026-11-22
**Feature**: scope.md · Feature 4 (Slice 1 Tracer)
**Build approach**: Tracer Bullet

## Summary

Chasis visual y de navegación: layout de dos columnas con header arriba, sidebar izquierda con `CATALOG`, y área principal que cambia según la URL. Tres rutas distintas: `/` (home con 4 categorías), `/:categoria` (listado de módulos de esa categoría), `/:categoria/:modulo` (módulo renderizado con el `<Markdown />` de Feature 3). Sidebar resalta el módulo activo. Mobile queda para Feature 11 (responsive).

## Requirements

- **AC-1**: Existe un componente `<Shell>` que envuelve todas las rutas de la app y renderiza header + sidebar + `<Outlet />`.
- **AC-2**: El header muestra el título "ATLAS" (link a `/`) a la izquierda y el `<ThemeToggle />` existente a la derecha.
- **AC-3**: El sidebar lista las 4 categorías (`CATALOG.categorias`). Bajo cada categoría, sus módulos (`.modulos`) como links.
- **AC-4**: Las URLs de categoría usan slug limpio: `/excel`, `/google-sheets`, `/vba`, `/apps-script` (valores de `Categoria.id`).
- **AC-5**: Las URLs de módulo son `/:categoria/:modulo`, por ejemplo `/excel/H01`. El `:modulo` usa el `Modulo.id` (`H01`, `G05`, `V12`, etc.).
- **AC-6**: La ruta `/` muestra una home con los 4 títulos de categoría como `<Link>` + un párrafo corto de bienvenida.
- **AC-7**: La ruta `/:categoria` muestra el nombre de la categoría + descripción breve + lista de los módulos de esa categoría como `<Link>`.
- **AC-8**: La ruta `/:categoria/:modulo` carga el `.md` correspondiente con `loadModule('Folder/Id.md')` y lo renderiza con `<Markdown />`.
- **AC-9**: El link activo del sidebar (módulo o categoría actual) tiene `aria-current="page"` y un estilo visual distinto (fondo elevado + borde accent a la izquierda).
- **AC-10**: Links dentro del Markdown que apuntan a otros módulos (ej. `H02.md`, `../Google_Sheets/G01.md`) se resuelven correctamente a las URLs del app. El `<Markdown />` traduce `Folder/Id.md` a `/slug/Id` usando el `CATALOG`.
- **AC-11**: Si `:categoria` o `:modulo` no existen en el `CATALOG`, se muestra un mensaje "No encontrado" con link a `/`.
- **AC-12**: El dev server arranca y `/`, `/excel`, `/excel/H01` resuelven a vistas distintas sin errores de consola. Las rutas de dev (`/_ui`, `/_md/:categoria/:modulo`) siguen funcionando.
- **AC-13**: El layout usa CSS Grid: sidebar fija de 280px, main fluido. En viewports estrechos (<768px) el sidebar se superpone o se oculta (decisión Feature 11); por ahora, scroll horizontal es aceptable.
- **AC-14**: `npx tsc -b` y `npm run build` pasan en verde.

## Decision

**Piezas elegidas:**

| Pieza | Elección | Por qué (una línea) |
|---|---|---|
| Layout | CSS Grid, `grid-template: "header header" / "sidebar main"` | Nativo, cero deps, responsive con un media query cuando llegue F11. |
| Shell como layout route | `<Route element={<Shell />}><Route path=":categoria" …/>…</Route>` | React Router v7 lo soporta con `<Outlet />`; una sola ruta padre, todas las hijas heredan header+sidebar. |
| Resolución categoria slug → folder | Helper `categoriaBySlug(slug)` lee `CATALOG.categorias.find(c => c.id === slug)` | Centralizado, type safe, el `CATALOG` ya trae la traducción. |
| Resolución módulo id → path | Helper `moduloInCategoria(categoria, moduloId)` → `Modulo \| undefined` | Mismo patrón, misma fuente. |
| Markdown link mapper | `translateContentHref(href)` traduce `Folder/Id.md` o `../Folder/Id.md` → `/slug/Id` | Se añade a `<Markdown />` sin tocar los primitivos; una función pura testeable. |
| Sidebar activo | `<NavLink>` de React Router (añade `aria-current` automático) + estilo con `&.active` | Estándar, cero código custom. |
| Home / categoria / módulo | 3 archivos en `routes/`: `Home.tsx` (ya existe, se actualiza), `CategoriaView.tsx`, `ModuloView.tsx` | Separación clara, cada archivo < 50 líneas. |

**Dependencias nuevas:** 0. Todo con React Router 7 y lo que ya hay.

**Implementation skills:** ninguno específico del proyecto.

## Design

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Header                               ThemeToggle   │ 60px
├───────────────┬─────────────────────────────────────┤
│               │                                     │
│  Excel        │                                     │
│   H01         │                                     │
│   H02 ◀───┐   │   <Outlet /> (Home / Categoria /    │
│   ...     │   │              Modulo según URL)      │
│  Google…      │                                     │
│   G01         │                                     │
│  VBA          │                                     │
│  Apps Script  │                                     │
│               │                                     │
│  280px        │  fluid, max-width 72ch              │
└───────────────┴─────────────────────────────────────┘
```

### Estructura de archivos

```
app/src/
├── components/
│   └── Shell/
│       ├── Shell.tsx          ← layout principal con <Outlet />
│       ├── Shell.module.css
│       ├── Header.tsx         ← título + ThemeToggle
│       └── Sidebar.tsx        ← lista de categorías con NavLink
├── lib/
│   └── md/
│       └── translateLinks.ts  ← helper: Folder/Id.md → /slug/Id
├── routes/
│   ├── Home.tsx               ← actualizado: lista de 4 categorías como cards/links
│   ├── CategoriaView.tsx      ← NEW: nombre + descripción + lista de módulos
│   ├── ModuloView.tsx         ← NEW: carga .md + <Markdown />
│   ├── NotFound.tsx           ← NEW: mensaje + link a /
│   ├── UIGallery.tsx          ← intacto (dev)
│   └── MDPreview.tsx          ← intacto (dev)
└── router.tsx                 ← reescrito con la jerarquía Shell > hijos
```

### `router.tsx` (la nueva jerarquía)

```tsx
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
```

Las rutas de dev viven FUERA del `<Shell>` para no cargar sidebar innecesariamente al inspeccionar primitivos.

### `Shell.tsx`

```tsx
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import styles from './Shell.module.css'

export function Shell() {
  return (
    <div className={styles.grid}>
      <Header />
      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
```

### `Shell.module.css`

```css
.grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: 60px 1fr;
  grid-template-areas:
    "header header"
    "sidebar main";
  min-height: 100vh;
}

.sidebar {
  grid-area: sidebar;
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  padding: var(--space-4);
}

.main {
  grid-area: main;
  overflow-y: auto;
  padding: var(--space-5) var(--space-6);
}
```

### `Header.tsx`

```tsx
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../ThemeToggle'
import styles from './Shell.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>ATLAS</Link>
      <ThemeToggle />
    </header>
  )
}
```

CSS extra en `Shell.module.css`:

```css
.header {
  grid-area: header;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-5);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
}

.brand {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text);
  text-decoration: none;
  letter-spacing: 0.02em;
}
```

### `Sidebar.tsx`

```tsx
import { NavLink } from 'react-router-dom'
import { CATALOG } from '../../lib/md/catalog'
import styles from './Shell.module.css'

export function Sidebar() {
  return (
    <nav className={styles.nav}>
      {CATALOG.categorias.map((cat) => (
        <section key={cat.id} className={styles.category}>
          <NavLink
            to={`/${cat.id}`}
            end
            className={({ isActive }) =>
              isActive ? `${styles.catLink} ${styles.active}` : styles.catLink
            }
          >
            {cat.label}
          </NavLink>
          <ul className={styles.modList}>
            {cat.modulos.map((mod) => (
              <li key={mod.id}>
                <NavLink
                  to={`/${cat.id}/${mod.id}`}
                  className={({ isActive }) =>
                    isActive ? `${styles.modLink} ${styles.active}` : styles.modLink
                  }
                >
                  {mod.id}
                </NavLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
```

CSS extra:

```css
.nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.category {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.catLink {
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.catLink:hover {
  background: var(--color-bg-elevated);
}

.modList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.modLink {
  display: block;
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-decoration: none;
  border-radius: var(--radius-sm);
  border-left: 3px solid transparent;
}

.modLink:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text);
}

.active {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border-left-color: var(--color-accent);
  font-weight: 600;
}
```

### `translateLinks.ts`

```ts
import { CATALOG } from './catalog'

/**
 * Traduce un href de Markdown ("H02.md", "../Google_Sheets/G01.md", "#section")
 * a una URL de la app ("/excel/H02", "/google-sheets/G01", "#section").
 * Retorna el href original si no matchea el patrón de módulo interno.
 */
export function translateContentHref(href: string, currentCategoriaFolder?: string): string {
  if (!href) return href
  if (href.startsWith('#') || href.startsWith('/')) return href
  const match = href.match(/^(?:\.\.\/)?([^/]+\/)?([A-Z]\d+)\.md(#.*)?$/)
  if (!match) return href
  const [, folderPart, moduloId, anchor = ''] = match
  const folder = folderPart ? folderPart.replace(/\/$/, '') : currentCategoriaFolder
  if (!folder) return href
  const cat = CATALOG.categorias.find((c) => c.folder === folder)
  if (!cat) return href
  return `/${cat.id}/${moduloId}${anchor}`
}
```

El `currentCategoriaFolder` sirve para resolver `H02.md` sin prefijo (link dentro de la misma categoría). El `ModuloView` lo pasará.

### `Home.tsx` (actualizado)

```tsx
import { Link } from 'react-router-dom'
import { CATALOG } from '../lib/md/catalog'
import { Card } from '../components/ui/Card/Card'

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '72ch' }}>
      <h1>ATLAS · Portal de aprendizaje</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        66 módulos sobre Excel, Google Sheets, VBA y Apps Script. Elige una categoría para empezar.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
        {CATALOG.categorias.map((cat) => (
          <Link key={cat.id} to={`/${cat.id}`} style={{ textDecoration: 'none' }}>
            <Card>
              <strong>{cat.label}</strong>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-1)', fontSize: 'var(--text-sm)' }}>
                {cat.modulos.length} módulos
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

### `CategoriaView.tsx`

```tsx
import { useParams, Link } from 'react-router-dom'
import { CATALOG } from '../lib/md/catalog'
import NotFound from './NotFound'

export default function CategoriaView() {
  const { categoria } = useParams<{ categoria: string }>()
  const cat = CATALOG.categorias.find((c) => c.id === categoria)
  if (!cat) return <NotFound />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '72ch' }}>
      <h1>{cat.label}</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        {cat.modulos.length} módulos. Elige uno para empezar.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {cat.modulos.map((mod) => (
          <li key={mod.id}>
            <Link to={`/${cat.id}/${mod.id}`}>{mod.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### `ModuloView.tsx`

```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Markdown } from '../components/Markdown/Markdown'
import { loadModule, ModuleNotFound } from '../lib/md/loader'
import { CATALOG } from '../lib/md/catalog'
import NotFound from './NotFound'

export default function ModuloView() {
  const { categoria, modulo } = useParams<{ categoria: string; modulo: string }>()
  const cat = CATALOG.categorias.find((c) => c.id === categoria)
  const mod = cat?.modulos.find((m) => m.id === modulo)

  const [source, setSource] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mod) return
    setSource(null)
    setError(null)
    loadModule(mod.path)
      .then(setSource)
      .catch((e: unknown) => {
        if (e instanceof ModuleNotFound) setError(e.message)
        else setError(String(e))
      })
  }, [mod])

  if (!cat || !mod) return <NotFound />
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>
  return <Markdown source={source} currentCategoriaFolder={cat.folder} />
}
```

**Nota:** `<Markdown />` recibe un prop nuevo `currentCategoriaFolder` que pasa al link mapper. Lo añadimos en el build plan.

### `NotFound.tsx`

```tsx
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: '72ch' }}>
      <h1>No encontrado</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Esta ruta no corresponde a ninguna categoría o módulo del catálogo.
      </p>
      <Link to="/">Volver al inicio</Link>
    </div>
  )
}
```

## Build plan

Orden Tracer Bullet (atraviesas layout → una ruta real → sidebar activo → enriqueces):

1. **Crea los archivos del Shell.** Carpeta `app/src/components/Shell/`, con `Shell.tsx`, `Header.tsx`, `Sidebar.tsx`, `Shell.module.css` del diseño.

2. **Crea `app/src/lib/md/translateLinks.ts`** con `translateContentHref` del diseño.

3. **Actualiza `<Markdown />`** para aceptar `currentCategoriaFolder` y pasar `href` por `translateContentHref` dentro del componente `a`. Edit del archivo existente, solo el handler `a`.

4. **Crea `NotFound.tsx`** en `app/src/routes/`.

5. **Actualiza `Home.tsx`** al nuevo contenido (lista de categorías como cards).

6. **Crea `CategoriaView.tsx`** y `ModuloView.tsx` en `app/src/routes/`.

7. **Reescribe `router.tsx`** con la jerarquía nueva (Shell como padre, hijos routes, dev routes fuera del Shell).

8. **Verifica en el navegador:**
   - `/` muestra 4 cards (Excel, Google Sheets, VBA, Apps Script).
   - Click en Excel → `/excel`, muestra lista de 24 módulos.
   - Click en H01 → `/excel/H01`, muestra el markdown completo dentro del shell.
   - Sidebar resalta H01 (fondo elevado + borde accent).
   - `/xyz` muestra NotFound.

9. **Verifica links internos del markdown.** En algún `.md` de prueba (por ejemplo H06 que suele enlazar a otros), comprueba que los links tipo `[H02](H02.md)` llevan a `/excel/H02`.

10. **Verifica rutas de dev siguen intactas:** `/_ui` y `/_md/Excel/H01` renderizan sin el shell (su propio layout).

11. **TypeScript y build.**
    ```bash
    npx tsc -b
    npm run build
    ```
    Debe pasar en verde.

12. **Actualiza `design.md`** con un párrafo sobre el Shell (layout, sidebar, rutas).

13. **Commit** (si git existe): `feat: shell con sidebar, 3 rutas principales y mapeo de links internos (feature 4)`.

**Self-check:** las 3 rutas distintas + sidebar con activo + links internos funcionando = AC-1..AC-14 cubiertos a mano en el navegador. Workflow Alpha: `/check verify` manual.

## Consequences

- Toda la navegación "real" del portal ya existe. Las features siguientes (Markdown enriquecido, prev/next, búsqueda, progreso) se montan sobre este chasis.
- `<Markdown />` ahora depende de `CATALOG` (vía `translateContentHref`). Si se añade una categoría nueva, basta con añadirla a `FOLDER_TO_ID`/`FOLDER_TO_LABEL` en `catalog.ts`; el shell la pinta sin cambios.
- La ruta `/_md/:categoria/:modulo` sigue existiendo (dev) con su layout propio (sin shell). Útil para pruebas rápidas de render Markdown.
- Mobile todavía no funciona bien (sidebar fija 280px roba espacio en <768px). Scroll horizontal por ahora. Feature 11 lo resuelve (sidebar colapsable + hamburger).
- El sidebar lista los 66 módulos siempre expandidos. Con 4 categorías y 12-24 módulos por categoría, cabe en una pantalla normal con scroll. Si en el futuro hay 100+ módulos por categoría, se convierte en accordion. Hoy no hace falta.
- Links Markdown que apuntan a archivos no catalogados (ej. imágenes relativas, otros assets) pasan como externos; el usuario puede hacer click y abren en nueva pestaña. Aceptable.

## Follow-up

- [ ] Feature 7 (Markdown enriquecido) se suma al `<Markdown />` ya conectado al shell.
- [ ] Feature 8 (prev/next/breadcrumbs) consume `CATALOG` para calcular siguientes y anteriores y pinta breadcrumbs en el header.
- [ ] Feature 9 (búsqueda) añade un `<input>` en el header que filtra el sidebar.
- [ ] Feature 10 (progreso) marca módulos leídos en el sidebar (checkmark al lado del `NavLink`).
- [ ] Feature 11 (responsive) convierte el sidebar en drawer móvil.

## Rationale

**Por qué un layout route (Shell con `<Outlet />`) y no un componente envoltorio.** React Router v7 lo hace idiomático: una sola declaración, todas las rutas hijas heredan el layout, las rutas sin layout (dev) viven afuera. El `<Outlet />` cambia según la URL sin remontar el Shell, así el sidebar y el header mantienen estado (y el scroll).

**Por qué `NavLink` y no `<Link>` con detección manual de activo.** `NavLink` añade `aria-current="page"` automático cuando la ruta matchea (importante para a11y) y expone `isActive` en el className. Cero código custom; mismo coste que `<Link>`.

**Por qué CSS Grid y no Flexbox para el layout.** Grid declara el layout 2D de una vez (áreas con nombres). Flexbox obligaría a anidar divs para header + sidebar + main. Con Grid son 8 líneas y lees el layout de un vistazo.

**Por qué el link mapper usa `CATALOG.folder` y no `.id`.** Los links en Markdown están escritos por humanos usando los nombres de carpeta (`../Google_Sheets/G01.md`). Si cambiamos el patrón de slug en el futuro (`.id` cambia), el mapeo sigue funcionando porque mira `folder` del catálogo.

**Por qué 280px de sidebar y no auto.** 280px da espacio cómodo para los labels de categoría ("Apps Script") más los `mod.id` (`A01`, `H12`) sin cortar ni hacer wrap feo. Si el label del módulo crece (ej. labels completos en vez de solo id), subir a 320-360px.

## References

- React Router v7 `createBrowserRouter` + `Outlet`: https://reactrouter.com/en/main/start/data
- `NavLink` + `isActive`: https://reactrouter.com/en/main/components/nav-link
- CSS Grid areas: https://developer.mozilla.org/docs/Web/CSS/CSS_grid_layout

(basis: documentación oficial y práctica común de la comunidad React al noviembre de 2026)
