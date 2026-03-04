/**
 * Server-side DB & Auth Helper — Vercel Serverless Functions
 * 
 * - Verifies Clerk JWT via @clerk/backend SDK
 * - Resolves user's company_id from profiles table
 * - Auto-provisions company + profile on first login
 * - Provides Drizzle db client for type-safe queries
 */
import { verifyToken } from '@clerk/backend'
import { db } from '../../db/index.js'
import { profiles, companies } from '../../db/schema.js'
import { eq } from 'drizzle-orm'

/**
 * Authenticate request and get user's company_id.
 * If user has no profile yet, auto-creates company + profile.
 * 
 * @returns {{ userId, companyId, error }}
 */
export async function getAuthContext(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
        return { error: { status: 401, message: 'Authorization header required' } }
    }

    let decoded
    try {
        decoded = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        })
    } catch (err) {
        console.error('Clerk token verification failed:', err.message)
        return { error: { status: 401, message: 'Invalid or expired token' } }
    }

    const userId = decoded.sub
    if (!userId) {
        return { error: { status: 401, message: 'Invalid token: no user ID' } }
    }

    // Get user's company_id from profiles table
    let [profile] = await db
        .select({ companyId: profiles.company_id })
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1)

    // Auto-provision: create company + profile on first login
    if (!profile?.companyId) {
        try {
            const email = decoded.email || decoded.primary_email || `${userId}@clerk.user`
            const fullName = [decoded.first_name, decoded.last_name].filter(Boolean).join(' ') || 'User'

            // 1. Create a default company
            const [company] = await db
                .insert(companies)
                .values({
                    name: `${fullName}'s Company`,
                })
                .returning()

            // 2. Create profile linked to company
            await db.insert(profiles).values({
                id: userId,
                company_id: company.id,
                email,
                full_name: fullName,
                role: 'owner',
            })

            profile = { companyId: company.id }
            console.log(`Auto-provisioned company + profile for user ${userId}`)
        } catch (provisionErr) {
            console.error('Auto-provision failed:', provisionErr.message)
            return { error: { status: 500, message: 'Failed to create user profile' } }
        }
    }

    return {
        userId,
        companyId: profile.companyId,
    }
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

// Re-export db and schema for convenience
export { db } from '../../db/index.js'
export * as schema from '../../db/schema.js'
