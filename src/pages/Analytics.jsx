import { useState, useMemo, useRef, useEffect } from 'react'

/* ─── Mock Data ─── */
const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

const fabricHeatmapData = [
    { name: 'Kadife Bordo', demos: 145, orders: 52, conversion: 35.9, color: '#8B1A1A' },
    { name: 'İpek Krem', demos: 210, orders: 89, conversion: 42.4, color: '#F5E6D3' },
    { name: 'Keten Lacivert', demos: 178, orders: 41, conversion: 23.0, color: '#1B2A4A' },
    { name: 'Pamuk Gri', demos: 95, orders: 38, conversion: 40.0, color: '#7A7D82' },
    { name: 'Blackout Siyah', demos: 132, orders: 78, conversion: 59.1, color: '#1A1A2E' },
    { name: 'Tül Beyaz', demos: 285, orders: 156, conversion: 54.7, color: '#E8E8FF' },
    { name: 'Jakar Altın', demos: 67, orders: 31, conversion: 46.3, color: '#B8860B' },
    { name: 'Kadife Zümrüt', demos: 98, orders: 29, conversion: 29.6, color: '#1B5E3B' },
]

const teamData = [
    { name: 'Ekip A (Ahmet)', avgSpeed: 92, satisfaction: 4.7, jobs: 48, efficiency: 95 },
    { name: 'Ekip B (Mehmet)', avgSpeed: 85, satisfaction: 4.3, jobs: 42, efficiency: 88 },
    { name: 'Ekip C (Ayşe)', avgSpeed: 97, satisfaction: 4.9, jobs: 51, efficiency: 98 },
    { name: 'Ekip D (Fatma)', avgSpeed: 78, satisfaction: 4.1, jobs: 35, efficiency: 82 },
]

const revenueData = [42000, 38000, 51000, 55000, 48000, 62000, 71000, 65000, 78000, 82000, 75000, 89000]
const orderData = [28, 22, 35, 38, 32, 42, 48, 44, 52, 55, 50, 60]

