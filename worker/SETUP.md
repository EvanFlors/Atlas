# Atlas Chat Worker — Setup

Backend en Cloudflare Workers + Vectorize. Zero gcloud. Embeddings corren 100% local (build) y 100% en navegador (runtime). LLM: MiniMax (ya tienes la key).

## Flujo de datos

```
[build local]  node scripts/build-rag-index.mjs
   transformers.js → Xenova/multilingual-e5-small (384 dim, ~120 MB a ~/.cache/huggingface la primera vez)
   → app/public/rag-index.json   (contenidos chunked + vectors)

[upload one-time]  cd worker && npm run vectorize:upload
   → Vectorize "atlas-chunks" (384 dim, cosine)

[runtime]  usuario abre chat
   navegador descarga MISMO modelo (~120 MB, cacheado en IndexedDB)
   query → embedQuery() → qVec[384]
   POST /api/chat { query, qVec, history } → Worker
   Worker:
     - env.VECTORIZE.query(qVec, topK=5)   ← similitud correcta: mismo modelo en ambos lados
     - POST api.minimax.io chatcompletion_v2 con contexto
     - responde { answer, sources }
```

## One-time setup

### 1. Cloudflare account + wrangler

```bash
cd worker
npm install
npx wrangler login
```

### 2. Vectorize index (384 dim, cosine)

```bash
npm run vectorize:create
```

### 3. KV namespace (para el daily cap)

```bash
npx wrangler kv namespace create ATLAS_KV
```

Copia el `id` impreso y pégalo en `wrangler.jsonc` → `kv_namespaces[0].id`.

### 4. Build del índice (local, 100% offline)

```bash
cd ../app
npm install @xenova/transformers    # si no está
npm run rag:build                   # ~5-10 min la primera vez (descarga modelo)
```

### 5. Sube el índice a Vectorize

```bash
cd ../worker
npm run vectorize:upload            # usa wrangler para hacer insert
```

### 6. Secreto: MiniMax API key

```bash
# La toma del .env en la raíz del repo
grep MINIMAX_API_KEY ../.env | cut -d= -f2 | npm run secret:minimax
```

(o `npm run secret:minimax` y pegas la key manualmente)

### 7. Deploy

```bash
npm run deploy
```

Wrangler imprime la URL: `https://atlas-chat.<tu-subdominio>.workers.dev`.

### 8. Enlaza el front

Añade a `app/.env` (o al `.env` raíz):

```
VITE_API_URL=https://atlas-chat.<tu-subdominio>.workers.dev
```

Rebuildeas: `cd app && npm run build`, y despliegas el `dist/` a GitHub Pages.

## Desarrollo local

```bash
# Terminal 1 — Worker
cd worker
echo 'MINIMAX_API_KEY=sk-...' > .dev.vars   # gitignored
npm run dev                                  # :8787

# Terminal 2 — Front
cd ../app
VITE_DEV_API_TARGET=http://localhost:8787 npm run dev
```

El primer envío en el navegador descarga el modelo (~120 MB). Barra de progreso visible en el chat.

## Actualizar el índice

```bash
cd app && npm run rag:build               # regenera rag-index.json
cd ../worker && npm run vectorize:upload  # upsert a Vectorize (seguro, usa mismo id)
```

## Costos

| Servicio | Free tier | Uso estimado (consulta) |
|---|---|---|
| Workers | 100k req/día | 1 req/consulta |
| Vectorize | 30M dim queried/mes | 384 × 5 topK = 1920 dim/consulta → ~15k consultas/mes gratis |
| KV | 100k reads/día + 1k writes/día | 1 read + 1 write/consulta |
| Rate limit binding | ilimitado en free | — |
| MiniMax | tu plan actual | chat completion, cuesta créditos de tu cuenta |
| Transformers.js | gratis (local) | descarga modelo 1 vez |

El `DAILY_CAP=500` en `wrangler.jsonc` protege tu gasto de MiniMax.

## Qué se eliminó

El `server/` Express con Vertex AI quedó borrado. Todo corre ahora en el Worker (prod) o `wrangler dev` (local).
