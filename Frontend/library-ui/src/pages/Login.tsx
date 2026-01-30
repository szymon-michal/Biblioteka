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
} from '@mui/material'
import { apiFetch } from '../lib/api'
import { auth } from '../lib/auth'
import { config } from '../lib/config'

export function LoginPage(props: { onSuccess?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const emailTrimmed = email.trim()
    const passwordTrimmed = password.trim()

    if (!emailTrimmed || !passwordTrimmed) {
      setLoading(false)
      setError('Email and password are required.')
      return
    }

    try {
      // ✅ Your backend validates "email" (not "username")
      const res = await apiFetch<any>(config.authLoginPath, {
        method: 'POST',
        body: { email: emailTrimmed, password: passwordTrimmed },
      })

      console.log('>>> LOGIN RESPONSE:', res)

      // Common token field names (adjust if your backend returns something else)
      const token =
          res?.token ||
          res?.accessToken ||
          res?.jwt ||
          res?.data?.token ||
          res?.data?.accessToken

      console.log('>>> TOKEN EXTRACTED:', token)

      if (!token) {
        throw new Error(
            'Login succeeded but no token was found in the response. Check the login response JSON and map the token field.',
        )
      }

      auth.setSession(token, res?.user)
      console.log('>>> TOKEN SAVED, checking localStorage:', localStorage.getItem('access_token'))
      props.onSuccess?.()
    } catch (e: any) {
      // your backend returns { message, details } sometimes
      const backendMsg =
          e?.details?.email ||
          e?.details?.message ||
          e?.message ||
          'Login failed'
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
      <Card sx={{ width: '100%', maxWidth: 460, borderRadius: 4, boxShadow: '0 16px 50px rgba(10, 40, 90, 0.12)' }}>
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
                📚
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                  Library
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Zaloguj się, aby korzystać z aplikacji
                </Typography>
              </Box>
            </Stack>

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
                  label="Hasło"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  fullWidth
                />

                {error ? <Alert severity="error">{error}</Alert> : null}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disableElevation
                  disabled={loading || !email.trim() || !password.trim()}
                  sx={{ borderRadius: 999, py: 1.2, fontWeight: 800 }}
                >
                  {loading ? 'Logowanie…' : 'Zaloguj'}
                </Button>

                <Button
                  type="button"
                  variant="text"
                  onClick={() => (window.location.hash = '#/register')}
                  sx={{ borderRadius: 999, fontWeight: 700 }}
                >
                  Nie masz konta? Zarejestruj się
                </Button>
              </Stack>
            </form>

            <Divider />
            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
              API: {config.apiUrl}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
