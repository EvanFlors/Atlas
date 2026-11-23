import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { CATALOG } from '../../lib/md/catalog'
import styles from './Shell.module.css'

export function Sidebar() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const filtered = q
    ? CATALOG.categorias
        .map((cat) => ({
          ...cat,
          modulos: cat.modulos.filter((m) => m.label.toLowerCase().includes(q)),
        }))
        .filter((cat) => cat.modulos.length > 0)
    : CATALOG.categorias

  return (
    <nav className={styles.nav}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar módulo…"
        aria-label="Buscar módulo"
        className={styles.searchInput}
      />
      {filtered.length === 0 && (
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
          }}
        >
          Sin resultados
        </p>
      )}
      {filtered.map((cat) => (
        <section key={cat.id} className={styles.category}>
          <NavLink
            to={`/${cat.id}`}
            end
            className={({ isActive }) =>
              isActive ? `${styles.catLink} ${styles.active}` : styles.catLink
            }
          >
            {cat.label}
          </NavLink>
          <ul className={styles.modList}>
            {cat.modulos.map((mod) => (
              <li key={mod.id}>
                <NavLink
                  to={`/${cat.id}/${mod.id}`}
                  className={({ isActive }) =>
                    isActive ? `${styles.modLink} ${styles.active}` : styles.modLink
                  }
                >
                  {mod.id}
                </NavLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
