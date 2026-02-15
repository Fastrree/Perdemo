import { useState, useCallback } from 'react'

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

export default function Orders() {
    const [orders, setOrders] = useState(initialOrders)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('Tümü')
    const [expandedOrder, setExpandedOrder] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState({ customer: '', product: '', qty: '1', width: '', height: '', amount: '' })

    const filtered = orders.filter(o => {
        const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
            o.customer.toLowerCase().includes(search.toLowerCase()) ||
            o.product.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'Tümü' || statusMap[o.status]?.label === statusFilter
        return matchSearch && matchStatus
    })

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
        if (!form.customer.trim() || !form.product.trim()) return alert('Müşteri ve ürün bilgisi gerekli')
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
            <div className="page-header">
                <div>
                    <h1 className="page-title">Siparişler</h1>
                    <p className="page-subtitle">{orders.length} sipariş — Toplam: ₺{totalAmount.toLocaleString('tr-TR')}</p>
                </div>
                <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Yeni Sipariş</button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-bar" style={{ maxWidth: '280px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input type="search" className="input input-with-icon" placeholder="Sipariş, müşteri ara..."
                        value={search} onChange={e => setSearch(e.target.value)} aria-label="Sipariş ara" />
                </div>
                <div className="tabs" style={{ marginBottom: 0 }}>
                    {statusFilters.map(s => (
                        <button key={s} className={`tab ${statusFilter === s ? 'active' : ''}`}
                            onClick={() => setStatusFilter(s)}>{s}</button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <div className="empty-state-title">Sipariş bulunamadı</div>
                    <div className="empty-state-desc">Arama kriterlerinize uygun sipariş yok.</div>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table" role="table">
                        <thead>
                            <tr>
                                <th scope="col">Sipariş No</th><th scope="col">Müşteri</th>
                                <th scope="col">Ürün</th><th scope="col">Adet</th>
                                <th scope="col">Ölçüler</th><th scope="col">Tutar</th>
                                <th scope="col">Ödeme</th><th scope="col">Durum</th>
                                <th scope="col">Tarih</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(order => (
                                <>
                                    <tr key={order.id} style={{ cursor: 'pointer' }}
                                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                                        <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                                            <span style={{ marginRight: '6px', fontSize: '0.7rem', transition: 'transform 0.2s', display: 'inline-block', transform: expandedOrder === order.id ? 'rotate(90deg)' : 'none' }}>▶</span>
                                            {order.id}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="avatar avatar-sm">{order.customer.split(' ').map(n => n[0]).join('')}</div>
                                                {order.customer}
                                            </div>
                                        </td>
                                        <td>{order.product}</td>
                                        <td>{order.qty}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.width} × {order.height}</td>
                                        <td style={{ fontWeight: 600 }}>₺{order.amount.toLocaleString('tr-TR')}</td>
                                        <td><span className={`badge ${paymentMap[order.payment].cls}`}>{paymentMap[order.payment].label}</span></td>
                                        <td><span className={`badge ${statusMap[order.status].cls}`}>{statusMap[order.status].label}</span></td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{order.date}</td>
                                    </tr>
                                    {/* Expanded Detail Row */}
                                    {expandedOrder === order.id && (
                                        <tr key={`${order.id}-detail`}>
                                            <td colSpan="9" style={{ padding: 0, borderTop: 'none' }}>
                                                <div style={{
                                                    padding: '16px 20px', background: 'var(--bg-tertiary)',
                                                    borderTop: '1px solid var(--border-primary)',
                                                    animation: 'fadeIn 0.2s ease',
                                                }}>
                                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                        {/* Status Timeline */}
                                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>Sipariş Durumu</div>
                                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                                {statusFlow.map((s, i) => {
                                                                    const current = statusFlow.indexOf(order.status)
                                                                    const isActive = i <= current
                                                                    const isCurrent = i === current
                                                                    return (
                                                                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                            <div style={{
                                                                                width: '28px', height: '28px', borderRadius: '50%',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                background: isActive ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                                                                                border: isCurrent ? '2px solid var(--accent-blue)' : '1px solid var(--border-primary)',
                                                                                fontSize: '0.7rem', color: isActive ? '#fff' : 'var(--text-tertiary)',
                                                                                fontWeight: 700, transition: 'all 0.2s',
                                                                            }}>
                                                                                {statusMap[s].icon}
                                                                            </div>
                                                                            {i < statusFlow.length - 1 && (
                                                                                <div style={{
                                                                                    width: '24px', height: '2px',
                                                                                    background: i < current ? 'var(--accent-blue)' : 'var(--border-primary)',
                                                                                }} />
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                                <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '8px 16px' }}
                                                                    onClick={(e) => { e.stopPropagation(); advanceStatus(order.id) }}>
                                                                    ⏭️ {statusMap[statusFlow[statusFlow.indexOf(order.status) + 1]]?.label || 'İleri'}
                                                                </button>
                                                            )}
                                                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                                                <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '8px 16px', color: '#e74c3c', borderColor: 'rgba(231,76,60,0.3)' }}
                                                                    onClick={(e) => { e.stopPropagation(); cancelOrder(order.id) }}>
                                                                    ❌ İptal Et
                                                                </button>
                                                            )}
                                                            {order.status === 'cancelled' && (
                                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Bu sipariş iptal edildi</span>
                                                            )}
                                                            {order.status === 'delivered' && (
                                                                <span style={{ fontSize: '0.78rem', color: '#2ecc71', fontWeight: 600 }}>✅ Tamamlandı</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* New Order Modal */}
            {modalOpen && (
                <div className="overlay overlay--center" onClick={() => setModalOpen(false)}>
                    <div className="overlay__backdrop" />
                    <div onClick={e => e.stopPropagation()} className="modal-panel modal-panel--lg">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>➕ Yeni Sipariş</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label className="form-label">Müşteri *</label>
                                <input className="input" value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} placeholder="Elif Kaya" />
                            </div>
                            <div>
                                <label className="form-label">Ürün *</label>
                                <input className="input" value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} placeholder="Kadife Perde - Bordo" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label className="form-label">Adet</label>
                                    <input className="input" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="form-label">Genişlik</label>
                                    <input className="input" value={form.width} onChange={e => setForm(f => ({ ...f, width: e.target.value }))} placeholder="240cm" />
                                </div>
                                <div>
                                    <label className="form-label">Yükseklik</label>
                                    <input className="input" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} placeholder="260cm" />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Tutar (₺)</label>
                                <input className="input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="3450" />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleNewOrder}>➕ Sipariş Oluştur</button>
                            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>İptal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
