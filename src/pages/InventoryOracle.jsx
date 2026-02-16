import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react'

/* ═══════════════════════════════════════════════════
   MOCK DATA — Seasonal Sales History per Product
   ═══════════════════════════════════════════════════ */
const products = [
    { id: 1, name: 'Kadife Bordo', stock: 24, price: 450, monthlyAvg: 8, category: 'Fon', season: 'autumn' },
    { id: 2, name: 'Tül Beyaz', stock: 48, price: 150, monthlyAvg: 14, category: 'Tül', season: 'spring' },
    { id: 3, name: 'İpek Krem', stock: 11, price: 680, monthlyAvg: 6, category: 'Fon', season: 'all' },
    { id: 4, name: 'Keten Lacivert', stock: 18, price: 320, monthlyAvg: 5, category: 'Fon', season: 'summer' },
    { id: 5, name: 'Blackout Siyah', stock: 15, price: 380, monthlyAvg: 9, category: 'Stor', season: 'winter' },
    { id: 6, name: 'Pamuk Gri', stock: 32, price: 220, monthlyAvg: 7, category: 'Fon', season: 'all' },
    { id: 7, name: 'Jakar Altın', stock: 6, price: 550, monthlyAvg: 4, category: 'Fon', season: 'autumn' },
    { id: 8, name: 'Kadife Zümrüt', stock: 9, price: 470, monthlyAvg: 5, category: 'Fon', season: 'winter' },
]

const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

// Seasonal multipliers: how much above/below average each month is
const seasonalPatterns = {
    spring: [0.6, 0.7, 1.3, 1.6, 1.8, 1.4, 0.9, 0.7, 0.8, 0.7, 0.5, 0.5],
    summer: [0.5, 0.6, 0.8, 1.0, 1.3, 1.6, 1.7, 1.5, 1.0, 0.7, 0.5, 0.4],
    autumn: [0.5, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.2, 1.5, 1.7, 1.6, 1.2],
    winter: [1.4, 1.3, 1.0, 0.7, 0.5, 0.4, 0.4, 0.5, 0.8, 1.2, 1.5, 1.7],
    all: [1.0, 0.9, 1.0, 1.1, 1.1, 1.0, 0.9, 0.8, 1.0, 1.1, 1.1, 1.0],
}

function generateSalesHistory(product) {
    const pattern = seasonalPatterns[product.season]
    return pattern.map((mult, i) => {
        const base = product.monthlyAvg * mult
        const noise = (Math.random() - 0.5) * product.monthlyAvg * 0.3
        return Math.max(0, Math.round(base + noise))
    })
}

// Pre-generate consistent histories using product id as pseudo-seed
const salesHistories = {}
products.forEach(p => {
    // Deterministic-ish using id
    const pattern = seasonalPatterns[p.season]
    salesHistories[p.id] = pattern.map((mult, i) => {
        const base = p.monthlyAvg * mult
        const seed = ((p.id * 31 + i * 17) % 100) / 100 - 0.5
        const noise = seed * p.monthlyAvg * 0.3
        return Math.max(0, Math.round(base + noise))
    })
})

function predictDaysUntilStockout(product) {
    const currentMonth = 1 // Şubat (0-indexed)
    const nextMonths = [1, 2, 3] // Şub, Mar, Nis
    const history = salesHistories[product.id]
    const avgNext3 = nextMonths.reduce((sum, m) => sum + history[m], 0) / 3
    const dailyRate = avgNext3 / 30
    if (dailyRate <= 0) return Infinity
    return Math.round(product.stock / dailyRate)
}

function getRiskLevel(days) {
    if (days <= 14) return { level: 'critical', label: 'Kritik', color: '#e74c3c', icon: '🔴' }
    if (days <= 30) return { level: 'warning', label: 'Uyarı', color: '#f39c12', icon: '🟡' }
    if (days <= 60) return { level: 'watch', label: 'İzle', color: '#3498db', icon: '🔵' }
    return { level: 'safe', label: 'Güvenli', color: '#2ecc71', icon: '🟢' }
}

/* ═══════════════════════════════════════════════════
   MINI CANVAS CHARTS
   ═══════════════════════════════════════════════════ */
