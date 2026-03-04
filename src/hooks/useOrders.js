import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/apiClient'

/**
 * useOrders — CRUD hook for orders
 */
export function useOrders({ autoFetch = true } = {}) {
    const { getToken, isAuthenticated } = useAuth()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchOrders = useCallback(async (filters = {}) => {
        setLoading(true)
        setError(null)
        const { data, error: err } = await apiFetch('/api/orders', {
            getToken,
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
    }, [getToken])

    const createOrder = useCallback(async (orderData) => {
        const { data, error: err } = await apiFetch('/api/orders', {
            getToken,
            method: 'POST',
            body: orderData,
        })
        // Optimistic update removed because Orders.jsx handles post-create refresh
        // if (!err && data) {
        //     setOrders(prev => [data, ...prev])
        // }
        return { data, error: err }
    }, [getToken])

    const updateOrder = useCallback(async (id, updates) => {
        const { data, error: err } = await apiFetch(`/api/orders?id=${id}`, {
            getToken,
            method: 'PUT',
            body: updates,
        })
        if (!err && data) {
            setOrders(prev => prev.map(o => o.id === id ? data : o))
        }
        return { data, error: err }
    }, [getToken])

    const deleteOrder = useCallback(async (id) => {
        const { data, error: err } = await apiFetch(`/api/orders?id=${id}`, {
            getToken,
            method: 'DELETE',
        })
        if (!err) {
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o))
        }
        return { data, error: err }
    }, [getToken])

    useEffect(() => {
        if (autoFetch && isAuthenticated) {
            fetchOrders()
        }
    }, [autoFetch, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

    return { orders, loading, error, fetchOrders, createOrder, updateOrder, deleteOrder }
}
