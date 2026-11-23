import { Link } from 'react-router-dom'
import { Button } from '../ui/Button/Button'
import { ThemeToggle } from '../ThemeToggle'
import { ExportImport } from './ExportImport'
import styles from './Shell.module.css'

type Props = {
  onToggleDrawer: () => void
  drawerOpen: boolean
}

export function Header({ onToggleDrawer, drawerOpen }: Props) {
  return (
    <header className={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDrawer}
          aria-label={drawerOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={drawerOpen}
          className={styles.hamburger}
        >
          ☰
        </Button>
        <Link to="/" className={styles.brand}>
          ATLAS
        </Link>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <ExportImport />
        <ThemeToggle />
      </div>
    </header>
  )
}
