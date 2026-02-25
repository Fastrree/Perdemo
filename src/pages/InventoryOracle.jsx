import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useProducts } from '../hooks/useProducts'
import { useCurrency } from '../hooks/useCurrency'

/* ═══════════════════════════════════════════════════
   MOCK DATA — Seasonal Sales History per Product
   (Products will be loaded from API, these are fallback defaults)
   ═══════════════════════════════════════════════════ */

const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

const seasonalPatterns = {
    spring: [0.6, 0.7, 1.3, 1.6, 1.8, 1.4, 0.9, 0.7, 0.8, 0.7, 0.5, 0.5],
    summer: [0.5, 0.6, 0.8, 1.0, 1.3, 1.6, 1.7, 1.5, 1.0, 0.7, 0.5, 0.4],
    autumn: [0.5, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.2, 1.5, 1.7, 1.6, 1.2],
    winter: [1.4, 1.3, 1.0, 0.7, 0.5, 0.4, 0.4, 0.5, 0.8, 1.2, 1.5, 1.7],
    all: [1.0, 0.9, 1.0, 1.1, 1.1, 1.0, 0.9, 0.8, 1.0, 1.1, 1.1, 1.0],
}

const seasonLabels = {
    spring: { emoji: '🌸', label: 'Bahar' },
    summer: { emoji: '☀️', label: 'Yaz' },
    autumn: { emoji: '🍂', label: 'Sonbahar' },
    winter: { emoji: '❄️', label: 'Kış' },
    all: { emoji: '📅', label: 'Tüm Yıl' },
}

function buildSalesHistories(products) {
    const histories = {}
    products.forEach(p => {
        const pattern = seasonalPatterns[p.season] || seasonalPatterns.all
        histories[p.id] = pattern.map((mult, i) => {
            const base = (p.monthlyAvg || 5) * mult
            const seed = ((String(p.id).charCodeAt(0) * 31 + i * 17) % 100) / 100 - 0.5
            const noise = seed * (p.monthlyAvg || 5) * 0.3
            return Math.max(0, Math.round(base + noise))
        })
    })
    return histories
}

function predictDaysUntilStockout(product, salesHistories) {
    const nextMonths = [1, 2, 3]
    const history = salesHistories[product.id]
    if (!history) return Infinity
    const avgNext3 = nextMonths.reduce((sum, m) => sum + (history[m] || 0), 0) / 3
    const dailyRate = avgNext3 / 30
    if (dailyRate <= 0) return Infinity
    return Math.round(product.stock / dailyRate)
}

function getRiskLevel(days) {
    if (days <= 14) return { level: 'critical', label: 'Kritik', color: '#e74c3c', icon: '🔴', bgColor: 'rgba(231, 76, 60, 0.1)', borderColor: 'rgba(231, 76, 60, 0.25)' }
    if (days <= 30) return { level: 'warning', label: 'Uyarı', color: '#f39c12', icon: '🟡', bgColor: 'rgba(243, 156, 18, 0.1)', borderColor: 'rgba(243, 156, 18, 0.25)' }
    if (days <= 60) return { level: 'watch', label: 'İzle', color: '#3498db', icon: '🔵', bgColor: 'rgba(52, 152, 219, 0.1)', borderColor: 'rgba(52, 152, 219, 0.25)' }
    return { level: 'safe', label: 'Güvenli', color: '#2ecc71', icon: '🟢', bgColor: 'rgba(46, 204, 113, 0.1)', borderColor: 'rgba(46, 204, 113, 0.25)' }
}

/* ═══════════════════════════════════════════════════
   STOCK HEALTH BAR — Visual stock level indicator
   ═══════════════════════════════════════════════════ */
function StockHealthBar({ stock, monthlyAvg }) {
    const maxStock = monthlyAvg * 6
    const pct = Math.min((stock / maxStock) * 100, 100)
    const barColor = pct <= 20 ? '#e74c3c' : pct <= 40 ? '#f39c12' : pct <= 70 ? '#3498db' : '#2ecc71'

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '90px' }}>
            <div style={{
                flex: 1, height: '7px', background: 'var(--bg-tertiary)',
                borderRadius: '4px', overflow: 'hidden', minWidth: '40px',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
            }}>
                <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: '4px',
                    background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: pct <= 30 ? `0 0 10px ${barColor}66, 0 0 4px ${barColor}44` : `0 0 6px ${barColor}44`,
                }} />
            </div>
            <span style={{
                fontWeight: 700, fontFamily: 'var(--font-display)',
                fontSize: '0.85rem', minWidth: '32px',
                color: pct <= 20 ? '#e74c3c' : pct <= 40 ? '#f39c12' : 'var(--text-primary)',
                textShadow: pct <= 20 ? '0 0 8px rgba(231,76,60,0.4)' : 'none',
            }}>
                {stock}
            </span>
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   MINI CANVAS CHARTS
   ═══════════════════════════════════════════════════ */
