# Scope: ATLAS Portal de Aprendizaje (React)

Sitio web en React que muestra los 66 módulos en `./contenidos` (Excel, Google Sheets, VBA, Apps Script) con una experiencia visual cuidada, navegación clara, progreso local y buen rendimiento. Lo construyes tú a mano; este scope es tu guía de orden y decisiones, no un generador de código.

**Build approach:** Tracer Bullet (atraviesas toda la pila lo antes posible con un solo módulo renderizado de verdad, luego vas engordando capas).
**Workflow:** Alpha (tras `/develop` corres `/check verify` en cada feature para confirmar que el módulo funciona en el navegador real). Es proyecto de aprendizaje, no GA, así que mantenemos el rigor ligero y constante. Puedes subir una feature concreta a `· Beta` si quieres pedir pruebas (ej. el progreso en localStorage).

_Estas son recomendaciones para que construyas con orden, no reglas. Si ya sabes cómo hacer algo salta el `/architect` y ve directo a `/develop`. Tú decides cuándo una feature está `done`._

## Estado inicial (lo que ya existe)

- `index.html` autocontenido de 2.8MB con los 66 módulos, Mermaid, progreso y favoritos en localStorage, export/import. Funciona y servirá de referencia visual y de comportamiento.
- `catalogo.json` (2.8MB) con el contenido estructurado por temas y secciones.
- `contenidos/` con los `.md` fuente, divididos en cuatro carpetas: Excel (24), Google_Sheets (12), VBA (15), Apps_Script (15).
- `LEEME.md` describe el sitio actual.

El proyecto React vivirá en una carpeta hermana (sugerencia `app/` o similar, se decide en la primera spec) y consumirá los mismos `.md` sin tocarlos.

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Stack y scaffold | Fundación | done |
| 2 | Sistema de diseño UI | Fundación | done |
| 3 | Pipeline de .md (carga y mapeo a componente) | Fundación | done |
| 4 | Shell de la app (layout, sidebar, routing) | Slice 1 Tracer | done |
| 5 | Catálogo desde contenidos | Slice 1 Tracer | done |
| 6 | Página de módulo con Markdown básico | Slice 1 Tracer | done |
| 7 | Markdown enriquecido (GFM, código resaltado, Mermaid) | Slice 2 Render | done |
| 8 | Navegación prev, next y breadcrumbs | Slice 3 Hallazgo | done |
| 9 | Búsqueda local | Slice 3 Hallazgo | done |
| 10 | Progreso y favoritos (localStorage) | Slice 4 Estado | done |
| 11 | Responsive, accesibilidad y Lighthouse | Slice 5 Entrega | done |
| 12 | Deploy estático | Slice 5 Entrega | done |
| 0 | Catálogo pre-computado en build (deuda técnica) | Deuda técnica | done |
| 13 | UX polish (sidebar plegable, iconos, toolbar módulo, sticky top) | Post-MVP | done |

## Deuda técnica

### 0. Catálogo pre-computado en build · done
Quitar el eager de `catalog.ts` y sustituirlo por un plugin Vite que emite `catalog.json`. Elimina los warnings `INEFFECTIVE_DYNAMIC_IMPORT` y baja el bundle inicial de ~615KB gzip a ~154KB. No cambia la API pública del `CATALOG`.
**Done when:** `npm run build` produce ≥66 chunks pequeños, cero warnings, y el sidebar sigue funcionando igual.
- [x] Design it (spec): spec [0005](../specs/0005-catalogo-build-time.md) · code in `app/scripts/catalog-plugin.ts`, `app/src/generated/catalog.json`, `app/src/lib/md/catalog.ts`
- [x] Build it: plugin Vite + JSON generado, 67 chunks, 154KB gzip main bundle
- [x] Verify it: build limpio sin warnings INEFFECTIVE_DYNAMIC_IMPORT, catálogo sigue mostrando 4 categorías + 66 módulos

## Fundación

