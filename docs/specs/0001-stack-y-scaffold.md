# 0001 · Stack y scaffold

**Status**: Accepted
**Date**: 2026-11-20
**Feature**: scope.md · Feature 1 (Fundación)
**Build approach**: Tracer Bullet

## Summary

Levantar la base técnica del portal React en una carpeta hermana `app/`, usando Vite + React 18 + TypeScript + React Router v6. El scaffold arranca con `npm run dev` y sirve una página vacía en `/`. Nada más en esta spec: las decisiones de diseño UI, pipeline de `.md` y shell viven en sus propias specs (features 2, 3 y 4).

## Requirements

- **AC-1**: Desde la raíz del repo, `cd app && npm install && npm run dev` arranca el dev server en un puerto local (por defecto Vite 5173) sin errores.
- **AC-2**: Al abrir la URL que imprime Vite, el navegador muestra una página con un placeholder reconocible (ej. "ATLAS · scaffold listo") servida por una ruta React Router `/`.
- **AC-3**: `cd app && npm run build` produce `app/dist/` sin errores; `npm run preview` sirve esa build y sigue mostrando la ruta `/`.
- **AC-4**: `app/tsconfig.json` compila en modo strict; `npm run build` falla si hay errores de tipos.
- **AC-5**: El resto del repo queda intacto: `index.html`, `catalogo.json`, `contenidos/`, `LEEME.md`, `docs/` no se tocan.

## Decision

**Stack elegido:**

| Pieza | Elección | Por qué (una línea) |
|---|---|---|
| Carpeta de la app | `app/` hermana de `contenidos/` | Scope ya lo sugiere; mantiene `contenidos/` y el `index.html` legacy sin mezclarse. |
| Bundler / dev server | Vite 5 | Estándar actual para SPA React, HMR instantáneo, build estático directo a `dist/`. |
| Framework | React 18 | Es lo que pide el scope; versión estable y la que todos los libs de Markdown esperan. |
| Lenguaje | TypeScript (strict) | Confirmado por el usuario; paga solo al tipar nodos Markdown y el catálogo. |
| Routing | React Router v6 (declarativo, `createBrowserRouter`) | De facto para React SPA; soporta `/`, `/:categoria`, `/:categoria/:modulo` sin trucos. |
| Gestor de paquetes | npm | Ya aparece en el scope (`npm run dev`); sin configuración extra. |
| Node | LTS actual (≥20) | Vite 5 lo requiere; cualquier LTS reciente sirve. |
| Lint / format | Los que trae la plantilla Vite + ESLint | No añadir Prettier ni reglas custom en esta spec; si hace falta, en otra. |
| Tests | Ninguno en el scaffold | Workflow Alpha: `/check verify` manual; `/test` vendrá slice por slice si subes alguna a Beta. |

**Scaffold base:** se usa la plantilla oficial `npm create vite@latest app -- --template react-ts`, se instalan `react-router-dom`, y se reemplaza el `App.tsx` por un router mínimo con una sola ruta `/` que renderiza el placeholder.

**Implementation skills:** ninguno específico del proyecto todavía (no hay `AGENTS.md`). Seguir los defaults de Vite y React Router.

## Design

**Layout del repo después del scaffold:**

```
Portal_Aprendizaje_66_Modulos/
├── app/                      ← nuevo
│   ├── public/
│   ├── src/
│   │   ├── main.tsx          ← monta RouterProvider en #root
│   │   ├── router.tsx        ← createBrowserRouter con la ruta /
│   │   ├── routes/
│   │   │   └── Home.tsx      ← placeholder "ATLAS · scaffold listo"
│   │   └── styles.css        ← reset mínimo; el sistema de diseño es feature 2
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── contenidos/               ← intacto
├── docs/                     ← intacto
├── catalogo.json             ← intacto
├── index.html                ← legacy, intacto
└── LEEME.md                  ← intacto
```

**`vite.config.ts` mínimo:**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

**`src/router.tsx` mínimo:**

```tsx
import { createBrowserRouter } from 'react-router-dom'
import Home from './routes/Home'

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
])
```

**Qué NO entra en esta spec (importante para no desbordar):**
- Alias de imports, path mappings, barrel files. Los decide la siguiente spec que los necesite.
- Rutas `/:categoria` y `/:categoria/:modulo`: vienen en la spec 4 (shell).
- Lectura de `../contenidos/*.md` desde Vite: feature 3 (pipeline).
- Dark/light theme, tipografía, tokens: feature 2 (sistema de diseño).
- Deploy config (base path, 404 fallback): feature 12.

## Build plan

