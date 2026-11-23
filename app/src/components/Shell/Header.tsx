import { Link } from 'react-router-dom'
import { ThemeToggle } from '../ThemeToggle'
import styles from './Shell.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        ATLAS
      </Link>
      <ThemeToggle />
    </header>
  )
}
