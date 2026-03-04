import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/apiClient'

/**
 * usePreferences — DB-backed user preferences
 * Fetches theme/language/currency/notification_prefs from API
 * Saves changes to DB on every update
 */
export function usePreferences() {
    const { getToken, isAuthenticated } = useAuth()
    const [prefs, setPrefs] = useState(null)
    const [loading, setLoading] = useState(true)
    const saveTimer = useRef(null)

    const fetchPrefs = useCallback(async () => {
        setLoading(true)
        const { data, error } = await apiFetch('/api/preferences', { getToken })
        if (!error && data) {
            setPrefs(data)
        }
        setLoading(false)
        return data
    }, [getToken])

    // Save specific fields to DB (debounced)
    const savePrefs = useCallback(async (updates) => {
        // Optimistic local update
        setPrefs(prev => prev ? { ...prev, ...updates } : updates)

        // Debounce DB write
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(async () => {
            await apiFetch('/api/preferences', {
                getToken,
                method: 'PUT',
                body: updates,
            })
        }, 300)
    }, [getToken])

    const setTheme = useCallback((theme) => savePrefs({ theme }), [savePrefs])
    const setLanguage = useCallback((language) => savePrefs({ language }), [savePrefs])
    const setCurrency = useCallback((currency) => savePrefs({ currency }), [savePrefs])
    const setNotificationPrefs = useCallback((notification_prefs) => savePrefs({ notification_prefs }), [savePrefs])

    useEffect(() => {
        if (isAuthenticated) {
            fetchPrefs()
        }
    }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

    // Cleanup
    useEffect(() => {
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current)
        }
    }, [])

    return {
        prefs,
        loading,
        fetchPrefs,
        setTheme,
        setLanguage,
        setCurrency,
        setNotificationPrefs,
    }
}
