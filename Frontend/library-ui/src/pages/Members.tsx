import React, { useEffect, useMemo, useState } from 'react'
import { Box, Card, CardContent, Typography, TextField, Stack, Alert, Chip } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import { apiFetch } from '../lib/api'
import { auth } from '../lib/auth'

type Row = Record<string, any>

export function MembersPage() {
  const role = auth.getRole()
  if (role && role !== 'ADMIN') {
    return (
      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Alert severity="warning">Ta sekcja jest dostępna tylko dla roli ADMIN.</Alert>
        </CardContent>
      </Card>
    )
  }

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [path, setPath] = useState<string>('/api/admin/users')
  const [q, setQ] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiFetch<any>(path)
        const arr = Array.isArray(data) ? data : data?.content || data?.items || data?.data || []
        if (alive) setRows(arr)
      } catch (e: any) {
        if (alive) setError(e?.message || 'Could not load members')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const cols = useMemo<GridColDef<Row>[]>(() => {
    const first = rows[0]
    if (!first) return []
    const keys = Object.keys(first)
    const preferred = ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'createdAt']
    keys.sort((a, b) => {
      const pa = preferred.indexOf(a)
      const pb = preferred.indexOf(b)
      return (pa === -1 ? 999 : pa) - (pb === -1 ? 999 : pb)
    })
    return keys.slice(0, 10).map((k) => ({ field: k, headerName: k, flex: 1, minWidth: 150, valueGetter: (p) => (p.row as any)[k] }))
  }, [rows])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(needle))
  }, [rows, q])

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Użytkownicy
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Endpoint:
            </Typography>
            <Chip size="small" label={path} />
          </Stack>
        </Box>
        <TextField label="Szukaj" value={q} onChange={(e) => setQ(e.target.value)} size="small" sx={{ width: { xs: '100%', sm: 280 } }} />
      </Stack>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 2 }}>
          {loading ? (
            <Typography color="text.secondary">Ładowanie…</Typography>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : rows.length === 0 ? (
            <Typography color="text.secondary">Brak danych.</Typography>
          ) : (
            <div style={{ height: 560, width: '100%' }}>
              <DataGrid
                rows={filtered.map((r, i) => ({ id: r.id ?? i, ...r }))}
                columns={cols}
                disableRowSelectionOnClick
                initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                pageSizeOptions={[10, 20, 50]}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
