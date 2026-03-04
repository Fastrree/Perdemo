/**
 * API Client — Shared fetch helper with Clerk JWT authentication
 * 
 * Uses a getToken function for fresh tokens on every request.
 * 
 * Usage:
 *   const { data, error } = await apiFetch('/api/products', { getToken })
 *   const { data, error } = await apiFetch('/api/products', { getToken, method: 'POST', body: { name: '...' } })
 */

/**
 * Authenticated fetch wrapper for Vercel Serverless API endpoints.
 * Calls getToken() on every request to ensure a fresh Clerk JWT.
 * 
 * @param {string} url - API endpoint path (e.g. '/api/products')
 * @param {Object} options
 * @param {Function} options.getToken - Async function that returns a fresh JWT
 * @param {Object} [options.session] - Legacy: session object with access_token (fallback)
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Object} [options.body] - Request body (auto-serialized to JSON)
 * @param {Object} [options.params] - URL query parameters
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function apiFetch(url, { getToken, session, method = 'GET', body, params } = {}) {
    let token = null

    // Prefer getToken (dynamic) over session (cached)
    if (getToken) {
        try {
            token = await getToken()
        } catch {
            token = null
        }
    } else if (session?.access_token) {
        token = session.access_token
    }

    if (!token) {
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
                'Authorization': `Bearer ${token}`,
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
