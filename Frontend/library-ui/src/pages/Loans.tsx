import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Box, Button, Stack, Alert, Snackbar, CircularProgress } from "@mui/material";
import { api } from "../lib/api";

type LoanRow = {
    id: number;
    status: string;
    loanDate: string;
    dueDate: string;
    returnDate: string | null;
    extensionsCount?: number;

    user?: { id: number; firstName: string; lastName: string } | null;
    bookCopy?: {
        id: number;
        inventoryCode: string;
        book?: { id: number; title: string; author?: string | null } | null;
    } | null;
};

type PageResponse<T> = { content: T[] };

export function LoansPage() {
    const [rows, setRows] = React.useState<LoanRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [busyId, setBusyId] = React.useState<number | null>(null); // spinner tylko dla klikniętego wiersza
    const [err, setErr] = React.useState<string | null>(null);
    const [toast, setToast] = React.useState<string | null>(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const res = await api.get<PageResponse<LoanRow>>("/me/loans");
            setRows(res.data?.content ?? []);
        } catch (e: any) {
            const status = e?.response?.status;
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                e?.message ||
                "Unknown error";
            setErr(status ? `HTTP ${status}: ${msg}` : msg);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void load();
    }, [load]);

    function apiErrorMessage(e: any, fallback: string) {
        const status = e?.response?.status;
        const msg =
            e?.response?.data?.message ||
            e?.response?.data?.error ||
            e?.message ||
            fallback;

        // 409 = np. limit przedłużeń
        if (status === 409) return msg; // backend message jest najlepszy
        if (status === 403) return "Brak uprawnień do tej operacji.";
        if (status === 401) return "Zaloguj się ponownie (token wygasł lub brak tokenu).";
        return msg;
    }
    function formatDate(value?: string | null) {
        if (!value) return "—";
        const d = new Date(value);
        if (isNaN(d.getTime())) return value; // fallback jakby coś było dziwne
        return d.toLocaleDateString("pl-PL"); // d.m.Y
    }

    async function extendLoan(loanId: number, additionalDays = 7) {
        setBusyId(loanId);
        setErr(null);
        try {
            await api.post(`/loans/${loanId}/extend`, { additionalDays });
            setToast(`Przedłużono wypożyczenie #${loanId} o ${additionalDays} dni`);
            await load();
        } catch (e: any) {
            setErr(apiErrorMessage(e, "Nie udało się przedłużyć"));
        } finally {
            setBusyId(null);
        }
    }

    async function returnLoan(loanId: number) {
        setBusyId(loanId);
        setErr(null);
        try {
            await api.post(`/loans/${loanId}/return`);
            setToast(`Zwrócono książkę (wypożyczenie #${loanId})`);
            await load();
        } catch (e: any) {
            setErr(apiErrorMessage(e, "Nie udało się zwrócić"));
        } finally {
            setBusyId(null);
        }
    }

    const columns = React.useMemo<GridColDef<LoanRow>[]>(
        () => [
            { field: "id", headerName: "ID", width: 90 },

            {
                field: "bookTitle",
                headerName: "Tytuł",
                flex: 3,
                minWidth: 250,
                sortable: false,
                renderCell: (params: GridRenderCellParams<LoanRow>) =>
                    params.row?.bookCopy?.book?.title ?? "—",
            },
            {
                field: "author",
                headerName: "Autor",
                width: 150,
                sortable: false,
                renderCell: (params: GridRenderCellParams<LoanRow>) =>
                    params.row?.bookCopy?.book?.author ?? "—",
            },
            {
                field: "copyCode",
                headerName: "Kod egz.",
                width: 140,
                sortable: false,
                renderCell: (params: GridRenderCellParams<LoanRow>) =>
                    params.row?.bookCopy?.inventoryCode ?? "—",
            },

            { field: "status", headerName: "Status", width: 120 },
            { field: "loanDate", headerName: "Wypożyczono", width: 120,  renderCell: (p) => formatDate(p.row?.loanDate), },
            { field: "dueDate", headerName: "Termin", width: 120,  renderCell: (p) => formatDate(p.row?.loanDate), },
            {
                field: "returnDatePretty",
                headerName: "Zwrócono",
                width: 180,
                sortable: false,
                renderCell: (params: GridRenderCellParams<LoanRow>) =>
                    params.row?.returnDate ?? "—",
            },
            {
                field: "extensionsCount",
                headerName: "Przedłużenia",
                width: 140,
                sortable: false,
                renderCell: (params: GridRenderCellParams<LoanRow>) =>
                    String(params.row?.extensionsCount ?? 0),
            },

            {
                field: "actions",
                headerName: "Akcje",
                width: 200,
                sortable: false,
                filterable: false,
                renderCell: (params: GridRenderCellParams<LoanRow>) => {
                    const r = params.row;
                    const isActive = r.status === "ACTIVE";
                    const canExtend = isActive && (r.extensionsCount ?? 0) < 2;
                    const canReturn = isActive;
                    const isBusy = busyId === r.id;

                    return (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Button
                                size="small"
                                variant="outlined"
                                disabled={!canExtend || isBusy}
                                onClick={() => extendLoan(r.id, 7)}
                            >
                                Przedłuż +7
                            </Button>
                            <Button
                                size="small"
                                color="success"
                                variant="contained"
                                disabled={!canReturn || isBusy}
                                onClick={() => {
                                    if (confirm(`Na pewno zwrócić wypożyczenie #${r.id}?`)) {
                                        void returnLoan(r.id);
                                    }
                                }}
                            >
                                Zwróć
                            </Button>
                            {isBusy ? <CircularProgress size={18} /> : null}
                        </Stack>
                    );
                },
            },
        ],
        [busyId]
    );

    return (
        <Box sx={{ width: "100%" }}>
            {err ? (
                <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setErr(null)}>
                    {err}
                </Alert>
            ) : null}

            <div style={{ minHeight: 420, width: "100%" }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    getRowId={(r) => r.id}
                    disableRowSelectionOnClick
                    autoHeight
                />
            </div>

            <Snackbar
                open={Boolean(toast)}
                autoHideDuration={2500}
                onClose={() => setToast(null)}
                message={toast ?? ""}
            />
        </Box>
    );
}
