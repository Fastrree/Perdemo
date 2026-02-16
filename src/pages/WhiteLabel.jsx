import { useState, useMemo, useCallback, memo, startTransition } from 'react'
import useCanHover from '../hooks/useCanHover'

/* ═══════════════════════════════════════════════════
   MOCK DATA — Dealers & Performance
   ═══════════════════════════════════════════════════ */
const dealers = [
    { id: 1, name: 'Perdemo İstanbul Kadıköy', city: 'İstanbul', region: 'Marmara', contact: 'Ali Yılmaz', phone: '0532 100 2000', email: 'kadikoy@perdemo.com', monthlyRevenue: 68400, orders: 42, demos: 128, topProduct: 'Kadife Bordo', satisfaction: 4.7, markup: 0, status: 'active', lat: 40.99, lng: 29.02 },
    { id: 2, name: 'Perdemo İstanbul Beylikdüzü', city: 'İstanbul', region: 'Marmara', contact: 'Seda Kara', phone: '0533 200 3000', email: 'beylikduzu@perdemo.com', monthlyRevenue: 52100, orders: 35, demos: 95, topProduct: 'Tül Beyaz', satisfaction: 4.5, markup: 5, status: 'active', lat: 41.0, lng: 28.64 },
    { id: 3, name: 'Perdemo İstanbul Ataşehir', city: 'İstanbul', region: 'Marmara', contact: 'Emre Demir', phone: '0534 300 4000', email: 'atasehir@perdemo.com', monthlyRevenue: 45800, orders: 28, demos: 82, topProduct: 'Blackout Siyah', satisfaction: 4.3, markup: 0, status: 'active', lat: 40.98, lng: 29.12 },
    { id: 4, name: 'Perdemo Ankara Çankaya', city: 'Ankara', region: 'İç Anadolu', contact: 'Burak Öz', phone: '0535 400 5000', email: 'cankaya@perdemo.com', monthlyRevenue: 38200, orders: 24, demos: 67, topProduct: 'Kadife Bordo', satisfaction: 4.6, markup: 8, status: 'active', lat: 39.92, lng: 32.86 },
    { id: 5, name: 'Perdemo Ankara Keçiören', city: 'Ankara', region: 'İç Anadolu', contact: 'Yeliz Ak', phone: '0536 500 6000', email: 'kecioren@perdemo.com', monthlyRevenue: 22500, orders: 15, demos: 43, topProduct: 'Pamuk Gri', satisfaction: 4.1, markup: 10, status: 'active', lat: 39.98, lng: 32.84 },
    { id: 6, name: 'Perdemo İzmir Bornova', city: 'İzmir', region: 'Ege', contact: 'Can Arslan', phone: '0537 600 7000', email: 'bornova@perdemo.com', monthlyRevenue: 41600, orders: 27, demos: 74, topProduct: 'Keten Lacivert', satisfaction: 4.4, markup: 5, status: 'active', lat: 38.47, lng: 27.22 },
    { id: 7, name: 'Perdemo İzmir Karşıyaka', city: 'İzmir', region: 'Ege', contact: 'Deniz Şen', phone: '0538 700 8000', email: 'karsiyaka@perdemo.com', monthlyRevenue: 29400, orders: 19, demos: 55, topProduct: 'İpek Krem', satisfaction: 4.2, markup: 8, status: 'active', lat: 38.46, lng: 27.11 },
    { id: 8, name: 'Perdemo Bursa Nilüfer', city: 'Bursa', region: 'Marmara', contact: 'Fatma Çelik', phone: '0539 800 9000', email: 'nilufer@perdemo.com', monthlyRevenue: 25800, orders: 17, demos: 48, topProduct: 'Jakar Altın', satisfaction: 4.0, markup: 12, status: 'active', lat: 40.22, lng: 28.97 },
    { id: 9, name: 'Perdemo Antalya Muratpaşa', city: 'Antalya', region: 'Akdeniz', contact: 'Zeynep Kaya', phone: '0530 900 1000', email: 'muratpasa@perdemo.com', monthlyRevenue: 34200, orders: 22, demos: 61, topProduct: 'Tül Beyaz', satisfaction: 4.5, markup: 5, status: 'active', lat: 36.89, lng: 30.71 },
    { id: 10, name: 'Perdemo Adana Seyhan', city: 'Adana', region: 'Akdeniz', contact: 'Murat Yıldız', phone: '0531 010 2000', email: 'seyhan@perdemo.com', monthlyRevenue: 18900, orders: 12, demos: 35, topProduct: 'Blackout Siyah', satisfaction: 3.9, markup: 15, status: 'warning', lat: 37.0, lng: 35.32 },
    { id: 11, name: 'Perdemo Konya Selçuklu', city: 'Konya', region: 'İç Anadolu', contact: 'Hasan Taş', phone: '0532 020 3000', email: 'selcuklu@perdemo.com', monthlyRevenue: 15200, orders: 10, demos: 28, topProduct: 'Kadife Bordo', satisfaction: 4.0, markup: 10, status: 'active', lat: 37.87, lng: 32.48 },
    { id: 12, name: 'Perdemo Trabzon Ortahisar', city: 'Trabzon', region: 'Karadeniz', contact: 'Ayşe Polat', phone: '0533 030 4000', email: 'ortahisar@perdemo.com', monthlyRevenue: 12800, orders: 8, demos: 22, topProduct: 'Kadife Zümrüt', satisfaction: 4.1, markup: 12, status: 'new', lat: 41.0, lng: 39.72 },
]

