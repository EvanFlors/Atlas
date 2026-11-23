import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import styles from './Shell.module.css'

export function Shell() {
  return (
    <div className={styles.grid}>
      <Header />
      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
