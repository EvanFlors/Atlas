# 0009 · Progreso y favoritos

**Status**: Accepted
**Date**: 2026-11-23
**Feature**: scope.md · Feature 10 (Slice 4 Estado)
**Build approach**: Skateboard

## Summary

Compat total con el esquema legacy. Guardamos en `localStorage['atlas-academia-v1']` con la misma shape `{done, sections, bookmarks, last}` (theme vive aparte en `atlas.theme`, feature 2). Checkboxes inline en cada `<h2>` dentro del Markdown, botón de favorito en la vista de módulo, y botones Exportar/Importar en el header. Un export legacy se importa sin perder progreso.

## Requirements

- **AC-1**: Cada `<h2>` dentro de `<Markdown />` renderiza con un checkbox a la izquierda del título.
- **AC-2**: Al marcar/desmarcar, el estado persiste en `localStorage['atlas-academia-v1'].sections['<moduloId>|<sectionKey>']`.
- **AC-3**: `sectionKey = sectionSlug(h2.text) + '-' + index`, donde `index` es la posición del h2 entre los h2s del módulo (empieza en 0). `sectionSlug` replica exactamente la función del legacy.
- **AC-4**: En la vista `/:categoria/:modulo` aparece un botón de "⭐ Favorito" que marca/desmarca `bookmarks[moduloId]`.
- **AC-5**: En el header, dos botones: "Exportar" descarga un `.json` con el estado completo; "Importar" acepta un `.json` y lo fusiona (reemplaza las claves presentes).
- **AC-6**: Un archivo exportado por el sitio legacy (shape `{done, sections, bookmarks, last, theme}`) se importa sin error; `theme` se ignora (nuestra app lo gestiona en `atlas.theme`).
- **AC-7**: Recargar la página mantiene todas las marcas y favoritos.
- **AC-8**: `last` se actualiza con el path actual al navegar a un módulo (compat con legacy).
- **AC-9**: Si `localStorage` está lleno/bloqueado, las operaciones de escritura muestran un mensaje discreto y no revientan.

## Decision

| Pieza | Elección | Por qué |
|---|---|---|
| Storage key | `atlas-academia-v1` (igual que legacy) | Compat total. |
| Shape | `{done, sections, bookmarks, last}` (theme fuera) | `theme` ya tiene su key separada en feature 2; dualizar sería redundante. |
| Slug function | Port exacto del legacy a `app/src/lib/progress/slug.ts` | Compat requiere cálculo idéntico de section keys. |
| Store | Context + `useProgress()` hook | 3 consumidores (checkbox, favorito, export/import); Context es obvio y suficiente. |
| Persistencia | `useEffect` escribe en `localStorage` en cada cambio | 66 módulos × pocos campos; no vale debounce. |
| UI checkbox | `<input type="checkbox">` nativo inline a la izquierda del h2 | Reusa estilo nativo; `:focus-visible` del reset ya aplica. |
| UI favorito | Botón ghost reusable con estrella (texto emoji) | Cero componentes nuevos. |
| Export/Import | Dos botones en Header que disparan `<a download>` o `<input type="file">` | Vanilla DOM, cero deps. |

**Dependencias nuevas:** 0.

## Design

### Tipos y slug

`app/src/lib/progress/schema.ts`:

```ts
export const STORAGE_KEY = 'atlas-academia-v1'

export type ProgressState = {
  done: Record<string, boolean>          // "H01" -> true
  sections: Record<string, boolean>      // "H01|fundamentos-0" -> true
  bookmarks: Record<string, boolean>     // "H01" -> true
  last: string                           // último path visitado
}

export const EMPTY: ProgressState = { done: {}, sections: {}, bookmarks: {}, last: '' }
```

`app/src/lib/progress/slug.ts`:

```ts
// Port exacto del slug() del sitio legacy (index.html).
// Normaliza acentos, lowercase, no-alfanuméricos a guión, trim, 90 chars.
export function sectionSlug(s: string): string {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90)
}
```

### Store

`app/src/lib/progress/store.tsx`:

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { EMPTY, STORAGE_KEY, type ProgressState } from './schema'

type Ctx = {
  state: ProgressState
  toggleSection: (moduloId: string, sectionKey: string) => void
  toggleBookmark: (moduloId: string) => void
  setLast: (path: string) => void
  isSection: (moduloId: string, sectionKey: string) => boolean
  isBookmarked: (moduloId: string) => boolean
  exportJson: () => string
  importJson: (json: string) => { ok: true } | { ok: false; error: string }
  replaceAll: (next: ProgressState) => void
}

