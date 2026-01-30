import React from 'react'
import { Box, Drawer, Container } from '@mui/material'
import type { RouteKey } from '../routes'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const drawerWidthPercent = 16 // 16% of viewport width

export function AppShell(props: { current: RouteKey; onNavigate: (r: RouteKey) => void; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: '70vw' } }}
      >
        <Sidebar current={props.current} onNavigate={props.onNavigate} onAnyClick={() => setMobileOpen(false)} />
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          flexShrink: 0,
          width: `${drawerWidthPercent}vw`,
          '& .MuiDrawer-paper': { width: `${drawerWidthPercent}vw`, boxSizing: 'border-box' },
        }}
      >
        <Sidebar current={props.current} onNavigate={props.onNavigate} />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `${100 - drawerWidthPercent}vw` },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: '100vh',
        }}
      >
        <Topbar current={props.current} onMenuClick={() => setMobileOpen(true)} />
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {props.children}
        </Box>
      </Box>
    </Box>
  )
}
