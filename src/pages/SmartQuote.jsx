import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getDesignerNote } from '../utils/aiProxy'
import { useCurrency } from '../hooks/useCurrency'

/* ─── Mock Data ─── */
const fabricPrices = {
    'Kadife Bordo': { pricePerMeter: 450, width: 280 },
    'İpek Krem': { pricePerMeter: 680, width: 300 },
    'Keten Lacivert': { pricePerMeter: 320, width: 280 },
    'Pamuk Gri': { pricePerMeter: 220, width: 280 },
    'Blackout Siyah': { pricePerMeter: 380, width: 300 },
    'Tül Beyaz': { pricePerMeter: 150, width: 300 },
    'Jakar Altın': { pricePerMeter: 550, width: 280 },
    'Kadife Zümrüt': { pricePerMeter: 470, width: 280 },
}

/* Fabric insulation properties for sustainability calculations */
const fabricInsulation = {
    'Kadife Bordo': { rValue: 0.42, solarBlock: 0.85, weight: 'heavy' },
    'İpek Krem': { rValue: 0.18, solarBlock: 0.35, weight: 'light' },
    'Keten Lacivert': { rValue: 0.28, solarBlock: 0.60, weight: 'medium' },
    'Pamuk Gri': { rValue: 0.22, solarBlock: 0.50, weight: 'medium' },
    'Blackout Siyah': { rValue: 0.55, solarBlock: 0.98, weight: 'heavy' },
    'Tül Beyaz': { rValue: 0.05, solarBlock: 0.10, weight: 'light' },
    'Jakar Altın': { rValue: 0.38, solarBlock: 0.72, weight: 'heavy' },
    'Kadife Zümrüt': { rValue: 0.44, solarBlock: 0.87, weight: 'heavy' },
}

const styles = {
    grid2: 'grid-2-col',
    label: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block', fontWeight: 500 },
    total: {
        fontSize: '1.8rem', fontWeight: 800,
        background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px',
    },
    sigPad: {
        border: '2px dashed var(--border-primary)', borderRadius: 'var(--radius-md)',
        cursor: 'crosshair', background: 'var(--bg-primary)', touchAction: 'none',
    },
    confirmBtn: {
        width: '100%', padding: '18px', fontSize: '1.1rem', fontWeight: 800,
        background: 'var(--gradient-brand)', color: '#fff', border: 'none',
        borderRadius: 'var(--radius-lg)', cursor: 'pointer', letterSpacing: '1px',
        boxShadow: '0 6px 30px rgba(88, 166, 255, 0.35)',
        transition: 'all 0.3s ease', textTransform: 'uppercase',
    },
}

