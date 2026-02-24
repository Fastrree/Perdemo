/**
 * API Client — Shared fetch helper with JWT authentication
 * 
 * Usage:
 *   const { data, error } = await apiFetch('/api/products', { session })
 *   const { data, error } = await apiFetch('/api/products', { session, method: 'POST', body: { name: '...' } })
 */

/**
 * Authenticated fetch wrapper for Vercel Serverless API endpoints.
 * Automatically attaches JWT token and handles JSON parsing.
 * 
 * @param {string} url - API endpoint path (e.g. '/api/products')
 * @param {Object} options
 * @param {Object} options.session - Supabase session (must have access_token)
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Object} [options.body] - Request body (auto-serialized to JSON)
 * @param {Object} [options.params] - URL query parameters
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function apiFetch(url, { session, method = 'GET', body, params } = {}) {
    if (!session?.access_token) {
        return { data: null, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }
    }

    try {
        // Build URL with query params
        let fullUrl = url
        if (params) {
            const searchParams = new URLSearchParams()
            Object.entries(params).forEach(([key, value]) => {
                if (value != null && value !== '') {
                    searchParams.append(key, String(value))
                }
            })
            const qs = searchParams.toString()
            if (qs) fullUrl += `?${qs}`
        }

        const fetchOptions = {
            method,
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        }

        if (body && method !== 'GET') {
            fetchOptions.body = JSON.stringify(body)
        }

        const response = await fetch(fullUrl, fetchOptions)

        // Handle no-content responses (204)
        if (response.status === 204) {
            return { data: null, error: null }
        }

        const result = await response.json()

        if (!response.ok) {
            return { data: null, error: result.error || `Hata: ${response.status}` }
        }

        return { data: result, error: null }
    } catch (err) {
        console.error('API fetch error:', err)
        return { data: null, error: 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.' }
    }
}
