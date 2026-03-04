import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useOrders } from '../hooks/useOrders'
import { useCurrency } from '../hooks/useCurrency'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/apiClient'



const statusMap = {
    pending: { label: 'Beklemede', cls: 'badge-warning', icon: '⏳' },
    processing: { label: 'Hazırlanıyor', cls: 'badge-info', icon: '🔧' },
    shipped: { label: 'Kargoda', cls: 'badge-purple', icon: '🚚' },
    delivered: { label: 'Teslim Edildi', cls: 'badge-success', icon: '✅' },
    cancelled: { label: 'İptal', cls: 'badge-danger', icon: '❌' },
}

const paymentMap = {
    paid: { label: 'Ödendi', cls: 'badge-success' },
    pending: { label: 'Bekliyor', cls: 'badge-warning' },
    refunded: { label: 'İade', cls: 'badge-danger' },
}

const statusFlow = ['pending', 'processing', 'shipped', 'delivered']
const statusFilters = ['Tümü', 'Beklemede', 'Hazırlanıyor', 'Kargoda', 'Teslim Edildi', 'İptal']

const kpiConfig = [
    { key: 'totalOrders', label: 'Toplam Sipariş', icon: '📦', color: 'rgba(88, 166, 255, 0.12)', accent: 'var(--accent-blue)' },
    { key: 'totalRevenue', label: 'Toplam Gelir', icon: '💰', color: 'rgba(139, 92, 246, 0.12)', accent: '#bc8cff' },
    { key: 'pendingCount', label: 'Beklemede', icon: '⏳', color: 'rgba(251, 191, 36, 0.12)', accent: '#fbbf24' },
    { key: 'deliveredCount', label: 'Teslim Edildi', icon: '✅', color: 'rgba(74, 222, 128, 0.12)', accent: '#4ade80' },
]

const formLabelStyle = {
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--text-tertiary)',
    marginBottom: '6px',
    display: 'block',
}

/* Gradient accents for KPI cards */
const kpiGradients = [
    'linear-gradient(135deg, #58a6ff, #3b82f6)',
    'linear-gradient(135deg, #bc8cff, #8b5cf6)',
    'linear-gradient(135deg, #fbbf24, #f59e0b)',
    'linear-gradient(135deg, #4ade80, #22c55e)',
]

/* Payment color map for enhanced styling */
const paymentColorMap = {
    paid: { bg: 'rgba(74, 222, 128, 0.08)', border: 'rgba(74, 222, 128, 0.25)', glow: 'rgba(74, 222, 128, 0.12)' },
    pending: { bg: 'rgba(251, 191, 36, 0.08)', border: 'rgba(251, 191, 36, 0.25)', glow: 'rgba(251, 191, 36, 0.12)' },
    refunded: { bg: 'rgba(248, 113, 113, 0.08)', border: 'rgba(248, 113, 113, 0.25)', glow: 'rgba(248, 113, 113, 0.12)' },
}

/* Status filter label → key lookup */
const filterLabelToKey = {
    'Tümü': null,
    'Beklemede': 'pending',
    'Hazırlanıyor': 'processing',
    'Kargoda': 'shipped',
    'Teslim Edildi': 'delivered',
    'İptal': 'cancelled',
}

