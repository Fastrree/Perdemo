import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/apiClient'

/**
 * useProducts — CRUD hook for products
 * 
 * Returns: { products, loading, error, fetchProducts, createProduct, updateProduct, deleteProduct }
 */
export function useProducts({ autoFetch = true } = {}) {
    const { getToken, isAuthenticated } = useAuth()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchProducts = useCallback(async (filters = {}) => {
        setLoading(true)
        setError(null)
        const { data, error: err } = await apiFetch('/api/products', {
            getToken,
            params: filters,
        })
        if (err) {
            setError(err)
            setProducts([])
        } else {
            setProducts(data || [])
        }
        setLoading(false)
        return { data, error: err }
    }, [getToken])

    const createProduct = useCallback(async (productData) => {
        const { data, error: err } = await apiFetch('/api/products', {
            getToken,
            method: 'POST',
            body: productData,
        })
        if (!err && data) {
            setProducts(prev => [data, ...prev])
        }
        return { data, error: err }
    }, [getToken])

    const updateProduct = useCallback(async (id, updates) => {
        const { data, error: err } = await apiFetch(`/api/products?id=${id}`, {
            getToken,
            method: 'PUT',
            body: updates,
        })
        if (!err && data) {
            setProducts(prev => prev.map(p => p.id === id ? data : p))
        }
        return { data, error: err }
    }, [getToken])

    const deleteProduct = useCallback(async (id) => {
        const { data, error: err } = await apiFetch(`/api/products?id=${id}`, {
            getToken,
            method: 'DELETE',
        })
        if (!err) {
            setProducts(prev => prev.filter(p => p.id !== id))
        }
        return { data, error: err }
    }, [getToken])

    const deleteAllProducts = useCallback(async () => {
        const { data, error: err } = await apiFetch(`/api/products?delete_all=true`, {
            getToken,
            method: 'DELETE',
        })
        if (!err) {
            setProducts([])
        }
        return { data, error: err }
    }, [getToken])

    useEffect(() => {
        if (autoFetch && isAuthenticated) {
            fetchProducts()
        }
    }, [autoFetch, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

    return { products, loading, error, fetchProducts, createProduct, updateProduct, deleteProduct, deleteAllProducts }
}
