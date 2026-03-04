import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../App'
import { useAuth } from '../contexts/AuthContext'
import { usePreferences } from '../hooks/usePreferences'
import { notifyCurrencyChange } from '../hooks/useCurrency'

const STORAGE_KEY = 'perdemo-settings'
const NOTIF_STORAGE_KEY = 'perdemo-notif-prefs'

const defaultNotifPrefs = {
    emailEnabled: true,
    ordersNew: true,
    ordersStatus: true,
    stockLow: true,
    stockOut: true,
    customersNew: true,
    reportsMonthly: true,
}

function loadPrefs(key, defaults) {
    try {
        const stored = localStorage.getItem(key)
        return stored ? { ...defaults, ...JSON.parse(stored) } : defaults
    } catch { return defaults }
}

function savePrefs(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* noop */ }
}

/* ── Toggle Switch ─────────────────────────────── */
function ToggleSwitch({ checked, onChange, id }) {
    return (
        <button
            id={id}
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            style={{
                width: '44px', height: '24px', borderRadius: '12px', padding: '2px',
                border: 'none', cursor: 'pointer', transition: 'background 0.25s',
                background: checked
                    ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))'
                    : 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center',
                justifyContent: checked ? 'flex-end' : 'flex-start',
                flexShrink: 0,
            }}
        >
            <span style={{
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#fff', display: 'block',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transition: 'transform 0.25s',
            }} />
        </button>
    )
}

/* ── Notification Row ──────────────────────────── */
function NotifRow({ label, description, checked, onChange, id }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0', borderBottom: '1px solid var(--border-secondary)',
            gap: '16px',
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{description}</div>
            </div>
            <ToggleSwitch checked={checked} onChange={onChange} id={id} />
        </div>
    )
}

/* ── Card Wrapper ──────────────────────────────── */
function SettingsCard({ title, icon, children }) {
    return (
        <div style={{
            background: 'var(--gradient-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            backdropFilter: 'blur(12px)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Glass overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
                pointerEvents: 'none',
            }} />
            {title && (
                <h3 style={{
                    fontSize: '1rem', fontWeight: 700, marginBottom: '16px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    position: 'relative',
                }}>
                    {icon && <span>{icon}</span>}
                    {title}
                </h3>
            )}
            <div style={{ position: 'relative' }}>{children}</div>
        </div>
    )
}

/* ── Info Row ──────────────────────────────────── */
function InfoRow({ label, value }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: '1px solid var(--border-secondary)',
        }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{label}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value || '—'}</span>
        </div>
    )
}

/* ── Select Dropdown ───────────────────────────── */
function SelectField({ label, value, onChange, options, id }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: '1px solid var(--border-secondary)',
        }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{label}</span>
            <select
                id={id}
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '140px',
                }}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    )
}

