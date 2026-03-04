import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/apiClient'

/**
 * useDealers — CRUD hook for dealers
 */
export function useDealers({ autoFetch = true } = {}) {
    const { getToken, isAuthenticated } = useAuth()
    const [dealers, setDealers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchDealers = useCallback(async (filters = {}) => {
        setLoading(true)
        setError(null)
        const { data, error: err } = await apiFetch('/api/dealers', {
            getToken,
            params: filters,
        })
        if (err) {
            setError(err)
            setDealers([])
        } else {
            setDealers(data || [])
        }
        setLoading(false)
        return { data, error: err }
    }, [getToken])

    const createDealer = useCallback(async (dealerData) => {
        const { data, error: err } = await apiFetch('/api/dealers', {
            getToken,
            method: 'POST',
            body: dealerData,
        })
        if (!err && data) {
            setDealers(prev => [data, ...prev])
        }
        return { data, error: err }
    }, [getToken])

    const updateDealer = useCallback(async (id, updates) => {
        const { data, error: err } = await apiFetch(`/api/dealers?id=${id}`, {
            getToken,
            method: 'PUT',
            body: updates,
        })
        if (!err && data) {
            setDealers(prev => prev.map(d => d.id === id ? data : d))
        }
        return { data, error: err }
    }, [getToken])

    const deleteDealer = useCallback(async (id) => {
        const { data, error: err } = await apiFetch(`/api/dealers?id=${id}`, {
            getToken,
            method: 'DELETE',
        })
        if (!err) {
            setDealers(prev => prev.filter(d => d.id !== id))
        }
        return { data, error: err }
    }, [getToken])

    useEffect(() => {
        if (autoFetch && isAuthenticated) {
            fetchDealers()
        }
    }, [autoFetch, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

    return { dealers, loading, error, fetchDealers, createDealer, updateDealer, deleteDealer }
}
