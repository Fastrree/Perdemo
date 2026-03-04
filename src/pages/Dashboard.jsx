import { useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../hooks/useCurrency'
import { generateDashboardReport } from '../utils/excelReport'
import { useDashboard } from '../hooks/useDashboard'

// KPI card definitions (values filled from API)
const statDefTemplates = [
    { labelKey: 'stats.totalRevenue', icon: '💰', color: 'rgba(88, 166, 255, 0.12)', accent: 'var(--accent-blue)', field: 'totalRevenue', format: null },
    { labelKey: 'stats.orders', icon: '📦', color: 'rgba(139, 92, 246, 0.12)', accent: '#bc8cff', field: 'totalOrders', format: v => String(v || 0) },
    { labelKey: 'stats.products', icon: '🪟', color: 'rgba(240, 180, 41, 0.12)', accent: '#f0b429', field: 'totalProducts', format: v => String(v || 0) },
    { labelKey: 'stats.customers', icon: '👥', color: 'rgba(63, 185, 80, 0.12)', accent: '#3fb950', field: 'totalCustomers', format: v => String(v || 0) },
]

// Top products — derived from API stats (see useDashboard → /api/dashboard/stats)

const statusKeys = {
    pending: { labelKey: 'status.pending', class: 'badge-warning' },
    processing: { labelKey: 'status.processing', class: 'badge-info' },
    shipped: { labelKey: 'status.shipped', class: 'badge-purple' },
    delivered: { labelKey: 'status.delivered', class: 'badge-success' },
    cancelled: { labelKey: 'status.cancelled', class: 'badge-inactive' },
}

const monthKeys = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const chartData = [30, 45, 38, 55, 48, 62, 58, 72, 68, 85, 78, 92]
const currentMonthIdx = 1

/* ═══════════════════════════════════════════════════
   RESPONSIVE CANVAS CHART — containerRef pattern
   ═══════════════════════════════════════════════════ */
const MiniChart = memo(function MiniChart() {
    const { t } = useTranslation('dashboard')
    const { symbol: sym } = useCurrency()
    const months = t('chart.months', { returnObjects: true })
    const canvasRef = useRef(null)
    const containerRef = useRef(null)

    useEffect(() => {
        function drawChart() {
            const canvas = canvasRef.current
            const container = containerRef.current
            if (!canvas || !container) return
            const ctx = canvas.getContext('2d')
            const dpr = window.devicePixelRatio || 1
            const rect = container.getBoundingClientRect()
            const w = rect.width
            const h = 280

            canvas.width = w * dpr
            canvas.height = h * dpr
            ctx.scale(dpr, dpr)
            ctx.clearRect(0, 0, w, h)

            const data = chartData
            const max = (data.length ? Math.max(...data) : 1) * 1.15
            const isMobileChart = w < 400
            const fontSize = isMobileChart ? '9px Inter' : '11px Inter'
            const padding = { top: 20, right: 15, bottom: 40, left: isMobileChart ? 40 : 50 }
            const chartW = w - padding.left - padding.right
            const chartH = h - padding.top - padding.bottom

            // CSS variables for grid/text colors
            const style = getComputedStyle(document.documentElement)
            const gridColor = style.getPropertyValue('--border-primary').trim() || 'rgba(48,54,61,0.5)'
            const textColor = style.getPropertyValue('--text-tertiary').trim() || '#6e7681'

            // Grid lines
            ctx.strokeStyle = gridColor
            ctx.lineWidth = 0.5
            for (let i = 0; i <= 4; i++) {
                const y = padding.top + (chartH / 4) * i
                ctx.beginPath()
                ctx.moveTo(padding.left, y)
                ctx.lineTo(w - padding.right, y)
                ctx.stroke()

                ctx.fillStyle = textColor
                ctx.font = fontSize
                ctx.textAlign = 'right'
                const val = Math.round(max - (max / 4) * i)
                ctx.fillText(`${sym}${val}k`, padding.left - 8, y + 4)
            }

            // Month labels
            const labelStep = isMobileChart ? 2 : 1
            ctx.font = fontSize
            ctx.textAlign = 'center'
            data.forEach((_, i) => {
                if (i % labelStep !== 0) return
                const x = padding.left + (chartW / (data.length - 1)) * i
                ctx.fillStyle = i === currentMonthIdx ? '#58a6ff' : textColor
                ctx.font = i === currentMonthIdx ? `bold ${isMobileChart ? '9px' : '11px'} Inter` : fontSize
                ctx.fillText(months[i], x, h - 10)
            })

            // Gradient fill under line
            const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom)
            gradient.addColorStop(0, 'rgba(88, 166, 255, 0.2)')
            gradient.addColorStop(1, 'rgba(88, 166, 255, 0)')

            ctx.beginPath()
            data.forEach((val, i) => {
                const x = padding.left + (chartW / (data.length - 1)) * i
                const y = padding.top + chartH - (val / max) * chartH
                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            })
            ctx.lineTo(padding.left + chartW, padding.top + chartH)
            ctx.lineTo(padding.left, padding.top + chartH)
            ctx.closePath()
            ctx.fillStyle = gradient
            ctx.fill()

            // Line
            ctx.beginPath()
            data.forEach((val, i) => {
                const x = padding.left + (chartW / (data.length - 1)) * i
                const y = padding.top + chartH - (val / max) * chartH
                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            })
            ctx.strokeStyle = '#58a6ff'
            ctx.lineWidth = 2.5
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            ctx.stroke()

            // Dots + highlight current month
            data.forEach((val, i) => {
                const x = padding.left + (chartW / (data.length - 1)) * i
                const y = padding.top + chartH - (val / max) * chartH
                const isHighlight = i === currentMonthIdx

                ctx.beginPath()
                ctx.arc(x, y, isHighlight ? 5 : 3.5, 0, Math.PI * 2)
                ctx.fillStyle = '#58a6ff'
                ctx.fill()

                if (isHighlight) {
                    // Glow ring
                    ctx.beginPath()
                    ctx.arc(x, y, 9, 0, Math.PI * 2)
                    ctx.strokeStyle = 'rgba(88, 166, 255, 0.3)'
                    ctx.lineWidth = 2
                    ctx.stroke()
                    // Value label
                    ctx.fillStyle = '#58a6ff'
                    ctx.font = 'bold 11px Inter'
                    ctx.textAlign = 'center'
                    ctx.fillText(`${sym}${val}k`, x, y - 14)
                } else {
                    ctx.beginPath()
                    ctx.arc(x, y, 2, 0, Math.PI * 2)
                    ctx.fillStyle = '#0d1117'
                    ctx.fill()
                }
            })
        }

        drawChart()
        const ro = new ResizeObserver(() => drawChart())
        if (containerRef.current) ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [months])

    return (
        <div ref={containerRef} style={{ width: '100%' }}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '280px', display: 'block' }}
                aria-label="Aylık gelir grafiği"
                role="img"
            />
        </div>
    )
})

