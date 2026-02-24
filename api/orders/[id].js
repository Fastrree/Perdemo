/**
 * /api/orders/[id] — GET (single + items) + PUT (update status) + DELETE (cancel + restore stock)
 * RLS automatically filters by user's company_id
 */
import { getUserClient, handlePreflight } from '../_lib/supabase.js'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET', 'PUT', 'DELETE'])) return

    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Order ID is required' })

    const { user, supabase, error: authError } = await getUserClient(req)
    if (authError) return res.status(authError.status).json({ error: authError.message })

    // ── GET: Single order with items + customer ──
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    customer:customers(id, full_name, email, phone, city),
                    items:order_items(
                        id, product_id, product_name, quantity,
                        unit_price, total_price, window_width, window_height, notes
                    )
                `)
                .eq('id', id)
                .single()

            if (error || !data) {
                return res.status(404).json({ error: 'Order not found' })
            }

            return res.status(200).json(data)
        } catch (err) {
            console.error('GET /api/orders/[id] error:', err.message)
            return res.status(500).json({ error: 'Failed to fetch order' })
        }
    }

    // ── PUT: Update order (status, payment_status, notes) ──
    if (req.method === 'PUT') {
        try {
            const { status, payment_status, notes } = req.body
            const updates = {}

            if (status) updates.status = status
            if (payment_status) updates.payment_status = payment_status
            if (notes !== undefined) updates.notes = notes
            updates.updated_at = new Date().toISOString()

            if (Object.keys(updates).length <= 1) {
                return res.status(400).json({ error: 'No update data provided' })
            }

            const { data, error } = await supabase
                .from('orders')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            if (!data) return res.status(404).json({ error: 'Order not found' })

            return res.status(200).json(data)
        } catch (err) {
            console.error('PUT /api/orders/[id] error:', err.message)
            return res.status(500).json({ error: 'Failed to update order' })
        }
    }

    // ── DELETE: Cancel order + restore stock ──
    if (req.method === 'DELETE') {
        try {
            // Get order with items before cancelling
            const { data: order, error: fetchError } = await supabase
                .from('orders')
                .select(`
                    *,
                    items:order_items(product_id, quantity)
                `)
                .eq('id', id)
                .single()

            if (fetchError || !order) {
                return res.status(404).json({ error: 'Order not found' })
            }

            if (order.status === 'cancelled') {
                return res.status(400).json({ error: 'Order is already cancelled' })
            }

            // Get user's company_id
            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single()

            // 1. Mark order as cancelled
            await supabase
                .from('orders')
                .update({
                    status: 'cancelled',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)

            // 2. Restore stock for each item
            for (const item of (order.items || [])) {
                if (!item.product_id) continue

                const qty = Number(item.quantity)

                const { data: product } = await supabase
                    .from('products')
                    .select('stock_meters')
                    .eq('id', item.product_id)
                    .single()

                if (product) {
                    const newStock = Number(product.stock_meters) + qty
                    const stock_status = newStock > 10 ? 'in_stock' : newStock > 0 ? 'low_stock' : 'out_of_stock'

                    await supabase
                        .from('products')
                        .update({
                            stock_meters: newStock,
                            stock_status,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', item.product_id)

                    // Record stock restoration
                    await supabase
                        .from('stock_movements')
                        .insert({
                            company_id: profile?.company_id,
                            product_id: item.product_id,
                            type: 'in',
                            quantity: qty,
                            reason: `Order ${order.order_number} cancelled`,
                            created_by: user.id,
                        })
                }
            }

            // 3. Update customer stats
            if (order.customer_id) {
                const { data: customer } = await supabase
                    .from('customers')
                    .select('total_orders, total_spent')
                    .eq('id', order.customer_id)
                    .single()

                if (customer) {
                    await supabase
                        .from('customers')
                        .update({
                            total_orders: Math.max(0, (customer.total_orders || 0) - 1),
                            total_spent: Math.max(0, Number(customer.total_spent || 0) - Number(order.total_amount)),
                        })
                        .eq('id', order.customer_id)
                }
            }

            return res.status(200).json({ message: 'Order cancelled', id })
        } catch (err) {
            console.error('DELETE /api/orders/[id] error:', err.message)
            return res.status(500).json({ error: 'Failed to cancel order' })
        }
    }
}
