import { CATALOG } from './catalog'

/**
 * Traduce un href de Markdown ("H02.md", "../Google_Sheets/G01.md", "#section")
 * a una URL de la app ("/excel/H02", "/google-sheets/G01", "#section").
 * Retorna el href original si no matchea el patrón de módulo interno.
 */
export function translateContentHref(href: string, currentCategoriaFolder?: string): string {
  if (!href) return href
  if (href.startsWith('#') || href.startsWith('/')) return href
  const match = href.match(/^(?:\.\.\/)?([^/]+\/)?([A-Z]\d+)\.md(#.*)?$/)
  if (!match) return href
  const [, folderPart, moduloId, anchor = ''] = match
  const folder = folderPart ? folderPart.replace(/\/$/, '') : currentCategoriaFolder
  if (!folder) return href
  const cat = CATALOG.categorias.find((c) => c.folder === folder)
  if (!cat) return href
  return `/${cat.id}/${moduloId}${anchor}`
}
