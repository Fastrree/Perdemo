/**
 * /api/dealers — GET all dealers, POST new dealer
 * RLS automatically filters by user's company_id
 */
import { getUserClient, handlePreflight } from './_lib/supabase.js'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET', 'POST'])) return

    const { user, supabase, error: authError } = await getUserClient(req)
    if (authError) return res.status(authError.status).json({ error: authError.message })

    // GET — List all dealers
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('dealers')
                .select('*')
                .order('monthly_revenue', { ascending: false })

            if (error) throw error
            return res.status(200).json(data)
        } catch (err) {
            console.error('GET /api/dealers error:', err.message)
            return res.status(500).json({ error: 'Failed to fetch dealers' })
        }
    }

    // POST — Create new dealer
    if (req.method === 'POST') {
        try {
            const {
                name, city, region, contact_name, phone, email,
                monthly_revenue, total_orders, total_demos, top_product,
                satisfaction, markup_percent, status, lat, lng,
            } = req.body

            if (!name) {
                return res.status(400).json({ error: 'Dealer name is required' })
            }

            // Get user's company_id from profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single()

            const { data, error } = await supabase
                .from('dealers')
                .insert({
                    company_id: profile.company_id,
                    name, city, region, contact_name, phone, email,
                    monthly_revenue: monthly_revenue || 0,
                    total_orders: total_orders || 0,
                    total_demos: total_demos || 0,
                    top_product, satisfaction: satisfaction || 0,
                    markup_percent: markup_percent || 0,
                    status: status || 'active',
                    lat, lng,
                })
                .select()
                .single()

            if (error) throw error
            return res.status(201).json(data)
        } catch (err) {
            console.error('POST /api/dealers error:', err.message)
            return res.status(500).json({ error: 'Failed to create dealer' })
        }
    }
}
