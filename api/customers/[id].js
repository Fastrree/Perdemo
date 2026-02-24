/**
 * /api/customers/[id] — GET (single) + PUT (update) + DELETE
 * RLS automatically filters by user's company_id
 */
import { getUserClient, handlePreflight } from '../_lib/supabase.js'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET', 'PUT', 'DELETE'])) return

    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Customer ID is required' })

    const { user, supabase, error: authError } = await getUserClient(req)
    if (authError) return res.status(authError.status).json({ error: authError.message })

    // ── GET: Single customer ──
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !data) {
                return res.status(404).json({ error: 'Customer not found' })
            }

            return res.status(200).json(data)
        } catch (err) {
            console.error('GET /api/customers/[id] error:', err.message)
            return res.status(500).json({ error: 'Failed to fetch customer' })
        }
    }

    // ── PUT: Update customer ──
    if (req.method === 'PUT') {
        try {
            const updates = req.body
            if (!updates || Object.keys(updates).length === 0) {
                return res.status(400).json({ error: 'No update data provided' })
            }

            // Prevent updating protected fields
            delete updates.id
            delete updates.company_id
            delete updates.created_at
            delete updates.total_orders
            delete updates.total_spent

            const { data, error } = await supabase
                .from('customers')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            if (!data) return res.status(404).json({ error: 'Customer not found' })

            return res.status(200).json(data)
        } catch (err) {
            console.error('PUT /api/customers/[id] error:', err.message)
            return res.status(500).json({ error: 'Failed to update customer' })
        }
    }

    // ── DELETE: Hard delete ──
    if (req.method === 'DELETE') {
        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id)

            if (error) throw error

            return res.status(200).json({ message: 'Customer deleted', id })
        } catch (err) {
            console.error('DELETE /api/customers/[id] error:', err.message)
            return res.status(500).json({ error: 'Failed to delete customer' })
        }
    }
}
