import React, { useState } from 'react'
import { Box, Card, CardContent, Typography, TextField, Stack, Button, Alert } from '@mui/material'
import { config } from '../lib/config'

export function SettingsPage() {
  const [apiUrl, setApiUrl] = useState(config.apiUrl)
  const [saved, setSaved] = useState(false)

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
        Ustawienia
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Adres backendu i ścieżki używane przez UI.
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Card sx={{ flex: 1, borderRadius: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
              Backend URL
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                label="API base URL"
                value={apiUrl}
                onChange={(e) => {
                  setSaved(false)
                  setApiUrl(e.target.value)
                }}
                placeholder="http://localhost:8080"
                fullWidth
              />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={() => {
                    config.setApiUrl(apiUrl)
                    setSaved(true)
                  }}
                  sx={{ borderRadius: 999, fontWeight: 800 }}
                >
                  Zapisz
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const def = 'http://localhost:8080'
                    config.setApiUrl(def)
                    setApiUrl(def)
                    setSaved(true)
                  }}
                  sx={{ borderRadius: 999, fontWeight: 800 }}
                >
                  Reset
                </Button>
              </Stack>
              {saved ? <Alert severity="success">Zapisano. Odśwież widok dashboardu, żeby sprawdzić połączenie.</Alert> : null}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderRadius: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
              Endpointy
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                OpenAPI: <strong>{config.openApiPath}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Login: <strong>{config.authLoginPath}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Register: <strong>{config.authRegisterPath}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Jeśli backend ma inne ścieżki, ustaw je przez zmienne VITE_* w .env.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
