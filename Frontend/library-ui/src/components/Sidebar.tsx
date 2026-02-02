import React, { useEffect, useState } from 'react'
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography, Card, CardContent, Chip, Stack, Avatar } from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import AssignmentReturnedRoundedIcon from '@mui/icons-material/AssignmentReturnedRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import GavelRoundedIcon from '@mui/icons-material/GavelRounded'
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded'
import type { RouteKey } from '../routes'
import { auth, getDisplayName } from '../lib/auth'
import { apiFetch } from '../lib/api'

const nav = {
  dashboard: { label: 'Dashboard', icon: <DashboardRoundedIcon fontSize="small" /> },
  catalog: { label: 'Katalog', icon: <MenuBookRoundedIcon fontSize="small" /> },
  loans: { label: 'Moje wypozyczenia', icon: <AssignmentReturnedRoundedIcon fontSize="small" /> },

  // admin:
  members: { label: 'Uzytkownicy', icon: <PeopleAltRoundedIcon fontSize="small" /> },
  adminBooks: { label: 'Ksiazki', icon: <AutoStoriesRoundedIcon fontSize="small" /> },
  adminAuthors: { label: 'Autorzy', icon: <PersonRoundedIcon fontSize="small" /> },
  adminLoans: { label: 'Wypozyczenia (admin)', icon: <AssignmentReturnedRoundedIcon fontSize="small" /> },
  adminPenalties: { label: 'Kary', icon: <GavelRoundedIcon fontSize="small" /> },
} as const

export function Sidebar(props: { current: RouteKey; onNavigate: (r: RouteKey) => void; onAnyClick?: () => void }) {
  const role = auth.getRole()
  const isAdmin = auth.isLoggedIn() && role === 'ADMIN'
  const [activeLoans, setActiveLoans] = useState(0)
  const user = auth.getUser()
  const displayName = getDisplayName()
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase()

  const items: RouteKey[] = [
    'dashboard',
    'catalog',
    'loans',
    ...(isAdmin ? (['members', 'adminBooks', 'adminAuthors', 'adminLoans', 'adminPenalties'] as const) : ([] as const)),
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
    <Box
      sx={{
        width: 280,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg, #f7f9fc 0%, #eef3ff 100%)',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ px: 0.5, pb: 2 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2.5,
            bgcolor: 'primary.main',
            display: 'grid',
            placeItems: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: 18,
            boxShadow: '0 10px 24px rgba(25, 118, 210, 0.35)',
          }}
        >
          L
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 0.2, lineHeight: 1.1 }}>
            Library
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Panel biblioteki
          </Typography>
        </Box>
      </Stack>

      <Card sx={{ borderRadius: 4, mb: 2, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)' }}>
        <CardContent sx={{ py: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
          <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1, bgcolor: 'primary.main' }}>
            {initials || 'U'}
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, wordBreak: 'break-all' }}>
            {user?.email || 'Uzytkownik'}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.4, justifyContent: 'center', flexWrap: 'wrap', rowGap: 1 }}>
            <Chip size="small" label={role || 'USER'} />
            <Chip size="small" label={`Aktywne wypozyczenia: ${activeLoans}`} />
          </Stack>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 1.2, opacity: 0.6 }} />

      <List dense sx={{ flex: 1, overflowY: 'auto' }}>
        {items.map((k) => (
          <ListItemButton
            key={k}
            selected={props.current === k}
            onClick={() => {
              props.onNavigate(k)
              props.onAnyClick?.()
            }}
            sx={{
              borderRadius: 2.5,
              my: 0.35,
              px: 1.4,
              '&.Mui-selected': {
                bgcolor: 'rgba(25, 118, 210, 0.12)',
                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.18)' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{(nav as any)[k]?.icon}</ListItemIcon>
            <ListItemText primary={(nav as any)[k]?.label || k} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ mt: 1.2, opacity: 0.6 }} />
      <Box sx={{ px: 0.5, pt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          (c) {new Date().getFullYear()} Library by Cezary Kaczmarek 228759 & Michał Krzeszowski 245852
        </Typography>
      </Box>
    </Box>
  )
}
