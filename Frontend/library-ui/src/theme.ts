import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#1565c0' },
    background: {
      default: '#f6f9ff',
      paper: '#ffffff',
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: ['Manrope', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 700,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
})
