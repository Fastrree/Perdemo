import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/apiClient'

/**
 * useDealers — Dealer CRUD hook
 * Fetches, creates, updates, and deletes dealers
 */
export function useDealers() {
    const { session } = useAuth()
    const [dealers, setDealers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchDealers = useCallback(async () => {
        setLoading(true)
        setError(null)
        const { data, error: err } = await apiFetch('/api/dealers', { session })
        if (err) {
            setError(err)
            setDealers([])
        } else {
            setDealers(data || [])
        }
        setLoading(false)
        return { data, error: err }
    }, [session])

    useEffect(() => {
        if (session) {
            fetchDealers()
        }
    }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

    const createDealer = useCallback(async (dealerData) => {
        const { data, error: err } = await apiFetch('/api/dealers', {
            session, method: 'POST', body: dealerData,
        })
        if (!err && data) {
            setDealers(prev => [data, ...prev])
        }
        return { data, error: err }
    }, [session])

    const updateDealer = useCallback(async (id, updates) => {
        const { data, error: err } = await apiFetch(`/api/dealers/${id}`, {
            session, method: 'PUT', body: updates,
        })
        if (!err && data) {
            setDealers(prev => prev.map(d => d.id === id ? data : d))
        }
        return { data, error: err }
    }, [session])

    const deleteDealer = useCallback(async (id) => {
        const { error: err } = await apiFetch(`/api/dealers/${id}`, {
            session, method: 'DELETE',
        })
        if (!err) {
            setDealers(prev => prev.filter(d => d.id !== id))
        }
        return { error: err }
    }, [session])

    return { dealers, loading, error, fetchDealers, createDealer, updateDealer, deleteDealer }
}
