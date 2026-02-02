import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Snackbar,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { api, apiFetch } from '../../lib/api'

type BookRow = {
  id: number
  title: string
  isbn: string
  publicationYear: number
  description?: string | null
  isActive?: boolean | null
  // backend can return either `author` or `authors` (array); for create/update we send `authorId`
  authorId?: number | null
  authorIds?: number[] | null
  author?: { id: number; firstName: string; lastName: string } | null
  authors?: { id: number; firstName: string; lastName: string }[]
}

type AuthorOption = {
  id: number
  firstName: string
  lastName: string
}

type PageResponse<T> = { content: T[]; totalElements?: number }

export default function AdminBooks() {
  const [rows, setRows] = useState<BookRow[]>([])
  const [authors, setAuthors] = useState<AuthorOption[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<BookRow> | null>(null)

  async function load() {
    setLoading(true)
    setErr(null)
    try {
      // Backend uses pagination, but for simplicity here we try to get a large enough batch.
      // In a real app we should handle Pageable properly.
      const data = await apiFetch<PageResponse<BookRow>>('/admin/books?page=0&size=200')
      const list = Array.isArray(data?.content) ? data.content : []
      setRows(list.filter((r) => r && r.id != null))
    } catch (e: any) {
      console.error('Błąd ładowania książek:', e)
      setErr(e?.response?.data?.message || e?.message || 'Nie udało się pobrać książek')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  async function loadAuthors() {
    try {
      const data = await apiFetch<PageResponse<AuthorOption>>('/admin/authors?page=0&size=500')
      const list = Array.isArray(data?.content) ? data.content : []
      setAuthors(list.filter((a) => a && a.id != null))
    } catch {
      setAuthors([])
    }
  }

  useEffect(() => {
    void load()
    void loadAuthors()
  }, [])

  function openCreate() {
    setEditing({ title: '', isbn: '', publicationYear: new Date().getFullYear(), description: '', authorIds: [] })
    setOpen(true)
  }

  function openEdit(row: BookRow) {
    const authorIds =
      (Array.isArray(row.authorIds) && row.authorIds.length > 0
        ? row.authorIds
        : Array.isArray(row.authors) && row.authors.length > 0
        ? row.authors.map((a) => a.id)
        : row.authorId
        ? [row.authorId]
        : row.author?.id
        ? [row.author.id]
        : [])

    setEditing({
      ...row,
      authorIds,
    })
    setOpen(true)
  }

  async function save() {
    if (!editing) return
    try {
      setLoading(true)
      setErr(null)

      const payload = {
        title: editing.title,
        isbn: editing.isbn,
        publicationYear: Number(editing.publicationYear),
        description: editing.description ?? '',
        categoryId: (editing as any).categoryId ?? null,
        authorIds: Array.isArray(editing.authorIds) ? editing.authorIds : [],
      }

      if (!payload.title || !payload.isbn || !Number.isFinite(payload.publicationYear)) {
        setErr('Uzupełnij: tytuł, ISBN i rok publikacji.')
        setLoading(false)
        return
      }

      if (editing.id) {
        await apiFetch(`/admin/books/${editing.id}`, { method: 'PUT', body: payload })
        setToast(`Zapisano książkę #${editing.id}`)
      } else {
        await apiFetch('/admin/books', { method: 'POST', body: payload })
        setToast('Dodano książkę')
      }

      setOpen(false)
      await load()
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Nie udało się zapisać książki')
    } finally {
      setLoading(false)
    }
  }

  async function deactivate(id: number) {
    if (!confirm(`Dezaktywować książkę #${id}?`)) return
    try {
      setLoading(true)
      setErr(null)
      await apiFetch(`/admin/books/${id}`, { method: 'DELETE' })
      setToast(`Dezaktywowano książkę #${id}`)
      await load()
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Nie udało się dezaktywować książki')
    } finally {
      setLoading(false)
    }
  }

  const columns = useMemo<GridColDef<BookRow>[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'title', headerName: 'Tytuł', flex: 1, minWidth: 220 },
      { field: 'isbn', headerName: 'ISBN', width: 160 },
      { field: 'publicationYear', headerName: 'Rok', width: 110 },
      {
        field: 'author',
        headerName: 'Autor',
        flex: 1,
        minWidth: 180,
        valueGetter: (v, r) => {
          if (!r) return ''
          
          const authorsArr = r.authors
          if (Array.isArray(authorsArr) && authorsArr.length > 0) {
            return authorsArr
              .map((x) => `${x?.firstName ?? ''} ${x?.lastName ?? ''}`.trim())
              .filter(Boolean)
              .join(', ')
          }
          
          const a: any = r.author
          if (a && (a.firstName || a.lastName)) {
            return `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim()
          }
          
          return ''
        },
      },
      {
        field: 'isActive',
        headerName: 'Aktywna',
        width: 110,
        valueGetter: (v) => (v === false ? 'NIE' : 'TAK'),
      },
      {
        field: 'actions',
        headerName: 'Akcje',
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => p?.row && openEdit(p.row)} disabled={loading}>
              Edytuj
            </Button>
            <Button size="small" color="warning" variant="contained" onClick={() => deactivate(p.row.id)} disabled={loading}>
              Dezaktywuj
            </Button>
          </Stack>
        ),
      },
    ],
    [loading]
  )

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Książki (ADMIN)
        </Typography>
        <Button variant="contained" onClick={openCreate} disabled={loading}>
          Dodaj
        </Button>
      </Stack>

      {err ? (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setErr(null)}>
          {err}
        </Alert>
      ) : null}

      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            getRowId={(r) => r?.id}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 25 } } }}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing?.id ? `Edytuj książkę #${editing.id}` : 'Dodaj książkę'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField label="Tytuł" value={editing?.title ?? ''} onChange={(e) => setEditing((s) => ({ ...(s || {}), title: e.target.value }))} />
          <TextField label="ISBN" value={editing?.isbn ?? ''} onChange={(e) => setEditing((s) => ({ ...(s || {}), isbn: e.target.value }))} />
          <TextField
            label="Rok publikacji"
            type="number"
            value={editing?.publicationYear ?? ''}
            onChange={(e) => setEditing((s) => ({ ...(s || {}), publicationYear: Number(e.target.value) }))}
          />
          <Autocomplete
            multiple
            options={authors}
            value={authors.filter((a) => (editing?.authorIds ?? []).includes(a.id))}
            onChange={(_, v) => setEditing((s) => ({ ...(s || {}), authorIds: v.map((x) => x.id) }))}
            getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
            renderInput={(params) => <TextField {...params} label="Autorzy" placeholder="Wybierz autorow" />}
            isOptionEqualToValue={(o, v) => o.id === v.id}
          />
          <TextField
            label="Opis"
            multiline
            minRows={3}
            value={editing?.description ?? ''}
            onChange={(e) => setEditing((s) => ({ ...(s || {}), description: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Anuluj</Button>
          <Button variant="contained" onClick={save} disabled={loading}>
            Zapisz
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)} message={toast ?? ''} />
    </Box>
  )
}
