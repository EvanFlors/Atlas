#!/usr/bin/env node
// Build the RAG index 100% locally: chunk every .md under contenidos/,
// embed via Transformers.js (no API), write JSON.
// Usage: node scripts/build-rag-index.mjs
// Model: Xenova/multilingual-e5-small (384 dim, Spanish-capable, ~120 MB on first run).
// Downloaded once to ~/.cache/huggingface, reused thereafter.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..', '..')
const CONTENIDOS = path.join(REPO_ROOT, 'contenidos')
const OUT = path.join(__dirname, '..', 'public', 'rag-index.json')

const MODEL = process.env.EMBED_MODEL ?? 'Xenova/multilingual-e5-small'
const MAX_CHUNK_CHARS = 4000

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (e) => {
    const full = path.join(dir, e.name)
    return e.isDirectory() ? walk(full) : full
  }))
  return files.flat().filter((f) => f.endsWith('.md'))
}

function clean(text) {
  return text
    .replace(/```mermaid[\s\S]*?```/g, '[diagrama Mermaid — ver módulo]')
    .replace(/\\\[[\s\S]*?\\\]/g, '[fórmula — ver módulo]')
    .replace(/\$\$[\s\S]*?\$\$/g, '[fórmula — ver módulo]')
    .trim()
}

function chunkMarkdown(md, meta) {
  const lines = md.split('\n')
  const sections = []
  let currentTitle = meta.moduloTitulo
  let currentSlug = ''
  let buf = []
  const push = () => {
    const text = clean(buf.join('\n'))
    if (text.length > 0) sections.push({ title: currentTitle, slug: currentSlug, text })
    buf = []
  }
  for (const line of lines) {
    const h = line.match(/^(##)\s+(.+?)\s*$/)
    if (h) {
      push()
      currentTitle = h[2].replace(/^[0-9.]+\s*/, '').trim()
      currentSlug = currentTitle.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    } else {
      buf.push(line)
    }
  }
  push()

  const chunks = []
  let pending = null
  const flush = () => { if (pending) { chunks.push(pending); pending = null } }
  for (const s of sections) {
    if (s.text.length > MAX_CHUNK_CHARS) {
      flush()
      const paras = s.text.split(/\n\n+/)
      let acc = ''
      for (const p of paras) {
        if ((acc + '\n\n' + p).length > MAX_CHUNK_CHARS && acc) {
          chunks.push({ ...meta, sectionTitle: s.title, sectionSlug: s.slug, text: acc })
          acc = p
        } else {
          acc = acc ? acc + '\n\n' + p : p
        }
      }
      if (acc) chunks.push({ ...meta, sectionTitle: s.title, sectionSlug: s.slug, text: acc })
      continue
    }
    const addition = `## ${s.title}\n\n${s.text}`
    if (!pending) {
      pending = { ...meta, sectionTitle: s.title, sectionSlug: s.slug, text: addition }
      continue
    }
    if (pending.text.length + 2 + addition.length <= MAX_CHUNK_CHARS) {
      pending.text += '\n\n' + addition
    } else {
      flush()
      pending = { ...meta, sectionTitle: s.title, sectionSlug: s.slug, text: addition }
    }
  }
  flush()
  return chunks
}

async function main() {
  console.log('Scanning contenidos/…')
  const files = await walk(CONTENIDOS)
  console.log(`Found ${files.length} .md files`)

  const chunks = []
  for (const file of files) {
    const rel = path.relative(CONTENIDOS, file)
    const parts = rel.split(path.sep)
    const categoriaId = parts[0]
    const moduloId = path.basename(parts[parts.length - 1], '.md')
    const md = await fs.readFile(file, 'utf8')
    const h1 = md.match(/^#\s+(.+?)\s*$/m)
    const moduloTitulo = h1 ? h1[1].trim() : moduloId
    chunks.push(...chunkMarkdown(md, { categoriaId, moduloId, moduloTitulo }))
  }
  console.log(`Chunked into ${chunks.length} chunks`)

  console.log(`Loading ${MODEL} (downloads to ~/.cache/huggingface on first run)…`)
  const { pipeline } = await import('@xenova/transformers')
  const embed = await pipeline('feature-extraction', MODEL, { quantized: true })

  // multilingual-e5 expects "passage: " prefix for documents, "query: " for queries.
  const vectors = []
  const t0 = Date.now()
  for (let i = 0; i < chunks.length; i++) {
    const out = await embed(`passage: ${chunks[i].text}`, { pooling: 'mean', normalize: true })
    vectors.push(Array.from(out.data))
    if ((i + 1) % 25 === 0 || i === chunks.length - 1) {
      const rate = (i + 1) / ((Date.now() - t0) / 1000)
      process.stdout.write(`  ${i + 1}/${chunks.length} (${rate.toFixed(1)}/s)\r`)
    }
  }
  console.log(`\nEmbedded ${vectors.length} vectors (dim ${vectors[0]?.length})`)

  const payload = {
    builtAt: new Date().toISOString(),
    provider: 'transformers.js',
    model: MODEL,
    dim: vectors[0]?.length ?? 0,
    chunks: chunks.map((c, i) => ({ ...c, v: vectors[i] })),
  }
  await fs.mkdir(path.dirname(OUT), { recursive: true })
  await fs.writeFile(OUT, JSON.stringify(payload))
  const size = (await fs.stat(OUT)).size
  console.log(`Wrote ${OUT} (${(size / 1024 / 1024).toFixed(2)} MB)`)
}

main().catch((e) => { console.error(e); process.exit(1) })
