import { FaStar, FaRegStar } from 'react-icons/fa'
import { Button } from '../ui/Button/Button'
import { useProgress } from '../../lib/progress/store'

export function FavoriteButton({ moduloId }: { moduloId: string }) {
  const { isBookmarked, toggleBookmark } = useProgress()
  const fav = isBookmarked(moduloId)
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggleBookmark(moduloId)}
      aria-label={fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      title={fav ? 'En favoritos' : 'Añadir a favoritos'}
    >
      {fav ? <FaStar /> : <FaRegStar />} Favorito
    </Button>
  )
}
