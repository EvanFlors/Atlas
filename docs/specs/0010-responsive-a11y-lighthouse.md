# 0010 · Responsive, accesibilidad y Lighthouse

**Status**: Accepted
**Date**: 2026-11-23
**Feature**: scope.md · Feature 11 (Slice 5 Entrega)
**Build approach**: Skateboard

## Summary

Hacer el shell usable en móvil (sidebar colapsable con hamburger), confirmar que foco visible y navegación por teclado funcionan, y fijar umbrales de Lighthouse acordados. Sin cambios de estructura ni deps nuevas: solo CSS + un `useState` + un botón.

## Requirements

- **AC-1**: En viewports ≥768px, layout idéntico al actual (sidebar fija 280px).
- **AC-2**: En viewports <768px, sidebar se oculta por defecto. Aparece un botón hamburger en el header (izquierda, antes del brand).
- **AC-3**: Click/tap en el hamburger abre el sidebar como drawer superpuesto sobre el contenido. Un backdrop semi-transparente permite cerrar tocando fuera.
- **AC-4**: Al navegar a cualquier ruta (click en un módulo del sidebar), el drawer se cierra automáticamente.
- **AC-5**: Tecla `Escape` cierra el drawer.
- **AC-6**: Navegación por teclado (Tab) recorre: hamburger (móvil) → brand → export/import → theme toggle → sidebar inputs → sidebar links → main content. Foco visible siempre (heredado de `base.css`).
- **AC-7**: Umbrales Lighthouse móvil acordados para la build de producción: **Accesibilidad ≥ 95**, **Performance ≥ 85**, **Best Practices ≥ 95**. SEO se pospone a Feature 12 (deploy real).
- **AC-8**: `tsc -b` y `npm run build` pasan.

## Decision

| Pieza | Elección | Por qué |
|---|---|---|
| Breakpoint | 768px (`min-width: 768px` para estilos desktop) | Convención común; iPad portrait y abajo entran en móvil. |
| Hamburger | Botón `<button>` en Header, solo visible <768px vía CSS | Reusa primitivo existente (variant ghost); cero deps de icon. Emoji `☰` por ahora. |
| Drawer open/close | `useState` en Shell, pasado a Header + Sidebar | Local y simple; no vale Context. |
| Cerrar en cambio de ruta | `useLocation` + `useEffect` en Shell cierra el drawer | Un hook, 3 líneas. |
| Cerrar con Esc | Event listener en `useEffect` cuando drawer abierto | Estándar. |
| Backdrop | `<div>` posicionado absoluto con fondo semi-transparente | Cero deps. |
| Umbrales Lighthouse | Documentados aquí y en `design.md`; se miden en Feature 12 con la URL real desplegada | Correr Lighthouse en dev da números engañosos. |

**Dependencias nuevas:** 0.

## Design

### Cambios en `Shell.tsx`

```tsx
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Breadcrumbs } from './Breadcrumbs'
import styles from './Shell.module.css'

export function Shell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { pathname } = useLocation()

  // Cerrar drawer al navegar.
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  // Cerrar con Escape.
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  return (
    <div className={`${styles.grid} ${drawerOpen ? styles.drawerOpen : ''}`}>
      <Header onToggleDrawer={() => setDrawerOpen((v) => !v)} drawerOpen={drawerOpen} />
      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>
      <main className={styles.main}>
        <Breadcrumbs />
        <Outlet />
      </main>
      {drawerOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
```

### Cambios en `Header.tsx`

```tsx
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button/Button'
import { ThemeToggle } from '../ThemeToggle'
import { ExportImport } from './ExportImport'
import styles from './Shell.module.css'

type Props = {
  onToggleDrawer: () => void
  drawerOpen: boolean
}

export function Header({ onToggleDrawer, drawerOpen }: Props) {
  return (
    <header className={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDrawer}
          aria-label={drawerOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={drawerOpen}
          className={styles.hamburger}
        >
          ☰
        </Button>
        <Link to="/" className={styles.brand}>
          ATLAS
        </Link>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <ExportImport />
        <ThemeToggle />
      </div>
    </header>
  )
}
```

