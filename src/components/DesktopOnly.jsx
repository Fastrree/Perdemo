import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useIsMobile from '../hooks/useIsMobile'

/**
 * Gate component — renders children on desktop immediately.
 * On mobile, shows a dramatic performance warning with an opt-in confirmation.
 * Once confirmed for a given session, the feature loads normally.
 */
export default function DesktopOnly({ children }) {
    const isMobile = useIsMobile()
    const navigate = useNavigate()
    const { t } = useTranslation('common')
    const [unlocked, setUnlocked] = useState(false)

    if (!isMobile || unlocked) return children

    return (
        <div className="desktop-only-gate">
            <div className="desktop-only-card">
                {/* Warning pulse ring */}
                <div className="gate-warning-ring">
                    <span className="gate-warning-icon">⚠️</span>
                </div>

                <h2>{t('desktopOnly.title')}</h2>

                <p className="gate-desc">
                    {t('desktopOnly.description')}
                </p>

                <div className="gate-risk-list">
                    <div className="gate-risk-item">
                        <span className="gate-risk-icon">🔥</span>
                        <span>{t('desktopOnly.riskHeat')}</span>
                    </div>
                    <div className="gate-risk-item">
                        <span className="gate-risk-icon">🐌</span>
                        <span>{t('desktopOnly.riskSlow')}</span>
                    </div>
                    <div className="gate-risk-item">
                        <span className="gate-risk-icon">🔋</span>
                        <span>{t('desktopOnly.riskBattery')}</span>
                    </div>
                </div>

                <p className="gate-disclaimer">
                    {t('desktopOnly.disclaimer')}
                </p>

                <div className="gate-actions">
                    <button
                        className="btn gate-btn-unlock"
                        onClick={() => setUnlocked(true)}
                    >
                        ⚡ {t('desktopOnly.acceptRisk')}
                    </button>
                    <button
                        className="btn btn-secondary gate-btn-back"
                        onClick={() => navigate('/dashboard')}
                    >
                        📊 {t('desktopOnly.backToDashboard')}
                    </button>
                </div>
            </div>
        </div>
    )
}
