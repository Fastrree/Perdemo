import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/apiClient'

/**
 * useOrders — CRUD hook for orders
 */
export function useOrders({ autoFetch = true } = {}) {
    const { session } = useAuth()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchOrders = useCallback(async (filters = {}) => {
        setLoading(true)
        setError(null)
        const { data, error: err } = await apiFetch('/api/orders', {
            session,
            params: filters,
        })
        if (err) {
            setError(err)
            setOrders([])
        } else {
            setOrders(data || [])
        }
        setLoading(false)
        return { data, error: err }
    }, [session])

    const createOrder = useCallback(async (orderData) => {
        const { data, error: err } = await apiFetch('/api/orders', {
            session,
            method: 'POST',
            body: orderData,
        })
        if (!err && data) {
            setOrders(prev => [data, ...prev])
        }
        return { data, error: err }
    }, [session])

    const updateOrder = useCallback(async (id, updates) => {
        const { data, error: err } = await apiFetch(`/api/orders/${id}`, {
            session,
            method: 'PUT',
            body: updates,
        })
        if (!err && data) {
            setOrders(prev => prev.map(o => o.id === id ? data : o))
        }
        return { data, error: err }
    }, [session])

    const deleteOrder = useCallback(async (id) => {
        const { data, error: err } = await apiFetch(`/api/orders/${id}`, {
            session,
            method: 'DELETE',
        })
        if (!err) {
            // Mark as cancelled in local state instead of removing
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o))
        }
        return { data, error: err }
    }, [session])

    useEffect(() => {
        if (autoFetch && session) {
            fetchOrders()
        }
    }, [autoFetch, session]) // eslint-disable-line react-hooks/exhaustive-deps

    return { orders, loading, error, fetchOrders, createOrder, updateOrder, deleteOrder }
}
