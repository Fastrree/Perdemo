/**
 * /api/products — GET (list) + POST (create)
 * RLS automatically filters by user's company_id
 */
import { getUserClient, handlePreflight } from './_lib/supabase.js'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET', 'POST'])) return

    const { user, supabase, error: authError } = await getUserClient(req)
    if (authError) return res.status(authError.status).json({ error: authError.message })

    // ── GET: List products ──
    if (req.method === 'GET') {
        try {
            const { search, category, status } = req.query

            let query = supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (search) {
                query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,fabric_type.ilike.%${search}%`)
            }
            if (category) {
                query = query.eq('category', category)
            }
            if (status) {
                query = query.eq('stock_status', status)
            }

            const { data, error } = await query
            if (error) throw error

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

            // Get user's company_id
            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single()

            if (!profile?.company_id) {
                return res.status(400).json({ error: 'User has no company' })
            }

            // Calculate stock status
            const meters = Number(stock_meters) || 0
            const stock_status = meters > 10 ? 'in_stock' : meters > 0 ? 'low_stock' : 'out_of_stock'

            const { data, error } = await supabase
                .from('products')
                .insert({
                    company_id: profile.company_id,
                    name: name.trim(),
                    category: category || null,
                    fabric_type: fabric_type || null,
                    color: color || null,
                    price_per_meter: Number(price_per_meter),
                    stock_meters: meters,
                    stock_status,
                    image_url: image_url || null,
                })
                .select()
                .single()

            if (error) throw error

            return res.status(201).json(data)
        } catch (err) {
            console.error('POST /api/products error:', err.message)
            return res.status(500).json({ error: 'Failed to create product' })
        }
    }
}
