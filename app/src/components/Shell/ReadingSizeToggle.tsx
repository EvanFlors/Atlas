import { FiType } from 'react-icons/fi'
import { Button } from '../ui/Button/Button'
import { useReadingSize } from '../../hooks/useReadingSize'

const LABEL = { sm: 'Pequeño', md: 'Medio', lg: 'Grande' } as const

export function ReadingSizeToggle() {
  const { size, cycle } = useReadingSize()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycle}
      aria-label={`Tamaño de lectura: ${LABEL[size]}. Click para cambiar.`}
      title={`Tamaño de lectura: ${LABEL[size]}`}
    >
      <FiType /> {size.toUpperCase()}
    </Button>
  )
}
