# 0007 · Navegación prev, next y breadcrumbs

**Status**: Accepted
**Date**: 2026-11-23
**Feature**: scope.md · Feature 8 (Slice 3 Hallazgo)
**Build approach**: Skateboard

## Summary

Dos piezas pequeñas sobre lo que ya hay: breadcrumbs (`Home / Excel / H01`) al tope del `main`, y botones de prev/next al pie de cada módulo. Orden tomado del `CATALOG` ya tipado; se queda dentro de la misma categoría (sin salto cross-category).

## Requirements

- **AC-1**: En cada módulo (`/:categoria/:modulo`), al final del contenido aparecen dos botones: **Anterior** y **Siguiente**, con el label del módulo adyacente.
- **AC-2**: Si es el primer módulo de la categoría, el botón "Anterior" se oculta (o se muestra deshabilitado). Igual para el último con "Siguiente".
- **AC-3**: Al tope del área `main` aparecen breadcrumbs: `Home / <Categoria>` en una vista de categoría, `Home / <Categoria> / <ModuloId>` en una vista de módulo. En `/` no hay breadcrumbs.
- **AC-4**: Los breadcrumbs usan el primitivo `<Link>` para los niveles clicables. El último nivel (el actual) es texto plano, no link.
- **AC-5**: `tsc -b` y `npm run build` pasan.

## Decision

| Pieza | Elección | Por qué |
|---|---|---|
| Helper `adjacent(cat, mod)` | Nuevo `app/src/lib/md/adjacent.ts`, retorna `{ prev, next }` consultando `CATALOG` | Pura, testeable, cero deps. |
| `<PrevNext>` | Componente en `app/src/components/Shell/PrevNext.tsx`, usa `<Button variant="ghost">` existente | Reusa primitivo. |
| `<Breadcrumbs>` | Componente en `app/src/components/Shell/Breadcrumbs.tsx`, usa `useLocation` + `CATALOG` para derivar niveles | Se auto-adapta a cualquier ruta sin pasar props. |
| Dónde montar breadcrumbs | Dentro de `Shell.tsx` encima del `<Outlet />` | Un sitio común, cualquier ruta lo obtiene gratis. |
| Dónde montar prev/next | Dentro de `ModuloView.tsx` tras el `<Markdown />` | Solo aplica a vista de módulo. |

**Dependencias nuevas:** 0.

## Design

### `app/src/lib/md/adjacent.ts`

```ts
import { CATALOG } from './catalog'
import type { Modulo } from './types'

export function getAdjacent(categoriaId: string, moduloId: string): { prev: Modulo | null; next: Modulo | null } {
  const cat = CATALOG.categorias.find((c) => c.id === categoriaId)
  if (!cat) return { prev: null, next: null }
  const i = cat.modulos.findIndex((m) => m.id === moduloId)
  if (i < 0) return { prev: null, next: null }
  return {
    prev: i > 0 ? cat.modulos[i - 1] : null,
    next: i < cat.modulos.length - 1 ? cat.modulos[i + 1] : null,
  }
}
```

### `app/src/components/Shell/PrevNext.tsx`

```tsx
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button/Button'
import { getAdjacent } from '../../lib/md/adjacent'

type Props = { categoriaId: string; moduloId: string }

export function PrevNext({ categoriaId, moduloId }: Props) {
  const { prev, next } = getAdjacent(categoriaId, moduloId)
  if (!prev && !next) return null
  return (
    <nav
      aria-label="Navegación entre módulos"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-7)',
        paddingTop: 'var(--space-5)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div>
        {prev && (
          <Link to={`/${categoriaId}/${prev.id}`} style={{ textDecoration: 'none' }}>
            <Button variant="ghost">← {prev.id} · {prev.label}</Button>
          </Link>
        )}
      </div>
      <div>
        {next && (
          <Link to={`/${categoriaId}/${next.id}`} style={{ textDecoration: 'none' }}>
            <Button variant="ghost">{next.id} · {next.label} →</Button>
          </Link>
        )}
      </div>
    </nav>
  )
}
```

### `app/src/components/Shell/Breadcrumbs.tsx`

```tsx
import { Link, useLocation } from 'react-router-dom'
import { CATALOG } from '../../lib/md/catalog'

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return null  // en Home, no mostrar
  const [categoriaId, moduloId] = parts
  const cat = CATALOG.categorias.find((c) => c.id === categoriaId)
  if (!cat) return null

  return (
    <nav
      aria-label="Ruta"
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--space-4)',
      }}
    >
      <Link to="/" style={{ color: 'inherit' }}>Home</Link>
      <span>/</span>
      {moduloId ? (
        <>
          <Link to={`/${cat.id}`} style={{ color: 'inherit' }}>{cat.label}</Link>
          <span>/</span>
          <span style={{ color: 'var(--color-text)' }}>{moduloId}</span>
        </>
      ) : (
        <span style={{ color: 'var(--color-text)' }}>{cat.label}</span>
      )}
    </nav>
  )
}
```

### Integración en `Shell.tsx`

Añadir `<Breadcrumbs />` dentro del `<main>` antes del `<Outlet />`:

```tsx
<main className={styles.main}>
  <Breadcrumbs />
  <Outlet />
</main>
```

### Integración en `ModuloView.tsx`

Al final, tras el `<Markdown />`, añadir `<PrevNext>`:

```tsx
return (
  <>
    <Markdown source={source} currentCategoriaFolder={cat.folder} />
    <PrevNext categoriaId={cat.id} moduloId={mod.id} />
  </>
)
```

## Build plan

Tareas discretas para `/develop`:

1. **Tarea A · Helper**: crear `app/src/lib/md/adjacent.ts`, test mental con H01 (prev=null, next=H02), H24 (prev=H23, next=null).
2. **Tarea B · PrevNext**: componente + integración en `ModuloView.tsx`.
3. **Tarea C · Breadcrumbs**: componente + integración en `Shell.tsx`.
4. **Tarea D · Build + verify**: `npm run build`; visita `/excel/H01`, `/excel/H12`, `/excel/H24`, `/google-sheets` → confirmar comportamiento esperado.
5. **Tarea E · Cierre**: design.md + scope done + spec Accepted + commit.

## Consequences

- Prev/next no cruza categorías. Al terminar H24 no hay "Siguiente"; el usuario vuelve al sidebar o a la home.
- Breadcrumbs se calculan en runtime desde `useLocation` + `CATALOG`; ningún componente tiene que pasar props.
- Si el label de un módulo es muy largo, el botón "Siguiente" puede desbordar visualmente. Si se ve mal, truncar con CSS `max-width` + ellipsis (follow-up).

## Follow-up

- [ ] Si quieres salto cross-category (último de Excel → primero de Google Sheets), ampliar `getAdjacent` a una lista global de módulos ordenados; una línea.
- [ ] Atajos de teclado `←`/`→` para prev/next (no está en scope, pero es casi gratis).

## Rationale

**Por qué breadcrumbs dentro del `main` y no en el header.** El header ya lleva brand + theme toggle; añadir breadcrumbs lo ensancha de forma asimétrica. Dentro del `main` empiezan donde el ojo busca contexto (al inicio del contenido).

**Por qué `getAdjacent` como helper puro y no como hook.** Es un cálculo sincrónico sobre `CATALOG` (estático en runtime). Un hook añade overhead sin beneficio; una función pura se testea trivial.
