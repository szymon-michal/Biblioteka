import React from 'react'
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  Button,
  Tooltip,
  Stack,
  Chip,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import type { RouteKey } from '../routes'
import { auth, getDisplayName } from '../lib/auth'

const titles: Partial<Record<RouteKey, string>> = {
  dashboard: 'Dashboard',
  overview: 'Dashboard',
  catalog: 'Katalog',
  loans: 'Wypozyczenia',
  members: 'Uzytkownicy',
}

export function Topbar(props: { current: RouteKey; onMenuClick?: () => void }) {
  const user = auth.getUser()
  const role = auth.getRole()
  const displayName = getDisplayName()

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        background: 'rgba(255, 255, 255, 0.7)',
      }}
    >
      <Toolbar sx={{ gap: 2, minHeight: 68 }}>
        <IconButton onClick={props.onMenuClick} edge="start" sx={{ display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.05 }}>
            {titles[props.current] ?? 'Library'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {role === 'ADMIN' ? 'Panel admina' : 'Panel uzytkownika'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.2} alignItems="center">
          <Chip size="small" variant="outlined" label={role || 'USER'} />
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email || '-'}
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
              sx={{ borderRadius: 999, px: 2 }}
            >
              Wyloguj
            </Button>
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