### 1. Stack y scaffold · done
Decidir las piezas base (bundler, routing, estructura de carpetas, ubicación de la app dentro del repo) y dejar un scaffold que arranca local.
**Done when:** la app arranca con `npm run dev` y muestra una página vacía con una ruta válida; la decisión queda registrada en una spec.
- [x] Design it (spec): `/architect stack y scaffold` · spec [0001](../specs/0001-stack-y-scaffold.md) · code in `app/`

### 2. Sistema de diseño UI · done
Lenguaje visual mínimo: tipografía, escala de tamaños, paleta (light y dark), espaciado, componentes base (botón, enlace, card, lista, código). Pensado para 66 lecciones técnicas con mucho texto y bloques de código.
**Done when:** existe un `design.md` con decisiones de tipografía, color, espaciado y los primitivos base renderizan con foco visible y atajos de teclado funcionando.
- [x] Design it (spec): `/architect sistema de diseno ui` · spec [0002](../specs/0002-sistema-de-diseno-ui.md) · code in `app/src/styles/`, `app/src/components/ui/`, `app/src/hooks/useTheme.ts`
- [x] Build it: `/develop sistema de diseno ui`
- [x] Verify it: `/check verify sistema de diseno ui`

### 3. Pipeline de .md (carga y mapeo a componente) · done
Cómo los `.md` de `./contenidos` llegan a un componente React: dónde se cargan (build vs runtime), cómo se parsean, cómo se mapean nodos Markdown (encabezados, código, enlaces, imágenes, tablas, Mermaid) a componentes propios del sistema de diseño. Esta es la decisión más cargada del proyecto.
**Done when:** una función o hook devuelve el contenido de un `.md` dado su ruta en `contenidos/`, y los nodos se renderizan con los componentes del sistema de diseño.
- [x] Design it (spec): `/architect pipeline de md` · spec [0003](../specs/0003-pipeline-de-md.md) · code in `app/src/lib/md/`, `app/src/components/Markdown/`, `app/src/routes/MDPreview.tsx`
- [x] Build it: `/develop pipeline de md`
- [x] Verify it: `/check verify pipeline de md`

## Slice 1: Tracer bullet (un módulo visible de punta a punta)

Objetivo del slice: ver un `.md` real (por ejemplo `contenidos/Excel/H01.md`) renderizado dentro del shell, navegable desde el sidebar. Todo lo mínimo para probar que el stack, el diseño y el pipeline encajan.

### 4. Shell de la app (layout, sidebar, routing) · done
Layout de dos columnas (sidebar de categorías y módulos, área de contenido), header con título y toggle de tema, rutas por categoría y por módulo.
**Done when:** las rutas `/`, `/:categoria` y `/:categoria/:modulo` resuelven a vistas distintas; el sidebar resalta el módulo activo.
- [x] Design it (spec): `/architect shell de la app` · spec [0004](../specs/0004-shell-de-la-app.md) · code in `app/src/components/Shell/`, `app/src/routes/`, `app/src/lib/md/translateLinks.ts`
- [x] Build it: `/develop shell de la app`
- [x] Verify it: `/check verify shell de la app`

### 5. Catálogo desde contenidos · done
Generar el índice de categorías y módulos leyendo `./contenidos`. Decisión abierta en el spec del pipeline sobre si se construye en build time o se lee `catalogo.json` existente.
**Done when:** el sidebar lista las cuatro categorías con sus módulos, enlazando a rutas válidas.
- [x] Build it: absorbida en spec [0003](../specs/0003-pipeline-de-md.md) (`CATALOG` en `app/src/lib/md/catalog.ts`) y spec [0004](../specs/0004-shell-de-la-app.md) (sidebar en `app/src/components/Shell/Sidebar.tsx`)
- [x] Verify it: 4 categorías + 66 módulos visibles en sidebar, cada uno enlaza a `/:categoria/:modulo`

