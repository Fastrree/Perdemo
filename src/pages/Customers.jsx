import { useState, useCallback, useMemo, memo, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'

const initialCustomers = [
    { id: 1, name: 'Elif Kaya', email: 'elif.kaya@email.com', phone: '0532 111 2233', city: 'İstanbul', orders: 12, totalSpent: 34500, lastOrder: '15 Şub 2026', status: 'active' },
    { id: 2, name: 'Mehmet Demir', email: 'mehmet.d@email.com', phone: '0533 222 3344', city: 'Ankara', orders: 8, totalSpent: 18200, lastOrder: '14 Şub 2026', status: 'active' },
    { id: 3, name: 'Ayşe Yıldız', email: 'ayse.y@email.com', phone: '0535 333 4455', city: 'İzmir', orders: 15, totalSpent: 42800, lastOrder: '13 Şub 2026', status: 'vip' },
    { id: 4, name: 'Can Öztürk', email: 'can.oz@email.com', phone: '0536 444 5566', city: 'Bursa', orders: 3, totalSpent: 8100, lastOrder: '13 Şub 2026', status: 'active' },
    { id: 5, name: 'Zeynep Ak', email: 'zeynep.ak@email.com', phone: '0537 555 6677', city: 'Antalya', orders: 6, totalSpent: 15900, lastOrder: '12 Şub 2026', status: 'active' },
    { id: 6, name: 'Burak Şen', email: 'burak.s@email.com', phone: '0538 666 7788', city: 'İstanbul', orders: 22, totalSpent: 68400, lastOrder: '12 Şub 2026', status: 'vip' },
    { id: 7, name: 'Deniz Arslan', email: 'deniz.a@email.com', phone: '0539 777 8899', city: 'Konya', orders: 5, totalSpent: 12500, lastOrder: '11 Şub 2026', status: 'active' },
    { id: 8, name: 'Fatma Çelik', email: 'fatma.c@email.com', phone: '0530 888 9900', city: 'Adana', orders: 1, totalSpent: 2200, lastOrder: '10 Şub 2026', status: 'new' },
    { id: 9, name: 'Gökhan Aydın', email: 'gokhan.a@email.com', phone: '0531 999 0011', city: 'İstanbul', orders: 0, totalSpent: 0, lastOrder: '-', status: 'inactive' },
]

/* ═══════════════════════════════════════════════════
   DIGITAL TWIN — Per-Customer Window Archive
   ═══════════════════════════════════════════════════ */
const digitalTwins = {
    1: {
        rooms: [
            {
                name: 'Salon', icon: '🛋️', windows: [
                    { id: 'w1', width: 200, height: 250, fabric: 'Kadife Bordo', style: 'Büzgülü', mechanism: 'Kornişli Ray', installedDate: '2024-03-15', washTemp: 30, washCycle: 6 },
                    { id: 'w2', width: 140, height: 220, fabric: 'Tül Beyaz', style: 'Büzgülü', mechanism: 'Boru Korniş', installedDate: '2024-03-15', washTemp: 30, washCycle: 4 },
                ]
            },
            {
                name: 'Yatak Odası', icon: '🛏️', windows: [
                    { id: 'w3', width: 180, height: 240, fabric: 'Blackout Siyah', style: 'Halkalı', mechanism: 'Motorlu Ray', installedDate: '2025-01-10', washTemp: 40, washCycle: 8 },
                ]
            },
        ],
        projects: [
            { date: '2024-03-15', room: 'Salon', fabric: 'Kadife Bordo + Tül Beyaz', cost: 8400, status: 'completed' },
            { date: '2025-01-10', room: 'Yatak Odası', fabric: 'Blackout Siyah', cost: 4200, status: 'completed' },
        ]
    },
    2: {
        rooms: [
            {
                name: 'Salon', icon: '🛋️', windows: [
                    { id: 'w4', width: 220, height: 260, fabric: 'Keten Lacivert', style: 'Kulaklı', mechanism: 'Kornişli Ray', installedDate: '2025-06-22', washTemp: 40, washCycle: 6 },
                ]
            },
        ],
        projects: [
            { date: '2025-06-22', room: 'Salon', fabric: 'Keten Lacivert', cost: 5100, status: 'completed' },
        ]
    },
    3: {
        rooms: [
            {
                name: 'Salon', icon: '🛋️', windows: [
                    { id: 'w5', width: 260, height: 280, fabric: 'İpek Krem', style: 'Büzgülü', mechanism: 'Motorlu Ray', installedDate: '2023-09-05', washTemp: 30, washCycle: 4 },
                    { id: 'w6', width: 180, height: 250, fabric: 'Jakar Altın', style: 'Halkalı', mechanism: 'Kornişli Ray', installedDate: '2023-09-05', washTemp: 30, washCycle: 6 },
                ]
            },
            {
                name: 'Yatak Odası', icon: '🛏️', windows: [
                    { id: 'w7', width: 200, height: 240, fabric: 'Kadife Zümrüt', style: 'Büzgülü', mechanism: 'Kornişli Ray', installedDate: '2024-11-18', washTemp: 30, washCycle: 6 },
                ]
            },
            {
                name: 'Çocuk Odası', icon: '🧒', windows: [
                    { id: 'w8', width: 150, height: 200, fabric: 'Pamuk Gri', style: 'Kulaklı', mechanism: 'Boru Korniş', installedDate: '2024-11-18', washTemp: 40, washCycle: 4 },
                ]
            },
        ],
        projects: [
            { date: '2023-09-05', room: 'Salon', fabric: 'İpek Krem + Jakar Altın', cost: 14200, status: 'completed' },
            { date: '2024-11-18', room: 'Yatak + Çocuk', fabric: 'Kadife Zümrüt + Pamuk Gri', cost: 9800, status: 'completed' },
        ]
    },
    6: {
        rooms: [
            {
                name: 'Salon', icon: '🛋️', windows: [
                    { id: 'w9', width: 300, height: 300, fabric: 'Kadife Bordo', style: 'Halkalı', mechanism: 'Motorlu Ray', installedDate: '2022-04-10', washTemp: 30, washCycle: 6 },
                    { id: 'w10', width: 250, height: 280, fabric: 'Tül Beyaz', style: 'Büzgülü', mechanism: 'Kornişli Ray', installedDate: '2022-04-10', washTemp: 30, washCycle: 4 },
                ]
            },
            {
                name: 'Yatak Odası', icon: '🛏️', windows: [
                    { id: 'w11', width: 200, height: 250, fabric: 'İpek Krem', style: 'Büzgülü', mechanism: 'Kornişli Ray', installedDate: '2023-02-14', washTemp: 30, washCycle: 4 },
                ]
            },
            {
                name: 'Misafir Odası', icon: '🛋️', windows: [
                    { id: 'w12', width: 160, height: 220, fabric: 'Keten Lacivert', style: 'Kulaklı', mechanism: 'Boru Korniş', installedDate: '2024-08-20', washTemp: 40, washCycle: 6 },
                ]
            },
            {
                name: 'Mutfak', icon: '🍳', windows: [
                    { id: 'w13', width: 120, height: 150, fabric: 'Pamuk Gri', style: 'Kulaklı', mechanism: 'Boru Korniş', installedDate: '2024-08-20', washTemp: 40, washCycle: 3 },
                ]
            },
        ],
        projects: [
            { date: '2022-04-10', room: 'Salon', fabric: 'Kadife Bordo + Tül', cost: 18500, status: 'completed' },
            { date: '2023-02-14', room: 'Yatak Odası', fabric: 'İpek Krem', cost: 7200, status: 'completed' },
            { date: '2024-08-20', room: 'Misafir + Mutfak', fabric: 'Keten Lacivert + Pamuk Gri', cost: 6400, status: 'completed' },
        ]
    },
}

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
    const navigate = useNavigate()
    const [detailTab, setDetailTab] = useState('info') // 'info' | 'twin'
    // internal state resets automatically when key={customer.id} changes in parent

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
                            <span className={`badge ${statusBadge[customer.status].cls}`}>{statusBadge[customer.status].label}</span>
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
                                }}>{label}{key === 'twin' && digitalTwins[customer.id] ? ` (${digitalTwins[customer.id].rooms.reduce((s, r) => s + r.windows.length, 0)})` : ''}</button>
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
                                        ₺{customer.totalSpent.toLocaleString('tr-TR')}
                                    </div>
                                    <div className="stat-cell__label stat-cell__label--lg">Toplam Ciro</div>
                                </div>
                            </div>

                            <div className="action-col">
                                <button className="btn btn-primary" style={{ width: '100%' }}
                                    onClick={() => { onEdit(customer) }}>✏️ Bilgileri Düzenle</button>
                                <button className="btn btn-secondary" style={{ width: '100%' }}
                                    onClick={() => window.open(`tel:${customer.phone.replace(/\s/g, '')}`)}>📱 Ara</button>
                                <button className="btn btn-secondary" style={{ width: '100%' }}
                                    onClick={() => window.open(`mailto:${customer.email}`)}>📧 E-posta Gönder</button>
                                <button className="btn btn-secondary" style={{ width: '100%', color: '#e74c3c', borderColor: 'rgba(231,76,60,0.3)' }}
                                    onClick={() => { if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) onDelete(customer.id) }}>🗑️ Sil</button>
                            </div>
                        </>
                    )}

                    {/* TAB: Digital Twin */}
                    {detailTab === 'twin' && (() => {
                        const twin = digitalTwins[customer.id]
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
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>₺{(totalProjectCost / 1000).toFixed(0)}k</div>
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
                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-blue)' }}>₺{proj.cost.toLocaleString('tr-TR')}</div>
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
    const navigate = useNavigate()
    const [customers, setCustomers] = useState(initialCustomers)
    const [search, setSearch] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)
    const [form, setForm] = useState(emptyForm)
    // detailTab state moved to CustomerDetailSlideOver

    const searchLower = search.toLowerCase()
    const filtered = useMemo(() =>
        customers.filter(c =>
            c.name.toLowerCase().includes(searchLower) ||
            c.email.toLowerCase().includes(searchLower) ||
            c.city.toLowerCase().includes(searchLower)
        )
        , [customers, searchLower])

    const totalRevenue = useMemo(() => customers.reduce((sum, c) => sum + c.totalSpent, 0), [customers])
    const updateForm = useCallback((field, value) => setForm(f => ({ ...f, [field]: value })), [])

    /* Wrap selection in startTransition to prevent UI blocking */
    const selectCustomer = useCallback((c) => {
        startTransition(() => setSelectedCustomer(c))
    }, [])

    const openAddModal = useCallback(() => {
        setEditingCustomer(null)
        setForm(emptyForm)
        setModalOpen(true)
    }, [])

    const openEditModal = useCallback((customer) => {
        setEditingCustomer(customer)
        setForm({ name: customer.name, email: customer.email, phone: customer.phone, city: customer.city })
        setModalOpen(true)
        setSelectedCustomer(null) // Close slideover if opening modal from it
    }, [])

    const handleSave = useCallback(() => {
        if (!form.name.trim()) return alert('İsim gerekli')
        if (editingCustomer) {
            setCustomers(prev => prev.map(c => c.id === editingCustomer.id
                ? { ...c, name: form.name, email: form.email, phone: form.phone, city: form.city }
                : c
            ))
        } else {
            const newId = Math.max(...customers.map(c => c.id)) + 1
            setCustomers(prev => [...prev, {
                id: newId, name: form.name, email: form.email, phone: form.phone, city: form.city,
                orders: 0, totalSpent: 0, lastOrder: '-', status: 'new',
            }])
        }
        setModalOpen(false)
        setForm(emptyForm)
    }, [form, editingCustomer, customers])

    const handleDelete = useCallback((id) => {
        setCustomers(prev => prev.filter(c => c.id !== id))
        setSelectedCustomer(null)
    }, [])

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Müşteriler</h1>
                    <p className="page-subtitle">{customers.length} müşteri — Toplam Ciro: ₺{totalRevenue.toLocaleString('tr-TR')}</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>+ Yeni Müşteri</button>
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
                </div>
            ) : (
                <div className="grid-3">
                    {filtered.map((customer, i) => (
                        <div key={customer.id} className="card animate-fade-in-up"
                            style={{ animationDelay: `${i * 0.05}s`, cursor: 'pointer' }}
                            onClick={() => selectCustomer(customer)}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                                <div className="avatar avatar-lg">{customer.name.split(' ').map(n => n[0]).join('')}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{customer.name}</h3>
                                        <span className={`badge ${statusBadge[customer.status].cls}`}>{statusBadge[customer.status].label}</span>
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
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>₺{(customer.totalSpent / 1000).toFixed(1)}k</div>
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
