import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import { getOpenApi, guessResourcePaths } from '../lib/openapi'
import styles from '../styles/pages.module.css'

type Row = Record<string, any>

export function CatalogPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [path, setPath] = useState<string>('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      const doc = await getOpenApi()
      const guess = guessResourcePaths(doc).books
      const effective = guess || '/books'
      setPath(effective)
      try {
        const data = await apiFetch<any>(effective)
        const arr = Array.isArray(data) ? data : data?.content || data?.items || data?.data || []
        if (alive) setRows(arr)
      } catch (e: any) {
        if (alive) setError(e?.message || 'Could not load catalog')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const cols = useMemo(() => {
    const first = rows[0]
    if (!first) return []
    const keys = Object.keys(first)
    // prefer human-ish columns first
    const preferred = ['id', 'isbn', 'title', 'name', 'author', 'authors', 'available', 'status', 'createdAt']
    keys.sort((a, b) => {
      const pa = preferred.indexOf(a)
      const pb = preferred.indexOf(b)
      return (pa === -1 ? 999 : pa) - (pb === -1 ? 999 : pb)
    })
    return keys.slice(0, 8)
  }, [rows])

  return (
    <div className={styles.page}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.h2}>Catalog</h2>
          <div className={styles.muted}>Auto-detected endpoint: <code>{path}</code></div>
        </div>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div className={styles.text}>Loading…</div>
        ) : error ? (
          <div>
            <div className={styles.error}>{error}</div>
            <div className={styles.muted} style={{ marginTop: 8 }}>
              If your backend uses different routes, use API Explorer to find the correct path.
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className={styles.text}>No items.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, idx) => (
                  <tr key={idx}>
                    {cols.map((c) => (
                      <td key={c} title={String(r[c] ?? '')}>
                        {renderCell(r[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.muted} style={{ marginTop: 10 }}>
              Showing first {Math.min(50, rows.length)} of {rows.length}.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function renderCell(v: any) {
  if (v == null) return ''
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'object') return JSON.stringify(v)
  const s = String(v)
  return s.length > 60 ? s.slice(0, 57) + '…' : s
}
