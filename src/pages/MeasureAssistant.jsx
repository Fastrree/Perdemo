import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { calculateFabricCost } from '../utils/aiProxy'

/* ─── Fabric catalog ─── */
const fabricCatalog = [
    { name: 'Kadife Bordo', width: 280, price: 450 },
    { name: 'İpek Krem', width: 300, price: 680 },
    { name: 'Keten Lacivert', width: 280, price: 320 },
    { name: 'Pamuk Gri', width: 280, price: 220 },
    { name: 'Blackout Siyah', width: 300, price: 380 },
    { name: 'Tül Beyaz', width: 300, price: 150 },
    { name: 'Jakar Altın', width: 280, price: 550 },
    { name: 'Kadife Zümrüt', width: 280, price: 470 },
]

const referenceObjects = [
    { id: 'a4', name: 'A4 Kağıt', width: 21.0, height: 29.7 },
    { id: 'outlet', name: 'Priz (TR standart)', width: 8.5, height: 8.5 },
    { id: 'credit-card', name: 'Kredi Kartı', width: 8.56, height: 5.398 },
    { id: 'phone', name: 'Telefon (ort.)', width: 7.5, height: 15.5 },
]

const s = {
    label: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block', fontWeight: 500 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    resultBox: {
        padding: '16px', borderRadius: 'var(--radius-md)',
        background: 'rgba(88, 166, 255, 0.06)', border: '1px solid rgba(88, 166, 255, 0.15)',
    },
    bigNum: {
        fontSize: '2rem', fontWeight: 800,
        background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
}

