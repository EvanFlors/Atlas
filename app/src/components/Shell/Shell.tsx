import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Breadcrumbs } from './Breadcrumbs'
import styles from './Shell.module.css'

export function Shell() {
  return (
    <div className={styles.grid}>
      <Header />
      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>
      <main className={styles.main}>
        <Breadcrumbs />
        <Outlet />
      </main>
    </div>
  )
}
