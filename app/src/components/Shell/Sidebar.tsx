import { useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { CATALOG } from '../../lib/md/catalog'
import styles from './Shell.module.css'

export function Sidebar() {
  const { categoria: activeCat } = useParams<{ categoria?: string }>()
  const [query, setQuery] = useState('')
  const [openCats, setOpenCats] = useState<Set<string>>(
    () => new Set(activeCat ? [activeCat] : []),
  )
  const toggle = (id: string) =>
    setOpenCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const q = query.trim().toLowerCase()
  const filtered = q
    ? CATALOG.categorias
        .map((cat) => ({
          ...cat,
          modulos: cat.modulos.filter((m) => m.label.toLowerCase().includes(q)),
        }))
        .filter((cat) => cat.modulos.length > 0)
    : CATALOG.categorias

  // Al buscar, abrir todas las categorías con resultados.
  const effectiveOpen = q ? new Set(filtered.map((c) => c.id)) : openCats

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
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Sin resultados
        </p>
      )}
      {filtered.map((cat) => {
        const open = effectiveOpen.has(cat.id)
        return (
          <section key={cat.id} className={styles.category}>
            <button
              type="button"
              className={styles.catToggle}
              onClick={() => toggle(cat.id)}
              aria-expanded={open}
            >
              {open ? <FiChevronDown /> : <FiChevronRight />}
              <span className={styles.catLabel}>{cat.label}</span>
              <span className={styles.catCount}>{cat.modulos.length}</span>
            </button>
            {open && (
              <ul className={styles.modList}>
                {cat.modulos.map((mod) => (
                  <li key={mod.id}>
                    <NavLink
                      to={`/${cat.id}/${mod.id}`}
                      className={({ isActive }) =>
                        isActive ? `${styles.modLink} ${styles.active}` : styles.modLink
                      }
                      title={mod.label}
                    >
                      {mod.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </nav>
  )
}
