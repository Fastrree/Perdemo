/**
 * /api/dealers — GET, POST, PUT, DELETE
 */
import { getAuthContext, handlePreflight, db } from './_lib/db.js'
import { dealers } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET', 'POST', 'PUT', 'DELETE'])) return

    const auth = await getAuthContext(req)
    if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message })

    const { id } = req.query
    const companyGuard = id ? and(eq(dealers.id, id), eq(dealers.company_id, auth.companyId)) : null

    // GET — List or Single
    if (req.method === 'GET') {
        try {
            if (id) {
                const [data] = await db.select().from(dealers).where(companyGuard).limit(1)
                if (!data) return res.status(404).json({ error: 'Dealer not found' })
                return res.status(200).json(data)
            }

            const data = await db
                .select()
                .from(dealers)
                .where(eq(dealers.company_id, auth.companyId))
                .orderBy(desc(dealers.created_at))
            return res.status(200).json(data)
        } catch (err) {
            console.error('GET /api/dealers error:', err.message)
            return res.status(500).json({ error: 'Failed to fetch dealers' })
        }
    }

    // POST — Create
    if (req.method === 'POST') {
        try {
            const body = req.body
            if (!body.name?.trim()) {
                return res.status(400).json({ error: 'Dealer name is required' })
            }

            const [data] = await db
                .insert(dealers)
                .values({
                    company_id: auth.companyId,
                    name: body.name.trim(),
                    city: body.city || null,
                    region: body.region || null,
                    contact_name: body.contact_name || null,
                    phone: body.phone || null,
                    email: body.email || null,
                    monthly_revenue: body.monthly_revenue ? String(body.monthly_revenue) : '0',
                    total_orders: body.total_orders || 0,
                    total_demos: body.total_demos || 0,
                    top_product: body.top_product || null,
                    satisfaction: body.satisfaction ? String(body.satisfaction) : '0',
                    markup_percent: body.markup_percent || 0,
                    status: body.status || 'active',
                    lat: body.lat ? String(body.lat) : null,
                    lng: body.lng ? String(body.lng) : null,
                })
                .returning()

            return res.status(201).json(data)
        } catch (err) {
            console.error('POST /api/dealers error:', err.message)
            return res.status(500).json({ error: 'Failed to create dealer' })
        }
    }

    // PUT — Update
    if (req.method === 'PUT') {
        if (!id) return res.status(400).json({ error: 'Dealer ID is required' })
        try {
            const updates = { ...req.body }
            delete updates.id
            delete updates.company_id
            delete updates.created_at
            updates.updated_at = new Date().toISOString()

            if (updates.monthly_revenue != null) updates.monthly_revenue = String(updates.monthly_revenue)
            if (updates.satisfaction != null) updates.satisfaction = String(updates.satisfaction)
            if (updates.lat != null) updates.lat = String(updates.lat)
            if (updates.lng != null) updates.lng = String(updates.lng)

            const [data] = await db.update(dealers).set(updates).where(companyGuard).returning()
            if (!data) return res.status(404).json({ error: 'Dealer not found' })
            return res.status(200).json(data)
        } catch (err) {
            console.error('PUT /api/dealers error:', err.message)
            return res.status(500).json({ error: 'Failed to update dealer' })
        }
    }

    // DELETE
    if (req.method === 'DELETE') {
        if (!id) return res.status(400).json({ error: 'Dealer ID is required' })
        try {
            await db.delete(dealers).where(companyGuard)
            return res.status(204).end()
        } catch (err) {
            console.error('DELETE /api/dealers error:', err.message)
            return res.status(500).json({ error: 'Failed to delete dealer' })
        }
    }
}
