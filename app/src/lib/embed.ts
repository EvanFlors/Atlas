// Browser-side embedder. Loads a transformers.js pipeline once on first use.
// Model matches the one used by scripts/build-rag-index.mjs so vectors share a space.
// First call downloads ~120 MB to IndexedDB; subsequent loads are instant.

import type { FeatureExtractionPipeline } from '@xenova/transformers'

const MODEL = 'Xenova/multilingual-e5-small'

type Progress = (p: { status: string; progress?: number; file?: string }) => void

let pipePromise: Promise<FeatureExtractionPipeline> | null = null

export async function getEmbedder(onProgress?: Progress): Promise<FeatureExtractionPipeline> {
  if (pipePromise) return pipePromise
  pipePromise = (async () => {
    const { pipeline, env } = await import('@xenova/transformers')
    env.allowLocalModels = false
    env.useBrowserCache = true
    return pipeline('feature-extraction', MODEL, {
      quantized: true,
      progress_callback: onProgress,
    })
  })()
  return pipePromise
}

export async function embedQuery(text: string, onProgress?: Progress): Promise<number[]> {
  const pipe = await getEmbedder(onProgress)
  // multilingual-e5 requires the "query:" prefix at query time.
  const out = await pipe(`query: ${text}`, { pooling: 'mean', normalize: true })
  return Array.from(out.data as Float32Array)
}
