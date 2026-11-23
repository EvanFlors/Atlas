# Sistema de diseño · ATLAS

Decisiones mínimas para construir las 66 lecciones del portal. Pensado para texto y código, no para dashboards ni marketing. Cambia los valores en `tokens.css` y todo sigue coherente; este documento referencia por nombre de token, no por valor, así no miente.

Spec de origen: [`docs/specs/0002-sistema-de-diseno-ui.md`](../../../docs/specs/0002-sistema-de-diseno-ui.md)

## Tipografía

**Fuente del body:** pila nativa del sistema operativo (`--font-sans`).
Razón: cero descarga, cada usuario ya tiene su San Francisco, Segoe o Roboto instalado.

**Fuente del código:** JetBrains Mono (`--font-mono`), cargada local desde `app/public/fonts/` en pesos 400 y 700. Fallback a `ui-monospace, Menlo, Consolas, monospace` si falla la descarga.
Razón: el código es protagonista en 66 lecciones; ~44KB en total es un lujo que vale.

**Escala tipográfica** (modular 1.2, minor third):
`--text-xs` (13px) · `--text-sm` (14px) · `--text-base` (16px) · `--text-lg` (19px) · `--text-xl` (23px) · `--text-2xl` (28px) · `--text-3xl` (33px).

**Alturas de línea:**
`--leading-tight` (1.25) para títulos, `--leading-normal` (1.6) para texto corrido.

## Color

Dos temas, mismos nombres de token; cambia lo que hay detrás.

**Neutros:**
`--color-bg` · fondo de página.
`--color-bg-elevated` · fondo de hover o hover sutil.
`--color-surface` · fondo de cards y bloques elevados.
`--color-text` · texto principal.
`--color-text-muted` · texto secundario (metadata, descripciones).
`--color-border` · borde de cards, inputs, separadores.

**Acento** (un solo color; azul):
`--color-accent` · links, botones primarios, foco.
`--color-accent-hover` · hover de accent.
`--color-accent-fg` · color legible sobre fondo accent (texto de botón primario).
`--color-focus` · anillo de foco visible (por defecto = accent).

**Código:**
`--color-code-bg` · fondo de bloques y chips inline.
`--color-code-text` · texto del código.

**Sombras:**
`--shadow-sm` (sutil, cards) · `--shadow-md` (modales, popovers, si llegan) · `--shadow-lg` (reservado).

**Contraste:** los pares `text/bg`, `text/surface`, `accent-fg/accent` cumplen WCAG AA (texto ≥ 4.5:1, texto grande ≥ 3:1) en light y dark, verificado a ojo con el inspector del navegador. Si añades un color, verifícalo del mismo modo.

## Espaciado

Escala base 4px (`--space-1` = 4, `--space-2` = 8, `--space-3` = 12, `--space-4` = 16, `--space-5` = 24, `--space-6` = 32, `--space-7` = 48, `--space-8` = 64, `--space-9` = 80, `--space-10` = 96).

Regla de uso: `space-2`/`space-3` dentro de un componente (padding, gap entre elementos del mismo grupo), `space-4`/`space-5` entre grupos pequeños, `space-6`/`space-7` entre secciones. `space-8`+ solo para layouts de página.

## Radios y bordes

`--radius-sm` (4px) · chips, inline code.
`--radius-md` (8px) · botones, cards.
`--radius-lg` (12px) · modales, imágenes destacadas.

Bordes: siempre 1px con `--color-border`. Para énfasis sobre acento, usa el color accent como borde en vez de añadir grosor.

## Foco visible

Todos los interactivos reciben `:focus-visible` desde `base.css`:

