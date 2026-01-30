import React from 'react'
import { Box, Drawer, Container } from '@mui/material'
import type { RouteKey } from '../routes'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const drawerWidth = 300

export function AppShell(props: { current: RouteKey; onNavigate: (r: RouteKey) => void; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
      >
        <Sidebar current={props.current} onNavigate={props.onNavigate} onAnyClick={() => setMobileOpen(false)} />
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Sidebar current={props.current} onNavigate={props.onNavigate} />
      </Drawer>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar current={props.current} onMenuClick={() => setMobileOpen(true)} />
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {props.children}
        </Container>
      </Box>
    </Box>
  )
}
