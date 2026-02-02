import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
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
import { formatAuthors } from "../../lib/formatters";

type LoanRow = {
    id: number;
    status: string;
    loanDate: string;
    dueDate: string;
    returnDate?: string | null;
    extensionsCount?: number;

    user?: { id: number; firstName: string; lastName: string; email?: string } | null;
    bookCopy?: {
        id: number;
        inventoryCode: string;
        book?: {
            id: number;
            title: string;
            authors?: Array<{ id: number; firstName: string; lastName: string }> | null;
        } | null;
    } | null;
};

type PageResponse<T> = { content: T[] };

const STATUS_STYLES: Record<
    string,
    { label: string; color: "default" | "success" | "info" | "warning" | "error" }
> = {
    ACTIVE: { label: "Wypozyczona", color: "info" },
    OVERDUE: { label: "Po terminie", color: "error" },
    RETURN_REQUESTED: { label: "W procesie oddawania", color: "warning" },
    RETURN_REJECTED: { label: "Nie otrzymana", color: "error" },
    RETURNED: { label: "Oddana", color: "success" },
    LOST: { label: "Zgubiona", color: "error" },
};

function getStatusStyle(value?: string | null) {
    if (!value) return { label: "-", color: "default" as const };
    return STATUS_STYLES[value] || { label: value, color: "default" as const };
}
function toLocalDate(value?: string | null) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`; // pod input[type=date]
}

function formatDate(value?: string | null) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("pl-PL");
}

export default function AdminLoans() {
    const [rows, setRows] = useState<LoanRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    // edit loan
    const [openEdit, setOpenEdit] = useState(false);
    const [editing, setEditing] = useState<LoanRow | null>(null);
    const [status, setStatus] = useState("ACTIVE");
    const [dueDate, setDueDate] = useState("");
    const [returnDate, setReturnDate] = useState("");

    // create penalty
    const [openPenalty, setOpenPenalty] = useState(false);
    const [penaltyLoan, setPenaltyLoan] = useState<LoanRow | null>(null);
    const [penaltyAmount, setPenaltyAmount] = useState("10.00");
    const [penaltyReason, setPenaltyReason] = useState("");

    const load = async () => {
        setLoading(true);
        setErr(null);
        try {
            const res = await api.get<PageResponse<LoanRow>>("/admin/loans?page=0&size=200");
            setRows(res.data?.content ?? []);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Nie udało się pobrać wypożyczeń");
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    function openEditLoan(l: LoanRow) {
        setEditing(l);
        setStatus(l.status ?? "ACTIVE");
        setDueDate(toLocalDate(l.dueDate));
        setReturnDate(toLocalDate(l.returnDate ?? ""));
        setOpenEdit(true);
    }

    async function saveLoan() {
        if (!editing) return;
        try {
            setLoading(true);
            setErr(null);

            await api.put(`/admin/loans/${editing.id}`, {
                status,
                // backend przyjmie string -> LocalDateTime/LocalDate zależnie od mapowania;
                // najbezpieczniej: wysyłamy jako ISO date-time na 00:00:00
                dueDate: dueDate ? `${dueDate}T00:00:00` : null,
                returnDate: returnDate ? `${returnDate}T00:00:00` : null,
            });

            setToast(`Zapisano wypożyczenie #${editing.id}`);
            setOpenEdit(false);
            await load();
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Nie udało się zapisać wypożyczenia");
        } finally {
            setLoading(false);
        }
    }

    async function removeLoan(id: number) {
        if (!confirm(`Na pewno usunąć wypożyczenie #${id}?`)) return;
        try {
            setLoading(true);
            setErr(null);
            await api.delete(`/admin/loans/${id}`);
            setToast(`Usunięto wypożyczenie #${id}`);
            await load();
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Nie udało się usunąć wypożyczenia");
        } finally {
            setLoading(false);
        }
    }

    async function acceptReturn(id: number) {
        if (!confirm(`Potwierdzić zwrot wypożyczenia #${id}?`)) return;
        try {
            setLoading(true);
            setErr(null);
            await api.post(`/admin/loans/${id}/return/accept`);
            setToast(`Potwierdzono zwrot #${id}`);
            await load();
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Nie udało się potwierdzić zwrotu");
        } finally {
            setLoading(false);
        }
    }

    async function rejectReturn(id: number) {
        if (!confirm(`Odrzucić zwrot wypożyczenia #${id}?`)) return;
        try {
            setLoading(true);
            setErr(null);
            await api.post(`/admin/loans/${id}/return/reject`);
            setToast(`Odrzucono zwrot #${id}`);
            await load();
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Nie udało się odrzucić zwrotu");
        } finally {
            setLoading(false);
        }
    }

    function openPenaltyDialog(l: LoanRow) {
        setPenaltyLoan(l);
        setPenaltyAmount("10.00");
        setPenaltyReason("");
        setOpenPenalty(true);
    }

    async function createPenalty() {
        if (!penaltyLoan?.user?.id) {
            setErr("Brak userId w wypożyczeniu – backend nie zwrócił usera.");
            return;
        }
        try {
            setLoading(true);
            setErr(null);

            const amt = Number(penaltyAmount);
            if (!Number.isFinite(amt) || amt <= 0) {
                setErr("Kwota musi być liczbą > 0 (np. 10 lub 10.50).");
                return;
            }

            await api.post("/admin/penalties", {
                userId: penaltyLoan.user.id,
                loanId: penaltyLoan.id,
                amount: amt,
                reason: penaltyReason.trim() || "Kara za wypożyczenie",
            });

            setToast(`Nałożono karę na user #${penaltyLoan.user.id}`);
            setOpenPenalty(false);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Nie udało się nałożyć kary");
        } finally {
            setLoading(false);
        }
    }

    const cols = useMemo<GridColDef<LoanRow>[]>(
        () => [
            { field: "id", headerName: "ID", width: 80 },
            {
                field: "user",
                headerName: "Użytkownik",
                width: 220,
                sortable: false,
                renderCell: (p) => {
                    const u = p?.row?.user;
                    return u ? `${u.firstName} ${u.lastName} (#${u.id})` : "—";
                },
            },
            {
                field: "title",
                headerName: "Tytuł",
                flex: 2,
                minWidth: 240,
                sortable: false,
                renderCell: (p) => p?.row?.bookCopy?.book?.title ?? "—",
            },
            {
                field: "authors",
                headerName: "Autorzy",
                width: 220,
                sortable: false,
                renderCell: (p) => formatAuthors(p?.row?.bookCopy?.book?.authors),
            },
            {
                field: "status",
                headerName: "Status",
                width: 200,
                sortable: false,
                renderCell: (p) => {
                    const s = getStatusStyle(p?.row?.status ?? null);
                    const key = s.color === "default" ? "grey" : s.color;
                    return (
                        <Box
                            sx={{
                                px: 1,
                                py: 0.35,
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 700,
                                bgcolor: key === "grey" ? "grey.200" : `${key}.light`,
                                color: key === "grey" ? "grey.800" : `${key}.dark`,
                                display: "inline-block",
                            }}
                        >
                            {s.label}
                        </Box>
                    );
                },
            },
            { field: "loanDate", headerName: "Wypożyczono", width: 130, renderCell: (p) => formatDate(p?.row?.loanDate) },
            { field: "dueDate", headerName: "Termin", width: 130, renderCell: (p) => formatDate(p?.row?.dueDate) },
            { field: "returnDate", headerName: "Zwrócono", width: 130, renderCell: (p) => formatDate(p?.row?.returnDate) },
            {
                field: "actions",
                headerName: "Akcje",
                width: 420,
                sortable: false,
                filterable: false,
                renderCell: (p) => (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                        <Button size="small" variant="outlined" onClick={() => openEditLoan(p?.row)} disabled={loading}>
                            Edytuj
                        </Button>
                        {p?.row?.status === "RETURN_REQUESTED" ? (
                            <>
                                <Button size="small" variant="contained" color="success" onClick={() => acceptReturn(p?.row?.id)} disabled={loading}>
                                    Potwierdz zwrot
                                </Button>
                                <Button size="small" variant="outlined" color="error" onClick={() => rejectReturn(p?.row?.id)} disabled={loading}>
                                    Odrzuc zwrot
                                </Button>
                            </>
                        ) : null}
                        <Button size="small" color="warning" variant="contained" onClick={() => openPenaltyDialog(p?.row)} disabled={loading}>
                            Nałóż karę
                        </Button>
                        <Button size="small" color="error" variant="contained" onClick={() => removeLoan(p?.row?.id)} disabled={loading}>
                            Usuń
                        </Button>
                    </Stack>
                ),
            },
        ],
        [loading]
    );

    return (
        <Box sx={{ width: "100%" }}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
                Wypożyczenia (ADMIN)
            </Typography>

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

            {/* EDIT LOAN */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editing ? `Edytuj wypożyczenie #${editing.id}` : "Edytuj wypożyczenie"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                            <MenuItem value="OVERDUE">OVERDUE</MenuItem>
                            <MenuItem value="RETURN_REQUESTED">RETURN_REQUESTED</MenuItem>
                            <MenuItem value="RETURN_REJECTED">RETURN_REJECTED</MenuItem>
                            <MenuItem value="RETURNED">RETURNED</MenuItem>
                            <MenuItem value="LOST">LOST</MenuItem>
                        </TextField>

                        <TextField
                            label="Termin zwrotu"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Data zwrotu"
                            type="date"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)} disabled={loading}>
                        Anuluj
                    </Button>
                    <Button variant="contained" onClick={saveLoan} disabled={loading}>
                        Zapisz
                    </Button>
                </DialogActions>
            </Dialog>

            {/* CREATE PENALTY */}
            <Dialog open={openPenalty} onClose={() => setOpenPenalty(false)} fullWidth maxWidth="sm">
                <DialogTitle>Nałóż karę</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Kwota (np. 10 lub 10.50)"
                            value={penaltyAmount}
                            onChange={(e) => setPenaltyAmount(e.target.value)}
                        />
                        <TextField
                            label="Powód"
                            value={penaltyReason}
                            onChange={(e) => setPenaltyReason(e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPenalty(false)} disabled={loading}>
                        Anuluj
                    </Button>
                    <Button variant="contained" color="warning" onClick={createPenalty} disabled={loading}>
                        Nałóż
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)} message={toast ?? ""} />
        </Box>
    );
}









