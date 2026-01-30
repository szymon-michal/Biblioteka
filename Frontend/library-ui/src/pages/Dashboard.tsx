import React, { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Typography, Stack, Alert, Chip, Divider } from "@mui/material";
import { apiFetch } from "../lib/api";
import { auth } from "../lib/auth";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type SummaryDto = {
  totalLoans: number;
  newUsers: number;
  activeUsers: number;
  overdueLoans: number;
  mostPopularBooks: Array<{ bookId: number; title: string; loansCount: number }>;
};

type LoansPerDay = Array<{ day: string; loansCount: number }>;

type MyLoanDto = {
  id: number;
  status: string;
  dueDate: string;
  bookCopy?: { book?: { title?: string; author?: string | null } | null } | null;
};

type PageResponse<T> = { content: T[] };

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DashboardPage() {
  const role = auth.getRole();
  const isLoggedIn = auth.isLoggedIn();
  const isAdmin = isLoggedIn && role === "ADMIN";

  const [summary, setSummary] = useState<SummaryDto | null>(null);
  const [loansSeries, setLoansSeries] = useState<LoansPerDay>([]);
  const [err, setErr] = useState<string | null>(null);

  const [myLoans, setMyLoans] = useState<MyLoanDto[]>([]);
  const [myErr, setMyErr] = useState<string | null>(null);

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 29);
    return { from: toIsoDate(from), to: toIsoDate(to) };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (isAdmin && isLoggedIn) {
        try {
          // ✅ bez /api na początku
          const [s, series] = await Promise.all([
            apiFetch<SummaryDto>(`/admin/stats/summary?from=${range.from}&to=${range.to}`),
            apiFetch<LoansPerDay>(`/admin/stats/loans-per-day?from=${range.from}&to=${range.to}`),
          ]);
          if (!alive) return;
          setSummary(s);
          setLoansSeries(series);
        } catch (e: any) {
          if (!alive) return;
          setErr(e?.message || "Nie udało się pobrać statystyk (ADMIN)");
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [isAdmin, isLoggedIn, range.from, range.to]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!isLoggedIn || isAdmin) return;

      try {
        // ✅ /me/loans (baseURL już ma /api)
        const page = await apiFetch<PageResponse<MyLoanDto>>(`/me/loans`);
        if (!alive) return;

        const active = (page?.content ?? []).filter((x) => x.status === "ACTIVE");
        setMyLoans(active);
        setMyErr(null);
      } catch (e: any) {
        if (!alive) return;
        setMyErr(e?.message || "Nie udało się pobrać Twoich wypożyczeń");
        setMyLoans([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isLoggedIn, isAdmin]);

  return (
      <Box>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <StatCard title="Rola" value={role || "—"} subtitle="JWT" />

          {/* Dla admina zostawiamy “Zalogowany”, dla readera zastępujemy listą niżej */}
          {isAdmin ? <StatCard title="Zalogowany" value={isLoggedIn ? "TAK" : "NIE"} subtitle="localStorage" /> : null}
        </Stack>

        {isAdmin ? (
            <>
              {!isLoggedIn ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Statystyki ADMIN są widoczne po zalogowaniu (wymagany JWT).
                  </Alert>
              ) : null}

              {err ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {err}
                  </Alert>
              ) : null}

              <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
                <StatCard title="Wypożyczenia" value={summary ? String(summary.totalLoans) : "—"} subtitle={`Zakres: ${range.from} → ${range.to}`} />
                <StatCard title="Nowi użytkownicy" value={summary ? String(summary.newUsers) : "—"} subtitle="W zakresie" />
                <StatCard title="Zaległe" value={summary ? String(summary.overdueLoans) : "—"} subtitle="Overdue" />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Card sx={{ flex: 2, borderRadius: 4 }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        Wypożyczenia per dzień
                      </Typography>
                      <Chip size="small" label={`${range.from} → ${range.to}`} />
                    </Stack>
                    <Box sx={{ height: 320 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={loansSeries} margin={{ left: 8, right: 16, top: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="loansCount" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>

                <Card sx={{ flex: 1, borderRadius: 4 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                      Top książki
                    </Typography>
                    {summary?.mostPopularBooks?.length ? (
                        <Stack spacing={1}>
                          {summary.mostPopularBooks.slice(0, 5).map((b) => (
                              <Box key={b.bookId} sx={{ p: 1.2, borderRadius: 3, bgcolor: "background.default" }}>
                                <Typography sx={{ fontWeight: 800 }} noWrap>
                                  {b.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  wypożyczeń: {b.loansCount}
                                </Typography>
                              </Box>
                          ))}
                        </Stack>
                    ) : (
                        <Typography color="text.secondary">Brak danych.</Typography>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </>
        ) : (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>
                  Twoje wypożyczenia
                </Typography>

                {!isLoggedIn ? (
                    <Typography color="text.secondary">
                      Zaloguj się, aby zobaczyć wypożyczone książki.
                    </Typography>
                ) : (
                    <>
                      {myErr ? (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            {myErr}
                          </Alert>
                      ) : null}

                      {!myLoans.length ? (
                          <Typography color="text.secondary" sx={{ mt: 1 }}>
                            Brak aktywnych wypożyczeń.
                          </Typography>
                      ) : (
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            {myLoans.slice(0, 6).map((l) => (
                                <Box key={l.id} sx={{ p: 1.2, borderRadius: 3, bgcolor: "background.default" }}>
                                  <Typography sx={{ fontWeight: 800 }} noWrap>
                                    {l.bookCopy?.book?.title ?? "—"}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" noWrap>
                                    autor: {l.bookCopy?.book?.author ?? "—"}
                                  </Typography>
                                  <Divider sx={{ my: 1 }} />
                                  <Typography variant="caption" color="text.secondary">
                                    termin zwrotu: {l.dueDate}
                                  </Typography>
                                </Box>
                            ))}
                          </Stack>
                      )}
                    </>
                )}
              </CardContent>
            </Card>
        )}
      </Box>
  );
}

function StatCard(props: { title: string; value: string; subtitle?: string }) {
  return (
      <Card sx={{ flex: 1, borderRadius: 4 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {props.title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
            {props.value}
          </Typography>
          {props.subtitle ? (
              <Typography variant="caption" color="text.secondary">
                {props.subtitle}
              </Typography>
          ) : null}
        </CardContent>
      </Card>
  );
}