/* ═══════════════════════════════════════════════ */
/* ── Main Settings Component ───────────────── */
/* ═══════════════════════════════════════════════ */
export default function Settings() {
    const { t, i18n } = useTranslation('settings')
    const { theme, toggleTheme } = useTheme()
    const { user, profile } = useAuth()
    const { prefs, setCurrency: saveCurrencyDB, setLanguage: saveLangDB, setNotificationPrefs: saveNotifDB } = usePreferences()
    const [searchParams, setSearchParams] = useSearchParams()

    const activeTab = searchParams.get('tab') === 'notifications' ? 'notifications' : 'general'
    const setActiveTab = useCallback((tab) => {
        setSearchParams(tab === 'general' ? {} : { tab })
    }, [setSearchParams])

    // General preferences — init from DB prefs, fallback to localStorage
    const [currency, setCurrency] = useState(() => {
        return prefs?.currency || loadPrefs(STORAGE_KEY, { currency: 'TRY' }).currency
    })
    const [saveToast, setSaveToast] = useState('')

    // Notification preferences — init from DB prefs, fallback to localStorage
    const [notifPrefs, setNotifPrefs] = useState(() => {
        return prefs?.notification_prefs || loadPrefs(NOTIF_STORAGE_KEY, defaultNotifPrefs)
    })

    // Sync from DB when prefs load
    useEffect(() => {
        if (prefs?.currency && prefs.currency !== currency) {
            setCurrency(prefs.currency)
        }
        if (prefs?.notification_prefs) {
            setNotifPrefs(prefs.notification_prefs)
        }
    }, [prefs]) // eslint-disable-line react-hooks/exhaustive-deps

    // Save general prefs to localStorage + DB
    useEffect(() => {
        savePrefs(STORAGE_KEY, { currency })
        saveCurrencyDB(currency)
        notifyCurrencyChange()
    }, [currency]) // eslint-disable-line react-hooks/exhaustive-deps

    // Save notif prefs to localStorage + DB
    useEffect(() => {
        savePrefs(NOTIF_STORAGE_KEY, notifPrefs)
        saveNotifDB(notifPrefs)
    }, [notifPrefs]) // eslint-disable-line react-hooks/exhaustive-deps

    const updateNotif = useCallback((key, value) => {
        setNotifPrefs(prev => ({ ...prev, [key]: value }))
    }, [])

    const handleLanguageChange = useCallback((lng) => {
        i18n.changeLanguage(lng)
        localStorage.setItem('perdemo-lang', lng)
        saveLangDB(lng)
    }, [i18n, saveLangDB])

    const handleThemeChange = useCallback((val) => {
        if ((val === 'dark' && theme !== 'dark') || (val === 'light' && theme !== 'light')) {
            toggleTheme()
        }
    }, [theme, toggleTheme])

    const showToast = useCallback((msg) => {
        setSaveToast(msg)
        setTimeout(() => setSaveToast(''), 2500)
    }, [])

    const tabs = useMemo(() => [
        { key: 'general', label: t('tabs.general'), icon: '⚙️' },
        { key: 'notifications', label: t('tabs.notifications'), icon: '🔔' },
    ], [t])

    return (
        <div style={{ padding: '32px', maxWidth: '780px', margin: '0 auto' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{
                    fontSize: '1.75rem', fontWeight: 800,
                    background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: '4px',
                }}>
                    {t('title')}
                </h1>
            </div>

            {/* Tab Bar */}
            <div style={{
                display: 'flex', gap: '4px', marginBottom: '24px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-md)',
                padding: '4px',
                border: '1px solid var(--border-secondary)',
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1, padding: '10px 16px',
                            border: 'none', borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                            fontFamily: 'var(--font-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'all 0.2s ease',
                            background: activeTab === tab.key
                                ? 'linear-gradient(135deg, rgba(88,166,255,0.15), rgba(139,92,246,0.15))'
                                : 'transparent',
                            color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            boxShadow: activeTab === tab.key ? '0 2px 8px rgba(88,166,255,0.1)' : 'none',
                        }}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── General Tab ─────────────────────────── */}
            {activeTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Profile Info */}
                    <SettingsCard title={t('general.profileSection')} icon="👤">
                        <InfoRow label={t('general.fullName')} value={profile?.full_name} />
                        <InfoRow label={t('general.email')} value={user?.email} />
                        <InfoRow label={t('general.role')} value={t(`general.roles.${profile?.role || 'admin'}`)} />
                    </SettingsCard>

                    {/* Company Info */}
                    <SettingsCard title={t('general.companySection')} icon="🏢">
                        <InfoRow label={t('general.companyName')} value={profile?.company_name || 'Perdemo'} />
                    </SettingsCard>

                    {/* Preferences */}
                    <SettingsCard title={t('general.preferencesSection')} icon="🎨">
                        <SelectField
                            id="settings-theme"
                            label={t('general.theme')}
                            value={theme}
                            onChange={handleThemeChange}
                            options={[
                                { value: 'dark', label: t('general.themeOptions.dark') },
                                { value: 'light', label: t('general.themeOptions.light') },
                            ]}
                        />
                        <SelectField
                            id="settings-language"
                            label={t('general.language')}
                            value={i18n.language?.startsWith('en') ? 'en' : 'tr'}
                            onChange={handleLanguageChange}
                            options={[
                                { value: 'tr', label: t('general.languageOptions.tr') },
                                { value: 'en', label: t('general.languageOptions.en') },
                            ]}
                        />
                        <SelectField
                            id="settings-currency"
                            label={t('general.currency')}
                            value={currency}
                            onChange={(val) => { setCurrency(val); showToast(t('general.saved')) }}
                            options={[
                                { value: 'TRY', label: t('general.currencyOptions.TRY') },
                                { value: 'USD', label: t('general.currencyOptions.USD') },
                                { value: 'EUR', label: t('general.currencyOptions.EUR') },
                            ]}
                        />
                    </SettingsCard>
                </div>
            )}

            {/* ─── Notifications Tab ──────────────────── */}
            {activeTab === 'notifications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Master Email Toggle */}
                    <SettingsCard title={t('notifications.emailToggle')} icon="📧">
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: '0 0 12px' }}>
                            {t('notifications.description')}
                        </p>
                        <NotifRow
                            id="notif-email"
                            label={t('notifications.emailToggle')}
                            description={t('notifications.emailToggleDesc')}
                            checked={notifPrefs.emailEnabled}
                            onChange={v => updateNotif('emailEnabled', v)}
                        />
                    </SettingsCard>

                    {/* Orders */}
                    <SettingsCard title={t('notifications.categories.orders')} icon="📦">
                        <NotifRow
                            id="notif-orders-new"
                            label={t('notifications.categories.ordersNew')}
                            description={t('notifications.categories.ordersNewDesc')}
                            checked={notifPrefs.ordersNew}
                            onChange={v => updateNotif('ordersNew', v)}
                        />
                        <NotifRow
                            id="notif-orders-status"
                            label={t('notifications.categories.ordersStatus')}
                            description={t('notifications.categories.ordersStatusDesc')}
                            checked={notifPrefs.ordersStatus}
                            onChange={v => updateNotif('ordersStatus', v)}
                        />
                    </SettingsCard>

                    {/* Stock */}
                    <SettingsCard title={t('notifications.categories.stock')} icon="📊">
                        <NotifRow
                            id="notif-stock-low"
                            label={t('notifications.categories.stockLow')}
                            description={t('notifications.categories.stockLowDesc')}
                            checked={notifPrefs.stockLow}
                            onChange={v => updateNotif('stockLow', v)}
                        />
                        <NotifRow
                            id="notif-stock-out"
                            label={t('notifications.categories.stockOut')}
                            description={t('notifications.categories.stockOutDesc')}
                            checked={notifPrefs.stockOut}
                            onChange={v => updateNotif('stockOut', v)}
                        />
                    </SettingsCard>

                    {/* Customers */}
                    <SettingsCard title={t('notifications.categories.customers')} icon="👥">
                        <NotifRow
                            id="notif-customers-new"
                            label={t('notifications.categories.customersNew')}
                            description={t('notifications.categories.customersNewDesc')}
                            checked={notifPrefs.customersNew}
                            onChange={v => updateNotif('customersNew', v)}
                        />
                    </SettingsCard>

                    {/* Reports */}
                    <SettingsCard title={t('notifications.categories.reports')} icon="📈">
                        <NotifRow
                            id="notif-reports-monthly"
                            label={t('notifications.categories.reportsMonthly')}
                            description={t('notifications.categories.reportsMonthlyDesc')}
                            checked={notifPrefs.reportsMonthly}
                            onChange={v => updateNotif('reportsMonthly', v)}
                        />
                    </SettingsCard>
                </div>
            )}

            {/* Save Toast */}
            {saveToast && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    background: 'linear-gradient(135deg, rgba(88,166,255,0.9), rgba(139,92,246,0.9))',
                    color: '#fff', padding: '12px 24px', borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem', fontWeight: 600,
                    boxShadow: '0 8px 32px rgba(88,166,255,0.3)',
                    backdropFilter: 'blur(8px)',
                    animation: 'fadeInUp 0.3s ease',
                    zIndex: 1000,
                }}>
                    ✅ {saveToast}
                </div>
            )}
        </div>
    )
}
