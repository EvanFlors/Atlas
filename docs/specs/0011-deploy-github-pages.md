# 0011 · Deploy en GitHub Pages

**Status**: Accepted
**Date**: 2026-11-23
**Feature**: scope.md · Feature 12 (Slice 5 Entrega)
**Build approach**: Skateboard

## Summary

GitHub Pages user page (`<user>.github.io`), raíz. Workflow de GitHub Actions construye desde `app/` y publica `dist/` en Pages. BrowserRouter sobrevive gracias al truco `404.html` que reencamina a `index.html` con la ruta preservada. Base de Vite = `/`.

## Requirements

- **AC-1**: Al hacer push a `main`, GitHub Actions construye y despliega automáticamente.
- **AC-2**: La URL raíz (`https://<user>.github.io/`) muestra el home con las 4 categorías.
- **AC-3**: URLs directas (`https://<user>.github.io/excel/H01`, `/google-sheets`) resuelven al módulo o vista correcta tras el redirect del truco 404.
- **AC-4**: El workflow corre `npm ci` + `npm run build` en `app/`, luego publica `app/dist/`.
- **AC-5**: `app/contenidos` (symlink) se sigue en el runner Linux de Actions; el plugin regenera `catalog.json` en `buildStart`.
- **AC-6**: `build/dist/404.html` tiene el redirect SPA.
- **AC-7**: `index.html` tiene el script restaurador antes del `main.tsx` (ya existe el script anti-FOUC; añadimos este al lado).
- **AC-8**: Lighthouse móvil contra la URL desplegada cumple los umbrales acordados (Feature 11): A ≥ 95, P ≥ 85, BP ≥ 95.

## Decision

| Pieza | Elección | Por qué |
|---|---|---|
| Hosting | GitHub Pages user page (root) | Pedido por ti. Cero config de dominio. |
| Base path | `/` (default de Vite) | User page es root. |
| SPA fallback | 404.html + script restaurador (patrón Rafgraph) | Estándar comunitario, 2 archivos pequeños, cero deps. |
| CI/CD | GitHub Actions oficial (`actions/deploy-pages`) | Nativo, sin tokens ni claves. |
| Symlink contenidos | Se trackea como symlink en git; Linux lo resuelve en runner | Preservar estructura actual. |
| Caché de npm | `actions/setup-node` con `cache: 'npm'` | Builds más rápidos. |

**Dependencias nuevas:** 0.

## Design

### `.github/workflows/deploy.yml`

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: app
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: app/package-lock.json
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: app/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### `app/public/404.html`

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>ATLAS · redirigiendo…</title>
    <script>
      // SPA fallback para GitHub Pages: convierte /path/foo en /?p=/path/foo
      // y redirige al index. El script en index.html lo restaura antes de React.
      var l = window.location
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') + '/?p=' +
        encodeURIComponent(l.pathname + l.search) + l.hash
      )
    </script>
  </head>
  <body></body>
</html>
```

### Script restaurador en `app/index.html`

Añadir dentro de `<head>`, después del script anti-FOUC y antes del `<script type="module" src="/src/main.tsx">`:

```html
<script>
  // Restaura la ruta tras redirect del 404.html.
  (function () {
    var m = location.search.match(/[?&]p=([^&]+)/)
    if (m) {
      var path = decodeURIComponent(m[1])
      // elimina el ?p=... antes de montar React
      history.replaceState(null, '', path)
    }
  })()
</script>
```

### `vite.config.ts`

No cambia. `base` queda default (`/`) para user page root.

## Build plan

Tareas:

1. **Tarea A · `public/404.html`**: crear con el script redirect.
2. **Tarea B · Script restaurador en `index.html`**: añadir dentro del `<head>` tras el anti-FOUC.
3. **Tarea C · Workflow Actions**: crear `.github/workflows/deploy.yml` en la raíz del repo.
4. **Tarea D · Build local**: `npm run build` verifica que `dist/` contiene `404.html` (copia del public) y el index con el script.
5. **Tarea E · Cierre**: design.md + scope done + spec Accepted + commit.

**Lo que haces tú después del commit:**
1. Crear repo en GitHub con nombre `<tuusuario>.github.io`.
2. `git remote add origin git@github.com:<tuusuario>/<tuusuario>.github.io.git`
3. `git push -u origin main`.
4. En GitHub → Settings → Pages → Source: "GitHub Actions".
5. Esperar a que el workflow corra (minuto o dos).
6. Visitar `https://<tuusuario>.github.io/`.
7. Correr Lighthouse móvil contra esa URL y añadir los scores reales a `design.md`.

## Consequences

- Hay un flash minúsculo al hacer refresh en una URL directa: el 404 carga, redirige a `/?p=/excel/H01`, el index monta, el script restaura la URL, React Router lee el pathname. ~100-200ms de blink. Aceptable para un sitio estático.
- El workflow se dispara en cada push a main. Si haces muchos commits seguidos, `concurrency.cancel-in-progress` descarta builds viejos.
- Lighthouse en móvil: los módulos con Mermaid cargan ~700KB gzip extra (elk + cytoscape + katex). En conexiones lentas la primera visita a G01/A01 puede bajar el Performance local. Los módulos sin diagramas no pagan ese coste. Aceptable.
- `catalog.json` versionado se usa en el build de CI (el plugin lo regenera encima; idempotente).

## Follow-up

- [ ] Dominio custom (CNAME): cuando quieras `portal.midominio.com`, añade `public/CNAME` con el dominio y configura DNS.
- [ ] Preview de PRs: `actions/deploy-pages` solo publica main. Para PRs, usar un provider como Cloudflare Pages o Netlify.
- [ ] Añadir sitemap.xml y meta tags OG/Twitter para SEO (define en Feature 12.1 si hace falta).
- [ ] Monitoreo de métricas reales (web-vitals.js enviando a algún endpoint) si se quiere datos post-deploy.

## Rationale

**Por qué GitHub Actions oficial y no `gh-pages` branch con `gh-pages` npm.** Actions nativo ya tiene las acciones oficiales de Pages (`upload-pages-artifact` + `deploy-pages`), cero tokens, cero branch dedicada. El modo moderno de GitHub Pages.

**Por qué 404.html trick y no HashRouter.** Elegiste URLs limpias; 20 líneas de script cumplen sin tocar el router.

**Por qué no cambiar `base` en vite.config.** User page es root; base `/` funciona tal cual.

**Por qué `concurrency` en el workflow.** Evita que dos pushes seguidos tengan dos builds paralelos y una condición de carrera al publicar.