const regions = ['Tümü', 'Marmara', 'İç Anadolu', 'Ege', 'Akdeniz', 'Karadeniz']
const cityCount = new Set(dealers.map(d => d.city)).size

const statusBadge = {
    active: { label: 'Aktif', cls: 'badge-success' },
    warning: { label: 'Uyarı', cls: 'badge-warning' },
    new: { label: 'Yeni', cls: 'badge-info' },
}

/* ═══════════════════════════════════════════════════
   TURKEY MAP (simplified CSS-based)
   ═══════════════════════════════════════════════════ */
const MAP_BOUNDS = { minLat: 36, maxLat: 42, minLng: 26, maxLng: 44 }
const toPercent = (lat, lng) => ({
    x: ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100,
    y: ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100,
})

const mapContainerStyle = {
    position: 'relative', width: '100%', aspectRatio: '2.2/1',
    background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)',
    overflow: 'hidden', border: '1px solid var(--border-primary)',
}
const mapOutlineStyle = {
    position: 'absolute', inset: '10%', border: '1px dashed rgba(88,166,255,0.1)',
    borderRadius: '40% 30% 35% 45%',
}
const legendStyle = {
    position: 'absolute', bottom: '8px', right: '10px',
    display: 'flex', gap: '12px', fontSize: '0.6rem', color: 'var(--text-tertiary)',
}

