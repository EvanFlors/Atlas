# 0002 · Sistema de diseño UI

**Status**: Accepted
**Date**: 2026-11-20
**Feature**: scope.md · Feature 2 (Fundación)
**Build approach**: Tracer Bullet

## Summary

Lenguaje visual mínimo para el portal: tokens en CSS custom properties (color, tipografía, espaciado, radios, sombras), CSS Modules por componente, tema light/dark con toggle persistente, y 5 primitivos (`Button`, `Link`, `Card`, `List`, `Code`) con foco visible y navegables por teclado. Pensado para 66 lecciones técnicas con mucho texto y código. Cero dependencias nuevas (solo JetBrains Mono bajada como archivo local).

## Requirements

- **AC-1**: Existe `app/src/styles/tokens.css` con variables para color, tipografía, espaciado, radios y sombras, consumidas desde los componentes.
- **AC-2**: El sitio soporta light y dark; por defecto respeta `prefers-color-scheme`; un toggle en la UI lo cambia y la preferencia persiste en `localStorage` (clave `atlas.theme`, valores `light` | `dark` | `system`).
- **AC-3**: El cambio de tema no produce flash de tema incorrecto (FOUC) al cargar; se aplica antes del primer render.
- **AC-4**: Existen 5 componentes primitivos en `app/src/components/ui/`: `Button`, `Link`, `Card`, `List`, `Code`. Cada uno tiene su `.module.css` y usa solo tokens, nunca valores hardcodeados.
- **AC-5**: Todos los primitivos interactivos (`Button`, `Link`, toggle) muestran un anillo de foco claramente visible al navegar con Tab, en ambos temas.
- **AC-6**: El contraste de texto sobre fondo pasa WCAG AA (≥ 4.5:1 para texto normal, ≥ 3:1 para texto grande) en ambos temas, verificado a ojo con la herramienta del navegador.
- **AC-7**: Existe una ruta `/_ui` (solo en desarrollo, oculta del sidebar) que renderiza los 5 primitivos para inspeccionarlos; funciona como galería viva.
- **AC-8**: La fuente JetBrains Mono carga desde `app/public/fonts/` (local, no CDN), con `font-display: swap` para no bloquear el render.
- **AC-9**: Existe `app/src/styles/design.md` (o equivalente dentro de `docs/`) que lista las decisiones de tipografía, color y espaciado para que otras features las reusen. **Nota:** el scope pide `design.md`; lo ponemos en `app/src/styles/design.md` para que viva junto al código que documenta.

## Decision

**Piezas elegidas:**

| Pieza | Elección | Por qué (una línea) |
|---|---|---|
| Lenguaje de estilos | Vanilla CSS + CSS Modules + CSS custom properties | Cero dependencias; CSS Modules evita colisiones; las vars sirven para themeing sin JS. |
| Tokens | Un único `app/src/styles/tokens.css` con `:root` (base y light) y `[data-theme="dark"]` (overrides) | Un sitio único para tocar la paleta; cambiar tema es un atributo en `<html>`. |
| Tipografía body | System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, …`) | Render instantáneo, cero peso, encaja con cada SO. |
| Tipografía código | **JetBrains Mono Variable** (`.woff2`, local) con `font-display: swap`; fallback a `ui-monospace, Menlo, Consolas, monospace` | El código es protagonista en este portal; una sola fuente web (≈40KB) es un lujo que vale. Local evita depender de CDN. |
| Escala tipográfica | Modular 1.200 (minor third): 13, 14, 16, 19, 23, 28, 33 | Suave, legible para texto largo; 6 tamaños cubren todo. |
| Paleta | Neutros + un acento azul. Dark basado en superficie `#0f1115`, light en `#fafafa`. Contraste verificado AA. | Minimalista, profesional, no compite con el contenido ni con Mermaid. |
| Espaciado | Escala de 4px: `--space-1` a `--space-10` (4, 8, 12, 16, 24, 32, 48, 64, 80, 96) | Simple, suficiente; 4px es el ritmo base. |
| Radios y sombras | 3 radios (`sm`, `md`, `lg` = 4, 8, 12) y 2 sombras (`sm`, `md`) | No hace falta más para 5 primitivos. |
| Toggle de tema | Hook `useTheme()` + componente `ThemeToggle` (botón de 3 estados: light/dark/system) | API clara, respeta preferencia del sistema cuando se elige "system". |
| Anti FOUC | Script inline en `index.html` que lee `localStorage` y pone `data-theme` en `<html>` antes de cargar React | 10 líneas; evita el flash sin un framework de SSR. |
| Primitivos | `Button`, `Link`, `Card`, `List`, `Code` hechos a mano, cada uno en `app/src/components/ui/<Nombre>/` | Son 5 piezas simples; una librería traería más complejidad que la que resuelve. |
| Galería de UI | Ruta `/_ui` solo visible si `import.meta.env.DEV` | Suficiente para inspeccionar y validar a ojo; no vale un Storybook todavía. |

