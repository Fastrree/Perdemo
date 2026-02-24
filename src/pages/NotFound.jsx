import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
    const { t } = useTranslation('common')
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: '20px',
        }}>
            <div style={{
                textAlign: 'center',
                maxWidth: '500px',
            }}>
                <div style={{
                    fontSize: '8rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1,
                    marginBottom: '16px',
                }}>
                    404
                </div>

                <h1 style={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                }}>
                    {t('notFound.title')}
                </h1>

                <p style={{
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '32px',
                    lineHeight: 1.6,
                }}>
                    {t('notFound.description')}
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/" className="btn btn-primary" style={{ padding: '12px 28px' }}>
                        🏠 {t('notFound.home')}
                    </Link>
                    <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '12px 28px' }}>
                        📊 Dashboard
                    </Link>
                </div>

                <div style={{
                    marginTop: '48px',
                    padding: '20px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-primary)',
                }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                        {t('notFound.quickAccess')}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/products" style={{ color: 'var(--accent-blue)', fontSize: '0.9rem' }}>{t('nav.products')}</Link>
                        <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                        <Link to="/orders" style={{ color: 'var(--accent-blue)', fontSize: '0.9rem' }}>{t('nav.orders')}</Link>
                        <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                        <Link to="/customers" style={{ color: 'var(--accent-blue)', fontSize: '0.9rem' }}>{t('nav.customers')}</Link>
                        <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                        <Link to="/demo" style={{ color: 'var(--accent-blue)', fontSize: '0.9rem' }}>3D Demo</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
