import React, { useState } from 'react'
import { apiFetch } from '../lib/api'
import { config } from '../lib/config'
import styles from '../styles/login.module.css'

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
            const details = e?.details
            const msg =
                (details && (details.firstName || details.lastName || details.email || details.password)) ||
                e?.message ||
                'Rejestracja nie powiodła się'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.card}>
                <div className={styles.brand}>
                    <div className={styles.logo} aria-hidden>📚</div>
                    <div>
                        <div className={styles.title}>Library</div>
                        <div className={styles.subtitle}>Utwórz konto</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <label className="field">
                        <span className="label">Imię</span>
                        <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </label>

                    <label className="field">
                        <span className="label">Nazwisko</span>
                        <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </label>

                    <label className="field">
                        <span className="label">Email</span>
                        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                    </label>

                    <label className="field">
                        <span className="label">Hasło</span>
                        <input
                            className="input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                        />
                    </label>

                    {error ? <div className={styles.error}>{error}</div> : null}
                    {done ? <div className={styles.success}>Konto utworzone. Możesz się zalogować.</div> : null}

                    <button
                        className="button"
                        disabled={
                            loading ||
                            !firstName.trim() ||
                            !lastName.trim() ||
                            !email.trim() ||
                            !password.trim()
                        }
                    >
                        {loading ? 'Tworzenie…' : 'Zarejestruj'}
                    </button>

                    <div className={styles.help}>
                        <button
                            type="button"
                            className={styles.link}
                            onClick={() => props.onGoToLogin?.()}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        >
                            Masz już konto? Zaloguj się
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
