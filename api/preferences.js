/**
 * /api/preferences — GET/PUT user preferences
 * Stores: theme, language, currency, notification_prefs in DB
 */
import { getAuthContext, handlePreflight, db } from './_lib/db.js'
import { userPreferences } from '../db/schema.js'
import { eq } from 'drizzle-orm'

const DEFAULTS = {
    theme: 'dark',
    language: 'tr',
    currency: 'TRY',
    notification_prefs: JSON.stringify({
        emailNotifications: true,
        newOrder: true,
        orderStatus: true,
        lowStock: true,
        outOfStock: false,
        newCustomer: true,
        monthlyReport: true,
    }),
}

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET', 'PUT'])) return

    const auth = await getAuthContext(req)
    if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message })

    try {
        if (req.method === 'GET') {
            let [prefs] = await db.select()
                .from(userPreferences)
                .where(eq(userPreferences.user_id, auth.userId))
                .limit(1)

            // Auto-provision if not exists
            if (!prefs) {
                ;[prefs] = await db.insert(userPreferences)
                    .values({
                        user_id: auth.userId,
                        company_id: auth.companyId,
                        ...DEFAULTS,
                    })
                    .returning()
            }

            return res.status(200).json({
                theme: prefs.theme,
                language: prefs.language,
                currency: prefs.currency,
                notification_prefs: typeof prefs.notification_prefs === 'string'
                    ? JSON.parse(prefs.notification_prefs)
                    : prefs.notification_prefs,
            })
        }

        if (req.method === 'PUT') {
            const { theme, language, currency, notification_prefs } = req.body

            const updates = {}
            if (theme) updates.theme = theme
            if (language) updates.language = language
            if (currency) updates.currency = currency
            if (notification_prefs) updates.notification_prefs = JSON.stringify(notification_prefs)
            updates.updated_at = new Date()

            // Upsert: update if exists, insert if not
            const [existing] = await db.select({ id: userPreferences.id })
                .from(userPreferences)
                .where(eq(userPreferences.user_id, auth.userId))
                .limit(1)

            let prefs
            if (existing) {
                ;[prefs] = await db.update(userPreferences)
                    .set(updates)
                    .where(eq(userPreferences.user_id, auth.userId))
                    .returning()
            } else {
                ;[prefs] = await db.insert(userPreferences)
                    .values({
                        user_id: auth.userId,
                        company_id: auth.companyId,
                        ...DEFAULTS,
                        ...updates,
                    })
                    .returning()
            }

            return res.status(200).json({
                theme: prefs.theme,
                language: prefs.language,
                currency: prefs.currency,
                notification_prefs: typeof prefs.notification_prefs === 'string'
                    ? JSON.parse(prefs.notification_prefs)
                    : prefs.notification_prefs,
            })
        }
    } catch (err) {
        console.error('Preferences API error:', err.message)
        return res.status(500).json({ error: 'Failed to process preferences' })
    }
}
