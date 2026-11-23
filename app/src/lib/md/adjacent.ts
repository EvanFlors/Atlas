import { CATALOG } from './catalog'
import type { Modulo } from './types'

export function getAdjacent(
  categoriaId: string,
  moduloId: string,
): { prev: Modulo | null; next: Modulo | null } {
  const cat = CATALOG.categorias.find((c) => c.id === categoriaId)
  if (!cat) return { prev: null, next: null }
  const i = cat.modulos.findIndex((m) => m.id === moduloId)
  if (i < 0) return { prev: null, next: null }
  return {
    prev: i > 0 ? cat.modulos[i - 1] : null,
    next: i < cat.modulos.length - 1 ? cat.modulos[i + 1] : null,
  }
}