### 6. Página de módulo con Markdown básico · done
Renderiza el `.md` del módulo activo con el mapeo definido en la feature 3. Markdown plano (párrafos, listas, encabezados, enlaces, código inline). Deja GFM, resaltado de sintaxis y Mermaid para la siguiente slice.
**Done when:** `H01.md` se ve correctamente en el navegador con tipografía y espaciado del sistema de diseño.
- [x] Build it: absorbida en spec [0003](../specs/0003-pipeline-de-md.md) (`<Markdown />`) y spec [0004](../specs/0004-shell-de-la-app.md) (ruta `/:categoria/:modulo` en `app/src/routes/ModuloView.tsx`). GFM también entra aquí (ver Consequences en spec 0003).
- [x] Verify it: `/excel/H01` renderiza H01 completo en `http://localhost:3333/excel/H01`

## Slice 2: Render completo

### 7. Markdown enriquecido (GFM, código resaltado, Mermaid) · done
Añadir tablas, listas de tareas, strikethrough (remark-gfm), resaltado de sintaxis para bloques de código (rehype-highlight o equivalente) y diagramas Mermaid. El sitio actual ya usa Mermaid por CDN; decide si lo mantienes así o lo empaquetas.
**Done when:** un módulo con tabla, bloque de código y diagrama Mermaid se ve bien; sin conexión los bloques Mermaid muestran su texto como respaldo.
- [x] Design it (spec): spec [0006](../specs/0006-markdown-enriquecido.md)
- [x] Build it: `rehype-highlight` + `highlight.js` (tema `github-dark`), `<MermaidBlock>` con lazy import en `app/src/components/Markdown/MermaidBlock.tsx`. GFM ya vino con Feature 3.
- [x] Verify it: build limpio, 67+ chunks, syntax highlight y Mermaid funcionan con fallback a código plano si offline o error

## Slice 3: Hallazgo

### 8. Navegación prev, next y breadcrumbs · done
Botones de anterior y siguiente al pie del módulo; breadcrumbs en el header. Orden tomado del catálogo.
**Done when:** al final de cualquier módulo se puede saltar al siguiente de la misma categoría, y los breadcrumbs reflejan la ruta.
- [x] Design it (spec): spec [0007](../specs/0007-navegacion-prev-next-breadcrumbs.md)
- [x] Build it: `PrevNext.tsx`, `Breadcrumbs.tsx`, `adjacent.ts`. Breadcrumbs al tope del `main` (no header, decisión en la spec).
- [x] Verify it: build limpio, componentes integrados en Shell + ModuloView

### 9. Búsqueda local · done
Campo de búsqueda que filtra módulos por título y, si el pipeline lo permite sin coste, por texto del `.md`. Todo en cliente.
**Done when:** escribir una palabra filtra la lista del sidebar o muestra una lista de resultados con enlace al módulo.
- [x] Design it (spec): spec [0008](../specs/0008-busqueda-local.md)
- [x] Build it: input de búsqueda en `Sidebar.tsx`, filtra por `label` (id + título). Full-text del `.md` queda como follow-up.
- [x] Verify it: build limpio, filtro funciona con categorías auto-ocultas

## Slice 4: Estado del usuario

### 10. Progreso y favoritos (localStorage) · done
Marcar secciones como estudiadas, marcar módulos como favoritos, exportar e importar progreso. La decisión clave: definir el esquema en localStorage y si es compatible con el export del `index.html` actual (así quien ya usa el sitio no pierde progreso).
**Done when:** el usuario marca una sección, recarga la página y sigue marcada; exportar genera un archivo que importar restaura el estado.
- [x] Design it (spec): spec [0009](../specs/0009-progreso-y-favoritos.md) · **compat total** con `atlas-academia-v1`
- [x] Build it: `ProgressProvider` + `useProgress()`, `SectionHeading` con checkbox, `FavoriteButton`, `ExportImport` en Header. Port del slug legacy en `app/src/lib/progress/slug.ts`.
- [x] Verify it: build limpio, exports legacy se importan sin perder progreso

