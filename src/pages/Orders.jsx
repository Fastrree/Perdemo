import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

const initialOrders = [
    { id: 'PD-2026-001', customer: 'Elif Kaya', product: 'Kadife Perde - Bordo', qty: 2, width: '240cm', height: '260cm', amount: 3450, status: 'shipped', date: '15 Şub 2026', payment: 'paid' },
    { id: 'PD-2026-002', customer: 'Mehmet Demir', product: 'Tül Perde - Beyaz', qty: 4, width: '180cm', height: '240cm', amount: 1200, status: 'processing', date: '14 Şub 2026', payment: 'paid' },
    { id: 'PD-2026-003', customer: 'Ayşe Yıldız', product: 'Stor Perde - Gri', qty: 3, width: '120cm', height: '200cm', amount: 2800, status: 'delivered', date: '13 Şub 2026', payment: 'paid' },
    { id: 'PD-2026-004', customer: 'Can Öztürk', product: 'Fon Perde - Lacivert', qty: 2, width: '300cm', height: '280cm', amount: 4100, status: 'pending', date: '13 Şub 2026', payment: 'pending' },
    { id: 'PD-2026-005', customer: 'Zeynep Ak', product: 'Blackout Perde', qty: 1, width: '160cm', height: '220cm', amount: 2650, status: 'processing', date: '12 Şub 2026', payment: 'paid' },
    { id: 'PD-2026-006', customer: 'Burak Şen', product: 'Zebra Perde - Krem', qty: 5, width: '150cm', height: '200cm', amount: 5500, status: 'pending', date: '12 Şub 2026', payment: 'pending' },
    { id: 'PD-2026-007', customer: 'Deniz Arslan', product: 'Tül Perde Dantel', qty: 3, width: '200cm', height: '240cm', amount: 2550, status: 'shipped', date: '11 Şub 2026', payment: 'paid' },
    { id: 'PD-2026-008', customer: 'Fatma Çelik', product: 'Jakar Fon Perde', qty: 1, width: '280cm', height: '260cm', amount: 2200, status: 'delivered', date: '10 Şub 2026', payment: 'paid' },
    { id: 'PD-2026-009', customer: 'Gökhan Aydın', product: 'Kadife Fon Perde', qty: 2, width: '240cm', height: '260cm', amount: 2600, status: 'cancelled', date: '10 Şub 2026', payment: 'refunded' },
    { id: 'PD-2026-010', customer: 'Hülya Koç', product: 'Blackout Stor', qty: 4, width: '140cm', height: '200cm', amount: 5600, status: 'processing', date: '09 Şub 2026', payment: 'paid' },
]

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
    const [orders, setOrders] = useState(initialOrders)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [expandedOrder, setExpandedOrder] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState({ customer: '', product: '', qty: '1', width: '', height: '', amount: '' })

    const filtered = orders.filter(o => {
        const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
            o.customer.toLowerCase().includes(search.toLowerCase()) ||
            o.product.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'all' || o.status === statusFilter
        return matchSearch && matchStatus
    })

    const kpiValues = useMemo(() => {
        const totalOrders = orders.length
        const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0)
        const pendingCount = orders.filter(o => o.status === 'pending').length
        const deliveredCount = orders.filter(o => o.status === 'delivered').length
        return { totalOrders, totalRevenue, pendingCount, deliveredCount }
    }, [orders])

    const kpiDisplay = useMemo(() => ({
        totalOrders: String(kpiValues.totalOrders),
        totalRevenue: `₺${kpiValues.totalRevenue.toLocaleString('tr-TR')}`,
        pendingCount: String(kpiValues.pendingCount),
        deliveredCount: String(kpiValues.deliveredCount),
    }), [kpiValues])

    /* Count per status for filter badges */
    const statusCounts = useMemo(() => {
        const counts = { total: orders.length }
        orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1 })
        return counts
    }, [orders])

    const totalAmount = filtered.reduce((sum, o) => sum + o.amount, 0)

    const advanceStatus = useCallback((orderId) => {
        setOrders(prev => prev.map(o => {
            if (o.id !== orderId) return o
            const currentIdx = statusFlow.indexOf(o.status)
            if (currentIdx < 0 || currentIdx >= statusFlow.length - 1) return o
            return { ...o, status: statusFlow[currentIdx + 1] }
        }))
    }, [])

    const cancelOrder = useCallback((orderId) => {
        setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, status: 'cancelled', payment: o.payment === 'paid' ? 'refunded' : o.payment } : o
        ))
    }, [])

    const handleNewOrder = useCallback(() => {
        if (!form.customer.trim() || !form.product.trim()) return alert(t('form.customerProductRequired'))
        const newId = `PD-2026-${String(orders.length + 1).padStart(3, '0')}`
        setOrders(prev => [...prev, {
            id: newId, customer: form.customer, product: form.product,
            qty: parseInt(form.qty) || 1, width: form.width || '-', height: form.height || '-',
            amount: parseFloat(form.amount) || 0, status: 'pending',
            date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }),
            payment: 'pending',
        }])
        setModalOpen(false)
        setForm({ customer: '', product: '', qty: '1', width: '', height: '', amount: '' })
    }, [form, orders.length])

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
                        {t('total')}: ₺{totalAmount.toLocaleString('tr-TR')}
                    </p>
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => setModalOpen(true)}
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
                                            }}>{order.width} × {order.height}</td>
                                            <td style={{
                                                padding: '14px 20px', fontWeight: 700,
                                                fontFamily: 'var(--font-display)', fontSize: '0.95rem',
                                                color: 'var(--text-primary)',
                                            }}>₺{order.amount.toLocaleString('tr-TR')}</td>
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
                                                                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                                    <button className="btn btn-primary"
                                                                        style={{
                                                                            fontSize: '0.82rem', padding: '10px 22px',
                                                                            boxShadow: '0 4px 20px rgba(88, 166, 255, 0.3)',
                                                                            fontWeight: 700,
                                                                        }}
                                                                        onClick={(e) => { e.stopPropagation(); advanceStatus(order.id) }}>
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
                                                                        onClick={(e) => { e.stopPropagation(); cancelOrder(order.id) }}>
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
                                }}>Yeni Sipariş</h3>
                                <span style={{
                                    fontSize: '0.72rem', color: 'var(--text-tertiary)',
                                    letterSpacing: '0.02em',
                                }}>Sipariş bilgilerini doldurun</span>
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
                                    <input className="input" type="number" value={form.qty}
                                        onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={formLabelStyle}>Genişlik</label>
                                    <input className="input" value={form.width}
                                        onChange={e => setForm(f => ({ ...f, width: e.target.value }))}
                                        placeholder="240cm" />
                                </div>
                                <div>
                                    <label style={formLabelStyle}>Yükseklik</label>
                                    <input className="input" value={form.height}
                                        onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                                        placeholder="260cm" />
                                </div>
                            </div>
                            <div>
                                <label style={formLabelStyle}>Tutar (₺)</label>
                                <input className="input" type="number" value={form.amount}
                                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                    placeholder="3450" />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
                            <button className="btn btn-primary" style={{
                                flex: 1, fontWeight: 700, fontSize: '0.92rem',
                                boxShadow: '0 6px 24px rgba(88, 166, 255, 0.3)',
                                padding: '12px 24px',
                            }} onClick={handleNewOrder}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Sipariş Oluştur
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
