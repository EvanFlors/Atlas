# 0005 · Catálogo pre-computado en build time

**Status**: Accepted
**Date**: 2026-11-22
**Feature**: scope.md · Feature 0 (Deuda técnica)
**Build approach**: Skateboard (una sola pieza que entrega el valor completo, sin fases)

## Summary

Quitar el eager de `app/src/lib/md/catalog.ts` y sustituirlo por un `catalog.json` generado por un plugin Vite al arrancar dev/build. El sidebar lee JSON pequeño (~5KB), y el loader lazy del Feature 3 por fin corta chunks reales por módulo. El bundle inicial baja de ~615KB gzip a ~100KB, y los warnings `INEFFECTIVE_DYNAMIC_IMPORT` desaparecen.

## Requirements

- **AC-1**: Un plugin de Vite en `app/scripts/catalog-plugin.ts` lee `contenidos/**/*.md` al arrancar (dev y build), parsea el primer h1 de cada archivo, y emite `app/src/generated/catalog.json` con la misma shape que hoy produce `catalog.ts`.
- **AC-2**: `app/src/lib/md/catalog.ts` exporta `CATALOG` leyendo ese JSON vía `import catalog from '../../generated/catalog.json'`. Nada de `import.meta.glob` eager.
- **AC-3**: El plugin regenera el JSON cuando cambia cualquier `.md` en `contenidos/` en modo dev (watcher). El cambio se refleja sin reiniciar el server.
- **AC-4**: `app/src/generated/catalog.json` **sí se versiona** (necesario porque `tsc -b` corre antes de `vite build` y necesita leer el JSON para tipar el import). El plugin lo regenera en cada `npm run build` y en dev watch; el commit es un snapshot reproducible.
- **AC-5**: `npm run build` produce **≥66 chunks pequeños** en `dist/assets/` (uno por `.md`) en lugar de un solo bundle gigante. El bundle inicial de JS baja a <150KB gzip.
- **AC-6**: Los warnings `INEFFECTIVE_DYNAMIC_IMPORT` desaparecen en `npm run build`.
- **AC-7**: La shape del `CATALOG` no cambia: todo el código que ya lo consume (Sidebar, Home, CategoriaView, ModuloView, translateLinks) sigue funcionando sin tocar.
- **AC-8**: Al visitar `/excel/H01` en producción (`npm run preview`), DevTools → Network muestra que se descarga un chunk pequeño con el contenido de H01 (y solo ese) tras la navegación.

## Decision

**Piezas elegidas:**

| Pieza | Elección | Por qué (una línea) |
|---|---|---|
| Timing | Plugin Vite con hook `buildStart` + `configureServer` para watch | Un solo sitio, idéntico en dev y prod, sin scripts npm separados. |
| Librería de parsing | `fs/promises` + regex para el primer h1 | Ya lo hace `catalog.ts`; copiar la misma regex, cero deps nuevas. |
| Formato de salida | JSON en `app/src/generated/catalog.json` | Vite lo importa como módulo tipado si añadimos `.d.ts`; alternativa a módulo `.ts` generado. |
| Tipos | Reuso `app/src/lib/md/types.ts` (`CatalogShape`) con un `as CatalogShape` en el import | Cero duplicación; si cambia la shape, falla el tipo. |
| Watch en dev | `server.watcher.add('contenidos/**/*.md')` + regenerar JSON en evento `change`/`add`/`unlink` | Nativo del dev server Vite; HMR dispara solo. |

**Dependencias nuevas:** 0.

**Implementation skills:** ninguno.

## Design

### Estructura de archivos

```
app/
├── scripts/
│   └── catalog-plugin.ts        ← NEW, plugin Vite
├── src/
│   ├── generated/               ← NEW, en .gitignore
│   │   ├── catalog.json         ← generado
│   │   └── .gitignore           ← "*" (ignorar todo el contenido)
│   └── lib/md/
│       └── catalog.ts           ← reescrito: lee el JSON
├── vite.config.ts               ← añade plugin
└── .gitignore                   ← añade src/generated/
```

### `scripts/catalog-plugin.ts`

```ts
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'

const FOLDER_TO_ID: Record<string, string> = {
  Excel: 'excel',
  Google_Sheets: 'google-sheets',
  VBA: 'vba',
  Apps_Script: 'apps-script',
}
const FOLDER_TO_LABEL: Record<string, string> = {
  Excel: 'Excel',
  Google_Sheets: 'Google Sheets',
  VBA: 'VBA',
  Apps_Script: 'Apps Script',
}

function firstH1(raw: string): string | null {
  const m = raw.match(/^#\s+(.+?)\s*$/m)
  return m ? m[1].trim() : null
}

async function buildCatalog(contenidosRoot: string) {
  const categorias = []
  for (const folder of Object.keys(FOLDER_TO_ID)) {
    const dir = path.join(contenidosRoot, folder)
    let files: string[] = []
    try {
      files = (await fs.readdir(dir)).filter((f) => f.endsWith('.md')).sort()
    } catch {
      continue
    }
    const modulos = await Promise.all(
      files.map(async (filename) => {
        const raw = await fs.readFile(path.join(dir, filename), 'utf8')
        const id = filename.replace(/\.md$/, '')
        return {
          id,
          label: firstH1(raw) ?? id,
          categoria: FOLDER_TO_ID[folder],
          path: `${folder}/${filename}`,
        }
      }),
    )
    categorias.push({
      id: FOLDER_TO_ID[folder],
      label: FOLDER_TO_LABEL[folder],
      folder,
      modulos,
    })
  }
  return { categorias }
}

export function catalogPlugin(opts: { contenidosRoot: string; out: string }): Plugin {
  const write = async () => {
    const data = await buildCatalog(opts.contenidosRoot)
    await fs.mkdir(path.dirname(opts.out), { recursive: true })
    await fs.writeFile(opts.out, JSON.stringify(data, null, 2))
  }
  return {
    name: 'atlas-catalog',
    async buildStart() {
      await write()
    },
    configureServer(server: ViteDevServer) {
      server.watcher.add(path.join(opts.contenidosRoot, '**/*.md'))
      const re = async (file: string) => {
        if (file.includes('/contenidos/') && file.endsWith('.md')) await write()
      }
      server.watcher.on('add', re)
      server.watcher.on('change', re)
      server.watcher.on('unlink', re)
    },
  }
}
```

