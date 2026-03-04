/**
 * Drizzle Schema — Perdemo ERP
 * 
 * Mirrors the existing Supabase PostgreSQL tables exactly.
 * Used by Drizzle ORM for type-safe queries.
 */
import { pgTable, uuid, text, numeric, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core'

// ── Enums ──
export const stockStatusEnum = pgEnum('stock_status_enum', ['in_stock', 'low_stock', 'out_of_stock'])
export const orderStatusEnum = pgEnum('order_status_enum', ['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
export const paymentStatusEnum = pgEnum('payment_status_enum', ['pending', 'paid', 'partial', 'refunded'])
export const dealerStatusEnum = pgEnum('dealer_status_enum', ['active', 'warning', 'new', 'inactive'])

// ── Companies ──
export const companies = pgTable('companies', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').unique(),
    logo_url: text('logo_url'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ── Profiles (linked to auth users) ──
export const profiles = pgTable('profiles', {
    id: text('id').primaryKey(), // Clerk user_id (e.g. "user_2abc...")
    company_id: uuid('company_id').references(() => companies.id),
    full_name: text('full_name'),
    email: text('email'),
    role: text('role').default('owner'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ── Products ──
export const products = pgTable('products', {
    id: uuid('id').primaryKey().defaultRandom(),
    company_id: uuid('company_id').references(() => companies.id).notNull(),
    name: text('name').notNull(),
    category: text('category'),
    fabric_type: text('fabric_type'),
    color: text('color'),
    price_per_meter: numeric('price_per_meter', { precision: 10, scale: 2 }).default('0'),
    stock_meters: integer('stock_meters').default(0),
    stock_status: text('stock_status').default('in_stock'),
    image_url: text('image_url'),
    is_active: boolean('is_active').default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ── Customers ──
export const customers = pgTable('customers', {
    id: uuid('id').primaryKey().defaultRandom(),
    company_id: uuid('company_id').references(() => companies.id).notNull(),
    full_name: text('full_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    city: text('city'),
    total_orders: integer('total_orders').default(0),
    total_spent: numeric('total_spent', { precision: 12, scale: 2 }).default('0'),
    status: text('status').default('active'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ── Orders ──
export const orders = pgTable('orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    company_id: uuid('company_id').references(() => companies.id).notNull(),
    customer_id: uuid('customer_id').references(() => customers.id),
    order_number: text('order_number'),
    status: text('status').default('pending'),
    payment_status: text('payment_status').default('pending'),
    total_amount: numeric('total_amount', { precision: 12, scale: 2 }).default('0'),
    item_count: integer('item_count').default(0),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ── Order Items ──
export const orderItems = pgTable('order_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    order_id: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
    product_id: uuid('product_id').references(() => products.id),
    product_name: text('product_name'),
    fabric_type: text('fabric_type'),
    quantity: integer('quantity').default(1),
    unit_price: numeric('unit_price', { precision: 10, scale: 2 }).default('0'),
    width: numeric('width', { precision: 6, scale: 2 }),
    height: numeric('height', { precision: 6, scale: 2 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ── Dealers ──
export const dealers = pgTable('dealers', {
    id: uuid('id').primaryKey().defaultRandom(),
    company_id: uuid('company_id').references(() => companies.id).notNull(),
    name: text('name').notNull(),
    city: text('city'),
    region: text('region'),
    contact_name: text('contact_name'),
    phone: text('phone'),
    email: text('email'),
    monthly_revenue: numeric('monthly_revenue', { precision: 12, scale: 2 }).default('0'),
    total_orders: integer('total_orders').default(0),
    total_demos: integer('total_demos').default(0),
    top_product: text('top_product'),
    satisfaction: numeric('satisfaction', { precision: 3, scale: 1 }).default('0'),
    markup_percent: integer('markup_percent').default(0),
    status: text('status').default('active'),
    lat: numeric('lat', { precision: 9, scale: 6 }),
    lng: numeric('lng', { precision: 9, scale: 6 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ── User Preferences ──
export const userPreferences = pgTable('user_preferences', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: text('user_id').notNull().unique().references(() => profiles.id),
    company_id: uuid('company_id').references(() => companies.id),
    theme: text('theme').default('dark'),
    language: text('language').default('tr'),
    currency: text('currency').default('TRY'),
    notification_prefs: text('notification_prefs').default('{}'),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ── Notifications ──
export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: text('user_id').references(() => profiles.id),
    company_id: uuid('company_id').references(() => companies.id),
    type: text('type').default('info'),
    title: text('title').notNull(),
    message: text('message'),
    read: boolean('read').default(false),
    link: text('link'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
