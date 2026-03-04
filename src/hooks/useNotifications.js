import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/apiClient'

/**
 * useNotifications — DB-backed notifications with polling
 * Fetches notifications from API, polls every 30 seconds for updates
 */
export function useNotifications({ pollInterval = 30000 } = {}) {
    const { getToken, isAuthenticated } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const intervalRef = useRef(null)

    const fetchNotifications = useCallback(async () => {
        const { data, error } = await apiFetch('/api/notifications', { getToken })
        if (!error && data) {
            setNotifications(data.notifications || [])
            setUnreadCount(data.unreadCount || 0)
        }
        setLoading(false)
        return data
    }, [getToken])

    const markAllRead = useCallback(async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)

        await apiFetch('/api/notifications', {
            getToken,
            method: 'PUT',
        })
    }, [getToken])

    const markOneRead = useCallback((id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }, [])

    // Initial fetch + polling
    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications()

            // Start polling
            intervalRef.current = setInterval(fetchNotifications, pollInterval)
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isAuthenticated, pollInterval]) // eslint-disable-line react-hooks/exhaustive-deps

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAllRead,
        markOneRead,
    }
}
