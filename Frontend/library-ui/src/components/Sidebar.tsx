import React from 'react'
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import AssignmentReturnedRoundedIcon from '@mui/icons-material/AssignmentReturnedRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import type { RouteKey } from '../routes'
import { auth } from '../lib/auth'

const nav = {
  dashboard: { label: 'Dashboard', icon: <DashboardRoundedIcon fontSize="small" /> },
  catalog: { label: 'Katalog', icon: <MenuBookRoundedIcon fontSize="small" /> },
  loans: { label: 'Wypożyczenia', icon: <AssignmentReturnedRoundedIcon fontSize="small" /> },
  members: { label: 'Użytkownicy', icon: <PeopleAltRoundedIcon fontSize="small" /> },
  explorer: { label: 'API Explorer', icon: <TravelExploreRoundedIcon fontSize="small" /> },
  settings: { label: 'Ustawienia', icon: <SettingsRoundedIcon fontSize="small" /> },
} as const

export function Sidebar(props: { current: RouteKey; onNavigate: (r: RouteKey) => void; onAnyClick?: () => void }) {
  const role = auth.getRole()
  const isAdmin = auth.isLoggedIn() && role === 'ADMIN'

  const items: RouteKey[] = ['dashboard', 'catalog', 'loans', ...(isAdmin ? (['members', 'explorer'] as const) : ([] as const)), 'settings']

  return (
    <Box sx={{ width: 280, p: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, pb: 1.2 }}>
        <Box
          aria-hidden
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            bgcolor: 'primary.main',
            display: 'grid',
            placeItems: 'center',
            color: 'white',
            fontWeight: 800,
          }}
        >
          📚
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            Library
          </Typography>
          <Typography variant="caption" color="text.secondary">
            rola: {role || '—'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      <List sx={{ pt: 1 }}>
        {items.map((key) => (
          <ListItemButton
            key={key}
            selected={props.current === key}
            onClick={() => {
              props.onNavigate(key)
              props.onAnyClick?.()
            }}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{(nav as any)[key].icon}</ListItemIcon>
            <ListItemText primary={(nav as any)[key].label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ mt: 1 }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1, pt: 1 }}>
        Sesja: {auth.isLoggedIn() ? 'JWT OK' : 'brak (zaloguj się)'}
      </Typography>
    </Box>
  )
}
