import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import type { OpenApiDoc } from '../lib/openapi'
import styles from '../styles/pages.module.css'

type Endpoint = {
  path: string
  method: string
  summary?: string
  tags?: string[]
  parameters?: any[]
  requestBody?: any
}

export function ExplorerPage() {
  const [doc, setDoc] = useState<OpenApiDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Endpoint | null>(null)
  const [query, setQuery] = useState('')
  const [body, setBody] = useState('')
  const [resp, setResp] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const d = await getOpenApi(true)
      if (!alive) return
      setDoc(d)
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [])

  const endpoints: Endpoint[] = useMemo(() => {
    const out: Endpoint[] = []
    const paths = doc?.paths || {}
    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, op] of Object.entries(methods as any)) {
        const m = method.toUpperCase()
        if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(m)) continue
        out.push({
          path,
          method: m,
          summary: op?.summary || op?.operationId,
          tags: op?.tags || [],
          parameters: op?.parameters || [],
          requestBody: op?.requestBody,
        })
      }
    }
    out.sort((a, b) => (a.tags?.[0] || '').localeCompare(b.tags?.[0] || '') || a.path.localeCompare(b.path) || a.method.localeCompare(b.method))
    return out
  }, [doc])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return endpoints
    return endpoints.filter((e) => `${e.method} ${e.path} ${(e.tags || []).join(' ')} ${e.summary || ''}`.toLowerCase().includes(q))
  }, [endpoints, query])

  async function run() {
    if (!selected) return
    setError(null)
    setResp('')

    try {
      let payload: any = undefined
      if (selected.method !== 'GET' && selected.method !== 'DELETE') {
        if (body.trim()) {
          payload = JSON.parse(body)
        }
      }

      const res = await apiFetch<any>(selected.path, {
        method: selected.method,
        body: payload,
      })

      setResp(JSON.stringify(res, null, 2))
    } catch (e: any) {
      setError(e?.message || 'Request failed')
      if (e?.details) setResp(JSON.stringify(e.details, null, 2))
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.h2}>API Explorer</h2>
          <div className={styles.muted}>Loads OpenAPI and lets you call endpoints (handy when routes differ).</div>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Endpoints</div>
          {loading ? (
            <div className={styles.text}>Loading OpenAPI…</div>
          ) : !doc ? (
            <div>
              <div className={styles.error}>OpenAPI was not found.</div>
              <div className={styles.muted} style={{ marginTop: 8 }}>
                Make sure your backend exposes OpenAPI at <code>/v3/api-docs</code> (or set VITE_OPENAPI_PATH).
              </div>
            </div>
          ) : (
            <>
              <input
                className="input"
                placeholder="Filter endpoints… (e.g. books, loan, POST)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ marginTop: 12 }}
              />

              <div style={{ marginTop: 12, maxHeight: 520, overflow: 'auto' }}>
                {filtered.slice(0, 250).map((e) => (
                  <button
                    key={`${e.method}:${e.path}`}
                    className={selected?.path === e.path && selected?.method === e.method ? styles.endpointActive : styles.endpoint}
                    onClick={() => {
                      setSelected(e)
                      setBody('')
                      setResp('')
                      setError(null)
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <span className={styles.badge}>{e.method}</span>
                        <span style={{ marginLeft: 10, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{e.path}</span>
                      </div>
                      <div className={styles.muted}>{(e.tags && e.tags[0]) || ''}</div>
                    </div>
                    {e.summary ? <div className={styles.muted} style={{ marginTop: 6 }}>{e.summary}</div> : null}
                  </button>
                ))}
              </div>
              <div className={styles.muted} style={{ marginTop: 10 }}>
                Showing {Math.min(250, filtered.length)} of {filtered.length}.
              </div>
            </>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Request</div>
          {!selected ? (
            <div className={styles.text}>Select an endpoint on the left.</div>
          ) : (
            <>
              <div className={styles.muted} style={{ marginTop: 10 }}>
                <span className={styles.badge}>{selected.method}</span> <code>{selected.path}</code>
              </div>

              {selected.method !== 'GET' && selected.method !== 'DELETE' ? (
                <div style={{ marginTop: 12 }}>
                  <div className={styles.muted} style={{ marginBottom: 6 }}>
                    JSON body (optional)
                  </div>
                  <textarea
                    className={styles.textarea}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder='{
  "example": true
}'
                  />
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="button" onClick={run}>
                  Send request
                </button>
                <button className="buttonSecondary" onClick={() => { setBody(''); setResp(''); setError(null) }}>
                  Clear
                </button>
              </div>

              {error ? <div className={styles.error} style={{ marginTop: 12 }}>{error}</div> : null}

              <div style={{ marginTop: 12 }}>
                <div className={styles.muted} style={{ marginBottom: 6 }}>
                  Response
                </div>
                <pre className={styles.pre}>{resp || '—'}</pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
