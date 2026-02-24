import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../App'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Login() {
    const { t } = useTranslation('auth')
    const { signIn } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!email.trim()) return setError(t('login.errors.emailRequired'))
        if (!password) return setError(t('login.errors.passwordRequired'))

        setLoading(true)
        try {
            await signIn(email, password)
            navigate('/dashboard')
        } catch (err) {
            if (err.message?.includes('Invalid login')) {
                setError(t('login.errors.invalidCredentials'))
            } else {
                setError(t('login.errors.generic'))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-orb auth-orb--1" />
                <div className="auth-orb auth-orb--2" />
                <div className="auth-orb auth-orb--3" />
            </div>

            <div className="auth-topbar">
                <Link to="/" className="auth-brand">
                    <div className="lp-nav__logo">P</div>
                    <span>Perdemo</span>
                </Link>
                <div className="auth-topbar__actions">
                    <LanguageSwitcher />
                    <button className="auth-theme-btn" onClick={toggleTheme}
                        data-tooltip={t('landing:nav.toggleTheme')}
                        aria-label={t('landing:nav.toggleTheme')}>
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
            </div>

            <div className="auth-card">
                <div className="auth-card__header">
                    <h1>{t('login.title')}</h1>
                    <p>{t('login.subtitle')}</p>
                </div>

                {error && (
                    <div className="auth-alert auth-alert--error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label htmlFor="email">{t('login.email')}</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('login.emailPlaceholder')}
                            autoComplete="email"
                            autoFocus
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password">
                            {t('login.password')}
                            <Link to="/forgot-password" className="auth-field__forgot">{t('login.forgotPassword')}</Link>
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('login.passwordPlaceholder')}
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? (
                            <><span className="auth-spinner" /> {t('login.loading')}</>
                        ) : (
                            <>{t('login.submit')} <span>→</span></>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <span>{t('login.noAccount')}</span>
                    <Link to="/register">{t('login.register')}</Link>
                </div>
            </div>
        </div>
    )
}
