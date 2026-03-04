/**
 * /api/notifications — GET/PUT notifications
 * GET: returns user's notifications (latest 20)
 * PUT: mark all as read
 */
import { getAuthContext, handlePreflight, db } from './_lib/db.js'
import { notifications } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET', 'PUT'])) return

    const auth = await getAuthContext(req)
    if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message })

    try {
        if (req.method === 'GET') {
            const data = await db.select()
                .from(notifications)
                .where(eq(notifications.company_id, auth.companyId))
                .orderBy(desc(notifications.created_at))
                .limit(20)

            const unreadCount = data.filter(n => !n.read).length

            return res.status(200).json({ notifications: data, unreadCount })
        }

        if (req.method === 'PUT') {
            // Mark all as read for this company
            await db.update(notifications)
                .set({ read: true })
                .where(and(
                    eq(notifications.company_id, auth.companyId),
                    eq(notifications.read, false),
                ))

            return res.status(200).json({ success: true })
        }
    } catch (err) {
        console.error('Notifications API error:', err.message)
        return res.status(500).json({ error: 'Failed to process notifications' })
    }
}
