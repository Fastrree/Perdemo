import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useIsMobile from '../hooks/useIsMobile'

/**
 * Gate component — renders children on desktop immediately.
 * On mobile, shows a dramatic performance warning with an opt-in confirmation.
 * Once confirmed for a given session, the feature loads normally.
 */
export default function DesktopOnly({ children }) {
    const isMobile = useIsMobile()
    const navigate = useNavigate()
    const [unlocked, setUnlocked] = useState(false)

    if (!isMobile || unlocked) return children

    return (
        <div className="desktop-only-gate">
            <div className="desktop-only-card">
                {/* Warning pulse ring */}
                <div className="gate-warning-ring">
                    <span className="gate-warning-icon">⚠️</span>
                </div>

                <h2>Performans Uyarısı</h2>

                <p className="gate-desc">
                    Bu özellik <strong>yüksek GPU ve işlemci gücü</strong> gerektirir.
                    Mobil cihazınızda <strong>yavaşlama, donma veya pil tüketimi</strong>{' '}
                    yaşanabilir.
                </p>

                <div className="gate-risk-list">
                    <div className="gate-risk-item">
                        <span className="gate-risk-icon">🔥</span>
                        <span>Cihaz ısınabilir</span>
                    </div>
                    <div className="gate-risk-item">
                        <span className="gate-risk-icon">🐌</span>
                        <span>Uygulama yavaşlayabilir</span>
                    </div>
                    <div className="gate-risk-item">
                        <span className="gate-risk-icon">🔋</span>
                        <span>Pil hızla tükenebilir</span>
                    </div>
                </div>

                <p className="gate-disclaimer">
                    En iyi deneyim için masaüstü cihaz önerilir.
                </p>

                <div className="gate-actions">
                    <button
                        className="btn gate-btn-unlock"
                        onClick={() => setUnlocked(true)}
                    >
                        ⚡ Riski Kabul Et ve Aç
                    </button>
                    <button
                        className="btn btn-secondary gate-btn-back"
                        onClick={() => navigate('/dashboard')}
                    >
                        📊 Dashboard'a Dön
                    </button>
                </div>
            </div>
        </div>
    )
}