const ProgressContext = createContext<Ctx | null>(null)

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw)
    // Accept legacy shape with extra fields (theme); ignore them.
    return {
      done: parsed.done ?? {},
      sections: parsed.sections ?? {},
      bookmarks: parsed.bookmarks ?? {},
      last: parsed.last ?? '',
    }
  } catch {
    return { ...EMPTY }
  }
}

function save(state: ProgressState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => load())

  useEffect(() => {
    save(state)
  }, [state])

  const toggleSection = useCallback((moduloId: string, sectionKey: string) => {
    const k = `${moduloId}|${sectionKey}`
    setState((s) => ({ ...s, sections: { ...s.sections, [k]: !s.sections[k] } }))
  }, [])

  const toggleBookmark = useCallback((moduloId: string) => {
    setState((s) => ({ ...s, bookmarks: { ...s.bookmarks, [moduloId]: !s.bookmarks[moduloId] } }))
  }, [])

  const setLast = useCallback((path: string) => {
    setState((s) => (s.last === path ? s : { ...s, last: path }))
  }, [])

  const isSection = useCallback(
    (m: string, k: string) => !!state.sections[`${m}|${k}`],
    [state.sections],
  )
  const isBookmarked = useCallback((m: string) => !!state.bookmarks[m], [state.bookmarks])

  const exportJson = useCallback(() => JSON.stringify(state, null, 2), [state])

  const importJson = useCallback((json: string): { ok: true } | { ok: false; error: string } => {
    try {
      const parsed = JSON.parse(json)
      if (typeof parsed !== 'object' || parsed === null) {
        return { ok: false, error: 'JSON inválido' }
      }
      const next: ProgressState = {
        done: parsed.done ?? {},
        sections: parsed.sections ?? {},
        bookmarks: parsed.bookmarks ?? {},
        last: parsed.last ?? '',
      }
      setState(next)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  }, [])

  const replaceAll = useCallback((next: ProgressState) => setState(next), [])

  const value = useMemo(
    () => ({
      state,
      toggleSection,
      toggleBookmark,
      setLast,
      isSection,
      isBookmarked,
      exportJson,
      importJson,
      replaceAll,
    }),
    [state, toggleSection, toggleBookmark, setLast, isSection, isBookmarked, exportJson, importJson, replaceAll],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
```

### Integración en Markdown: checkbox por h2

En `app/src/components/Markdown/Markdown.tsx`, el componente `<Markdown>` acepta un nuevo prop `moduloId?: string`. Si está presente, h2 renderiza con checkbox.

```tsx
interface Props {
  source: string | null | undefined
  currentCategoriaFolder?: string
  moduloId?: string
}

// Dentro del componente, mantén un contador local de h2s por render:
export function Markdown({ source, currentCategoriaFolder, moduloId }: Props) {
  // ...
  let h2Index = 0
  return (
    <ReactMarkdown
      // ...
      components={{
        // ...
        h2({ children }) {
          if (!moduloId) return <h2>{children}</h2>
          const title = typeof children === 'string' ? children : String(children)
          const key = `${sectionSlug(title)}-${h2Index++}`
          return <SectionHeading level={2} moduloId={moduloId} sectionKey={key}>{children}</SectionHeading>
        },
        // ...
      }}
    />
  )
}
```

`app/src/components/Markdown/SectionHeading.tsx`:

```tsx
import { useProgress } from '../../lib/progress/store'
import styles from './Markdown.module.css'

type Props = {
  level: 2 | 3
  moduloId: string
  sectionKey: string
  children: React.ReactNode
}

export function SectionHeading({ level, moduloId, sectionKey, children }: Props) {
  const { isSection, toggleSection } = useProgress()
  const checked = isSection(moduloId, sectionKey)
  const Tag = `h${level}` as 'h2' | 'h3'
  return (
    <Tag className={styles.sectionHeading}>
      <label className={styles.sectionCheck}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => toggleSection(moduloId, sectionKey)}
          aria-label={`Marcar sección como estudiada`}
        />
      </label>
      {children}
    </Tag>
  )
}
```

CSS en `Markdown.module.css`:

```css
.sectionHeading {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.sectionCheck {
  display: inline-flex;
  flex-shrink: 0;
}

.sectionCheck input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-accent);
}
```

### Favorito en ModuloView

`app/src/components/Shell/FavoriteButton.tsx`:

```tsx
import { Button } from '../ui/Button/Button'
import { useProgress } from '../../lib/progress/store'

