import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/apiClient'

/**
 * useAnalytics — Analytics statistics hook
 * Fetches aggregated analytics data (monthly revenue, orders, fabric breakdown, KPIs)
 */
export function useAnalytics() {
    const { session } = useAuth()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchStats = useCallback(async () => {
        setLoading(true)
        setError(null)
        const { data, error: err } = await apiFetch('/api/analytics/stats', { session })
        if (err) {
            setError(err)
            setStats(null)
        } else {
            setStats(data)
        }
        setLoading(false)
        return { data, error: err }
    }, [session])

    useEffect(() => {
        if (session) {
            fetchStats()
        }
    }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

    return { stats, loading, error, fetchStats }
}
