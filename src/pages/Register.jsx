import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../App'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Register() {
    const { t } = useTranslation('auth')
    const { signUp } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()

    const [form, setForm] = useState({
        fullName: '',
        companyName: '',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const update = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

    const validate = () => {
        if (!form.fullName.trim()) return t('register.errors.fullNameRequired')
        if (!form.companyName.trim()) return t('register.errors.companyRequired')
        if (!form.email.trim()) return t('register.errors.emailRequired')
        if (!/\S+@\S+\.\S+/.test(form.email)) return t('register.errors.emailInvalid')
        if (form.password.length < 6) return t('register.errors.passwordMin')
        if (form.password !== form.confirmPassword) return t('register.errors.passwordMismatch')
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        const validationError = validate()
        if (validationError) return setError(validationError)

        setLoading(true)
        try {
            await signUp(form.email, form.password, {
                fullName: form.fullName,
                companyName: form.companyName,
            })
            setSuccess(true)
        } catch (err) {
            console.error('🔴 Signup error:', err)
            if (err.message?.includes('already registered')) {
                setError(t('register.errors.emailExists'))
            } else {
                setError(err.message || t('register.errors.generic'))
            }
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
                <div className="auth-card">
                    <div className="auth-card__header">
                        <div className="auth-success-icon">✅</div>
                        <h1>{t('register.title')}</h1>
                        <p>{t('register.success')}</p>
                    </div>
                    <Link to="/login" className="auth-submit" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                        {t('register.login')} <span>→</span>
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
                    <h1>{t('register.title')}</h1>
                    <p>{t('register.subtitle')}</p>
                </div>

                {error && (
                    <div className="auth-alert auth-alert--error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-row">
                        <div className="auth-field">
                            <label htmlFor="fullName">{t('register.fullName')}</label>
                            <input
                                id="fullName"
                                type="text"
                                value={form.fullName}
                                onChange={update('fullName')}
                                placeholder={t('register.fullNamePlaceholder')}
                                autoFocus
                            />
                        </div>
                        <div className="auth-field">
                            <label htmlFor="companyName">{t('register.companyName')}</label>
                            <input
                                id="companyName"
                                type="text"
                                value={form.companyName}
                                onChange={update('companyName')}
                                placeholder={t('register.companyNamePlaceholder')}
                            />
                        </div>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="email">{t('register.email')}</label>
                        <input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={update('email')}
                            placeholder={t('register.emailPlaceholder')}
                            autoComplete="email"
                        />
                    </div>

                    <div className="auth-row">
                        <div className="auth-field">
                            <label htmlFor="password">{t('register.password')}</label>
                            <input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={update('password')}
                                placeholder={t('register.passwordPlaceholder')}
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="auth-field">
                            <label htmlFor="confirmPassword">{t('register.confirmPassword')}</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={form.confirmPassword}
                                onChange={update('confirmPassword')}
                                placeholder={t('register.confirmPasswordPlaceholder')}
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? (
                            <><span className="auth-spinner" /> {t('register.loading')}</>
                        ) : (
                            <>{t('register.submit')} <span>→</span></>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <span>{t('register.hasAccount')}</span>
                    <Link to="/login">{t('register.login')}</Link>
                </div>
            </div>
        </div>
    )
}