const TurkeyMap = memo(function TurkeyMap({ dealers: dealerList, onSelect }) {
    const canHover = useCanHover()
    // Memoize dot computations to prevent recalc on hover/re-render
    const dots = useMemo(() => {
        const maxRevenue = Math.max(...dealerList.map(d => d.monthlyRevenue))
        return dealerList.map(d => {
            const pos = toPercent(d.lat, d.lng)
            const size = 8 + (d.monthlyRevenue / maxRevenue) * 18
            const bg = d.status === 'warning' ? 'rgba(243,156,18,0.8)' : d.status === 'new' ? 'rgba(88,166,255,0.8)' : 'rgba(46,204,113,0.7)'
            const shadow = `0 0 ${size}px ${d.status === 'warning' ? 'rgba(243,156,18,0.4)' : 'rgba(46,204,113,0.3)'}`
            return { dealer: d, pos, size, bg, shadow }
        })
    }, [dealerList])

    return (
        <div style={mapContainerStyle}>
            <div style={mapOutlineStyle} />

            {dots.map(({ dealer: d, pos, size, bg, shadow }) => (
                <button key={d.id} onClick={() => onSelect(d)}
                    title={`${d.name} — ₺${(d.monthlyRevenue / 1000).toFixed(0)}k`}
                    style={{
                        position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: `${size}px`, height: `${size}px`,
                        borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: bg, boxShadow: shadow, transition: 'all 0.2s',
                    }}
                    onMouseEnter={canHover ? e => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.4)'; e.currentTarget.style.zIndex = 10 } : undefined}
                    onMouseLeave={canHover ? e => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'; e.currentTarget.style.zIndex = 1 } : undefined}
                />
            ))}

            <div style={legendStyle}>
                <span>🟢 Aktif</span><span>🟡 Uyarı</span><span>🔵 Yeni</span>
                <span>● Büyük = Yüksek ciro</span>
            </div>
        </div>
    )
})

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
const DealerDetailSlideOver = memo(function DealerDetailSlideOver({ dealer, onClose, onPushCatalog }) {
    if (!dealer) return null
    return (
        <div className="overlay" onClick={onClose}>
            <div className="overlay__backdrop" />
            <div onClick={e => e.stopPropagation()} className="slideover">
                <div className="overlay__header">
                    <h2 className="overlay__title">Bayi Detay</h2>
                    <button className="btn btn-ghost overlay__close" onClick={onClose}>✕</button>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{dealer.name}</h3>
                    <span className={`badge ${statusBadge[dealer.status].cls}`}>{statusBadge[dealer.status].label}</span>
                </div>

                {/* Contact Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    {[
                        ['👤', 'Yetkili', dealer.contact],
                        ['📍', 'Şehir / Bölge', `${dealer.city} — ${dealer.region}`],
                        ['📱', 'Telefon', dealer.phone],
                        ['📧', 'E-posta', dealer.email],
                    ].map(([icon, label, val]) => (
                        <div key={label} className="info-row">
                            <span>{icon}</span>
                            <div>
                                <div className="info-row__label">{label}</div>
                                <div className="info-row__value">{val}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Performance Stats */}
                <div className="grid-2-col" style={{ marginBottom: '20px' }}>
                    {[
                        { value: `₺${dealer.monthlyRevenue.toLocaleString('tr-TR')}`, label: 'Aylık Ciro', color: 'var(--accent-blue)' },
                        { value: dealer.orders, label: 'Sipariş', color: '#bc8cff' },
                        { value: dealer.demos, label: 'Demo', color: '#f0b429' },
                        { value: `${dealer.satisfaction}⭐`, label: 'Memnuniyet', color: '#2ecc71' },
                    ].map(s => (
                        <div key={s.label} className="stat-cell stat-cell--lg">
                            <div className="stat-cell__value stat-cell__value--lg" style={{ color: s.color }}>{s.value}</div>
                            <div className="stat-cell__label stat-cell__label--md">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Top Product + Markup */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>En Çok Satan Ürün</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{dealer.topProduct}</div>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Fiyat Markup</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                            {dealer.markup === 0 ? 'Liste Fiyatı (0%)' : `+%${dealer.markup} Markup`}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="action-col">
                    <button className="btn btn-primary" style={{ width: '100%' }}
                        onClick={() => window.open(`tel:${dealer.phone.replace(/\s/g, '')}`)}>📱 Ara</button>
                    <button className="btn btn-secondary" style={{ width: '100%' }}
                        onClick={() => window.open(`mailto:${dealer.email}`)}>📧 E-posta</button>
                    <button className="btn btn-secondary" style={{ width: '100%' }}
                        onClick={() => onPushCatalog(dealer.id)}>📤 Katalog Gönder</button>
                </div>
            </div>
        </div>
    )
})

export default function WhiteLabel() {
    const [selectedDealer, setSelectedDealer] = useState(null)
    const [regionFilter, setRegionFilter] = useState('Tümü')
    const [pushModalOpen, setPushModalOpen] = useState(false)
    const [pushTargets, setPushTargets] = useState([])
    const [pushSent, setPushSent] = useState(false)
    const canHover = useCanHover()

    /* Wrap dealer selection in startTransition so the heavy parent
       re-render (map, table, KPIs) doesn't block user input */
    const selectDealer = useCallback((d) => {
        startTransition(() => setSelectedDealer(d))
    }, [])
    const closeDealer = useCallback(() => {
        startTransition(() => setSelectedDealer(null))
    }, [])

    const filtered = useMemo(() =>
        dealers.filter(d => regionFilter === 'Tümü' || d.region === regionFilter)
        , [regionFilter])

    const kpiData = useMemo(() => {
        let revenue = 0, orders = 0, demos = 0, satSum = 0
        filtered.forEach(d => { revenue += d.monthlyRevenue; orders += d.orders; demos += d.demos; satSum += d.satisfaction })
        const avgSat = (satSum / filtered.length).toFixed(1)
        return {
            totalRevenue: revenue, totalOrders: orders, totalDemos: demos, avgSatisfaction: avgSat,
            stats: [
                { label: 'Toplam Ciro', value: `₺${(revenue / 1000).toFixed(0)}k`, icon: '💰', color: 'rgba(88, 166, 255, 0.1)' },
                { label: 'Toplam Sipariş', value: orders, icon: '📦', color: 'rgba(188, 140, 255, 0.1)' },
                { label: 'Demo Sayısı', value: demos, icon: '🎯', color: 'rgba(240, 180, 41, 0.1)' },
                { label: 'Ort. Memnuniyet', value: `${avgSat}⭐`, icon: '😊', color: 'rgba(63, 185, 80, 0.1)' },
            ]
        }
    }, [filtered])

    const top5 = useMemo(() => [...filtered].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).slice(0, 5), [filtered])

    // Pre-compute fabric demo stats — static data, never changes across renders
    const handlePushCatalog = useCallback((id) => {
        setPushTargets([id])
        setPushModalOpen(true)
        setPushSent(false)
    }, [])
    const fabricDemoStats = useMemo(() => {
        const fabricCounts = {}
        dealers.forEach(d => { fabricCounts[d.topProduct] = (fabricCounts[d.topProduct] || 0) + d.demos })
        const sorted = Object.entries(fabricCounts).sort((a, b) => b[1] - a[1]).slice(0, 4)
        const maxDemo = sorted[0]?.[1] || 1
        return sorted.map(([name, count]) => ({ name, count, pct: (count / maxDemo) * 100 }))
    }, [])

    const togglePushTarget = useCallback((id) => {
        setPushTargets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }, [])

    const handlePush = useCallback(() => {
        setPushSent(true)
        setTimeout(() => { setPushModalOpen(false); setPushSent(false); setPushTargets([]) }, 2000)
    }, [])

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">🏢 Bayi Ağı Yönetimi</h1>
                    <p className="page-subtitle">{dealers.length} bayi — {cityCount} şehir</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setPushModalOpen(true); setPushSent(false) }}>
                    📤 Yeni Koleksiyon Gönder
                </button>
            </div>

            {/* KPI */}
            <div className="grid-stats" style={{ marginBottom: '24px' }}>
                {kpiData.stats.map((stat, i) => (
                    <div key={i} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                        <div className="stat-icon" style={{ background: stat.color }}>{stat.icon}</div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Map */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>🗺️ Bayi Haritası</h3>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {regions.map(r => (
                            <button key={r} onClick={() => setRegionFilter(r)}
                                className={`btn ${regionFilter === r ? 'btn-secondary' : 'btn-ghost'}`}
                                style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
                <TurkeyMap dealers={filtered} onSelect={selectDealer} />
            </div>

            <div className="grid-sidebar-layout">
                {/* Left — Dealer Table */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>📋 Bayi Listesi</h3>
                    <div className="table-container">
                        <table className="table" role="table">
                            <thead>
                                <tr>
                                    <th>Bayi</th>
                                    <th>Şehir</th>
                                    <th>Aylık Ciro</th>
                                    <th>Sipariş</th>
                                    <th>Demo</th>
                                    <th>Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((d, i) => (
                                    <tr key={d.id} style={{ cursor: 'pointer' }}
                                        className="animate-fade-in-up"
                                        onClick={() => selectDealer(d)}>
                                        <td style={{ fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</td>
                                        <td>{d.city}</td>
                                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>₺{(d.monthlyRevenue / 1000).toFixed(1)}k</td>
                                        <td>{d.orders}</td>
                                        <td>{d.demos}</td>
                                        <td><span className={`badge ${statusBadge[d.status].cls}`}>{statusBadge[d.status].label}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right — Top 5 + Sidebar */}
                <div style={{ position: 'sticky', top: '100px' }}>
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>🏆 Top 5 Bayi</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {top5.map((d, i) => (
                                <div key={d.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }} onClick={() => selectDealer(d)}
                                    onMouseEnter={canHover ? e => e.currentTarget.style.background = 'rgba(88,166,255,0.08)' : undefined}
                                    onMouseLeave={canHover ? e => e.currentTarget.style.background = 'var(--bg-tertiary)' : undefined}>
                                    <span style={{
                                        width: '26px', height: '26px', borderRadius: 'var(--radius-sm)',
                                        background: i === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' : i === 1 ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' : i === 2 ? 'linear-gradient(135deg, #CD7F32, #A0522D)' : 'var(--bg-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.75rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                                    }}>{i + 1}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{d.city}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.88rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>₺{(d.monthlyRevenue / 1000).toFixed(0)}k</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{d.orders} sipariş</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Most Demoed Fabric */}
                    <div className="card">
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>🎯 En Çok Demo Yapılan</h3>
                        {fabricDemoStats.map(({ name, count, pct }) => (
                            <div key={name} style={{ marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 600 }}>{name}</span>
                                    <span style={{ color: 'var(--text-tertiary)' }}>{count} demo</span>
                                </div>
                                <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', width: `${pct}%`,
                                        background: 'var(--gradient-brand)', borderRadius: '3px',
                                        transition: 'width 0.5s ease',
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Dealer Detail Slide-over */}
            {selectedDealer && (
                <DealerDetailSlideOver
                    dealer={selectedDealer}
                    onClose={closeDealer}
                    onPushCatalog={handlePushCatalog}
                />
            )}

            {/* Catalog Push Modal */}
            {pushModalOpen && (
                <div className="overlay overlay--center"
                    onClick={() => !pushSent && setPushModalOpen(false)}>
                    <div className="overlay__backdrop" />
                    <div onClick={e => e.stopPropagation()} className="modal-panel">
                        {pushSent ? (
                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Koleksiyon Gönderildi!</h3>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    {pushTargets.length} bayiye yeni katalog başarıyla iletildi.
                                </p>
                            </div>
                        ) : (
                            <>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>📤 Yeni Koleksiyon Gönder</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                                    Gönderilecek bayileri seçin. Seçili bayilerin POS ve demo sistemleri otomatik güncellenir.
                                </p>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                                    {dealers.map(d => (
                                        <label key={d.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '8px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                            background: pushTargets.includes(d.id) ? 'rgba(88,166,255,0.08)' : 'var(--bg-tertiary)',
                                            border: pushTargets.includes(d.id) ? '1px solid rgba(88,166,255,0.3)' : '1px solid transparent',
                                            transition: 'all 0.15s',
                                        }}>
                                            <input type="checkbox" checked={pushTargets.includes(d.id)}
                                                onChange={() => togglePushTarget(d.id)}
                                                style={{ accentColor: 'var(--accent-blue)' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{d.name}</div>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{d.city}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem' }}
                                        onClick={() => setPushTargets(pushTargets.length === dealers.length ? [] : dealers.map(d => d.id))}>
                                        {pushTargets.length === dealers.length ? 'Hiçbirini Seçme' : 'Tümünü Seç'}
                                    </button>
                                    <div style={{ flex: 1 }} />
                                    <button className="btn btn-secondary" onClick={() => setPushModalOpen(false)}>İptal</button>
                                    <button className="btn btn-primary" onClick={handlePush}
                                        disabled={pushTargets.length === 0}>
                                        📤 {pushTargets.length} Bayiye Gönder
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
