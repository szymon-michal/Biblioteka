import React, { useState } from 'react'
import { config } from '../lib/config'
import styles from '../styles/pages.module.css'

export function SettingsPage() {
  const [apiUrl, setApiUrl] = useState(config.apiUrl)
  const [saved, setSaved] = useState(false)

  return (
    <div className={styles.page}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.h2}>Settings</h2>
          <div className={styles.muted}>Connection options used by the UI.</div>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Backend URL</div>
          <div className={styles.text} style={{ marginTop: 10 }}>
            <label className="field">
              <span className="label">API base URL</span>
              <input
                className="input"
                value={apiUrl}
                onChange={(e) => {
                  setSaved(false)
                  setApiUrl(e.target.value)
                }}
                placeholder="http://localhost:8080"
              />
            </label>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button
                className="button"
                onClick={() => {
                  config.setApiUrl(apiUrl)
                  setSaved(true)
                }}
              >
                Save
              </button>
              <button
                className="buttonSecondary"
                onClick={() => {
                  const def = 'http://localhost:8080'
                  config.setApiUrl(def)
                  setApiUrl(def)
                  setSaved(true)
                }}
              >
                Reset
              </button>
            </div>
            {saved ? <div className={styles.muted} style={{ marginTop: 10 }}>Saved. Refresh the page to re-check health/OpenAPI.</div> : null}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Endpoints</div>
          <div className={styles.text} style={{ marginTop: 10 }}>
            <div>
              OpenAPI: <code>{config.openApiPath}</code>
            </div>
            <div style={{ marginTop: 8 }}>
              Login: <code>{config.authLoginPath}</code>
            </div>
            <div className={styles.muted} style={{ marginTop: 12 }}>
              If your backend uses different routes, change VITE_OPENAPI_PATH / VITE_AUTH_LOGIN_PATH in <code>.env</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
