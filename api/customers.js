/**
 * /api/customers — GET (list) + POST (create)
 * RLS automatically filters by user's company_id
 */
import { getUserClient, handlePreflight } from './_lib/supabase.js'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET', 'POST'])) return

    const { user, supabase, error: authError } = await getUserClient(req)
    if (authError) return res.status(authError.status).json({ error: authError.message })

    // ── GET: List customers ──
    if (req.method === 'GET') {
        try {
            const { search, status } = req.query

            let query = supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false })

            if (search) {
                query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`)
            }
            if (status) {
                query = query.eq('status', status)
            }

            const { data, error } = await query
            if (error) throw error

            return res.status(200).json(data)
        } catch (err) {
            console.error('GET /api/customers error:', err.message)
            return res.status(500).json({ error: 'Failed to fetch customers' })
        }
    }

    // ── POST: Create customer ──
    if (req.method === 'POST') {
        try {
            const { full_name, email, phone, address, city, notes, status } = req.body

            if (!full_name?.trim()) {
                return res.status(400).json({ error: 'Customer name is required' })
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

            const { data, error } = await supabase
                .from('customers')
                .insert({
                    company_id: profile.company_id,
                    full_name: full_name.trim(),
                    email: email || null,
                    phone: phone || null,
                    address: address || null,
                    city: city || null,
                    notes: notes || null,
                    status: status || 'active',
                })
                .select()
                .single()

            if (error) throw error

            return res.status(201).json(data)
        } catch (err) {
            console.error('POST /api/customers error:', err.message)
            return res.status(500).json({ error: 'Failed to create customer' })
        }
    }
}
