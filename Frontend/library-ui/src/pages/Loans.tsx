import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
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
        book?: { id: number; title: string } | null;
    } | null;
};

type PageResponse<T> = { content: T[] };

export function LoansPage() {
    const [rows, setRows] = React.useState<LoanRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                // baseURL w api.ts = http://localhost:8080/api
                // więc tutaj dajemy /me/loans (bez /api)
                const res = await api.get<PageResponse<LoanRow>>("/me/loans");
                setRows(res.data?.content ?? []);
            } catch (e: any) {
                console.error(e);
                const status = e?.response?.status;
                const msg =
                    e?.response?.data?.message ||
                    e?.response?.data?.error ||
                    e?.message ||
                    "Unknown error";
                setError(status ? `HTTP ${status}: ${msg}` : msg);
                setRows([]);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, []);

    const columns = React.useMemo<GridColDef<LoanRow>[]>(
        () => [
            { field: "id", headerName: "ID", width: 90 },

            {
                field: "bookTitle",
                headerName: "Tytuł",
                flex: 1,
                sortable: false,
                renderCell: (params: GridRenderCellParams<LoanRow>) =>
                    params.row?.bookCopy?.book?.title ?? "—",
            },

            {
                field: "copyCode",
                headerName: "Kod egz.",
                width: 140,
                sortable: false,
                renderCell: (params: GridRenderCellParams<LoanRow>) =>
                    params.row?.bookCopy?.inventoryCode ?? "—",
            },

            {
                field: "userName",
                headerName: "Użytkownik",
                width: 200,
                sortable: false,
                renderCell: (params: GridRenderCellParams<LoanRow>) => {
                    const u = params.row?.user;
                    if (!u) return "—";
                    const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
                    return name || `ID: ${u.id}`;
                },
            },

            { field: "status", headerName: "Status", width: 120 },
            { field: "loanDate", headerName: "Wypożyczono", width: 180 },
            { field: "dueDate", headerName: "Termin", width: 180 },

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
                renderCell: (params: GridRenderCellParams<LoanRow>) =>
                    String(params.row?.extensionsCount ?? 0),
            },
        ],
        []
    );

    return (
        <div style={{ width: "100%" }}>
            <div style={{ marginBottom: 12, fontFamily: "monospace", fontSize: 12 }}>
                <div>loading: {String(loading)}</div>
                <div>error: {error ?? "null"}</div>
                <div>rows.length: {rows.length}</div>
                <div>firstRow.id: {rows[0]?.id ?? "—"}</div>
            </div>

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
        </div>
    );
}
