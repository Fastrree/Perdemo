import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../App'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function ForgotPassword() {
    const { t } = useTranslation('auth')
    const { resetPassword } = useAuth()
    const { theme, toggleTheme } = useTheme()

    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!email.trim()) return setError(t('forgotPassword.errors.emailRequired'))
        if (!/\S+@\S+\.\S+/.test(email)) return setError(t('forgotPassword.errors.emailInvalid'))

        setLoading(true)
        try {
            await resetPassword(email)
            setSuccess(true)
        } catch (err) {
            setError(t('forgotPassword.errors.generic'))
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-bg">
                    <div className="auth-orb auth-orb--1" />
                    <div className="auth-orb auth-orb--2" />
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
                        <div className="auth-success-icon">✅</div>
                        <h1>{t('forgotPassword.title')}</h1>
                        <p>{t('forgotPassword.success')}</p>
                    </div>
                    <Link to="/login" className="auth-submit" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                        {t('forgotPassword.backToLogin')} <span>→</span>
                    </Link>
                </div>
            </div>
        )
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
                    <h1>{t('forgotPassword.title')}</h1>
                    <p>{t('forgotPassword.subtitle')}</p>
                </div>

                {error && (
                    <div className="auth-alert auth-alert--error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label htmlFor="email">{t('forgotPassword.email')}</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('forgotPassword.emailPlaceholder')}
                            autoComplete="email"
                            autoFocus
                        />
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? (
                            <><span className="auth-spinner" /> {t('forgotPassword.loading')}</>
                        ) : (
                            <>{t('forgotPassword.submit')} <span>→</span></>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <Link to="/login">{t('forgotPassword.backToLogin')}</Link>
                </div>
            </div>
        </div>
    )
}
