/**
 * /api/products — GET (list), POST (create), PUT (update), DELETE (soft-delete)
 * Company isolation via getAuthContext → companyId
 */
import { getAuthContext, handlePreflight, db } from './_lib/db.js'
import { products } from '../db/schema.js'
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET', 'POST', 'PUT', 'DELETE'])) return

    const auth = await getAuthContext(req)
    if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message })

    const { id, search, category, status } = req.query

    // Helper: secure guard for operations targeting a specific ID
    const companyGuard = id ? and(eq(products.id, id), eq(products.company_id, auth.companyId)) : null

    // ── GET: List products or Single product ──
    if (req.method === 'GET') {
        try {
            // Single product
            if (id) {
                const [data] = await db.select().from(products).where(companyGuard).limit(1)
                if (!data) return res.status(404).json({ error: 'Product not found' })
                return res.status(200).json(data)
            }

            // List products
            let conditions = [
                eq(products.company_id, auth.companyId),
                eq(products.is_active, true),
            ]

            if (category) conditions.push(eq(products.category, category))
            if (status) conditions.push(eq(products.stock_status, status))

            let data
            if (search) {
                const pattern = `%${search}%`
                data = await db
                    .select()
                    .from(products)
                    .where(and(
                        ...conditions,
                        or(
                            ilike(products.name, pattern),
                            ilike(products.category, pattern),
                            ilike(products.fabric_type, pattern),
                        )
                    ))
                    .orderBy(desc(products.created_at))
            } else {
                data = await db
                    .select()
                    .from(products)
                    .where(and(...conditions))
                    .orderBy(desc(products.created_at))
            }

            return res.status(200).json(data)
        } catch (err) {
            console.error('GET /api/products error:', err.message)
            return res.status(500).json({ error: 'Failed to fetch products' })
        }
    }

    // ── POST: Create product ──
    if (req.method === 'POST') {
        try {
            const { name, category, fabric_type, color, price_per_meter, stock_meters, image_url } = req.body

            if (!name?.trim()) {
                return res.status(400).json({ error: 'Product name is required' })
            }
            if (price_per_meter == null || price_per_meter < 0) {
                return res.status(400).json({ error: 'Valid price_per_meter is required' })
            }

            const meters = Number(stock_meters) || 0
            const stock_status = meters > 10 ? 'in_stock' : meters > 0 ? 'low_stock' : 'out_of_stock'

            const [data] = await db
                .insert(products)
                .values({
                    company_id: auth.companyId,
                    name: name.trim(),
                    category: category || null,
                    fabric_type: fabric_type || null,
                    color: color || null,
                    price_per_meter: String(Number(price_per_meter)),
                    stock_meters: meters,
                    stock_status,
                    image_url: image_url || null,
                })
                .returning()

            return res.status(201).json(data)
        } catch (err) {
            console.error('POST /api/products error:', err.message)
            return res.status(500).json({ error: 'Failed to create product' })
        }
    }

    // ── PUT: Update product ──
    if (req.method === 'PUT') {
        if (!id) return res.status(400).json({ error: 'Product ID is required for update' })
        try {
            const updates = { ...req.body }
            delete updates.id
            delete updates.company_id
            delete updates.created_at
            updates.updated_at = sql`now()`

            if (updates.price_per_meter != null) {
                updates.price_per_meter = String(Number(updates.price_per_meter))
            }
            if (updates.stock_meters != null) {
                const meters = Number(updates.stock_meters) || 0
                updates.stock_meters = meters
                updates.stock_status = meters > 10 ? 'in_stock' : meters > 0 ? 'low_stock' : 'out_of_stock'
            }

            const [data] = await db.update(products).set(updates).where(companyGuard).returning()
            if (!data) return res.status(404).json({ error: 'Product not found' })
            return res.status(200).json(data)
        } catch (err) {
            console.error('PUT /api/products error:', err.message)
            return res.status(500).json({ error: 'Failed to update product' })
        }
    }

    // ── DELETE: Soft-delete product ──
    if (req.method === 'DELETE') {
        const { delete_all } = req.query

        if (delete_all === 'true') {
            try {
                await db.update(products).set({ is_active: false }).where(eq(products.company_id, auth.companyId))
                return res.status(204).end()
            } catch (err) {
                console.error('DELETE_ALL /api/products error:', err.message)
                return res.status(500).json({ error: 'Failed to delete all products' })
            }
        }

        if (!id) return res.status(400).json({ error: 'Product ID is required for deletion' })
        try {
            await db.update(products).set({ is_active: false }).where(companyGuard)
            return res.status(204).end()
        } catch (err) {
            console.error('DELETE /api/products error:', err.message)
            return res.status(500).json({ error: 'Failed to delete product' })
        }
    }
}
