import { useState, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { extractDominantColors, getFabricPairingSuggestion, getColorMatchSuggestion } from '../utils/aiProxy'
import useCanHover from '../hooks/useCanHover'

// Catalog names for AI response parsing
const CATALOG_NAMES = ['Kadife Bordo', 'İpek Krem', 'Keten Lacivert', 'Pamuk Gri', 'Blackout Siyah', 'Tül Beyaz', 'Jakar Altın', 'Kadife Zümrüt']

/* ─── Fabric Data ─── */
const fabricPalette = [
    { name: 'Kadife Bordo', color: '#8B1A1A', type: 'kadife', weight: 'Ağır', pairs: ['Tül Beyaz', 'İpek Krem'] },
    { name: 'İpek Krem', color: '#F5E6D3', type: 'ipek', weight: 'Hafif', pairs: ['Kadife Bordo', 'Keten Lacivert'] },
    { name: 'Keten Lacivert', color: '#1B2A4A', type: 'keten', weight: 'Orta', pairs: ['Tül Beyaz', 'İpek Krem'] },
    { name: 'Pamuk Gri', color: '#7A7D82', type: 'pamuk', weight: 'Orta', pairs: ['Blackout Siyah', 'Tül Beyaz'] },
    { name: 'Blackout Siyah', color: '#1A1A2E', type: 'blackout', weight: 'Ağır', pairs: ['İpek Krem', 'Tül Beyaz'] },
    { name: 'Tül Beyaz', color: '#F8F8FF', type: 'tül', weight: 'Çok Hafif', pairs: ['Kadife Bordo', 'Keten Lacivert'] },
    { name: 'Jakar Altın', color: '#B8860B', type: 'jakar', weight: 'Ağır', pairs: ['Blackout Siyah', 'İpek Krem'] },
    { name: 'Kadife Zümrüt', color: '#1B5E3B', type: 'kadife', weight: 'Ağır', pairs: ['İpek Krem', 'Tül Beyaz'] },
]

const s = {
    label: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block', fontWeight: 500 },
    colorDot: (color) => ({
        width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
        background: color, border: '2px solid var(--border-primary)', flexShrink: 0,
    }),
}

/* ─── Room Color Analyzer ─── */
function RoomAnalyzer() {
    const [image, setImage] = useState(null)
    const [colors, setColors] = useState([])
    const [aiSuggestion, setAiSuggestion] = useState(null)
    const [loading, setLoading] = useState(false)
    const canvasRef = useRef(null)

    const handleUpload = useCallback((e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            setImage(ev.target.result)
            setColors([])
            setAiSuggestion(null)
            // Extract colors via off-screen canvas
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const maxSize = 256 // downsample for perf
                const scale = Math.min(maxSize / img.width, maxSize / img.height)
                canvas.width = img.width * scale
                canvas.height = img.height * scale
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const dominant = extractDominantColors(imgData, 6)
                setColors(dominant)
            }
            img.src = ev.target.result
        }
        reader.readAsDataURL(file)
    }, [])

    const handleAISuggest = useCallback(async () => {
        if (colors.length === 0) return
        setLoading(true)
        const result = await getColorMatchSuggestion(colors)
        setAiSuggestion(result || 'AI şu an yanıt veremiyor. Lütfen daha sonra tekrar deneyin.')
        setLoading(false)
    }, [colors])

    // Smart local matching (no AI needed)
    const localMatches = useMemo(() => {
        if (colors.length === 0) return []
        // Find fabrics whose color harmonizes with room colors
        const roomHue = colors[0]?.rgb
        if (!roomHue) return fabricPalette.slice(0, 3)

        return fabricPalette
            .map(f => {
                // Parse fabric color
                const r = parseInt(f.color.slice(1, 3), 16)
                const g = parseInt(f.color.slice(3, 5), 16)
                const b = parseInt(f.color.slice(5, 7), 16)
                // Complementary/analogous scoring
                const diff = Math.abs(r - roomHue.r) + Math.abs(g - roomHue.g) + Math.abs(b - roomHue.b)
                return { ...f, score: diff }
            })
            .sort((a, b) => b.score - a.score) // higher diff = more complementary contrast
            .slice(0, 4)
    }, [colors])

    return (
        <div className="card">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>🏠 Oda Renk Analizi</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
                Oda fotoğrafı yükleyin — duvar rengine göre en uyumlu kumaşları bulalım
            </p>

            {!image ? (
                <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '40px', border: '2px dashed var(--border-primary)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                }}>
                    <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🏠</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Oda fotoğrafı yükleyin</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
                </label>
            ) : (
                <>
                    <img src={image} alt="Room" style={{
                        width: '100%', maxHeight: '250px', objectFit: 'cover',
                        borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)',
                    }} />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Dominant Colors */}
                    {colors.length > 0 && (
                        <div style={{ marginTop: '14px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>Baskın Renkler</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {colors.map((c, i) => (
                                    <div key={i} style={{ textAlign: 'center' }}>
                                        <div style={s.colorDot(c.hex)} />
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{c.hex}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Local Matches */}
                    {localMatches.length > 0 && (
                        <div style={{ marginTop: '14px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>🎯 Önerilen Kumaşlar</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {localMatches.map((f, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '10px 14px', background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                    }}>
                                        <div style={s.colorDot(f.color)} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{f.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{f.type} · {f.weight}</div>
                                        </div>
                                        <div style={{
                                            fontSize: '0.7rem', padding: '4px 8px',
                                            background: 'rgba(88, 166, 255, 0.1)', color: 'var(--accent-blue)',
                                            borderRadius: 'var(--radius-full)', fontWeight: 500,
                                        }}>
                                            Uyumlu
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Suggest Button */}
                    <button className="btn btn-primary" onClick={handleAISuggest}
                        disabled={loading || colors.length === 0}
                        style={{ marginTop: '14px', width: '100%' }}>
                        {loading ? '⏳ AI analiz ediyor...' : '✨ AI Stil Önerisi Al'}
                    </button>

                    {aiSuggestion && (
                        <div className="ai-note" style={{
                            marginTop: '12px', padding: '14px',
                            background: 'rgba(88, 166, 255, 0.06)', border: '1px solid rgba(88, 166, 255, 0.15)',
                            borderRadius: 'var(--radius-md)', fontSize: '0.82rem',
                            lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-line',
                        }}>
                            <div className="ai-text-appear">{aiSuggestion}</div>
                        </div>
                    )}

                    <button className="btn btn-secondary" style={{ marginTop: '8px', fontSize: '0.75rem' }}
                        onClick={() => { setImage(null); setColors([]); setAiSuggestion(null) }}>
                        🔄 Yeni Fotoğraf
                    </button>
                </>
            )}
        </div>
    )
}

/* ─── Fabric Pairing ─── */
function FabricPairing() {
    const navigate = useNavigate()
    const [selected, setSelected] = useState(0)
    const [hovered, setHovered] = useState(null)
    const [aiPairing, setAiPairing] = useState(null)
    const [loading, setLoading] = useState(false)
    const canHover = useCanHover()

    const fabric = fabricPalette[selected]

    const handleAIPairing = useCallback(async () => {
        setLoading(true)
        const result = await getFabricPairingSuggestion(fabric.name, fabric.type)
        setAiPairing(result || 'AI şu an yanıt veremiyor.')
        setLoading(false)
    }, [fabric])

    // Parse AI response for catalog fabric names → combo apply
    const detectedFabrics = useMemo(() => {
        if (!aiPairing) return []
        return CATALOG_NAMES.filter(name => aiPairing.includes(name) && name !== fabric.name)
    }, [aiPairing, fabric.name])

    const handleApplyCombo = useCallback((pairName) => {
        const mainId = fabricPalette.find(f => f.name === fabric.name)?.name || fabric.name
        navigate(`/demo?main=${encodeURIComponent(mainId)}&pair=${encodeURIComponent(pairName)}`)
    }, [fabric.name, navigate])

    return (
        <div className="card">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>🧵 Kumaş Eşleştirme</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
                Kumaşın üzerine gelin detayları görün — tıklayın seçin
            </p>

            {/* Fabric grid with hover tooltip */}
            <div className="grid-4-col" style={{ gap: '8px', marginBottom: '14px' }}>
                {fabricPalette.map((f, i) => (
                    <div key={i} style={{ position: 'relative' }}
                        onMouseEnter={canHover ? () => setHovered(i) : undefined}
                        onMouseLeave={canHover ? () => setHovered(null) : undefined}>
                        <button
                            onClick={() => setSelected(i)}
                            style={{
                                width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-md)',
                                background: f.color,
                                border: selected === i ? '3px solid var(--accent-blue)' : '2px solid var(--border-primary)',
                                cursor: 'pointer', transition: 'all 0.2s',
                                boxShadow: selected === i ? '0 0 12px rgba(88, 166, 255, 0.3)' : 'none',
                                transform: hovered === i ? 'scale(1.08)' : 'scale(1)',
                            }}
                        />
                        {/* Hover Tooltip */}
                        {hovered === i && (
                            <div style={{
                                position: 'absolute', bottom: '110%', left: '50%',
                                transform: 'translateX(-50%)', zIndex: 20,
                                background: 'var(--bg-elevated, #1a1a2e)', color: 'var(--text-primary)',
                                padding: '8px 12px', borderRadius: 'var(--radius-md)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                                border: '1px solid var(--border-primary)',
                                whiteSpace: 'nowrap', pointerEvents: 'none',
                                fontSize: '0.75rem', textAlign: 'center',
                            }}>
                                <div style={{ fontWeight: 700, marginBottom: '2px' }}>{f.name}</div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem' }}>
                                    {f.type} · {f.weight}
                                </div>
                                {/* Tooltip arrow */}
                                <div style={{
                                    position: 'absolute', bottom: '-5px', left: '50%',
                                    transform: 'translateX(-50%) rotate(45deg)',
                                    width: '10px', height: '10px',
                                    background: 'var(--bg-elevated, #1a1a2e)',
                                    borderRight: '1px solid var(--border-primary)',
                                    borderBottom: '1px solid var(--border-primary)',
                                }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Selected fabric info */}
            <div style={{
                padding: '12px 14px', background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)', marginBottom: '12px',
                border: '1px solid rgba(88, 166, 255, 0.15)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ ...s.colorDot(fabric.color), width: '32px', height: '32px' }} />
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{fabric.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                            {fabric.type} · {fabric.weight}
                        </div>
                    </div>
                </div>
            </div>

            {/* Built-in pairs */}
            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>Önerilen Eşler</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                {fabric.pairs.map((pair, i) => {
                    const pairData = fabricPalette.find(f => f.name === pair)
                    return (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '10px 14px', background: 'var(--bg-primary)',
                            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)',
                        }}>
                            <div style={s.colorDot(pairData?.color || '#888')} />
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{pair}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{pairData?.type} · {pairData?.weight}</div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <button className="btn btn-primary" onClick={handleAIPairing} disabled={loading}
                style={{ width: '100%' }}>
                {loading ? '⏳ AI düşünüyor...' : '✨ AI Eşleştirme Önerisi'}
            </button>

            {aiPairing && (
                <div className="ai-note" style={{
                    marginTop: '10px', padding: '14px',
                    background: 'rgba(88, 166, 255, 0.06)', border: '1px solid rgba(88, 166, 255, 0.15)',
                    borderRadius: 'var(--radius-md)', fontSize: '0.82rem',
                    lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-line',
                }}>
                    <div className="ai-text-appear">{aiPairing}</div>

                    {/* Combo Apply Buttons */}
                    {detectedFabrics.length > 0 && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '2px' }}>
                                🚀 Kombinasyonu 3D'de görün:
                            </div>
                            {detectedFabrics.map((pairName) => {
                                const pairData = fabricPalette.find(f => f.name === pairName)
                                return (
                                    <button key={pairName}
                                        onClick={() => handleApplyCombo(pairName)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '8px 14px', borderRadius: 'var(--radius-md)',
                                            background: 'rgba(88, 166, 255, 0.12)',
                                            border: '1px solid rgba(88, 166, 255, 0.25)',
                                            cursor: 'pointer', transition: 'all 0.2s',
                                            color: 'var(--text-primary)', fontFamily: 'var(--font-primary)',
                                        }}
                                        onMouseEnter={canHover ? e => e.currentTarget.style.background = 'rgba(88, 166, 255, 0.2)' : undefined}
                                        onMouseLeave={canHover ? e => e.currentTarget.style.background = 'rgba(88, 166, 255, 0.12)' : undefined}
                                    >
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '6px',
                                            background: pairData?.color || '#888',
                                            border: '1px solid var(--border-primary)', flexShrink: 0,
                                        }} />
                                        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                                            {fabric.name} + {pairName} → 3D Demo
                                        </span>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.85rem' }}>→</span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* ─── Main ─── */
export default function Moodboard() {
    const { t } = useTranslation('moodboard')
    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Moodboard</h1>
                    <p className="page-subtitle">AI destekli kumaş eşleştirme ve stil önerileri</p>
                </div>
            </div>

            <div className="grid-2-col" style={{ gap: '24px', alignItems: 'start' }}>
                <FabricPairing />
                <RoomAnalyzer />
            </div>
        </div>
    )
}
