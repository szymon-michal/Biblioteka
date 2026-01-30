import React, { useState } from 'react'
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Stack, Divider } from '@mui/material'
import { apiFetch } from '../lib/api'
import { config } from '../lib/config'

export function RegisterPage(props: { onSuccess?: () => void; onGoToLogin?: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password: password.trim(),
    }

    if (!payload.firstName || !payload.lastName || !payload.email || !payload.password) {
      setLoading(false)
      setError('Imię, nazwisko, email i hasło są wymagane.')
      return
    }

    try {
      await apiFetch<any>(config.authRegisterPath, {
        method: 'POST',
        body: payload,
      })
      setDone(true)
      props.onSuccess?.()
    } catch (e: any) {
      const msg = e?.details?.message || e?.message || 'Rejestracja nieudana'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        background:
          'radial-gradient(1200px 600px at 10% 10%, rgba(25,118,210,0.18), transparent 60%), radial-gradient(900px 500px at 90% 30%, rgba(21,101,192,0.12), transparent 55%)',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 520, borderRadius: 4, boxShadow: '0 16px 50px rgba(10, 40, 90, 0.12)' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                aria-hidden
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 3,
                  bgcolor: 'primary.main',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'white',
                  fontWeight: 800,
                }}
              >
                ✨
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                  Rejestracja
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Załóż konto czytelnika (READER)
                </Typography>
              </Box>
            </Stack>

            {done ? <Alert severity="success">Konto utworzone. Możesz się zalogować.</Alert> : null}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="Imię" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth />
                  <TextField label="Nazwisko" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth />
                </Stack>
                <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" fullWidth />
                <TextField
                  label="Hasło"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  fullWidth
                />

                {error ? <Alert severity="error">{error}</Alert> : null}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disableElevation
                  disabled={loading || !firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()}
                  sx={{ borderRadius: 999, py: 1.2, fontWeight: 800 }}
                >
                  {loading ? 'Tworzenie…' : 'Utwórz konto'}
                </Button>

                <Button
                  type="button"
                  variant="text"
                  onClick={() => (props.onGoToLogin ? props.onGoToLogin() : (window.location.hash = '#/login'))}
                  sx={{ borderRadius: 999, fontWeight: 700 }}
                >
                  Mam konto — wróć do logowania
                </Button>
              </Stack>
            </form>

            <Divider />
            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
              Endpoint: {config.authRegisterPath}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
