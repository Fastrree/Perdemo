/**
 * /api/analytics/stats — GET aggregated analytics data
 * Provides: monthly revenue, monthly orders, top fabrics, KPI summary
 * Company isolation via getAuthContext → companyId
 */
import { getAuthContext, handlePreflight, db } from '../_lib/db.js'
import { orders, orderItems, products } from '../../db/schema.js'
import { eq, and, ne, gte, sql, asc } from 'drizzle-orm'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET'])) return

    const auth = await getAuthContext(req)
    if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message })

    try {
        const cid = auth.companyId
        const now = new Date()
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

        // Fetch orders — simple query, no joins
        let ordersData = []
        try {
            ordersData = await db.select({
                id: orders.id,
                total_amount: orders.total_amount,
                status: orders.status,
                created_at: orders.created_at,
            })
                .from(orders)
                .where(and(
                    eq(orders.company_id, cid),
                    ne(orders.status, 'cancelled'),
                    gte(orders.created_at, twelveMonthsAgo),
                ))
                .orderBy(asc(orders.created_at))
        } catch (e) {
            console.error('Analytics orders query failed:', e.message)
        }

        // Fetch order items with joins — separate try/catch
        let itemsData = []
        try {
            itemsData = await db.select({
                product_name: orderItems.product_name,
                quantity: orderItems.quantity,
                unit_price: orderItems.unit_price,
                fabric_type: orderItems.fabric_type,
            })
                .from(orderItems)
                .innerJoin(orders, eq(orderItems.order_id, orders.id))
                .where(and(
                    eq(orders.company_id, cid),
                    ne(orders.status, 'cancelled'),
                    gte(orders.created_at, twelveMonthsAgo),
                ))
        } catch (e) {
            console.error('Analytics items query failed:', e.message)
        }

        // Monthly Revenue & Order Count
        const monthlyData = {}
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            monthlyData[key] = { revenue: 0, orders: 0 }
        }

        for (const order of ordersData) {
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

        // Fabric Heatmap
        const fabricAgg = {}
        for (const item of itemsData) {
            const fabricType = item.fabric_type || item.product_name
            if (!fabricType) continue
            if (!fabricAgg[fabricType]) {
                fabricAgg[fabricType] = { name: fabricType, orders: 0, quantity: 0, revenue: 0 }
            }
            fabricAgg[fabricType].orders += 1
            fabricAgg[fabricType].quantity += Number(item.quantity || 0)
            fabricAgg[fabricType].revenue += Number(item.quantity || 0) * Number(item.unit_price || 0)
        }
        const fabricData = Object.values(fabricAgg)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8)

        // KPI Summary
        const totalRevenue = revenueData.reduce((s, v) => s + v, 0)
        const totalOrders = orderData.reduce((s, v) => s + v, 0)
        const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
        const currentMonthIdx = monthKeys.length - 1

        return res.status(200).json({
            revenueData,
            orderData,
            fabricData,
            currentMonthIdx,
            kpi: { totalRevenue, totalOrders, avgOrderValue },
        })
    } catch (err) {
        console.error('GET /api/analytics/stats error:', err.message, err.stack)
        return res.status(500).json({ error: 'Failed to fetch analytics stats', detail: err.message })
    }
}
