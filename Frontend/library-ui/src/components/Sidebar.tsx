import React, { useEffect, useState } from 'react'
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography, Card, CardContent, Chip, Stack } from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import AssignmentReturnedRoundedIcon from '@mui/icons-material/AssignmentReturnedRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import GavelRoundedIcon from '@mui/icons-material/GavelRounded'
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded'
import type { RouteKey } from '../routes'
import { auth } from '../lib/auth'
import { apiFetch } from '../lib/api'

const nav = {
  dashboard: { label: 'Dashboard', icon: <DashboardRoundedIcon fontSize="small" /> },
  catalog: { label: 'Katalog', icon: <MenuBookRoundedIcon fontSize="small" /> },
  loans: { label: 'Moje wypożyczenia', icon: <AssignmentReturnedRoundedIcon fontSize="small" /> },

  // admin:
  members: { label: 'Użytkownicy', icon: <PeopleAltRoundedIcon fontSize="small" /> },
  adminBooks: { label: 'Książki', icon: <AutoStoriesRoundedIcon fontSize="small" /> },
  adminAuthors: { label: 'Autorzy', icon: <PersonRoundedIcon fontSize="small" /> },
  adminLoans: { label: 'Wypożyczenia (admin)', icon: <AssignmentReturnedRoundedIcon fontSize="small" /> },
  adminPenalties: { label: 'Kary', icon: <GavelRoundedIcon fontSize="small" /> },
  adminStats: { label: 'Statystyki', icon: <QueryStatsRoundedIcon fontSize="small" /> },
} as const

export function Sidebar(props: { current: RouteKey; onNavigate: (r: RouteKey) => void; onAnyClick?: () => void }) {
  const role = auth.getRole()
  const isAdmin = auth.isLoggedIn() && role === 'ADMIN'
  const [activeLoans, setActiveLoans] = useState(0)

  const items: RouteKey[] = [
    'dashboard',
    'catalog',
    'loans',
    ...(isAdmin ? (['members', 'adminBooks', 'adminAuthors', 'adminLoans', 'adminPenalties', 'adminStats'] as const) : ([] as const)),
  ]

  useEffect(() => {
    if (!auth.isLoggedIn()) return

    const fetchLoans = async () => {
      try {
        const data = await apiFetch<any>('/me/loans')
        const loans = Array.isArray(data) ? data : data?.content || []
        setActiveLoans(loans.length)
      } catch {
        setActiveLoans(0)
      }
    }

    fetchLoans()
    const interval = setInterval(fetchLoans, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Box sx={{ width: 280, p: 1.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, pb: 1.2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.2 }}>
          Library
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 4, mb: 1.5 }}>
        <CardContent sx={{ py: 1.3, '&:last-child': { pb: 1.3 } }}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Zalogowano jako
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {auth.getUser()?.email || 'Użytkownik'}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 1 }}>
            <Chip size="small" label={role || 'USER'} />
            <Chip size="small" label={`Aktywne wypożyczenia: ${activeLoans}`} />
          </Stack>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 1 }} />

      <List dense sx={{ flex: 1, overflowY: 'auto' }}>
        {items.map((k) => (
          <ListItemButton
            key={k}
            selected={props.current === k}
            onClick={() => {
              props.onNavigate(k)
              props.onAnyClick?.()
            }}
            sx={{ borderRadius: 3, my: 0.25 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{(nav as any)[k]?.icon}</ListItemIcon>
            <ListItemText primary={(nav as any)[k]?.label || k} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ mt: 1 }} />
      <Box sx={{ px: 1, pt: 1 }}>
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          © {new Date().getFullYear()} Library
        </Typography>
      </Box>
    </Box>
  )
}
