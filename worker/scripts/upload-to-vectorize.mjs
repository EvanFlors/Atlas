#!/usr/bin/env node
// Convert app/public/rag-index.json → NDJSON and insert into Vectorize.
// Usage: npm run vectorize:upload
// Prereqs: wrangler installed + authed, Vectorize index "atlas-chunks" exists.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INDEX_PATH = path.resolve(__dirname, '..', '..', 'app', 'public', 'rag-index.json')
const NDJSON_PATH = path.resolve(__dirname, 'vectors.ndjson')
const INDEX_NAME = 'atlas-chunks'

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' })
    p.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`)))
  })
}

const raw = await fs.readFile(INDEX_PATH, 'utf8')
const idx = JSON.parse(raw)
console.log(`Loaded ${idx.chunks.length} chunks (dim ${idx.dim}, model ${idx.model})`)

// Vectorize metadata: strings only, caps at ~10 KB per vector.
// Trim text to fit (keep first 2000 chars — enough for the answer-building context).
const lines = idx.chunks.map((c, i) => JSON.stringify({
  id: `c${i}`,
  values: c.v,
  metadata: {
    categoriaId: c.categoriaId,
    moduloId: c.moduloId,
    moduloTitulo: c.moduloTitulo,
    sectionTitle: c.sectionTitle,
    sectionSlug: c.sectionSlug,
    text: c.text.slice(0, 2000),
  },
}))
await fs.writeFile(NDJSON_PATH, lines.join('\n'))
const size = (await fs.stat(NDJSON_PATH)).size
console.log(`Wrote ${NDJSON_PATH} (${(size / 1024 / 1024).toFixed(1)} MB, ${lines.length} vectors)`)

console.log('Inserting into Vectorize…')
await run('npx', ['wrangler', 'vectorize', 'insert', INDEX_NAME, '--file', NDJSON_PATH])
console.log('Done.')
