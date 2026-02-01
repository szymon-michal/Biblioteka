import React, { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { api } from "../../lib/api";

type PenaltyRow = {
    id: number;
    userId: number;
    loanId: number;
    amount: string; // backend zwraca BigDecimal jako string często
    reason: string;
    status: "OPEN" | "PAID" | "CANCELLED" | string;
    createdAt?: string | null;
    resolvedAt?: string | null;
};

type PageResponse<T> = { content: T[] };

type UserOption = {
    id: number;
    label: string; // "First Last (email)"
};

export default function AdminPenalties() {
    const [rows, setRows] = useState<PenaltyRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const [users, setUsers] = useState<UserOption[]>([]);

    const [openCreate, setOpenCreate] = useState(false);
    const [userId, setUserId] = useState<number | "">("");
    const [loanId, setLoanId] = useState<number | "">("");
    const [amount, setAmount] = useState<string>("10.00");
    const [reason, setReason] = useState<string>("");

    const load = async () => {
        setLoading(true);
        setErr(null);
        try {
            const res = await api.get<PageResponse<PenaltyRow>>("/admin/penalties?page=0&size=200");
            setRows(res.data?.content ?? []);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Nie udało się pobrać kar");
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await api.get<PageResponse<any> | any[]>("/admin/users?page=0&size=500");
            const arr = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
            setUsers(
                arr.map((u: any) => ({
                    id: u.id,
                    label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() + (u.email ? ` (${u.email})` : ''),
                }))
            );
        } catch {
            // w razie błędu po prostu nie blokujemy widoku
            setUsers([]);
        }
    };

    useEffect(() => {
        void load();
        void loadUsers();
    }, []);

    async function create() {
        try {
            setLoading(true);
            setErr(null);

            if (userId === "" || loanId === "") {
                setErr("userId i loanId są wymagane.");
                return;
            }
            const amt = Number(amount);
            if (!Number.isFinite(amt) || amt <= 0) {
                setErr("Kwota musi być liczbą > 0 (np. 10 lub 10.50).");
                return;
            }

            await api.post("/admin/penalties", {
                userId,
                loanId,
                amount: amt,
                reason: reason.trim() || "Kara administracyjna",
            });

            setToast("Dodano karę");
            setOpenCreate(false);
            setUserId("");
            setLoanId("");
            setAmount("10.00");
            setReason("");
            await load();
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Nie udało się dodać kary");
        } finally {
            setLoading(false);
        }
    }

    async function setStatus(id: number, status: "OPEN" | "PAID" | "CANCELLED") {
        try {
            setLoading(true);
            setErr(null);
            await api.patch(`/admin/penalties/${id}/status`, { status });
            setToast(`Zmieniono status kary #${id} na ${status}`);
            await load();
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Nie udało się zmienić statusu kary");
        } finally {
            setLoading(false);
        }
    }

    async function remove(id: number) {
        if (!confirm(`Na pewno usunąć karę #${id}?`)) return;
        try {
            setLoading(true);
            setErr(null);
            await api.delete(`/admin/penalties/${id}`);
            setToast(`Usunięto karę #${id}`);
            await load();
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Nie udało się usunąć kary");
        } finally {
            setLoading(false);
        }
    }

    const userLabelById = useMemo(() => {
        const m = new Map<number, string>();
        users.forEach((u) => m.set(u.id, u.label));
        return m;
    }, [users]);

    const cols = useMemo<GridColDef<PenaltyRow>[]>(
        () => [
            { field: "id", headerName: "ID", width: 90 },
            {
                field: "userId",
                headerName: "Użytkownik",
                width: 260,
                valueGetter: (p) => userLabelById.get(p.row.userId) ?? String(p.row.userId),
            },
            { field: "loanId", headerName: "Loan", width: 100 },
            { field: "amount", headerName: "Kwota", width: 120 },
            { field: "status", headerName: "Status", width: 120 },
            { field: "reason", headerName: "Powód", flex: 1, minWidth: 220 },
            {
                field: "actions",
                headerName: "Akcje",
                width: 420,
                sortable: false,
                filterable: false,
                renderCell: (p) => (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                        <Button size="small" variant="outlined" onClick={() => setStatus(p?.row?.id, "OPEN")} disabled={loading}>
                            OPEN
                        </Button>
                        <Button size="small" color="success" variant="contained" onClick={() => setStatus(p?.row?.id, "PAID")} disabled={loading}>
                            PAID
                        </Button>
                        <Button size="small" color="warning" variant="contained" onClick={() => setStatus(p?.row?.id, "CANCELLED")} disabled={loading}>
                            CANCEL
                        </Button>
                        <Button size="small" color="error" variant="contained" onClick={() => remove(p?.row?.id)} disabled={loading}>
                            Usuń
                        </Button>
                    </Stack>
                ),
            },
        ],
        [loading, userLabelById]
    );

    return (
        <Box sx={{ width: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    Kary
                </Typography>
                <Button variant="contained" onClick={() => setOpenCreate(true)} disabled={loading}>
                    + Dodaj karę
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
                        columns={cols}
                        loading={loading}
                        getRowId={(r) => r.id}
                        disableRowSelectionOnClick
                    />
                </CardContent>
            </Card>

            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
                <DialogTitle>Dodaj karę</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Autocomplete
                            options={users}
                            value={users.find((u) => u.id === userId) ?? null}
                            onChange={(_, v) => setUserId(v?.id ?? '')}
                            getOptionLabel={(o) => o.label}
                            isOptionEqualToValue={(a, b) => a.id === b.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Użytkownik"
                                    placeholder="Wpisz imię/nazwisko/email…"
                                />
                            )}
                        />
                        <TextField
                            label="loanId"
                            value={loanId}
                            onChange={(e) => setLoanId(e.target.value === "" ? "" : Number(e.target.value))}
                            type="number"
                        />
                        <TextField
                            label="Kwota (np. 10 lub 10.50)"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <TextField label="Powód" value={reason} onChange={(e) => setReason(e.target.value)} />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreate(false)} disabled={loading}>
                        Anuluj
                    </Button>
                    <Button variant="contained" onClick={create} disabled={loading}>
                        Dodaj
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)} message={toast ?? ""} />
        </Box>
    );
}
