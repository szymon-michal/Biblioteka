import React from 'react'
import type { RouteKey } from '../routes'   // adjust path if needed
import styles from '../styles/sidebar.module.css'

const items: Array<{ key: RouteKey; label: string; hint: string }> = [
  { key: 'dashboard', label: 'Overview', hint: 'Today & quick actions' },
  { key: 'catalog', label: 'Catalog', hint: 'Books & availability' },
  { key: 'members', label: 'Members', hint: 'Readers & profiles' },
  { key: 'loans', label: 'Loans', hint: 'Borrow/return' },
  { key: 'explorer', label: 'API Explorer', hint: 'Auto UI from OpenAPI' },
  { key: 'settings', label: 'Settings', hint: 'Connection & theme' },
]

export function Sidebar(props: { current: RouteKey; onNavigate: (r: RouteKey) => void }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo} aria-hidden>
          📚
        </div>
        <div>
          <div className={styles.title}>Library</div>
          <div className={styles.subtitle}>Calm admin</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {items.map((it) => (
          <button
            key={it.key}
            className={it.key === props.current ? styles.navItemActive : styles.navItem}
            onClick={() => props.onNavigate(it.key)}
          >
            <div className={styles.navLabel}>{it.label}</div>
            <div className={styles.navHint}>{it.hint}</div>
          </button>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.pill}>Vite + React</div>
        <div className={styles.pill}>Minimal UI</div>
      </div>
    </aside>
  )
}
