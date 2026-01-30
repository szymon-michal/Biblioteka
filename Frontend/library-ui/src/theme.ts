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
    fontFamily: ['Inter', 'Roboto', 'system-ui', 'Arial', 'sans-serif'].join(','),
  },
})
