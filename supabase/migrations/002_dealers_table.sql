-- ═══════════════════════════════════════════════════════════
-- DEALERS TABLE — White Label Bayi Ağı
-- Supabase SQL Editor'da çalıştır
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dealers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    name TEXT NOT NULL,
    city TEXT,
    region TEXT,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    monthly_revenue NUMERIC(12,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_demos INTEGER DEFAULT 0,
    top_product TEXT,
    satisfaction NUMERIC(3,1) DEFAULT 0,
    markup_percent INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'warning', 'new', 'inactive')),
    lat NUMERIC(9,6),
    lng NUMERIC(9,6),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

-- Company isolation policies
CREATE POLICY "dealers_select" ON dealers
    FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY "dealers_insert" ON dealers
    FOR INSERT WITH CHECK (company_id = get_user_company_id());
CREATE POLICY "dealers_update" ON dealers
    FOR UPDATE USING (company_id = get_user_company_id());
CREATE POLICY "dealers_delete" ON dealers
    FOR DELETE USING (company_id = get_user_company_id());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_dealers_company ON dealers(company_id);
CREATE INDEX IF NOT EXISTS idx_dealers_status ON dealers(status);