**Implementation skills:** ninguno específico del proyecto todavía (no hay `AGENTS.md`). El skill `frontend-design` del harness es una guía útil, no una dependencia.

## Design

### Capas y organización

```
app/src/
├── styles/
│   ├── tokens.css        ← variables light + dark, escala tipográfica, espaciado
│   ├── base.css          ← reset mínimo, selectores globales (body, h1, a, code, pre)
│   ├── fonts.css         ← @font-face de JetBrains Mono (apunta a /fonts/…)
│   └── design.md         ← AC-9: documento de decisiones
├── components/ui/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.module.css
│   ├── Link/…            ← React Router Link con estilos
│   ├── Card/…
│   ├── List/…
│   └── Code/…            ← inline y bloque
├── hooks/
│   └── useTheme.ts       ← estado, persistencia, aplica data-theme
├── components/
│   └── ThemeToggle.tsx   ← usa useTheme, reutiliza Button
└── routes/
    └── UIGallery.tsx     ← AC-7, ruta /_ui en dev
```

`app/public/fonts/` contiene `JetBrainsMono[wght].woff2` (variable, una sola descarga).

### Tokens (resumen; el archivo completo lo escribe el build plan)

Nombres finales en `tokens.css`:

```css
:root {
  /* color: neutrals */
  --color-bg: #fafafa;
  --color-bg-elevated: #ffffff;
  --color-surface: #ffffff;
  --color-text: #1a1b1e;
  --color-text-muted: #5a5e66;
  --color-border: #e4e6eb;

  /* color: accent */
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-accent-fg: #ffffff;

  /* color: focus ring */
  --color-focus: #2563eb;

  /* color: code */
  --color-code-bg: #f4f4f6;
  --color-code-text: #1a1b1e;

  /* typography */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", Helvetica, Arial, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
  --text-xs: 13px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 19px;
  --text-xl: 23px;
  --text-2xl: 28px;
  --text-3xl: 33px;
  --leading-tight: 1.25;
  --leading-normal: 1.6;

  /* spacing */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 24px; --space-6: 32px;
  --space-7: 48px; --space-8: 64px; --space-9: 80px; --space-10: 96px;

  /* radius, shadow */
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
}

[data-theme="dark"] {
  --color-bg: #0f1115;
  --color-bg-elevated: #15181f;
  --color-surface: #1a1d24;
  --color-text: #e6e8ec;
  --color-text-muted: #9aa0a9;
  --color-border: #2a2d35;
  --color-accent: #60a5fa;
  --color-accent-hover: #93c5fd;
  --color-accent-fg: #0f1115;
  --color-focus: #60a5fa;
  --color-code-bg: #15181f;
  --color-code-text: #e6e8ec;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.5);
}
```

Contraste probado a ojo con la herramienta del navegador. Si algún par falla AA al verificar, se ajusta el token y punto.

### Hook `useTheme` (contrato)

```ts
type Theme = 'light' | 'dark' | 'system'

function useTheme(): {
  theme: Theme                       // estado persistido
  resolved: 'light' | 'dark'         // lo que de verdad se pinta
  setTheme: (t: Theme) => void       // cambia + persiste + aplica data-theme
}
```

Guarda en `localStorage.setItem('atlas.theme', theme)`. Al cambiar, también actualiza `document.documentElement.dataset.theme`. Si `theme === 'system'`, escucha `matchMedia('(prefers-color-scheme: dark)')` y recalcula `resolved`.

### Script anti FOUC en `index.html`

Dentro de `<head>`, antes de los `<link>` y del script de Vite:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('atlas.theme') || 'system'
      var resolved = t === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : t
      document.documentElement.dataset.theme = resolved
    } catch (_) {}
  })()
