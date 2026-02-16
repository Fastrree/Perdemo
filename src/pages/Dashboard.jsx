import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Mock data
const stats = [
    { label: 'Toplam Gelir', value: '₺247.580', change: '+12.5%', positive: true, icon: '💰', color: 'rgba(88, 166, 255, 0.1)' },
    { label: 'Siparişler', value: '156', change: '+8.2%', positive: true, icon: '📦', color: 'rgba(188, 140, 255, 0.1)' },
    { label: 'Ürünler', value: '89', change: '+4', positive: true, icon: '🪟', color: 'rgba(240, 180, 41, 0.1)' },
    { label: 'Müşteriler', value: '342', change: '+23', positive: true, icon: '👥', color: 'rgba(63, 185, 80, 0.1)' },
]

const recentOrders = [
    { id: 'PD-2024-001', customer: 'Elif Kaya', product: 'Kadife Perde - Bordo', amount: '₺3.450', status: 'shipped', date: '15 Şub 2026' },
    { id: 'PD-2024-002', customer: 'Mehmet Demir', product: 'Tül Perde - Beyaz', amount: '₺1.200', status: 'processing', date: '14 Şub 2026' },
    { id: 'PD-2024-003', customer: 'Ayşe Yıldız', product: 'Stor Perde - Gri', amount: '₺2.800', status: 'delivered', date: '13 Şub 2026' },
    { id: 'PD-2024-004', customer: 'Can Öztürk', product: 'Fon Perde - Lacivert', amount: '₺4.100', status: 'pending', date: '13 Şub 2026' },
    { id: 'PD-2024-005', customer: 'Zeynep Ak', product: 'Blackout Perde - Siyah', amount: '₺2.650', status: 'processing', date: '12 Şub 2026' },
]

const topProducts = [
    { name: 'Kadife Fon Perde', sales: 42, revenue: '₺54.600', trend: '+18%' },
    { name: 'Tül Perde Premium', sales: 38, revenue: '₺22.800', trend: '+12%' },
    { name: 'Blackout Stor', sales: 31, revenue: '₺43.400', trend: '+8%' },
    { name: 'Zebra Perde', sales: 27, revenue: '₺37.800', trend: '+15%' },
]

const statusMap = {
    pending: { label: 'Beklemede', class: 'badge-warning' },
    processing: { label: 'Hazırlanıyor', class: 'badge-info' },
    shipped: { label: 'Kargoda', class: 'badge-purple' },
    delivered: { label: 'Teslim Edildi', class: 'badge-success' },
}

// Simple chart component
function MiniChart() {
    const canvasRef = useRef(null)

    function drawChart() {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()

        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)

        const w = rect.width
        const h = rect.height
        const data = [30, 45, 38, 55, 48, 62, 58, 72, 68, 85, 78, 92]
        const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
        const max = Math.max(...data) * 1.15
        const isMobileChart = w < 400
        const fontSize = isMobileChart ? '9px Inter' : '11px Inter'
        const padding = { top: 20, right: 15, bottom: 40, left: isMobileChart ? 40 : 50 }
        const chartW = w - padding.left - padding.right
        const chartH = h - padding.top - padding.bottom

        // Background
        ctx.clearRect(0, 0, w, h)

        // Grid lines
        const style = getComputedStyle(document.documentElement)
        const gridColor = style.getPropertyValue('--border-primary').trim() || 'rgba(48,54,61,0.5)'
        const textColor = style.getPropertyValue('--text-tertiary').trim() || '#6e7681'

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
            ctx.fillText(`₺${val}k`, padding.left - 8, y + 4)
        }

        // Month labels — skip every other on narrow screens
        const labelStep = isMobileChart ? 2 : 1
        ctx.fillStyle = textColor
        ctx.font = fontSize
        ctx.textAlign = 'center'
        data.forEach((_, i) => {
            if (i % labelStep !== 0) return
            const x = padding.left + (chartW / (data.length - 1)) * i
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

        // Dots
        data.forEach((val, i) => {
            const x = padding.left + (chartW / (data.length - 1)) * i
            const y = padding.top + chartH - (val / max) * chartH
            ctx.beginPath()
            ctx.arc(x, y, 3.5, 0, Math.PI * 2)
            ctx.fillStyle = '#58a6ff'
            ctx.fill()
            ctx.beginPath()
            ctx.arc(x, y, 2, 0, Math.PI * 2)
            ctx.fillStyle = '#0d1117'
            ctx.fill()
        })
    }

    useEffect(() => {
        drawChart()
        const ro = new ResizeObserver(() => drawChart())
        if (canvasRef.current) ro.observe(canvasRef.current)
        return () => ro.disconnect()
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '280px', display: 'block' }}
            aria-label="Aylık gelir grafiği"
            role="img"
        />
    )
}

export default function Dashboard() {
    const navigate = useNavigate()

    const downloadReport = useCallback(() => {
        const header = 'Sipariş No,Müşteri,Ürün,Tutar,Durum,Tarih\n'
        const rows = recentOrders.map(o =>
            `${o.id},${o.customer},${o.product},${o.amount},${statusMap[o.status].label},${o.date}`
        ).join('\n')
        const bom = '\uFEFF'
        const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Perdemo_Rapor_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }, [])

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Mağazanızın genel durumu — Şubat 2026</p>
                </div>
                <button className="btn btn-primary" onClick={downloadReport}>
                    📥 Rapor İndir
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid-stats" style={{ marginBottom: '28px' }}>
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="stat-card animate-fade-in-up"
                        style={{ animationDelay: `${i * 0.08}s` }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className="stat-icon" style={{ background: stat.color }}>
                                {stat.icon}
                            </div>
                            <span className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                {stat.positive ? '↑' : '↓'} {stat.change}
                            </span>
                        </div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts & Lists */}
            <div className="grid-2" style={{ marginBottom: '28px' }}>
                {/* Revenue Chart */}
                <div className="card">
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Gelir Grafiği</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            2025 yıllık gelir trendi (×1000 ₺)
                        </p>
                    </div>
                    <MiniChart />
                </div>

                {/* Top Products */}
                <div className="card">
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>En Çok Satan Ürünler</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            Bu ayki en popüler ürünler
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {topProducts.map((product, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    transition: 'all var(--transition-fast)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{
                                        width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                                        background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                                    }}>
                                        {i + 1}
                                    </span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{product.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            {product.sales} satış
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{product.revenue}</div>
                                    <span className="stat-change positive" style={{ fontSize: '0.7rem' }}>
                                        ↑ {product.trend}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="card">
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
                }}>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Son Siparişler</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            En güncel sipariş hareketleri
                        </p>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                        onClick={() => navigate('/orders')}>
                        Tümünü Gör →
                    </button>
                </div>
                <div className="table-container">
                    <table className="table" role="table">
                        <thead>
                            <tr>
                                <th scope="col">Sipariş No</th>
                                <th scope="col">Müşteri</th>
                                <th scope="col">Ürün</th>
                                <th scope="col">Tutar</th>
                                <th scope="col">Durum</th>
                                <th scope="col">Tarih</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((order, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }}>{order.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="avatar avatar-sm">
                                                {order.customer.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            {order.customer}
                                        </div>
                                    </td>
                                    <td>{order.product}</td>
                                    <td style={{ fontWeight: 600 }}>{order.amount}</td>
                                    <td>
                                        <span className={`badge ${statusMap[order.status].class}`}>
                                            {statusMap[order.status].label}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{order.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
