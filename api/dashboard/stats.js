/**
 * /api/dashboard/stats — GET aggregated dashboard statistics
 * RLS automatically filters by user's company_id
 */
import { getUserClient, handlePreflight } from '../_lib/supabase.js'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET'])) return

    const { user, supabase, error: authError } = await getUserClient(req)
    if (authError) return res.status(authError.status).json({ error: authError.message })

    try {
        // Run all queries in parallel for performance
        const [
            productsRes,
            customersRes,
            ordersRes,
            revenueRes,
            pendingRes,
            lowStockRes,
            recentOrdersRes,
        ] = await Promise.all([
            // Total active products
            supabase
                .from('products')
                .select('id', { count: 'exact', head: true })
                .eq('is_active', true),

            // Total customers
            supabase
                .from('customers')
                .select('id', { count: 'exact', head: true }),

            // Total orders (exclude cancelled)
            supabase
                .from('orders')
                .select('id', { count: 'exact', head: true })
                .neq('status', 'cancelled'),

            // Total revenue (sum of non-cancelled orders)
            supabase
                .from('orders')
                .select('total_amount')
                .neq('status', 'cancelled'),

            // Pending orders count
            supabase
                .from('orders')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending'),

            // Low stock / out of stock products
            supabase
                .from('products')
                .select('id, name, stock_meters, stock_status')
                .eq('is_active', true)
                .in('stock_status', ['low_stock', 'out_of_stock'])
                .order('stock_meters', { ascending: true })
                .limit(10),

            // Recent 5 orders with customer name
            supabase
                .from('orders')
                .select(`
                    id, order_number, status, payment_status,
                    total_amount, created_at,
                    customer:customers(full_name)
                `)
                .order('created_at', { ascending: false })
                .limit(5),
        ])

        // Calculate total revenue
        const totalRevenue = (revenueRes.data || []).reduce(
            (sum, order) => sum + Number(order.total_amount || 0), 0
        )

        const stats = {
            totalProducts: productsRes.count || 0,
            totalCustomers: customersRes.count || 0,
            totalOrders: ordersRes.count || 0,
            totalRevenue,
            pendingOrders: pendingRes.count || 0,
            lowStockProducts: lowStockRes.data || [],
            recentOrders: (recentOrdersRes.data || []).map(order => ({
                ...order,
                customer_name: order.customer?.full_name || null,
                customer: undefined,
            })),
        }

        return res.status(200).json(stats)
    } catch (err) {
        console.error('GET /api/dashboard/stats error:', err.message)
        return res.status(500).json({ error: 'Failed to fetch dashboard stats' })
    }
}