### CSS en `Shell.module.css`

Grid ya existe. Añadir:

```css
/* Hamburger oculto en desktop */
.hamburger {
  display: none;
}

.backdrop {
  position: fixed;
  inset: 60px 0 0 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

@media (max-width: 767px) {
  .grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main";
  }

  .sidebar {
    position: fixed;
    top: 60px;
    left: 0;
    bottom: 0;
    width: 280px;
    background: var(--color-bg);
    transform: translateX(-100%);
    transition: transform 180ms ease;
    z-index: 2;
  }

  .drawerOpen .sidebar {
    transform: translateX(0);
  }

  .hamburger {
    display: inline-flex;
  }
}
```

### Accesibilidad y teclado

- Focus visible ya está (base.css con `:focus-visible` outline accent). Confirmar con Tab en dev.
- `<Button>` ghost ya incluye `aria-label` cuando se pasa, `aria-expanded` lo añadimos al hamburger.
- Backdrop con `aria-hidden="true"` (no es contenido, solo visual).
- Sin `focus trap` dentro del drawer en esta iteración (shortcut). Upgrade si una auditoría real lo exige.

### Umbrales Lighthouse

A medir en Feature 12 contra la URL desplegada:

| Métrica | Umbral móvil |
|---|---|
| Accesibilidad | ≥ 95 |
| Performance | ≥ 85 |
| Best Practices | ≥ 95 |
| SEO | se define en Feature 12 |

Razonable para un SPA estático con contenido pesado por módulo. Mermaid chunks lazy no cuentan al LCP de rutas sin diagramas; los módulos con Mermaid (G01, A01, ...) pueden bajar Performance localmente en la primera visita, aceptable.

## Build plan

Tareas:

1. **Tarea A · CSS responsive + hamburger**: añadir media query, estilos `.hamburger`, `.backdrop`, `.drawerOpen` en `Shell.module.css`.
2. **Tarea B · Shell state**: `useState(drawerOpen)` + `useEffect` para cerrar en navegación y con Esc.
3. **Tarea C · Header hamburger**: botón ghost con `☰`, props `onToggleDrawer` + `drawerOpen` (aria-expanded).
4. **Tarea D · Verify teclado**: Tab por la app completa, confirmar foco visible y orden lógico (visual, no automatizado).
5. **Tarea E · Build + cierre**: `npm run build`, design.md con umbrales, scope done, spec Accepted, commit.

## Consequences

- El drawer móvil se superpone al contenido con backdrop; UX estándar.
- `shortcut:` sin focus trap, Esc solo cierra. Upgrade cuando una auditoría formal lo pida.
- Lighthouse no se mide aquí; umbrales acordados. Feature 12 los valida contra el deploy real.
- El hamburger reusa `<Button>` ghost; estilos de foco ya cubiertos por base.css.

## Follow-up

- [ ] Focus trap dentro del drawer móvil (A11y avanzado).
- [ ] Atajos de teclado (`/` para search, `[`/`]` para prev/next).
- [ ] Reducir motion para quien tiene `prefers-reduced-motion`.
- [ ] Al desplegar (Feature 12), correr Lighthouse y documentar scores reales.

## Rationale

**Por qué 768px y no 640/1024.** Es el breakpoint donde un iPad portrait/tablet pequeña deja de tener espacio cómodo para la sidebar de 280px. Convención común.

**Por qué state local y no Context.** Solo Shell y Header lo tocan; prop drilling de 1 nivel es más obvio.

**Por qué Esc sí y focus trap no.** Esc es trivial (una línea) y UX estándar. Focus trap requiere capturar Tab/Shift-Tab en el drawer y es más código; se añade si se reporta.
