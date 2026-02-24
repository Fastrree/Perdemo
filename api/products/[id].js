/**
 * /api/products/[id] — GET (single) + PUT (update) + DELETE (soft delete)
 * RLS automatically filters by user's company_id
 */
import { getUserClient, handlePreflight } from '../_lib/supabase.js'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET', 'PUT', 'DELETE'])) return

    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Product ID is required' })

    const { user, supabase, error: authError } = await getUserClient(req)
    if (authError) return res.status(authError.status).json({ error: authError.message })

    // ── GET: Single product ──
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !data) {
                return res.status(404).json({ error: 'Product not found' })
            }

            return res.status(200).json(data)
        } catch (err) {
            console.error('GET /api/products/[id] error:', err.message)
            return res.status(500).json({ error: 'Failed to fetch product' })
        }
    }

    // ── PUT: Update product ──
    if (req.method === 'PUT') {
        try {
            const updates = req.body
            if (!updates || Object.keys(updates).length === 0) {
                return res.status(400).json({ error: 'No update data provided' })
            }

            // Recalculate stock_status if stock_meters is being updated
            if (updates.stock_meters != null) {
                const meters = Number(updates.stock_meters)
                updates.stock_status = meters > 10 ? 'in_stock' : meters > 0 ? 'low_stock' : 'out_of_stock'
            }

            updates.updated_at = new Date().toISOString()

            // Prevent updating protected fields
            delete updates.id
            delete updates.company_id
            delete updates.created_at

            const { data, error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            if (!data) return res.status(404).json({ error: 'Product not found' })

            return res.status(200).json(data)
        } catch (err) {
            console.error('PUT /api/products/[id] error:', err.message)
            return res.status(500).json({ error: 'Failed to update product' })
        }
    }

    // ── DELETE: Soft delete (is_active = false) ──
    if (req.method === 'DELETE') {
        try {
            const { data, error } = await supabase
                .from('products')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            if (!data) return res.status(404).json({ error: 'Product not found' })

            return res.status(200).json({ message: 'Product deleted', id })
        } catch (err) {
            console.error('DELETE /api/products/[id] error:', err.message)
            return res.status(500).json({ error: 'Failed to delete product' })
        }
    }
}
