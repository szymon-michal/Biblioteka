import React from 'react'
import type { RouteKey } from '../routes'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import styles from '../styles/shell.module.css'

export function AppShell(props: {
  current: RouteKey
  onNavigate: (r: RouteKey) => void
  children: React.ReactNode
}) {
  return (
    <div className={styles.shell}>
      <Sidebar current={props.current} onNavigate={props.onNavigate} />
      <div className={styles.main}>
        <Topbar current={props.current} onNavigate={props.onNavigate} />
        <div className={styles.content}>{props.children}</div>
      </div>
    </div>
  )
}