/* ═══════════════════════════════════════════════════
   Rank gradient backgrounds
   ═══════════════════════════════════════════════════ */
const rankGradients = [
    'linear-gradient(135deg, #FFD700, #FFA500)',
    'linear-gradient(135deg, #C0C0C0, #A0A0A0)',
    'linear-gradient(135deg, #CD7F32, #A0522D)',
    'var(--gradient-brand)',
]

/* ═══════════════════════════════════════════════════
   KPI sparkline accent gradients
   ═══════════════════════════════════════════════════ */
const kpiAccentGradients = [
    'linear-gradient(90deg, #58a6ff, #bc8cff)',
    'linear-gradient(90deg, #bc8cff, #f778ba)',
    'linear-gradient(90deg, #f0b429, #f778ba)',
    'linear-gradient(90deg, #3fb950, #58a6ff)',
]

/* ═══════════════════════════════════════════════════
   Mini sparkline data per KPI card
   ═══════════════════════════════════════════════════ */
const sparklineData = [
    [40, 55, 45, 60, 50, 70, 65, 80],
    [20, 30, 25, 35, 30, 40, 38, 45],
    [50, 55, 52, 60, 58, 65, 62, 70],
    [80, 90, 85, 100, 95, 110, 105, 120],
]

/* ═══════════════════════════════════════════════════
   Inline Sparkline SVG component
   ═══════════════════════════════════════════════════ */
