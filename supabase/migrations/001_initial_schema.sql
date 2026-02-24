-- ═══════════════════════════════════════════════════════════
-- PERDEMO DATABASE SCHEMA — Supabase SQL Editor'da çalıştır
-- ═══════════════════════════════════════════════════════════

-- 1. COMPANIES (Multi-tenant hazırlık)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROFILES (Supabase Auth ile bağlantılı)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'seller', 'viewer')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    fabric_type TEXT,
    color TEXT,
    price_per_meter NUMERIC(10,2) NOT NULL DEFAULT 0,
    stock_meters NUMERIC(10,2) DEFAULT 0,
    stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock')),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'vip')),
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    customer_id UUID REFERENCES customers(id),
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','partial','paid')),
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    window_width NUMERIC(6,1),
    window_height NUMERIC(6,1),
    notes TEXT
);

-- 7. STOCK MOVEMENTS (Audit trail)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    product_id UUID REFERENCES products(id),
    type TEXT NOT NULL CHECK (type IN ('in','out','adjustment')),
    quantity NUMERIC(10,2) NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES: Users can read/update their own profile
CREATE POLICY "users_read_own_profile" ON profiles
    FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_insert_own_profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- COMPANIES: Users can read their own company
CREATE POLICY "company_read" ON companies
    FOR SELECT USING (id = get_user_company_id());

-- PRODUCTS: Company isolation
CREATE POLICY "products_select" ON products
    FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY "products_insert" ON products
    FOR INSERT WITH CHECK (company_id = get_user_company_id());
CREATE POLICY "products_update" ON products
    FOR UPDATE USING (company_id = get_user_company_id());
CREATE POLICY "products_delete" ON products
    FOR DELETE USING (company_id = get_user_company_id());

-- CUSTOMERS: Company isolation
CREATE POLICY "customers_select" ON customers
    FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY "customers_insert" ON customers
    FOR INSERT WITH CHECK (company_id = get_user_company_id());
CREATE POLICY "customers_update" ON customers
    FOR UPDATE USING (company_id = get_user_company_id());
CREATE POLICY "customers_delete" ON customers
    FOR DELETE USING (company_id = get_user_company_id());

-- ORDERS: Company isolation
CREATE POLICY "orders_select" ON orders
    FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY "orders_insert" ON orders
    FOR INSERT WITH CHECK (company_id = get_user_company_id());
CREATE POLICY "orders_update" ON orders
    FOR UPDATE USING (company_id = get_user_company_id());
CREATE POLICY "orders_delete" ON orders
    FOR DELETE USING (company_id = get_user_company_id());

-- ORDER ITEMS: Access via parent order's company
CREATE POLICY "order_items_select" ON order_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.company_id = get_user_company_id())
    );
CREATE POLICY "order_items_insert" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.company_id = get_user_company_id())
    );
CREATE POLICY "order_items_update" ON order_items
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.company_id = get_user_company_id())
    );
CREATE POLICY "order_items_delete" ON order_items
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.company_id = get_user_company_id())
    );

-- STOCK MOVEMENTS: Company isolation
CREATE POLICY "stock_movements_select" ON stock_movements
    FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY "stock_movements_insert" ON stock_movements
    FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- ═══════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- ═══════════════════════════════════════════════════════════

-- This function runs after a new user signs up
-- It creates a company and profile automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_company_id UUID;
BEGIN
    -- Create a company for the new user
    INSERT INTO companies (name, slug)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'company_name', 'Firma'),
        LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'company_name', 'firma-' || LEFT(NEW.id::text, 8)), ' ', '-'))
    )
    RETURNING id INTO new_company_id;

    -- Create the user profile
    INSERT INTO profiles (id, company_id, full_name, role)
    VALUES (
        NEW.id,
        new_company_id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Kullanıcı'),
        'admin'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fires after auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- INDEXES for performance
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id);
