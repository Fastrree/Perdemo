/**
 * /api/customers — GET, POST, PUT, DELETE
 */
import { getAuthContext, handlePreflight, db } from './_lib/db.js'
import { customers, orders } from '../db/schema.js'
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET', 'POST', 'PUT', 'DELETE'])) return

    const auth = await getAuthContext(req)
    if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message })

    const { id, search } = req.query
    const companyGuard = id ? and(eq(customers.id, id), eq(customers.company_id, auth.companyId)) : null

    // GET — List or Single
    if (req.method === 'GET') {
        try {
            if (id) {
                const [data] = await db.select().from(customers).where(companyGuard).limit(1)
                if (!data) return res.status(404).json({ error: 'Customer not found' })
                return res.status(200).json(data)
            }

            let data
            if (search) {
                const pattern = `%${search}%`
                data = await db
                    .select()
                    .from(customers)
                    .where(and(
                        eq(customers.company_id, auth.companyId),
                        or(
                            ilike(customers.full_name, pattern),
                            ilike(customers.email, pattern),
                            ilike(customers.phone, pattern),
                            ilike(customers.city, pattern),
                        )
                    ))
                    .orderBy(desc(customers.created_at))
            } else {
                data = await db
                    .select()
                    .from(customers)
                    .where(eq(customers.company_id, auth.companyId))
                    .orderBy(desc(customers.created_at))
            }
            return res.status(200).json(data)
        } catch (err) {
            console.error('GET /api/customers error:', err.message)
            return res.status(500).json({ error: 'Failed to fetch customers' })
        }
    }

    // POST — Create
    if (req.method === 'POST') {
        try {
            const { full_name, email, phone, city } = req.body
            if (!full_name?.trim()) {
                return res.status(400).json({ error: 'Customer name is required' })
            }

            const [data] = await db
                .insert(customers)
                .values({
                    company_id: auth.companyId,
                    full_name: full_name.trim(),
                    email: email || null,
                    phone: phone || null,
                    city: city || null,
                })
                .returning()

            return res.status(201).json(data)
        } catch (err) {
            console.error('POST /api/customers error:', err.message)
            return res.status(500).json({ error: 'Failed to create customer' })
        }
    }

    // PUT — Update
    if (req.method === 'PUT') {
        if (!id) return res.status(400).json({ error: 'Customer ID is required' })
        try {
            const updates = { ...req.body }
            delete updates.id
            delete updates.company_id
            delete updates.created_at
            updates.updated_at = sql`now()`

            if (updates.total_spent != null) {
                updates.total_spent = String(Number(updates.total_spent))
            }

            const [data] = await db.update(customers).set(updates).where(companyGuard).returning()
            if (!data) return res.status(404).json({ error: 'Customer not found' })
            return res.status(200).json(data)
        } catch (err) {
            console.error('PUT /api/customers error:', err.message)
            return res.status(500).json({ error: 'Failed to update customer' })
        }
    }

    // DELETE
    if (req.method === 'DELETE') {
        const { delete_all } = req.query

        if (delete_all === 'true') {
            try {
                // Free up orders before deleting customers
                await db.update(orders).set({ customer_id: null }).where(eq(orders.company_id, auth.companyId))
                // If soft delete is preferred later, change this to an update query on is_active: false
                await db.delete(customers).where(eq(customers.company_id, auth.companyId))
                return res.status(204).end()
            } catch (err) {
                console.error('DELETE_ALL /api/customers error:', err.message)
                return res.status(500).json({ error: 'Failed to delete all customers' })
            }
        }

        if (!id) return res.status(400).json({ error: 'Customer ID is required' })
        try {
            await db.update(orders).set({ customer_id: null }).where(and(eq(orders.customer_id, id), eq(orders.company_id, auth.companyId)))
            await db.delete(customers).where(companyGuard)
            return res.status(204).end()
        } catch (err) {
            console.error('DELETE /api/customers error:', err.message)
            return res.status(500).json({ error: 'Failed to delete customer' })
        }
    }
}