function Sparkline({ data, color, width = 80, height = 28 }) {
    const max = data.length ? Math.max(...data) : 1
    const min = data.length ? Math.min(...data) : 0
    const range = max - min || 1
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width
        const y = height - ((v - min) / range) * (height - 4) - 2
        return `${x},${y}`
    }).join(' ')

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
            <defs>
                <linearGradient id={`spark-fill-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon
                points={`0,${height} ${points} ${width},${height}`}
                fill={`url(#spark-fill-${color.replace(/[^a-z0-9]/gi, '')})`}
            />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/* ═══════════════════════════════════════════════════
   Avatar gradient map based on index
   ═══════════════════════════════════════════════════ */
const avatarGradients = [
    'linear-gradient(135deg, #58a6ff, #bc8cff)',
    'linear-gradient(135deg, #f778ba, #bc8cff)',
    'linear-gradient(135deg, #3fb950, #58a6ff)',
    'linear-gradient(135deg, #f0b429, #f778ba)',
    'linear-gradient(135deg, #76e4f7, #58a6ff)',
]

export default function Dashboard() {
    const navigate = useNavigate()
    const { t } = useTranslation('dashboard')
    const { formatMoney, symbol } = useCurrency()
    const { stats: apiStats, loading, error } = useDashboard()

    // Build translated KPI data from API stats
    const stats = useMemo(() => statDefTemplates.map(s => ({
        ...s,
        label: t(s.labelKey),
        value: s.format ? s.format(apiStats?.[s.field]) : formatMoney(apiStats?.[s.field] || 0),
        change: '',
        positive: true,
    })), [apiStats, t])

    // Top products from API
    const topProducts = useMemo(() => {
        if (!apiStats?.topProducts?.length) return []
        return apiStats.topProducts.map(p => ({
            name: p.name,
            sales: Math.round(p.sales),
            revenue: formatMoney(p.revenue || 0),
        }))
    }, [apiStats, formatMoney])

    // Recent orders from API
    const recentOrders = useMemo(() => {
        if (!apiStats?.recentOrders) return []
        return apiStats.recentOrders.map(o => ({
            id: o.order_number || `#${o.id?.slice(0, 8)}`,
            customer: o.customers?.full_name || o.customer_name || 'Bilinmiyor',
            product: `${o.item_count || 0} ürün`,
            amount: formatMoney(o.total_amount || 0),
            status: o.status || 'pending',
            date: o.created_at ? new Date(o.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
        }))
    }, [apiStats])

    const statusMap = Object.fromEntries(
        Object.entries(statusKeys).map(([k, v]) => [k, { ...v, label: t(v.labelKey) }])
    )
    const months = t('chart.months', { returnObjects: true })

    const downloadReport = useCallback(() => {
        generateDashboardReport({
            stats,
            recentOrders,
            topProducts,
            months,
            chartData,
            statusMap,
            columns: {
                id: t('recentOrders.columns.id'),
                customer: t('recentOrders.columns.customer'),
                product: t('recentOrders.columns.product'),
                amount: t('recentOrders.columns.amount'),
                status: t('recentOrders.columns.status'),
                date: t('recentOrders.columns.date'),
            },
            sheetNames: {
                dashboard: t('report.sheets.dashboard'),
                rawData: t('report.sheets.rawData'),
            },
            titles: {
                kpi: t('report.titles.kpi'),
                kpiMetric: t('report.titles.kpiMetric'),
                kpiValue: t('report.titles.kpiValue'),
                kpiChange: t('report.titles.kpiChange'),
                monthly: t('report.titles.monthly'),
                month: t('report.titles.month'),
                revenue: t('report.titles.revenue'),
                topProducts: t('report.titles.topProducts'),
                productName: t('report.titles.productName'),
                productSales: t('report.titles.productSales'),
                productRevenue: t('report.titles.productRevenue'),
                productTrend: t('report.titles.productTrend'),
                orders: t('report.titles.orders'),
            },
        })
    }, [stats, months, statusMap, t])

    const maxSales = topProducts.length ? Math.max(...topProducts.map(p => p.sales)) : 1

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid var(--border-primary)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)' }}>Dashboard yükleniyor...</span>
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
        <div style={{ position: 'relative' }}>
            {/* ── Decorative floating gradient orbs ── */}
            <div style={{
                position: 'fixed', top: '10%', left: '-5%',
                width: '400px', height: '400px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(88,166,255,0.06) 0%, transparent 70%)',
                filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
            }} />
            <div style={{
                position: 'fixed', bottom: '10%', right: '-8%',
                width: '500px', height: '500px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(188,140,255,0.05) 0%, transparent 70%)',
                filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
            }} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                width: '300px', height: '300px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(247,120,186,0.04) 0%, transparent 70%)',
                filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0,
                transform: 'translate(-50%, -50%)',
            }} />

            {/* ── Grid pattern overlay ── */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
                backgroundImage: `linear-gradient(var(--border-secondary) 1px, transparent 1px),
                                  linear-gradient(90deg, var(--border-secondary) 1px, transparent 1px)`,
                backgroundSize: '60px 60px',
                opacity: 0.04,
            }} />

            {/* ═══ Page Header with gradient mesh ═══ */}
            <div className="page-header animate-fade-in-up" style={{ position: 'relative', overflow: 'hidden', zIndex: 1 }}>
                {/* Decorative gradient mesh behind header */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `
                        radial-gradient(ellipse 60% 50% at 10% 50%, rgba(88,166,255,0.06) 0%, transparent 70%),
                        radial-gradient(ellipse 40% 60% at 90% 30%, rgba(188,140,255,0.05) 0%, transparent 70%)
                    `,
                    borderRadius: 'var(--radius-lg)',
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h1 style={{
                        fontSize: '1.8rem', fontWeight: 800,
                        fontFamily: 'var(--font-display)',
                        background: 'var(--gradient-brand)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '-0.02em',
                    }}>
                        Dashboard
                    </h1>
                    <p className="page-subtitle" style={{ marginTop: '4px' }}>
                        {t('title')}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={downloadReport} style={{ position: 'relative', zIndex: 1 }}>
                    📥 {t('quickActions.reports')}
                </button>
            </div>

            {/* ═══ KPI Cards — Glassmorphism + Animated accent + Sparklines ═══ */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '18px', marginBottom: '32px', position: 'relative', zIndex: 1,
            }}>
                {stats.map((stat, i) => (
                    <div key={i} className="animate-fade-in-up" style={{
                        animationDelay: `${i * 0.08}s`,
                        padding: '22px 20px 18px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-glass)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        border: '1px solid var(--border-primary)',
                        position: 'relative', overflow: 'hidden',
                        transition: 'all var(--transition-base)',
                        boxShadow: 'var(--shadow-sm), 0 8px 32px rgba(0,0,0,0.12)',
                        cursor: 'default',
                    }}>
                        {/* ── Animated gradient accent line at top ── */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                            background: kpiAccentGradients[i],
                            backgroundSize: '200% 100%',
                            animation: 'gradient-shift 3s ease-in-out infinite',
                        }} />

                        {/* ── Accent glow orb ── */}
                        <div style={{
                            position: 'absolute', top: -30, right: -30,
                            width: '100px', height: '100px', borderRadius: '50%',
                            background: stat.color, filter: 'blur(25px)',
                            opacity: 0.6, pointerEvents: 'none',
                        }} />

                        {/* ── Left accent border line ── */}
                        <div style={{
                            position: 'absolute', left: 0, top: '20%', bottom: '20%',
                            width: '2px', borderRadius: '1px',
                            background: stat.accent, opacity: 0.3,
                        }} />

                        {/* Icon + label row */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: '12px', position: 'relative',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                                    background: stat.color, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '1.25rem',
                                    boxShadow: `0 4px 12px ${stat.color}`,
                                }}>{stat.icon}</div>
                                <span style={{
                                    fontSize: '0.68rem', color: 'var(--text-tertiary)',
                                    fontWeight: 600, textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}>{stat.label}</span>
                            </div>
                            {/* Mini sparkline */}
                            <Sparkline
                                data={sparklineData[i]}
                                color={stat.accent === 'var(--accent-blue)' ? '#58a6ff' : stat.accent}
                            />
                        </div>

                        {/* Large value */}
                        <div style={{
                            fontSize: '1.85rem', fontWeight: 800,
                            fontFamily: 'var(--font-display)',
                            color: stat.accent, position: 'relative',
                            marginBottom: '8px', letterSpacing: '-0.02em',
                        }}>
                            {stat.value}
                        </div>

                        {/* Trend pill */}
                        <div style={{
                            fontSize: '0.72rem', fontWeight: 600,
                            color: stat.positive ? '#4ade80' : '#f87171',
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '20px', height: '20px', borderRadius: 'var(--radius-full)',
                                background: stat.positive ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                                fontSize: '0.65rem',
                            }}>{stat.positive ? '↑' : '↓'}</span>
                            <span style={{ fontWeight: 700 }}>{stat.change}</span>
                            <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{t('recentOrders.columns.date') === 'Date' ? 'vs last month' : 'geçen aya göre'}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ═══ Charts & Products Grid ═══ */}
            <div className="grid-2" style={{ marginBottom: '28px', position: 'relative', zIndex: 1 }}>

                {/* ── Revenue Chart with gradient mesh background ── */}
                <div className="card" style={{
                    position: 'relative', overflow: 'hidden',
                    border: '1px solid var(--border-primary)',
                }}>
                    {/* Gradient mesh background */}
                    <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none',
                        background: `
                            radial-gradient(ellipse 50% 40% at 20% 20%, rgba(88,166,255,0.06) 0%, transparent 60%),
                            radial-gradient(ellipse 40% 50% at 80% 80%, rgba(188,140,255,0.04) 0%, transparent 60%),
                            radial-gradient(ellipse 30% 30% at 60% 10%, rgba(247,120,186,0.03) 0%, transparent 60%)
                        `,
                    }} />

                    {/* Top accent line */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                        background: 'linear-gradient(90deg, transparent, var(--accent-blue), var(--accent-purple), transparent)',
                        opacity: 0.4,
                    }} />

                    <div style={{ marginBottom: '20px', position: 'relative' }}>
                        <h3 style={{
                            fontSize: '1.15rem', fontWeight: 700,
                            fontFamily: 'var(--font-display)',
                        }}>📈 {t('chart.title')}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            2025 {t('chart.title')}
                        </p>
                    </div>

                    <MiniChart />

                    {/* ── Stat summary pills below chart ── */}
                    <div style={{
                        display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap',
                        position: 'relative',
                    }}>
                        {[
                            { label: 'Ort. Aylık', value: `${symbol}61.2k`, icon: '📊' },
                            { label: 'En Yüksek', value: `${symbol}92k`, icon: '🔝' },
                            { label: 'Büyüme', value: '%18.4', icon: '🚀' },
                        ].map((pill, i) => (
                            <div key={i} style={{
                                flex: '1 1 0',
                                minWidth: '100px',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-secondary)',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                transition: 'all var(--transition-fast)',
                            }}>
                                <span style={{ fontSize: '1rem' }}>{pill.icon}</span>
                                <div>
                                    <div style={{
                                        fontSize: '0.65rem', color: 'var(--text-tertiary)',
                                        textTransform: 'uppercase', letterSpacing: '0.04em',
                                        fontWeight: 600,
                                    }}>{pill.label}</div>
                                    <div style={{
                                        fontSize: '0.95rem', fontWeight: 700,
                                        fontFamily: 'var(--font-display)',
                                        color: 'var(--text-primary)',
                                    }}>{pill.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Top Products — Podium style for top 3 + progress bars ── */}
                <div className="card" style={{
                    position: 'relative', overflow: 'hidden',
                    border: '1px solid var(--border-primary)',
                }}>
                    {/* Top accent */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                        background: 'linear-gradient(90deg, transparent, #FFD700, #C0C0C0, #CD7F32, transparent)',
                        opacity: 0.5,
                    }} />

                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{
                            fontSize: '1.15rem', fontWeight: 700,
                            fontFamily: 'var(--font-display)',
                        }}>🏆 {t('topProducts.title')}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            {t('topProducts.title')}
                        </p>
                    </div>

                    {/* ── Top 3 Podium ── */}
                    {topProducts.length >= 3 ? (
                        <div style={{
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                            gap: '8px', marginBottom: '20px', padding: '0 8px',
                        }}>
                            {/* 2nd place */}
                            <div style={{
                                flex: '1', textAlign: 'center',
                                padding: '14px 8px 12px',
                                background: 'linear-gradient(180deg, rgba(192,192,192,0.08) 0%, rgba(192,192,192,0.02) 100%)',
                                border: '1px solid rgba(192,192,192,0.2)',
                                borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-sm)',
                                minHeight: '130px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                            }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
                                    background: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.8rem', fontWeight: 800, color: '#fff',
                                    boxShadow: '0 2px 10px rgba(192,192,192,0.3)',
                                    marginBottom: '8px',
                                }}>🥈</div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                                    {topProducts[1]?.name}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                                    {topProducts[1]?.sales} {t('topProducts.columns.sales')}
                                </div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                    {topProducts[1]?.revenue}
                                </div>
                            </div>

                            {/* 1st place — tallest */}
                            <div style={{
                                flex: '1.2', textAlign: 'center',
                                padding: '18px 8px 14px',
                                background: 'linear-gradient(180deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%)',
                                border: '1px solid rgba(255,215,0,0.25)',
                                borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-sm)',
                                minHeight: '160px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                                position: 'relative',
                            }}>
                                {/* Crown glow */}
                                <div style={{
                                    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                                    width: '60px', height: '60px', borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
                                    pointerEvents: 'none',
                                }} />
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: 'var(--radius-full)',
                                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1rem', fontWeight: 800, color: '#fff',
                                    boxShadow: '0 4px 16px rgba(255,215,0,0.35)',
                                    marginBottom: '10px',
                                }}>🥇</div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                                    {topProducts[0]?.name}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                                    {topProducts[0]?.sales} {t('topProducts.columns.sales')}
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFD700', marginTop: '6px' }}>
                                    {topProducts[0]?.revenue}
                                </div>
                            </div>

                            {/* 3rd place */}
                            <div style={{
                                flex: '1', textAlign: 'center',
                                padding: '14px 8px 12px',
                                background: 'linear-gradient(180deg, rgba(205,127,50,0.08) 0%, rgba(205,127,50,0.02) 100%)',
                                border: '1px solid rgba(205,127,50,0.2)',
                                borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-sm)',
                                minHeight: '110px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                            }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
                                    background: 'linear-gradient(135deg, #CD7F32, #A0522D)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.8rem', fontWeight: 800, color: '#fff',
                                    boxShadow: '0 2px 10px rgba(205,127,50,0.3)',
                                    marginBottom: '8px',
                                }}>🥉</div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                                    {topProducts[2]?.name}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                                    {topProducts[2]?.sales} {t('topProducts.columns.sales')}
                                </div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                    {topProducts[2]?.revenue}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>
                            📦 Henüz yeterli sipariş verisi yok
                        </div>
                    )}

                    {/* ── Full product list with progress bars ── */}
                    {
                        topProducts.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {topProducts.map((product, i) => (
                                    <div
                                        key={i}
                                        className="animate-fade-in-up"
                                        style={{
                                            animationDelay: `${i * 0.06}s`,
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px 14px',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: 'var(--radius-md)',
                                            transition: 'all var(--transition-fast)',
                                            border: '1px solid var(--border-secondary)',
                                            position: 'relative', overflow: 'hidden',
                                        }}
                                    >
                                        {/* Left accent line */}
                                        <div style={{
                                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                                            background: rankGradients[i] || 'var(--gradient-brand)',
                                            borderRadius: '3px 0 0 3px',
                                        }} />

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                            {/* Rank badge with medal gradient */}
                                            <span style={{
                                                width: '28px', height: '28px', borderRadius: 'var(--radius-md)',
                                                background: rankGradients[i] || 'var(--gradient-brand)',
                                                display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', fontSize: '0.75rem',
                                                fontWeight: 800, color: '#fff', flexShrink: 0,
                                                boxShadow: i < 3
                                                    ? `0 2px 8px ${i === 0 ? 'rgba(255,215,0,0.3)' : i === 1 ? 'rgba(192,192,192,0.3)' : 'rgba(205,127,50,0.3)'}`
                                                    : 'none',
                                            }}>
                                                {i + 1}
                                            </span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>{product.name}</div>
                                                {/* Sales progress bar */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                }}>
                                                    <div style={{
                                                        flex: 1, height: '4px',
                                                        background: 'var(--bg-primary)',
                                                        borderRadius: '2px', overflow: 'hidden',
                                                    }}>
                                                        <div style={{
                                                            height: '100%',
                                                            width: `${(product.sales / maxSales) * 100}%`,
                                                            background: rankGradients[i] || 'var(--gradient-brand)',
                                                            borderRadius: '2px',
                                                            transition: 'width 0.6s ease',
                                                        }} />
                                                    </div>
                                                    <span style={{
                                                        fontSize: '0.65rem', color: 'var(--text-tertiary)',
                                                        fontWeight: 500, flexShrink: 0,
                                                    }}>{product.sales} {t('topProducts.columns.sales')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '12px' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-display)' }}>{product.revenue}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    }
                </div >
            </div >

            {/* ═══ Recent Orders — Enhanced with shimmer border, glow hover, gradient avatars ═══ */}
            < div className="card animate-fade-in-up" style={{
                position: 'relative', overflow: 'hidden', zIndex: 1,
            }}>
                {/* ── Shimmer border top ── */}
                < div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: 'linear-gradient(90deg, transparent 0%, var(--accent-blue) 20%, var(--accent-purple) 50%, var(--accent-rose) 80%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'gradient-shift 4s ease-in-out infinite',
                    opacity: 0.5,
                }} />
                {/* Shimmer border bottom */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
                    background: 'linear-gradient(90deg, transparent, var(--border-accent), transparent)',
                    opacity: 0.2,
                }} />

                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
                }}>
                    <div>
                        <h3 style={{
                            fontSize: '1.15rem', fontWeight: 700,
                            fontFamily: 'var(--font-display)',
                        }}>📋 {t('recentOrders.title')}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            {t('recentOrders.title')}
                        </p>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '0.8rem' }}
                        onClick={() => navigate('/orders')}>
                        {t('recentOrders.viewAll')} →
                    </button>
                </div>

                <div className="table-container" style={{ overflowX: 'auto', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)' }}>
                    <table className="table" role="table" style={{ minWidth: '700px' }}>
                        <thead>
                            <tr>
                                <th scope="col" style={{ padding: '14px 16px' }}>{t('recentOrders.columns.id')}</th>
                                <th scope="col" style={{ padding: '14px 16px' }}>{t('recentOrders.columns.customer')}</th>
                                <th scope="col" style={{ padding: '14px 16px' }}>{t('recentOrders.columns.product')}</th>
                                <th scope="col" style={{ padding: '14px 16px' }}>{t('recentOrders.columns.amount')}</th>
                                <th scope="col" style={{ padding: '14px 16px' }}>{t('recentOrders.columns.status')}</th>
                                <th scope="col" style={{ padding: '14px 16px' }}>{t('recentOrders.columns.date')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((order, i) => (
                                <tr key={i} style={{
                                    transition: 'all var(--transition-fast)',
                                    cursor: 'default',
                                }}>
                                    <td style={{
                                        fontWeight: 700, fontFamily: 'var(--font-display)',
                                        padding: '14px 16px', color: 'var(--accent-blue)', fontSize: '0.85rem',
                                    }}>
                                        {order.id}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {/* Avatar with gradient background */}
                                            <div style={{
                                                width: '34px', height: '34px', borderRadius: 'var(--radius-full)',
                                                background: avatarGradients[i % avatarGradients.length],
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.72rem', fontWeight: 700, color: '#fff',
                                                flexShrink: 0,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                            }}>
                                                {order.customer.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{order.customer}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {order.product}
                                    </td>
                                    <td style={{
                                        fontWeight: 700, padding: '14px 16px',
                                        fontFamily: 'var(--font-display)', fontSize: '0.9rem',
                                    }}>
                                        {order.amount}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span className={`badge ${statusMap[order.status].class}`} style={{
                                            padding: '5px 14px', fontSize: '0.72rem', fontWeight: 700,
                                        }}>
                                            {statusMap[order.status].label}
                                        </span>
                                    </td>
                                    <td style={{
                                        color: 'var(--text-tertiary)', padding: '14px 16px',
                                        fontSize: '0.82rem',
                                    }}>
                                        {order.date}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div >
        </div >
    )
}
