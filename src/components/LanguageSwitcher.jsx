import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const languages = [
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
]

export default function LanguageSwitcher() {
    const { i18n } = useTranslation()
    const [open, setOpen] = useState(false)
    const timeoutRef = useRef(null)
    const containerRef = useRef(null)

    const currentLang = languages.find(l => l.code === i18n.language?.substring(0, 2)) || languages[0]

    const handleMouseEnter = () => {
        clearTimeout(timeoutRef.current)
        setOpen(true)
    }

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setOpen(false), 200)
    }

    const switchLanguage = (code) => {
        i18n.changeLanguage(code)
        setOpen(false)
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => clearTimeout(timeoutRef.current)
    }, [])

    return (
        <div
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ position: 'relative' }}
        >
            {/* Current Language Button */}
            <button
                className="lang-switcher-btn"
                aria-label="Change language"
                aria-expanded={open}
                onClick={() => setOpen(o => !o)}
            >
                <span className="lang-flag">{currentLang.flag}</span>
                <span className="lang-code">{currentLang.code.toUpperCase()}</span>
                <svg
                    className={`lang-chevron ${open ? 'open' : ''}`}
                    width="10" height="10" viewBox="0 0 10 10"
                    fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"
                >
                    <path d="M2.5 3.5L5 6L7.5 3.5" />
                </svg>
            </button>

            {/* Dropdown */}
            <div className={`lang-dropdown ${open ? 'open' : ''}`}>
                {languages
                    .filter(l => l.code !== currentLang.code)
                    .map(lang => (
                        <button
                            key={lang.code}
                            className="lang-dropdown-item"
                            onClick={() => switchLanguage(lang.code)}
                        >
                            <span className="lang-flag">{lang.flag}</span>
                            <span className="lang-dropdown-label">{lang.label}</span>
                        </button>
                    ))}
            </div>
        </div>
    )
}
