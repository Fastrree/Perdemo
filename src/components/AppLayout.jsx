import { useState, useRef, useEffect, useCallback } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../App'

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', section: 'Ana Menü' },
    { path: '/products', label: 'Ürünler', icon: '🪟', section: 'Ana Menü' },
    { path: '/orders', label: 'Siparişler', icon: '📦', section: 'Ana Menü' },
    { path: '/customers', label: 'Müşteriler', icon: '👥', section: 'Ana Menü' },
    { path: '/demo', label: '360° Demo', icon: '🎯', section: 'Araçlar' },
    { path: '/quote', label: 'Smart Quote', icon: '📝', section: 'Araçlar' },
    { path: '/measure', label: 'AI Ölçü', icon: '📐', section: 'Araçlar' },
    { path: '/moodboard', label: 'Moodboard', icon: '🎨', section: 'Araçlar' },
    { path: '/inventory-oracle', label: 'Stok Oracle', icon: '🔮', section: 'Araçlar' },
    { path: '/analytics', label: 'Analitik', icon: '📈', section: 'Yönetim' },
    { path: '/white-label', label: 'Bayi Ağı', icon: '🏢', section: 'Yönetim' },
]

const mockNotifications = [
    { id: 1, text: 'Yeni sipariş: PD-2026-011 — Elif Kaya', time: '2 dk önce', read: false, link: '/orders' },
    { id: 2, text: 'Stok uyarısı: Fon Perde Lacivert (8 adet)', time: '15 dk önce', read: false, link: '/products' },
    { id: 3, text: 'Sipariş PD-2026-003 teslim edildi', time: '1 saat önce', read: true, link: '/orders' },
    { id: 4, text: 'Yeni müşteri kaydı: Selin Yılmaz', time: '3 saat önce', read: true, link: '/customers' },
    { id: 5, text: 'Aylık rapor hazır', time: '5 saat önce', read: true, link: '/analytics' },
]

export default function AppLayout() {
    const { theme, toggleTheme } = useTheme()
    const location = useLocation()
    const navigate = useNavigate()
    const [notifOpen, setNotifOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [notifications, setNotifications] = useState(mockNotifications)
    const [globalSearch, setGlobalSearch] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const notifRef = useRef(null)
    const profileRef = useRef(null)
    const searchRef = useRef(null)

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
            {/* Sidebar */}
            <aside className="sidebar" role="navigation" aria-label="Ana navigasyon">
                <div className="sidebar-header">
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
                        <div className="avatar avatar-sm">AY</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">Ahmet Yılmaz</div>
                            <div className="sidebar-user-role">Mağaza Sahibi</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <div className="main-area">
                {/* Header */}
                <header className="header">
                    <div className="header-left">
                        <div className="search-bar" ref={searchRef} style={{ position: 'relative' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input type="search" className="input input-with-icon"
                                placeholder="Ürün, sipariş veya müşteri ara..."
                                aria-label="Genel arama" value={globalSearch}
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
                                            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Sayfaya git</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="header-right">
                        {/* Notification Bell */}
                        <div ref={notifRef} style={{ position: 'relative' }}>
                            <button className="header-icon-btn" aria-label="Bildirimler" data-tooltip="Bildirimler"
                                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}>
                                🔔
                                {unreadCount > 0 && <span className="notification-dot" aria-label="Yeni bildirim var"></span>}
                            </button>

                            {notifOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '360px',
                                    background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border-primary)', boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                                    zIndex: 200, overflow: 'hidden',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border-primary)' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Bildirimler</span>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllRead} style={{
                                                background: 'none', border: 'none', color: 'var(--accent-blue)',
                                                fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-primary)',
                                            }}>Tümünü okundu işaretle</button>
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
                                                    <div style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>{n.text}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{n.time}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Theme Toggle */}
                        <button className="theme-toggle" onClick={toggleTheme}
                            aria-label={`Temayı ${theme === 'dark' ? 'açık' : 'koyu'} moda geçir`}
                            data-tooltip={theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}>
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>

                        {/* Profile Avatar */}
                        <div ref={profileRef} style={{ position: 'relative' }}>
                            <div className="avatar avatar-sm" style={{ cursor: 'pointer' }} data-tooltip="Profil"
                                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}>AY</div>

                            {profileOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '220px',
                                    background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border-primary)', boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                                    zIndex: 200, overflow: 'hidden',
                                }}>
                                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-primary)' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Ahmet Yılmaz</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Mağaza Sahibi</div>
                                    </div>
                                    {[
                                        { icon: '⚙️', label: 'Ayarlar', action: () => alert('Ayarlar henüz aktif değil — backend gerekli') },
                                        { icon: '🔔', label: 'Bildirim Tercihleri', action: () => alert('Bildirim ayarları — backend gerekli') },
                                        { icon: '🌗', label: theme === 'dark' ? 'Açık Tema' : 'Koyu Tema', action: () => { toggleTheme(); setProfileOpen(false) } },
                                        { icon: '🚪', label: 'Çıkış', action: () => { navigate('/'); setProfileOpen(false) } },
                                    ].map((item) => (
                                        <button key={item.label} onClick={item.action} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                                            padding: '10px 16px', border: 'none', background: 'transparent',
                                            color: item.label === 'Çıkış' ? '#e74c3c' : 'var(--text-primary)',
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
            </div>
        </div>
    )
}
