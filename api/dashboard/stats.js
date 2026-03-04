/**
 * /api/dashboard/stats — GET aggregated dashboard statistics
 * Company isolation via getAuthContext → companyId
 */
import { getAuthContext, handlePreflight, db } from '../_lib/db.js'
import { products, customers, orders, orderItems } from '../../db/schema.js'
import { eq, and, ne, sql, desc, asc, inArray } from 'drizzle-orm'

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET'])) return

    const auth = await getAuthContext(req)
    if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message })

    try {
        const cid = auth.companyId

        const [
            productCount,
            customerCount,
            orderCount,
            revenueRows,
            pendingCount,
            lowStockRows,
            recentOrderRows,
            topProductRows,
        ] = await Promise.all([
            // Total active products
            db.select({ count: sql`count(*)::int` })
                .from(products)
                .where(and(eq(products.company_id, cid), eq(products.is_active, true))),

            // Total customers
            db.select({ count: sql`count(*)::int` })
                .from(customers)
                .where(eq(customers.company_id, cid)),

            // Total orders (exclude cancelled)
            db.select({ count: sql`count(*)::int` })
                .from(orders)
                .where(and(eq(orders.company_id, cid), ne(orders.status, 'cancelled'))),

            // Revenue sum
            db.select({ total: sql`coalesce(sum(total_amount::numeric), 0)` })
                .from(orders)
                .where(and(eq(orders.company_id, cid), ne(orders.status, 'cancelled'))),

            // Pending orders
            db.select({ count: sql`count(*)::int` })
                .from(orders)
                .where(and(eq(orders.company_id, cid), eq(orders.status, 'pending'))),

            // Low stock products
            db.select({ id: products.id, name: products.name, stock_meters: products.stock_meters, stock_status: products.stock_status })
                .from(products)
                .where(and(
                    eq(products.company_id, cid),
                    eq(products.is_active, true),
                    inArray(products.stock_status, ['low_stock', 'out_of_stock']),
                ))
                .orderBy(asc(products.stock_meters))
                .limit(10),

            // Recent 5 orders with customer name
            db.select({
                id: orders.id,
                order_number: orders.order_number,
                status: orders.status,
                payment_status: orders.payment_status,
                total_amount: orders.total_amount,
                created_at: orders.created_at,
                customer_name: customers.full_name,
            })
                .from(orders)
                .leftJoin(customers, eq(orders.customer_id, customers.id))
                .where(eq(orders.company_id, cid))
                .orderBy(desc(orders.created_at))
                .limit(5),

            // Order items for top products (join orders to filter cancelled)
            db.select({
                product_name: orderItems.product_name,
                quantity: orderItems.quantity,
                unit_price: orderItems.unit_price,
            })
                .from(orderItems)
                .innerJoin(orders, eq(orderItems.order_id, orders.id))
                .where(and(eq(orders.company_id, cid), ne(orders.status, 'cancelled'))),
        ])

        // Aggregate top products
        const productAgg = {}
        for (const item of topProductRows) {
            const name = item.product_name
            if (!name) continue
            if (!productAgg[name]) productAgg[name] = { name, sales: 0, revenue: 0 }
            productAgg[name].sales += Number(item.quantity || 0)
            productAgg[name].revenue += Number(item.quantity || 0) * Number(item.unit_price || 0)
        }
        const topProducts = Object.values(productAgg)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5)

        const stats = {
            totalProducts: productCount[0]?.count || 0,
            totalCustomers: customerCount[0]?.count || 0,
            totalOrders: orderCount[0]?.count || 0,
            totalRevenue: Number(revenueRows[0]?.total || 0),
            pendingOrders: pendingCount[0]?.count || 0,
            lowStockProducts: lowStockRows,
            topProducts,
            recentOrders: recentOrderRows,
        }

        return res.status(200).json(stats)
    } catch (err) {
        console.error('GET /api/dashboard/stats error:', err.message)
        return res.status(500).json({ error: 'Failed to fetch dashboard stats' })
    }
}