```css
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

Un componente nuevo no debería tener que redefinir esto. Si tiene un `border-radius` especial, basta con que su CSS defina `border-radius`; el outline lo sigue.

## Tema

Tres estados: `light` | `dark` | `system`. El usuario los cicla con `<ThemeToggle />`. La preferencia vive en `localStorage['atlas.theme']`.

Al cargar la página, un script inline en `index.html` lee la preferencia y pone `data-theme` en `<html>` **antes** del primer render, evitando el flash de tema incorrecto. El hook `useTheme` mantiene estado reactivo durante la sesión y escucha cambios del tema del sistema operativo cuando el usuario está en modo `system`.

Para empezar en un tema concreto desde código:

```ts
document.documentElement.dataset.theme = 'dark'
```

## Primitivos

Cinco componentes en `app/src/components/ui/`. Todos aceptan `className` para componerse sin romper encapsulación. Todos consumen tokens, nunca valores literales.

- **`Button`** · `variant: 'primary' | 'ghost'`, `size: 'sm' | 'md'`.
- **`Link`** · interno (envuelve `react-router-dom`) o externo (abre pestaña nueva con `rel="noopener noreferrer"`).
- **`Card`** · contenedor con border + radius + sombra sutil.
- **`List`** · `<ul>` o `<ol>` con variantes `plain` (sin bullets) y `bulleted`.
- **`Code`** · inline (`<code>`) o bloque (`<pre><code>`); el resaltado de sintaxis se añade en la Feature 7.

**Añadir un primitivo nuevo:** sigue el patrón de `Button` (carpeta propia, `.tsx` + `.module.css`, tipos explícitos, `className` componible). Si el componente necesita un token que no existe, añádelo a `tokens.css` en los dos bloques (`:root` y `[data-theme="dark"]`); no inventes valores sueltos en el CSS.

## Dónde inspeccionar

La ruta `/_ui` monta una galería viva de los 5 primitivos y la escala tipográfica. Solo existe en desarrollo (`import.meta.env.DEV`), nunca en producción. Para añadir un primitivo nuevo, pégalo también ahí.

## Shell de la app

Toda la navegación vive dentro de `<Shell />` (en `app/src/components/Shell/`), un layout route de React Router que renderiza:

- **Header** fijo arriba (60px): brand "ATLAS" como link a `/` y el `<ThemeToggle />`.
- **Sidebar** izquierda fija (280px): lista las 4 categorías del `CATALOG` con sus módulos como `NavLink`. El activo recibe `aria-current="page"` + fondo elevado + borde accent.
- **Main** fluido: aquí entra el `<Outlet />` que cambia según la ruta.

Tres rutas principales: `/` (home con cards de categorías), `/:categoria` (lista de módulos de esa categoría), `/:categoria/:modulo` (el `.md` renderizado). Slug limpio para la URL (`/excel`, `/google-sheets`), que no coincide con el nombre de carpeta en disco (`Excel`, `Google_Sheets`); la traducción vive en `translateContentHref` (`app/src/lib/md/translateLinks.ts`) y la usa el `<Markdown />` para mapear links relativos entre `.md`.

Las rutas de dev (`/_ui`, `/_md/:categoria/:modulo`) viven fuera del Shell, con su propio layout. Mobile y sidebar colapsable se dejan para Feature 11.

## Markdown de los módulos

El componente `<Markdown source={raw} />` (en `app/src/components/Markdown/`) parsea `.md` runtime con `react-markdown` + `remark-gfm` y mapea los nodos a nuestros primitivos:

- Enlaces → `<Link>` (interno si apunta a `.md` de contenidos, externo si es URL).
- Listas `ul`/`ol` → `<List variant="bulleted" | "numbered">`.
- `blockquote` → `<Card>` con borde accent.
- `code` inline → etiqueta nativa; `pre > code` → `<Code block>`.
- `img` → `<span>` con imagen + leyenda del `alt` (loading lazy, fallback en error).
- `table` → tabla nativa con wrapper scrollable y estilos de token.
- Bloques `mermaid` → placeholder visible hasta Feature 7.

Para ver cualquier módulo real: `/_md/:categoria/:modulo` (solo dev). El catálogo tipado vive en `app/src/lib/md/catalog.ts` (`import { CATALOG } from '...'`), con las 4 categorías y 66 módulos listos para alimentar al sidebar en Feature 4.
