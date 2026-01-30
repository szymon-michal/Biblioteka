import { useEffect, useMemo, useState } from 'react'
import { Box, Paper, Stack, TextField, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
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
  title: string
  isbn: string
  category: string
  authors: string
  year: string
  available: string
}

function toRow(b: BookDto): Row {
  const authors = (b.authors ?? [])
    .map((a) => [a.firstName, a.lastName].filter(Boolean).join(' ').trim())
    .filter(Boolean)
    .join(', ')

  return {
    id: b.id,
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
  }
}

export default function Catalog() {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const columns: GridColDef<Row>[] = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'title', headerName: 'Tytuł', flex: 1, minWidth: 220 },
      { field: 'authors', headerName: 'Autorzy', flex: 1, minWidth: 200 },
      { field: 'category', headerName: 'Kategoria', width: 160 },
      { field: 'year', headerName: 'Rok', width: 110 },
      { field: 'isbn', headerName: 'ISBN', width: 170 },
      { field: 'available', headerName: 'Dostępność', width: 140 },
    ],
    []
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
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
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

        <Paper sx={{ height: 650, width: '100%' }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            sx={{ border: 0 }}
          />
        </Paper>

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
      </Stack>
    </Box>
  )
}
