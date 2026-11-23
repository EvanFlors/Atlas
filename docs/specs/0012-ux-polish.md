# 0012 · UX polish

**Status**: Accepted
**Date**: 2026-11-23
**Feature**: scope.md · Feature 13 (Post-MVP)
**Build approach**: Skateboard (una sola iteración)

## Summary

Seis mejoras de UX tras el deploy: sidebar con categorías plegables + labels completos, iconografía con `react-icons/fi` (Feather), toolbar sticky por módulo con barra de progreso % y dropdown de secciones para navegación rápida, y topbar que queda pegada arriba durante scroll.

## Requirements

- **AC-1**: En el sidebar, cada categoría muestra un chevron (`FiChevronDown`/`FiChevronRight`) y es clicable para plegar/desplegar su lista de módulos. Por defecto, solo la categoría de la ruta activa queda abierta.
- **AC-2**: Los links de módulo en el sidebar muestran el `label` completo (`H01 — Fundamentos de Excel ...`) en lugar de solo el id. Truncar con ellipsis si desborda.
- **AC-3**: Hamburger, Export, Import, Theme toggle y Favorite usan iconos de `react-icons/fi` (y `react-icons/fa` para la estrella rellena). Los emojis actuales se reemplazan.
- **AC-4**: En la vista de módulo, un `<ModuleToolbar>` sticky bajo la topbar muestra: % de secciones completadas (barra), un dropdown "Secciones ▾" para saltar a cualquier h2, y el botón de favorito.
- **AC-5**: Cada `<h2>` dentro del Markdown (ya con section key) recibe `id={sectionKey}` para que el dropdown pueda hacer anchor scroll.
- **AC-6**: La topbar queda fija arriba cuando se hace scroll en el main (`position: sticky; top: 0`). Sombra sutil al scrollear.
- **AC-7**: `tsc -b` y `npm run build` pasan sin warnings nuevos.

## Decision

| Pieza | Elección | Por qué |
|---|---|---|
| Librería iconos | `react-icons` (Feather `fi` + Font Awesome `fa` para star filled) | Tree-shakes por icono, miles de icons, estándar comunitario. |
| Estado de categorías abiertas | `useState` local en Sidebar, inicializado con la categoría activa | Simple, sin persistencia innecesaria. |
| Sticky topbar | CSS `position: sticky; top: 0; z-index: 3` en el header | El grid ya aísla main; esto es belt-and-suspenders + sombra. |
| Toolbar módulo | Componente `<ModuleToolbar>` sticky `top: 60px` dentro del main | Siempre accesible sin ocupar espacio permanente. |
| Dropdown secciones | `<details><summary>Secciones ▾</summary><ul>...</ul></details>` nativo | Cero JS para el open/close; a11y gratis. |
| Progreso % | Memo sobre `state.sections` filtrado al moduleId, dividido por count de h2 (parsing del source) | Simple; no persiste, se recalcula al cambiar. |
| Anchor scroll | `<a href="#sectionKey">` + `scroll-margin-top` en h2 para no quedar bajo toolbar | Nativo; funciona en main con overflow-y auto. |

**Deps nuevas:** 1 (`react-icons`).

## Design

### Sidebar: categorías plegables + labels completos

