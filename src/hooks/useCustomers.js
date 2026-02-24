import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/apiClient'

/**
 * useCustomers — CRUD hook for customers
 */
export function useCustomers({ autoFetch = true } = {}) {
    const { session } = useAuth()
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchCustomers = useCallback(async (filters = {}) => {
        setLoading(true)
        setError(null)
        const { data, error: err } = await apiFetch('/api/customers', {
            session,
            params: filters,
        })
        if (err) {
            setError(err)
            setCustomers([])
        } else {
            setCustomers(data || [])
        }
        setLoading(false)
        return { data, error: err }
    }, [session])

    const createCustomer = useCallback(async (customerData) => {
        const { data, error: err } = await apiFetch('/api/customers', {
            session,
            method: 'POST',
            body: customerData,
        })
        if (!err && data) {
            setCustomers(prev => [data, ...prev])
        }
        return { data, error: err }
    }, [session])

    const updateCustomer = useCallback(async (id, updates) => {
        const { data, error: err } = await apiFetch(`/api/customers/${id}`, {
            session,
            method: 'PUT',
            body: updates,
        })
        if (!err && data) {
            setCustomers(prev => prev.map(c => c.id === id ? data : c))
        }
        return { data, error: err }
    }, [session])

    const deleteCustomer = useCallback(async (id) => {
        const { data, error: err } = await apiFetch(`/api/customers/${id}`, {
            session,
            method: 'DELETE',
        })
        if (!err) {
            setCustomers(prev => prev.filter(c => c.id !== id))
        }
        return { data, error: err }
    }, [session])

    useEffect(() => {
        if (autoFetch && session) {
            fetchCustomers()
        }
    }, [autoFetch, session]) // eslint-disable-line react-hooks/exhaustive-deps

    return { customers, loading, error, fetchCustomers, createCustomer, updateCustomer, deleteCustomer }
}