export function FavoriteButton({ moduloId }: { moduloId: string }) {
  const { isBookmarked, toggleBookmark } = useProgress()
  const fav = isBookmarked(moduloId)
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggleBookmark(moduloId)}
      aria-label={fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      title={fav ? 'En favoritos' : 'Añadir a favoritos'}
    >
      {fav ? '★ Favorito' : '☆ Favorito'}
    </Button>
  )
}
```

Montar en `ModuloView.tsx` arriba del Markdown.

### Export/Import en Header

`app/src/components/Shell/ExportImport.tsx`:

```tsx
import { useRef } from 'react'
import { Button } from '../ui/Button/Button'
import { useProgress } from '../../lib/progress/store'

export function ExportImport() {
  const { exportJson, importJson } = useProgress()
  const fileRef = useRef<HTMLInputElement>(null)

  const onExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `atlas-progreso-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onPickFile = () => fileRef.current?.click()

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const result = importJson(text)
    if (!result.ok) alert(`Importar falló: ${result.error}`)
    e.target.value = ''
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={onExport} aria-label="Exportar progreso">
        ⬇ Exportar
      </Button>
      <Button variant="ghost" size="sm" onClick={onPickFile} aria-label="Importar progreso">
        ⬆ Importar
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={onFile}
        style={{ display: 'none' }}
      />
    </>
  )
}
```

Montar en `Header.tsx` antes del `ThemeToggle`.

### Setup en main.tsx

Envolver el `RouterProvider` con `<ProgressProvider>`:

```tsx
<StrictMode>
  <ProgressProvider>
    <RouterProvider router={router} />
  </ProgressProvider>
</StrictMode>
```

### `last` auto-update

En `ModuloView.tsx`, `useEffect` que llama `setLast(pathname)` cuando cambia la ruta.

## Build plan

Tareas discretas:

1. **Tarea A · Schema + slug + store**: `app/src/lib/progress/{schema.ts, slug.ts, store.tsx}`. ProgressProvider envolver en main.tsx.
2. **Tarea B · SectionHeading + integración Markdown**: nuevo componente, modificar `Markdown.tsx` para aceptar `moduloId` y mapear h2.
3. **Tarea C · FavoriteButton**: componente + montar en ModuloView.
4. **Tarea D · ExportImport**: componente + montar en Header.
5. **Tarea E · setLast en ModuloView**: effect que actualiza `last` al navegar.
6. **Tarea F · Build + verify**: `npm run build`; en navegador probar marcar sección → recargar → sigue marcada; favorito; export; importar export legacy.
7. **Tarea G · Cierre**: design.md + scope done + spec Accepted + commit.

## Consequences

- Cualquier componente que quiera leer progreso usa `useProgress()`.
- Guardar en `atlas-academia-v1` convive con la key `atlas.theme` de feature 2 sin colisión.
- Importar un export legacy funciona (ignoramos `theme` dentro). Exportar desde nosotros produce JSON sin `theme` → se importa en legacy sin problema (legacy aceptaría theme ausente como default).
- Los h2 ahora llevan un checkbox inline. Si un módulo no tiene h2s, no hay checkboxes (y no se marcan; `done` queda implícito).
- El contador `h2Index` dentro de `<Markdown>` se resetea en cada render. Asume que react-markdown recorre los nodos en orden (sí lo hace).
- `last` se actualiza en navegación, pero no se usa todavía para nada. Compat con legacy; feature futura podría "continuar donde lo dejaste".
- Si el usuario llena el `localStorage`, `save()` devuelve `false` silenciosamente. shortcut: upgrade a mostrar un toast cuando el sitio crezca.

## Follow-up

- [ ] Botón "Continuar donde lo dejaste" en Home usando `state.last`.
- [ ] Vista de favoritos: lista de módulos con `bookmarks[id]=true`.
- [ ] Progress bar por categoría en el sidebar.
- [ ] Marcar módulo completo (`done[moduleId]`) cuando todos sus h2 están marcados.

## Rationale

**Por qué compat total y no clean start.** El scope lo pide y los usuarios del sitio legacy no pierden progreso. Coste: una función `slug` portada y aceptar la shape histórica.

**Por qué Context y no `useSyncExternalStore` o Zustand.** Context es obvio, cero deps, maneja 66 checkboxes sin problema. `useSyncExternalStore` evitaría algo de re-render pero no vale la complejidad para esta escala.

**Por qué guardar en cada cambio sin debounce.** 66 módulos × muy pocos campos; `JSON.stringify` + `localStorage.setItem` es microsegundos. Debounce añade complejidad.

**Por qué botones Export/Import en Header y no una página /settings.** Header los deja descubribles sin añadir una ruta nueva. Si crecen los settings, se migra a /settings.