```tsx
import { useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { CATALOG } from '../../lib/md/catalog'
import styles from './Shell.module.css'

export function Sidebar() {
  const { categoria: activeCat } = useParams<{ categoria?: string }>()
  const [query, setQuery] = useState('')
  const [openCats, setOpenCats] = useState<Set<string>>(
    () => new Set(activeCat ? [activeCat] : []),
  )
  const toggle = (id: string) =>
    setOpenCats((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  // Cuando filtra, fuerza abierto todas las categorías con resultados
  const q = query.trim().toLowerCase()
  const filtered = q
    ? CATALOG.categorias
        .map((cat) => ({
          ...cat,
          modulos: cat.modulos.filter((m) => m.label.toLowerCase().includes(q)),
        }))
        .filter((cat) => cat.modulos.length > 0)
    : CATALOG.categorias
  const effectiveOpen = q
    ? new Set(filtered.map((c) => c.id))
    : openCats

  return (
    <nav className={styles.nav}>
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
             placeholder="Buscar módulo…" aria-label="Buscar módulo"
             className={styles.searchInput} />
      {filtered.length === 0 && <p className={styles.empty}>Sin resultados</p>}
      {filtered.map((cat) => {
        const open = effectiveOpen.has(cat.id)
        return (
          <section key={cat.id} className={styles.category}>
            <button
              type="button"
              className={styles.catToggle}
              onClick={() => toggle(cat.id)}
              aria-expanded={open}
            >
              {open ? <FiChevronDown /> : <FiChevronRight />}
              <span>{cat.label}</span>
              <span className={styles.catCount}>{cat.modulos.length}</span>
            </button>
            {open && (
              <ul className={styles.modList}>
                {cat.modulos.map((mod) => (
                  <li key={mod.id}>
                    <NavLink to={`/${cat.id}/${mod.id}`}
                             className={({ isActive }) =>
                               isActive ? `${styles.modLink} ${styles.active}` : styles.modLink
                             }
                             title={mod.label}>
                      {mod.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </nav>
  )
}
```

CSS updates (en `Shell.module.css`):

```css
.catToggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  font-weight: 600;
  color: var(--color-text);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  width: 100%;
  text-align: left;
}
.catToggle:hover { background: var(--color-bg-elevated); }
.catToggle svg { flex-shrink: 0; }
.catCount {
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-weight: 400;
}

.modLink {
  /* ya existe; añadir truncado */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### Topbar sticky + sombra

En `Shell.module.css`, al `.header`:

```css
.header {
  /* existente */
  position: sticky;
  top: 0;
  z-index: 3;
  box-shadow: 0 1px 0 var(--color-border);
}
```

### ModuleToolbar

Nuevo `app/src/components/Shell/ModuleToolbar.tsx`:

```tsx
import { useMemo } from 'react'
import { FiList } from 'react-icons/fi'
import { useProgress } from '../../lib/progress/store'
import { sectionSlug } from '../../lib/progress/slug'
import { FavoriteButton } from './FavoriteButton'
import styles from './Shell.module.css'

type Props = { moduloId: string; source: string | null }

export function ModuleToolbar({ moduloId, source }: Props) {
  const { state } = useProgress()

  const headings = useMemo(() => {
    if (!source) return [] as { title: string; key: string }[]
    const out: { title: string; key: string }[] = []
    const re = /^##\s+(.+?)\s*$/gm
    let m
    let i = 0
    while ((m = re.exec(source)) !== null) {
      out.push({ title: m[1], key: `${sectionSlug(m[1])}-${i++}` })
    }
    return out
  }, [source])

  const total = headings.length
  const done = headings.filter((h) => state.sections[`${moduloId}|${h.key}`]).length
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div className={styles.toolbar}>
      <div className={styles.progressWrap} aria-label={`Progreso: ${pct}%`}>
        <div className={styles.progressBar} style={{ width: `${pct}%` }} />
        <span className={styles.progressLabel}>{done}/{total} · {pct}%</span>
      </div>
      {total > 0 && (
        <details className={styles.tocDetails}>
          <summary className={styles.tocSummary}><FiList /> Secciones</summary>
          <ul className={styles.tocList}>
            {headings.map((h) => (
              <li key={h.key}>
                <a href={`#${h.key}`}>{h.title}</a>
              </li>
            ))}
          </ul>
        </details>
      )}
      <FavoriteButton moduloId={moduloId} />
    </div>
  )
}
```

CSS:

```css
.toolbar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-4);
}
.progressWrap {
  position: relative;
  flex: 1;
  height: 8px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.progressBar {
  height: 100%;
  background: var(--color-accent);
  transition: width 200ms ease;
}
.progressLabel {
  position: absolute;
  right: 8px;
  top: -18px;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.tocDetails { position: relative; }
.tocSummary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  list-style: none;
}
.tocSummary::-webkit-details-marker { display: none; }
.tocList {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-1);
  min-width: 280px;
  max-height: 60vh;
  overflow-y: auto;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--space-2);
  list-style: none;
  z-index: 3;
}
.tocList a {
  display: block;
  padding: var(--space-1) var(--space-2);
  color: var(--color-text);
  text-decoration: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}