/* ─── Premium Signature Pad Component ─── */
function SignaturePad({ signatureRef }) {
    const canvasRef = useRef(null)
    const isDrawing = useRef(false)
    const lastPoint = useRef(null)
    const lastTime = useRef(0)
    const strokes = useRef([]) // full history for undo
    const currentStroke = useRef([]) // current stroke points
    const [strokeCount, setStrokeCount] = useState(0)
    const [mode, setMode] = useState('draw') // draw | type
    const [typedName, setTypedName] = useState('')
    const [inkColor, setInkColor] = useState('#c8d6e5')
    const [isEmpty, setIsEmpty] = useState(true)

    const INK_COLORS = [
        { color: '#c8d6e5', label: 'Gümüş' },
        { color: '#58a6ff', label: 'Mavi' },
        { color: '#2ecc71', label: 'Yeşil' },
    ]

    const drawGuideLine = (ctx, w, h) => {
        const y = h * 0.72
        ctx.save()
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'
        ctx.lineWidth = 1
        ctx.setLineDash([6, 4])
        ctx.beginPath()
        ctx.moveTo(20, y)
        ctx.lineTo(w - 20, y)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(255,255,255,0.08)'
        ctx.font = 'italic 14px Georgia, serif'
        ctx.fillText('✗', 12, y - 4)
        ctx.restore()
    }

    // Initialize high-DPI canvas
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)
        drawGuideLine(ctx, rect.width, rect.height)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const redrawAll = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        ctx.clearRect(0, 0, rect.width, rect.height)
        drawGuideLine(ctx, rect.width, rect.height)

        // Replay all strokes
        strokes.current.forEach(stroke => {
            if (stroke.length < 2) return
            ctx.strokeStyle = stroke[0].color
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            for (let i = 1; i < stroke.length; i++) {
                ctx.beginPath()
                ctx.moveTo(stroke[i - 1].x, stroke[i - 1].y)
                ctx.lineTo(stroke[i].x, stroke[i].y)
                ctx.lineWidth = stroke[i].width
                ctx.stroke()
            }
        })
    }, [])

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        const touch = e.touches?.[0]
        return {
            x: (touch?.clientX || e.clientX) - rect.left,
            y: (touch?.clientY || e.clientY) - rect.top,
        }
    }

    const start = (e) => {
        e.preventDefault()
        isDrawing.current = true
        const pos = getPos(e)
        lastPoint.current = pos
        lastTime.current = Date.now()
        currentStroke.current = [{ ...pos, width: 2, color: inkColor }]
        const ctx = canvasRef.current.getContext('2d')
        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
    }

    const draw = (e) => {
        if (!isDrawing.current) return
        e.preventDefault()
        const pos = getPos(e)
        const now = Date.now()
        const dt = now - lastTime.current || 1
        const dx = pos.x - lastPoint.current.x
        const dy = pos.y - lastPoint.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const velocity = dist / dt // px/ms

        const minW = 1.0
        const maxW = 4.5
        const targetW = Math.max(minW, maxW - velocity * 3)
        const prevW = currentStroke.current.length > 0 ? currentStroke.current[currentStroke.current.length - 1].width : 2
        const smoothW = prevW + (targetW - prevW) * 0.4

        const ctx = canvasRef.current.getContext('2d')
        ctx.strokeStyle = inkColor
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = smoothW
        ctx.beginPath()
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()

        currentStroke.current.push({ ...pos, width: smoothW, color: inkColor })
        lastPoint.current = pos
        lastTime.current = now
    }

    const end = () => {
        if (!isDrawing.current) return
        isDrawing.current = false
        if (currentStroke.current.length > 1) {
            strokes.current.push([...currentStroke.current])
            setStrokeCount(strokes.current.length)
            setIsEmpty(false)
        }
        currentStroke.current = []
        if (signatureRef) signatureRef.current = canvasRef.current.toDataURL()
    }

    // Register touch events with { passive: false } to allow preventDefault
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.addEventListener('touchstart', start, { passive: false })
        canvas.addEventListener('touchmove', draw, { passive: false })
        canvas.addEventListener('touchend', end, { passive: false })
        return () => {
            canvas.removeEventListener('touchstart', start)
            canvas.removeEventListener('touchmove', draw)
            canvas.removeEventListener('touchend', end)
        }
    }) // eslint-disable-line react-hooks/exhaustive-deps

    const undo = useCallback(() => {
        if (strokes.current.length === 0) return
        strokes.current.pop()
        setStrokeCount(strokes.current.length)
        redrawAll()
        if (strokes.current.length === 0) {
            setIsEmpty(true)
            if (signatureRef) signatureRef.current = null
        } else {
            if (signatureRef) signatureRef.current = canvasRef.current.toDataURL()
        }
    }, [redrawAll])

    const clear = useCallback(() => {
        strokes.current = []
        currentStroke.current = []
        setStrokeCount(0)
        setIsEmpty(true)
        setTypedName('')
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const rect = canvas.getBoundingClientRect()
        ctx.clearRect(0, 0, rect.width, rect.height)
        drawGuideLine(ctx, rect.width, rect.height)
        if (signatureRef) signatureRef.current = null
    }, [])

    // Keyboard undo: Ctrl+Z
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault()
                undo()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [undo])

    // Typed signature mode
    const handleTypedSignature = useCallback((name) => {
        setTypedName(name)
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        ctx.clearRect(0, 0, rect.width, rect.height)
        drawGuideLine(ctx, rect.width, rect.height)
        if (name.trim()) {
            ctx.save()
            ctx.fillStyle = inkColor
            ctx.font = 'italic 28px Georgia, "Times New Roman", serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(name, rect.width / 2, rect.height * 0.55)
            ctx.restore()
            setIsEmpty(false)
            if (signatureRef) signatureRef.current = canvas.toDataURL()
        } else {
            setIsEmpty(true)
            if (signatureRef) signatureRef.current = null
        }
    }, [inkColor])

    const hasSignature = mode === 'draw' ? !isEmpty : typedName.trim().length > 0

    return (
        <div>
            {/* Mode Tabs + Color Picker */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button className={`btn ${mode === 'draw' ? 'btn-secondary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.72rem', padding: '5px 12px' }}
                        onClick={() => { setMode('draw'); clear() }}>
                        ✏️ Çiz
                    </button>
                    <button className={`btn ${mode === 'type' ? 'btn-secondary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.72rem', padding: '5px 12px' }}
                        onClick={() => { setMode('type'); clear() }}>
                        ⌨️ Yaz
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Mürekkep:</span>
                    {INK_COLORS.map(c => (
                        <button key={c.color} onClick={() => setInkColor(c.color)}
                            title={c.label}
                            style={{
                                width: '18px', height: '18px', borderRadius: '50%',
                                background: c.color, border: inkColor === c.color
                                    ? '2px solid var(--accent-blue)'
                                    : '1px solid var(--border-primary)',
                                cursor: 'pointer', padding: 0, transition: 'all 0.15s',
                                boxShadow: inkColor === c.color ? `0 0 8px ${c.color}44` : 'none',
                            }} />
                    ))}
                </div>
            </div>

            {/* Canvas */}
            {mode === 'draw' ? (
                <canvas ref={canvasRef}
                    width={400} height={140}
                    style={{
                        ...styles.sigPad, width: '100%', height: '140px',
                        borderColor: hasSignature ? 'rgba(46, 204, 113, 0.3)' : undefined,
                        boxShadow: hasSignature ? '0 0 12px rgba(46, 204, 113, 0.08)' : 'none',
                        transition: 'border-color 0.3s, box-shadow 0.3s',
                    }}
                    onMouseDown={start} onMouseMove={draw} onMouseUp={end} onMouseLeave={end}
                />
            ) : (
                <div style={{
                    ...styles.sigPad, height: '140px', display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderColor: hasSignature ? 'rgba(46, 204, 113, 0.3)' : undefined,
                    transition: 'border-color 0.3s',
                }}>
                    <input type="text" value={typedName}
                        onChange={e => handleTypedSignature(e.target.value)}
                        placeholder="Adınızı yazın..."
                        style={{
                            background: 'transparent', border: 'none', textAlign: 'center',
                            fontSize: '1.4rem', fontFamily: 'Georgia, "Times New Roman", serif',
                            fontStyle: 'italic', color: inkColor, width: '90%', outline: 'none',
                        }} />
                    {typedName && (
                        <div style={{ marginTop: '6px', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                            Yazılan imza: "{typedName}"
                        </div>
                    )}
                </div>
            )}

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
                {mode === 'draw' && (
                    <button onClick={undo} className="btn btn-ghost"
                        style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                        disabled={strokeCount === 0}
                        title="Geri Al (Ctrl+Z)">
                        ↩ Geri Al
                    </button>
                )}
                <button onClick={clear} className="btn btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
                    🗑️ Temizle
                </button>
                <div style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                    {mode === 'draw' ? (
                        strokeCount > 0
                            ? <span style={{ color: 'var(--accent-green)' }}>✓ {strokeCount} çizim</span>
                            : 'Parmağınız veya fare ile imza atın'
                    ) : (
                        hasSignature
                            ? <span style={{ color: 'var(--accent-green)' }}>✓ İmza girildi</span>
                            : 'Adınızı klavyeyle yazın'
                    )}
                </div>
            </div>
        </div>
    )
}


/* ─── Sustainability Score ─── */
function SustainabilityScore({ fabric, widthCm, heightCm }) {
    const { formatMoney } = useCurrency()
    const score = useMemo(() => {
        const ins = fabricInsulation[fabric] || { rValue: 0.2, solarBlock: 0.5, weight: 'medium' }
        const areM2 = (widthCm * heightCm) / 10000
        // Istanbul avg cooling cost: ~8500 ₺/year for 20m² office
        // Each m² of window with good curtain saves proportional energy
        const baseCoolingCost = 8500 // ₺/year reference for 20m² room
        const windowRatio = Math.min(areM2 / 4, 1) // max 4m² window effect scale
        const savingsPercent = Math.round(ins.solarBlock * 28 * (0.6 + ins.rValue) * 100) / 100
        const cappedSavings = Math.min(savingsPercent, 35) // cap at 35%
        const annualSavings = Math.round(baseCoolingCost * windowRatio * (cappedSavings / 100))
        // CO₂: Turkey grid avg ~0.48 kg CO₂/kWh, avg AC = 3.5 COP
        const kWhSaved = Math.round(annualSavings / 3.2 * 2.8) // ₺ → kWh approximation
        const co2Kg = Math.round(kWhSaved * 0.48)
        // Grade
        let grade = 'D', gradeColor = '#e74c3c'
        if (cappedSavings >= 20) { grade = 'A'; gradeColor = '#2ecc71' }
        else if (cappedSavings >= 12) { grade = 'B'; gradeColor = '#27ae60' }
        else if (cappedSavings >= 6) { grade = 'C'; gradeColor = '#f39c12' }

        return { savingsPercent: cappedSavings, annualSavings, co2Kg, grade, gradeColor, areM2: areM2.toFixed(1) }
    }, [fabric, widthCm, heightCm])

    return (
        <div className="sustainability-card" style={{ marginTop: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.1rem' }}>🌿</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2ecc71', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Sürdürülebilirlik Raporu
                </span>
                <div style={{
                    marginLeft: 'auto', padding: '2px 10px', borderRadius: 'var(--radius-full)',
                    background: score.gradeColor, color: '#fff', fontWeight: 800, fontSize: '0.8rem',
                }}>
                    {score.grade}
                </div>
            </div>

            <div className="grid-3-col" style={{ gap: '10px', marginBottom: '12px' }}>
                <div style={{
                    padding: '10px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(46, 204, 113, 0.08)', textAlign: 'center',
                }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Klima Tasarrufu</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2ecc71' }}>%{score.savingsPercent}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>yıllık</div>
                </div>
                <div style={{
                    padding: '10px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(46, 204, 113, 0.08)', textAlign: 'center',
                }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Yıllık Tasarruf</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#27ae60' }}>{formatMoney(score.annualSavings)}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>tahmini</div>
                </div>
                <div style={{
                    padding: '10px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(46, 204, 113, 0.08)', textAlign: 'center',
                }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>CO₂ Azaltma</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#16a085' }}>{score.co2Kg} kg</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>yılda</div>
                </div>
            </div>

            <div style={{
                padding: '10px 12px', borderRadius: 'var(--radius-md)',
                background: 'rgba(46, 204, 113, 0.06)', fontSize: '0.73rem',
                color: 'var(--text-secondary)', lineHeight: 1.5,
                borderLeft: `3px solid ${score.gradeColor}`,
            }}>
                💡 Bu perde seçimi ile yıllık klima maliyetinizde <strong style={{ color: '#2ecc71' }}>%{score.savingsPercent} tasarruf</strong> öngörülmektedir.
                Pencere alanı ({score.areM2} m²) ve kumaşın ısı yalıtım değerine göre hesaplanmıştır.
            </div>
        </div>
    )
}

/* ─── Main Component ─── */
export default function SmartQuote() {
    const { t } = useTranslation('quote')
    const { symbol, formatMoney } = useCurrency()
    const [form, setForm] = useState({
        customerName: '', customerPhone: '', customerAddress: '',
        fabric: 'Kadife Bordo', width: 200, height: 250,
        style: 'Büzgülü', gatherRatio: 2.0, mounting: 'included',
        notes: '',
    })
    const [confirmed, setConfirmed] = useState(false)
    const signatureRef = useRef(null)

    const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

    const fabricData = fabricPrices[form.fabric] || { pricePerMeter: 300, width: 280 }
    const requiredWidth = (form.width + 10) * form.gatherRatio
    const panelCount = Math.ceil(requiredWidth / fabricData.width)
    const panelHeight = (form.height + 30) / 100
    const totalMeters = Math.round(panelCount * panelHeight * 100) / 100
    const fabricCost = Math.round(totalMeters * fabricData.pricePerMeter)
    const mountingCost = form.mounting === 'included' ? 350 : 0
    const subtotal = fabricCost + mountingCost
    const kdv = Math.round(subtotal * 0.20)
    const total = subtotal + kdv

    const handleConfirm = useCallback(() => {
        if (!form.customerName.trim()) return alert('Müşteri adı gerekli')
        if (!signatureRef.current) return alert('Lütfen dijital imzanızı atın')
        setConfirmed(true)
    }, [form.customerName])

    const handleShare = useCallback(() => {
        const text = `🪟 *Perdemo Teklif*\n\nMüşteri: ${form.customerName}\nKumaş: ${form.fabric}\nÖlçü: ${form.width}×${form.height}cm\nMetretül: ${totalMeters}m\nToplam: ${formatMoney(total)}\n\n🔗 Detaylı teklifi görüntüleyin: ${window.location.origin}/quote`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }, [form, totalMeters, total])

    // AI Tasarımcı Notu — debounced
    const [designerNote, setDesignerNote] = useState(null)
    const [noteLoading, setNoteLoading] = useState(false)
    const noteTimer = useRef(null)

    useEffect(() => {
        clearTimeout(noteTimer.current)
        if (form.width < 50 || form.height < 50) return
        setNoteLoading(true)
        noteTimer.current = setTimeout(async () => {
            const note = await getDesignerNote(form.fabric, form.width, form.height, form.style)
            setDesignerNote(note)
            setNoteLoading(false)
        }, 3000)
        return () => clearTimeout(noteTimer.current)
    }, [form.fabric, form.width, form.height, form.style])

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Smart Quote</h1>
                    <p className="page-subtitle">Dijital teklif oluşturun, paylaşın ve onaylatın</p>
                </div>
                <button className="btn btn-primary" onClick={handleShare} style={{ background: '#25D366' }}>
                    📱 WhatsApp'ta Paylaş
                </button>
            </div>

            <div className="grid-sidebar-layout" style={{ gap: '24px' }}>
                {/* ─── Form ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Customer Info */}
                    <div className="card">
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>Müşteri Bilgileri</h3>
                        <div className={styles.grid2}>
                            <div>
                                <label style={styles.label}>Ad Soyad *</label>
                                <input className="input" value={form.customerName}
                                    onChange={e => update('customerName', e.target.value)}
                                    placeholder="Müşteri adı" />
                            </div>
                            <div>
                                <label style={styles.label}>Telefon</label>
                                <input className="input" value={form.customerPhone}
                                    onChange={e => update('customerPhone', e.target.value)}
                                    placeholder="0532 xxx xxxx" />
                            </div>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <label style={styles.label}>Adres</label>
                            <input className="input" value={form.customerAddress}
                                onChange={e => update('customerAddress', e.target.value)}
                                placeholder="Teslimat adresi" />
                        </div>
                    </div>

                    {/* Product Config */}
                    <div className="card">
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>Ürün Konfigürasyonu</h3>
                        <div className={styles.grid2}>
                            <div>
                                <label style={styles.label}>Kumaş</label>
                                <select className="input" value={form.fabric}
                                    onChange={e => update('fabric', e.target.value)}>
                                    {Object.keys(fabricPrices).map(f => (
                                        <option key={f} value={f}>{f} — {symbol}{fabricPrices[f].pricePerMeter}/m</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={styles.label}>Dikim Stili</label>
                                <select className="input" value={form.style}
                                    onChange={e => update('style', e.target.value)}>
                                    <option>Büzgülü</option>
                                    <option>Halkalı</option>
                                    <option>Kulaklı</option>
                                </select>
                            </div>
                            <div>
                                <label style={styles.label}>Pencere Eni (cm)</label>
                                <input className="input" type="number" value={form.width}
                                    onChange={e => update('width', parseInt(e.target.value) || 0)} />
                            </div>
                            <div>
                                <label style={styles.label}>Pencere Boyu (cm)</label>
                                <input className="input" type="number" value={form.height}
                                    onChange={e => update('height', parseInt(e.target.value) || 0)} />
                            </div>
                            <div>
                                <label style={styles.label}>Büzgü Katsayısı</label>
                                <select className="input" value={form.gatherRatio}
                                    onChange={e => update('gatherRatio', parseFloat(e.target.value))}>
                                    <option value={1.5}>1.5x (Ekonomik)</option>
                                    <option value={2.0}>2.0x (Standart)</option>
                                    <option value={2.5}>2.5x (Lüks)</option>
                                </select>
                            </div>
                            <div>
                                <label style={styles.label}>Montaj</label>
                                <select className="input" value={form.mounting}
                                    onChange={e => update('mounting', e.target.value)}>
                                    <option value="included">Dahil (+{symbol}350)</option>
                                    <option value="excluded">Hariç</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <label style={styles.label}>Notlar</label>
                            <textarea className="input" value={form.notes} rows={2}
                                style={{ resize: 'vertical' }}
                                onChange={e => update('notes', e.target.value)}
                                placeholder="Özel talimatlar..." />
                        </div>
                    </div>

                    {/* Digital Signature */}
                    <div className="card">
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>Dijital İmza</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                            Siparişi onaylamak için aşağıya imzanızı atın
                        </p>
                        <SignaturePad signatureRef={signatureRef} />
                    </div>
                </div>

                {/* ─── Summary Card ─── */}
                <div style={{ position: 'sticky', top: '100px' }}>
                    <div className="card" style={{ border: '1px solid rgba(88, 166, 255, 0.2)' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px' }}>Teklif Özeti</h3>

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Kumaş: {form.fabric}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Ölçü:</span>
                                <span>{form.width} × {form.height} cm</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Panel Sayısı:</span>
                                <span>{panelCount}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Metretül:</span>
                                <span>{totalMeters} m</span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-primary)', margin: '4px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Kumaş:</span>
                                <span>{formatMoney(fabricCost)}</span>
                            </div>
                            {mountingCost > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Montaj:</span>
                                    <span>{symbol}{mountingCost}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>KDV (%20):</span>
                                <span>{formatMoney(kdv)}</span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-primary)', margin: '4px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Toplam:</span>
                                <span style={styles.total}>{formatMoney(total)}</span>
                            </div>
                        </div>

                        <button
                            style={{
                                ...styles.confirmBtn, marginTop: '20px',
                                opacity: confirmed ? 0.6 : 1,
                            }}
                            onClick={handleConfirm}
                            disabled={confirmed}
                        >
                            {confirmed ? '✅ SİPARİŞ ONAYLANDI' : '🔒 SİPARİŞİ ONAYLA'}
                        </button>

                        {/* AI Tasarımcı Notu */}
                        <div className="ai-note" style={{
                            marginTop: '16px', padding: '14px',
                            background: 'rgba(88, 166, 255, 0.05)',
                            border: '1px solid rgba(88, 166, 255, 0.15)',
                            borderRadius: 'var(--radius-md)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <span className="ai-sparkle" style={{ fontSize: '0.85rem' }}>✨</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Perdemo AI Tasarım Asistanı Notu
                                </span>
                            </div>
                            <div style={{
                                fontSize: '0.78rem', color: 'var(--text-secondary)',
                                lineHeight: 1.6, fontStyle: 'italic',
                                minHeight: '40px',
                            }}>
                                {noteLoading ? (
                                    <span style={{ color: 'var(--text-tertiary)' }}>
                                        <span className="ai-sparkle">✨</span> Tasarımcı notu hazırlanıyor...
                                    </span>
                                ) : designerNote ? (
                                    <span className="ai-text-appear">{designerNote}</span>
                                ) : (
                                    <span style={{ color: 'var(--text-tertiary)' }}>
                                        Seçtiğiniz kombinasyon, mekanınızın doğal ışık alış açısına göre maksimum ferahlık sağlamak üzere optimize edilmiştir.
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 🌿 Sustainability Score */}
                        <SustainabilityScore fabric={form.fabric} widthCm={form.width} heightCm={form.height} />

                        {confirmed && (
                            <div style={{
                                marginTop: '12px', padding: '10px', textAlign: 'center',
                                background: 'rgba(46, 204, 113, 0.1)', borderRadius: 'var(--radius-md)',
                                fontSize: '0.78rem', color: 'var(--accent-green)',
                            }}>
                                ✅ Sipariş {new Date().toLocaleString('tr-TR')} tarihinde onaylandı
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
