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
      const regen = async (file: string) => {
        if (file.includes(`${path.sep}contenidos${path.sep}`) && file.endsWith('.md')) {
          await write()
        }
      }
      server.watcher.on('add', regen)
      server.watcher.on('change', regen)
      server.watcher.on('unlink', regen)
    },
  }
}