const SeasonalChart = memo(function SeasonalChart({ data, currentMonth = 1, color = '#58a6ff', height = 200 }) {
    const canvasRef = useRef(null)
    const cssVarsRef = useRef({ gridColor: 'rgba(48,54,61,0.5)', textColor: '#6e7681' })

    useEffect(() => {
        const style = getComputedStyle(document.documentElement)
        cssVarsRef.current = {
            gridColor: style.getPropertyValue('--border-primary').trim() || 'rgba(48,54,61,0.5)',
            textColor: style.getPropertyValue('--text-tertiary').trim() || '#6e7681',
        }
    }, [])

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

        ctx.strokeStyle = gridColor
        ctx.lineWidth = 0.5
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (ch / 4) * i
            ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke()
            ctx.fillStyle = textColor; ctx.font = '10px Inter'; ctx.textAlign = 'right'
            ctx.fillText(Math.round(max - (max / 4) * i), pad.left - 6, y + 3)
        }

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
        grad.addColorStop(1, color + '05')
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

        // Dots
        data.forEach((val, i) => {
            const x = pad.left + step * i
            const y = pad.top + ch - (val / max) * ch
            ctx.beginPath(); ctx.arc(x, y, i === currentMonth ? 5 : 3, 0, Math.PI * 2)
            ctx.fillStyle = color; ctx.fill()
            if (i === currentMonth) {
                ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2)
                ctx.strokeStyle = color + '44'; ctx.lineWidth = 2; ctx.stroke()
                // Value label above dot
                ctx.fillStyle = color
                ctx.font = 'bold 11px Inter'
                ctx.textAlign = 'center'
                ctx.fillText(val, x, y - 12)
            }
        })
    }, [data, currentMonth, color, height])

    const canvasStyle = useMemo(() => ({ width: '100%', height: `${height}px`, display: 'block' }), [height])
    return <canvas ref={canvasRef} style={canvasStyle} />
})

/* ═══════════════════════════════════════════════════
   ENHANCED HEATMAP — Multi-color with current month
   ═══════════════════════════════════════════════════ */
const currentMonthIdx = 1

function heatColor(intensity) {
    if (intensity > 0.75) return { bg: 'rgba(88, 166, 255, 0.65)', color: '#fff', weight: 800 }
    if (intensity > 0.5) return { bg: 'rgba(88, 166, 255, 0.4)', color: '#fff', weight: 700 }
    if (intensity > 0.3) return { bg: 'rgba(88, 166, 255, 0.2)', color: 'var(--text-primary)', weight: 500 }
    if (intensity > 0.1) return { bg: 'rgba(88, 166, 255, 0.08)', color: 'var(--text-secondary)', weight: 400 }
    return { bg: 'rgba(88, 166, 255, 0.03)', color: 'var(--text-tertiary)', weight: 400 }
}

