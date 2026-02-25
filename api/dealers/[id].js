/**
 * /api/dealers/[id] — GET, PUT, DELETE single dealer
 * RLS automatically filters by user's company_id
 */
import { getUserClient, handlePreflight } from '../_lib/supabase.js'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET', 'PUT', 'DELETE'])) return

    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Dealer ID is required' })

    const { user, supabase, error: authError } = await getUserClient(req)
    if (authError) return res.status(authError.status).json({ error: authError.message })

    // GET — Single dealer
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('dealers')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            if (!data) return res.status(404).json({ error: 'Dealer not found' })
            return res.status(200).json(data)
        } catch (err) {
            console.error('GET /api/dealers/[id] error:', err.message)
            return res.status(500).json({ error: 'Failed to fetch dealer' })
        }
    }

    // PUT — Update dealer
    if (req.method === 'PUT') {
        try {
            const updates = req.body
            delete updates.id
            delete updates.company_id
            delete updates.created_at
            updates.updated_at = new Date().toISOString()

            const { data, error } = await supabase
                .from('dealers')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return res.status(200).json(data)
        } catch (err) {
            console.error('PUT /api/dealers/[id] error:', err.message)
            return res.status(500).json({ error: 'Failed to update dealer' })
        }
    }

    // DELETE — Remove dealer
    if (req.method === 'DELETE') {
        try {
            const { error } = await supabase
                .from('dealers')
                .delete()
                .eq('id', id)

            if (error) throw error
            return res.status(204).end()
        } catch (err) {
            console.error('DELETE /api/dealers/[id] error:', err.message)
            return res.status(500).json({ error: 'Failed to delete dealer' })
        }
    }
}
