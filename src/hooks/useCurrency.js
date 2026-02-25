import { useSyncExternalStore, useCallback } from 'react'

const STORAGE_KEY = 'perdemo-settings'

const currencyMap = {
    TRY: { symbol: '₺', locale: 'tr-TR', code: 'TRY' },
    USD: { symbol: '$', locale: 'en-US', code: 'USD' },
    EUR: { symbol: '€', locale: 'de-DE', code: 'EUR' },
}

// ── External store for cross-component reactivity ──
let listeners = []
function subscribe(cb) {
    listeners.push(cb)
    return () => { listeners = listeners.filter(l => l !== cb) }
}

function getSnapshot() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw).currency || 'TRY') : 'TRY'
    } catch { return 'TRY' }
}

// Listen for storage changes from other tabs/windows
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) listeners.forEach(l => l())
    })
}

/**
 * useCurrency — Global currency hook.
 * Reads the selected currency from localStorage (set by Settings page).
 * Returns symbol, formatMoney, and formatCompact utilities.
 */
export function useCurrency() {
    const currencyCode = useSyncExternalStore(subscribe, getSnapshot)
    const info = currencyMap[currencyCode] || currencyMap.TRY

    /** Format a number as full currency string, e.g. ₺24.850 or $24,850 */
    const formatMoney = useCallback((amount) => {
        const num = Number(amount) || 0
        return `${info.symbol}${num.toLocaleString(info.locale)}`
    }, [info])

    /** Format as compact, e.g. ₺24.8k or $24.8k */
    const formatCompact = useCallback((amount, decimals = 0) => {
        const num = Number(amount) || 0
        if (Math.abs(num) >= 1000) {
            return `${info.symbol}${(num / 1000).toFixed(decimals)}k`
        }
        return `${info.symbol}${num.toLocaleString(info.locale)}`
    }, [info])

    /** Format as K-style, e.g. ₺24K */
    const formatK = useCallback((amount) => {
        const num = Number(amount) || 0
        if (Math.abs(num) >= 1000) {
            return `${info.symbol}${(num / 1000).toFixed(0)}K`
        }
        return `${info.symbol}${num.toLocaleString(info.locale)}`
    }, [info])

    return {
        symbol: info.symbol,
        locale: info.locale,
        code: info.code,
        formatMoney,
        formatCompact,
        formatK,
    }
}

/**
 * Notify all subscribers (call this when saving currency in Settings).
 */
export function notifyCurrencyChange() {
    listeners.forEach(l => l())
}
