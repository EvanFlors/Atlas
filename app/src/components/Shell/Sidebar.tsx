import { NavLink } from 'react-router-dom'
import { CATALOG } from '../../lib/md/catalog'
import styles from './Shell.module.css'

export function Sidebar() {
  return (
    <nav className={styles.nav}>
      {CATALOG.categorias.map((cat) => (
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