const SeasonHeatmap = memo(function SeasonHeatmap({ products, salesHistories }) {
    const heatmapMaxVal = useMemo(() => {
        let mx = 0
        products.forEach(p => { (salesHistories[p.id] || []).forEach(v => { if (v > mx) mx = v }) })
        return mx || 1
    }, [products, salesHistories])

    const cellData = useMemo(() => {
        return products.map(p => ({
            id: p.id,
            name: p.name,
            season: p.season || 'all',
            cells: (salesHistories[p.id] || []).map((val, monthIdx) => {
                const intensity = val / heatmapMaxVal
                const hc = heatColor(intensity)
                const isCurrent = monthIdx === currentMonthIdx
                return {
                    val,
                    isCurrent,
                    style: {
                        padding: '8px 5px', textAlign: 'center',
                        borderRadius: '6px',
                        background: isCurrent
                            ? `linear-gradient(135deg, ${hc.bg}, rgba(139, 92, 246, 0.3))`
                            : hc.bg,
                        color: hc.color,
                        fontWeight: hc.weight,
                        border: isCurrent ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid transparent',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'default',
                        fontSize: '0.73rem',
                        letterSpacing: '-0.01em',
                        boxShadow: isCurrent ? '0 0 8px rgba(139, 92, 246, 0.2)' : 'none',
                    }
                }
            })
        }))
    }, [products, salesHistories, heatmapMaxVal])

    return (
        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px', fontSize: '0.72rem' }}>
                <thead>
                    <tr>
                        <th style={{
                            textAlign: 'left', padding: '10px 12px', color: 'var(--text-tertiary)',
                            fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase',
                            letterSpacing: '0.06em', borderBottom: '1px solid var(--border-secondary)',
                        }}>Kumaş</th>
                        {months.map((m, i) => (
                            <th key={m} style={{
                                padding: '10px 4px', textAlign: 'center', minWidth: '38px',
                                color: i === currentMonthIdx ? '#bc8cff' : 'var(--text-tertiary)',
                                fontWeight: i === currentMonthIdx ? 800 : 500,
                                fontSize: i === currentMonthIdx ? '0.78rem' : '0.68rem',
                                borderBottom: i === currentMonthIdx ? '2px solid rgba(139, 92, 246, 0.5)' : '1px solid var(--border-secondary)',
                                background: i === currentMonthIdx ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                                borderRadius: i === currentMonthIdx ? '6px 6px 0 0' : '0',
                            }}>{m}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {cellData.map(row => (
                        <tr key={row.id}>
                            <td style={{
                                padding: '8px 12px', fontWeight: 600, whiteSpace: 'nowrap',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                fontSize: '0.78rem',
                            }}>
                                <span style={{
                                    fontSize: '0.75rem',
                                    filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.1))',
                                }}>{seasonLabels[row.season].emoji}</span>
                                <span style={{ color: 'var(--text-primary)' }}>{row.name}</span>
                            </td>
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
   RISK CARD — Individual product risk summary
   ═══════════════════════════════════════════════════ */
function ProductRiskCard({ product, isSelected, onClick, onAIAnalyze }) {
    const p = product
    const riskGradient = p.risk.level === 'critical'
        ? 'linear-gradient(180deg, #e74c3c, #c0392b, #a93226)'
        : p.risk.level === 'warning'
            ? 'linear-gradient(180deg, #f39c12, #e67e22, #d35400)'
            : p.risk.level === 'watch'
                ? 'linear-gradient(180deg, #3498db, #2980b9, #2471a3)'
                : 'linear-gradient(180deg, #2ecc71, #27ae60, #1e8449)'

    return (
        <div
            onClick={onClick}
            className="animate-fade-in-up"
            style={{
                padding: '18px 18px 18px 22px', borderRadius: 'var(--radius-lg)',
                background: isSelected
                    ? `linear-gradient(135deg, ${p.risk.bgColor}, rgba(255,255,255,0.02), var(--bg-secondary))`
                    : 'var(--bg-secondary)',
                border: isSelected
                    ? `1px solid ${p.risk.borderColor}`
                    : '1px solid var(--border-primary)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: isSelected ? 'blur(12px) saturate(150%)' : 'none',
                boxShadow: isSelected ? `0 4px 20px ${p.risk.color}15, 0 0 0 1px ${p.risk.color}10` : 'var(--shadow-sm)',
            }}
        >
            {/* Risk accent line — gradient matching risk level */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                background: riskGradient,
                borderRadius: '4px 0 0 4px',
                opacity: isSelected ? 1 : 0.6,
                transition: 'opacity 0.3s',
                boxShadow: isSelected ? `0 0 12px ${p.risk.color}40` : 'none',
            }} />

            {/* Subtle glow orb on selected */}
            {isSelected && (
                <div style={{
                    position: 'absolute', top: -30, right: -30,
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: `radial-gradient(circle, ${p.risk.color}15 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }} />
            )}

            <div style={{ paddingLeft: '8px' }}>
                {/* Top row: name + badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{p.name}</span>
                        <span style={{
                            fontSize: '0.62rem', padding: '3px 10px', borderRadius: 'var(--radius-full)',
                            background: `linear-gradient(135deg, ${p.risk.bgColor}, ${p.risk.color}08)`,
                            color: p.risk.color, fontWeight: 700,
                            border: `1px solid ${p.risk.borderColor}`,
                            boxShadow: `0 0 8px ${p.risk.color}10`,
                            letterSpacing: '0.02em',
                        }}>
                            {p.risk.icon} {p.risk.label}
                        </span>
                    </div>
                    <span style={{
                        fontSize: '0.65rem', color: 'var(--text-tertiary)',
                        padding: '3px 8px', background: 'rgba(255,255,255,0.03)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-secondary)',
                        fontWeight: 500,
                    }}>{p.category}</span>
                </div>

                {/* Stock health bar */}
                <StockHealthBar stock={p.stock} monthlyAvg={p.monthlyAvg} />

                {/* Bottom row: metrics */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: '12px', gap: '12px',
                }}>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aylık Ort</span>
                            <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{p.monthlyAvg}/ay</span>
                        </span>
                        <span style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tükenme</span>
                            <span style={{
                                fontWeight: 800, fontSize: '0.82rem', color: p.risk.color,
                                textShadow: p.risk.level === 'critical' ? `0 0 8px ${p.risk.color}40` : 'none',
                            }}>
                                {p.daysLeft === Infinity ? '∞' : `${p.daysLeft} gün`}
                            </span>
                        </span>
                    </div>
                    <button className="btn btn-ghost" style={{
                        fontSize: '0.7rem', padding: '6px 14px',
                        background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.08), rgba(139, 92, 246, 0.06))',
                        border: '1px solid rgba(88, 166, 255, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        transition: 'all 0.3s ease',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                    }}
                        onClick={(e) => { e.stopPropagation(); onAIAnalyze(p) }}>
                        ✨ AI Analiz
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function InventoryOracle() {
    const { t } = useTranslation('inventory')
    const { symbol, formatMoney } = useCurrency()
    const { products: rawProducts, loading, error } = useProducts()
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [aiLoading, setAiLoading] = useState(false)
    const [aiInsight, setAiInsight] = useState(null)
    const [viewMode, setViewMode] = useState('cards')

    // Normalize DB products for Oracle use
    const products = useMemo(() => rawProducts.map(p => ({
        id: p.id,
        name: p.name || '',
        stock: p.stock_meters ?? p.stock ?? 0,
        price: p.price_per_meter ?? p.price ?? 0,
        monthlyAvg: p.monthly_avg ?? Math.max(1, Math.round(Math.random() * 10 + 3)),
        category: p.category || 'Fon',
        season: p.season || 'all',
    })), [rawProducts])

    const salesHistories = useMemo(() => buildSalesHistories(products), [products])

    const predictions = useMemo(() =>
        products.map(p => {
            const days = predictDaysUntilStockout(p, salesHistories)
            const risk = getRiskLevel(days)
            return { ...p, daysLeft: days, risk, history: salesHistories[p.id] || [] }
        }).sort((a, b) => a.daysLeft - b.daysLeft)
        , [products, salesHistories])

    const { criticalCount, warningCount } = useMemo(() => {
        let critical = 0, warning = 0
        predictions.forEach(p => {
            if (p.risk.level === 'critical') critical++
            else if (p.risk.level === 'warning') warning++
        })
        return { criticalCount: critical, warningCount: warning }
    }, [predictions])

    const totalStockValue = useMemo(() =>
        products.reduce((sum, p) => sum + p.stock * p.price, 0)
        , [products])

    const totalStock = useMemo(() =>
        products.reduce((sum, p) => sum + p.stock, 0)
        , [products])

    const kpiStats = useMemo(() => [
        { label: 'Toplam Stok', value: totalStock, suffix: ' adet', icon: '📦', color: 'rgba(88, 166, 255, 0.12)', accent: 'var(--accent-blue)', accentRaw: '88, 166, 255' },
        { label: 'Stok Değeri', value: `${symbol}${(totalStockValue / 1000).toFixed(0)}K`, icon: '💎', color: 'rgba(139, 92, 246, 0.12)', accent: '#bc8cff', accentRaw: '188, 140, 255' },
        { label: 'Kritik Stok', value: criticalCount, icon: '🔴', color: 'rgba(231, 76, 60, 0.12)', accent: '#e74c3c', accentRaw: '231, 76, 60' },
        { label: 'Uyarı', value: warningCount, icon: '🟡', color: 'rgba(243, 156, 18, 0.12)', accent: '#f39c12', accentRaw: '243, 156, 18' },
        { label: 'Güvenli', value: products.length - criticalCount - warningCount, icon: '🟢', color: 'rgba(46, 204, 113, 0.12)', accent: '#2ecc71', accentRaw: '46, 204, 113' },
    ], [criticalCount, warningCount, totalStockValue, totalStock, products.length])

    const handleAIInsight = useCallback(async (product) => {
        setAiLoading(true)
        setAiInsight(null)
        setSelectedProduct(product)
        await new Promise(r => setTimeout(r, 2000))
        const pattern = product.season === 'spring' ? 'Bahar aylarinda talep artisi bekleniyor'
            : product.season === 'autumn' ? 'Sonbahar sezonu yaklasirken talep yukselecek'
                : product.season === 'winter' ? 'Kis aylarinda karartma ihtiyaci artacak'
                    : product.season === 'summer' ? 'Yaz aylarinda hafif kumas talebi yukselir'
                        : 'Yil boyunca stabil talep gosteren bir urun'

        const reorderQty = Math.ceil(product.monthlyAvg * 2.5)
        const cost = reorderQty * product.price

        setAiInsight({
            product: product.name,
            prediction: `${product.name} mevcut satis hizinda ${product.daysLeft} gun icinde tukenecek. ${pattern}. Onumuzdeki 2.5 aylik ihtiyaci karsilamak icin en az ${reorderQty} adet siparis vermenizi oneriyoruz.`,
            reorderQty,
            estimatedCost: cost,
            urgency: product.risk.level === 'critical' ? 'Acil siparis verin!' : product.risk.level === 'warning' ? 'Bu hafta icinde siparis planlanmali.' : 'Planli siparis yeterli.',
            seasonTip: pattern,
            risk: product.risk,
        })
        setAiLoading(false)
    }, [])

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid var(--border-primary)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)' }}>Stok verileri yükleniyor...</span>
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
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                        <span style={{
                            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.12), rgba(139, 92, 246, 0.12))',
                            width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.4rem',
                            boxShadow: '0 0 20px rgba(88, 166, 255, 0.1)',
                        }}>🔮</span>
                        Stok Oracle
                    </h1>
                    <p className="page-subtitle">AI destekli stok analizi, tukenme tahmini ve tedarik onerisi</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{
                        display: 'flex', gap: '2px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 'var(--radius-md)', padding: '3px',
                        border: '1px solid var(--border-secondary)',
                        backdropFilter: 'blur(8px)',
                    }}>
                        <button
                            className={`btn ${viewMode === 'cards' ? 'btn-secondary' : 'btn-ghost'}`}
                            style={{
                                fontSize: '0.75rem', padding: '6px 14px', minHeight: '34px',
                                borderRadius: 'var(--radius-sm)',
                            }}
                            onClick={() => setViewMode('cards')}
                            aria-label="Kart gorunumu"
                        >⊞ Kartlar</button>
                        <button
                            className={`btn ${viewMode === 'table' ? 'btn-secondary' : 'btn-ghost'}`}
                            style={{
                                fontSize: '0.75rem', padding: '6px 14px', minHeight: '34px',
                                borderRadius: 'var(--radius-sm)',
                            }}
                            onClick={() => setViewMode('table')}
                            aria-label="Tablo gorunumu"
                        >☰ Tablo</button>
                    </div>
                </div>
            </div>

            {/* Critical Alert Banner — Enhanced with animated pulse border */}
            {criticalCount > 0 && (
                <div className="animate-fade-in-up" style={{
                    padding: '18px 28px', marginBottom: '28px',
                    background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(231, 76, 60, 0.04) 50%, rgba(192, 57, 43, 0.08) 100%)',
                    border: '1px solid rgba(231, 76, 60, 0.25)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex', alignItems: 'center', gap: '18px',
                    position: 'relative', overflow: 'hidden',
                    animation: 'pulse-glow 3s ease-in-out infinite',
                    boxShadow: '0 4px 24px rgba(231, 76, 60, 0.08), inset 0 0 30px rgba(231, 76, 60, 0.03)',
                }}>
                    {/* Animated left accent */}
                    <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                        background: 'linear-gradient(180deg, #e74c3c, #f39c12, #e74c3c)',
                        backgroundSize: '100% 200%',
                        animation: 'gradient-shift 2s ease-in-out infinite',
                    }} />

                    {/* Top shimmer line */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(231, 76, 60, 0.4), transparent)',
                    }} />

                    {/* Warning icon with glow ring */}
                    <div style={{
                        width: '52px', height: '52px', borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.2), rgba(231, 76, 60, 0.08))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', flexShrink: 0,
                        boxShadow: '0 0 20px rgba(231, 76, 60, 0.15), inset 0 0 12px rgba(231, 76, 60, 0.05)',
                        border: '1px solid rgba(231, 76, 60, 0.2)',
                    }}>⚠️</div>

                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontWeight: 800, fontSize: '0.98rem', color: '#e74c3c', marginBottom: '4px',
                            letterSpacing: '-0.01em',
                            textShadow: '0 0 20px rgba(231, 76, 60, 0.3)',
                        }}>
                            {criticalCount} ürün kritik stok seviyesinde!
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {warningCount > 0 && `${warningCount} ürün uyarı seviyesinde. `}
                            Acil tedarik siparişi oluşturmanız önerilir.
                        </div>
                    </div>
                    <button className="btn btn-primary" style={{
                        fontSize: '0.8rem', padding: '10px 22px',
                        background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                        flexShrink: 0,
                        boxShadow: '0 4px 16px rgba(231, 76, 60, 0.3), 0 0 0 1px rgba(231, 76, 60, 0.2)',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                    }}>
                        🚀 Toplu Sipariş
                    </button>
                </div>
            )}

            {/* KPI Cards — 5 columns with glass overlay */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '16px', marginBottom: '32px',
            }}>
                {kpiStats.map((stat, i) => (
                    <div key={i} className="animate-fade-in-up" style={{
                        animationDelay: `${i * 0.06}s`,
                        padding: '22px', borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        position: 'relative', overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(8px)',
                    }}>
                        {/* Animated accent gradient at top */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                            background: `linear-gradient(90deg, transparent, rgba(${stat.accentRaw}, 0.6), transparent)`,
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 3s infinite',
                        }} />

                        {/* Glass overlay */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%)',
                            pointerEvents: 'none',
                        }} />

                        {/* Accent glow orb */}
                        <div style={{
                            position: 'absolute', top: -25, right: -25,
                            width: '90px', height: '90px', borderRadius: '50%',
                            background: `radial-gradient(circle, rgba(${stat.accentRaw}, 0.12) 0%, transparent 70%)`,
                            pointerEvents: 'none',
                        }} />

                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            marginBottom: '12px', position: 'relative',
                        }}>
                            {/* Icon with themed glow background */}
                            <div style={{
                                width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                                background: `linear-gradient(135deg, ${stat.color}, rgba(${stat.accentRaw}, 0.06))`,
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '1.2rem',
                                boxShadow: `0 0 16px rgba(${stat.accentRaw}, 0.15)`,
                                border: `1px solid rgba(${stat.accentRaw}, 0.1)`,
                            }}>{stat.icon}</div>
                            <span style={{
                                fontSize: '0.68rem', color: 'var(--text-tertiary)',
                                fontWeight: 600, textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                            }}>{stat.label}</span>
                        </div>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{
                                fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-display)',
                                color: stat.accent,
                                letterSpacing: '-0.02em',
                            }}>
                                {typeof stat.value === 'number' ? stat.value : stat.value}
                            </span>
                            {stat.suffix && (
                                <span style={{
                                    fontSize: '0.78rem', fontWeight: 400,
                                    color: 'var(--text-tertiary)',
                                    letterSpacing: '0.01em',
                                }}>{stat.suffix}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Layout */}
            <div className="grid-sidebar-layout">
                {/* Left — Stock Items */}
                <div>
                    {/* Card View */}
                    {viewMode === 'cards' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                            {predictions.map((p) => (
                                <ProductRiskCard
                                    key={p.id}
                                    product={p}
                                    isSelected={selectedProduct?.id === p.id}
                                    onClick={() => setSelectedProduct(p)}
                                    onAIAnalyze={handleAIInsight}
                                />
                            ))}
                        </div>
                    ) : (
                        /* Table View — Enhanced with risk-color left accent */
                        <div className="card" style={{ marginBottom: '28px', padding: '20px' }}>
                            <h3 style={{
                                fontSize: '1.05rem', fontWeight: 700, marginBottom: '18px',
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                <span style={{ fontSize: '0.9rem' }}>📊</span>
                                Stok Risk Tablosu
                            </h3>
                            <div className="table-container" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                                <table className="table" role="table" style={{ minWidth: '600px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: '14px 16px' }}>Ürün</th>
                                            <th style={{ padding: '14px 16px' }}>Stok</th>
                                            <th style={{ padding: '14px 16px' }}>Ort/Ay</th>
                                            <th style={{ padding: '14px 16px' }}>Tükenme</th>
                                            <th style={{ padding: '14px 16px' }}>Risk</th>
                                            <th style={{ padding: '14px 16px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {predictions.map((p) => (
                                            <tr key={p.id}
                                                style={{
                                                    cursor: 'pointer',
                                                    background: selectedProduct?.id === p.id ? p.risk.bgColor : undefined,
                                                    position: 'relative',
                                                    transition: 'all 0.25s ease',
                                                }}
                                                onClick={() => setSelectedProduct(p)}>
                                                <td style={{
                                                    fontWeight: 600, padding: '12px 16px', whiteSpace: 'nowrap',
                                                    borderLeft: `3px solid ${p.risk.color}`,
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ fontWeight: 700 }}>{p.name}</span>
                                                        <span style={{
                                                            fontSize: '0.65rem', color: 'var(--text-tertiary)',
                                                            padding: '2px 6px', background: 'var(--bg-tertiary)',
                                                            borderRadius: 'var(--radius-sm)',
                                                        }}>{p.category}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <StockHealthBar stock={p.stock} monthlyAvg={p.monthlyAvg} />
                                                </td>
                                                <td style={{
                                                    padding: '12px 16px',
                                                    fontFamily: 'var(--font-display)',
                                                    fontWeight: 600,
                                                }}>{p.monthlyAvg}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{
                                                        fontWeight: 800, color: p.risk.color,
                                                        fontFamily: 'var(--font-display)',
                                                        whiteSpace: 'nowrap',
                                                        textShadow: p.risk.level === 'critical' ? `0 0 8px ${p.risk.color}30` : 'none',
                                                    }}>
                                                        {p.daysLeft === Infinity ? '∞' : `${p.daysLeft} gün`}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span className={`badge ${p.risk.level === 'critical' ? 'badge-danger' : p.risk.level === 'warning' ? 'badge-warning' : p.risk.level === 'watch' ? 'badge-info' : 'badge-success'}`}>
                                                        {p.risk.icon} {p.risk.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <button className="btn btn-ghost" style={{
                                                        fontSize: '0.72rem', padding: '5px 12px', whiteSpace: 'nowrap',
                                                        background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.06), rgba(139, 92, 246, 0.04))',
                                                        border: '1px solid rgba(88, 166, 255, 0.15)',
                                                        borderRadius: 'var(--radius-sm)',
                                                    }}
                                                        onClick={(e) => { e.stopPropagation(); handleAIInsight(p) }}>
                                                        ✨ AI
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Seasonal Heatmap — Glass-effect card container */}
                    <div style={{
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--gradient-card)',
                        border: '1px solid var(--border-primary)',
                        padding: '24px',
                        backdropFilter: 'blur(8px)',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        {/* Glass overlay */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%)',
                            pointerEvents: 'none',
                        }} />

                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: '18px', position: 'relative',
                        }}>
                            <div>
                                <h3 style={{
                                    fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                }}>
                                    <span style={{ fontSize: '0.9rem' }}>🗺️</span>
                                    Mevsimsel Satış Haritası
                                </h3>
                                <p style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                                    Her kumaşın aylık tahmini satışı — <span style={{
                                        color: '#bc8cff', fontWeight: 700,
                                        textShadow: '0 0 10px rgba(139, 92, 246, 0.3)',
                                    }}>Şubat</span> mevcut ay
                                </p>
                            </div>

                            {/* Legend with better visual hierarchy */}
                            <div style={{
                                display: 'flex', gap: '12px', fontSize: '0.62rem', color: 'var(--text-tertiary)',
                                padding: '6px 14px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-secondary)',
                                backdropFilter: 'blur(4px)',
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{
                                        width: '12px', height: '12px', borderRadius: '3px',
                                        background: 'rgba(88, 166, 255, 0.08)',
                                        border: '1px solid rgba(88, 166, 255, 0.15)',
                                    }} />
                                    <span style={{ fontWeight: 500 }}>Düşük</span>
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{
                                        width: '12px', height: '12px', borderRadius: '3px',
                                        background: 'rgba(88, 166, 255, 0.4)',
                                        border: '1px solid rgba(88, 166, 255, 0.3)',
                                    }} />
                                    <span style={{ fontWeight: 500 }}>Orta</span>
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{
                                        width: '12px', height: '12px', borderRadius: '3px',
                                        background: 'rgba(88, 166, 255, 0.65)',
                                        border: '1px solid rgba(88, 166, 255, 0.5)',
                                        boxShadow: '0 0 6px rgba(88, 166, 255, 0.2)',
                                    }} />
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Yüksek</span>
                                </span>
                            </div>
                        </div>
                        <SeasonHeatmap products={products} salesHistories={salesHistories} />
                    </div>
                </div>

                {/* Right Sidebar — AI + Chart */}
                <div style={{ position: 'sticky', top: '100px' }}>
                    {/* AI Insight Card — Oracle theme with mystical gradient */}
                    <div style={{
                        marginBottom: '16px', padding: '26px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(145deg, rgba(13, 17, 23, 0.9) 0%, rgba(88, 166, 255, 0.04) 40%, rgba(139, 92, 246, 0.06) 100%)',
                        border: '1px solid rgba(88, 166, 255, 0.18)',
                        position: 'relative', overflow: 'hidden',
                        boxShadow: '0 4px 24px rgba(88, 166, 255, 0.05), inset 0 0 40px rgba(88, 166, 255, 0.02)',
                    }}>
                        {/* Mystical gradient orbs */}
                        <div style={{
                            position: 'absolute', top: -40, right: -40,
                            width: '120px', height: '120px', borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />
                        <div style={{
                            position: 'absolute', bottom: -30, left: -30,
                            width: '100px', height: '100px', borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(88, 166, 255, 0.06) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />

                        {/* Top shimmer accent */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                            background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), rgba(88, 166, 255, 0.3), transparent)',
                        }} />

                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            marginBottom: '18px', position: 'relative',
                        }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.15), rgba(139, 92, 246, 0.2))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem',
                                boxShadow: '0 0 20px rgba(139, 92, 246, 0.15)',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                            }}>🧠</div>
                            <div>
                                <h3 style={{
                                    fontSize: '0.92rem', fontWeight: 800, marginBottom: '1px',
                                    background: 'linear-gradient(135deg, var(--text-primary), #bc8cff)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>AI Stok Danışmanı</h3>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>Yapay zeka destekli analiz</span>
                            </div>
                        </div>

                        {aiLoading ? (
                            /* Loading state with animated crystal ball */
                            <div style={{ textAlign: 'center', padding: '36px 0' }}>
                                <div style={{
                                    width: '64px', height: '64px', margin: '0 auto 16px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.15), rgba(139, 92, 246, 0.2))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.8rem',
                                    animation: 'pulse-glow 1.5s infinite, float 3s ease-in-out infinite',
                                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.2), 0 0 60px rgba(88, 166, 255, 0.1)',
                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                }}>🔮</div>
                                <div style={{
                                    fontSize: '0.88rem', fontWeight: 700, marginBottom: '6px',
                                    background: 'linear-gradient(135deg, var(--text-primary), #bc8cff)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>Analiz yapılıyor...</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Mevsimsel veriler işleniyor</div>
                                <div className="progress-bar" style={{
                                    marginTop: '16px', maxWidth: '200px', margin: '16px auto 0',
                                    height: '4px',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                }}>
                                    <div className="progress-fill" style={{
                                        width: '65%',
                                        animation: 'shimmer 1.5s infinite',
                                        background: 'linear-gradient(90deg, rgba(88, 166, 255, 0.5), rgba(139, 92, 246, 0.6), rgba(88, 166, 255, 0.5))',
                                        backgroundSize: '200% 100%',
                                    }} />
                                </div>
                            </div>
                        ) : aiInsight ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                                {/* Prediction text with styled quote marks */}
                                <div style={{
                                    padding: '16px 18px', borderRadius: 'var(--radius-md)',
                                    background: 'rgba(88, 166, 255, 0.04)',
                                    borderLeft: `3px solid ${aiInsight.risk?.color || 'var(--accent-blue)'}`,
                                    fontSize: '0.82rem', lineHeight: 1.8,
                                    color: 'var(--text-secondary)',
                                    position: 'relative',
                                }}>
                                    {/* Decorative quote mark */}
                                    <span style={{
                                        position: 'absolute', top: '6px', left: '10px',
                                        fontSize: '2rem', color: 'rgba(88, 166, 255, 0.15)',
                                        fontFamily: 'Georgia, serif', lineHeight: 1,
                                        pointerEvents: 'none',
                                    }}>"</span>
                                    <span style={{ position: 'relative', paddingLeft: '12px' }}>
                                        {aiInsight.prediction}
                                    </span>
                                </div>

                                {/* Stats grid with glass tiles */}
                                <div className="grid-2-col" style={{ gap: '10px' }}>
                                    <div style={{
                                        padding: '16px', borderRadius: 'var(--radius-md)',
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(88, 166, 255, 0.04))',
                                        textAlign: 'center',
                                        border: '1px solid rgba(88, 166, 255, 0.12)',
                                        backdropFilter: 'blur(4px)',
                                        position: 'relative', overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%)',
                                            pointerEvents: 'none',
                                        }} />
                                        <div style={{
                                            fontSize: '0.6rem', color: 'var(--text-tertiary)',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
                                            fontWeight: 600, position: 'relative',
                                        }}>Önerilen Sipariş</div>
                                        <div style={{
                                            fontSize: '1.7rem', fontWeight: 800, color: 'var(--accent-blue)',
                                            position: 'relative', fontFamily: 'var(--font-display)',
                                        }}>{aiInsight.reorderQty}</div>
                                        <div style={{
                                            fontSize: '0.6rem', color: 'var(--text-tertiary)',
                                            position: 'relative', marginTop: '2px',
                                        }}>adet</div>
                                    </div>
                                    <div style={{
                                        padding: '16px', borderRadius: 'var(--radius-md)',
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(139, 92, 246, 0.04))',
                                        textAlign: 'center',
                                        border: '1px solid rgba(139, 92, 246, 0.12)',
                                        backdropFilter: 'blur(4px)',
                                        position: 'relative', overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%)',
                                            pointerEvents: 'none',
                                        }} />
                                        <div style={{
                                            fontSize: '0.6rem', color: 'var(--text-tertiary)',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
                                            fontWeight: 600, position: 'relative',
                                        }}>Tahmini Maliyet</div>
                                        <div style={{
                                            fontSize: '1.7rem', fontWeight: 800,
                                            background: 'var(--gradient-brand)',
                                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                            position: 'relative', fontFamily: 'var(--font-display)',
                                        }}>
                                            {formatMoney(aiInsight.estimatedCost)}
                                        </div>
                                        <div style={{
                                            fontSize: '0.6rem', color: 'var(--text-tertiary)',
                                            position: 'relative', marginTop: '2px',
                                        }}>KDV hariç</div>
                                    </div>
                                </div>

                                {/* Urgency banner with animated border based on level */}
                                <div style={{
                                    padding: '14px 16px', borderRadius: 'var(--radius-md)',
                                    background: aiInsight.urgency.includes('Acil')
                                        ? 'linear-gradient(135deg, rgba(231,76,60,0.1), rgba(231,76,60,0.04))'
                                        : aiInsight.urgency.includes('hafta')
                                            ? 'linear-gradient(135deg, rgba(243,156,18,0.1), rgba(243,156,18,0.04))'
                                            : 'linear-gradient(135deg, rgba(46,204,113,0.1), rgba(46,204,113,0.04))',
                                    border: `1px solid ${aiInsight.urgency.includes('Acil') ? 'rgba(231,76,60,0.25)' : aiInsight.urgency.includes('hafta') ? 'rgba(243,156,18,0.25)' : 'rgba(46,204,113,0.25)'}`,
                                    fontSize: '0.82rem', fontWeight: 700,
                                    color: aiInsight.urgency.includes('Acil') ? '#e74c3c' : aiInsight.urgency.includes('hafta') ? '#f39c12' : '#2ecc71',
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    animation: aiInsight.urgency.includes('Acil') ? 'ai-border-shimmer 2s ease-in-out infinite' : 'none',
                                    boxShadow: aiInsight.urgency.includes('Acil') ? '0 0 12px rgba(231,76,60,0.08)' : 'none',
                                }}>
                                    <span style={{
                                        fontSize: '1.1rem',
                                        filter: aiInsight.urgency.includes('Acil') ? 'drop-shadow(0 0 4px rgba(231,76,60,0.4))' : 'none',
                                    }}>
                                        {aiInsight.urgency.includes('Acil') ? '🚨' : aiInsight.urgency.includes('hafta') ? '⏰' : '✅'}
                                    </span>
                                    {aiInsight.urgency}
                                </div>

                                <button className="btn btn-primary" style={{
                                    width: '100%',
                                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9), rgba(139, 92, 246, 0.8))',
                                    boxShadow: '0 4px 20px rgba(88, 166, 255, 0.2)',
                                    fontWeight: 700,
                                    letterSpacing: '0.02em',
                                }}
                                    onClick={() => alert(`Tedarikçiye siparis formu olusturuldu: ${aiInsight.reorderQty} adet ${aiInsight.product}`)}>
                                    📋 Sipariş Formu Oluştur
                                </button>
                            </div>
                        ) : (
                            /* Empty state with floating crystal ball animation */
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{
                                    width: '72px', height: '72px', margin: '0 auto 16px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.08), rgba(139, 92, 246, 0.1))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '2rem',
                                    animation: 'float 4s ease-in-out infinite',
                                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.1), 0 8px 24px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(139, 92, 246, 0.15)',
                                }}>🔮</div>
                                <div style={{
                                    fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px',
                                    color: 'var(--text-secondary)',
                                    background: 'linear-gradient(135deg, var(--text-secondary), #bc8cff)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>
                                    AI Analiz Bekliyor
                                </div>
                                <div style={{
                                    fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.6,
                                }}>
                                    Bir ürünün "✨ AI" butonuna tıklayarak<br />detaylı stok analizi alın
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Seasonal Chart — Enhanced with glow border on selection */}
                    <div style={{
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--gradient-card)',
                        border: selectedProduct
                            ? `1px solid ${selectedProduct.risk.borderColor}`
                            : '1px solid var(--border-primary)',
                        padding: '24px',
                        boxShadow: selectedProduct
                            ? `var(--shadow-sm), 0 0 20px ${selectedProduct.risk.color}10`
                            : 'var(--shadow-sm)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Glass overlay */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%)',
                            pointerEvents: 'none',
                        }} />

                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: '14px', position: 'relative',
                        }}>
                            <div>
                                <h3 style={{
                                    fontSize: '0.98rem', fontWeight: 700, marginBottom: '3px',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                }}>
                                    <span style={{ fontSize: '0.85rem' }}>📈</span>
                                    {selectedProduct ? selectedProduct.name : 'Ürün Seçin'}
                                </h3>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                    12 aylık tahmini satış trendi
                                </p>
                            </div>
                            {/* Season badge with emoji and gradient */}
                            {selectedProduct && (
                                <span style={{
                                    fontSize: '0.72rem', padding: '5px 12px',
                                    background: `linear-gradient(135deg, ${selectedProduct.risk.bgColor}, ${selectedProduct.risk.color}08)`,
                                    color: selectedProduct.risk.color,
                                    borderRadius: 'var(--radius-full)',
                                    fontWeight: 700,
                                    border: `1px solid ${selectedProduct.risk.borderColor}`,
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    boxShadow: `0 0 10px ${selectedProduct.risk.color}10`,
                                }}>
                                    <span style={{ fontSize: '0.85rem' }}>{seasonLabels[selectedProduct.season].emoji}</span>
                                    {seasonLabels[selectedProduct.season].label}
                                </span>
                            )}
                        </div>

                        {selectedProduct ? (
                            <>
                                <SeasonalChart
                                    data={selectedProduct.history}
                                    color={selectedProduct.risk.color}
                                    height={200}
                                />
                                {/* Better stats summary below chart */}
                                <div style={{
                                    marginTop: '16px', padding: '14px 16px',
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(88, 166, 255, 0.03))',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                                    gap: '14px', textAlign: 'center',
                                    border: '1px solid var(--border-secondary)',
                                }}>
                                    <div>
                                        <div style={{
                                            fontSize: '0.58rem', color: 'var(--text-tertiary)',
                                            textTransform: 'uppercase', marginBottom: '4px',
                                            letterSpacing: '0.06em', fontWeight: 600,
                                        }}>Sezon</div>
                                        <div style={{
                                            fontSize: '0.85rem', fontWeight: 700,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                        }}>
                                            <span>{seasonLabels[selectedProduct.season].emoji}</span>
                                            <span>{seasonLabels[selectedProduct.season].label}</span>
                                        </div>
                                    </div>
                                    <div style={{ borderLeft: '1px solid var(--border-secondary)', borderRight: '1px solid var(--border-secondary)', paddingLeft: '14px', paddingRight: '14px' }}>
                                        <div style={{
                                            fontSize: '0.58rem', color: 'var(--text-tertiary)',
                                            textTransform: 'uppercase', marginBottom: '4px',
                                            letterSpacing: '0.06em', fontWeight: 600,
                                        }}>Peak Ay</div>
                                        <div style={{
                                            fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-blue)',
                                            textShadow: '0 0 10px rgba(88, 166, 255, 0.2)',
                                        }}>
                                            {months[selectedProduct.history.indexOf(Math.max(...selectedProduct.history))]}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '0.58rem', color: 'var(--text-tertiary)',
                                            textTransform: 'uppercase', marginBottom: '4px',
                                            letterSpacing: '0.06em', fontWeight: 600,
                                        }}>Peak</div>
                                        <div style={{
                                            fontSize: '0.85rem', fontWeight: 800,
                                            fontFamily: 'var(--font-display)',
                                        }}>
                                            {Math.max(...selectedProduct.history)} <span style={{
                                                fontSize: '0.65rem', fontWeight: 400, color: 'var(--text-tertiary)',
                                            }}>adet</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{
                                height: '200px', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-tertiary)', gap: '10px',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(88, 166, 255, 0.03))',
                                borderRadius: 'var(--radius-md)',
                                border: '1px dashed var(--border-secondary)',
                            }}>
                                <span style={{
                                    fontSize: '1.8rem', opacity: 0.25,
                                    animation: 'float 4s ease-in-out infinite',
                                }}>📈</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Soldan bir ürün seçin</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
