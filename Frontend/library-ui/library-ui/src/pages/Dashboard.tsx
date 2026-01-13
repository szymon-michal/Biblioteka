import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import { config } from '../lib/config'
import styles from '../styles/pages.module.css'

export function DashboardPage() {
  const [health, setHealth] = useState<string>('…')
  const [openapiOk, setOpenapiOk] = useState<boolean | null>(null)

  useEffect(() => {
    // Tries common Spring Boot actuator health endpoint.
    apiFetch<any>('/actuator/health')
      .then((r) => setHealth(r?.status || 'OK'))
      .catch(() => setHealth('Unavailable'))

    apiFetch<any>(config.openApiPath)
      .then(() => setOpenapiOk(true))
      .catch(() => setOpenapiOk(false))
  }, [])

  const tips = useMemo(
    () => [
      {
        title: 'Start with API Explorer',
        text: 'If you are not sure which endpoints exist, the Explorer can read OpenAPI and build a UI automatically.',
      },
      {
        title: 'Catalog is optional',
        text: 'Catalog/Members/Loans pages are safe defaults. If your backend uses different routes, adapt them in src/pages/*.tsx.',
      },
      {
        title: 'Calm by design',
        text: 'Muted colors, lots of whitespace, and keyboard-friendly inputs for long sessions.',
      },
    ],
    [],
  )

  return (
    <div className={styles.page}>
      <div className={styles.grid3}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Backend health</div>
          <div className={styles.big}>{health}</div>
          <div className={styles.muted}>Checked at /actuator/health</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>OpenAPI</div>
          <div className={styles.big}>
            {openapiOk === null ? '…' : openapiOk ? 'Available' : 'Not found'}
          </div>
          <div className={styles.muted}>Expected at {config.openApiPath}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Connection</div>
          <div className={styles.big}>API</div>
          <div className={styles.muted}>{config.apiUrl}</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.h2}>Quick notes</h2>
        </div>

        <div className={styles.grid3}>
          {tips.map((t) => (
            <div className={styles.card} key={t.title}>
              <div className={styles.cardTitle}>{t.title}</div>
              <div className={styles.text}>{t.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