export default function Orders() {
    const { t } = useTranslation('orders')
    const { getToken } = useAuth()
    const { orders: rawOrders, loading, error, fetchOrders, createOrder, updateOrder, deleteOrder } = useOrders()
    const { formatMoney, symbol } = useCurrency()

    // Normalize DB fields to match UI expectations
    const orders = useMemo(() => rawOrders.map(o => {
        const firstItem = o.items?.[0]
        const productText = firstItem?.product_name || (o.item_count ? `${o.item_count} ürün` : 'Bilinmiyor')
        const w = firstItem?.width ? String(firstItem.width) : '-'
        const h = firstItem?.height ? String(firstItem.height) : '-'
        const itemQty = firstItem?.quantity || o.item_count || 1

        return {
            ...o,
            id: o.order_number || o.id,
            customer: o.customers?.full_name || o.customer_name || 'Bilinmiyor',
            product: productText,
            qty: itemQty,
            width: w,
            height: h,
            amount: o.total_amount || 0,
            status: o.status || 'pending',
            date: o.created_at ? new Date(o.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
            payment: o.payment_status || 'pending',
            _id: o.id, // Keep original UUID for API calls
        }
    }), [rawOrders])

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [expandedOrder, setExpandedOrder] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingOrderId, setEditingOrderId] = useState(null)
    const [form, setForm] = useState({ customer: '', product: '', qty: '1', width: '', height: '', amount: '' })
    const [amountDisplay, setAmountDisplay] = useState('')
    const [initialForm, setInitialForm] = useState(null)
    const [saving, setSaving] = useState(false)

    // Server-side filtering for search, client-side for status
    const searchTimer = useRef(null)
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => {
            const filters = {}
            if (search) filters.search = search
            fetchOrders(filters)
        }, 300)
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
    }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

    const filtered = useMemo(() => {
        const key = filterLabelToKey[statusFilter]
        if (!key) return orders
        return orders.filter(o => o.status === key)
    }, [orders, statusFilter])

    const kpiValues = useMemo(() => {
        const totalOrders = orders.length
        const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0)
        const pendingCount = orders.filter(o => o.status === 'pending').length
        const deliveredCount = orders.filter(o => o.status === 'delivered').length
        return { totalOrders, totalRevenue, pendingCount, deliveredCount }
    }, [orders])

    const kpiDisplay = useMemo(() => ({
        totalOrders: String(kpiValues.totalOrders),
        totalRevenue: formatMoney(kpiValues.totalRevenue),
        pendingCount: String(kpiValues.pendingCount),
        deliveredCount: String(kpiValues.deliveredCount),
    }), [kpiValues])

    /* Count per status for filter badges */
    const statusCounts = useMemo(() => {
        const counts = { total: orders.length }
        orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1 })
        return counts
    }, [orders])

    const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0)

    const advanceStatus = useCallback(async (order) => {
        const currentIdx = statusFlow.indexOf(order.status)
        if (currentIdx < 0 || currentIdx >= statusFlow.length - 1) return
        const newStatus = statusFlow[currentIdx + 1]
        await updateOrder(order._id, { status: newStatus })
    }, [updateOrder])

    const cancelOrder = useCallback(async (order) => {
        await deleteOrder(order._id)
    }, [deleteOrder])

    const hardDeleteOrder = useCallback(async (order) => {
        if (!window.confirm('Bu siparişi silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return
        const { error: err } = await apiFetch(`/api/orders?id=${order._id}&hard=true`, {
            getToken,
            method: 'DELETE',
        })
        if (err) return alert(err)
        fetchOrders({ search })
    }, [getToken, fetchOrders, search])

    const deleteAllOrders = useCallback(async () => {
        if (!window.confirm('Tüm siparişlerinizi tamamen silmek istediğinize emin misiniz? Bu işlem şirketinize ait tüm sipariş geçmişini geri dönülemez şekilde yok edecektir!')) return
        const promptReset = window.prompt('Bu işlemi onaylamak için lütfen "LİSTEYİ TEMİZLE" yazın:')
        if (promptReset !== 'LİSTEYİ TEMİZLE') {
            alert('İşlem iptal edildi.')
            return
        }

        setSaving(true)
        const { error: err } = await apiFetch(`/api/orders?hard=all`, {
            getToken,
            method: 'DELETE',
        })
        setSaving(false)

        if (err) return alert(err)
        fetchOrders({ search })
    }, [getToken, fetchOrders, search, setSaving])

    const openNewOrderModal = useCallback(() => {
        setEditingOrderId(null)
        setInitialForm(null)
        setForm({ customer: '', product: '', qty: '1', width: '', height: '', amount: '' })
        setAmountDisplay('')
        setModalOpen(true)
    }, [])

    const openEditModal = useCallback((order) => {
        setEditingOrderId(order._id)
        const amtStr = String(order.amount || '')
        const newForm = {
            customer: order.customer || '',
            product: order.product || '',
            qty: String(order.qty || '1'),
            width: order.width || '',
            height: order.height || '',
            amount: amtStr,
        }
        setForm(newForm)
        setInitialForm(newForm)

        // Format for display
        if (amtStr && !isNaN(parseFloat(amtStr))) {
            const formatted = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(parseFloat(amtStr))
            setAmountDisplay(formatted)
        } else {
            setAmountDisplay('')
        }

        setModalOpen(true)
    }, [])

    const handleSaveOrder = useCallback(async () => {
        if (!form.customer.trim() || !form.product.trim()) return alert(t('form.customerProductRequired'))

        if (editingOrderId && initialForm) {
            const hasChanges = Object.keys(initialForm).some(key => form[key] !== initialForm[key])
            if (!hasChanges) {
                return alert('Herhangi bir değişiklik yapmadınız. Lütfen güncellemek için en az 1 veriyi güncelleyin.')
            }
        }

        setSaving(true)

        if (editingOrderId) {
            // Edit Mode - PUT request to backend
            const { error: err } = await apiFetch(`/api/orders?id=${editingOrderId}`, {
                method: 'PUT',
                getToken,
                body: {
                    customer_name: form.customer.trim(),
                    product_name: form.product.trim(),
                    quantity: parseInt(form.qty) || 1,
                    unit_price: parseFloat(form.amount) || 0,
                    total_amount: parseFloat(form.amount) || 0,
                    width: form.width || null,
                    height: form.height || null,
                    notes: `${form.width || '-'} × ${form.height || '-'}`,
                }
            })
            setSaving(false)
            if (err) return alert(err)
        } else {
            // Create Mode - POST request
            const { error: err } = await createOrder({
                customer_name: form.customer.trim(),
                items: [{
                    product_name: form.product.trim(),
                    quantity: parseInt(form.qty) || 1,
                    unit_price: parseFloat(form.amount) || 0,
                    width: form.width || null,
                    height: form.height || null,
                }],
                total_amount: parseFloat(form.amount) || 0,
                notes: `${form.width || '-'} × ${form.height || '-'}`,
            })
            setSaving(false)
            if (err) return alert(err)
        }

        await fetchOrders({ search }) // Refresh list with active filters

        setModalOpen(false)
        setEditingOrderId(null)
        setForm({ customer: '', product: '', qty: '1', width: '', height: '', amount: '' })
        setAmountDisplay('')
    }, [form, createOrder, fetchOrders, search, t, editingOrderId, getToken])

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid var(--border-primary)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)' }}>Siparişler yükleniyor...</span>
        </div>
    )

    if (error) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: '2.5rem' }}>⚠️</span>
            <span style={{ fontSize: '0.95rem', color: '#f87171', fontWeight: 600 }}>{error}</span>
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>Tekrar Dene</button>
        </div>
    )

    return (
        <div>
            {/* ═══ Page Header — Gradient title + subtitle + glow CTA ═══ */}
            <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                marginBottom: '32px', flexWrap: 'wrap', gap: '16px',
            }}>
                <div>
                    <h1 style={{
                        fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800,
                        background: 'var(--gradient-brand)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text', lineHeight: 1.15, marginBottom: '6px',
                    }}>Siparişler</h1>
                    <p style={{
                        fontSize: '0.92rem', color: 'var(--text-secondary)', display: 'flex',
                        alignItems: 'center', gap: '8px',
                    }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '3px 10px', borderRadius: 'var(--radius-full)',
                            background: 'rgba(88, 166, 255, 0.08)', border: '1px solid rgba(88, 166, 255, 0.15)',
                            fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-blue)',
                        }}>
                            <span style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: 'var(--accent-blue)',
                                animation: 'gentle-pulse 2s ease-in-out infinite',
                            }} />
                            {orders.length} {t('activeOrders')}
                        </span>
                        <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                        {t('total')}: {formatMoney(totalAmount)}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className="btn btn-secondary"
                        style={{
                            padding: '12px 20px', fontSize: '0.9rem',
                            color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)', fontWeight: 600,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)'
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.2)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                        onClick={deleteAllOrders}>
                        🔥 Listeyi Temizle
                    </button>
                    <button className="btn btn-primary btn-lg" onClick={openNewOrderModal}
                        style={{
                            boxShadow: '0 6px 28px rgba(88, 166, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.18)',
                            letterSpacing: '0.02em',
                        }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        {t('addOrder')}
                    </button>
                </div>
            </div>

            {/* ═══ KPI Summary Cards — Glassmorphism + Gradient Accent ═══ */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px', marginBottom: '28px',
            }}>
                {kpiConfig.map((kpi, i) => (
                    <div key={kpi.key} className="animate-fade-in-up" style={{
                        animationDelay: `${i * 0.07}s`,
                        padding: '24px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-glass)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        border: '1px solid var(--border-primary)',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'default',
                    }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-4px)'
                            e.currentTarget.style.borderColor = 'var(--border-accent)'
                            e.currentTarget.style.boxShadow = 'var(--shadow-lg), var(--shadow-glow)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.borderColor = 'var(--border-primary)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                    >
                        {/* Animated gradient accent bar at top */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                            background: kpiGradients[i],
                            backgroundSize: '200% 100%',
                            animation: 'gradient-shift 3s ease-in-out infinite',
                        }} />
                        {/* Corner glow orb */}
                        <div style={{
                            position: 'absolute', top: -30, right: -30,
                            width: '100px', height: '100px', borderRadius: '50%',
                            background: kpi.color, filter: 'blur(28px)',
                            opacity: 0.6, pointerEvents: 'none',
                        }} />
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            marginBottom: '14px', position: 'relative',
                        }}>
                            {/* Icon area with glow background */}
                            <div style={{
                                width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                                background: kpi.color, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '1.5rem',
                                boxShadow: `0 0 20px ${kpi.color}`,
                                transition: 'transform 0.25s ease',
                            }}>{kpi.icon}</div>
                            <span style={{
                                fontSize: '0.7rem', color: 'var(--text-tertiary)',
                                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                            }}>{kpi.label}</span>
                        </div>
                        {/* Large value with accent color + counter animation reference */}
                        <div style={{
                            fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-display)',
                            color: kpi.accent, position: 'relative',
                            animation: 'counter-up 0.6s ease-out both',
                            animationDelay: `${i * 0.1 + 0.2}s`,
                        }}>
                            {kpiDisplay[kpi.key]}
                        </div>
                    </div>
                ))}
            </div>

            {/* ═══ Filters — Status tabs with count badges + Search with glow ═══ */}
            <div style={{
                display: 'flex', gap: '14px', marginBottom: '24px',
                flexWrap: 'wrap', alignItems: 'center',
            }}>
                <div className="search-bar" style={{ maxWidth: '300px', flex: '1 1 240px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input type="search" className="input input-with-icon"
                        placeholder="Sipariş, müşteri ara..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        aria-label="Sipariş ara" />
                </div>
                {/* Status filter tabs with count badges */}
                <div style={{
                    display: 'flex', gap: '4px', padding: '4px',
                    background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)',
                    flexWrap: 'wrap', border: '1px solid var(--border-secondary)',
                }}>
                    {statusFilters.map(s => {
                        const filterKey = filterLabelToKey[s]
                        const count = filterKey ? (statusCounts[filterKey] || 0) : statusCounts.total
                        return (
                            <button key={s}
                                className={`btn ${statusFilter === s ? 'btn-secondary' : 'btn-ghost'}`}
                                style={{
                                    fontSize: '0.78rem', padding: '6px 14px', minHeight: '34px',
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    borderColor: statusFilter === s ? 'var(--border-accent)' : 'transparent',
                                    transition: 'all 0.2s ease',
                                }}
                                onClick={() => setStatusFilter(s)}>
                                {s}
                                <span style={{
                                    fontSize: '0.65rem', fontWeight: 700,
                                    padding: '1px 7px', borderRadius: 'var(--radius-full)',
                                    background: statusFilter === s
                                        ? 'rgba(88, 166, 255, 0.15)'
                                        : 'rgba(255,255,255,0.06)',
                                    color: statusFilter === s
                                        ? 'var(--accent-blue)'
                                        : 'var(--text-tertiary)',
                                    minWidth: '20px', textAlign: 'center',
                                    transition: 'all 0.2s ease',
                                }}>{count}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ═══ Orders Table ═══ */}
            {filtered.length === 0 ? (
                /* ═══ Enhanced Empty State ═══ */
                <div style={{
                    minHeight: '360px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                    padding: '48px 24px',
                    background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                    border: '2px dashed var(--border-primary)',
                    borderRadius: 'var(--radius-xl)',
                    animation: 'fadeIn 0.4s ease-out',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* Decorative floating orbs */}
                    <div style={{
                        position: 'absolute', top: '20%', left: '15%',
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'rgba(88, 166, 255, 0.05)', filter: 'blur(30px)',
                        animation: 'float 5s ease-in-out infinite',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '20%', right: '15%',
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: 'rgba(188, 140, 255, 0.05)', filter: 'blur(25px)',
                        animation: 'float 4s ease-in-out infinite 1s',
                        pointerEvents: 'none',
                    }} />
                    {/* Icon with animation */}
                    <div style={{
                        fontSize: '4rem', marginBottom: '20px', opacity: 0.5,
                        animation: 'float 4s ease-in-out infinite',
                    }}>📦</div>
                    {/* Decorative line */}
                    <div style={{
                        width: '60px', height: '3px', borderRadius: '2px',
                        background: 'var(--gradient-brand)', marginBottom: '16px',
                        opacity: 0.5,
                    }} />
                    <div style={{
                        fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px',
                        color: 'var(--text-primary)',
                    }}>Sipariş bulunamadı</div>
                    <div style={{
                        fontSize: '0.88rem', color: 'var(--text-secondary)',
                        maxWidth: '380px', lineHeight: 1.6,
                    }}>Arama kriterlerinize uygun sipariş yok. Farklı bir filtre deneyin veya yeni sipariş oluşturun.</div>
                    <button className="btn btn-secondary" style={{ marginTop: '20px' }}
                        onClick={() => { setSearch(''); setStatusFilter('Tümü') }}>
                        Filtreleri Temizle
                    </button>
                </div>
            ) : (
                <div className="table-container" style={{ overflowX: 'auto' }}>
                    <table className="table" role="table" style={{ minWidth: '780px' }}>
                        <thead>
                            <tr>
                                <th scope="col" style={{ padding: '14px 20px' }}>Sipariş No</th>
                                <th scope="col" style={{ padding: '14px 20px' }}>Müşteri</th>
                                <th scope="col" style={{ padding: '14px 20px' }}>Ürün</th>
                                <th scope="col" style={{ padding: '14px 20px' }}>Adet</th>
                                <th scope="col" style={{ padding: '14px 20px' }}>Ölçüler</th>
                                <th scope="col" style={{ padding: '14px 20px' }}>Tutar</th>
                                <th scope="col" style={{ padding: '14px 20px' }}>Ödeme</th>
                                <th scope="col" style={{ padding: '14px 20px' }}>Durum</th>
                                <th scope="col" style={{ padding: '14px 20px' }}>Tarih</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(order => {
                                const isExpanded = expandedOrder === order.id
                                const statusInfo = statusMap[order.status]
                                const paymentInfo = paymentMap[order.payment]
                                const paymentColors = paymentColorMap[order.payment]
                                return (
                                    <>
                                        <tr key={order.id}
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                borderLeft: isExpanded
                                                    ? '3px solid var(--accent-blue)'
                                                    : '3px solid transparent',
                                            }}
                                            onMouseEnter={e => {
                                                if (!isExpanded) {
                                                    e.currentTarget.style.borderLeftColor = 'var(--accent-purple)'
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!isExpanded) {
                                                    e.currentTarget.style.borderLeftColor = 'transparent'
                                                }
                                            }}
                                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                                            <td style={{ padding: '14px 20px', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '0.88rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        fontSize: '0.65rem', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: '20px', height: '20px', borderRadius: 'var(--radius-sm)',
                                                        background: isExpanded ? 'rgba(88, 166, 255, 0.1)' : 'transparent',
                                                        color: isExpanded ? 'var(--accent-blue)' : 'var(--text-tertiary)',
                                                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                    }}>▶</span>
                                                    <span style={{ color: 'var(--accent-blue)' }}>{order.id}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="avatar avatar-sm">{order.customer.split(' ').map(n => n[0]).join('')}</div>
                                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{order.customer}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{order.product}</td>
                                            <td style={{
                                                padding: '14px 20px', fontWeight: 600,
                                                fontFamily: 'var(--font-display)', fontSize: '0.9rem',
                                            }}>{order.qty}</td>
                                            <td style={{
                                                padding: '14px 20px', fontSize: '0.8rem',
                                                color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)',
                                            }}>{order.width ? `${order.width} cm` : '-'} × {order.height ? `${order.height} cm` : '-'}</td>
                                            <td style={{
                                                padding: '14px 20px', fontWeight: 700,
                                                fontFamily: 'var(--font-display)', fontSize: '0.95rem',
                                                color: 'var(--text-primary)',
                                            }}>{formatMoney(order.amount)}</td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span className={`badge ${paymentInfo.cls}`}
                                                    style={{
                                                        boxShadow: `0 0 12px ${paymentColors.glow}`,
                                                    }}>
                                                    {paymentInfo.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span className={`badge ${statusInfo.cls}`}
                                                    style={{
                                                        boxShadow: order.status === 'processing'
                                                            ? '0 0 14px rgba(59, 130, 246, 0.15)'
                                                            : order.status === 'shipped'
                                                                ? '0 0 14px rgba(188, 140, 255, 0.15)'
                                                                : undefined,
                                                    }}>
                                                    {statusInfo.icon} {statusInfo.label}
                                                </span>
                                            </td>
                                            <td style={{
                                                padding: '14px 20px', color: 'var(--text-tertiary)',
                                                fontSize: '0.82rem',
                                            }}>{order.date}</td>
                                        </tr>
                                        {/* ═══ Expanded Detail Row ═══ */}
                                        {isExpanded && (
                                            <tr key={`${order.id}-detail`}>
                                                <td colSpan="9" style={{ padding: 0, borderTop: 'none' }}>
                                                    <div style={{
                                                        padding: '28px 32px',
                                                        background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, rgba(13,17,23,0.6) 100%)',
                                                        borderTop: '1px solid var(--border-primary)',
                                                        borderLeft: '3px solid var(--accent-blue)',
                                                        animation: 'fadeInUp 0.3s ease-out',
                                                    }}>
                                                        <div style={{
                                                            display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap',
                                                        }}>
                                                            {/* ── Status Timeline ── */}
                                                            <div style={{ flex: 1, minWidth: '280px' }}>
                                                                <div style={{
                                                                    fontSize: '0.72rem', fontWeight: 700, marginBottom: '18px',
                                                                    color: 'var(--text-tertiary)', textTransform: 'uppercase',
                                                                    letterSpacing: '0.06em', display: 'flex',
                                                                    alignItems: 'center', gap: '8px',
                                                                }}>
                                                                    <span style={{
                                                                        width: '4px', height: '14px', borderRadius: '2px',
                                                                        background: 'var(--gradient-brand)',
                                                                    }} />
                                                                    Sipariş Durumu
                                                                </div>
                                                                <div style={{
                                                                    display: 'flex', gap: '0px', alignItems: 'center',
                                                                }}>
                                                                    {statusFlow.map((s, i) => {
                                                                        const current = statusFlow.indexOf(order.status)
                                                                        const isActive = i <= current
                                                                        const isCurrent = i === current
                                                                        const isPast = i < current
                                                                        return (
                                                                            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                                                                                <div style={{
                                                                                    display: 'flex', flexDirection: 'column',
                                                                                    alignItems: 'center', gap: '8px',
                                                                                }}>
                                                                                    {/* Step indicator */}
                                                                                    <div style={{
                                                                                        width: '42px', height: '42px', borderRadius: '50%',
                                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                        background: isCurrent
                                                                                            ? 'var(--gradient-brand)'
                                                                                            : isPast
                                                                                                ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.85), rgba(34, 197, 94, 0.95))'
                                                                                                : 'var(--bg-secondary)',
                                                                                        border: isCurrent
                                                                                            ? 'none'
                                                                                            : isPast
                                                                                                ? '2px solid rgba(74, 222, 128, 0.4)'
                                                                                                : '2px solid var(--border-primary)',
                                                                                        fontSize: isPast ? '0.8rem' : '0.9rem',
                                                                                        color: isActive ? '#fff' : 'var(--text-tertiary)',
                                                                                        fontWeight: 700,
                                                                                        transition: 'all 0.3s ease',
                                                                                        boxShadow: isCurrent
                                                                                            ? '0 0 20px rgba(88, 166, 255, 0.45), 0 0 40px rgba(88, 166, 255, 0.15)'
                                                                                            : isPast
                                                                                                ? '0 0 12px rgba(74, 222, 128, 0.25)'
                                                                                                : 'none',
                                                                                        animation: isCurrent ? 'pulse-glow 2.5s ease-in-out infinite' : 'none',
                                                                                        position: 'relative',
                                                                                    }}>
                                                                                        {/* Checkmark overlay for completed steps */}
                                                                                        {isPast ? '✓' : statusMap[s].icon}
                                                                                    </div>
                                                                                    <span style={{
                                                                                        fontSize: '0.65rem', fontWeight: 700,
                                                                                        color: isCurrent
                                                                                            ? 'var(--accent-blue)'
                                                                                            : isPast
                                                                                                ? '#4ade80'
                                                                                                : 'var(--text-tertiary)',
                                                                                        whiteSpace: 'nowrap',
                                                                                        letterSpacing: '0.02em',
                                                                                    }}>{statusMap[s].label}</span>
                                                                                </div>
                                                                                {/* Gradient connecting line */}
                                                                                {i < statusFlow.length - 1 && (
                                                                                    <div style={{
                                                                                        width: '40px', height: '3px',
                                                                                        borderRadius: '2px',
                                                                                        background: i < current
                                                                                            ? 'linear-gradient(90deg, #4ade80, #22c55e, #58a6ff)'
                                                                                            : i === current
                                                                                                ? 'linear-gradient(90deg, var(--accent-blue), var(--border-primary))'
                                                                                                : 'var(--border-primary)',
                                                                                        marginBottom: '24px',
                                                                                        marginLeft: '6px', marginRight: '6px',
                                                                                        transition: 'all 0.3s ease',
                                                                                        boxShadow: i < current
                                                                                            ? '0 0 6px rgba(74, 222, 128, 0.3)'
                                                                                            : 'none',
                                                                                    }} />
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* ── Action Buttons ── */}
                                                            <div style={{
                                                                display: 'flex', gap: '10px', flexShrink: 0,
                                                                alignItems: 'center', flexWrap: 'wrap',
                                                            }}>
                                                                <button className="btn btn-secondary"
                                                                    style={{
                                                                        fontSize: '0.82rem', padding: '10px 22px',
                                                                        color: 'var(--accent-blue)',
                                                                        borderColor: 'rgba(88, 166, 255, 0.35)',
                                                                        fontWeight: 600,
                                                                    }}
                                                                    onMouseEnter={e => {
                                                                        e.currentTarget.style.background = 'rgba(88, 166, 255, 0.1)'
                                                                        e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.6)'
                                                                    }}
                                                                    onMouseLeave={e => {
                                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                                                                        e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.35)'
                                                                    }}
                                                                    onClick={(e) => { e.stopPropagation(); openEditModal(order) }}>
                                                                    ✏️ Düzenle
                                                                </button>
                                                                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                                    <button className="btn btn-primary"
                                                                        style={{
                                                                            fontSize: '0.82rem', padding: '10px 22px',
                                                                            boxShadow: '0 4px 20px rgba(88, 166, 255, 0.3)',
                                                                            fontWeight: 700,
                                                                        }}
                                                                        onClick={(e) => { e.stopPropagation(); advanceStatus(order) }}>
                                                                        ⏭️ {statusMap[statusFlow[statusFlow.indexOf(order.status) + 1]]?.label || 'İleri'}
                                                                    </button>
                                                                )}
                                                                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                                                    <button className="btn btn-secondary"
                                                                        style={{
                                                                            fontSize: '0.82rem', padding: '10px 22px',
                                                                            color: '#f87171',
                                                                            borderColor: 'rgba(248, 113, 113, 0.3)',
                                                                            fontWeight: 600,
                                                                        }}
                                                                        onMouseEnter={e => {
                                                                            e.currentTarget.style.background = 'rgba(248, 113, 113, 0.08)'
                                                                            e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.5)'
                                                                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(248, 113, 113, 0.15)'
                                                                        }}
                                                                        onMouseLeave={e => {
                                                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                                                                            e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.3)'
                                                                            e.currentTarget.style.boxShadow = 'none'
                                                                        }}
                                                                        onClick={(e) => { e.stopPropagation(); cancelOrder(order) }}>
                                                                        ❌ İptal Et
                                                                    </button>
                                                                )}
                                                                {order.status === 'cancelled' && (
                                                                    <div style={{
                                                                        display: 'flex', alignItems: 'center', gap: '8px',
                                                                        padding: '10px 18px', borderRadius: 'var(--radius-md)',
                                                                        background: 'rgba(248, 113, 113, 0.06)',
                                                                        border: '1px solid rgba(248, 113, 113, 0.15)',
                                                                    }}>
                                                                        <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Bu sipariş iptal edildi</span>
                                                                    </div>
                                                                )}
                                                                <button className="btn btn-secondary"
                                                                    style={{
                                                                        fontSize: '0.82rem', padding: '10px 22px',
                                                                        color: '#ef4444',
                                                                        borderColor: 'rgba(239, 68, 68, 0.35)',
                                                                        fontWeight: 600,
                                                                    }}
                                                                    onMouseEnter={e => {
                                                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                                                                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)'
                                                                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.2)'
                                                                    }}
                                                                    onMouseLeave={e => {
                                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                                                                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)'
                                                                        e.currentTarget.style.boxShadow = 'none'
                                                                    }}
                                                                    onClick={(e) => { e.stopPropagation(); hardDeleteOrder(order) }}>
                                                                    🗑️ Sil
                                                                </button>
                                                                {order.status === 'delivered' && (
                                                                    <div style={{
                                                                        display: 'flex', alignItems: 'center', gap: '8px',
                                                                        padding: '10px 18px', borderRadius: 'var(--radius-md)',
                                                                        background: 'rgba(74, 222, 128, 0.06)',
                                                                        border: '1px solid rgba(74, 222, 128, 0.2)',
                                                                    }}>
                                                                        <span style={{
                                                                            fontSize: '0.82rem', color: '#4ade80', fontWeight: 700,
                                                                        }}>✅ Tamamlandı</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ═══ New Order Modal ═══ */}
            {modalOpen && (
                <div className="overlay overlay--center" onClick={() => setModalOpen(false)}>
                    <div className="overlay__backdrop" />
                    <div onClick={e => e.stopPropagation()} className="modal-panel modal-panel--lg"
                        style={{ overflow: 'hidden', position: 'relative' }}>
                        {/* Modal top accent line */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                            background: 'var(--gradient-brand)',
                            backgroundSize: '200% 100%',
                            animation: 'gradient-shift 3s ease-in-out infinite',
                        }} />
                        {/* Icon header with gradient background */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            marginBottom: '24px', paddingTop: '8px',
                        }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
                                background: 'var(--gradient-brand)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.3rem',
                                boxShadow: '0 4px 20px rgba(88, 166, 255, 0.25)',
                            }}>📋</div>
                            <div>
                                <h3 style={{
                                    fontSize: '1.2rem', fontWeight: 800, margin: 0,
                                    fontFamily: 'var(--font-display)',
                                }}>{editingOrderId ? 'Siparişi Düzenle' : 'Yeni Sipariş'}</h3>
                                <span style={{
                                    fontSize: '0.72rem', color: 'var(--text-tertiary)',
                                    letterSpacing: '0.02em',
                                }}>{editingOrderId ? 'Sipariş bilgilerini güncelleyin' : 'Sipariş bilgilerini doldurun'}</span>
                            </div>
                            {/* Close button */}
                            <button className="btn btn-ghost btn-icon"
                                style={{ marginLeft: 'auto', fontSize: '1.1rem', width: '36px', height: '36px', minHeight: '36px' }}
                                onClick={() => setModalOpen(false)}
                                aria-label="Kapat">✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={formLabelStyle}>Müşteri <span style={{ color: '#f87171' }}>*</span></label>
                                <input className="input" value={form.customer}
                                    onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
                                    placeholder="Elif Kaya"
                                    style={{
                                        borderColor: form.customer.trim() === '' && form.product.trim() !== ''
                                            ? 'rgba(248, 113, 113, 0.4)' : undefined,
                                    }} />
                            </div>
                            <div>
                                <label style={formLabelStyle}>Ürün <span style={{ color: '#f87171' }}>*</span></label>
                                <input className="input" value={form.product}
                                    onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                                    placeholder="Kadife Perde - Bordo"
                                    style={{
                                        borderColor: form.product.trim() === '' && form.customer.trim() !== ''
                                            ? 'rgba(248, 113, 113, 0.4)' : undefined,
                                    }} />
                            </div>
                            <div className="grid-3" style={{ gap: '12px' }}>
                                <div>
                                    <label style={formLabelStyle}>Adet</label>
                                    <input className="input" type="number" min="1" step="1" value={form.qty}
                                        onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={formLabelStyle}>Genişlik (cm)</label>
                                    <input className="input" type="number" min="0" step="0.1" value={form.width}
                                        onChange={e => setForm(f => ({ ...f, width: e.target.value }))}
                                        placeholder="240" />
                                </div>
                                <div>
                                    <label style={formLabelStyle}>Yükseklik (cm)</label>
                                    <input className="input" type="number" min="0" step="0.1" value={form.height}
                                        onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                                        placeholder="260" />
                                </div>
                            </div>
                            <div>
                                <label style={formLabelStyle}>Tutar ({symbol})</label>
                                <input className="input" type="text" inputMode="decimal"
                                    value={amountDisplay}
                                    onChange={e => {
                                        const rawValue = e.target.value
                                        // Sadece rakam ve virgül kalmasına izin ver (Türkçe ondalık)
                                        const cleanVal = rawValue.replace(/[^\d,]/g, '')
                                        setAmountDisplay(cleanVal)

                                        // Gerçek değer için virgülü noktaya çevirip sakla
                                        const numVal = cleanVal.replace(',', '.')
                                        setForm(f => ({ ...f, amount: numVal }))
                                    }}
                                    onBlur={(e) => {
                                        const val = parseFloat(form.amount)
                                        if (!isNaN(val)) {
                                            const formatted = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)
                                            setAmountDisplay(formatted)
                                        }
                                    }}
                                    onFocus={(e) => {
                                        // Focus olduğunda düz halini ver (Örn: 1540,50) ki düzenlemesi kolay olsun
                                        if (form.amount) {
                                            setAmountDisplay(String(form.amount).replace('.', ','))
                                        }
                                    }}
                                    placeholder="3.450,00" />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
                            <button className="btn btn-primary" style={{
                                flex: 1, fontWeight: 700, fontSize: '0.92rem',
                                boxShadow: '0 6px 24px rgba(88, 166, 255, 0.3)',
                                padding: '12px 24px',
                            }} onClick={handleSaveOrder} disabled={saving}>
                                {saving ? (
                                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            {editingOrderId ? <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /> : <path d="M12 5v14M5 12h14" />}
                                        </svg>
                                        {editingOrderId ? 'Güncelle' : 'Sipariş Oluştur'}
                                    </>
                                )}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}
                                style={{ padding: '12px 20px' }}>İptal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