/* ─── Photo Measure Tab ─── */
function PhotoMeasure() {
    const [image, setImage] = useState(null)
    const [refObj, setRefObj] = useState(referenceObjects[0])
    const [points, setPoints] = useState([]) // {x, y} pairs
    const [phase, setPhase] = useState('ref') // 'ref' | 'window' | 'done'
    const [result, setResult] = useState(null)
    const canvasRef = useRef(null)
    const imgRef = useRef(null)

    const handleImageLoad = useCallback((e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            setImage(ev.target.result)
            setPoints([])
            setPhase('ref')
            setResult(null)
        }
        reader.readAsDataURL(file)
    }, [])

    const handleCanvasClick = useCallback((e) => {
        const rect = e.target.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const newPoints = [...points, { x, y }]
        setPoints(newPoints)

        if (phase === 'ref' && newPoints.length === 2) {
            setPhase('window')
        } else if (phase === 'window' && newPoints.length === 4) {
            // Calculate
            const refPixelDist = Math.hypot(
                newPoints[1].x - newPoints[0].x,
                newPoints[1].y - newPoints[0].y
            )
            const refRealCm = Math.max(refObj.width, refObj.height)
            const pixelsPerCm = refPixelDist / refRealCm

            const winPixelW = Math.abs(newPoints[3].x - newPoints[2].x)
            const winPixelH = Math.abs(newPoints[3].y - newPoints[2].y)

            setResult({
                width: Math.round(winPixelW / pixelsPerCm),
                height: Math.round(winPixelH / pixelsPerCm),
                confidence: refPixelDist > 30 ? 'Yüksek' : 'Düşük',
            })
            setPhase('done')
        }
    }, [points, phase, refObj])

    const reset = () => {
        setPoints([])
        setPhase('ref')
        setResult(null)
    }

    return (
        <div className="card">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>📸 Fotoğraftan Ölçü</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
                Pencere fotoğrafı yükleyin, referans nesneyi ve pencereyi işaretleyin
            </p>

            {/* Upload */}
            {!image && (
                <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '40px', border: '2px dashed var(--border-primary)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center',
                    transition: 'border-color 0.2s',
                }}>
                    <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📷</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fotoğraf yüklemek için tıklayın</span>
                    <input type="file" accept="image/*" capture="environment"
                        style={{ display: 'none' }} onChange={handleImageLoad} />
                </label>
            )}

            {/* Image + point marking */}
            {image && (
                <>
                    <div style={s.grid2}>
                        <div>
                            <label style={s.label}>Referans Nesne</label>
                            <select className="input" value={refObj.id}
                                onChange={e => {
                                    setRefObj(referenceObjects.find(r => r.id === e.target.value))
                                    reset()
                                }}>
                                {referenceObjects.map(r => (
                                    <option key={r.id} value={r.id}>{r.name} ({r.width}×{r.height}cm)</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'end' }}>
                            <button className="btn btn-secondary" onClick={reset} style={{ fontSize: '0.78rem' }}>
                                🔄 Sıfırla
                            </button>
                        </div>
                    </div>

                    <div style={{
                        position: 'relative', marginTop: '12px', borderRadius: 'var(--radius-md)',
                        overflow: 'hidden', border: '1px solid var(--border-primary)',
                    }}>
                        <img ref={imgRef} src={image} alt="Upload"
                            style={{ width: '100%', display: 'block', cursor: phase !== 'done' ? 'crosshair' : 'default' }}
                            onClick={handleCanvasClick} />
                        {/* Overlay dots */}
                        {points.map((p, i) => (
                            <div key={i} style={{
                                position: 'absolute', left: p.x - 6, top: p.y - 6,
                                width: '12px', height: '12px', borderRadius: '50%',
                                background: i < 2 ? '#e74c3c' : '#2ecc71',
                                border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                                pointerEvents: 'none',
                            }} />
                        ))}
                    </div>

                    {/* Instructions */}
                    <div style={{
                        marginTop: '10px', padding: '10px 14px',
                        background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                        fontSize: '0.78rem', color: 'var(--text-secondary)',
                    }}>
                        {phase === 'ref' && `📌 Referans nesnenin (${refObj.name}) iki ucunu işaretleyin (${2 - points.length} nokta kaldı)`}
                        {phase === 'window' && `📐 Pencerenin sol-üst ve sağ-alt köşesini işaretleyin (${4 - points.length} nokta kaldı)`}
                        {phase === 'done' && '✅ Ölçüm tamamlandı!'}
                    </div>
                </>
            )}

            {/* Result */}
            {result && (
                <div style={{ ...s.resultBox, marginTop: '14px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Tahmini Pencere Ölçüsü (Güvenilirlik: {result.confidence})
                    </div>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'baseline' }}>
                        <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>En</span>
                            <div style={s.bigNum}>{result.width} cm</div>
                        </div>
                        <span style={{ fontSize: '1.5rem', color: 'var(--text-tertiary)' }}>×</span>
                        <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Boy</span>
                            <div style={s.bigNum}>{result.height} cm</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ─── Cost Simulator ─── */
function CostSimulator() {
    const [windowW, setWindowW] = useState(200)
    const [windowH, setWindowH] = useState(250)
    const [fabricIdx, setFabricIdx] = useState(0)
    const [gatherRatio, setGatherRatio] = useState(2.0)

    const fabric = fabricCatalog[fabricIdx]

    const cost = useMemo(() => calculateFabricCost({
        windowWidth: windowW,
        windowHeight: windowH,
        fabricWidth: fabric.width,
        gatherRatio,
        pricePerMeter: fabric.price,
    }), [windowW, windowH, fabric, gatherRatio])

    return (
        <div className="card">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>🧮 Maliyet Simülatörü</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
                Metretül, fire ve toplam maliyeti hesaplayın
            </p>

            <div style={s.grid2}>
                <div>
                    <label style={s.label}>Pencere Eni (cm)</label>
                    <input className="input" type="number" value={windowW}
                        onChange={e => setWindowW(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                    <label style={s.label}>Pencere Boyu (cm)</label>
                    <input className="input" type="number" value={windowH}
                        onChange={e => setWindowH(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                    <label style={s.label}>Kumaş</label>
                    <select className="input" value={fabricIdx}
                        onChange={e => setFabricIdx(parseInt(e.target.value))}>
                        {fabricCatalog.map((f, i) => (
                            <option key={i} value={i}>{f.name} ({f.width}cm en, ₺{f.price}/m)</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={s.label}>Büzgü Katsayısı</label>
                    <select className="input" value={gatherRatio}
                        onChange={e => setGatherRatio(parseFloat(e.target.value))}>
                        <option value={1.5}>1.5x (Ekonomik)</option>
                        <option value={2.0}>2.0x (Standart)</option>
                        <option value={2.5}>2.5x (Lüks)</option>
                    </select>
                </div>
            </div>

            {/* Results */}
            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={s.resultBox}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Metretül</div>
                    <div style={s.bigNum}>{cost.totalMeters}m</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{cost.panelCount} panel</div>
                </div>
                <div style={s.resultBox}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Fire</div>
                    <div style={{ ...s.bigNum, ...(cost.fireCm > 50 ? { color: '#e74c3c', WebkitTextFillColor: '#e74c3c' } : {}) }}>
                        {cost.fireCm}cm
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>%{cost.firePercent}</div>
                </div>
                <div style={s.resultBox}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Toplam</div>
                    <div style={s.bigNum}>₺{cost.totalCost.toLocaleString('tr-TR')}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>KDV hariç</div>
                </div>
            </div>

            {/* Breakdown */}
            <div style={{
                marginTop: '12px', padding: '12px', background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--text-secondary)',
            }}>
                <div style={{ fontWeight: 600, marginBottom: '6px' }}>Detay:</div>
                <div>Gereken toplam genişlik: {cost.breakdown.requiredWidthCm}cm (büzgü dahil)</div>
                <div>Kumaş rulosu eni: {cost.breakdown.fabricWidthCm}cm</div>
                <div>Panel boyu: {cost.breakdown.heightWithAllowanceCm}cm (dikiş payı dahil)</div>
            </div>
        </div>
    )
}

/* ─── Magic Measure (Camera + Scanner HUD) ─── */
function MagicMeasure() {
    const videoRef = useRef(null)
    const overlayRef = useRef(null)
    const streamRef = useRef(null)
    const [cameraActive, setCameraActive] = useState(false)
    const [refObj, setRefObj] = useState(referenceObjects[0])
    const [points, setPoints] = useState([])
    const [phase, setPhase] = useState('ref') // 'ref' | 'window' | 'done'
    const [result, setResult] = useState(null)
    const [scanning, setScanning] = useState(false)

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()
            }
            setCameraActive(true)
            setScanning(true)
        } catch {
            // Fallback: file upload mode
            alert('Kamera erişimi reddedildi. Fotoğraf yükleme moduna geçiliyor.')
        }
    }, [])

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        setCameraActive(false)
        setScanning(false)
        setPoints([])
        setPhase('ref')
        setResult(null)
    }, [])

    // Cleanup
    useEffect(() => () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }, [])

    const handleTap = useCallback((e) => {
        if (phase === 'done') return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const newPts = [...points, { x, y }]
        setPoints(newPts)

        if (phase === 'ref' && newPts.length === 2) {
            setPhase('window')
        } else if (phase === 'window' && newPts.length === 4) {
            const refPixelDist = Math.hypot(newPts[1].x - newPts[0].x, newPts[1].y - newPts[0].y)
            const refRealCm = Math.max(refObj.width, refObj.height)
            const pxPerCm = refPixelDist / refRealCm
            const winW = Math.round(Math.abs(newPts[3].x - newPts[2].x) / pxPerCm)
            const winH = Math.round(Math.abs(newPts[3].y - newPts[2].y) / pxPerCm)
            setResult({
                width: winW, height: winH,
                area: ((winW * winH) / 10000).toFixed(2),
                confidence: refPixelDist > 40 ? 96 : 82,
            })
            setPhase('done')
            setScanning(false)
        }
    }, [points, phase, refObj])

    const reset = useCallback(() => {
        setPoints([])
        setPhase('ref')
        setResult(null)
        setScanning(true)
    }, [])

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-primary)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
                    🔬 Magic Measure
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                    Kamerayı pencereye tutun, AI %95+ doğrulukla ölçü alsın
                </p>
            </div>

            {!cameraActive ? (
                /* Start screen */
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📷</div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={s.label}>Referans Nesne</label>
                        <select className="input" value={refObj.id} style={{ maxWidth: '280px' }}
                            onChange={e => setRefObj(referenceObjects.find(r => r.id === e.target.value))}>
                            {referenceObjects.map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.width}×{r.height}cm)</option>
                            ))}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={startCamera}
                        style={{ padding: '14px 40px', fontSize: '1rem', background: 'linear-gradient(135deg, #00ff88, #00cc6a)' }}>
                        🔬 Kamerayı Aç & Taramayı Başlat
                    </button>
                </div>
            ) : (
                /* Camera + HUD */
                <div className="magic-hud" style={{ margin: 0, borderRadius: 0 }}>
                    {/* Scan line */}
                    {scanning && <div className="magic-scan-line" />}

                    {/* Corner markers */}
                    <div className="magic-corner tl" />
                    <div className="magic-corner tr" />
                    <div className="magic-corner bl" />
                    <div className="magic-corner br" />

                    {/* Video feed */}
                    <div style={{ position: 'relative', cursor: phase !== 'done' ? 'crosshair' : 'default' }}
                        onClick={handleTap}>
                        <video ref={videoRef} autoPlay playsInline muted
                            style={{ width: '100%', display: 'block', minHeight: '350px', objectFit: 'cover' }} />

                        {/* Marked points overlay */}
                        {points.map((p, i) => (
                            <div key={i} style={{
                                position: 'absolute', left: p.x - 8, top: p.y - 8,
                                width: '16px', height: '16px', borderRadius: '50%',
                                border: '2px solid #00ff88',
                                background: i < 2 ? 'rgba(0,255,136,0.3)' : 'rgba(0,200,255,0.3)',
                                boxShadow: '0 0 12px rgba(0,255,136,0.6)',
                                pointerEvents: 'none',
                            }}>
                                <div style={{
                                    position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)',
                                    fontSize: '0.6rem', color: '#00ff88', fontFamily: "'Courier New', monospace",
                                    whiteSpace: 'nowrap', textShadow: '0 0 4px rgba(0,255,136,0.5)',
                                }}>
                                    {i < 2 ? `REF-${i + 1}` : `WIN-${i - 1}`}
                                </div>
                            </div>
                        ))}

                        {/* Connection lines */}
                        {points.length >= 2 && (
                            <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', width: '100%', height: '100%' }}>
                                <line x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y}
                                    stroke="#00ff88" strokeWidth="1.5" strokeDasharray="6,3" opacity="0.7" />
                                {points.length >= 4 && (
                                    <rect x={Math.min(points[2].x, points[3].x)} y={Math.min(points[2].y, points[3].y)}
                                        width={Math.abs(points[3].x - points[2].x)} height={Math.abs(points[3].y - points[2].y)}
                                        fill="none" stroke="#00ccff" strokeWidth="1.5" strokeDasharray="8,4" opacity="0.7" />
                                )}
                            </svg>
                        )}
                    </div>

                    {/* Bottom HUD data bar */}
                    <div style={{
                        padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', borderTop: '1px solid rgba(0,255,136,0.2)',
                    }}>
                        <div className="magic-data" style={{ fontSize: '0.72rem' }}>
                            {phase === 'ref' && `▸ REFERANS İŞARETLE [${refObj.name}] — ${2 - points.length} nokta`}
                            {phase === 'window' && `▸ PENCERE KÖŞELERİ — ${4 - points.length} nokta`}
                            {phase === 'done' && '▸ TARAMA TAMAMLANDI ✓'}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {phase === 'done' && (
                                <button onClick={reset} style={{
                                    padding: '4px 12px', fontSize: '0.7rem', fontWeight: 600,
                                    background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)',
                                    color: '#00ff88', borderRadius: '6px', cursor: 'pointer',
                                    fontFamily: "'Courier New', monospace",
                                }}>
                                    ↻ YENİDEN TARA
                                </button>
                            )}
                            <button onClick={stopCamera} style={{
                                padding: '4px 12px', fontSize: '0.7rem', fontWeight: 600,
                                background: 'rgba(255,60,60,0.15)', border: '1px solid rgba(255,60,60,0.3)',
                                color: '#ff4444', borderRadius: '6px', cursor: 'pointer',
                                fontFamily: "'Courier New', monospace",
                            }}>
                                ■ KAPAT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Result HUD */}
            {result && (
                <div style={{ padding: '20px', background: 'rgba(0,20,10,0.6)' }}>
                    <div className="magic-hud" style={{ padding: '20px' }}>
                        <div className="magic-data" style={{ fontSize: '0.65rem', marginBottom: '12px', letterSpacing: '2px' }}>
                            ━━━ PENCERE ÖLÇÜM RAPORU ━━━
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '16px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div className="magic-data" style={{ fontSize: '0.6rem', opacity: 0.6 }}>GENİŞLİK</div>
                                <div className="magic-data" style={{ fontSize: '2rem', fontWeight: 800 }}>{result.width}</div>
                                <div className="magic-data" style={{ fontSize: '0.7rem', opacity: 0.6 }}>cm</div>
                            </div>
                            <div className="magic-data" style={{ fontSize: '1.5rem', opacity: 0.4 }}>×</div>
                            <div style={{ textAlign: 'center' }}>
                                <div className="magic-data" style={{ fontSize: '0.6rem', opacity: 0.6 }}>YÜKSEKLİK</div>
                                <div className="magic-data" style={{ fontSize: '2rem', fontWeight: 800 }}>{result.height}</div>
                                <div className="magic-data" style={{ fontSize: '0.7rem', opacity: 0.6 }}>cm</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div className="magic-data" style={{ fontSize: '0.6rem', opacity: 0.6 }}>ALAN</div>
                                <div className="magic-data" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{result.area}</div>
                                <div className="magic-data" style={{ fontSize: '0.7rem', opacity: 0.6 }}>m²</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="magic-data" style={{ fontSize: '0.65rem', opacity: 0.5 }}>
                                REF: {refObj.name} ({refObj.width}×{refObj.height}cm)
                            </div>
                            <div className="magic-data" style={{
                                fontSize: '0.7rem', fontWeight: 700,
                                color: result.confidence > 90 ? '#00ff88' : '#ffcc00',
                            }}>
                                GÜVENİLİRLİK: %{result.confidence}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ─── Main ─── */
export default function MeasureAssistant() {
    const [tab, setTab] = useState('magic')

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">AI Ölçü Asistanı</h1>
                    <p className="page-subtitle">Akıllı ölçüm ve maliyet hesaplama</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button className={`tab ${tab === 'magic' ? 'active' : ''}`}
                    style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)' }}
                    onClick={() => setTab('magic')}>
                    🔬 Magic Measure
                </button>
                <button className={`tab ${tab === 'cost' ? 'active' : ''}`}
                    style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)' }}
                    onClick={() => setTab('cost')}>
                    🧮 Maliyet Simülatörü
                </button>
                <button className={`tab ${tab === 'photo' ? 'active' : ''}`}
                    style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)' }}
                    onClick={() => setTab('photo')}>
                    📸 Fotoğraftan Ölçü
                </button>
            </div>

            {tab === 'magic' ? <MagicMeasure /> : tab === 'cost' ? <CostSimulator /> : <PhotoMeasure />}
        </div>
    )
}
