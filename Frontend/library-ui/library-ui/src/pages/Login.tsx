import React, { useState } from 'react'
import { apiFetch } from '../lib/api'
import { auth } from '../lib/auth'
import { config } from '../lib/config'
import styles from '../styles/login.module.css'

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

      // Common token field names (adjust if your backend returns something else)
      const token =
          res?.token ||
          res?.accessToken ||
          res?.jwt ||
          res?.data?.token ||
          res?.data?.accessToken

      if (!token) {
        throw new Error(
            'Login succeeded but no token was found in the response. Check the login response JSON and map the token field.',
        )
      }

      auth.setToken(token)
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
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <div className={styles.logo} aria-hidden>
              📚
            </div>
            <div>
              <div className={styles.title}>Library</div>
              <div className={styles.subtitle}>Sign in to manage the catalog</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label className="field">
              <span className="label">Email</span>
              <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  autoComplete="email"
              />
            </label>

            <label className="field">
              <span className="label">Password</span>
              <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
              />
            </label>

            {error ? <div className={styles.error}>{error}</div> : null}

            <button
                className="button"
                disabled={loading || !email.trim() || !password.trim()}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <button
                type="button"
                className={styles.link}
                onClick={() => (window.location.hash = '#register')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              Nie masz konta? Zarejestruj się
            </button>

            <div className={styles.help}>
              <div>
                API: <code>{config.apiUrl}</code>
              </div>
              <div>
                Login endpoint: <code>{config.authLoginPath}</code>
              </div>
            </div>
          </form>
        </div>
      </div>
  )
}
