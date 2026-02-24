import { useState, useMemo, useRef, useEffect, memo } from 'react'
import { useTranslation } from 'react-i18next'

/* ═══════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════ */
const months = ['Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara']

const fabricHeatmapData = [
    { name: 'Kadife Bordo', demos: 145, orders: 52, conversion: 35.9, color: '#8B1A1A' },
    { name: 'Ipek Krem', demos: 210, orders: 89, conversion: 42.4, color: '#F5E6D3' },
    { name: 'Keten Lacivert', demos: 178, orders: 41, conversion: 23.0, color: '#1B2A4A' },
    { name: 'Pamuk Gri', demos: 95, orders: 38, conversion: 40.0, color: '#7A7D82' },
    { name: 'Blackout Siyah', demos: 132, orders: 78, conversion: 59.1, color: '#1A1A2E' },
    { name: 'Tul Beyaz', demos: 285, orders: 156, conversion: 54.7, color: '#E8E8FF' },
    { name: 'Jakar Altin', demos: 67, orders: 31, conversion: 46.3, color: '#B8860B' },
    { name: 'Kadife Zumrut', demos: 98, orders: 29, conversion: 29.6, color: '#1B5E3B' },
]

const teamData = [
    { name: 'Ekip A (Ahmet)', avgSpeed: 92, satisfaction: 4.7, jobs: 48, efficiency: 95, trend: 3.2 },
    { name: 'Ekip B (Mehmet)', avgSpeed: 85, satisfaction: 4.3, jobs: 42, efficiency: 88, trend: -1.4 },
    { name: 'Ekip C (Ayse)', avgSpeed: 97, satisfaction: 4.9, jobs: 51, efficiency: 98, trend: 5.1 },
    { name: 'Ekip D (Fatma)', avgSpeed: 78, satisfaction: 4.1, jobs: 35, efficiency: 82, trend: -2.8 },
]

const revenueData = [42000, 38000, 51000, 55000, 48000, 62000, 71000, 65000, 78000, 82000, 75000, 89000]
const orderData = [28, 22, 35, 38, 32, 42, 48, 44, 52, 55, 50, 60]
const conversionData = [32, 28, 38, 41, 35, 44, 48, 42, 51, 54, 49, 56]
const currentMonthIdx = 1

/* ═══════════════════════════════════════════════════
   RESPONSIVE CANVAS CHART
   ═══════════════════════════════════════════════════ */
