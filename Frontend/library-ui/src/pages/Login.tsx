import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Divider,
  Tabs,
  Tab,
} from '@mui/material'
import { apiFetch } from '../lib/api'
import { auth } from '../lib/auth'
import { config } from '../lib/config'

type Mode = 'login' | 'change'

export function LoginPage(props: { onSuccess?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('login')

  async function handleLogin() {
    const emailTrimmed = email.trim()
    const passwordTrimmed = password.trim()

    if (!emailTrimmed || !passwordTrimmed) {
      setError('Email i haslo sa wymagane.')
      return
    }

    const res = await apiFetch<any>(config.authLoginPath, {
      method: 'POST',
      body: { email: emailTrimmed, password: passwordTrimmed },
    })

    const token = res?.token || res?.accessToken || res?.jwt || res?.data?.token || res?.data?.accessToken
    if (!token) {
      throw new Error('Brak tokenu w odpowiedzi /auth/login.')
    }

    auth.setSession(token, res?.user)
    props.onSuccess?.()
  }

  async function handleChangePassword() {
    const emailTrimmed = email.trim()
    const passwordTrimmed = password.trim()
    const newPass = newPassword.trim()
    const newPassConfirm = newPasswordConfirm.trim()

    if (!emailTrimmed || !passwordTrimmed || !newPass || !newPassConfirm) {
      setError('Uzupelnij wszystkie pola.')
      return
    }
    if (newPass.length < 8) {
      setError('Nowe haslo musi miec min. 8 znakow.')
      return
    }
    if (newPass !== newPassConfirm) {
      setError('Nowe hasla nie sa takie same.')
      return
    }

    const res = await apiFetch<any>(config.authLoginPath, {
      method: 'POST',
      body: { email: emailTrimmed, password: passwordTrimmed },
    })

    const token = res?.token || res?.accessToken || res?.jwt || res?.data?.token || res?.data?.accessToken
    if (!token) {
      throw new Error('Brak tokenu w odpowiedzi /auth/login.')
    }

    auth.setSession(token, res?.user)

    await apiFetch('/auth/change-password', {
      method: 'PATCH',
      body: { currentPassword: passwordTrimmed, newPassword: newPass },
    })

    auth.clear()
    setPassword('')
    setNewPassword('')
    setNewPasswordConfirm('')
    setSuccess('Haslo zostalo zmienione. Zaloguj sie nowym haslem.')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        await handleLogin()
      } else {
        await handleChangePassword()
      }
    } catch (e: any) {
      const backendMsg = e?.details?.email || e?.details?.message || e?.message || 'Blad'
      setError(backendMsg)
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
      <Card sx={{ width: '100%', maxWidth: 480, borderRadius: 4, boxShadow: '0 16px 50px rgba(10, 40, 90, 0.12)' }}>
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
                L
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                  Library
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Zaloguj sie lub zmien haslo
                </Typography>
              </Box>
            </Stack>

            <Tabs
              value={mode}
              onChange={(_, v) => {
                setMode(v)
                setError(null)
                setSuccess(null)
              }}
              variant="fullWidth"
              sx={{
                '& .MuiTabs-indicator': { height: 3, borderRadius: 999 },
              }}
            >
              <Tab label="Logowanie" value="login" />
              <Tab label="Zmien haslo" value="change" />
            </Tabs>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  autoComplete="email"
                  fullWidth
                />
                <TextField
                  label={mode === 'login' ? 'Haslo' : 'Stare haslo'}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  fullWidth
                />

                {mode === 'change' ? (
                  <>
                    <TextField
                      label="Nowe haslo"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      fullWidth
                    />
                    <TextField
                      label="Powtorz nowe haslo"
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      autoComplete="new-password"
                      fullWidth
                    />
                  </>
                ) : null}

                {error ? <Alert severity="error">{error}</Alert> : null}
                {success ? <Alert severity="success">{success}</Alert> : null}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disableElevation
                  disabled={
                    loading ||
                    !email.trim() ||
                    !password.trim() ||
                    (mode === 'change' && (!newPassword.trim() || !newPasswordConfirm.trim()))
                  }
                  sx={{ borderRadius: 999, py: 1.2, fontWeight: 800 }}
                >
                  {loading ? (mode === 'login' ? 'Logowanie...' : 'Zapisywanie...') : mode === 'login' ? 'Zaloguj' : 'Zmien haslo'}
                </Button>

                <Button
                  type="button"
                  variant="text"
                  onClick={() => (window.location.hash = '#/register')}
                  sx={{ borderRadius: 999, fontWeight: 700 }}
                >
                  Nie masz konta? Zarejestruj sie
                </Button>
              </Stack>
            </form>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
