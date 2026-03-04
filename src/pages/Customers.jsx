import { useState, useCallback, useMemo, memo, startTransition, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCustomers } from '../hooks/useCustomers'
import { useOrders } from '../hooks/useOrders'
import { useCurrency } from '../hooks/useCurrency'

const statusBadge = {
    active: { label: 'Aktif', cls: 'badge-success' },
    vip: { label: 'VIP', cls: 'badge-purple' },
    new: { label: 'Yeni', cls: 'badge-info' },
    inactive: { label: 'Pasif', cls: 'badge-warning' },
}

const emptyForm = { name: '', email: '', phone: '', city: '' }

/* ═══════════════════════════════════════════════════
   SLIDE-OVER COMPONENT
   ═══════════════════════════════════════════════════ */
const CustomerDetailSlideOver = memo(function CustomerDetailSlideOver({ customer, onClose, onEdit, onDelete }) {
    const { formatMoney, formatCompact } = useCurrency()
    const navigate = useNavigate()
    const [detailTab, setDetailTab] = useState('info') // 'info' | 'twin'
    // internal state resets automatically when key={customer.id} changes in parent

    const { orders, fetchOrders } = useOrders({ autoFetch: false })

    useEffect(() => {
        if (customer) fetchOrders({ customer_id: customer.id })
    }, [customer, fetchOrders])

    const twin = useMemo(() => {
        if (!orders || orders.length === 0) return null

        let roomsMap = {}
        let projects = []

        orders.forEach(order => {
            const dateStr = new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
            projects.push({
                date: dateStr,
                room: order.notes || 'Genel Proje',
                fabric: order.items?.map(i => i.product_name)?.join(' + ') || 'Belirtilmemiş Ürün',
                cost: parseFloat(order.total_amount) || 0,
                status: order.status === 'delivered' ? 'completed' : 'pending'
            })

            const roomName = order.notes || 'Genel'
            if (!roomsMap[roomName]) roomsMap[roomName] = { name: roomName, icon: '🏠', windows: [] }

            order.items?.forEach((item, idx) => {
                roomsMap[roomName].windows.push({
                    id: `${order.id}-${idx}`,
                    width: item.width || 0,
                    height: item.height || 0,
                    fabric: item.product_name || 'Standart Kumaş',
                    style: 'Büzgülü',
                    mechanism: 'Standart Korniş',
                    installedDate: dateStr,
                    washTemp: 30,
                    washCycle: 6
                })
            })
        })

        return {
            rooms: Object.values(roomsMap),
            projects: projects
        }
    }, [orders])

    if (!customer) return null

    return (
        <div className="slideover-overlay" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="slideover slideover--wide">
                <div className="slideover-header">
                    <h2 className="slideover-title">Müşteri Detay</h2>
                    <button className="btn btn-ghost" onClick={onClose}>✕</button>
                </div>

                <div className="slideover-body">
                    {/* Header — always visible */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div className="avatar avatar-lg" style={{ width: '56px', height: '56px', fontSize: '1.1rem' }}>
                            {customer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '2px' }}>{customer.name}</h3>
                            <span className={`badge ${statusBadge[customer.status].cls} `}>{statusBadge[customer.status].label}</span>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '1px solid var(--border-primary)' }}>
                        {[['info', '📋 Bilgiler'], ['twin', '🏠 Dijital İkiz']].map(([key, label]) => (
                            <button key={key} onClick={() => setDetailTab(key)}
                                style={{
                                    padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                                    fontSize: '0.82rem', fontWeight: detailTab === key ? 700 : 400,
                                    color: detailTab === key ? 'var(--accent-blue)' : 'var(--text-tertiary)',
                                    borderBottom: detailTab === key ? '2px solid var(--accent-blue)' : '2px solid transparent',
                                    transition: 'all 0.2s',
                                }}>{label}{key === 'twin' && twin ? ` (${twin.rooms.reduce((s, r) => s + r.windows.length, 0)})` : ''}</button>
                        ))}
                    </div>

                    {/* TAB: Info */}
                    {detailTab === 'info' && (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                {[
                                    ['📧', 'E-posta', customer.email],
                                    ['📱', 'Telefon', customer.phone],
                                    ['📍', 'Şehir', customer.city],
                                    ['📅', 'Son Sipariş', customer.lastOrder],
                                ].map(([icon, label, val]) => (
                                    <div key={label} className="info-row info-row--lg">
                                        <span>{icon}</span>
                                        <div>
                                            <div className="info-row__label">{label}</div>
                                            <div className="info-row__value">{val}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid-2-col" style={{ marginBottom: '20px' }}>
                                <div className="stat-cell" style={{ padding: '16px' }}>
                                    <div className="stat-cell__value stat-cell__value--xl" style={{ color: 'var(--accent-blue)' }}>{customer.orders}</div>
                                    <div className="stat-cell__label stat-cell__label--lg">Toplam Sipariş</div>
                                </div>
                                <div className="stat-cell" style={{ padding: '16px' }}>
                                    <div className="stat-cell__value stat-cell__value--xl" style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {formatMoney(customer.totalSpent)}
                                    </div>
                                    <div className="stat-cell__label stat-cell__label--lg">Toplam Ciro</div>
                                </div>
                            </div>

                            <div className="action-col" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-secondary" style={{ flex: 1 }}
                                        onClick={() => window.open(`tel:${customer.phone.replace(/\s/g, '')}`)}>📱 Ara</button>
                                    <button className="btn btn-secondary" style={{ flex: 1 }}
                                        onClick={() => window.open(`mailto:${customer.email}`)}>📧 E-posta</button>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-secondary"
                                        style={{
                                            fontSize: '0.82rem', padding: '10px 22px', flex: 1,
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
                                        onClick={() => { onEdit(customer) }}>
                                        ✏️ Bilgileri Düzenle
                                    </button>
                                    <button className="btn btn-secondary"
                                        style={{
                                            fontSize: '0.82rem', padding: '10px 22px', flex: 1,
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
                                        onClick={() => { if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) onDelete(customer.id) }}>
                                        🗑️ Sil
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* TAB: Digital Twin */}
                    {detailTab === 'twin' && (() => {
                        if (!twin) return (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '12px', opacity: 0.3 }}>🏠</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>Dijital İkiz Henüz Yok</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '16px' }}>Bu müşteri için pencere arşivi oluşturulmamış.</div>
                                <button className="btn btn-primary"
                                    onClick={() => alert('Yeni sipariş tamamlandığında otomatik oluşturulur.')}>🏠 Dijital İkiz Başlat</button>
                            </div>
                        )

                        const totalWindows = twin.rooms.reduce((s, r) => s + r.windows.length, 0)
                        const totalProjectCost = twin.projects.reduce((s, p) => s + p.cost, 0)

                        // Check maintenance reminders
                        const now = new Date()
                        const reminders = []
                        twin.rooms.forEach(room => {
                            room.windows.forEach(w => {
                                const installed = new Date(w.installedDate)
                                const monthsSince = (now.getFullYear() - installed.getFullYear()) * 12 + (now.getMonth() - installed.getMonth())
                                const washCycle = w.washCycle || 6 // Default to 6 if undefined
                                if (monthsSince >= washCycle) {
                                    reminders.push({ room: room.name, fabric: w.fabric, months: monthsSince, cycle: washCycle })
                                }
                            })
                        })

                        return (
                            <>
                                {/* Twin Stats */}
                                <div className="grid-3" style={{ gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{twin.rooms.length}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>Oda</div>
                                    </div>
                                    <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#bc8cff' }}>{totalWindows}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>Pencere</div>
                                    </div>
                                    <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{formatCompact(totalProjectCost, 0)}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>Toplam</div>
                                    </div>
                                </div>

                                {/* Maintenance Alerts */}
                                {reminders.length > 0 && (
                                    <div style={{
                                        padding: '10px 14px', marginBottom: '16px',
                                        background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.25)',
                                        borderRadius: 'var(--radius-md)', fontSize: '0.75rem',
                                    }}>
                                        <div style={{ fontWeight: 700, color: '#f39c12', marginBottom: '6px' }}>🧹 Bakım Hatırlatması ({reminders.length})</div>
                                        {reminders.map((r, i) => (
                                            <div key={i} style={{ color: 'var(--text-secondary)', marginBottom: '3px' }}>
                                                {r.room} — {r.fabric}: {r.months} aydır yıkanmadı (önerilen: her {r.cycle} ay)
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Rooms & Windows */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>🏠 Odalar & Pencereler</h4>
                                    {twin.rooms.map(room => (
                                        <div key={room.name} style={{ marginBottom: '12px' }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span>{room.icon}</span> {room.name}
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>({room.windows.length} pencere)</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px', borderLeft: '2px solid var(--border-primary)' }}>
                                                {room.windows.map(win => (
                                                    <div key={win.id} style={{
                                                        padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{win.fabric}</span>
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{win.installedDate}</span>
                                                        </div>
                                                        <div className="grid-3" style={{ gap: '4px', fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                            <span>📐 {win.width}×{win.height}cm</span>
                                                            <span>🎀 {win.style}</span>
                                                            <span>🔩 {win.mechanism}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '4px', fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                                                            <span>🌡️ {win.washTemp}°C yıkama</span>
                                                            <span>•</span>
                                                            <span>Her {win.washCycle} ayda</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <button className="btn btn-ghost" style={{ fontSize: '0.65rem', padding: '3px 8px' }}
                                                                onClick={() => navigate(`/quote?fabric=${encodeURIComponent(win.fabric)}&w=${win.width}&h=${win.height}&style=${encodeURIComponent(win.style)}`)}>🔄 Yenile</button>
                                                            <button className="btn btn-ghost" style={{ fontSize: '0.65rem', padding: '3px 8px' }}
                                                                onClick={() => navigate('/demo')}>🎯 3D'de Gör</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Project Timeline */}
                                <div>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>📅 Proje Geçmişi</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingLeft: '12px', borderLeft: '2px solid var(--accent-blue)' }}>
                                        {twin.projects.map((proj, i) => (
                                            <div key={i} style={{
                                                position: 'relative', paddingLeft: '16px', paddingBottom: '14px',
                                            }}>
                                                <div style={{
                                                    position: 'absolute', left: '-7px', top: '4px',
                                                    width: '12px', height: '12px', borderRadius: '50%',
                                                    background: proj.status === 'completed' ? 'var(--accent-blue)' : '#f39c12',
                                                    border: '2px solid var(--bg-secondary)',
                                                }} />
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{proj.date}</div>
                                                <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '2px' }}>{proj.room}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{proj.fabric}</div>
                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{formatMoney(proj.cost)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )
                    })()}
                </div>
            </div>
        </div>
    )
})

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function Customers() {
    const { t } = useTranslation('customers')
    const { customers: rawCustomers, loading, error, fetchCustomers, createCustomer, updateCustomer, deleteCustomer: apiDeleteCustomer, deleteAllCustomers } = useCustomers()
    const { formatMoney, formatCompact } = useCurrency()

    // Normalize DB fields to match UI expectations
    const customers = useMemo(() => rawCustomers.map(c => ({
        ...c,
        name: c.full_name || c.name || '',
        email: c.email || '',
        phone: c.phone || '',
        city: c.city || '',
        orders: c.total_orders ?? c.orders ?? 0,
        totalSpent: c.total_spent ?? c.totalSpent ?? 0,
        lastOrder: c.last_order_date
            ? new Date(c.last_order_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
            : (c.lastOrder || '-'),
        status: c.status || 'active',
    })), [rawCustomers])

    const [search, setSearch] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [initialForm, setInitialForm] = useState(null)
    const [saving, setSaving] = useState(false)

    // Server-side filtering
    const searchTimer = useRef(null)
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => {
            const filters = {}
            if (search) filters.search = search
            fetchCustomers(filters)
        }, 300)
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
    }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

    const filtered = customers

    const totalRevenue = useMemo(() => customers.reduce((sum, c) => sum + c.totalSpent, 0), [customers])
    const updateForm = useCallback((field, value) => setForm(f => ({ ...f, [field]: value })), [])

    const selectCustomer = useCallback((c) => {
        startTransition(() => setSelectedCustomer(c))
    }, [])

    const openAddModal = useCallback(() => {
        setEditingCustomer(null)
        setInitialForm(null)
        setForm(emptyForm)
        setModalOpen(true)
    }, [])

    const openEditModal = useCallback((customer) => {
        setEditingCustomer(customer)
        const newForm = { name: customer.name, email: customer.email, phone: customer.phone, city: customer.city }
        setForm(newForm)
        setInitialForm(newForm)
        setModalOpen(true)
        setSelectedCustomer(null)
    }, [])

    const handleSave = useCallback(async () => {
        if (!form.name.trim()) return alert('İsim gerekli')

        if (editingCustomer && initialForm) {
            const hasChanges = Object.keys(initialForm).some(key => form[key] !== initialForm[key])
            if (!hasChanges) {
                return alert('Herhangi bir değişiklik yapmadınız. Lütfen güncellemek için en az 1 veriyi güncelleyin.')
            }
        }

        setSaving(true)
        const payload = {
            full_name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            city: form.city.trim(),
        }
        if (editingCustomer) {
            const { error: err } = await updateCustomer(editingCustomer.id, payload)
            if (err) { setSaving(false); return alert(err) }
        } else {
            const { error: err } = await createCustomer(payload)
            if (err) { setSaving(false); return alert(err) }
        }
        setSaving(false)
        setModalOpen(false)
        setForm(emptyForm)
    }, [form, editingCustomer, initialForm, createCustomer, updateCustomer])

    const handleDelete = useCallback(async (id) => {
        const { error: err } = await apiDeleteCustomer(id)
        if (err) return alert(err)
        setSelectedCustomer(null)
    }, [apiDeleteCustomer])

    const deleteAllCustomersHandler = useCallback(async () => {
        if (!window.confirm('Tüm müşterileri tamamen silmek istediğinize emin misiniz? Müşterilerin geçmiş siparişleri bağlantısız/isimsiz olarak kalacaktır ve bu işlem geri alınamaz!')) return
        const promptReset = window.prompt('Bu işlemi onaylamak için lütfen "LİSTEYİ TEMİZLE" yazın:')
        if (promptReset !== 'LİSTEYİ TEMİZLE') {
            alert('İşlem iptal edildi.')
            return
        }

        setSaving(true)
        const { error: err } = await deleteAllCustomers()
        setSaving(false)

        if (err) return alert(err)
        fetchCustomers({ search: search })
    }, [deleteAllCustomers, fetchCustomers, search])

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid var(--border-primary)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)' }}>Müşteriler yükleniyor...</span>
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
            <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Müşteriler</h1>
                    <p className="page-subtitle">{customers.length} müşteri — Toplam Ciro: {formatMoney(totalRevenue)}</p>
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
                        onClick={deleteAllCustomersHandler}>
                        🔥 Listeyi Temizle
                    </button>
                    <button className="btn btn-primary" onClick={openAddModal}
                        style={{ position: 'relative', overflow: 'hidden', padding: '12px 20px' }}>
                        <span style={{ position: 'relative', zIndex: 1 }}>+ Yeni Müşteri</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '24px' }}>
                <div className="search-bar" style={{ maxWidth: '360px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input type="search" className="input input-with-icon" placeholder="İsim, e-posta veya şehir ara..."
                        value={search} onChange={e => setSearch(e.target.value)} aria-label="Müşteri ara" />
                </div>
            </div>

            {/* Customer Cards */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <div className="empty-state-title">Müşteri bulunamadı</div>
                    <div className="empty-state-desc">Arama kriterlerinize uygun müşteri yok.</div>
                    <button className="btn btn-secondary" style={{ marginTop: '20px' }}
                        onClick={() => setSearch('')}>
                        Aramayı Temizle
                    </button>
                </div>
            ) : (
                <div className="grid-3">
                    {filtered.map((customer, i) => (
                        <div key={customer.id} className="card animate-fade-in-up"
                            style={{ animationDelay: `${i * 0.05} s`, cursor: 'pointer' }}
                            onClick={() => selectCustomer(customer)}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                                <div className="avatar avatar-lg">{customer.name.split(' ').map(n => n[0]).join('')}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{customer.name}</h3>
                                        <span className={`badge ${statusBadge[customer.status].cls} `}>{statusBadge[customer.status].label}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{customer.email}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{customer.phone}</div>
                                </div>
                            </div>

                            <div className="grid-3-col" style={{
                                gap: '8px',
                                padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{customer.orders}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sipariş</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatCompact(customer.totalSpent, 1)}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Toplam</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{customer.city}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Şehir</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Son sipariş: {customer.lastOrder}</span>
                                <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                    onClick={(e) => { e.stopPropagation(); selectCustomer(customer) }}>
                                    Detay →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Customer Detail Slide-over */}
            {selectedCustomer && (
                <CustomerDetailSlideOver
                    key={selectedCustomer.id} // Forces reset of internal state (tabs) on customer change
                    customer={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                />
            )}

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div onClick={e => e.stopPropagation()} className="modal">
                        <h3 className="modal-title">
                            {editingCustomer ? '✏️ Müşteri Düzenle' : '➕ Yeni Müşteri'}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label className="form-label">İsim *</label>
                                <input className="input" value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="Elif Kaya" />
                            </div>
                            <div>
                                <label className="form-label">E-posta</label>
                                <input className="input" type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="elif@email.com" />
                            </div>
                            <div className="grid-2">
                                <div>
                                    <label className="form-label">Telefon</label>
                                    <input className="input" value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="0532 111 2233" />
                                </div>
                                <div>
                                    <label className="form-label">Şehir</label>
                                    <input className="input" value={form.city} onChange={e => updateForm('city', e.target.value)} placeholder="İstanbul" />
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                                {editingCustomer ? '💾 Kaydet' : '➕ Ekle'}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>İptal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