const CanvasChart = memo(function CanvasChart({ data, labels, height = 220, color = '#58A6FF', type = 'line', highlightIdx }) {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const ctx = canvas.getContext('2d')
        const dpr = window.devicePixelRatio || 1
        const rect = container.getBoundingClientRect()
        const w = rect.width
        const h = height

        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, w, h)

        const style = getComputedStyle(document.documentElement)
        const gridColor = style.getPropertyValue('--border-primary').trim() || 'rgba(48,54,61,0.5)'
        const textColor = style.getPropertyValue('--text-tertiary').trim() || '#6e7681'

        const pad = { top: 24, right: 20, bottom: 36, left: 50 }
        const cw = w - pad.left - pad.right
        const ch = h - pad.top - pad.bottom
        const max = Math.max(...data) * 1.15
        const stepX = cw / (data.length - 1)

        // Grid lines
        ctx.strokeStyle = gridColor
        ctx.lineWidth = 0.5
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (ch / 4) * i
            ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke()
            ctx.fillStyle = textColor; ctx.font = '10px Inter'; ctx.textAlign = 'right'
            const val = max - (max / 4) * i
            ctx.fillText(val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0), pad.left - 8, y + 3)
        }

        // X labels
        ctx.textAlign = 'center'
        data.forEach((_, i) => {
            const x = type === 'bar' ? pad.left + (cw / data.length) * i + (cw / data.length) / 2 : pad.left + stepX * i
            ctx.fillStyle = i === highlightIdx ? color : textColor
            ctx.font = i === highlightIdx ? 'bold 10px Inter' : '10px Inter'
            ctx.fillText(labels[i], x, h - 10)
        })

        if (type === 'bar') {
            const barW = (cw / data.length) * 0.55
            data.forEach((d, i) => {
                const x = pad.left + (cw / data.length) * i + ((cw / data.length) - barW) / 2
                const barH = (d / max) * ch
                const y = pad.top + ch - barH
                const isHighlight = i === highlightIdx
                const grad = ctx.createLinearGradient(x, y, x, y + barH)
                grad.addColorStop(0, isHighlight ? color : color + 'cc')
                grad.addColorStop(1, color + '22')
                ctx.fillStyle = grad
                ctx.beginPath(); ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]); ctx.fill()
                if (isHighlight) {
                    ctx.shadowColor = color + '44'; ctx.shadowBlur = 12
                    ctx.fillStyle = grad
                    ctx.beginPath(); ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]); ctx.fill()
                    ctx.shadowBlur = 0
                    // Value label
                    ctx.fillStyle = color; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'
                    ctx.fillText(d >= 1000 ? `${(d / 1000).toFixed(0)}K` : d, x + barW / 2, y - 8)
                }
            })
        } else {
            // Area gradient
            const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom)
            grad.addColorStop(0, color + '30')
            grad.addColorStop(1, color + '03')
            ctx.beginPath()
            data.forEach((val, i) => {
                const x = pad.left + stepX * i
                const y = pad.top + ch - (val / max) * ch
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            })
            ctx.lineTo(pad.left + cw, pad.top + ch)
            ctx.lineTo(pad.left, pad.top + ch)
            ctx.closePath(); ctx.fillStyle = grad; ctx.fill()

            // Line
            ctx.beginPath()
            data.forEach((val, i) => {
                const x = pad.left + stepX * i
                const y = pad.top + ch - (val / max) * ch
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            })
            ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke()

            // Dots + highlight
            data.forEach((val, i) => {
                const x = pad.left + stepX * i
                const y = pad.top + ch - (val / max) * ch
                const isHighlight = i === highlightIdx
                ctx.beginPath(); ctx.arc(x, y, isHighlight ? 5 : 3, 0, Math.PI * 2)
                ctx.fillStyle = color; ctx.fill()
                if (isHighlight) {
                    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2)
                    ctx.strokeStyle = color + '44'; ctx.lineWidth = 2; ctx.stroke()
                    ctx.fillStyle = color; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'
                    ctx.fillText(val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val, x, y - 14)
                }
            })
        }
    }, [data, labels, height, color, type, highlightIdx])

    return (
        <div ref={containerRef} style={{ width: '100%' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px`, display: 'block' }} />
        </div>
    )
})

/* ═══════════════════════════════════════════════════
   EFFICIENCY RING — SVG donut chart
   ═══════════════════════════════════════════════════ */
function EfficiencyRing({ value, size = 52, strokeWidth = 5, color }) {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (value / 100) * circumference

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="var(--bg-tertiary)" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </svg>
    )
}

/* ═══════════════════════════════════════════════════
   CONVERSION FUNNEL BAR
   ═══════════════════════════════════════════════════ */
function ConversionBar({ demos, orders, conversion, color, name }) {
    const maxDemos = 300
    const demoPct = Math.min((demos / maxDemos) * 100, 100)
    const convColor = conversion > 50 ? '#2ecc71' : conversion > 30 ? '#f0b429' : '#e74c3c'

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 16px', borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, rgba(22,27,34,0.6) 100%)',
            border: '1px solid var(--border-secondary)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'default',
            position: 'relative',
            overflow: 'hidden',
        }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${color}44`
                e.currentTarget.style.boxShadow = `0 0 20px ${color}15, 0 4px 16px rgba(0,0,0,0.2)`
                e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-secondary)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
            }}
        >
            {/* Hover glow overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(ellipse at 0% 50%, ${color}08, transparent 70%)`,
                pointerEvents: 'none',
            }} />
            <div style={{
                width: '30px', height: '30px', borderRadius: '8px',
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                border: '2px solid rgba(255,255,255,0.1)',
                flexShrink: 0,
                boxShadow: `0 0 12px ${color}33, inset 0 1px 0 rgba(255,255,255,0.15)`,
                position: 'relative',
            }} />
            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{name}</span>
                    <span style={{
                        fontSize: '0.82rem', fontWeight: 800, color: convColor,
                        fontFamily: 'var(--font-display)',
                        textShadow: `0 0 8px ${convColor}33`,
                    }}>%{conversion}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--bg-primary)', overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                            position: 'absolute', left: 0, top: 0, height: '100%',
                            width: `${demoPct}%`,
                            background: `linear-gradient(90deg, rgba(88,166,255,0.5), rgba(88,166,255,0.8))`,
                            borderRadius: '3px',
                            transition: 'width 0.6s ease',
                        }} />
                        <div style={{
                            position: 'absolute', left: 0, top: 0, height: '100%',
                            width: `${(orders / maxDemos) * 100}%`,
                            background: `linear-gradient(90deg, ${convColor}cc, ${convColor})`,
                            borderRadius: '3px',
                            transition: 'width 0.6s ease',
                        }} />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                    <span>{demos} demo</span>
                    <span>{orders} siparis</span>
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function Analytics() {
    const { t } = useTranslation('analytics')
    const [period, setPeriod] = useState('year')
    const [activeChart, setActiveChart] = useState('revenue')
    const [selectedTeam, setSelectedTeam] = useState(null)

    const totalRevenue = useMemo(() => revenueData.reduce((a, b) => a + b, 0), [])
    const totalOrders = useMemo(() => orderData.reduce((a, b) => a + b, 0), [])
    const avgConversion = useMemo(() =>
        Math.round(fabricHeatmapData.reduce((a, b) => a + b.conversion, 0) / fabricHeatmapData.length * 10) / 10
        , [])
    const avgSatisfaction = useMemo(() =>
        (teamData.reduce((a, b) => a + b.satisfaction, 0) / teamData.length).toFixed(1)
        , [])
    const bestTeam = useMemo(() =>
        [...teamData].sort((a, b) => b.efficiency - a.efficiency)[0]
        , [])

    const kpiStats = useMemo(() => [
        { label: 'Toplam Gelir', value: `${(totalRevenue / 1000).toFixed(0)}K`, prefix: '₺', trend: 12.4, icon: '💰', color: 'rgba(88, 166, 255, 0.12)', accent: 'var(--accent-blue)', gradientFrom: '#58a6ff', gradientTo: '#3b82f6' },
        { label: 'Toplam Siparis', value: totalOrders, trend: 8.2, icon: '📦', color: 'rgba(139, 92, 246, 0.12)', accent: '#bc8cff', gradientFrom: '#bc8cff', gradientTo: '#8b5cf6' },
        { label: 'Donusum Orani', value: avgConversion, suffix: '%', trend: 3.1, icon: '🎯', color: 'rgba(46, 204, 113, 0.12)', accent: '#2ecc71', gradientFrom: '#2ecc71', gradientTo: '#27ae60' },
        { label: 'Musteri Memnuniyeti', value: avgSatisfaction, suffix: '⭐', trend: 1.8, icon: '😊', color: 'rgba(240, 180, 41, 0.12)', accent: '#f0b429', gradientFrom: '#f0b429', gradientTo: '#d4a017' },
        { label: 'En Iyi Ekip', value: bestTeam.name.split('(')[1]?.replace(')', '') || bestTeam.name, suffix: '', trend: bestTeam.trend, icon: '🏆', color: 'rgba(247, 120, 186, 0.12)', accent: '#f778ba', gradientFrom: '#f778ba', gradientTo: '#ec4899' },
    ], [totalRevenue, totalOrders, avgConversion, avgSatisfaction, bestTeam])

    const chartTabs = useMemo(() => [
        { key: 'revenue', label: 'Gelir', icon: '📈' },
        { key: 'orders', label: 'Siparisler', icon: '📦' },
        { key: 'conversion', label: 'Donusum', icon: '🎯' },
    ], [])

    const chartConfig = useMemo(() => ({
        revenue: { data: revenueData, color: '#58a6ff', type: 'line' },
        orders: { data: orderData, color: '#2ecc71', type: 'bar' },
        conversion: { data: conversionData, color: '#bc8cff', type: 'line' },
    }), [])

    const sortedFabrics = useMemo(() =>
        [...fabricHeatmapData].sort((a, b) => b.conversion - a.conversion)
        , [])

    const sortedTeams = useMemo(() =>
        [...teamData].sort((a, b) => b.efficiency - a.efficiency)
        , [])

    return (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
            {/* ══════ Decorative Background Orbs ══════ */}
            <div style={{
                position: 'fixed', top: '10%', left: '-5%', width: '400px', height: '400px',
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(88,166,255,0.04) 0%, transparent 70%)',
                pointerEvents: 'none', filter: 'blur(60px)', zIndex: 0,
            }} />
            <div style={{
                position: 'fixed', bottom: '5%', right: '-8%', width: '500px', height: '500px',
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)',
                pointerEvents: 'none', filter: 'blur(80px)', zIndex: 0,
            }} />
            <div style={{
                position: 'fixed', top: '50%', left: '40%', width: '300px', height: '300px',
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(247,120,186,0.03) 0%, transparent 70%)',
                pointerEvents: 'none', filter: 'blur(60px)', zIndex: 0,
            }} />

            {/* Page Header */}
            <div className="page-header" style={{ position: 'relative', zIndex: 1 }}>
                <div>
                    <h1 className="page-title" style={{
                        background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-blue) 50%, var(--accent-purple) 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>Analitik Vizyon</h1>
                    <p className="page-subtitle" style={{ letterSpacing: '0.02em' }}>Holding seviyesi performans ve donusum analitigi</p>
                </div>
                <div style={{
                    display: 'flex', gap: '2px',
                    background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, rgba(22,27,34,0.8) 100%)',
                    borderRadius: 'var(--radius-md)', padding: '3px',
                    border: '1px solid var(--border-secondary)',
                    backdropFilter: 'blur(8px)',
                }}>
                    {['month', 'quarter', 'year'].map(p => (
                        <button key={p}
                            className={`btn ${period === p ? 'btn-secondary' : 'btn-ghost'}`}
                            style={{ fontSize: '0.75rem', padding: '6px 14px', minHeight: '34px' }}
                            onClick={() => setPeriod(p)}>
                            {p === 'month' ? 'Ay' : p === 'quarter' ? 'Ceyrek' : 'Yil'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══════ KPI Cards — 5 columns with premium glass ══════ */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '16px', marginBottom: '28px', position: 'relative', zIndex: 1,
            }}>
                {kpiStats.map((stat, i) => (
                    <div key={i} className="animate-fade-in-up" style={{
                        animationDelay: `${i * 0.08}s`,
                        padding: '0', borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        position: 'relative', overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'default',
                    }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-4px)'
                            e.currentTarget.style.borderColor = `${stat.gradientFrom}33`
                            e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.25), 0 0 30px ${stat.gradientFrom}12`
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.borderColor = 'var(--border-primary)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                    >
                        {/* Top accent gradient line */}
                        <div style={{
                            height: '3px', width: '100%',
                            background: `linear-gradient(90deg, ${stat.gradientFrom}, ${stat.gradientTo}, ${stat.gradientFrom}88)`,
                            backgroundSize: '200% 100%',
                            animation: 'gradient-shift 4s ease infinite',
                        }} />
                        {/* Glass overlay */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(255,255,255,0.01) 100%)',
                            pointerEvents: 'none',
                        }} />
                        {/* Decorative glow orb */}
                        <div style={{
                            position: 'absolute', top: -25, right: -25,
                            width: '90px', height: '90px', borderRadius: '50%',
                            background: `radial-gradient(circle, ${stat.gradientFrom}18, transparent 70%)`,
                            filter: 'blur(15px)',
                            opacity: 0.7, pointerEvents: 'none',
                        }} />
                        {/* Subtle dot pattern */}
                        <div style={{
                            position: 'absolute', inset: 0, opacity: 0.03,
                            backgroundImage: 'radial-gradient(circle, var(--text-primary) 1px, transparent 1px)',
                            backgroundSize: '16px 16px', pointerEvents: 'none',
                        }} />

                        <div style={{ padding: '18px 20px 20px' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                marginBottom: '12px', position: 'relative',
                            }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                                    background: `linear-gradient(135deg, ${stat.gradientFrom}22, ${stat.gradientTo}11)`,
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '1.2rem',
                                    border: `1px solid ${stat.gradientFrom}15`,
                                    boxShadow: `0 0 16px ${stat.gradientFrom}12`,
                                    position: 'relative',
                                }}>
                                    {stat.icon}
                                </div>
                                <span style={{
                                    fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700,
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                }}>{stat.label}</span>
                            </div>
                            <div style={{
                                fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)',
                                color: stat.accent, position: 'relative', marginBottom: '8px',
                                textShadow: `0 0 20px ${stat.gradientFrom}20`,
                            }}>
                                {stat.prefix || ''}{stat.value}{stat.suffix || ''}
                            </div>
                            {stat.trend !== undefined && (
                                <div style={{
                                    fontSize: '0.68rem', fontWeight: 600,
                                    color: stat.trend >= 0 ? '#2ecc71' : '#e74c3c',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '3px 8px', borderRadius: 'var(--radius-full)',
                                        background: stat.trend >= 0
                                            ? 'linear-gradient(135deg, rgba(46,204,113,0.15), rgba(46,204,113,0.08))'
                                            : 'linear-gradient(135deg, rgba(231,76,60,0.15), rgba(231,76,60,0.08))',
                                        fontSize: '0.62rem', fontWeight: 700,
                                        border: `1px solid ${stat.trend >= 0 ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)'}`,
                                        backdropFilter: 'blur(4px)',
                                    }}>
                                        {stat.trend >= 0 ? '↑' : '↓'} {Math.abs(stat.trend)}%
                                    </span>
                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.62rem' }}>gecen aya gore</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ══════ Main Chart — Full Width with Tab Switcher ══════ */}
            <div className="card animate-fade-in-up" style={{
                marginBottom: '24px', position: 'relative', overflow: 'hidden', zIndex: 1,
            }}>
                {/* Decorative gradient mesh background */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: `
                        radial-gradient(ellipse at 10% 20%, rgba(88,166,255,0.04) 0%, transparent 50%),
                        radial-gradient(ellipse at 90% 80%, rgba(139,92,246,0.04) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, rgba(247,120,186,0.02) 0%, transparent 60%)
                    `,
                    pointerEvents: 'none',
                }} />
                {/* Subtle grid pattern */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.025,
                    backgroundImage: `
                        linear-gradient(var(--text-primary) 1px, transparent 1px),
                        linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px', pointerEvents: 'none',
                }} />

                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '20px', position: 'relative',
                }}>
                    <div>
                        <h3 style={{ fontSize: '1.08rem', fontWeight: 700, marginBottom: '2px' }}>Performans Trendi</h3>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                            12 aylik {activeChart === 'revenue' ? 'gelir' : activeChart === 'orders' ? 'siparis' : 'donusum'} analizi — <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Sub</span> mevcut ay
                        </p>
                    </div>
                    {/* Chart tab switcher with animated indicator */}
                    <div style={{
                        display: 'flex', gap: '2px',
                        background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, rgba(22,27,34,0.9) 100%)',
                        borderRadius: 'var(--radius-md)', padding: '3px',
                        border: '1px solid var(--border-secondary)',
                        position: 'relative',
                    }}>
                        {chartTabs.map(tab => (
                            <button key={tab.key}
                                className={`btn ${activeChart === tab.key ? 'btn-secondary' : 'btn-ghost'}`}
                                style={{
                                    fontSize: '0.72rem', padding: '5px 12px', minHeight: '30px',
                                    position: 'relative', zIndex: 1,
                                    ...(activeChart === tab.key ? {
                                        background: 'linear-gradient(135deg, rgba(88,166,255,0.1), rgba(139,92,246,0.08))',
                                        borderColor: 'rgba(88,166,255,0.2)',
                                        boxShadow: '0 0 12px rgba(88,166,255,0.08)',
                                    } : {}),
                                }}
                                onClick={() => setActiveChart(tab.key)}>
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ position: 'relative' }}>
                    <CanvasChart
                        data={chartConfig[activeChart].data}
                        labels={months}
                        color={chartConfig[activeChart].color}
                        type={chartConfig[activeChart].type}
                        height={240}
                        highlightIdx={currentMonthIdx}
                    />
                </div>
                {/* Bottom summary stats with glass-effect pills */}
                <div style={{
                    marginTop: '16px', padding: '14px 18px',
                    background: 'linear-gradient(135deg, rgba(22,27,34,0.6) 0%, rgba(13,17,23,0.8) 100%)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-secondary)',
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center',
                    position: 'relative',
                }}>
                    {[
                        { label: 'En Yuksek', value: `${activeChart === 'revenue' ? '₺' : ''}${Math.max(...chartConfig[activeChart].data) >= 1000 ? (Math.max(...chartConfig[activeChart].data) / 1000).toFixed(0) + 'K' : Math.max(...chartConfig[activeChart].data)}`, month: months[chartConfig[activeChart].data.indexOf(Math.max(...chartConfig[activeChart].data))] },
                        { label: 'En Dusuk', value: `${activeChart === 'revenue' ? '₺' : ''}${Math.min(...chartConfig[activeChart].data) >= 1000 ? (Math.min(...chartConfig[activeChart].data) / 1000).toFixed(0) + 'K' : Math.min(...chartConfig[activeChart].data)}`, month: months[chartConfig[activeChart].data.indexOf(Math.min(...chartConfig[activeChart].data))] },
                        { label: 'Ortalama', value: `${activeChart === 'revenue' ? '₺' : ''}${(chartConfig[activeChart].data.reduce((a, b) => a + b, 0) / 12) >= 1000 ? ((chartConfig[activeChart].data.reduce((a, b) => a + b, 0) / 12) / 1000).toFixed(0) + 'K' : Math.round(chartConfig[activeChart].data.reduce((a, b) => a + b, 0) / 12)}` },
                        { label: 'Bu Ay', value: `${activeChart === 'revenue' ? '₺' : ''}${chartConfig[activeChart].data[currentMonthIdx] >= 1000 ? (chartConfig[activeChart].data[currentMonthIdx] / 1000).toFixed(0) + 'K' : chartConfig[activeChart].data[currentMonthIdx]}` },
                    ].map((s, i) => (
                        <div key={i} style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.04)',
                            backdropFilter: 'blur(4px)',
                        }}>
                            <div style={{
                                fontSize: '0.58rem', color: 'var(--text-tertiary)',
                                textTransform: 'uppercase', marginBottom: '3px',
                                letterSpacing: '0.08em', fontWeight: 600,
                            }}>{s.label}</div>
                            <div style={{
                                fontSize: '0.98rem', fontWeight: 700,
                                background: `linear-gradient(135deg, ${chartConfig[activeChart].color}, ${chartConfig[activeChart].color}cc)`,
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            }}>{s.value}</div>
                            {s.month && <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>{s.month}</div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* ══════ Two-Column: Fabric Heatmap + Team Performance ══════ */}
            <div className="grid-sidebar-layout" style={{ position: 'relative', zIndex: 1 }}>
                {/* Left — Fabric Conversion Funnel */}
                <div>
                    <div className="card" style={{ marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
                        {/* Subtle dot pattern */}
                        <div style={{
                            position: 'absolute', inset: 0, opacity: 0.02,
                            backgroundImage: 'radial-gradient(circle, var(--text-primary) 1px, transparent 1px)',
                            backgroundSize: '20px 20px', pointerEvents: 'none',
                        }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2px' }}>Kumas Donusum Haritasi</h3>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                    Demo goruntuleme vs siparis donusum orani
                                </p>
                            </div>
                            {/* Enhanced legend */}
                            <div style={{
                                display: 'flex', gap: '12px', fontSize: '0.6rem', color: 'var(--text-tertiary)',
                                padding: '6px 14px',
                                background: 'linear-gradient(135deg, var(--bg-tertiary), rgba(22,27,34,0.8))',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-secondary)',
                                backdropFilter: 'blur(4px)',
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }} /> {'<'}30%
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'linear-gradient(135deg, #f0b429, #d4a017)' }} /> 30-50%
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'linear-gradient(135deg, #2ecc71, #27ae60)' }} /> {'>'}50%
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                            {sortedFabrics.map((f, i) => (
                                <ConversionBar
                                    key={i}
                                    name={f.name}
                                    demos={f.demos}
                                    orders={f.orders}
                                    conversion={f.conversion}
                                    color={f.color}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ══════ Conversion Summary Table — Enhanced ══════ */}
                    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                        {/* Decorative gradient top accent */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                            background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple), var(--accent-rose))',
                            opacity: 0.6,
                        }} />
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>Donusum Ozeti</h3>
                        <div className="table-container" style={{ border: '1px solid var(--border-secondary)', overflow: 'hidden' }}>
                            <table className="table" role="table" style={{ minWidth: '500px' }}>
                                <thead>
                                    <tr>
                                        <th style={{
                                            padding: '12px 14px',
                                            background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, rgba(88,166,255,0.04) 100%)',
                                        }}>Kumas</th>
                                        <th style={{
                                            padding: '12px 14px',
                                            background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, rgba(88,166,255,0.04) 100%)',
                                        }}>Demo</th>
                                        <th style={{
                                            padding: '12px 14px',
                                            background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, rgba(88,166,255,0.04) 100%)',
                                        }}>Siparis</th>
                                        <th style={{
                                            padding: '12px 14px',
                                            background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, rgba(88,166,255,0.04) 100%)',
                                        }}>Donusum</th>
                                        <th style={{
                                            padding: '12px 14px',
                                            background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, rgba(88,166,255,0.04) 100%)',
                                        }}>Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedFabrics.map((f, i) => {
                                        const convColor = f.conversion > 50 ? '#2ecc71' : f.conversion > 30 ? '#f0b429' : '#e74c3c'
                                        return (
                                            <tr key={i} style={{ transition: 'all 0.2s ease' }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = `linear-gradient(90deg, ${f.color}08, transparent)`
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'transparent'
                                                }}
                                            >
                                                <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: '18px', height: '18px', borderRadius: '4px',
                                                            background: `linear-gradient(135deg, ${f.color}, ${f.color}cc)`,
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            flexShrink: 0,
                                                            boxShadow: `0 0 6px ${f.color}22`,
                                                        }} />
                                                        {f.name}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '10px 14px' }}>{f.demos}</td>
                                                <td style={{ padding: '10px 14px' }}>{f.orders}</td>
                                                <td style={{ padding: '10px 14px' }}>
                                                    <span style={{
                                                        fontWeight: 700, fontFamily: 'var(--font-display)',
                                                        color: '#fff',
                                                        padding: '3px 10px',
                                                        borderRadius: 'var(--radius-full)',
                                                        background: `linear-gradient(135deg, ${convColor}cc, ${convColor}88)`,
                                                        fontSize: '0.78rem',
                                                        boxShadow: `0 0 10px ${convColor}22`,
                                                    }}>%{f.conversion}</span>
                                                </td>
                                                <td style={{ padding: '10px 14px' }}>
                                                    <span className={`badge ${f.conversion > 50 ? 'badge-success' : f.conversion > 30 ? 'badge-warning' : 'badge-danger'}`}>
                                                        {f.conversion > 50 ? 'Basarili' : f.conversion > 30 ? 'Orta' : 'Dusuk'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ══════ Right Sidebar — Team Performance ══════ */}
                <div style={{ position: 'sticky', top: '100px' }}>
                    {/* Team Performance Card */}
                    <div style={{
                        marginBottom: '16px', padding: '0',
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(88, 166, 255, 0.03) 100%)',
                        border: '1px solid rgba(88, 166, 255, 0.12)',
                        position: 'relative', overflow: 'hidden',
                        transition: 'all 0.3s ease',
                    }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.25)'
                            e.currentTarget.style.boxShadow = '0 0 30px rgba(88, 166, 255, 0.06)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.12)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                    >
                        {/* Top accent line */}
                        <div style={{
                            height: '2px', width: '100%',
                            background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple), var(--accent-rose))',
                            opacity: 0.5,
                        }} />
                        {/* Background decorations */}
                        <div style={{
                            position: 'absolute', top: -30, right: -30,
                            width: '120px', height: '120px', borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(88, 166, 255, 0.06) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />
                        <div style={{
                            position: 'absolute', bottom: -20, left: -20,
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />
                        {/* Dot pattern */}
                        <div style={{
                            position: 'absolute', inset: 0, opacity: 0.015,
                            backgroundImage: 'radial-gradient(circle, var(--text-primary) 1px, transparent 1px)',
                            backgroundSize: '18px 18px', pointerEvents: 'none',
                        }} />

                        <div style={{ padding: '22px 24px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', position: 'relative' }}>
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: 'var(--radius-md)',
                                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.18), rgba(139, 92, 246, 0.18))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                                    boxShadow: '0 0 16px rgba(88, 166, 255, 0.1)',
                                    border: '1px solid rgba(88, 166, 255, 0.15)',
                                }}>⚡</div>
                                <div>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0' }}>Montaj Ekip Performansi</h3>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Hiz, memnuniyet ve verimlilik</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
                                {sortedTeams.map((t, i) => {
                                    const effColor = t.efficiency >= 95 ? '#2ecc71' : t.efficiency >= 85 ? '#f0b429' : '#e74c3c'
                                    const isSelected = selectedTeam === t.name
                                    const medalGradient = i === 0
                                        ? 'linear-gradient(180deg, #FFD700, #FFA500, #FFD700)'
                                        : i === 1
                                            ? 'linear-gradient(180deg, #E8E8E8, #C0C0C0, #E8E8E8)'
                                            : i === 2
                                                ? 'linear-gradient(180deg, #CD7F32, #A0522D, #CD7F32)'
                                                : 'transparent'
                                    return (
                                        <div key={i}
                                            onClick={() => setSelectedTeam(isSelected ? null : t.name)}
                                            style={{
                                                padding: '14px',
                                                background: isSelected
                                                    ? 'linear-gradient(135deg, rgba(88,166,255,0.08), rgba(139,92,246,0.04))'
                                                    : 'linear-gradient(135deg, var(--bg-tertiary) 0%, rgba(22,27,34,0.6) 100%)',
                                                borderRadius: 'var(--radius-md)',
                                                border: isSelected
                                                    ? '1px solid rgba(88,166,255,0.25)'
                                                    : '1px solid var(--border-secondary)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                position: 'relative', overflow: 'hidden',
                                                ...(isSelected ? {
                                                    boxShadow: '0 0 20px rgba(88,166,255,0.08), inset 0 0 30px rgba(88,166,255,0.03)',
                                                } : {}),
                                            }}
                                            onMouseEnter={e => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.borderColor = 'rgba(88,166,255,0.15)'
                                                    e.currentTarget.style.transform = 'translateX(2px)'
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.borderColor = 'var(--border-secondary)'
                                                    e.currentTarget.style.transform = 'translateX(0)'
                                                }
                                            }}
                                        >
                                            {/* Rank accent bar with medal gradient */}
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, width: '3px', height: '100%',
                                                background: medalGradient,
                                                borderRadius: '3px 0 0 3px',
                                                boxShadow: i < 3 ? `0 0 8px ${i === 0 ? '#FFD70044' : i === 1 ? '#C0C0C044' : '#CD7F3244'}` : 'none',
                                            }} />

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
                                                <div style={{ position: 'relative' }}>
                                                    {/* Glow effect behind ring */}
                                                    <div style={{
                                                        position: 'absolute', inset: '-4px',
                                                        borderRadius: '50%',
                                                        background: `radial-gradient(circle, ${effColor}18, transparent 70%)`,
                                                        filter: 'blur(4px)',
                                                    }} />
                                                    <EfficiencyRing value={t.efficiency} color={effColor} />
                                                    <div style={{
                                                        position: 'absolute', inset: 0, display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.7rem', fontWeight: 800, color: effColor,
                                                        textShadow: `0 0 8px ${effColor}33`,
                                                    }}>{t.efficiency}</div>
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{t.name}</span>
                                                        <span style={{
                                                            fontSize: '0.62rem', fontWeight: 700,
                                                            color: t.trend >= 0 ? '#2ecc71' : '#e74c3c',
                                                            display: 'flex', alignItems: 'center', gap: '2px',
                                                            padding: '2px 6px',
                                                            borderRadius: 'var(--radius-full)',
                                                            background: t.trend >= 0 ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
                                                        }}>
                                                            {t.trend >= 0 ? '↑' : '↓'}{Math.abs(t.trend)}%
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="animate-fade-in-up" style={{
                                                            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px',
                                                            marginTop: '10px',
                                                        }}>
                                                            {[
                                                                { label: 'Hiz', value: `${t.avgSpeed}/100`, icon: '⚡' },
                                                                { label: 'Memnuniyet', value: `⭐ ${t.satisfaction}`, icon: '' },
                                                                { label: 'Is Sayisi', value: t.jobs, icon: '📋' },
                                                            ].map((detail, di) => (
                                                                <div key={di} style={{
                                                                    padding: '8px 6px',
                                                                    borderRadius: 'var(--radius-sm)',
                                                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                                    backdropFilter: 'blur(4px)',
                                                                    textAlign: 'center',
                                                                    fontSize: '0.68rem',
                                                                }}>
                                                                    <div style={{ color: 'var(--text-tertiary)', marginBottom: '3px', fontSize: '0.6rem' }}>{detail.label}</div>
                                                                    <div style={{ fontWeight: 700 }}>{detail.value}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ══════ Quick Insights Panel ══════ */}
                    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                        {/* Dot pattern background */}
                        <div style={{
                            position: 'absolute', inset: 0, opacity: 0.02,
                            backgroundImage: 'radial-gradient(circle, var(--text-primary) 1px, transparent 1px)',
                            backgroundSize: '16px 16px', pointerEvents: 'none',
                        }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', position: 'relative' }}>
                            <div style={{
                                width: '30px', height: '30px', borderRadius: 'var(--radius-md)',
                                background: 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.08))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.9rem',
                                border: '1px solid rgba(240,180,41,0.12)',
                            }}>💡</div>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Hizli Icgoruler</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
                            {[
                                { icon: '📈', text: 'Gelir son 3 ayda %18 artti', color: 'rgba(46,204,113,0.08)', border: 'rgba(46,204,113,0.18)', accent: '#2ecc71', iconBg: 'rgba(46,204,113,0.1)' },
                                { icon: '🔥', text: 'Tul Beyaz en yuksek donusum oranina sahip', color: 'rgba(88,166,255,0.08)', border: 'rgba(88,166,255,0.18)', accent: '#58a6ff', iconBg: 'rgba(88,166,255,0.1)' },
                                { icon: '⚡', text: 'Ekip C en verimli calisan ekip', color: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.18)', accent: '#bc8cff', iconBg: 'rgba(139,92,246,0.1)' },
                                { icon: '⚠️', text: 'Keten Lacivert donusumu dusuk — indirim deneyin', color: 'rgba(240,180,41,0.08)', border: 'rgba(240,180,41,0.18)', accent: '#f0b429', iconBg: 'rgba(240,180,41,0.1)' },
                            ].map((insight, i) => (
                                <div key={i} style={{
                                    padding: '14px 16px', borderRadius: 'var(--radius-md)',
                                    background: `linear-gradient(135deg, ${insight.color}, transparent)`,
                                    border: `1px solid ${insight.border}`,
                                    borderLeft: `3px solid ${insight.accent}`,
                                    fontSize: '0.78rem', lineHeight: 1.5,
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'default',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-2px) translateX(2px)'
                                        e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.15), 0 0 12px ${insight.accent}10`
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0) translateX(0)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                >
                                    {/* Icon background decoration */}
                                    <div style={{
                                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                        fontSize: '2.5rem', opacity: 0.04, pointerEvents: 'none',
                                    }}>{insight.icon}</div>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                                        background: insight.iconBg,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.9rem', flexShrink: 0,
                                        border: `1px solid ${insight.accent}15`,
                                    }}>{insight.icon}</div>
                                    <span style={{ position: 'relative' }}>{insight.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
