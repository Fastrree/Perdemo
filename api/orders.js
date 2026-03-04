/**
 * /api/orders — GET, POST, PUT, DELETE
 */
import { getAuthContext, handlePreflight, db } from './_lib/db.js'
import { orders, orderItems, customers, products } from '../db/schema.js'
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm'

function generateOrderNumber() {
    const date = new Date()
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `ORD-${y}${m}${d}-${rand}`
}

export default async function handler(req, res) {
    if (handlePreflight(req, res, ['GET', 'POST', 'PUT', 'DELETE'])) return

    const auth = await getAuthContext(req)
    if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message })

    const { id, status, payment_status, search, hard, customer_id } = req.query
    const companyGuard = id ? and(eq(orders.id, id), eq(orders.company_id, auth.companyId)) : null

    // ── GET: List or Single ──
    if (req.method === 'GET') {
        try {
            if (id) {
                const [order] = await db
                    .select()
                    .from(orders)
                    .leftJoin(customers, eq(orders.customer_id, customers.id))
                    .where(companyGuard)
                    .limit(1)

                if (!order) return res.status(404).json({ error: 'Order not found' })

                const items = await db
                    .select()
                    .from(orderItems)
                    .where(eq(orderItems.order_id, id))

                return res.status(200).json({
                    ...order.orders,
                    customer: order.customers || null,
                    items,
                })
            }

            // List
            let conditions = [eq(orders.company_id, auth.companyId)]
            if (status) conditions.push(eq(orders.status, status))
            if (payment_status) conditions.push(eq(orders.payment_status, payment_status))
            if (customer_id) conditions.push(eq(orders.customer_id, customer_id))

            let searchCondition = undefined
            if (search) {
                searchCondition = or(
                    ilike(orders.order_number, `%${search}%`),
                    ilike(customers.full_name, `%${search}%`)
                )
            }

            const data = await db
                .select({
                    id: orders.id,
                    company_id: orders.company_id,
                    customer_id: orders.customer_id,
                    order_number: orders.order_number,
                    status: orders.status,
                    payment_status: orders.payment_status,
                    total_amount: orders.total_amount,
                    item_count: orders.item_count,
                    notes: orders.notes,
                    created_at: orders.created_at,
                    updated_at: orders.updated_at,
                    customer_name: customers.full_name,
                    product_name: orderItems.product_name,
                    width: orderItems.width,
                    height: orderItems.height,
                    quantity: orderItems.quantity,
                })
                .from(orders)
                .leftJoin(customers, eq(orders.customer_id, customers.id))
                .leftJoin(orderItems, eq(orders.id, orderItems.order_id))
                .where(searchCondition ? and(...conditions, searchCondition) : and(...conditions))
                .orderBy(desc(orders.created_at))

            const orderMap = new Map()
            for (const row of data) {
                if (!orderMap.has(row.id)) {
                    orderMap.set(row.id, {
                        ...row,
                        customers: row.customer_name ? { full_name: row.customer_name } : null,
                        customer_name: undefined,
                        items: []
                    })
                }
                const order = orderMap.get(row.id)
                if (row.product_name) {
                    order.items.push({
                        product_name: row.product_name,
                        width: row.width,
                        height: row.height,
                        quantity: row.quantity
                    })
                }
                delete order.product_name
                delete order.width
                delete order.height
                delete order.quantity
            }

            const result = Array.from(orderMap.values())
            return res.status(200).json(result)
        } catch (err) {
            console.error('GET /api/orders error:', err.message)
            return res.status(500).json({ error: 'Failed to fetch orders' })
        }
    }

    // ── POST: Create ──
    if (req.method === 'POST') {
        try {
            const { customer_id, customer_name, items, notes, status: orderStatus, payment_status } = req.body

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Order must have at least one item' })
            }

            let finalCustomerId = customer_id
            if (!finalCustomerId && customer_name) {
                const cName = customer_name.trim()
                const [existingCus] = await db.select().from(customers)
                    .where(and(eq(customers.company_id, auth.companyId), ilike(customers.full_name, cName))).limit(1)

                if (existingCus) {
                    finalCustomerId = existingCus.id
                } else {
                    const [newCus] = await db.insert(customers)
                        .values({ company_id: auth.companyId, full_name: cName }).returning()
                    finalCustomerId = newCus.id
                }
            }

            const total_amount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0)

            const [order] = await db
                .insert(orders)
                .values({
                    company_id: auth.companyId,
                    customer_id: finalCustomerId || null,
                    order_number: generateOrderNumber(),
                    status: orderStatus || 'pending',
                    payment_status: payment_status || 'pending',
                    total_amount: String(total_amount),
                    item_count: items.length,
                    notes: notes || null,
                })
                .returning()

            if (items.length > 0) {
                const itemValues = items.map(item => ({
                    order_id: order.id,
                    product_id: item.product_id || null,
                    product_name: item.product_name || null,
                    fabric_type: item.fabric_type || null,
                    quantity: Number(item.quantity) || 1,
                    unit_price: String(Number(item.unit_price) || 0),
                    width: item.width ? String(item.width) : null,
                    height: item.height ? String(item.height) : null,
                }))
                await db.insert(orderItems).values(itemValues)
            }

            // Update stock
            for (const item of items) {
                if (!item.product_id) continue
                const qty = Number(item.quantity)
                const [product] = await db.select({ stock_meters: products.stock_meters }).from(products).where(eq(products.id, item.product_id)).limit(1)

                if (product) {
                    const newStock = Math.max(0, Number(product.stock_meters) - qty)
                    const stock_status = newStock > 10 ? 'in_stock' : newStock > 0 ? 'low_stock' : 'out_of_stock'
                    await db.update(products).set({ stock_meters: newStock, stock_status, updated_at: sql`now()` }).where(eq(products.id, item.product_id))
                }
            }

            // Update customer stats
            if (customer_id) {
                const [customer] = await db.select({ total_orders: customers.total_orders, total_spent: customers.total_spent }).from(customers).where(eq(customers.id, customer_id)).limit(1)
                if (customer) {
                    await db.update(customers).set({
                        total_orders: (customer.total_orders || 0) + 1,
                        total_spent: String(Number(customer.total_spent || 0) + total_amount),
                    }).where(eq(customers.id, customer_id))
                }
            }

            return res.status(201).json(order)
        } catch (err) {
            console.error('POST /api/orders error:', err.message)
            return res.status(500).json({ error: 'Failed to create order' })
        }
    }

    // ── PUT: Update ──
    if (req.method === 'PUT') {
        if (!id) return res.status(400).json({ error: 'Order ID is required' })
        try {
            const body = req.body
            const updates = { updated_at: sql`now()` }

            if (body.status) updates.status = body.status
            if (body.payment_status) updates.payment_status = body.payment_status
            if (body.notes !== undefined) updates.notes = body.notes

            if (body.customer_name) {
                let finalCustomerId = null
                const cName = body.customer_name.trim()
                const [existingCus] = await db.select({ id: customers.id }).from(customers).where(and(eq(customers.company_id, auth.companyId), eq(customers.full_name, cName))).limit(1)

                if (existingCus) {
                    finalCustomerId = existingCus.id
                } else {
                    const [newCus] = await db.insert(customers).values({ company_id: auth.companyId, full_name: cName }).returning()
                    finalCustomerId = newCus.id
                }

                // Get old order to adjust customer totals and stock (if applicable in future)
                const [oldOrder] = await db.select().from(orders).where(and(companyGuard, eq(orders.id, id))).limit(1)

                if (oldOrder) {
                    const oldAmount = Number(oldOrder.total_amount) || 0
                    const newAmount = Number(body.total_amount) || 0

                    if (oldOrder.customer_id !== finalCustomerId || oldAmount !== newAmount) {
                        // Subtract old amount from old customer
                        if (oldOrder.customer_id) {
                            const [oldC] = await db.select({ total_orders: customers.total_orders, total_spent: customers.total_spent }).from(customers).where(eq(customers.id, oldOrder.customer_id)).limit(1)
                            if (oldC) {
                                await db.update(customers).set({
                                    total_orders: Math.max(0, (oldC.total_orders || 1) - 1),
                                    total_spent: String(Math.max(0, Number(oldC.total_spent || 0) - oldAmount))
                                }).where(eq(customers.id, oldOrder.customer_id))
                            }
                        }
                        // Add new amount to new customer
                        if (finalCustomerId) {
                            const [newC] = await db.select({ total_orders: customers.total_orders, total_spent: customers.total_spent }).from(customers).where(eq(customers.id, finalCustomerId)).limit(1)
                            if (newC) {
                                await db.update(customers).set({
                                    total_orders: (newC.total_orders || 0) + 1,
                                    total_spent: String(Number(newC.total_spent || 0) + newAmount)
                                }).where(eq(customers.id, finalCustomerId))
                            }
                        }
                    }
                }

                updates.customer_id = finalCustomerId
                updates.total_amount = String(body.total_amount || 0)

                // Update Order Items
                await db.update(orderItems).set({
                    product_name: body.product_name,
                    quantity: Number(body.quantity) || 1,
                    unit_price: String(Number(body.unit_price) || 0),
                    width: body.width ? String(body.width) : null,
                    height: body.height ? String(body.height) : null,
                }).where(eq(orderItems.order_id, id))
            }

            if (Object.keys(updates).length <= 1) return res.status(400).json({ error: 'No update data provided' })

            const [data] = await db.update(orders).set(updates).where(companyGuard).returning()
            if (!data) return res.status(404).json({ error: 'Order not found' })

            return res.status(200).json(data)
        } catch (err) {
            console.error('PUT /api/orders error:', err.message)
            return res.status(500).json({ error: 'Failed to update order' })
        }
    }

    // ── DELETE: Cancel and restore stock ──
    if (req.method === 'DELETE') {
        const companyIdGuard = eq(orders.company_id, auth.companyId)

        try {
            if (hard === 'all') {
                // Fetch all non-cancelled orders to restore stock
                const openOrders = await db.select({ id: orders.id }).from(orders).where(and(companyIdGuard, sql`${orders.status} != 'cancelled'`))
                const openOrderIds = openOrders.map(o => o.id)

                if (openOrderIds.length > 0) {
                    // Restore stocks
                    const itemsToRestore = await db.select({ product_id: orderItems.product_id, quantity: orderItems.quantity }).from(orderItems).where(sql`${orderItems.order_id} IN ${openOrderIds}`)
                    const stockUpdates = {}
                    itemsToRestore.forEach(item => {
                        if (item.product_id) {
                            stockUpdates[item.product_id] = (stockUpdates[item.product_id] || 0) + Number(item.quantity)
                        }
                    })

                    for (const [prodId, qty] of Object.entries(stockUpdates)) {
                        const [product] = await db.select({ stock_meters: products.stock_meters }).from(products).where(eq(products.id, prodId)).limit(1)
                        if (product) {
                            const newStock = Number(product.stock_meters) + qty
                            const stock_status = newStock > 10 ? 'in_stock' : newStock > 0 ? 'low_stock' : 'out_of_stock'
                            await db.update(products).set({ stock_meters: newStock, stock_status, updated_at: sql`now()` }).where(eq(products.id, prodId))
                        }
                    }
                }

                // Reset all customer total_orders and total_spent to 0 for this company
                await db.update(customers).set({ total_orders: 0, total_spent: '0' }).where(eq(customers.company_id, auth.companyId))

                // Delete all orders
                await db.delete(orders).where(companyIdGuard)
                return res.status(200).json({ message: 'All orders permanently deleted' })
            }

            if (!id) return res.status(400).json({ error: 'Order ID is required' })

            const [order] = await db.select().from(orders).where(companyGuard).limit(1)
            if (!order) return res.status(404).json({ error: 'Order not found' })
            if (order.status === 'cancelled' && !hard) return res.status(400).json({ error: 'Order is already cancelled' })

            if (hard === 'true') {
                if (order.status !== 'cancelled') {
                    const items = await db.select({ product_id: orderItems.product_id, quantity: orderItems.quantity }).from(orderItems).where(eq(orderItems.order_id, id))
                    for (const item of items) {
                        if (!item.product_id) continue
                        const qty = Number(item.quantity)
                        const [product] = await db.select({ stock_meters: products.stock_meters }).from(products).where(eq(products.id, item.product_id)).limit(1)

                        if (product) {
                            const newStock = Number(product.stock_meters) + qty
                            const stock_status = newStock > 10 ? 'in_stock' : newStock > 0 ? 'low_stock' : 'out_of_stock'
                            await db.update(products).set({ stock_meters: newStock, stock_status, updated_at: sql`now()` }).where(eq(products.id, item.product_id))
                        }
                    }

                    if (order.customer_id) {
                        const [customer] = await db.select({ total_orders: customers.total_orders, total_spent: customers.total_spent }).from(customers).where(eq(customers.id, order.customer_id)).limit(1)
                        if (customer) {
                            await db.update(customers).set({
                                total_orders: Math.max(0, (customer.total_orders || 0) - 1),
                                total_spent: String(Math.max(0, Number(customer.total_spent || 0) - Number(order.total_amount))),
                            }).where(eq(customers.id, order.customer_id))
                        }
                    }
                }

                await db.delete(orders).where(companyGuard)
                return res.status(200).json({ message: 'Order permanently deleted', id })
            }

            const items = await db.select({ product_id: orderItems.product_id, quantity: orderItems.quantity }).from(orderItems).where(eq(orderItems.order_id, id))

            await db.update(orders).set({ status: 'cancelled', updated_at: sql`now()` }).where(companyGuard)

            for (const item of items) {
                if (!item.product_id) continue
                const qty = Number(item.quantity)
                const [product] = await db.select({ stock_meters: products.stock_meters }).from(products).where(eq(products.id, item.product_id)).limit(1)

                if (product) {
                    const newStock = Number(product.stock_meters) + qty
                    const stock_status = newStock > 10 ? 'in_stock' : newStock > 0 ? 'low_stock' : 'out_of_stock'
                    await db.update(products).set({ stock_meters: newStock, stock_status, updated_at: sql`now()` }).where(eq(products.id, item.product_id))
                }
            }

            if (order.customer_id) {
                const [customer] = await db.select({ total_orders: customers.total_orders, total_spent: customers.total_spent }).from(customers).where(eq(customers.id, order.customer_id)).limit(1)
                if (customer) {
                    await db.update(customers).set({
                        total_orders: Math.max(0, (customer.total_orders || 0) - 1),
                        total_spent: String(Math.max(0, Number(customer.total_spent || 0) - Number(order.total_amount))),
                    }).where(eq(customers.id, order.customer_id))
                }
            }

            return res.status(200).json({ message: 'Order cancelled', id })
        } catch (err) {
            console.error('DELETE /api/orders error:', err.message)
            return res.status(500).json({ error: 'Failed to cancel order' })
        }
    }
}