const SeasonalChart = memo(function SeasonalChart({ data, currentMonth = 1, color = '#58a6ff', height = 180 }) {
    const canvasRef = useRef(null)
    const cssVarsRef = useRef({ gridColor: 'rgba(48,54,61,0.5)', textColor: '#6e7681' })

    // Cache CSS custom property reads — avoid getComputedStyle on every paint
    useEffect(() => {
        const style = getComputedStyle(document.documentElement)
        cssVarsRef.current = {
            gridColor: style.getPropertyValue('--border-primary').trim() || 'rgba(48,54,61,0.5)',
            textColor: style.getPropertyValue('--text-tertiary').trim() || '#6e7681',
        }
    }, []) // runs once; theme changes handled by re-mount via key

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)

        const w = rect.width, h = rect.height
        const pad = { top: 20, right: 16, bottom: 32, left: 40 }
        const cw = w - pad.left - pad.right
        const ch = h - pad.top - pad.bottom
        const max = Math.max(...data) * 1.2 || 1

        ctx.clearRect(0, 0, w, h)

        const { gridColor, textColor } = cssVarsRef.current

        // Grid
        ctx.strokeStyle = gridColor
        ctx.lineWidth = 0.5
        for (let i = 0; i <= 3; i++) {
            const y = pad.top + (ch / 3) * i
            ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke()
            ctx.fillStyle = textColor; ctx.font = '10px Inter'; ctx.textAlign = 'right'
            ctx.fillText(Math.round(max - (max / 3) * i), pad.left - 6, y + 3)
        }

        // Month labels
        ctx.fillStyle = textColor; ctx.font = '10px Inter'; ctx.textAlign = 'center'
        const step = cw / (data.length - 1)
        data.forEach((_, i) => {
            const x = pad.left + step * i
            ctx.fillStyle = i === currentMonth ? color : textColor
            ctx.font = i === currentMonth ? 'bold 10px Inter' : '10px Inter'
            ctx.fillText(months[i], x, h - 8)
        })

        // Area fill
        const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom)
        grad.addColorStop(0, color + '33')
        grad.addColorStop(1, color + '00')
        ctx.beginPath()
        data.forEach((val, i) => {
            const x = pad.left + step * i
            const y = pad.top + ch - (val / max) * ch
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        ctx.lineTo(pad.left + cw, pad.top + ch)
        ctx.lineTo(pad.left, pad.top + ch)
        ctx.closePath()
        ctx.fillStyle = grad
        ctx.fill()

        // Line
        ctx.beginPath()
        data.forEach((val, i) => {
            const x = pad.left + step * i
            const y = pad.top + ch - (val / max) * ch
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        ctx.strokeStyle = color; ctx.lineWidth = 2.5
        ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke()

        // Dots + current month highlight
        data.forEach((val, i) => {
            const x = pad.left + step * i
            const y = pad.top + ch - (val / max) * ch
            ctx.beginPath(); ctx.arc(x, y, i === currentMonth ? 5 : 3, 0, Math.PI * 2)
            ctx.fillStyle = color; ctx.fill()
            if (i === currentMonth) {
                ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2)
                ctx.strokeStyle = color + '44'; ctx.lineWidth = 2; ctx.stroke()
            }
        })
    }, [data, currentMonth, color, height])

    const canvasStyle = useMemo(() => ({ width: '100%', height: `${height}px`, display: 'block' }), [height])
    return <canvas ref={canvasRef} style={canvasStyle} />
})

/* ═══════════════════════════════════════════════════
   HEATMAP
   ═══════════════════════════════════════════════════ */
// Pre-compute heatmap max once at module level — static data never changes
const heatmapMaxVal = (() => {
    let mx = 0
    products.forEach(p => { salesHistories[p.id].forEach(v => { if (v > mx) mx = v }) })
    return mx || 1
})()

const heatmapThStyle = { padding: '6px 4px', color: 'var(--text-tertiary)', fontWeight: 500, textAlign: 'center', minWidth: '36px' }
const heatmapNameStyle = { padding: '6px 10px', fontWeight: 600, whiteSpace: 'nowrap' }