</script>
```

Bloquea ~1ms y evita que el fondo blanco de la hoja parpadee en dark mode.

### Primitivos: API mínima

Cada uno exporta el tipo `Props` (`React.ComponentProps<'xxx'> & extras`) y acepta `className` para componerse sin romper encapsulación.

- **`Button`**: `variant: 'primary' | 'ghost' = 'primary'`, `size: 'sm' | 'md' = 'md'`. Nada más hasta que haga falta. Foco visible vía `:focus-visible` con `outline: 2px solid var(--color-focus); outline-offset: 2px`.
- **`Link`**: wrapper de `react-router-dom` `Link` que aplica estilos (color accent, subrayado en hover/focus). Si `href` es externo, usa `<a>` con `rel="noopener noreferrer" target="_blank"`.
- **`Card`**: contenedor con padding, border, radius `md`, sombra `sm`. Children libres.
- **`List`**: `<ul>` o `<ol>` estilizadas (reset de bullets por defecto y variante `bulleted`).
- **`Code`**: dos modos. Inline (`<code>`) con fondo sutil, padding 2-4px. Bloque (`<pre><code>`) con padding `space-4`, radius `md`, scroll horizontal, mono font. La feature 7 (Markdown enriquecido) añadirá resaltado de sintaxis encima; aquí solo el chasis.

### Galería `/_ui`

Montada solo cuando `import.meta.env.DEV`. En `router.tsx`:

```tsx
...createBrowserRouter([
  { path: '/', element: <Home /> },
  ...(import.meta.env.DEV ? [{ path: '/_ui', element: <UIGallery /> }] : []),
])
```

`UIGallery` renderiza cada primitivo con sus variantes (`Button primary/ghost`, `Link interno/externo`, `Card`, lista de ambos tipos, `Code` inline + bloque), con el `ThemeToggle` arriba para alternar en vivo.

## Build plan

Orden Tracer Bullet (completas el circuito fuente → tokens → un primitivo visible → toggle de tema, luego vas añadiendo primitivos):

1. **Carpeta de estilos.** Crea `app/src/styles/{tokens.css, base.css, fonts.css}`. Pega el `tokens.css` del diseño arriba; `base.css` lleva un reset mínimo (`*,*::before,*::after { box-sizing: border-box; margin: 0 }`, `body { font-family: var(--font-sans); background: var(--color-bg); color: var(--color-text); line-height: var(--leading-normal) }`, `:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px }`).

2. **JetBrains Mono local.** Descarga `JetBrainsMono[wght].ttf` variable desde github.com/JetBrains/JetBrainsMono/releases (último release), conviértelo a `.woff2` (hay servicios online o fontTools; si prefieres evitar la conversión, usa el `.woff2` del release si está disponible), guárdalo en `app/public/fonts/JetBrainsMono-Variable.woff2`. En `fonts.css`:
   ```css
   @font-face {
     font-family: 'JetBrains Mono';
     src: url('/fonts/JetBrainsMono-Variable.woff2') format('woff2-variations');
     font-weight: 100 800;
     font-display: swap;
   }
   ```

3. **Importa en `main.tsx`.** Reemplaza `import './index.css'` por tres líneas:
   ```ts
   import './styles/tokens.css'
   import './styles/fonts.css'
   import './styles/base.css'
   ```
   Borra `src/index.css` (ya no se usa).

4. **Anti FOUC.** Pega el script del diseño en `index.html` dentro de `<head>`, antes del `<script type="module" src="/src/main.tsx">`.

5. **Hook `useTheme`.** Crea `app/src/hooks/useTheme.ts` siguiendo el contrato de arriba. Maneja los tres estados, lee/escribe `localStorage`, escucha `matchMedia` cuando `theme === 'system'`, aplica `document.documentElement.dataset.theme` en cada cambio.

6. **Primer primitivo: `Button`.** Crea `app/src/components/ui/Button/{Button.tsx, Button.module.css}`. Dos variantes, dos tamaños, foco visible. Es el más usado y sirve de modelo para los otros.

7. **`ThemeToggle`.** Crea `app/src/components/ThemeToggle.tsx` usando `useTheme` + `Button`. Tres estados ciclan: light → dark → system → light. Muestra el estado actual como texto u emoji dentro del botón.

8. **Galería mínima.** Crea `app/src/routes/UIGallery.tsx` renderizando `ThemeToggle` + algunos `Button` de muestra. Añade la ruta `/_ui` al `router.tsx` solo en dev. Abre `http://localhost:5173/_ui` y comprueba que cambiar tema funciona en vivo sin flash.

9. **Resto de primitivos.** Añade `Link`, `Card`, `List`, `Code` siguiendo el mismo patrón. Añádelos a la galería para inspeccionar visualmente.

10. **`design.md`.** Escribe `app/src/styles/design.md` con las decisiones: paleta (listado de tokens), tipografía (sans + mono + escala), espaciado (escala 4px), radios/sombras, patrón de foco. Referencia los tokens por nombre, no por valor (así si cambian los valores, el doc no miente).

11. **Verificación AC-1..AC-9 a ojo** en `/_ui`: cambio de tema sin flash, foco visible en light y dark con Tab, contraste de los pares `text/bg` y `accent-fg/accent` probado con la herramienta del navegador (Inspector → tab Accessibility → Contrast ratio), fuentes cargan localmente.

