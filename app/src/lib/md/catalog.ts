import type { CatalogShape, Categoria, Modulo, CategoriaId } from './types'

const RAW = import.meta.glob('../../../contenidos/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const FOLDER_TO_ID: Record<string, CategoriaId> = {
    Excel: 'excel',
    Google_Sheets: 'google-sheets',
    VBA: 'vba',
    Apps_Script: 'apps-script',
    Javascript: 'javascript',
}

const FOLDER_TO_LABEL: Record<string, string> = {
  Excel: 'Excel',
  Google_Sheets: 'Google Sheets',
  VBA: 'VBA',
  Apps_Script: 'Apps Script',
  Javascript: 'Javascript',
}

function firstH1(raw: string): string | null {
  const match = raw.match(/^#\s+(.+?)\s*$/m)
  return match ? match[1].trim() : null
}

function parsePath(fullPath: string): { folder: string; filename: string; id: string } {
  const relative = fullPath.split('/contenidos/')[1]
  const [folder, filename] = relative.split('/')
  const id = filename.replace(/\.md$/, '')
  return { folder, filename, id }
}

const modulosByFolder: Record<string, Modulo[]> = {}
for (const [fullPath, raw] of Object.entries(RAW)) {
  const { folder, filename, id } = parsePath(fullPath)
  const categoria = FOLDER_TO_ID[folder]
  if (!categoria) continue
  const label = firstH1(raw) ?? id
  const mod: Modulo = { id, label, categoria, path: `${folder}/${filename}` }
  ;(modulosByFolder[folder] ||= []).push(mod)
}

for (const folder of Object.keys(modulosByFolder)) {
  modulosByFolder[folder].sort((a, b) => a.id.localeCompare(b.id))
}

const categorias: Categoria[] = Object.keys(FOLDER_TO_ID)
  .filter((folder) => modulosByFolder[folder]?.length)
  .map((folder) => ({
    id: FOLDER_TO_ID[folder],
    label: FOLDER_TO_LABEL[folder],
    folder,
    modulos: modulosByFolder[folder],
  }))

export const CATALOG: CatalogShape = { categorias }