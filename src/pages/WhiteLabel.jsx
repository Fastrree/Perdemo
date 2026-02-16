import { useState, useMemo, useCallback, memo, startTransition } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import useCanHover from '../hooks/useCanHover'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

/* ═══════════════════════════════════════════════════
   MOCK DATA — Dealers & Performance
   ═══════════════════════════════════════════════════ */
const dealers = [
    { id: 1, name: 'Perdemo Istanbul Kadikoy', city: 'Istanbul', region: 'Marmara', contact: 'Ali Yilmaz', phone: '0532 100 2000', email: 'kadikoy@perdemo.com', monthlyRevenue: 68400, orders: 42, demos: 128, topProduct: 'Kadife Bordo', satisfaction: 4.7, markup: 0, status: 'active', lat: 40.99, lng: 29.02 },
    { id: 2, name: 'Perdemo Istanbul Beylikduzu', city: 'Istanbul', region: 'Marmara', contact: 'Seda Kara', phone: '0533 200 3000', email: 'beylikduzu@perdemo.com', monthlyRevenue: 52100, orders: 35, demos: 95, topProduct: 'Tul Beyaz', satisfaction: 4.5, markup: 5, status: 'active', lat: 41.0, lng: 28.64 },
    { id: 3, name: 'Perdemo Istanbul Atasehir', city: 'Istanbul', region: 'Marmara', contact: 'Emre Demir', phone: '0534 300 4000', email: 'atasehir@perdemo.com', monthlyRevenue: 45800, orders: 28, demos: 82, topProduct: 'Blackout Siyah', satisfaction: 4.3, markup: 0, status: 'active', lat: 40.98, lng: 29.12 },
    { id: 4, name: 'Perdemo Ankara Cankaya', city: 'Ankara', region: 'Ic Anadolu', contact: 'Burak Oz', phone: '0535 400 5000', email: 'cankaya@perdemo.com', monthlyRevenue: 38200, orders: 24, demos: 67, topProduct: 'Kadife Bordo', satisfaction: 4.6, markup: 8, status: 'active', lat: 39.92, lng: 32.86 },
    { id: 5, name: 'Perdemo Ankara Kecioren', city: 'Ankara', region: 'Ic Anadolu', contact: 'Yeliz Ak', phone: '0536 500 6000', email: 'kecioren@perdemo.com', monthlyRevenue: 22500, orders: 15, demos: 43, topProduct: 'Pamuk Gri', satisfaction: 4.1, markup: 10, status: 'active', lat: 39.98, lng: 32.84 },
    { id: 6, name: 'Perdemo Izmir Bornova', city: 'Izmir', region: 'Ege', contact: 'Can Arslan', phone: '0537 600 7000', email: 'bornova@perdemo.com', monthlyRevenue: 41600, orders: 27, demos: 74, topProduct: 'Keten Lacivert', satisfaction: 4.4, markup: 5, status: 'active', lat: 38.47, lng: 27.22 },
    { id: 7, name: 'Perdemo Izmir Karsiyaka', city: 'Izmir', region: 'Ege', contact: 'Deniz Sen', phone: '0538 700 8000', email: 'karsiyaka@perdemo.com', monthlyRevenue: 29400, orders: 19, demos: 55, topProduct: 'Ipek Krem', satisfaction: 4.2, markup: 8, status: 'active', lat: 38.46, lng: 27.11 },
    { id: 8, name: 'Perdemo Bursa Nilufer', city: 'Bursa', region: 'Marmara', contact: 'Fatma Celik', phone: '0539 800 9000', email: 'nilufer@perdemo.com', monthlyRevenue: 25800, orders: 17, demos: 48, topProduct: 'Jakar Altin', satisfaction: 4.0, markup: 12, status: 'active', lat: 40.22, lng: 28.97 },
    { id: 9, name: 'Perdemo Antalya Muratpasa', city: 'Antalya', region: 'Akdeniz', contact: 'Zeynep Kaya', phone: '0530 900 1000', email: 'muratpasa@perdemo.com', monthlyRevenue: 34200, orders: 22, demos: 61, topProduct: 'Tul Beyaz', satisfaction: 4.5, markup: 5, status: 'active', lat: 36.89, lng: 30.71 },
    { id: 10, name: 'Perdemo Adana Seyhan', city: 'Adana', region: 'Akdeniz', contact: 'Murat Yildiz', phone: '0531 010 2000', email: 'seyhan@perdemo.com', monthlyRevenue: 18900, orders: 12, demos: 35, topProduct: 'Blackout Siyah', satisfaction: 3.9, markup: 15, status: 'warning', lat: 37.0, lng: 35.32 },
    { id: 11, name: 'Perdemo Konya Selcuklu', city: 'Konya', region: 'Ic Anadolu', contact: 'Hasan Tas', phone: '0532 020 3000', email: 'selcuklu@perdemo.com', monthlyRevenue: 15200, orders: 10, demos: 28, topProduct: 'Kadife Bordo', satisfaction: 4.0, markup: 10, status: 'active', lat: 37.87, lng: 32.48 },
    { id: 12, name: 'Perdemo Trabzon Ortahisar', city: 'Trabzon', region: 'Karadeniz', contact: 'Ayse Polat', phone: '0533 030 4000', email: 'ortahisar@perdemo.com', monthlyRevenue: 12800, orders: 8, demos: 22, topProduct: 'Kadife Zumrut', satisfaction: 4.1, markup: 12, status: 'new', lat: 41.0, lng: 39.72 },
]

const regions = ['Tumu', 'Marmara', 'Ic Anadolu', 'Ege', 'Akdeniz', 'Karadeniz']
const cityCount = new Set(dealers.map(d => d.city)).size

