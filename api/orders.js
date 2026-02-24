/**
 * /api/orders — GET (list) + POST (create with items + stock update)
 * RLS automatically filters by user's company_id
 */
import { getUserClient, handlePreflight } from './_lib/supabase.js'

/**
 * Generate unique order number: ORD-YYYYMMDD-XXXX
 */
function generateOrderNumber() {
    const date = new Date()
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `ORD-${y}${m}${d}-${rand}`
}

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET', 'POST'])) return

    const { user, supabase, error: authError } = await getUserClient(req)
    if (authError) return res.status(authError.status).json({ error: authError.message })

    // ── GET: List orders ──
    if (req.method === 'GET') {
        try {
            const { status, payment_status } = req.query

            let query = supabase
                .from('orders')
                .select(`
                    *,
                    customer:customers(id, full_name, email, phone),
                    items:order_items(count)
                `)
                .order('created_at', { ascending: false })

            if (status) {
                query = query.eq('status', status)
            }
            if (payment_status) {
                query = query.eq('payment_status', payment_status)
            }

            const { data, error } = await query
            if (error) throw error

            // Flatten item count
            const orders = (data || []).map(order => ({
                ...order,
                item_count: order.items?.[0]?.count || 0,
                items: undefined,
            }))

            return res.status(200).json(orders)
        } catch (err) {
            console.error('GET /api/orders error:', err.message)
            return res.status(500).json({ error: 'Failed to fetch orders' })
        }
    }

    // ── POST: Create order with items ──
    if (req.method === 'POST') {
        try {
            const { customer_id, items, notes, status, payment_status } = req.body

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Order must have at least one item' })
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

            // Calculate total
            const total_amount = items.reduce((sum, item) => {
                return sum + (Number(item.quantity) * Number(item.unit_price))
            }, 0)

            // 1. Create the order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    company_id: profile.company_id,
                    customer_id: customer_id || null,
                    order_number: generateOrderNumber(),
                    status: status || 'pending',
                    payment_status: payment_status || 'unpaid',
                    total_amount,
                    notes: notes || null,
                    created_by: user.id,
                })
                .select()
                .single()

            if (orderError) throw orderError

            // 2. Insert order items
            const orderItems = items.map(item => ({
                order_id: order.id,
                product_id: item.product_id || null,
                product_name: item.product_name,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                total_price: Number(item.quantity) * Number(item.unit_price),
                window_width: item.window_width || null,
                window_height: item.window_height || null,
                notes: item.notes || null,
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems)

            if (itemsError) {
                console.error('Order items insert error:', itemsError.message)
                // Don't fail the whole order — items may still be partially inserted
            }

            // 3. Update stock for each item that has a product_id
            for (const item of items) {
                if (!item.product_id) continue

                const qty = Number(item.quantity)

                // Decrease stock
                const { data: product } = await supabase
                    .from('products')
                    .select('stock_meters')
                    .eq('id', item.product_id)
                    .single()

                if (product) {
                    const newStock = Math.max(0, Number(product.stock_meters) - qty)
                    const stock_status = newStock > 10 ? 'in_stock' : newStock > 0 ? 'low_stock' : 'out_of_stock'

                    await supabase
                        .from('products')
                        .update({
                            stock_meters: newStock,
                            stock_status,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', item.product_id)

                    // Record stock movement
                    await supabase
                        .from('stock_movements')
                        .insert({
                            company_id: profile.company_id,
                            product_id: item.product_id,
                            type: 'out',
                            quantity: qty,
                            reason: `Order ${order.order_number}`,
                            created_by: user.id,
                        })
                }
            }

            // 4. Update customer stats if customer_id provided
            if (customer_id) {
                const { data: customer } = await supabase
                    .from('customers')
                    .select('total_orders, total_spent')
                    .eq('id', customer_id)
                    .single()

                if (customer) {
                    await supabase
                        .from('customers')
                        .update({
                            total_orders: (customer.total_orders || 0) + 1,
                            total_spent: Number(customer.total_spent || 0) + total_amount,
                        })
                        .eq('id', customer_id)
                }
            }

            return res.status(201).json(order)
        } catch (err) {
            console.error('POST /api/orders error:', err.message)
            return res.status(500).json({ error: 'Failed to create order' })
        }
    }
}
