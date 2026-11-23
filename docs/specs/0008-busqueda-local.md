# 0008 · Búsqueda local

**Status**: Accepted
**Date**: 2026-11-23
**Feature**: scope.md · Feature 9 (Slice 3 Hallazgo)
**Build approach**: Skateboard

## Summary

Un `<input>` arriba del sidebar filtra módulos por su `label` (que ya incluye el id + título). Filtrado instantáneo en memoria contra el `CATALOG`. Categorías sin módulos tras filtro desaparecen. Búsqueda de texto completo del `.md` queda como follow-up: forzaría cargar los 66 archivos y deshace el lazy de Feature 0.

## Requirements

- **AC-1**: Arriba del sidebar hay un `<input type="search">` con placeholder "Buscar módulo…".
- **AC-2**: Al teclear, los módulos cuyo `label` no contiene la query (case-insensitive) se ocultan.
- **AC-3**: Categorías sin módulos visibles tras el filtro también se ocultan.
- **AC-4**: Borrar el input restaura la lista completa.
- **AC-5**: La query sobrevive al cambio de ruta (no se borra al navegar a un módulo).
- **AC-6**: Si no hay resultados, se muestra un texto discreto ("Sin resultados").
- **AC-7**: `tsc -b` y `npm run build` pasan.

## Decision

| Pieza | Elección | Por qué |
|---|---|---|
| Estado de la query | `useState` local en `Sidebar.tsx` | Nadie más la necesita; evitar Context por una cadena. |
| Filtrado | `cat.modulos.filter(m => m.label.toLowerCase().includes(q))` + `cat.modulos.length > 0` | Una línea; 66 módulos no se saturan. |
| Input | `<input>` nativo con `aria-label` | Reusar `<Button>` no aplica; input es input. |
| Persistencia de la query | Ninguna (vive en el estado del componente) | AC-5 solo pide que sobreviva al cambio de ruta, no al reload. El Sidebar no se desmonta al navegar (vive en Shell). |

**Dependencias nuevas:** 0.

## Design

### Cambios en `app/src/components/Shell/Sidebar.tsx`

Añadir estado `query`, derivar lista filtrada, renderizar input arriba:

```tsx
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { CATALOG } from '../../lib/md/catalog'
import styles from './Shell.module.css'

export function Sidebar() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const filtered = q
    ? CATALOG.categorias
        .map((cat) => ({
          ...cat,
          modulos: cat.modulos.filter((m) => m.label.toLowerCase().includes(q)),
        }))
        .filter((cat) => cat.modulos.length > 0)
    : CATALOG.categorias

  return (
    <nav className={styles.nav}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar módulo…"
        aria-label="Buscar módulo"
        className={styles.searchInput}
      />
      {filtered.length === 0 && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Sin resultados
        </p>
      )}
      {filtered.map((cat) => (
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

### Estilo del input en `Shell.module.css`

```css
.searchInput {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font: inherit;
  font-size: var(--text-sm);
  color: var(--color-text);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-3);
}

.searchInput:focus-visible {
  border-color: var(--color-accent);
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

El `:focus-visible` hereda del reset global pero sobreescribo offset porque este input es ancho y el outline default queda feo pegado.

## Build plan

1. **Tarea A · Input + filtro**: editar `Sidebar.tsx` con el código del diseño.
2. **Tarea B · CSS**: añadir `.searchInput` a `Shell.module.css`.
3. **Tarea C · Verify**: teclear "H0", confirmar que solo módulos H01-H09 se ven y las categorías vacías (Google Sheets, VBA, Apps Script) desaparecen. Borrar query → vuelve todo. Navegar a un módulo durante filtro → query sobrevive.
4. **Tarea D · Cierre**: design.md + scope done + spec Accepted + commit.

## Consequences

- Búsqueda por label solo. Si el usuario escribe "pivot" (palabra del contenido pero no del título), no encuentra nada. Follow-up si duele.
- El `label` ya incluye el id y el texto del primer h1 (ej. "H01 — Fundamentos de Excel..."), así que buscar "excel" o "H01" o "fundamentos" sí matchea.
- La query vive en el estado del Sidebar, que vive en el Shell, que NO se desmonta al navegar entre rutas hijas. AC-5 cumplido sin esfuerzo extra.
- No hay debounce. Con 66 módulos no se nota; si llegáramos a cientos, considerarlo.

## Follow-up

- [ ] Full-text search del contenido `.md`. Requiere pre-generar un índice en build time (misma idea que `catalog.json`) o usar `lunr`/`flexsearch` cargado lazy. No gratis.
- [ ] Atajo de teclado `/` para foco en el input, estilo GitHub.
- [ ] Highlight de las coincidencias en el label.

## Rationale

**Por qué estado local y no contexto global.** Nadie fuera del Sidebar consulta la query. Añadir un Provider para una string sería overkill.

**Por qué filtrar en cada render y no `useMemo`.** 66 módulos × `includes()` es microsegundos. `useMemo` añade complejidad sin ganancia medible.

**Por qué `<input>` nativo y no envolverlo en primitivo.** No hay primitivo de input en el sistema de diseño, y este es el único que necesitamos por ahora. Si Feature futura añade 3-4 inputs, se extrae a un primitivo `<Input>`.
