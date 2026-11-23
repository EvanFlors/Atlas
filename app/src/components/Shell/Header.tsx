import { Link } from 'react-router-dom'
import { ThemeToggle } from '../ThemeToggle'
import { ExportImport } from './ExportImport'
import styles from './Shell.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        ATLAS
      </Link>
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <ExportImport />
        <ThemeToggle />
      </div>
    </header>
  )
}
