// Port exacto del slug() del sitio legacy (index.html) para mantener compat
// de section keys al importar/exportar progreso.
export function sectionSlug(s: string): string {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90)
}