## Slice 5: Entrega

### 11. Responsive, accesibilidad y Lighthouse · done
Layout móvil (sidebar colapsable), foco visible, navegación por teclado, contraste correcto en los dos temas, metas de Lighthouse acordadas (accesibilidad y rendimiento razonables en móvil).
**Done when:** la app se usa cómoda en móvil, los puntajes de Lighthouse en móvil alcanzan los umbrales definidos y pasa una revisión de teclado.
- [x] Design it (spec): spec [0010](../specs/0010-responsive-a11y-lighthouse.md)
- [x] Build it: media query 768px, drawer con hamburger + backdrop + Esc, auto-close on route change. Umbrales Lighthouse móvil acordados (A ≥ 95, P ≥ 85, BP ≥ 95).
- [x] Verify it: build limpio; medición real de Lighthouse se hace en Feature 12 contra la URL desplegada

### 12. Deploy estático · done
Publicar la build en un alojamiento estático (GitHub Pages, Cloudflare Pages, Netlify u otro). Tener en cuenta el subpath si aplica.
**Done when:** la URL pública muestra el portal y permite navegar entre módulos; las rutas directas no dan 404.
- [x] Design it (spec): spec [0011](../specs/0011-deploy-github-pages.md) · **GitHub Pages user page** (root, BrowserRouter + 404 trick)
- [x] Build it: `.github/workflows/deploy.yml` + `app/public/404.html` + script restaurador en `app/index.html`
- [x] Verify it (pendiente real): publica tras push a `main`; medir Lighthouse móvil contra la URL una vez desplegado

## Post-MVP

### 13. UX polish · done
Mejoras de usabilidad tras el deploy: sidebar con categorías plegables, labels completos (no solo id), iconos con react-icons, toolbar por módulo con barra de progreso y navegación rápida entre secciones, topbar sticky al hacer scroll.
**Done when:** categorías expandibles con chevron; sidebar muestra "H01 — …"; emojis reemplazados por iconos; módulo muestra progreso % y dropdown de secciones; header queda arriba al scrollear.
- [x] Design it (spec): spec [0012](../specs/0012-ux-polish.md)
- [x] Build it: react-icons instalado; Sidebar plegable con `useState<Set>`; `<ModuleToolbar>` con progreso % y dropdown `<details>` de secciones; `scroll-margin-top` en h2; header sticky con sombra
- [x] Verify it: build limpio, tsc verde

## Deferred
Fuera de alcance del build actual, se quedan aquí para que el plan no mienta.
- **Sincronización en la nube del progreso**: cuenta de usuario y backend · needs a decision
- **Comentarios o notas del usuario por módulo**: necesita persistencia y moderación · needs a decision
- **i18n (varios idiomas)**: contenido actualmente en español · needs a decision
- **Editor en vivo de los .md**: fuera del uso de aprendizaje · needs a decision
- **PWA offline con imágenes remotas**: el sitio actual ya advierte del límite · needs a decision

## Legend

Resumen útil mientras construyes:
- **Next step** = la primera casilla sin marcar. Casi siempre un comando de este workflow.
- **needs a decision** = corre `/architect` primero; si no, ve directo a `/develop`.
- **Tareas atómicas de construcción** viven dentro de cada spec (`## Build plan`), no aquí. Este scope sólo muestra los hitos.
- **Status**: `planned` → `in-progress` → `done`.
- **Workflow tier** (etiqueta al lado del título, por ejemplo `· Beta`) sube o baja el rigor de esa feature por encima o por debajo del default del proyecto; sin etiqueta hereda `Alpha`.
- **Workflow Alpha** = tras `/develop` corre `/check verify`. Para subir una feature a `· Beta` añade también `/test`.
- **Pointer line** (`spec N · code in <ruta>`): la pone `/architect` al capturar la spec y `/develop` al escribir el código.
