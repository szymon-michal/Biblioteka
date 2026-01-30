import React from 'react'
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  Button,
  Tooltip,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import type { RouteKey } from '../routes'
import { auth } from '../lib/auth'

const titles: Partial<Record<RouteKey, string>> = {
  dashboard: 'Dashboard',
  overview: 'Dashboard',
  catalog: 'Katalog',
  loans: 'Wypożyczenia',
  members: 'Użytkownicy',
  explorer: 'API Explorer',
  settings: 'Ustawienia',
}

export function Topbar(props: { current: RouteKey; onMenuClick?: () => void }) {
  const user = auth.getUser()

  return (
    <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: 'blur(10px)' }}>
      <Toolbar sx={{ gap: 1 }}>
        <IconButton onClick={props.onMenuClick} edge="start" sx={{ display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            {titles[props.current] ?? 'Library'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : '—'}
          </Typography>
        </Box>

        <Tooltip title="Wyloguj">
          <Button
            variant="outlined"
            size="small"
            startIcon={<LogoutRoundedIcon />}
            onClick={() => {
              auth.clear()
              window.location.hash = '#/login'
            }}
            sx={{ borderRadius: 999 }}
          >
            Wyloguj
          </Button>
        </Tooltip>
      </Toolbar>
    </AppBar>
  )
}
