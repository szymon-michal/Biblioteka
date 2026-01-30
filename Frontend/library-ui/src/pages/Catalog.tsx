import { useEffect, useMemo, useState, useCallback } from 'react'
import { Box, Paper, Stack, TextField, Typography, IconButton, Tooltip, Snackbar, Alert } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import { LibraryAdd } from '@mui/icons-material'
import { apiFetch } from '../lib/api'

type AuthorDto = { id: number; firstName: string; lastName: string }
type CategoryDto = { id: number; name: string; parentId?: number | null }

export type BookDto = {
  id: number
  title: string
  description?: string | null
  publicationYear?: number | null
  isbn?: string | null
  category?: CategoryDto | null
  authors?: AuthorDto[] | null
  isActive?: boolean
  totalCopies?: number
  availableCopies?: number
}

type Page<T> = {
  content: T[]
  totalElements: number
  number: number
  size: number
}

type Row = {
  id: number
  bookId: number
  title: string
  isbn: string
  category: string
  authors: string
  year: string
  available: string
  availableCopies: number
}

function toRow(b: BookDto): Row {
  const authors = (b.authors ?? [])
    .map((a) => [a.firstName, a.lastName].filter(Boolean).join(' ').trim())
    .filter(Boolean)
    .join(', ')

  return {
    id: b.id,
    bookId: b.id,
    title: b.title ?? '',
    isbn: b.isbn ?? '',
    category: b.category?.name ?? '',
    authors,
    year: b.publicationYear != null ? String(b.publicationYear) : '',
    available:
      b.availableCopies != null && b.totalCopies != null
        ? `${b.availableCopies}/${b.totalCopies}`
        : b.availableCopies != null
          ? String(b.availableCopies)
          : '',
    availableCopies: b.availableCopies ?? 0,
  }
}

export function CatalogPage() {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const handleBorrow = useCallback(async (bookId: number) => {
    try {
      await apiFetch('/loans', { method: 'POST', body: { bookId } })
      setSnackbar({ open: true, message: 'Książka została wypożyczona!', severity: 'success' })
      // Odśwież listę książek
      const page = await apiFetch<Page<BookDto>>('/books?page=0&size=200')
      const mapped = (page.content ?? []).map(toRow)
      setRows(mapped)
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message ?? 'Nie udało się wypożyczyć książki', severity: 'error' })
    }
  }, [])

  const columns: GridColDef<Row>[] = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 60 },
      {
        field: 'title',
        headerName: 'Tytuł',
        flex: 1,
        minWidth: 150,
        renderCell: (params) => (
          <Tooltip title={params.value}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{params.value}</span>
          </Tooltip>
        ),
      },
      {
        field: 'authors',
        headerName: 'Autorzy',
        width: 140,
        renderCell: (params) => (
          <Tooltip title={params.value}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{params.value}</span>
          </Tooltip>
        ),
      },
      { field: 'category', headerName: 'Kategoria', width: 100 },
      { field: 'year', headerName: 'Rok', width: 70 },
      { field: 'isbn', headerName: 'ISBN', width: 120 },
      { field: 'available', headerName: 'Dostępne', width: 90 },
      {
        field: 'actions',
        headerName: 'Wypożycz',
        width: 90,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Tooltip
            title={params.row.availableCopies > 0
              ? 'Kliknij aby wypożyczyć tę książkę'
              : 'Wszystkie egzemplarze są wypożyczone'}
            arrow
          >
            <span>
              <IconButton
                size="medium"
                disabled={params.row.availableCopies === 0}
                onClick={() => handleBorrow(params.row.bookId)}
                color="primary"
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <LibraryAdd fontSize="medium" />
              </IconButton>
            </span>
          </Tooltip>
        ),
      },
    ],
    [handleBorrow]
  )

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        // To jest prawdziwy endpoint z backendu: GET /api/books
        const page = await apiFetch<Page<BookDto>>('/books?page=0&size=200')
        const mapped = (page.content ?? []).map(toRow)
        if (alive) setRows(mapped)
      } catch (e: any) {
        if (alive) setError(e?.message ?? 'Nie udało się pobrać katalogu')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [r.title, r.authors, r.category, r.isbn, r.year].some((v) => v.toLowerCase().includes(q))
    )
  }, [rows, query])

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: '100%' }}>
      <Stack spacing={2} sx={{ height: '100%', overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ flexShrink: 0 }}>
          <Typography variant="h5" sx={{ flex: 1 }}>
            Katalog
          </Typography>
          <TextField
            size="small"
            label="Szukaj"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Stack>

        <Paper sx={{ flex: 1, width: '100%', overflow: 'hidden', display: 'flex' }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            sx={{ border: 0, width: '100%' }}
          />
        </Paper>

        {error && (
          <Typography color="error" variant="body2" sx={{ flexShrink: 0 }}>
            {error}
          </Typography>
        )}
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default CatalogPage
