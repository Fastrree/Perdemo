/**
 * /api/analytics/stats — GET aggregated analytics data
 * Provides: monthly revenue, monthly orders, top fabrics, KPI summary
 * RLS automatically filters by user's company_id
 */
import { getUserClient, handlePreflight } from '../_lib/supabase.js'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET'])) return

    const { user, supabase, error: authError } = await getUserClient(req)
    if (authError) return res.status(authError.status).json({ error: authError.message })

    try {
        // Date range: last 12 months
        const now = new Date()
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
        const startDate = twelveMonthsAgo.toISOString()

        const [ordersRes, orderItemsRes] = await Promise.all([
            // All non-cancelled orders in the last 12 months
            supabase
                .from('orders')
                .select('id, total_amount, status, created_at')
                .neq('status', 'cancelled')
                .gte('created_at', startDate)
                .order('created_at', { ascending: true }),

            // All order items with product info (for fabric breakdown)
            supabase
                .from('order_items')
                .select(`
                    product_name, quantity, total_price,
                    product:products(fabric_type, color),
                    order:orders!inner(status, created_at)
                `)
                .neq('order.status', 'cancelled')
                .gte('order.created_at', startDate),
        ])

        // === Monthly Revenue & Order Count (last 12 months) ===
        const monthlyData = {}
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            monthlyData[key] = { revenue: 0, orders: 0 }
        }

        for (const order of (ordersRes.data || [])) {
            const d = new Date(order.created_at)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (monthlyData[key]) {
                monthlyData[key].revenue += Number(order.total_amount || 0)
                monthlyData[key].orders += 1
            }
        }

        const monthKeys = Object.keys(monthlyData).sort()
        const revenueData = monthKeys.map(k => Math.round(monthlyData[k].revenue))
        const orderData = monthKeys.map(k => monthlyData[k].orders)

        // === Fabric Heatmap (product grouping by fabric_type) ===
        const fabricAgg = {}
        for (const item of (orderItemsRes.data || [])) {
            const fabricType = item.product?.fabric_type || item.product_name
            if (!fabricAgg[fabricType]) {
                fabricAgg[fabricType] = { name: fabricType, orders: 0, quantity: 0, revenue: 0 }
            }
            fabricAgg[fabricType].orders += 1
            fabricAgg[fabricType].quantity += Number(item.quantity || 0)
            fabricAgg[fabricType].revenue += Number(item.total_price || 0)
        }
        const fabricData = Object.values(fabricAgg)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8)

        // === KPI Summary ===
        const totalRevenue = revenueData.reduce((s, v) => s + v, 0)
        const totalOrders = orderData.reduce((s, v) => s + v, 0)
        const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

        // Current month index (0-based within our 12-month window)
        const currentMonthIdx = monthKeys.length - 1

        return res.status(200).json({
            revenueData,
            orderData,
            fabricData,
            currentMonthIdx,
            kpi: {
                totalRevenue,
                totalOrders,
                avgOrderValue,
            },
        })
    } catch (err) {
        console.error('GET /api/analytics/stats error:', err.message)
        return res.status(500).json({ error: 'Failed to fetch analytics stats' })
    }
}
