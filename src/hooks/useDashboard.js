import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/apiClient'

/**
 * useDashboard — Dashboard statistics hook
 */
export function useDashboard() {
    const { getToken, isAuthenticated } = useAuth()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchStats = useCallback(async () => {
        setLoading(true)
        setError(null)
        const { data, error: err } = await apiFetch('/api/dashboard/stats', { getToken })
        if (err) {
            setError(err)
            setStats(null)
        } else {
            setStats(data)
        }
        setLoading(false)
        return { data, error: err }
    }, [getToken])

    useEffect(() => {
        if (isAuthenticated) {
            fetchStats()
        }
    }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

    return { stats, loading, error, fetchStats }
}
