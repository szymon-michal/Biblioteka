import React, { useEffect, useMemo, useState } from 'react'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Stack,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid/models'
import { apiFetch } from '../../lib/api'

type AuthorDto = { id: number; firstName: string; lastName: string }
type PageResponse<T> = { content: T[]; totalElements: number; number: number; size: number }

export default function AdminAuthors() {
    const [rows, setRows] = useState<AuthorDto[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(20)
    const [err, setErr] = useState<string | null>(null)

    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Partial<AuthorDto> | null>(null)

    const columns: GridColDef[] = useMemo(
        () => [
            { field: 'id', headerName: 'ID', width: 90 },
            { field: 'firstName', headerName: 'Imię', flex: 1, minWidth: 160 },
            { field: 'lastName', headerName: 'Nazwisko', flex: 1, minWidth: 180 },
            {
                field: 'actions',
                headerName: 'Akcje',
                width: 220,
                sortable: false,
                filterable: false,
                renderCell: (p) => (
                    <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => p?.row && onEdit(p.row)}>
                            Edytuj
                        </Button>
                        <Button size="small" color="error" onClick={() => p?.row?.id && onDelete(p.row.id)}>
                            Usuń
                        </Button>
                    </Stack>
                ),
            },
        ],
        []
    )

    async function load() {
        setErr(null)
        try {
            const res = await apiFetch<PageResponse<AuthorDto>>(`/admin/authors?page=${page}&size=${pageSize}`)
            const content = Array.isArray(res?.content) ? res.content : []
            setRows(content)
            setTotal(res?.totalElements ?? content.length)
        } catch (e: any) {
            setErr(e?.message || 'Nie udało się pobrać autorów')
            setRows([])
            setTotal(0)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize])

    function onAdd() {
        setEditing({ firstName: '', lastName: '' })
        setOpen(true)
    }

    function onEdit(a: AuthorDto) {
        setEditing({ ...a })
        setOpen(true)
    }

    async function onSave() {
        if (!editing) return
        try {
            if (editing.id) {
                await apiFetch(`/admin/authors/${editing.id}`, { method: 'PUT', body: editing } as any)
            } else {
                await apiFetch(`/admin/authors`, { method: 'POST', body: editing } as any)
            }
            setOpen(false)
            setEditing(null)
            load()
        } catch (e: any) {
            setErr(e?.message || 'Nie udało się zapisać autora')
        }
    }

    async function onDelete(id: number) {
        if (!confirm(`Usunąć autora #${id}?`)) return
        try {
            await apiFetch(`/admin/authors/${id}`, { method: 'DELETE' } as any)
            load()
        } catch (e: any) {
            setErr(e?.message || 'Nie udało się usunąć autora')
        }
    }

    return (
        <Box>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems="center">
                <Typography variant="h5" sx={{ fontWeight: 900, flex: 1 }}>
                    Autorzy
                </Typography>
                <Button variant="contained" onClick={onAdd}>
                    Dodaj autora
                </Button>
            </Stack>

            {err ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {err}
                </Alert>
            ) : null}

            <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                    <Box sx={{ height: 620 }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            getRowId={(r) => r.id}
                            paginationMode="server"
                            rowCount={total}
                            pageSizeOptions={[10, 20, 50]}
                            paginationModel={{ page, pageSize }}
                            onPaginationModelChange={(m) => {
                                setPage(m.page)
                                setPageSize(m.pageSize)
                            }}
                            disableRowSelectionOnClick
                        />
                    </Box>
                </CardContent>
            </Card>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editing?.id ? 'Edycja autora' : 'Nowy autor'}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Imię"
                            value={editing?.firstName ?? ''}
                            onChange={(e) => setEditing((s) => ({ ...(s || {}), firstName: e.target.value }))}
                            fullWidth
                        />
                        <TextField
                            label="Nazwisko"
                            value={editing?.lastName ?? ''}
                            onChange={(e) => setEditing((s) => ({ ...(s || {}), lastName: e.target.value }))}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Anuluj</Button>
                    <Button variant="contained" onClick={onSave}>
                        Zapisz
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
