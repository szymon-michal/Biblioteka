import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Stack,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Alert,
  Divider,
} from '@mui/material'
import { apiFetch } from '../lib/api'
import type { OpenApiDoc } from '../lib/openapi'
import { getOpenApi } from '../lib/openapi'

type Endpoint = {
  path: string
  method: string
  summary?: string
  tags?: string[]
  requestBody?: any
}

function tryPrettyJson(raw: string) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

export function ExplorerPage() {
  const [doc, setDoc] = useState<OpenApiDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Endpoint | null>(null)
  const [filter, setFilter] = useState('')
  const [query, setQuery] = useState('')
  const [body, setBody] = useState('')
  const [resp, setResp] = useState('')
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
    for (const [p, methods] of Object.entries(paths)) {
      const m = methods as any
      for (const method of Object.keys(m)) {
        const op = m[method]
        if (!op || typeof op !== 'object') continue
        out.push({
          path: p,
          method: method.toUpperCase(),
          summary: op.summary || op.operationId,
          tags: op.tags,
          requestBody: op.requestBody,
        })
      }
    }
    out.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method))
    return out
  }, [doc])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return endpoints
    return endpoints.filter((e) => `${e.method} ${e.path} ${e.summary || ''} ${(e.tags || []).join(' ')}`.toLowerCase().includes(q))
  }, [endpoints, filter])

  async function send() {
    if (!selected) return
    setError(null)
    setResp('')
    const qs = query.trim()
    const url = qs ? `${selected.path}?${qs.replace(/^\?/, '')}` : selected.path

    let parsedBody: any = undefined
    const raw = body.trim()
    if (raw) {
      try {
        parsedBody = JSON.parse(raw)
      } catch {
        setError('Body musi być poprawnym JSON-em.')
        return
      }
    }

    try {
      const res = await apiFetch<any>(url, {
        method: selected.method,
        ...(parsedBody ? { body: parsedBody } : {}),
      })
      setResp(JSON.stringify(res, null, 2))
    } catch (e: any) {
      const payload = e?.details ? JSON.stringify(e.details, null, 2) : ''
      setError(e?.message || 'Request failed')
      setResp(payload)
    }
  }

  return (
    <Box>
      {!loading && !doc && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Backend nie udostępnia <b>/v3/api-docs</b> (często 401) — Eksplorer działa tylko gdy Swagger jest publiczny.
        </Alert>
      )}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'stretch' }}>
        <Card sx={{ width: { xs: '100%', md: 420 }, borderRadius: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
              API Explorer
            </Typography>
            <TextField
              label="Filtruj endpointy"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              size="small"
              fullWidth
            />
            <Divider sx={{ my: 1.5 }} />
            {loading ? (
              <Typography color="text.secondary">Ładowanie OpenAPI…</Typography>
            ) : !doc ? (
              <Alert severity="warning">Nie udało się pobrać OpenAPI.</Alert>
            ) : (
              <Box sx={{ maxHeight: 520, overflow: 'auto' }}>
                <List dense>
                  {filtered.slice(0, 200).map((e) => {
                    const active = selected?.path === e.path && selected?.method === e.method
                    return (
                      <ListItemButton
                        key={`${e.method}:${e.path}`}
                        selected={active}
                        onClick={() => {
                          setSelected(e)
                          setQuery('')
                          setBody('')
                          setResp('')
                          setError(null)
                        }}
                        sx={{ borderRadius: 2, mb: 0.5 }}
                      >
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip size="small" label={e.method} color={e.method === 'GET' ? 'primary' : 'default'} />
                              <Typography sx={{ fontWeight: 800 }} noWrap>
                                {e.path}
                              </Typography>
                            </Stack>
                          }
                          secondary={e.summary || ''}
                          secondaryTypographyProps={{ noWrap: true }}
                        />
                      </ListItemButton>
                    )
                  })}
                </List>
                {filtered.length > 200 ? (
                  <Typography variant="caption" color="text.secondary">
                    Pokazano pierwsze 200 z {filtered.length}.
                  </Typography>
                ) : null}
              </Box>
            )}
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderRadius: 4 }}>
          <CardContent>
            {!selected ? (
              <Alert severity="info">Wybierz endpoint z listy po lewej.</Alert>
            ) : (
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                  <Chip label={selected.method} color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {selected.path}
                  </Typography>
                </Stack>
                {selected.summary ? <Typography color="text.secondary">{selected.summary}</Typography> : null}

                <TextField
                  label="Query string (np. page=0&size=20)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Body (JSON)"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={selected.requestBody ? '{\n  ...\n}' : '(puste dla GET)'}
                  multiline
                  minRows={6}
                  fullWidth
                  inputProps={{ style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } }}
                  onBlur={() => setBody((b) => tryPrettyJson(b))}
                />

                {error ? <Alert severity="error">{error}</Alert> : null}

                <Button variant="contained" disableElevation sx={{ borderRadius: 999, fontWeight: 900 }} onClick={send}>
                  Wyślij
                </Button>

                <TextField
                  label="Response"
                  value={resp}
                  onChange={() => {}}
                  multiline
                  minRows={10}
                  fullWidth
                  inputProps={{ readOnly: true, style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } }}
                />
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