Orden Tracer Bullet (atraviesa una ruta de punta a punta antes de engordar nada):

1. **Crear `app/` con la plantilla oficial de Vite.**
   `cd /Users/efloresp06/Downloads/Portal_Aprendizaje_66_Modulos && npm create vite@latest app -- --template react-ts`
   Aceptar defaults; borrar el logo y CSS de demo pero dejar el HMR funcionando.

2. **Instalar React Router.**
   `cd app && npm install react-router-dom`

3. **Reemplazar `src/App.tsx` por un router mínimo** (`src/router.tsx` + `src/routes/Home.tsx` con el placeholder).

4. **Montar el router en `src/main.tsx`** usando `RouterProvider`.

5. **Limpiar lo que sobra**: `src/App.css`, `src/assets/`, cualquier archivo de la demo que ya no se usa.

6. **Verificar AC-1 y AC-2 a mano**: `npm run dev`, abrir el navegador, ver el placeholder.

7. **Verificar AC-3**: `npm run build && npm run preview`; confirmar que la ruta sigue cargando desde la build.

8. **Verificar AC-4**: dejar `"strict": true` en `tsconfig.json` (viene así en la plantilla); meter un error de tipo a propósito, correr `npm run build`, confirmar que falla; revertir.

9. **Commit único** con mensaje tipo `feat: scaffold React app with Vite + TS + Router (feature 1)`.

**Self-check**: AC-1 a AC-5 los verifica `/check verify stack y scaffold` a mano en el navegador y la terminal. No se escriben tests unitarios en esta spec (workflow Alpha para esta feature).

## Consequences

- A partir de ahora conviven dos sitios en el repo: el `index.html` legacy en la raíz y el nuevo `app/`. Mientras no haya deploy, está bien; cuando llegue la feature 12 habrá que elegir qué se publica.
- `npm install` dentro de `app/` crea un `node_modules/` (grande). Añadir `app/node_modules/`, `app/dist/` y `app/.vite/` a `.gitignore` (si no existe, créalo en la raíz).
- No hay monorepo (ni workspaces, ni pnpm). Si el proyecto crece y aparece un segundo paquete, se reevalúa. Hoy no hace falta.
- React Router v6 recibirá v7 pronto; la migración es casi trivial y no bloquea ninguna feature.
- Sin tests ni CI configurados; el rigor está en `/check verify` manual por feature, como pide el scope.

## Follow-up

- [ ] Cuando la feature 3 decida cómo se cargan los `.md`, revisar si `vite.config.ts` necesita `resolve.alias` para apuntar a `../contenidos`.
- [ ] Cuando llegue la feature 12 (deploy), decidir el `base` de Vite según el host (GitHub Pages necesita subpath).
- [ ] Si alguien quiere subir una feature a Beta y pedir `/test`, elegir runner (Vitest es el natural con Vite) en esa spec, no en esta.
- [ ] Añadir un `AGENTS.md` en `app/` cuando se asiente una convención (importa poco en el scaffold; `/sync` lo creará después).

## Rationale

**Por qué Vite y no otra cosa.** Create React App está deprecado. Next.js y Remix traen SSR/routing de servidor que este sitio no necesita (es puro contenido estático navegable en cliente, con los `.md` como fuente). Parcel funciona pero Vite es el default actual, con más ejemplos, más plugins y HMR impecable. Astro encajaría para un sitio de contenido, pero la interactividad parcial (islands) complica el router y la gestión de progreso local; para una SPA React de 66 rutas con estado cliente, Vite es la vía recta.

**Por qué React Router v6 y no TanStack Router ni routing a mano.** React Router v6 es el estándar que todo dev React reconoce; tres rutas anidadas no justifican la curva de TanStack, y hacer el matcher a mano regala bugs de back/forward sin aportar nada.

**Por qué `app/` y no la raíz.** Mantener el `index.html` legacy funcionando como referencia visual (lo dice el scope), y evitar que `npm init` o `vite` toquen `catalogo.json` o `contenidos/`. Cuando quieras borrar el legacy, es un `rm`, no un refactor.

**Por qué TypeScript strict desde el día uno.** El pipeline de Markdown (feature 3) va a mapear nodos a componentes; sin tipos, cada componente nuevo es un acierto a ciegas. La plantilla `react-ts` ya trae strict; pagar el coste ahora es gratis.

## References

- Vite · guía oficial: https://vitejs.dev/guide/
- React Router v6 · tutorial: https://reactrouter.com/en/main/start/tutorial
- Plantilla oficial Vite + React + TS: `npm create vite@latest`

(basis: documentación oficial y práctica común de la comunidad React al noviembre de 2026)