.tocList a:hover { background: var(--color-bg); }
```

### SectionHeading recibe `id`

Añadir `id={sectionKey}` al `<h2>`:

```tsx
<h2 className={styles.sectionHeading} id={sectionKey}>
```

Y en `Markdown.module.css`:

```css
.sectionHeading {
  /* existente */
  scroll-margin-top: 80px;  /* evita quedar bajo toolbar sticky */
}
```

### Reemplazar emojis

- `Header.tsx` hamburger `☰` → `<FiMenu />`
- `ExportImport.tsx` `⬇ Exportar` / `⬆ Importar` → `<FiDownload /> Exportar` / `<FiUpload /> Importar`
- `FavoriteButton.tsx` `★`/`☆` → `<FaStar />` / `<FaRegStar />`
- `ThemeToggle.tsx` `☀`/`🌙`/`🖥` → `<FiSun />` / `<FiMoon />` / `<FiMonitor />`
- `PrevNext.tsx` `←`/`→` → `<FiArrowLeft />` / `<FiArrowRight />`

## Build plan

1. `npm install react-icons`.
2. Reescribir `Sidebar.tsx` con collapsible + labels completos + chevron.
3. CSS Shell: `.catToggle`, `.catCount`, truncado en `.modLink`, sticky en `.header`, bloque `.toolbar` + hijos.
4. Añadir `id={sectionKey}` en `SectionHeading.tsx` + `scroll-margin-top` en `Markdown.module.css`.
5. Crear `ModuleToolbar.tsx`. Montar en `ModuloView.tsx` (reemplazar el `FavoriteButton` suelto actual).
6. Reemplazar emojis por iconos en Header, ExportImport, FavoriteButton, ThemeToggle, PrevNext.
7. Build, commit, push.

## Consequences

- `react-icons` añade ~5KB gzip al bundle inicial (solo los iconos importados; tree-shake).
- Un dropdown `<details>` nativo tiene estilos del navegador; los override con CSS para quitarlos y hacer el summary clicable como botón.
- Progreso % se recalcula en cada render del ModuleToolbar; barato para <50 h2s por módulo.
- Al expandir una categoría del sidebar, la lista crece y puede requerir scroll; la aside ya tiene `overflow-y: auto`.

## Follow-up

- [ ] Highlight de la sección actual en el TOC al scrollear (IntersectionObserver).
- [ ] Persistir estado abierto/cerrado de categorías en `localStorage` si molesta re-expandir.
- [ ] Botón "marcar módulo completo" cuando progreso llega a 100%.

## Rationale

**Por qué `react-icons` y no una pila custom de SVG.** Cinco minutos de diferencia; tree-shake asegura que solo pagas por los iconos que usas.

**Por qué `<details>` nativo para el dropdown TOC.** Open/close, estado accesible (`aria-expanded` auto), focus visible nativo. Cero JS para la mecánica; solo CSS para el skin.

**Por qué la única categoría abierta por defecto.** 66 módulos expandidos ocupan mucho scroll; abrir solo la activa reduce ruido visual.

**Por qué el toolbar sticky al top del main y no una side-rail.** Side-rail robaría ancho a la columna de contenido; sticky horizontal es el patrón que Notion/Docs usan.