const SeasonHeatmap = memo(function SeasonHeatmap() {
    // Pre-compute all cell styles to avoid object allocation in render loop
    const cellData = useMemo(() => {
        return products.map(p => ({
            id: p.id,
            name: p.name,
            cells: salesHistories[p.id].map(val => {
                const intensity = val / heatmapMaxVal
                return {
                    val,
                    style: {
                        padding: '6px 4px', textAlign: 'center', borderRadius: '2px',
                        background: `rgba(88, 166, 255, ${intensity * 0.7 + 0.05})`,
                        color: intensity > 0.5 ? '#fff' : 'var(--text-secondary)',
                        fontWeight: intensity > 0.6 ? 700 : 400,
                    }
                }
            })
        }))
    }, [])

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-tertiary)', fontWeight: 500 }}>Kumaş</th>
                        {months.map(m => (
                            <th key={m} style={heatmapThStyle}>{m}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {cellData.map(row => (
                        <tr key={row.id}>
                            <td style={heatmapNameStyle}>{row.name}</td>
                            {row.cells.map((cell, i) => (
                                <td key={i} style={cell.style}>{cell.val}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
})

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function InventoryOracle() {
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [aiLoading, setAiLoading] = useState(false)
    const [aiInsight, setAiInsight] = useState(null)

    const predictions = useMemo(() =>
        products.map(p => {
            const days = predictDaysUntilStockout(p)
            const risk = getRiskLevel(days)
            return { ...p, daysLeft: days, risk, history: salesHistories[p.id] }
        }).sort((a, b) => a.daysLeft - b.daysLeft)
        , [])

    const { criticalCount, warningCount } = useMemo(() => {
        let critical = 0, warning = 0
        predictions.forEach(p => {
            if (p.risk.level === 'critical') critical++
            else if (p.risk.level === 'warning') warning++
        })
        return { criticalCount: critical, warningCount: warning }
    }, [predictions])

    // Memoize KPI cards data to prevent allocation on every render
    const kpiStats = useMemo(() => [
        { label: 'Toplam Ürün', value: products.length, icon: '📦', color: 'rgba(88, 166, 255, 0.1)' },
        { label: 'Kritik Stok', value: criticalCount, icon: '🔴', color: 'rgba(231, 76, 60, 0.1)' },
        { label: 'Uyarı', value: warningCount, icon: '🟡', color: 'rgba(243, 156, 18, 0.1)' },
        { label: 'Güvenli', value: products.length - criticalCount - warningCount, icon: '🟢', color: 'rgba(46, 204, 113, 0.1)' },
    ], [criticalCount, warningCount])

    const handleAIInsight = useCallback(async (product) => {
        setAiLoading(true)
        setAiInsight(null)
        // Simulate AI response
        await new Promise(r => setTimeout(r, 2000))
        const pattern = product.season === 'spring' ? 'Bahar aylarında talep artışı bekleniyor'
            : product.season === 'autumn' ? 'Sonbahar sezonu yaklaşırken talep yükselecek'
                : product.season === 'winter' ? 'Kış aylarında karartma ihtiyacı artacak'
                    : product.season === 'summer' ? 'Yaz aylarında hafif kumaş talebi yükselir'
                        : 'Yıl boyunca stabil talep gösteren bir ürün'

        const reorderQty = Math.ceil(product.monthlyAvg * 2.5)
        const cost = reorderQty * product.price

        setAiInsight({
            product: product.name,
            prediction: `${product.name} mevcut satış hızında ${product.daysLeft} gün içinde tükenecek. ${pattern}. Önümüzdeki 2.5 aylık ihtiyacı karşılamak için en az ${reorderQty} adet sipariş vermenizi öneriyoruz.`,
            reorderQty,
            estimatedCost: cost,
            urgency: product.risk.level === 'critical' ? 'Acil sipariş verin!' : product.risk.level === 'warning' ? 'Bu hafta içinde sipariş planlanmalı.' : 'Planlı sipariş yeterli.',
            seasonTip: pattern,
        })
        setAiLoading(false)
    }, [])

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">🔮 AI Inventory Oracle</h1>
                    <p className="page-subtitle">Akıllı stok analizi ve tükenme tahmini</p>
                </div>
            </div>

            {/* Alert Banner */}
            {criticalCount > 0 && (
                <div className="animate-fade-in-up" style={{
                    padding: '14px 20px', marginBottom: '20px',
                    background: 'rgba(231, 76, 60, 0.08)', border: '1px solid rgba(231, 76, 60, 0.25)',
                    borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e74c3c' }}>
                            {criticalCount} ürün kritik stok seviyesinde!
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {warningCount > 0 && `${warningCount} ürün uyarı seviyesinde. `}
                            Acil sipariş gerekebilir.
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid-stats" style={{ marginBottom: '24px' }}>
                {kpiStats.map((stat, i) => (
                    <div key={i} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className="stat-icon" style={{ background: stat.color }}>{stat.icon}</div>
                        </div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid-sidebar-layout">
                {/* Left — Stock Risk Table */}
                <div>
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>📊 Stok Risk Tablosu</h3>
                        <div className="table-container">
                            <table className="table" role="table">
                                <thead>
                                    <tr>
                                        <th>Ürün</th>
                                        <th>Stok</th>
                                        <th>Ort. Satış/Ay</th>
                                        <th>Tükenme</th>
                                        <th>Risk</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {predictions.map((p, i) => (
                                        <tr key={p.id} className="animate-fade-in-up"
                                            style={{ animationDelay: `${i * 0.04}s`, cursor: 'pointer' }}
                                            onClick={() => setSelectedProduct(p)}>
                                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                                            <td>
                                                <span style={{
                                                    fontWeight: 700, fontFamily: 'var(--font-display)',
                                                    color: p.stock <= 10 ? '#e74c3c' : p.stock <= 20 ? '#f39c12' : 'var(--text-primary)',
                                                }}>{p.stock}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: '4px' }}>adet</span>
                                            </td>
                                            <td>{p.monthlyAvg}</td>
                                            <td>
                                                <span style={{
                                                    fontWeight: 700, color: p.risk.color,
                                                    fontFamily: 'var(--font-display)',
                                                }}>
                                                    {p.daysLeft === Infinity ? '∞' : `${p.daysLeft} gün`}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${p.risk.level === 'critical' ? 'badge-danger' : p.risk.level === 'warning' ? 'badge-warning' : p.risk.level === 'watch' ? 'badge-info' : 'badge-success'}`}>
                                                    {p.risk.icon} {p.risk.label}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                                                    onClick={(e) => { e.stopPropagation(); handleAIInsight(p) }}>
                                                    ✨ AI Analiz
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Seasonal Heatmap */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>🗓️ Mevsimsel Satış Heatmap</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
                            Her kumaşın aylık tahmini satışı (adet)
                        </p>
                        <SeasonHeatmap />
                    </div>
                </div>

                {/* Right — AI Insight Panel + Product Chart */}
                <div style={{ position: 'sticky', top: '100px' }}>
                    {/* AI Insight Card */}
                    <div className="card" style={{ marginBottom: '16px', border: '1px solid rgba(88, 166, 255, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🧠</span>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>AI Stok Danışmanı</h3>
                        </div>

                        {aiLoading ? (
                            <div style={{ textAlign: 'center', padding: '30px 0' }}>
                                <div style={{ fontSize: '1.5rem', animation: 'spin 1.5s linear infinite', marginBottom: '8px' }}>🔮</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>AI analiz yapıyor...</div>
                            </div>
                        ) : aiInsight ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{
                                    padding: '12px', background: 'rgba(88, 166, 255, 0.05)',
                                    borderRadius: 'var(--radius-md)', fontSize: '0.82rem',
                                    lineHeight: 1.6, color: 'var(--text-secondary)',
                                    borderLeft: '3px solid var(--accent-blue)',
                                }}>
                                    {aiInsight.prediction}
                                </div>

                                <div className="grid-2-col" style={{ gap: '10px' }}>
                                    <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{aiInsight.reorderQty}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Önerilen Sipariş</div>
                                    </div>
                                    <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                            ₺{aiInsight.estimatedCost.toLocaleString('tr-TR')}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Tahmini Maliyet</div>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '10px 12px', borderRadius: 'var(--radius-md)',
                                    background: aiInsight.urgency.includes('Acil') ? 'rgba(231,76,60,0.08)' : 'rgba(46,204,113,0.08)',
                                    fontSize: '0.78rem', fontWeight: 600,
                                    color: aiInsight.urgency.includes('Acil') ? '#e74c3c' : '#2ecc71',
                                }}>
                                    ⚡ {aiInsight.urgency}
                                </div>

                                <button className="btn btn-primary" style={{ width: '100%' }}
                                    onClick={() => alert(`Tedarikçiye sipariş formu oluşturuldu: ${aiInsight.reorderQty} adet ${aiInsight.product}`)}>
                                    📋 Sipariş Formu Oluştur
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '30px 0' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.3 }}>🔮</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                    Bir ürünün "✨ AI Analiz" butonuna tıklayın
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Seasonal Chart */}
                    <div className="card">
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
                            📈 {selectedProduct ? selectedProduct.name : 'Ürün Seçin'}
                        </h3>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                            12 aylık tahmini satış trendi
                        </p>
                        {selectedProduct ? (
                            <SeasonalChart
                                data={selectedProduct.history}
                                color={selectedProduct.risk.color}
                            />
                        ) : (
                            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                                Tablodan bir ürün seçin
                            </div>
                        )}

                        {selectedProduct && (
                            <div style={{
                                marginTop: '12px', padding: '10px', background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--text-secondary)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span>Sezon:</span>
                                    <span style={{ fontWeight: 600 }}>
                                        {selectedProduct.season === 'spring' ? '🌸 Bahar' : selectedProduct.season === 'summer' ? '☀️ Yaz' : selectedProduct.season === 'autumn' ? '🍂 Sonbahar' : selectedProduct.season === 'winter' ? '❄️ Kış' : '📅 Tüm Yıl'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span>Peak Ay:</span>
                                    <span style={{ fontWeight: 600 }}>{months[selectedProduct.history.indexOf(Math.max(...selectedProduct.history))]}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Peak Satış:</span>
                                    <span style={{ fontWeight: 600 }}>{Math.max(...selectedProduct.history)} adet</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