### `vite.config.ts` (fragmento añadido)

```ts
import path from 'node:path'
import { catalogPlugin } from './scripts/catalog-plugin'

export default defineConfig({
  plugins: [
    react(),
    catalogPlugin({
      contenidosRoot: path.resolve(__dirname, '../contenidos'),
      out: path.resolve(__dirname, 'src/generated/catalog.json'),
    }),
  ],
  // ... resto intacto
})
```

### `app/src/lib/md/catalog.ts` (reescritura completa)

```ts
import catalog from '../../generated/catalog.json'
import type { CatalogShape } from './types'

export const CATALOG = catalog as CatalogShape
```

Cuatro líneas. El resto del archivo (regex, loop, mapeos) se elimina.

### `.gitignore` adiciones

Raíz o `app/.gitignore`:
```
app/src/generated/
```

## Build plan

Skateboard: una sola iteración que entrega todo el valor.

1. **Crear el plugin.** `app/scripts/catalog-plugin.ts` con el código del diseño.
2. **Registrarlo en `vite.config.ts`** (import + entrada en `plugins`).
3. **Correr `npm run dev`** una vez para que escriba `app/src/generated/catalog.json`. Verifica que el JSON existe y tiene 4 categorías + 66 módulos.
4. **Reescribir `catalog.ts`** a las 4 líneas que importan el JSON.
5. **Añadir `src/generated/` a `.gitignore`** (en `app/` o raíz).
6. **Verificar en navegador** `/excel`, `/excel/H01` — el sidebar y las vistas siguen funcionando idénticas.
7. **Build de prod:** `npm run build`. Esperado: muchos chunks pequeños, bundle inicial reducido, cero warnings `INEFFECTIVE_DYNAMIC_IMPORT`.
8. **Verificar lazy real** en `npm run preview`: abrir Network, navegar `/excel/H01` → ver que baja solo un chunk JS pequeño con el contenido.
9. **`npx tsc -b`** debe pasar (el JSON importado se tipa vía `as CatalogShape`).
10. **Tocar un `.md` en dev** (editar el h1 de H01, por ejemplo) y comprobar que el sidebar se actualiza sin reiniciar el server.
11. **Commit:** `perf: catálogo pre-computado en build, code-splitting real por módulo (feature 0)`.

**Self-check:** AC-5 y AC-6 son los que miden el valor (muchos chunks + sin warnings). Si ambos se cumplen, el feature está hecho.

## Consequences

- El bundle inicial baja de ~615KB gzip a estimado ~100-150KB gzip.
- Code-splitting real: cada `.md` es su propio chunk, visible en `dist/assets/`.
- Primera visita a un módulo descarga ~10-30KB extra (ese chunk) en lugar de ya tenerlo en el bundle inicial. Tradeoff aceptable para un portal.
- `app/src/generated/` no se versiona. En CI, el plugin corre en `buildStart` y crea el JSON antes de la build.
- Si alguien añade un `.md` nuevo, el dev server lo recoge en vivo. En producción, el siguiente build lo incluye.
- La shape del CATALOG se mantiene, así que ningún consumidor (Sidebar, Home, CategoriaView, ModuloView, translateLinks) cambia.
- `types.ts` sigue siendo la fuente de verdad del tipo; si cambia, el `as CatalogShape` en `catalog.ts` falla el tipo-check al construir.

## Follow-up

- [ ] Si en el futuro hay cientos de módulos, el JSON puede crecer. Si pasa de 50KB, considerar un endpoint por categoría (`/api/catalog/excel.json`).
- [ ] Si Lighthouse pide más optimización, añadir `modulePreload` o prefetch de los módulos vecinos al visitar uno.

## Rationale

**Por qué un plugin Vite y no un script `prebuild` en `package.json`.** El plugin corre también en dev (con watcher), así el flujo de edición de `.md` se mantiene fluido. Un script `prebuild` solo cubriría `npm run build`, no el dev.

**Por qué JSON y no un módulo TS generado.** JSON se importa con sintaxis estándar (`import x from './x.json'`), Vite lo trata como asset y lo inline sin transformar. Un módulo TS generado necesitaría un marcador para no caer en lint, y encima tendría overhead de parse al cargarlo.

**Por qué conservar la regex del h1 del plugin en vez de abstraer a librería.** Son 3 líneas y ya existen en `catalog.ts`. Importarlas desde el plugin obligaría a extraer a un módulo compartido Node+browser, más fricción que copia. shortcut: duplicación mínima, cuando crezca la lógica de parsing (frontmatter, etc.) extraer a `app/src/lib/md/parse.ts` compartido.

**Por qué `src/generated/` en `.gitignore` y no versionarlo.** Es derivado del tree de `contenidos/`. Versionarlo introduce drift cada vez que alguien edita un `.md` y olvida regenerar. En CI el plugin corre antes de build; en dev se auto-regenera. No hace falta.

## References

- Vite plugin API (`buildStart`, `configureServer`): https://vite.dev/guide/api-plugin
- Vite JSON imports: https://vite.dev/guide/features.html#json

(basis: documentación oficial Vite al noviembre de 2026)
