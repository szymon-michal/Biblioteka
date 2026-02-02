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
    MenuItem,
    Chip,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { apiFetch } from '../../lib/api'

type UserDto = {
    id: number
    email: string
    firstName: string
    lastName: string
    role: 'READER' | 'ADMIN' | string
    status: 'ACTIVE' | 'BLOCKED' | string
}

type PageResponse<T> = {
    content: T[]
    totalElements: number
    totalPages: number
    number: number
    size: number
}

const STATUS = ['ACTIVE', 'BLOCKED'] as const
const ROLES = ['READER', 'ADMIN'] as const

export default function AdminUsers() {
    const [rows, setRows] = useState<UserDto[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(20)
    const [err, setErr] = useState<string | null>(null)

    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<UserDto | null>(null)
    const [openPassword, setOpenPassword] = useState(false)
    const [passwordUser, setPasswordUser] = useState<UserDto | null>(null)
    const [newPassword, setNewPassword] = useState('')
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('')

    const [q, setQ] = useState('')

    const columns: GridColDef[] = useMemo(
        () => [
            { field: 'id', headerName: 'ID', width: 90 },
            { field: 'email', headerName: 'Email', flex: 1, minWidth: 220 },
            { field: 'firstName', headerName: 'Imię', width: 140 },
            { field: 'lastName', headerName: 'Nazwisko', width: 160 },
            { field: 'role', headerName: 'Rola', width: 120 },
            {
                field: 'status',
                headerName: 'Status',
                width: 120,
                renderCell: (p) => (
                    <Chip
                        size="small"
                        label={p?.row?.status}
                        variant={p?.row?.status === 'BLOCKED' ? 'filled' : 'outlined'}
                    />
                ),
            },
            {
                field: 'actions',
                headerName: 'Akcje',
                width: 420,
                sortable: false,
                filterable: false,
                renderCell: (p) => (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                        <Button size="small" variant="outlined" onClick={() => onEdit(p?.row)}>
                            Edytuj
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => onChangePassword(p?.row)}>
                            Haslo
                        </Button>
                        <Button size="small" color="error" variant="contained" onClick={() => onDelete(p?.row?.id)}>
                            Usuń
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onToggleBlock(p?.row)}
                        >
                            {p?.row?.status === 'BLOCKED' ? 'Odblokuj' : 'Zablokuj'}
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
            const res = await apiFetch<UserDto[] | PageResponse<UserDto>>(
                `/admin/users?page=${page}&size=${pageSize}&q=${encodeURIComponent(q || '')}`
            )
            const content = Array.isArray(res) ? res : Array.isArray(res?.content) ? res.content : []
            setRows(content)
            setTotal(Array.isArray(res) ? res.length : res?.totalElements ?? content.length)
        } catch (e: any) {
            setErr(e?.message || 'Nie udalo sie pobrac uzytkownikow')
            setRows([])
            setTotal(0)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize])

    function onEdit(u: UserDto) {
        setEditing({ ...u })
        setOpen(true)
    }

    function onChangePassword(u: UserDto) {
        if (!u) return
        setPasswordUser(u)
        setNewPassword('')
        setNewPasswordConfirm('')
        setOpenPassword(true)
    }

    async function onSave() {
        if (!editing) return
        try {
            await apiFetch(`/admin/users/${editing.id}`, {
                method: 'PUT',
                body: editing,
            } as any)
            setOpen(false)
            setEditing(null)
            load()
        } catch (e: any) {
            setErr(e?.message || 'Nie udało się zapisać użytkownika')
        }
    }

    async function onDelete(id: number) {
        if (!confirm(`Usunąć użytkownika #${id}?`)) return
        try {
            await apiFetch(`/admin/users/${id}`, { method: 'DELETE' } as any)
            load()
        } catch (e: any) {
            setErr(e?.message || 'Nie udało się usunąć użytkownika')
        }
    }

    async function onToggleBlock(u: UserDto) {
        const next = u.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED'
        try {
            await apiFetch(`/admin/users/${u.id}`, {
                method: 'PUT',
                body: { ...u, status: next },
            } as any)
            load()
        } catch (e: any) {
            setErr(e?.message || 'Nie udało się zmienić statusu użytkownika')
        }
    }

    async function onSetPassword() {
        if (!passwordUser) return
        if (!newPassword || newPassword.length < 8) {
            setErr('Haslo musi miec min. 8 znakow')
            return
        }
        if (newPassword !== newPasswordConfirm) {
            setErr('Hasla nie sa takie same')
            return
        }

        try {
            await apiFetch(`/admin/users/${passwordUser.id}/password`, {
                method: 'PATCH',
                body: { newPassword },
            } as any)
            setOpenPassword(false)
            setPasswordUser(null)
            setNewPassword('')
            setNewPasswordConfirm('')
        } catch (e: any) {
            setErr(e?.message || 'Nie udalo sie zmienic hasla')
        }
    }

    return (
        <Box>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems="center">
                <Typography variant="h5" sx={{ fontWeight: 900, flex: 1 }}>
                    Użytkownicy
                </Typography>

                <TextField
                    size="small"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Szukaj (email / imię / nazwisko)"
                    sx={{ width: { xs: '100%', md: 360 } }}
                />
                <Button variant="contained" onClick={() => { setPage(0); load() }}>
                    Szukaj
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
                <DialogTitle>Edycja użytkownika</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Email"
                            value={editing?.email ?? ''}
                            onChange={(e) => setEditing((s) => (s ? { ...s, email: e.target.value } : s))}
                            fullWidth
                        />
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <TextField
                                label="Imię"
                                value={editing?.firstName ?? ''}
                                onChange={(e) => setEditing((s) => (s ? { ...s, firstName: e.target.value } : s))}
                                fullWidth
                            />
                            <TextField
                                label="Nazwisko"
                                value={editing?.lastName ?? ''}
                                onChange={(e) => setEditing((s) => (s ? { ...s, lastName: e.target.value } : s))}
                                fullWidth
                            />
                        </Stack>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <TextField
                                select
                                label="Rola"
                                value={editing?.role ?? 'READER'}
                                onChange={(e) => setEditing((s) => (s ? { ...s, role: e.target.value } : s))}
                                fullWidth
                            >
                                {ROLES.map((r) => (
                                    <MenuItem key={r} value={r}>
                                        {r}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                label="Status"
                                value={editing?.status ?? 'ACTIVE'}
                                onChange={(e) => setEditing((s) => (s ? { ...s, status: e.target.value } : s))}
                                fullWidth
                            >
                                {STATUS.map((s) => (
                                    <MenuItem key={s} value={s}>
                                        {s}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>
                    </Stack>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Anuluj</Button>
                    <Button variant="contained" onClick={onSave}>
                        Zapisz
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openPassword} onClose={() => setOpenPassword(false)} fullWidth maxWidth="sm">
                <DialogTitle>
                    {passwordUser ? `Zmien haslo uzytkownika #${passwordUser.id}` : 'Zmien haslo'}
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Nowe haslo"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Powtorz nowe haslo"
                            type="password"
                            value={newPasswordConfirm}
                            onChange={(e) => setNewPasswordConfirm(e.target.value)}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPassword(false)}>Anuluj</Button>
                    <Button variant="contained" onClick={onSetPassword}>
                        Zapisz
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