12. **Commit único** (si git ya está inicializado): `feat: sistema de diseño UI con tokens, tema light/dark y 5 primitivos (feature 2)`.

**Self-check:** la ruta `/_ui` es el test vivo. Si cada primitivo se ve bien en ambos temas, el foco es visible y el toggle no parpadea, los AC están cumplidos. Workflow Alpha: no se escriben tests unitarios aquí; `/check verify` corre a mano en el navegador.

## Consequences

- Cualquier componente nuevo debe consumir tokens de `tokens.css`, nunca hardcodear colores ni tamaños. Si falta un token, se añade al archivo (no se improvisa en el componente).
- El sitio depende de un archivo de fuente local (`~40KB`). Añádelo al commit; sin él, el código se verá con la fuente mono del sistema (fallback funciona).
- El toggle tema guarda en `localStorage` con la clave `atlas.theme`. La Feature 10 (Progreso y favoritos) debe respetar ese namespace cuando defina su esquema.
- La galería `/_ui` no se construye en producción (`import.meta.env.DEV` la condiciona). Nada que limpiar en deploy.
- Al no usar Tailwind ni una librería de componentes, cada primitivo nuevo cuesta tiempo (pero solo son 5). Si el proyecto crece más allá del portal, reconsiderar.
- Resaltado de sintaxis para bloques de código **no** entra aquí; es la Feature 7. El primitivo `Code` solo da el chasis (background, padding, mono font).
- Accesibilidad: cumplimos lo básico (contraste AA + `:focus-visible`). Pruebas con lector de pantalla y navegación completa por teclado del shell entero vienen en la Feature 11.

## Follow-up

- [ ] Cuando la Feature 4 construya el shell, usar `Card` para el sidebar y `Link` para los módulos; si aparece una necesidad real, añadir el primitivo (no antes).
- [ ] Cuando la Feature 7 llegue, pasar el `Code` bloque por el highlighter (rehype o shiki) y asegurar que los tokens del tema oscuro combinan con el syntax theme.
- [ ] Si alguien quiere un visor más rico que `/_ui` (Storybook, Ladle), evaluarlo cuando haya >10 componentes. Hoy sobra.
- [ ] Si Lighthouse en Feature 11 señala coste de font-swap, considerar `font-display: optional` o preload.
- [ ] Añadir las convenciones a un `AGENTS.md` cuando `/sync` corra (al cerrar esta feature).

## Rationale

**Por qué CSS Modules + custom properties y no Tailwind ni shadcn.** El portal es texto y código: 5 componentes, dos temas, nada de lógica visual compleja. Tailwind añade config, plugin, PurgeCSS mental, y llena cada JSX de clases. shadcn arrastra Radix para primitivos que no necesitan comportamiento accesible complejo (un botón nativo con foco visible basta). CSS Modules nos da encapsulación sin herramientas; las custom properties hacen el tema trivial. Cuando los primitivos crezcan, migrar a Tailwind seguirá siendo posible.

**Por qué system fonts para el body y JetBrains Mono para el código.** Body: el usuario ya tiene su fuente favorita del SO instalada; el peso cero gana. Código: 66 lecciones lo usan intensivamente; un mono bien diseñado (ligaduras opcionales, alturas pensadas) vale los 40KB. JetBrains Mono es gratis, open source, variable (una descarga cubre todos los pesos), y un fallback decente (`ui-monospace`) cubre el peor caso.

**Por qué 3 estados de tema (light/dark/system) y no solo 2.** "Respeta mi sistema" es la opción más amable por defecto. Los que quieren fijar uno u otro ya lo tienen. Añadir el tercer estado cuesta 10 líneas más en el hook.

**Por qué galería `/_ui` y no Storybook.** Storybook pesa cientos de MB de deps, config propia, addons. Una ruta de React que renderice los primitivos resuelve lo mismo para este tamaño. Si el proyecto crece, siempre se puede añadir.

**Por qué `design.md` en `app/src/styles/` y no en `docs/`.** El scope pide "un `design.md`"; ponerlo junto a los archivos que documenta reduce la probabilidad de que se desactualice (regla del "code next to its docs"). Si se quiere un copy en `docs/`, basta un symlink o un link en la raíz del scope; lo dejo para `/sync`.

## References

- JetBrains Mono (fuente open source): https://www.jetbrains.com/lp/mono/
- CSS Modules en Vite: https://vitejs.dev/guide/features.html#css-modules
- `:focus-visible` MDN: https://developer.mozilla.org/docs/Web/CSS/:focus-visible
- WCAG 2.1 contraste: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html

(basis: documentación oficial y práctica común de la comunidad React al noviembre de 2026)