const statusConfig = {
    active: { label: 'Aktif', cls: 'badge-success', icon: '🟢', color: '#2ecc71', bg: 'rgba(46,204,113,0.1)' },
    warning: { label: 'Uyari', cls: 'badge-warning', icon: '🟡', color: '#f0b429', bg: 'rgba(240,180,41,0.1)' },
    new: { label: 'Yeni', cls: 'badge-info', icon: '🔵', color: '#58a6ff', bg: 'rgba(88,166,255,0.1)' },
}

/* ═══════════════════════════════════════════════════
   TURKEY MAP (Google Maps API)
   ═══════════════════════════════════════════════════ */
const TURKEY_CENTER = { lat: 39.0, lng: 35.0 }
const MAP_CONTAINER_STYLE = { width: '100%', height: '400px', borderRadius: 'var(--radius-lg)' }

const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
    { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#023e58' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
    { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
    { featureType: 'transit', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
    { featureType: 'transit.line', elementType: 'geometry.fill', stylers: [{ color: '#283d6a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
]

const TurkeyMap = memo(function TurkeyMap({ dealers: dealerList, onSelect, selectedId }) {
    const [infoDealer, setInfoDealer] = useState(null)

    const markerData = useMemo(() => {
        const maxRevenue = Math.max(...dealerList.map(d => d.monthlyRevenue))
        return dealerList.map(d => {
            const scale = 0.8 + (d.monthlyRevenue / maxRevenue) * 0.7
            const cfg = statusConfig[d.status]
            return { dealer: d, scale, color: cfg.color }
        })
    }, [dealerList])

    const handleMarkerClick = useCallback((dealer) => {
        setInfoDealer(dealer)
        onSelect(dealer)
    }, [onSelect])

    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <div style={{
                width: '100%', height: '400px', borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--border-primary)', flexDirection: 'column', gap: '12px',
            }}>
                <span style={{ fontSize: '2rem' }}>🗺️</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Google Maps API Key gerekli
                </span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                    .env dosyasina VITE_GOOGLE_MAPS_API_KEY ekleyin
                </span>
            </div>
        )
    }

    return (
        <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
            <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                    mapContainerStyle={MAP_CONTAINER_STYLE}
                    center={TURKEY_CENTER}
                    zoom={6}
                    options={{
                        styles: darkMapStyle,
                        disableDefaultUI: false,
                        zoomControl: true,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: true,
                    }}
                >
                    {markerData.map(({ dealer: d, scale, color }) => (
                        <Marker
                            key={d.id}
                            position={{ lat: d.lat, lng: d.lng }}
                            onClick={() => handleMarkerClick(d)}
                            icon={{
                                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                                fillColor: color,
                                fillOpacity: 1,
                                strokeColor: '#fff',
                                strokeWeight: 1,
                                scale: scale,
                                anchor: { x: 12, y: 22 },
                            }}
                        />
                    ))}

                    {infoDealer && (
                        <InfoWindow
                            position={{ lat: infoDealer.lat, lng: infoDealer.lng }}
                            onCloseClick={() => setInfoDealer(null)}
                        >
                            <div style={{ padding: '8px', minWidth: '180px', color: '#333' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>
                                    {infoDealer.name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>
                                    📍 {infoDealer.city}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>
                                    💰 {(infoDealer.monthlyRevenue / 1000).toFixed(1)}k TL/ay
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                    ⭐ {infoDealer.satisfaction.toFixed(1)} puan
                                </div>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </LoadScript>

            {/* Legend */}
            <div style={{
                position: 'absolute', bottom: '12px', left: '12px',
                display: 'flex', gap: '14px', fontSize: '0.7rem', color: 'var(--text-tertiary)',
                padding: '10px 16px', background: 'rgba(13, 17, 23, 0.9)',
                borderRadius: 'var(--radius-md)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(48, 54, 61, 0.5)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                zIndex: 10,
            }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 6px #2ecc7166' }} /> Aktif
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f0b429', boxShadow: '0 0 6px #f0b42966' }} /> Uyari
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#58a6ff', boxShadow: '0 0 6px #58a6ff66' }} /> Yeni
                </span>
            </div>
        </div>
    )
})

/* ═══════════════════════════════════════════════════
   REVENUE BAR — Visual revenue indicator
   ═══════════════════════════════════════════════════ */
function RevenueBar({ value, maxValue }) {
    const pct = (value / maxValue) * 100
    const barColor = pct > 70 ? '#2ecc71' : pct > 40 ? '#58a6ff' : '#f0b429'

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '90px' }}>
            <div style={{
                flex: 1, height: '6px', background: 'var(--bg-tertiary)',
                borderRadius: '3px', overflow: 'hidden', minWidth: '40px',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
            }}>
                <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: '3px',
                    background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 0 8px ${barColor}44, 0 0 2px ${barColor}66`,
                }} />
            </div>
            <span style={{
                fontWeight: 700, fontFamily: 'var(--font-display)',
                fontSize: '0.82rem', minWidth: '42px', whiteSpace: 'nowrap',
            }}>
                {(value / 1000).toFixed(0)}k
            </span>
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   DEALER CARD — Card view for dealers
   ═══════════════════════════════════════════════════ */
function DealerCard({ dealer, isSelected, onClick }) {
    const d = dealer
    const cfg = statusConfig[d.status]
    const canHover = useCanHover()

    return (
        <div
            onClick={onClick}
            className="animate-fade-in-up"
            style={{
                padding: '18px 18px 18px 22px', borderRadius: 'var(--radius-lg)',
                background: isSelected
                    ? `linear-gradient(135deg, ${cfg.bg}, rgba(13,17,23,0.6))`
                    : 'var(--bg-secondary)',
                border: isSelected
                    ? `1px solid ${cfg.color}55`
                    : '1px solid var(--border-primary)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative', overflow: 'hidden',
                boxShadow: isSelected
                    ? `0 0 20px ${cfg.color}15, var(--shadow-sm)`
                    : 'var(--shadow-sm)',
                backdropFilter: isSelected ? 'blur(8px)' : 'none',
            }}
            onMouseEnter={canHover ? e => {
                if (!isSelected) {
                    e.currentTarget.style.borderColor = `${cfg.color}33`
                    e.currentTarget.style.boxShadow = `0 0 24px ${cfg.color}12, var(--shadow-md)`
                    e.currentTarget.style.transform = 'translateY(-2px)'
                }
            } : undefined}
            onMouseLeave={canHover ? e => {
                if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--border-primary)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                    e.currentTarget.style.transform = 'translateY(0)'
                }
            } : undefined}
        >
            {/* Status accent bar with gradient */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                background: `linear-gradient(180deg, ${cfg.color}, ${cfg.color}88, ${cfg.color}44)`,
                borderRadius: '4px 0 0 4px',
                opacity: isSelected ? 1 : 0.5,
                transition: 'opacity 0.3s',
                boxShadow: isSelected ? `0 0 8px ${cfg.color}44` : 'none',
            }} />

            {/* Subtle glass overlay on selected */}
            {isSelected && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%)',
                    pointerEvents: 'none',
                }} />
            )}

            <div style={{ paddingLeft: '8px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{d.name.replace('Perdemo ', '')}</span>
                        <span className={`badge ${cfg.cls}`} style={{ fontSize: '0.6rem' }}>{cfg.label}</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ opacity: 0.6 }}>👤</span> {d.contact}
                    </span>
                </div>

                <RevenueBar value={d.monthlyRevenue} maxValue={70000} />

                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px',
                    marginTop: '14px', fontSize: '0.68rem',
                }}>
                    <div style={{
                        padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(88,166,255,0.04)',
                    }}>
                        <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>Ciro</span>
                        <div style={{ fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-display)' }}>₺{(d.monthlyRevenue / 1000).toFixed(0)}k</div>
                    </div>
                    <div style={{
                        padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(188,140,255,0.04)',
                    }}>
                        <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>Siparis</span>
                        <div style={{ fontWeight: 700 }}>{d.orders}</div>
                    </div>
                    <div style={{
                        padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(240,180,41,0.04)',
                    }}>
                        <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>Demo</span>
                        <div style={{ fontWeight: 700 }}>{d.demos}</div>
                    </div>
                    <div style={{
                        padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(46,204,113,0.04)',
                    }}>
                        <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>Puan</span>
                        <div style={{ fontWeight: 700, color: d.satisfaction >= 4.5 ? '#2ecc71' : d.satisfaction >= 4.0 ? '#f0b429' : '#e74c3c' }}>
                            ⭐ {d.satisfaction}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   DEALER DETAIL SLIDE-OVER
   ═══════════════════════════════════════════════════ */
const DealerDetailSlideOver = memo(function DealerDetailSlideOver({ dealer, onClose, onPushCatalog }) {
    if (!dealer) return null
    const cfg = statusConfig[dealer.status]

    return (
        <div className="overlay" onClick={onClose}>
            <div className="overlay__backdrop" />
            <div onClick={e => e.stopPropagation()} className="slideover">
                <div className="overlay__header">
                    <h2 className="overlay__title">Bayi Detay</h2>
                    <button className="btn btn-ghost overlay__close" onClick={onClose} aria-label="Kapat">✕</button>
                </div>

                {/* Header with gradient mesh background */}
                <div style={{
                    marginBottom: '24px', padding: '20px',
                    background: `linear-gradient(160deg, ${cfg.bg}, rgba(88,166,255,0.03), var(--bg-tertiary))`,
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${cfg.color}22`,
                    position: 'relative', overflow: 'hidden',
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
                }}>
                    {/* Mesh decorations */}
                    <div style={{
                        position: 'absolute', top: -30, right: -30,
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: `radial-gradient(circle, ${cfg.color}18, transparent)`,
                    }} />
                    <div style={{
                        position: 'absolute', bottom: -20, left: '40%',
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: `radial-gradient(circle, rgba(188,140,255,0.06), transparent)`,
                    }} />
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                        background: `linear-gradient(90deg, transparent, ${cfg.color}66, transparent)`,
                    }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', position: 'relative', letterSpacing: '-0.01em' }}>{dealer.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                        <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{dealer.city} — {dealer.region}</span>
                    </div>
                </div>

                {/* Contact Info Cards with icon accent backgrounds */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    {[
                        ['👤', 'Yetkili', dealer.contact, 'rgba(88,166,255,0.08)'],
                        ['📱', 'Telefon', dealer.phone, 'rgba(46,204,113,0.08)'],
                        ['📧', 'E-posta', dealer.email, 'rgba(188,140,255,0.08)'],
                    ].map(([icon, label, val, iconBg]) => (
                        <div key={label} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 14px', background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-secondary)',
                            transition: 'all 0.2s ease',
                        }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                                background: iconBg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1rem', flexShrink: 0,
                            }}>{icon}</div>
                            <div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{val}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Performance Stats in glass tiles */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '10px', marginBottom: '24px',
                }}>
                    {[
                        { value: `₺${dealer.monthlyRevenue.toLocaleString('tr-TR')}`, label: 'Aylik Ciro', color: 'var(--accent-blue)', bg: 'rgba(88,166,255,0.08)', borderCol: 'rgba(88,166,255,0.15)' },
                        { value: dealer.orders, label: 'Siparis', color: '#bc8cff', bg: 'rgba(139,92,246,0.08)', borderCol: 'rgba(139,92,246,0.15)' },
                        { value: dealer.demos, label: 'Demo', color: '#f0b429', bg: 'rgba(240,180,41,0.08)', borderCol: 'rgba(240,180,41,0.15)' },
                        { value: `${dealer.satisfaction}⭐`, label: 'Memnuniyet', color: '#2ecc71', bg: 'rgba(46,204,113,0.08)', borderCol: 'rgba(46,204,113,0.15)' },
                    ].map(s => (
                        <div key={s.label} style={{
                            padding: '16px', textAlign: 'center',
                            background: s.bg, borderRadius: 'var(--radius-md)',
                            border: `1px solid ${s.borderCol}`,
                            position: 'relative', overflow: 'hidden',
                            backdropFilter: 'blur(8px)',
                        }}>
                            <div style={{
                                position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
                                background: `linear-gradient(90deg, transparent, ${s.color}44, transparent)`,
                            }} />
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', marginBottom: '4px', position: 'relative' }}>{s.value}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Top Product + Markup with visual indicators */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                    <div style={{
                        flex: 1, padding: '14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-secondary)',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                            background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))',
                            opacity: 0.6,
                        }} />
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.06em', fontWeight: 600 }}>🏆 En Cok Satan</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{dealer.topProduct}</div>
                    </div>
                    <div style={{
                        flex: 1, padding: '14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-secondary)',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                            background: dealer.markup > 10
                                ? 'linear-gradient(90deg, #e74c3c, #c0392b)'
                                : dealer.markup > 5
                                    ? 'linear-gradient(90deg, #f0b429, #e67e22)'
                                    : 'linear-gradient(90deg, #2ecc71, #27ae60)',
                            opacity: 0.6,
                        }} />
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.06em', fontWeight: 600 }}>📊 Markup</div>
                        <div style={{
                            fontSize: '0.9rem', fontWeight: 700,
                            color: dealer.markup > 10 ? '#e74c3c' : dealer.markup > 5 ? '#f0b429' : '#2ecc71',
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                            {dealer.markup === 0 ? 'Liste Fiyati' : `+%${dealer.markup}`}
                            {dealer.markup === 0 && <span style={{
                                fontSize: '0.55rem', padding: '2px 6px', borderRadius: 'var(--radius-full)',
                                background: 'rgba(46,204,113,0.12)', color: '#2ecc71', fontWeight: 600,
                            }}>Ideal</span>}
                        </div>
                    </div>
                </div>

                {/* Action buttons with themed glow */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button className="btn btn-primary" style={{
                        width: '100%',
                        boxShadow: '0 4px 20px rgba(88, 166, 255, 0.25), 0 0 40px rgba(88,166,255,0.08)',
                    }}
                        onClick={() => window.open(`tel:${dealer.phone.replace(/\s/g, '')}`)}>📱 Ara</button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" style={{
                            flex: 1,
                            transition: 'all 0.2s ease',
                        }}
                            onClick={() => window.open(`mailto:${dealer.email}`)}>📧 E-posta</button>
                        <button className="btn btn-secondary" style={{
                            flex: 1,
                            transition: 'all 0.2s ease',
                        }}
                            onClick={() => onPushCatalog(dealer.id)}>📤 Katalog</button>
                    </div>
                </div>
            </div>
        </div>
    )
})

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function WhiteLabel() {
    const [selectedDealer, setSelectedDealer] = useState(null)
    const [regionFilter, setRegionFilter] = useState('Tumu')
    const [viewMode, setViewMode] = useState('cards')
    const [pushModalOpen, setPushModalOpen] = useState(false)
    const [pushTargets, setPushTargets] = useState([])
    const [pushSent, setPushSent] = useState(false)

    const selectDealer = useCallback((d) => {
        startTransition(() => setSelectedDealer(d))
    }, [])
    const closeDealer = useCallback(() => {
        startTransition(() => setSelectedDealer(null))
    }, [])

    const filtered = useMemo(() =>
        dealers.filter(d => regionFilter === 'Tumu' || d.region === regionFilter)
        , [regionFilter])

    const maxRevenue = useMemo(() => Math.max(...filtered.map(d => d.monthlyRevenue)), [filtered])

    const kpiData = useMemo(() => {
        let revenue = 0, orders = 0, demos = 0, satSum = 0
        filtered.forEach(d => { revenue += d.monthlyRevenue; orders += d.orders; demos += d.demos; satSum += d.satisfaction })
        const avgSat = (satSum / filtered.length).toFixed(1)
        const activeCount = filtered.filter(d => d.status === 'active').length
        const warningCount = filtered.filter(d => d.status === 'warning').length
        return {
            stats: [
                { label: 'Toplam Ciro', value: `₺${(revenue / 1000).toFixed(0)}k`, icon: '💰', color: 'rgba(88, 166, 255, 0.12)', accent: 'var(--accent-blue)' },
                { label: 'Toplam Siparis', value: orders, icon: '📦', color: 'rgba(139, 92, 246, 0.12)', accent: '#bc8cff' },
                { label: 'Demo Sayisi', value: demos, icon: '🎯', color: 'rgba(240, 180, 41, 0.12)', accent: '#f0b429' },
                { label: 'Ort. Memnuniyet', value: `${avgSat}⭐`, icon: '😊', color: 'rgba(46, 204, 113, 0.12)', accent: '#2ecc71' },
                { label: 'Aktif Bayi', value: `${activeCount}/${filtered.length}`, icon: '🏢', color: 'rgba(247, 120, 186, 0.12)', accent: '#f778ba', warning: warningCount > 0 ? `${warningCount} uyari` : null },
            ]
        }
    }, [filtered])

    const top5 = useMemo(() => [...filtered].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).slice(0, 5), [filtered])

    const fabricDemoStats = useMemo(() => {
        const fabricCounts = {}
        dealers.forEach(d => { fabricCounts[d.topProduct] = (fabricCounts[d.topProduct] || 0) + d.demos })
        const sorted = Object.entries(fabricCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
        const maxDemo = sorted[0]?.[1] || 1
        return sorted.map(([name, count]) => ({ name, count, pct: (count / maxDemo) * 100 }))
    }, [])

    const handlePushCatalog = useCallback((id) => {
        setPushTargets([id])
        setPushModalOpen(true)
        setPushSent(false)
    }, [])

    const togglePushTarget = useCallback((id) => {
        setPushTargets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }, [])

    const handlePush = useCallback(() => {
        setPushSent(true)
        setTimeout(() => { setPushModalOpen(false); setPushSent(false); setPushTargets([]) }, 2000)
    }, [])

    /* gradient color pairs for fabric progress bars */
    const fabricColors = [
        'linear-gradient(90deg, #58a6ff, #bc8cff)',
        'linear-gradient(90deg, #bc8cff, #f778ba)',
        'linear-gradient(90deg, #f778ba, #f0b429)',
        'linear-gradient(90deg, #f0b429, #2ecc71)',
        'linear-gradient(90deg, #2ecc71, #58a6ff)',
    ]

    /* region bar colors */
    const regionColors = {
        Marmara: '#58a6ff',
        'Ic Anadolu': '#bc8cff',
        Ege: '#f778ba',
        Akdeniz: '#2ecc71',
        Karadeniz: '#f0b429',
    }

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Bayi Agi Yonetimi</h1>
                    <p className="page-subtitle">{dealers.length} bayi — {cityCount} sehir</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
                        <button
                            className={`btn ${viewMode === 'cards' ? 'btn-secondary' : 'btn-ghost'}`}
                            style={{ fontSize: '0.75rem', padding: '6px 12px', minHeight: '34px' }}
                            onClick={() => setViewMode('cards')}
                            aria-label="Kart gorunumu"
                        >⊞ Kartlar</button>
                        <button
                            className={`btn ${viewMode === 'table' ? 'btn-secondary' : 'btn-ghost'}`}
                            style={{ fontSize: '0.75rem', padding: '6px 12px', minHeight: '34px' }}
                            onClick={() => setViewMode('table')}
                            aria-label="Tablo gorunumu"
                        >☰ Tablo</button>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setPushModalOpen(true); setPushSent(false) }}>
                        📤 Yeni Koleksiyon
                    </button>
                </div>
            </div>

            {/* Warning Banner — Enhanced gradient with animated accent */}
            {filtered.some(d => d.status === 'warning') && (
                <div className="animate-fade-in-up" style={{
                    padding: '16px 22px', marginBottom: '24px',
                    background: 'linear-gradient(135deg, rgba(240,180,41,0.1) 0%, rgba(240,180,41,0.04) 40%, rgba(230,126,34,0.06) 100%)',
                    border: '1px solid rgba(240,180,41,0.22)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex', alignItems: 'center', gap: '16px',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(240,180,41,0.06)',
                }}>
                    {/* Animated accent bar */}
                    <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                        background: 'linear-gradient(180deg, #f0b429, #e67e22, #f0b429)',
                        backgroundSize: '4px 200%',
                        animation: 'shimmer 3s ease-in-out infinite',
                    }} />
                    {/* Decorative glow */}
                    <div style={{
                        position: 'absolute', top: '50%', left: '60px', transform: 'translateY(-50%)',
                        width: '200px', height: '80px',
                        background: 'radial-gradient(ellipse, rgba(240,180,41,0.06) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        width: '46px', height: '46px', borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, rgba(240,180,41,0.2), rgba(230,126,34,0.15))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.3rem', flexShrink: 0,
                        border: '1px solid rgba(240,180,41,0.15)',
                        boxShadow: '0 0 16px rgba(240,180,41,0.1)',
                    }}>⚠️</div>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <div style={{
                            fontWeight: 700, fontSize: '0.9rem', color: '#f0b429', marginBottom: '4px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                            {filtered.filter(d => d.status === 'warning').length} bayi uyari durumunda
                            <span style={{
                                fontSize: '0.58rem', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                                background: 'rgba(240,180,41,0.15)', color: '#f0b429', fontWeight: 600,
                                border: '1px solid rgba(240,180,41,0.2)',
                            }}>Aksiyon Gerekli</span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            Dusuk performans gostereniyor. Iletisime gecmeniz onerilir.
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Cards — Glass overlay with animated accent line */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '16px', marginBottom: '28px',
            }}>
                {kpiData.stats.map((stat, i) => (
                    <div key={i} className="animate-fade-in-up" style={{
                        animationDelay: `${i * 0.08}s`,
                        padding: '22px', borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        position: 'relative', overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        {/* Animated top accent line */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                            background: `linear-gradient(90deg, transparent 0%, ${stat.accent} 50%, transparent 100%)`,
                            opacity: 0.6,
                        }} />
                        {/* Glass overlay */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(160deg, rgba(255,255,255,0.03) 0%, transparent 40%)',
                            pointerEvents: 'none',
                        }} />
                        {/* Blurred color orb */}
                        <div style={{
                            position: 'absolute', top: -24, right: -24,
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: stat.color, filter: 'blur(24px)',
                            opacity: 0.5, pointerEvents: 'none',
                        }} />
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            marginBottom: '12px', position: 'relative',
                        }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                                background: stat.color, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '1.2rem',
                                border: '1px solid rgba(255,255,255,0.06)',
                                boxShadow: `0 2px 8px ${stat.color}`,
                            }}>{stat.icon}</div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</span>
                        </div>
                        <div style={{
                            fontSize: '1.7rem', fontWeight: 800, fontFamily: 'var(--font-display)',
                            color: stat.accent, position: 'relative',
                        }}>
                            {stat.value}
                        </div>
                        {stat.warning && (
                            <div style={{
                                fontSize: '0.62rem', color: '#f0b429', marginTop: '6px', fontWeight: 600,
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '3px 8px', borderRadius: 'var(--radius-full)',
                                background: 'rgba(240,180,41,0.1)',
                                border: '1px solid rgba(240,180,41,0.15)',
                            }}>
                                ⚠️ {stat.warning}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Map + Region Filter — Enhanced card with accent border */}
            <div style={{
                marginBottom: '28px', position: 'relative', overflow: 'hidden',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--gradient-card)',
                border: '1px solid var(--border-primary)',
                padding: '24px',
                boxShadow: 'var(--shadow-sm), 0 0 40px rgba(88,166,255,0.03)',
            }} className="animate-fade-in-up">
                {/* Decorative accent glow */}
                <div style={{
                    position: 'absolute', top: -60, right: -60,
                    width: '200px', height: '200px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(88,166,255,0.05) 0%, transparent 60%)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', bottom: -40, left: -40,
                    width: '140px', height: '140px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(188,140,255,0.04) 0%, transparent 60%)',
                    pointerEvents: 'none',
                }} />
                {/* Subtle top border accent */}
                <div style={{
                    position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(88,166,255,0.2), transparent)',
                }} />
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '18px', position: 'relative',
                }}>
                    <div>
                        <h3 style={{ fontSize: '1.08rem', fontWeight: 700, marginBottom: '4px', letterSpacing: '-0.01em' }}>Bayi Haritasi</h3>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                            Turkiye genelindeki bayi dagilimi — {filtered.length} bayi gosteriliyor
                        </p>
                    </div>
                    {/* Region filter tabs with active glow */}
                    <div style={{
                        display: 'flex', gap: '2px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)', padding: '3px',
                        border: '1px solid var(--border-secondary)',
                    }}>
                        {regions.map(r => {
                            const isActive = regionFilter === r
                            return (
                                <button key={r} onClick={() => setRegionFilter(r)}
                                    className={`btn ${isActive ? 'btn-secondary' : 'btn-ghost'}`}
                                    style={{
                                        fontSize: '0.68rem', padding: '4px 10px', minHeight: '30px',
                                        boxShadow: isActive ? '0 0 12px rgba(88,166,255,0.12)' : 'none',
                                        borderColor: isActive ? 'rgba(88,166,255,0.2)' : 'transparent',
                                        position: 'relative',
                                    }}>
                                    {r}
                                </button>
                            )
                        })}
                    </div>
                </div>
                <TurkeyMap dealers={filtered} onSelect={selectDealer} selectedId={selectedDealer?.id} />
            </div>

            {/* Main Layout: Dealers + Sidebar */}
            <div className="grid-sidebar-layout">
                {/* Left — Dealer List */}
                <div>
                    {viewMode === 'cards' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                            {filtered
                                .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
                                .map(d => (
                                    <DealerCard
                                        key={d.id}
                                        dealer={d}
                                        isSelected={selectedDealer?.id === d.id}
                                        onClick={() => selectDealer(d)}
                                    />
                                ))}
                        </div>
                    ) : (
                        <div className="card" style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Bayi Listesi</h3>
                            <div className="table-container">
                                <table className="table" role="table" style={{ minWidth: '600px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: '12px 14px' }}>Bayi</th>
                                            <th style={{ padding: '12px 14px' }}>Sehir</th>
                                            <th style={{ padding: '12px 14px' }}>Ciro</th>
                                            <th style={{ padding: '12px 14px' }}>Siparis</th>
                                            <th style={{ padding: '12px 14px' }}>Puan</th>
                                            <th style={{ padding: '12px 14px' }}>Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered
                                            .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
                                            .map(d => (
                                                <tr key={d.id}
                                                    style={{
                                                        cursor: 'pointer',
                                                        background: selectedDealer?.id === d.id ? statusConfig[d.status].bg : undefined,
                                                    }}
                                                    onClick={() => selectDealer(d)}>
                                                    <td style={{ padding: '10px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                        {d.name.replace('Perdemo ', '')}
                                                    </td>
                                                    <td style={{ padding: '10px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{d.city}</td>
                                                    <td style={{ padding: '10px 14px' }}>
                                                        <RevenueBar value={d.monthlyRevenue} maxValue={maxRevenue} />
                                                    </td>
                                                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{d.orders}</td>
                                                    <td style={{ padding: '10px 14px' }}>
                                                        <span style={{
                                                            fontWeight: 700,
                                                            color: d.satisfaction >= 4.5 ? '#2ecc71' : d.satisfaction >= 4.0 ? '#f0b429' : '#e74c3c',
                                                        }}>⭐ {d.satisfaction}</span>
                                                    </td>
                                                    <td style={{ padding: '10px 14px' }}>
                                                        <span className={`badge ${statusConfig[d.status].cls}`}>
                                                            {statusConfig[d.status].label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar — Top 5 + Fabric Stats + Region Distribution */}
                <div style={{ position: 'sticky', top: '100px' }}>
                    {/* Top 5 Dealers — Medal podium effect */}
                    <div style={{
                        marginBottom: '16px', padding: '24px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(88,166,255,0.03) 100%)',
                        border: '1px solid rgba(88,166,255,0.15)',
                        position: 'relative', overflow: 'hidden',
                        boxShadow: '0 0 30px rgba(88,166,255,0.04)',
                    }}>
                        <div style={{
                            position: 'absolute', top: -30, right: -30,
                            width: '120px', height: '120px', borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />
                        {/* Top accent */}
                        <div style={{
                            position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
                            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)',
                        }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', position: 'relative' }}>
                            <div style={{
                                width: '38px', height: '38px', borderRadius: 'var(--radius-md)',
                                background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.15))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                                border: '1px solid rgba(255,215,0,0.15)',
                                boxShadow: '0 0 12px rgba(255,215,0,0.08)',
                            }}>🏆</div>
                            <div>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0' }}>Top 5 Bayi</h3>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Aylik ciroya gore siralama</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                            {top5.map((d, i) => {
                                const medalColors = [
                                    { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', shadow: '0 0 12px rgba(255,215,0,0.3)', border: 'rgba(255,215,0,0.3)' },
                                    { bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', shadow: '0 0 10px rgba(192,192,192,0.2)', border: 'rgba(192,192,192,0.3)' },
                                    { bg: 'linear-gradient(135deg, #CD7F32, #A0522D)', shadow: '0 0 10px rgba(205,127,50,0.2)', border: 'rgba(205,127,50,0.3)' },
                                ]
                                const isMedal = i < 3
                                const isSelectedItem = selectedDealer?.id === d.id

                                return (
                                    <div key={d.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: isMedal ? '14px' : '12px',
                                        background: isMedal
                                            ? `linear-gradient(135deg, var(--bg-tertiary), ${i === 0 ? 'rgba(255,215,0,0.04)' : i === 1 ? 'rgba(192,192,192,0.04)' : 'rgba(205,127,50,0.04)'})`
                                            : 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer', transition: 'all 0.25s ease',
                                        border: isSelectedItem
                                            ? '1px solid rgba(88,166,255,0.3)'
                                            : isMedal
                                                ? `1px solid ${medalColors[i].border}`
                                                : '1px solid transparent',
                                        boxShadow: isSelectedItem
                                            ? '0 0 16px rgba(88,166,255,0.1)'
                                            : isMedal ? medalColors[i].shadow : 'none',
                                    }} onClick={() => selectDealer(d)}>
                                        <span style={{
                                            width: '30px', height: '30px', borderRadius: isMedal ? 'var(--radius-md)' : 'var(--radius-sm)',
                                            background: isMedal ? medalColors[i].bg : 'linear-gradient(135deg, var(--bg-primary), var(--bg-tertiary))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: isMedal ? '0.8rem' : '0.75rem',
                                            fontWeight: 800,
                                            color: isMedal ? '#fff' : 'var(--text-secondary)',
                                            flexShrink: 0,
                                            boxShadow: isMedal ? `inset 0 1px 0 rgba(255,255,255,0.2)` : 'none',
                                            border: isMedal ? 'none' : '1px solid var(--border-secondary)',
                                        }}>{i + 1}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {d.name.replace('Perdemo ', '')}
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{d.city}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                fontSize: '0.88rem', fontWeight: 700, fontFamily: 'var(--font-display)',
                                                color: 'var(--accent-blue)',
                                                textShadow: '0 0 20px rgba(88,166,255,0.2)',
                                            }}>
                                                ₺{(d.monthlyRevenue / 1000).toFixed(0)}k
                                            </div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>{d.orders} siparis</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Most Demoed Fabrics — Enhanced progress bars */}
                    <div style={{
                        padding: '24px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--gradient-card)',
                        border: '1px solid var(--border-primary)',
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                                background: 'rgba(240,180,41,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                                border: '1px solid rgba(240,180,41,0.12)',
                            }}>🎯</div>
                            <div>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0', letterSpacing: '-0.01em' }}>En Cok Demo Yapilan</h3>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Tum bayiler bazinda</span>
                            </div>
                        </div>
                        {fabricDemoStats.map(({ name, count, pct }, idx) => (
                            <div key={name} style={{ marginBottom: idx < fabricDemoStats.length - 1 ? '14px' : '0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px', alignItems: 'baseline' }}>
                                    <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>{name}</span>
                                    <span style={{
                                        color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)', fontWeight: 700,
                                        fontSize: '0.82rem',
                                    }}>{count}</span>
                                </div>
                                <div style={{
                                    height: '7px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden',
                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
                                }}>
                                    <div style={{
                                        height: '100%', width: `${pct}%`,
                                        background: fabricColors[idx] || 'var(--gradient-brand)',
                                        borderRadius: '4px',
                                        transition: 'width 0.6s ease',
                                        boxShadow: '0 0 10px rgba(88,166,255,0.15)',
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Region Distribution — Enhanced with hover effect */}
                    <div style={{
                        marginTop: '16px', padding: '24px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--gradient-card)',
                        border: '1px solid var(--border-primary)',
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                                background: 'rgba(88,166,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                                border: '1px solid rgba(88,166,255,0.1)',
                            }}>🗺️</div>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.01em' }}>Bolge Dagilimi</h3>
                        </div>
                        {['Marmara', 'Ic Anadolu', 'Ege', 'Akdeniz', 'Karadeniz'].map(region => {
                            const regionDealers = dealers.filter(d => d.region === region)
                            const regionRevenue = regionDealers.reduce((s, d) => s + d.monthlyRevenue, 0)
                            const maxRegionRevenue = 200000
                            const barCol = regionColors[region] || 'var(--accent-blue)'
                            return (
                                <div key={region} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '10px 8px',
                                    borderBottom: '1px solid var(--border-secondary)',
                                    borderRadius: 'var(--radius-sm)',
                                    transition: 'all 0.2s ease',
                                    cursor: 'default',
                                }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 600, minWidth: '80px' }}>{region}</span>
                                    <div style={{
                                        flex: 1, height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden',
                                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
                                    }}>
                                        <div style={{
                                            height: '100%', width: `${(regionRevenue / maxRegionRevenue) * 100}%`,
                                            background: `linear-gradient(90deg, ${barCol}99, ${barCol})`,
                                            borderRadius: '3px', transition: 'width 0.5s ease',
                                            boxShadow: `0 0 8px ${barCol}33`,
                                        }} />
                                    </div>
                                    <span style={{
                                        fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, minWidth: '48px', textAlign: 'right',
                                        fontFamily: 'var(--font-display)',
                                    }}>
                                        {regionDealers.length} bayi
                                    </span>
                                </div>
                            )
                        })}
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

            {/* Catalog Push Modal — Enhanced with celebration and glass effects */}
            {pushModalOpen && (
                <div className="overlay overlay--center"
                    onClick={() => !pushSent && setPushModalOpen(false)}>
                    <div className="overlay__backdrop" />
                    <div onClick={e => e.stopPropagation()} className="modal-panel" style={{ position: 'relative', overflow: 'hidden' }}>
                        {/* Top accent line */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                            background: pushSent
                                ? 'linear-gradient(90deg, transparent, #2ecc71, transparent)'
                                : 'linear-gradient(90deg, transparent, var(--accent-blue), var(--accent-purple), transparent)',
                            opacity: 0.5,
                        }} />

                        {pushSent ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', position: 'relative' }}>
                                {/* Celebration decorations */}
                                <div style={{
                                    position: 'absolute', top: '10px', left: '15%',
                                    fontSize: '1.2rem', opacity: 0.4,
                                    animation: 'fadeIn 0.5s ease-out',
                                }}>🎉</div>
                                <div style={{
                                    position: 'absolute', top: '20px', right: '18%',
                                    fontSize: '1rem', opacity: 0.3,
                                    animation: 'fadeIn 0.7s ease-out',
                                }}>✨</div>
                                <div style={{
                                    position: 'absolute', bottom: '25px', left: '22%',
                                    fontSize: '0.9rem', opacity: 0.3,
                                    animation: 'fadeIn 0.9s ease-out',
                                }}>🎊</div>
                                <div style={{
                                    position: 'absolute', bottom: '30px', right: '15%',
                                    fontSize: '1.1rem', opacity: 0.35,
                                    animation: 'fadeIn 0.6s ease-out',
                                }}>🎉</div>

                                <div style={{
                                    width: '72px', height: '72px', margin: '0 auto 18px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'linear-gradient(135deg, rgba(46,204,113,0.15), rgba(46,204,113,0.08))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '2rem',
                                    border: '2px solid rgba(46,204,113,0.2)',
                                    boxShadow: '0 0 30px rgba(46,204,113,0.15), 0 0 60px rgba(46,204,113,0.05)',
                                }}>✅</div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.01em' }}>Koleksiyon Gonderildi!</h3>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {pushTargets.length} bayiye yeni katalog basariyla iletildi.
                                </p>
                                <div style={{
                                    marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '6px 14px', borderRadius: 'var(--radius-full)',
                                    background: 'rgba(46,204,113,0.08)',
                                    border: '1px solid rgba(46,204,113,0.15)',
                                    fontSize: '0.7rem', color: '#2ecc71', fontWeight: 600,
                                }}>
                                    ✓ Tum bayiler guncellendi
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                                        background: 'linear-gradient(135deg, rgba(88,166,255,0.15), rgba(188,140,255,0.1))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                                        border: '1px solid rgba(88,166,255,0.12)',
                                        boxShadow: '0 0 12px rgba(88,166,255,0.08)',
                                    }}>📤</div>
                                    <div>
                                        <h3 style={{ fontSize: '1.08rem', fontWeight: 700, marginBottom: '0', letterSpacing: '-0.01em' }}>Yeni Koleksiyon Gonder</h3>
                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '3px' }}>
                                            Secili bayilerin POS ve demo sistemleri otomatik guncellenir
                                        </p>
                                    </div>
                                </div>

                                {/* Select all / clear toggle with count */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: '12px', padding: '8px 12px',
                                    background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-secondary)',
                                }}>
                                    <button
                                        className="btn btn-ghost"
                                        style={{ fontSize: '0.72rem', padding: '4px 10px', minHeight: '28px' }}
                                        onClick={() => setPushTargets(pushTargets.length === dealers.length ? [] : dealers.map(d => d.id))}
                                    >
                                        {pushTargets.length === dealers.length ? '✕ Temizle' : '☑ Tumunu Sec'}
                                    </button>
                                    <span style={{
                                        fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                    }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                            minWidth: '20px', height: '20px', borderRadius: 'var(--radius-full)',
                                            background: pushTargets.length > 0 ? 'rgba(88,166,255,0.15)' : 'var(--bg-primary)',
                                            color: pushTargets.length > 0 ? 'var(--accent-blue)' : 'var(--text-tertiary)',
                                            fontSize: '0.65rem', fontWeight: 700, padding: '0 5px',
                                        }}>{pushTargets.length}</span>
                                        / {dealers.length} secili
                                    </span>
                                </div>

                                <div style={{
                                    maxHeight: '320px', overflowY: 'auto',
                                    display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px',
                                    padding: '4px',
                                }}>
                                    {dealers.map(d => {
                                        const isChecked = pushTargets.includes(d.id)
                                        return (
                                            <label key={d.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                padding: '12px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                                background: isChecked ? 'rgba(88,166,255,0.06)' : 'var(--bg-tertiary)',
                                                border: isChecked ? '1px solid rgba(88,166,255,0.25)' : '1px solid var(--border-secondary)',
                                                transition: 'all 0.2s ease',
                                                backdropFilter: isChecked ? 'blur(4px)' : 'none',
                                                boxShadow: isChecked ? '0 0 12px rgba(88,166,255,0.05)' : 'none',
                                            }}>
                                                <div style={{
                                                    width: '20px', height: '20px', borderRadius: 'var(--radius-sm)',
                                                    border: isChecked ? '2px solid var(--accent-blue)' : '2px solid var(--border-primary)',
                                                    background: isChecked ? 'var(--accent-blue)' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.15s ease',
                                                    flexShrink: 0,
                                                    boxShadow: isChecked ? '0 0 8px rgba(88,166,255,0.2)' : 'none',
                                                }}>
                                                    {isChecked && <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 800, lineHeight: 1 }}>✓</span>}
                                                </div>
                                                <input type="checkbox" checked={isChecked}
                                                    onChange={() => togglePushTarget(d.id)}
                                                    style={{ display: 'none' }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{d.name.replace('Perdemo ', '')}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{d.city} — {d.contact}</div>
                                                </div>
                                                <span className={`badge ${statusConfig[d.status].cls}`} style={{ fontSize: '0.55rem' }}>
                                                    {statusConfig[d.status].label}
                                                </span>
                                            </label>
                                        )
                                    })}
                                </div>

                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }} />
                                    <button className="btn btn-secondary" onClick={() => setPushModalOpen(false)}>Iptal</button>
                                    <button className="btn btn-primary" onClick={handlePush}
                                        disabled={pushTargets.length === 0}
                                        style={{
                                            boxShadow: pushTargets.length > 0
                                                ? '0 4px 20px rgba(88, 166, 255, 0.25), 0 0 30px rgba(88,166,255,0.08)'
                                                : undefined,
                                        }}>
                                        📤 {pushTargets.length} Bayiye Gonder
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
