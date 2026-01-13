import React from 'react'
import type { RouteKey } from '../routes'
import { auth } from '../lib/auth'
import { config } from '../lib/config'
import styles from '../styles/topbar.module.css'

const titles: Record<RouteKey, string> = {
    login: 'Sign in',
    dashboard: 'Overview',
    catalog: 'Catalog',
    loans: 'Loans',
    members: 'Members',
    explorer: 'API Explorer',
    settings: 'Settings',
    overview: 'Overview'
}

export function Topbar(props: { current: RouteKey; onNavigate: (r: RouteKey) => void }) {
  return (
    <header className={styles.topbar}>
      <div>
        <div className={styles.kicker}>Library admin</div>
        <div className={styles.heading}>{titles[props.current]}</div>
      </div>

      <div className={styles.actions}>
        <a className={styles.link} href={config.apiUrl} target="_blank" rel="noreferrer">
          Backend
        </a>
        <button
          className={styles.button}
          onClick={() => {
            auth.clear()
            props.onNavigate('login')
          }}
        >
          Log out
        </button>
      </div>
    </header>
  )
}
