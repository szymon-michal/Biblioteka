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
    user?: { id?: number; firstName?: string; lastName?: string } | null;
    amount: string; // backend zwraca BigDecimal jako string czesto
    reason: string;
    status: "OPEN" | "PAID" | "CANCELLED" | string;
    createdAt?: string | null;
    resolvedAt?: string | null;
};

type UserOption = {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
};

type LoanOption = {
    id: number;
    book?: { title?: string | null } | null;
    bookCopy?: { book?: { title?: string | null } | null } | null;
};

type PageResponse<T> = { content: T[] };

export default function AdminPenalties() {
    const [rows, setRows] = useState<PenaltyRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const [openCreate, setOpenCreate] = useState(false);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [loansForUser, setLoansForUser] = useState<LoanOption[]>([]);
    const [loanTitles, setLoanTitles] = useState<Record<number, string>>({});
    const [userId, setUserId] = useState<number | "">("");
    const [loanId, setLoanId] = useState<number | "">("");
    const [amount, setAmount] = useState<string>("10.00");
    const [reason, setReason] = useState<string>("");

    const userLabelById = useMemo(() => {
        const map: Record<number, string> = {};
        for (const u of users) {
            const full = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
            map[u.id] = full || u.email || `#${u.id}`;
        }
        return map;
    }, [users]);

    const load = async () => {
        setLoading(true);
        setErr(null);
        try {
            const res = await api.get<PageResponse<PenaltyRow>>("/admin/penalties?page=0&size=200");
            setRows(res.data?.content ?? []);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Nie udalo sie pobrac kar");
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await api.get<PageResponse<UserOption> | UserOption[]>("/admin/users?page=0&size=1000");
            const data: any = res.data;
            const arr: UserOption[] = Array.isArray(data) ? data : data?.content ?? [];
            setUsers(arr);
        } catch {
            setUsers([]);
        }
    };

    const loadLoanTitles = async () => {
        try {
            const res = await api.get<PageResponse<any> | any[]>("/admin/loans?page=0&size=500");
            const data: any = res.data;
            const arr: any[] = Array.isArray(data) ? data : data?.content ?? [];
            const map: Record<number, string> = {};
            for (const l of arr) {
                const title = l?.bookCopy?.book?.title ?? l?.book?.title ?? l?.bookTitle ?? "";
                if (l?.id != null && title) map[l.id] = title;
            }
            setLoanTitles(map);
        } catch {
            setLoanTitles({});
        }
    };

    const loadActiveLoansForUser = async (uid: number) => {
        const tryUrls = [
            `/admin/loans/active?userId=${uid}`,
            `/admin/loans?userId=${uid}&status=ACTIVE&page=0&size=200`,
            `/admin/users/${uid}/loans/active`,
        ];
        for (const url of tryUrls) {
            try {
                const res = await api.get<PageResponse<LoanOption> | LoanOption[]>(url);
                const data: any = res.data;
                const arr: LoanOption[] = Array.isArray(data) ? data : data?.content ?? [];
                setLoansForUser(arr);
                return;
            } catch {
                // try next
            }
        }
        setLoansForUser([]);
    };

    useEffect(() => {
        void load();
        void loadUsers();
        void loadLoanTitles();
    }, []);

    useEffect(() => {
        if (userId === "" || userId == null) {
            setLoansForUser([]);
            setLoanId("");
            return;
        }
        void loadActiveLoansForUser(Number(userId));
    }, [userId]);

    async function create() {
        try {
            setLoading(true);
            setErr(null);

            if (userId === "" || loanId === "") {
                setErr("userId i loanId sa wymagane.");
                return;
            }
            const amt = Number(amount);
            if (!Number.isFinite(amt) || amt <= 0) {
                setErr("Kwota musi byc liczba > 0 (np. 10 lub 10.50)." );
                return;
            }

            await api.post("/admin/penalties", {
                userId,
                loanId,
                amount: amt,
                reason: reason.trim() || "Kara administracyjna",
            });

            setToast("Dodano kare");
            setOpenCreate(false);
            setUserId("");
            setLoanId("");
            setAmount("10.00");
            setReason("");
            await load();
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Nie udalo sie dodac kary");
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
            setErr(e?.response?.data?.message || e?.message || "Nie udalo sie zmienic statusu kary");
        } finally {
            setLoading(false);
        }
    }

    async function remove(id: number) {
        if (!confirm(`Na pewno usunac kare #${id}?`)) return;
        try {
            setLoading(true);
            setErr(null);
            await api.delete(`/admin/penalties/${id}`);
            setToast(`Usunieto kare #${id}`);
            await load();
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Nie udalo sie usunac kary");
        } finally {
            setLoading(false);
        }
    }

    const cols = useMemo<GridColDef<PenaltyRow>[]>(
        () => [
            { field: "id", headerName: "ID", width: 90 },
            {
                field: "user",
                headerName: "Uzytkownik",
                minWidth: 200,
                flex: 1,
                renderCell: (p) => {
                    const u = p?.row?.user;
                    if (u && (u.firstName || u.lastName)) {
                        return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
                    }
                    return userLabelById[p?.row?.userId] || `#${p?.row?.userId ?? "-"}`;
                },
            },
            {
                field: "loan",
                headerName: "Ksiazka",
                minWidth: 220,
                flex: 1,
                renderCell: (p) => loanTitles[p?.row?.loanId] || `#${p?.row?.loanId ?? "-"}`,
            },
            {
                field: "amount",
                headerName: "Kwota",
                width: 140,
                renderCell: (p) => (p?.row?.amount ? `${p.row.amount} PLN` : "-"),
            },
            { field: "status", headerName: "Status", width: 120 },
            { field: "reason", headerName: "Powod", flex: 1, minWidth: 220 },
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
                            Usun
                        </Button>
                    </Stack>
                ),
            },
        ],
        [loading, loanTitles, userLabelById]
    );

    return (
        <Box sx={{ width: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    Kary
                </Typography>
                <Button variant="contained" onClick={() => setOpenCreate(true)} disabled={loading}>
                    + Dodaj kare
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
                <DialogTitle>Dodaj kare</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Autocomplete
                            options={users}
                            value={users.find((u) => u.id === userId) ?? null}
                            onChange={(_, val) => {
                                setUserId(val?.id ?? "");
                                setLoanId("");
                            }}
                            getOptionLabel={(o) => `${o.firstName ?? ""} ${o.lastName ?? ""}${o.email ? ` (${o.email})` : ""}`}
                            renderInput={(params) => <TextField {...params} label="Uzytkownik" placeholder="Zacznij pisac imie/nazwisko/email" />}
                        />

                        <TextField
                            select
                            label="Aktywne wypozyczenie (loan)"
                            value={loanId}
                            onChange={(e) => setLoanId(e.target.value === "" ? "" : Number(e.target.value))}
                            disabled={!userId || loansForUser.length === 0}
                            helperText={!userId ? "Najpierw wybierz uzytkownika" : loansForUser.length === 0 ? "Brak aktywnych wypozyczen dla tego uzytkownika" : ""}
                        >
                            <MenuItem value="">
                                <em>Wybierz...</em>
                            </MenuItem>
                            {loansForUser.map((l) => {
                                const bookTitle = (l as any)?.book?.title ?? (l as any)?.bookCopy?.book?.title ?? "";
                                const copyId = (l as any)?.bookCopy?.id ?? (l as any)?.bookCopyId ?? "";
                                const label = `#${l.id}${bookTitle ? ` - ${bookTitle}` : ""}${copyId ? ` (copy ${copyId})` : ""}`;
                                return (
                                    <MenuItem key={l.id} value={l.id}>
                                        {label}
                                    </MenuItem>
                                );
                            })}
                        </TextField>
                        <TextField
                            label="Kwota (np. 10 lub 10.50)"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <TextField label="Powod" value={reason} onChange={(e) => setReason(e.target.value)} />
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