/* ─── Canvas Chart (lightweight, no lib) ─── */
function CanvasChart({ data, labels, width = 500, height = 200, color = '#58A6FF', type = 'line' }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const dpr = window.devicePixelRatio || 1
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, width, height)

        const padding = { top: 20, right: 20, bottom: 30, left: 50 }
        const chartW = width - padding.left - padding.right
        const chartH = height - padding.top - padding.bottom
        const max = Math.max(...data) * 1.1
        const min = 0

        // Grid lines
        ctx.strokeStyle = 'rgba(128,128,128,0.15)'
        ctx.lineWidth = 1
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH * i) / 4
            ctx.beginPath()
            ctx.moveTo(padding.left, y)
            ctx.lineTo(width - padding.right, y)
            ctx.stroke()
            // Label
            const val = max - (max * i) / 4
            ctx.fillStyle = 'rgba(128,128,128,0.6)'
            ctx.font = '10px sans-serif'
            ctx.textAlign = 'right'
            ctx.fillText(val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0), padding.left - 8, y + 4)
        }

        // X labels
        ctx.fillStyle = 'rgba(128,128,128,0.6)'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        const stepX = chartW / (data.length - 1)
        labels.forEach((l, i) => {
            ctx.fillText(l, padding.left + i * stepX, height - 8)
        })

        if (type === 'bar') {
            const barW = (chartW / data.length) * 0.6
            const gap = (chartW / data.length) * 0.4
            data.forEach((d, i) => {
                const x = padding.left + i * (chartW / data.length) + gap / 2
                const barH = (d / max) * chartH
                const y = padding.top + chartH - barH
                const grad = ctx.createLinearGradient(x, y, x, y + barH)
                grad.addColorStop(0, color)
                grad.addColorStop(1, color + '44')
                ctx.fillStyle = grad
                ctx.beginPath()
                ctx.roundRect(x, y, barW, barH, 3)
                ctx.fill()
            })
        } else {
            // Line + area
            ctx.beginPath()
            data.forEach((d, i) => {
                const x = padding.left + i * stepX
                const y = padding.top + chartH - (d / max) * chartH
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            })
            ctx.strokeStyle = color
            ctx.lineWidth = 2.5
            ctx.lineJoin = 'round'
            ctx.stroke()

            // Area fill
            const lastX = padding.left + (data.length - 1) * stepX
            ctx.lineTo(lastX, padding.top + chartH)
            ctx.lineTo(padding.left, padding.top + chartH)
            ctx.closePath()
            const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH)
            grad.addColorStop(0, color + '30')
            grad.addColorStop(1, color + '05')
            ctx.fillStyle = grad
            ctx.fill()

            // Dots
            data.forEach((d, i) => {
                const x = padding.left + i * stepX
                const y = padding.top + chartH - (d / max) * chartH
                ctx.beginPath()
                ctx.arc(x, y, 3.5, 0, Math.PI * 2)
                ctx.fillStyle = color
                ctx.fill()
                ctx.strokeStyle = 'var(--bg-primary)'
                ctx.lineWidth = 2
                ctx.stroke()
            })
        }
    }, [data, labels, width, height, color, type])

    return <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px` }} />
}

/* ─── KPI Card ─── */
function KPICard({ label, value, suffix = '', trend, icon }) {
    const isUp = trend >= 0
    return (
        <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>{label}</div>
                    <div style={{
                        fontSize: '1.6rem', fontWeight: 800,
                        background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        {value}{suffix}
                    </div>
                </div>
                <span style={{ fontSize: '1.5rem', opacity: 0.4 }}>{icon}</span>
            </div>
            {trend !== undefined && (
                <div style={{
                    fontSize: '0.72rem', marginTop: '8px',
                    color: isUp ? 'var(--accent-green)' : '#e74c3c',
                    display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                    {isUp ? '↑' : '↓'} {Math.abs(trend)}% geçen aya göre
                </div>
            )}
        </div>
    )
}

/* ─── Main ─── */
export default function Analytics() {
    const [period, setPeriod] = useState('year')

    const totalRevenue = useMemo(() => revenueData.reduce((a, b) => a + b, 0), [])
    const totalOrders = useMemo(() => orderData.reduce((a, b) => a + b, 0), [])
    const avgConversion = useMemo(() =>
        Math.round(fabricHeatmapData.reduce((a, b) => a + b.conversion, 0) / fabricHeatmapData.length * 10) / 10
        , [])

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analitik Vizyon</h1>
                    <p className="page-subtitle">Holding seviyesi performans ve dönüşüm analitiği</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {['month', 'quarter', 'year'].map(p => (
                        <button key={p}
                            className={`tab ${period === p ? 'active' : ''}`}
                            style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.78rem' }}
                            onClick={() => setPeriod(p)}>
                            {p === 'month' ? 'Ay' : p === 'quarter' ? 'Çeyrek' : 'Yıl'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPIs */}
            <div className="grid-4-col" style={{ marginBottom: '24px' }}>
                <KPICard label="Toplam Gelir" value={`₺${(totalRevenue / 1000).toFixed(0)}K`} trend={12.4} icon="💰" />
                <KPICard label="Toplam Sipariş" value={totalOrders} trend={8.2} icon="📦" />
                <KPICard label="Dönüşüm Oranı" value={avgConversion} suffix="%" trend={3.1} icon="🎯" />
                <KPICard label="Müşteri LTV" value="₺2.4K" trend={-1.5} icon="👥" />
            </div>

            {/* Charts Row */}
            <div className="grid-2-col" style={{ gap: '24px', marginBottom: '24px' }}>
                <div className="card">
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>📈 Aylık Gelir</h3>
                    <CanvasChart data={revenueData} labels={months} color="#58A6FF" width={480} height={200} />
                </div>
                <div className="card">
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>📦 Sipariş Trendi</h3>
                    <CanvasChart data={orderData} labels={months} color="#2ecc71" width={480} height={200} type="bar" />
                </div>
            </div>

            {/* Heatmap + Team */}
            <div className="grid-2-col" style={{ gap: '24px' }}>
                {/* Fabric Heatmap */}
                <div className="card">
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>🔥 Kumaş Sıcak Harita</h3>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
                        Demo görüntülenme vs sipariş dönüşüm oranı
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {fabricHeatmapData
                            .sort((a, b) => b.demos - a.demos)
                            .map((f, i) => {
                                const heatColor = f.conversion > 50
                                    ? 'rgba(46, 204, 113, 0.2)'
                                    : f.conversion > 30
                                        ? 'rgba(241, 196, 15, 0.15)'
                                        : 'rgba(231, 76, 60, 0.12)'
                                return (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 12px', borderRadius: 'var(--radius-md)',
                                        background: heatColor,
                                    }}>
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '4px',
                                            background: f.color, border: '1px solid var(--border-primary)',
                                            flexShrink: 0,
                                        }} />
                                        <div style={{ flex: 1, fontSize: '0.8rem', fontWeight: 500 }}>{f.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textAlign: 'right' }}>
                                            <div>{f.demos} demo</div>
                                            <div>{f.orders} sipariş</div>
                                        </div>
                                        <div style={{
                                            fontSize: '0.85rem', fontWeight: 700, width: '55px', textAlign: 'right',
                                            color: f.conversion > 50 ? 'var(--accent-green)' : f.conversion > 30 ? '#f1c40f' : '#e74c3c',
                                        }}>
                                            %{f.conversion}
                                        </div>
                                    </div>
                                )
                            })}
                    </div>
                </div>

                {/* Team Performance */}
                <div className="card">
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>⚡ Montaj Ekip Performansı</h3>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
                        Hız, memnuniyet ve verimlilik skorları
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {teamData
                            .sort((a, b) => b.efficiency - a.efficiency)
                            .map((t, i) => (
                                <div key={i} style={{
                                    padding: '12px 14px', background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.name}</span>
                                        <span style={{
                                            fontSize: '0.75rem', padding: '3px 8px',
                                            borderRadius: 'var(--radius-full)',
                                            background: t.efficiency >= 95 ? 'rgba(46, 204, 113, 0.15)' : t.efficiency >= 85 ? 'rgba(241, 196, 15, 0.15)' : 'rgba(231, 76, 60, 0.12)',
                                            color: t.efficiency >= 95 ? 'var(--accent-green)' : t.efficiency >= 85 ? '#f1c40f' : '#e74c3c',
                                            fontWeight: 600,
                                        }}>
                                            %{t.efficiency}
                                        </span>
                                    </div>
                                    <div className="grid-3-col" style={{ gap: '8px', fontSize: '0.72rem' }}>
                                        <div>
                                            <span style={{ color: 'var(--text-tertiary)' }}>Hız</span>
                                            <div style={{ fontWeight: 600 }}>{t.avgSpeed}/100</div>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--text-tertiary)' }}>Memnuniyet</span>
                                            <div style={{ fontWeight: 600 }}>⭐ {t.satisfaction}</div>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--text-tertiary)' }}>İş Sayısı</span>
                                            <div style={{ fontWeight: 600 }}>{t.jobs}</div>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div style={{
                                        marginTop: '8px', height: '4px', borderRadius: '2px',
                                        background: 'rgba(128,128,128,0.15)', overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${t.efficiency}%`, height: '100%', borderRadius: '2px',
                                            background: t.efficiency >= 95 ? 'var(--accent-green)' : t.efficiency >= 85 ? '#f1c40f' : '#e74c3c',
                                            transition: 'width 0.5s ease',
                                        }} />
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
