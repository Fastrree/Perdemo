import { useState, useRef, useEffect, useCallback } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../App'
import { useAuth } from '../contexts/AuthContext'
import useIsMobile from '../hooks/useIsMobile'
import LanguageSwitcher from './LanguageSwitcher'

const navItemDefs = [
    { path: '/dashboard', labelKey: 'nav.dashboard', icon: '📊', sectionKey: 'nav.sections.main' },
    { path: '/products', labelKey: 'nav.products', icon: '🪟', sectionKey: 'nav.sections.main' },
    { path: '/orders', labelKey: 'nav.orders', icon: '📦', sectionKey: 'nav.sections.main' },
    { path: '/customers', labelKey: 'nav.customers', icon: '👥', sectionKey: 'nav.sections.main' },
    { path: '/demo', labelKey: 'nav.demo', icon: '🎯', sectionKey: 'nav.sections.tools' },
    { path: '/quote', labelKey: 'nav.quote', icon: '📝', sectionKey: 'nav.sections.tools' },
    { path: '/measure', labelKey: 'nav.measure', icon: '📐', sectionKey: 'nav.sections.tools' },
    { path: '/moodboard', labelKey: 'nav.moodboard', icon: '🎨', sectionKey: 'nav.sections.tools' },
    { path: '/inventory-oracle', labelKey: 'nav.inventory', icon: '🔮', sectionKey: 'nav.sections.tools' },
    { path: '/analytics', labelKey: 'nav.analytics', icon: '📈', sectionKey: 'nav.sections.management' },
    { path: '/white-label', labelKey: 'nav.whitelabel', icon: '🏢', sectionKey: 'nav.sections.management' },
]

const mockNotificationDefs = [
    { id: 1, textKey: 'notifications.mock.1', timeKey: 'notifications.times.1', read: false, link: '/orders' },
    { id: 2, textKey: 'notifications.mock.2', timeKey: 'notifications.times.2', read: false, link: '/products' },
    { id: 3, textKey: 'notifications.mock.3', timeKey: 'notifications.times.3', read: true, link: '/orders' },
    { id: 4, textKey: 'notifications.mock.4', timeKey: 'notifications.times.4', read: true, link: '/customers' },
    { id: 5, textKey: 'notifications.mock.5', timeKey: 'notifications.times.5', read: true, link: '/analytics' },
]

