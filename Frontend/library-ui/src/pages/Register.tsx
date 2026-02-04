import React, { useState } from 'react'
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Stack, Divider, InputAdornment, IconButton } from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { apiFetch } from '../lib/api'
import { config } from '../lib/config'

export function RegisterPage(props: { onSuccess?: () => void; onGoToLogin?: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function getPasswordError(pwRaw: string): string | null {
    const pw = pwRaw.trim()
    if (!pw) return null
    const hasMinLen = pw.length >= 8
    const hasUpper = /[A-Z]/.test(pw)
    const hasSpecial = /[^A-Za-z0-9]/.test(pw)
    if (hasMinLen && hasUpper && hasSpecial) return null
    return 'Hasło musi mieć co najmniej 8 znaków, zawierać 1 wielką literę i 1 znak specjalny.'
  }

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

    const passwordError = getPasswordError(payload.password)
    if (passwordError) {
      setLoading(false)
      setError(passwordError)
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  helperText="Min. 8 znaków, 1 wielka litera, 1 znak specjalny."
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
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
