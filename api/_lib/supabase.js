/**
 * Server-side Supabase Client — Vercel Serverless Functions
 * 
 * Creates authenticated Supabase clients for API endpoints.
 * Uses SUPABASE_SERVICE_ROLE_KEY (never exposed to client).
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Create a Supabase admin client (bypasses RLS).
 * Use ONLY for operations that explicitly need admin access.
 */
export function createAdminClient() {
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

/**
 * Create a user-scoped Supabase client from request Authorization header.
 * RLS policies will filter data by the user's company_id automatically.
 * 
 * @returns {{ user, supabase }} - authenticated user + scoped client
 * @throws {Response} 401 if token invalid/missing
 */
export async function getUserClient(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
        return { error: { status: 401, message: 'Authorization header required' } }
    }

    // Create a client that acts on behalf of the authenticated user
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // Verify the token and get the user
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
        return { error: { status: 401, message: 'Invalid or expired token' } }
    }

    return { user, supabase }
}

/**
 * Standard CORS headers for API responses
 */
export function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

/**
 * Handle OPTIONS preflight + method validation
 * @returns {boolean} true if request was handled (preflight), false if should continue
 */
export function handlePreflight(req, res, allowedMethods = ['GET', 'POST', 'PUT', 'DELETE']) {
    setCorsHeaders(res)

    if (req.method === 'OPTIONS') {
        res.status(204).end()
        return true
    }

    if (!allowedMethods.includes(req.method)) {
        res.status(405).json({ error: `Method ${req.method} not allowed` })
        return true
    }

    return false
}
