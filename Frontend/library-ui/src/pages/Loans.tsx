import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid/models";
import { api } from "../lib/api";

type LoanRow = {
    id: number | null;
    user?: any | null;
    bookCopy?: { id?: number | null; inventoryCode?: string | null; book?: { id?: number | null; title?: string | null } | null } | null;
    loanDate?: string | null;
    dueDate?: string | null;
    returnDate?: string | null;
    status?: string | null;
    extensionsCount?: number | null;
};

type PageResponse<T> = {
    content: T[];
    totalElements?: number;
};

function formatDateTime(value?: string | null) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    // 01.03.2026, 14:02
    return d.toLocaleString("pl-PL", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function LoansPage() {
    const [rows, setRows] = React.useState<LoanRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [busyId, setBusyId] = React.useState<number | null>(null); // spinner tylko dla klikniętego wiersza
    const [err, setErr] = React.useState<string | null>(null);
    const [toast, setToast] = React.useState<string | null>(null); // spinner tylko dla klikniętego wiersza

    async function returnLoan(id: number) {
        if (!confirm(`Na pewno oznaczyć wypożyczenie #${id} jako zwrócone?`)) return;
        try {
            setLoading(true);
            setErr(null);
            await api.post(`/loans/${id}/return`);
            await load();
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Nie udało się oddać książki");
        } finally {
            setLoading(false);
        }
    }
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
    async function extendLoan(row: LoanRow, additionalDays = 7) {
        if (!row?.id) return;
        const current = row.extensionsCount ?? 0;
        if (current >= 2) {
            setErr("Maksymalna liczba przed?u?e? (2) zosta?a osi?gni?ta");
            return;
        }
        setBusyId(row.id);
        setErr(null);
        try {
            await api.post(`/loans/${row.id}/extend`, { additionalDays });
            setToast(`Przed?u?ono wypo?yczenie #${row.id} o ${additionalDays} dni`);
            await load();
        } catch (e: any) {
            setErr(apiErrorMessage(e, "Nie uda?o si? przed?u?y?"));
        } finally {
            setBusyId(null);
        }
    }


    const load = async () => {
        setLoading(true);
        setErr(null);

        try {
            // jeśli u Ciebie jest inny endpoint, zmień tylko to jedno:
            const res = await api.get<PageResponse<LoanRow>>("/me/loans?page=0&size=50");

            const raw = res.data?.content ?? [];

            // ✅ HARDENING: backend czasem zwraca rekordy-nulle (id:null itd.)
            const clean = raw.filter((r) => r && r.id != null);

            // jeśli backend twierdzi że ma elementy, ale wszystkie są null → pokaż błąd
            if ((res.data?.totalElements ?? raw.length) > 0 && clean.length === 0) {
                setErr("Backend zwrócił rekordy z pustymi polami (id=null). Napraw endpoint /api/me/loans – UI nie może tego wyświetlić.");
            }

            setRows(clean);
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

    const cols = useMemo<GridColDef<LoanRow>[]>(
        () => [
            { field: "id", headerName: "ID", width: 90 },

            {
                field: "title",
                headerName: "Tytuł",
                flex: 1.6,
                minWidth: 260,
                valueGetter: (_v, row) => row.bookCopy?.book?.title ?? "—",
            },
            {
                field: "inventoryCode",
                headerName: "Egzemplarz",
                width: 140,
                valueGetter: (_v, row) => row.bookCopy?.inventoryCode ?? "—",
            },
            { field: "status", headerName: "Status", width: 120, valueGetter: (_v, row) => row.status ?? "—" },
            {
                field: "loanDate",
                headerName: "Data wypożyczenia",
                width: 180,
                valueGetter: (_v, row) => formatDateTime(row.loanDate),
            },
            {
                field: "dueDate",
                headerName: "Termin zwrotu",
                width: 180,
                valueGetter: (_v, row) => formatDateTime(row.dueDate),
            },
            {
                field: "returnDate",
                headerName: "Zwrot",
                width: 180,
                valueGetter: (_v, row) => formatDateTime(row.returnDate),
            },
            {
                field: "extensionsCount",
                headerName: "Przedłużenia",
                width: 140,
                valueGetter: (_v, row) => (row.extensionsCount ?? 0).toString(),
            },

            ,
            {
                field: "actions",
                headerName: "Akcje",
                width: 230,
                sortable: false,
                filterable: false,
                renderCell: (p) => (
                    <Stack direction="row" spacing={1}>
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={loading || p?.row?.status !== "ACTIVE" || (p?.row?.extensionsCount ?? 0) >= 2}
                            onClick={() => extendLoan(p.row)}
                        >
                            Przedłuż
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            color="success"
                            disabled={loading || p?.row?.status !== "ACTIVE"}
                            onClick={() => returnLoan(p.row.id)}
                        >
                            Oddaj
                        </Button>
                    </Stack>
                ),
            }
        ],
        [loading]
    );

    return (
        <Box sx={{ width: "100%" }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    Wypożyczenia
                </Typography>
                <Chip size="small" variant="outlined" label={`${rows.length} rekordów`} />
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
                        disableRowSelectionOnClick
                        // ✅ SAFETY: nawet jak gdzieś trafi się null-id, grid nie wybuchnie
                        getRowId={(r) => (r.id != null ? r.id : `tmp-${r.bookCopy?.id ?? "x"}-${r.dueDate ?? "x"}-${Math.random()}`)}
                    />
                </CardContent>
            </Card>
        </Box>
    );
}
