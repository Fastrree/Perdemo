# Perdemo — Master Task Checklist

## ✅ Tamamlanan İşler
- [x] i18n altyapısı (react-i18next, 13 namespace, TR+EN)
- [x] Sayfa entegrasyonları (13 sayfa + DesktopOnly + AppLayout)
- [x] AI prompt lokalizasyonu (aiProxy.js TR/EN dynamic)
- [x] Landing page tam lokalizasyon + LanguageSwitcher
- [x] Tooltip fix (header butonları aşağı yönlü)
- [x] ExcelJS rapor sistemi (2 sheet: Dashboard + Ham Veriler)
- [x] Profil menüsüne "Web Sitemizi Ziyaret Edin" linki

## Faz 1: Backend Temeli
- [x] Supabase proje kurulumu + env variables
- [x] @supabase/supabase-js install + client setup
- [x] Database schema (7 tablo: companies, profiles, products, customers, orders, order_items, stock_movements)
- [x] Row Level Security (RLS) policies
- [x] Auth sistemi
  - [x] AuthContext.jsx (React Context)
  - [x] Login.jsx sayfası
  - [x] Register.jsx sayfası
  - [x] ForgotPassword.jsx sayfası
  - [x] ProtectedRoute + App.jsx routing
- [x] CRUD API endpoints (Vercel Serverless)
  - [x] /api/products (GET, POST)
  - [x] /api/products/[id] (GET, PUT, DELETE)
  - [x] /api/customers (GET, POST)
  - [x] /api/customers/[id] (GET, PUT, DELETE)
  - [x] /api/orders (GET, POST)
  - [x] /api/orders/[id] (GET, PUT, DELETE)
  - [x] /api/dashboard/stats (GET)

## Faz 2: Frontend Bağlantısı
- [x] Shared altyapı
  - [x] `src/lib/apiClient.js` — JWT tabanlı fetch helper
  - [x] `src/hooks/useProducts.js` — Ürün CRUD hook
  - [x] `src/hooks/useCustomers.js` — Müşteri CRUD hook
  - [x] `src/hooks/useOrders.js` — Sipariş CRUD hook
  - [x] `src/hooks/useDashboard.js` — Dashboard istatistik hook
- [x] Dashboard → gerçek API verisi (KPI + son siparişler canlı, chart mock)
- [x] Products → Supabase CRUD (fabric_type→name, stock_meters→stock normalization)
- [x] Orders → DB write/read + status flow API'ye bağlı
- [x] Customers → kalıcı kayıt (full_name→name normalization)
- [x] InventoryOracle → gerçek envanter (ürün listesi canlı, algoritma mock)
- [x] Build doğrulama (`vite build` → ✅ başarılı)

## Faz 3: Gelişmiş Özellikler
- [ ] Role-based access control (admin/seller/viewer)
- [ ] Dosya upload (Supabase Storage — kumaş görselleri)
- [ ] Raporlama (gerçek DB verisi + tarih filtreleri)
- [ ] Multi-tenant (firma switcher, SaaS çoklu firma)