export default function AppLayout() {
    const { t } = useTranslation('common')
    const { theme, toggleTheme } = useTheme()
    const { profile, signOut } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [notifOpen, setNotifOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [notifications, setNotifications] = useState(mockNotificationDefs)
    const [globalSearch, setGlobalSearch] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const isMobile = useIsMobile()
    const notifRef = useRef(null)
    const profileRef = useRef(null)
    const searchRef = useRef(null)

    // Build nav items with translated labels
    const navItems = navItemDefs.map(item => ({
        ...item,
        label: t(item.labelKey),
        section: t(item.sectionKey),
    }))

    const unreadCount = notifications.filter(n => !n.read).length

    // Close dropdowns on outside click
    useEffect(() => {
        const handle = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
            if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults([])
        }
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [])

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false) // eslint-disable-line react-hooks/set-state-in-effect
    }, [location.pathname])

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }, [])

    const handleNotifClick = useCallback((notif) => {
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
        setNotifOpen(false)
        navigate(notif.link)
    }, [navigate])

    // Global search across nav items
    const handleSearch = useCallback((query) => {
        setGlobalSearch(query)
        if (!query.trim()) return setSearchResults([])
        const q = query.toLowerCase()
        const results = navItems.filter(item =>
            item.label.toLowerCase().includes(q) || item.path.includes(q)
        ).map(item => ({ ...item, type: 'page' }))
        setSearchResults(results)
    }, [])

    const handleSearchSelect = useCallback((result) => {
        navigate(result.path)
        setGlobalSearch('')
        setSearchResults([])
    }, [navigate])

    const sections = navItems.reduce((acc, item) => {
        if (!acc[item.section]) acc[item.section] = []
        acc[item.section].push(item)
        return acc
    }, {})

    return (
        <div className="app-layout">
            {/* Sidebar Backdrop (mobile) — only rendered when open */}
            {sidebarOpen && (
                <div
                    className="sidebar-backdrop visible"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} role="navigation" aria-label={t('aria.mainNav')}>
                <div className="sidebar-header" onClick={() => setSidebarOpen(false)} style={{ cursor: 'pointer' }}>
                    <div className="sidebar-logo" aria-hidden="true">P</div>
                    <div className="sidebar-brand">
                        <h1>Perdemo</h1>
                        <span>ERP Platform</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {Object.entries(sections).map(([section, items]) => (
                        <div key={section}>
                            <div className="nav-section-title">{section}</div>
                            {items.map(item => (
                                <NavLink key={item.path} to={item.path}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                    <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="avatar avatar-sm">{profile?.full_name?.[0] || 'K'}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{profile?.full_name || 'Kullanıcı'}</div>
                            <div className="sidebar-user-role">{t('profile.role')}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <div className="main-area">
                {/* Header */}
                <header className="header">
                    <div className="header-left">
                        <button
                            className="sidebar-toggle"
                            onClick={() => setSidebarOpen(o => !o)}
                            aria-label={t('aria.toggleMenu')}
                        >
                            <span /><span /><span />
                        </button>
                        <div className="search-bar" ref={searchRef} style={{ position: 'relative' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input type="search" className="input input-with-icon"
                                placeholder={t('search.placeholder')}
                                aria-label={t('aria.search')} value={globalSearch}
                                onChange={e => handleSearch(e.target.value)}
                                onFocus={() => globalSearch && handleSearch(globalSearch)} />

                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                                    background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-primary)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                    zIndex: 100, overflow: 'hidden',
                                }}>
                                    {searchResults.map(r => (
                                        <button key={r.path} onClick={() => handleSearchSelect(r)} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                                            padding: '10px 14px', border: 'none', background: 'transparent',
                                            color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem',
                                            textAlign: 'left', fontFamily: 'var(--font-primary)',
                                            borderBottom: '1px solid var(--border-primary)',
                                            transition: 'background 0.15s',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <span>{r.icon}</span>
                                            <span style={{ fontWeight: 500 }}>{r.label}</span>
                                            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('search.goToPage')}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="header-right">
                        {/* Notification Bell */}
                        <div ref={notifRef} style={{ position: 'relative' }}>
                            <button className="header-icon-btn" aria-label={t('aria.notifications')} data-tooltip={t('notifications.title')}
                                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}>
                                🔔
                                {unreadCount > 0 && <span className="notification-dot" aria-label={t('aria.newNotification')}></span>}
                            </button>

                            {notifOpen && (
                                <div className="dropdown-panel notif-dropdown">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border-primary)' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('notifications.title')}</span>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllRead} style={{
                                                background: 'none', border: 'none', color: 'var(--accent-blue)',
                                                fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-primary)',
                                            }}>{t('notifications.markAllRead')}</button>
                                        )}
                                    </div>
                                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                        {notifications.map(n => (
                                            <button key={n.id} onClick={() => handleNotifClick(n)} style={{
                                                display: 'flex', gap: '10px', padding: '12px 16px', width: '100%',
                                                border: 'none', background: n.read ? 'transparent' : 'rgba(88,166,255,0.05)',
                                                cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-primary)',
                                                borderBottom: '1px solid var(--border-primary)',
                                                transition: 'background 0.15s', color: 'var(--text-primary)',
                                            }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(88,166,255,0.05)'}>
                                                {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)', marginTop: '6px', flexShrink: 0 }} />}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>{t(n.textKey)}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{t(n.timeKey)}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Theme Toggle */}
                        <button className="theme-toggle" onClick={toggleTheme}
                            aria-label={t('aria.toggleTheme', { mode: theme === 'dark' ? t('profile.lightTheme') : t('profile.darkTheme') })}
                            data-tooltip={theme === 'dark' ? t('profile.lightTheme') : t('profile.darkTheme')}>
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>

                        {/* Language Switcher */}
                        <LanguageSwitcher />

                        {/* Profile Avatar */}
                        <div ref={profileRef} style={{ position: 'relative' }}>
                            <div className="avatar avatar-sm" style={{ cursor: 'pointer' }} data-tooltip={t('aria.profile')}
                                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}>{profile?.full_name?.[0] || 'K'}</div>

                            {profileOpen && (
                                <div className="dropdown-panel profile-dropdown">
                                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-primary)' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{profile?.full_name || 'Kullanıcı'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{t('profile.role')}</div>
                                    </div>
                                    {[
                                        { icon: '⚙️', label: t('profile.settings'), action: () => alert(t('profile.settingsAlert')) },
                                        { icon: '🔔', label: t('profile.notifPrefs'), action: () => alert(t('profile.notifPrefsAlert')) },
                                        { icon: '🌗', label: theme === 'dark' ? t('profile.lightTheme') : t('profile.darkTheme'), action: () => { toggleTheme(); setProfileOpen(false) } },
                                        { icon: '🌐', label: t('profile.visitWebsite'), action: () => { navigate('/'); setProfileOpen(false) } },
                                        { icon: '🚪', label: t('profile.logout'), action: async () => { await signOut(); navigate('/login'); setProfileOpen(false) } },
                                    ].map((item) => (
                                        <button key={item.label} onClick={item.action} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                                            padding: '10px 16px', border: 'none', background: 'transparent',
                                            color: item.label === t('profile.logout') ? '#e74c3c' : 'var(--text-primary)',
                                            cursor: 'pointer', fontSize: '0.82rem', textAlign: 'left',
                                            fontFamily: 'var(--font-primary)', transition: 'background 0.15s',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <span>{item.icon}</span>
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="main-content">
                    <Outlet />
                </main>

                {/* Mobile Footer Banner — always visible */}
                {isMobile && (
                    <div className="mobile-footer-banner">
                        <div className="mobile-footer-banner-content">
                            <span className="mobile-footer-banner-icon">🖥️</span>
                            <p>
                                {t('mobile.desktopBanner')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
