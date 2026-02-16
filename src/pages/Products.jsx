import { useState, useCallback } from 'react'

const initialProducts = [
    { id: 1, name: 'Kadife Fon Perde', fabric: 'Kadife', color: 'Bordo', price: 1300, stock: 24, status: 'active', category: 'Fon Perde' },
    { id: 2, name: 'Tül Perde Premium', fabric: 'Tül', color: 'Beyaz', price: 600, stock: 48, status: 'active', category: 'Tül Perde' },
    { id: 3, name: 'Blackout Stor Perde', fabric: 'Polyester', color: 'Gri', price: 1400, stock: 15, status: 'active', category: 'Stor Perde' },
    { id: 4, name: 'Zebra Perde Modern', fabric: 'Polyester', color: 'Krem', price: 1100, stock: 32, status: 'active', category: 'Zebra Perde' },
    { id: 5, name: 'Fon Perde Lacivert', fabric: 'Keten', color: 'Lacivert', price: 1600, stock: 8, status: 'low', category: 'Fon Perde' },
    { id: 6, name: 'Tül Perde Dantel', fabric: 'Dantel', color: 'Ekru', price: 850, stock: 0, status: 'out', category: 'Tül Perde' },
    { id: 7, name: 'Perde Bant Aksesuar', fabric: '-', color: '-', price: 120, stock: 150, status: 'active', category: 'Aksesuar' },
    { id: 8, name: 'Blackout Fon Siyah', fabric: 'Blackout', color: 'Siyah', price: 1450, stock: 19, status: 'active', category: 'Fon Perde' },
    { id: 9, name: 'Jakar Fon Perde', fabric: 'Jakar', color: 'Altın', price: 2200, stock: 6, status: 'low', category: 'Fon Perde' },
]

const stockBadge = (status) => {
    const map = {
        active: { label: 'Stokta', cls: 'badge-success' },
        low: { label: 'Az Stok', cls: 'badge-warning' },
        out: { label: 'Tükendi', cls: 'badge-danger' },
    }
    return map[status] || map.active
}

const categoryColors = {
    'Fon Perde': '#58a6ff',
    'Tül Perde': '#bc8cff',
    'Stor Perde': '#f0b429',
    'Zebra Perde': '#3fb950',
    'Aksesuar': '#f778ba',
}

const categories = ['Tümü', 'Fon Perde', 'Tül Perde', 'Stor Perde', 'Zebra Perde', 'Aksesuar']
const emptyForm = { name: '', fabric: '', color: '', price: '', stock: '', category: 'Fon Perde' }

const labelStyle = {
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--text-tertiary)',
    marginBottom: '6px',
    display: 'block',
}

export default function Products() {
    const [products, setProducts] = useState(initialProducts)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('Tümü')
    const [view, setView] = useState('grid')
    const [modalOpen, setModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const filtered = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
        const matchCat = category === 'Tümü' || p.category === category
        return matchSearch && matchCat
    })

    const updateForm = (field, value) => setForm(f => ({ ...f, [field]: value }))

    const openAddModal = useCallback(() => {
        setEditingProduct(null)
        setForm(emptyForm)
        setModalOpen(true)
    }, [])

    const openEditModal = useCallback((product) => {
        setEditingProduct(product)
        setForm({
            name: product.name,
            fabric: product.fabric,
            color: product.color,
            price: String(product.price),
            stock: String(product.stock),
            category: product.category,
        })
        setModalOpen(true)
    }, [])

    const handleSave = useCallback(() => {
        if (!form.name.trim()) return alert('Ürün adı gerekli')
        if (!form.price) return alert('Fiyat gerekli')
        const stockNum = parseInt(form.stock) || 0
        const status = stockNum === 0 ? 'out' : stockNum < 10 ? 'low' : 'active'
        if (editingProduct) {
            setProducts(prev => prev.map(p => p.id === editingProduct.id
                ? { ...p, name: form.name, fabric: form.fabric, color: form.color, price: parseFloat(form.price), stock: stockNum, status, category: form.category }
                : p
            ))
        } else {
            const newId = Math.max(...products.map(p => p.id)) + 1
            setProducts(prev => [...prev, {
                id: newId, name: form.name, fabric: form.fabric, color: form.color,
                price: parseFloat(form.price), stock: stockNum, status, category: form.category,
            }])
        }
        setModalOpen(false)
        setForm(emptyForm)
    }, [form, editingProduct, products])

    const handleDelete = useCallback((id) => {
        setProducts(prev => prev.filter(p => p.id !== id))
        setDeleteConfirm(null)
        setSelectedProduct(null)
    }, [])

    const colorBg = (color) => {
        const map = {
            'Bordo': '#8B1A1A33', 'Beyaz': '#ffffff15', 'Gri': '#6B728033',
            'Krem': '#F5DEB333', 'Lacivert': '#00008B33', 'Ekru': '#F5F5DC33',
            'Siyah': '#1a1a1a55', 'Altın': '#FFD70033',
        }
        return map[color] || '#58a6ff15'
    }

    const catColor = (cat) => categoryColors[cat] || '#58a6ff'

    /* Grid dot pattern SVG as data URI */
    const gridDotsPattern = `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.06'/%3E%3C/svg%3E")`

    /* Stock percentage for progress bar */
    const stockPercent = (stock) => Math.min((stock / 50) * 100, 100)

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Ürünler</h1>
                    <p className="page-subtitle">{products.length} ürün kayıtlı</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}
                    style={{ position: 'relative', overflow: 'hidden' }}>
                    <span style={{ position: 'relative', zIndex: 1 }}>+ Yeni Ürün</span>
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-bar" style={{ maxWidth: '280px', position: 'relative' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input type="search" className="input input-with-icon" placeholder="Ürün ara..."
                        value={search} onChange={e => setSearch(e.target.value)} aria-label="Ürün ara"
                        style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </div>
                <div className="tabs" style={{ marginBottom: 0, position: 'relative' }}>
                    {categories.map(cat => {
                        const isActive = category === cat
                        const dotColor = cat !== 'Tümü' ? catColor(cat) : null
                        return (
                            <button key={cat}
                                className={`tab ${isActive ? 'active' : ''}`}
                                onClick={() => setCategory(cat)}
                                style={{
                                    position: 'relative',
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    ...(isActive && dotColor ? { borderBottom: `2px solid ${dotColor}`, color: dotColor } : {}),
                                }}>
                                {dotColor && (
                                    <span style={{
                                        display: 'inline-block',
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: dotColor,
                                        marginRight: '6px',
                                        boxShadow: isActive ? `0 0 8px ${dotColor}60` : 'none',
                                        transition: 'box-shadow 0.25s ease',
                                    }} />
                                )}
                                {cat}
                            </button>
                        )
                    })}
                </div>

                {/* Results count badge */}
                <span style={{
                    padding: '4px 12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'var(--accent-blue-dim)',
                    color: 'var(--accent-blue)',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(88,166,255,0.2)',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                }}>
                    {filtered.length} sonuç
                </span>

                {/* View toggle */}
                <div style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    gap: '2px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '3px',
                    border: '1px solid var(--border-secondary)',
                }}>
                    <button
                        className={`btn btn-icon ${view === 'grid' ? 'btn-secondary' : 'btn-ghost'}`}
                        style={{
                            fontSize: '0.85rem',
                            minHeight: '34px',
                            width: '34px',
                            height: '34px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onClick={() => setView('grid')} aria-label="Grid görünüm">⊞</button>
                    <button
                        className={`btn btn-icon ${view === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
                        style={{
                            fontSize: '0.85rem',
                            minHeight: '34px',
                            width: '34px',
                            height: '34px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onClick={() => setView('list')} aria-label="Liste görünüm">☰</button>
                </div>
            </div>

            {/* Product Grid */}
            {filtered.length === 0 ? (
                <div className="empty-state" style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderColor: 'var(--border-accent)',
                }}>
                    {/* Decorative background elements */}
                    <div style={{
                        position: 'absolute',
                        top: '-40px',
                        left: '-40px',
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(88,166,255,0.08) 0%, transparent 70%)',
                        filter: 'blur(30px)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '-40px',
                        right: '-40px',
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(188,140,255,0.08) 0%, transparent 70%)',
                        filter: 'blur(30px)',
                        pointerEvents: 'none',
                    }} />
                    {/* Grid pattern overlay */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: gridDotsPattern,
                        backgroundRepeat: 'repeat',
                        opacity: 0.5,
                        pointerEvents: 'none',
                    }} />
                    <div className="empty-state-icon" style={{
                        fontSize: '4rem',
                        position: 'relative',
                        zIndex: 1,
                    }}>🪟</div>
                    <div className="empty-state-title" style={{
                        position: 'relative',
                        zIndex: 1,
                        background: 'var(--gradient-brand)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '1.2rem',
                    }}>Ürün bulunamadı</div>
                    <div className="empty-state-desc" style={{ position: 'relative', zIndex: 1 }}>
                        Arama kriterlerinize uygun ürün yok. Filtreleri değiştirmeyi deneyin.
                    </div>
                </div>
            ) : view === 'grid' ? (
                <div className="grid-3">
                    {filtered.map((product, i) => {
                        const accentColor = catColor(product.category)
                        const stockPct = stockPercent(product.stock)
                        const stockBarColor = product.status === 'out' ? '#f87171' : product.status === 'low' ? '#fbbf24' : '#4ade80'
                        return (
                            <div key={product.id} className="card animate-fade-in-up"
                                style={{
                                    animationDelay: `${i * 0.05}s`,
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    borderColor: 'transparent',
                                    background: 'var(--gradient-card)',
                                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-6px)'
                                    e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.4), 0 0 30px ${accentColor}20`
                                    e.currentTarget.style.borderColor = `${accentColor}40`
                                    const gradLine = e.currentTarget.querySelector('.product-gradient-border')
                                    if (gradLine) gradLine.style.opacity = '1'
                                    const accentLine = e.currentTarget.querySelector('.product-accent-line')
                                    if (accentLine) accentLine.style.opacity = '1'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                                    e.currentTarget.style.borderColor = 'transparent'
                                    const gradLine = e.currentTarget.querySelector('.product-gradient-border')
                                    if (gradLine) gradLine.style.opacity = '0.15'
                                    const accentLine = e.currentTarget.querySelector('.product-accent-line')
                                    if (accentLine) accentLine.style.opacity = '0'
                                }}
                                onClick={() => setSelectedProduct(product)}>

                                {/* Animated gradient border overlay */}
                                <div className="product-gradient-border" style={{
                                    position: 'absolute',
                                    inset: '-1px',
                                    borderRadius: 'inherit',
                                    padding: '1px',
                                    background: `linear-gradient(135deg, ${accentColor} 0%, #bc8cff 50%, #f778ba 100%)`,
                                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                    WebkitMaskComposite: 'xor',
                                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                    maskComposite: 'exclude',
                                    pointerEvents: 'none',
                                    opacity: 0.15,
                                    transition: 'opacity 0.4s ease',
                                    zIndex: 2,
                                }} />

                                {/* Decorative gradient orb */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-30px',
                                    right: '-30px',
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
                                    filter: 'blur(25px)',
                                    pointerEvents: 'none',
                                    zIndex: 0,
                                }} />

                                {/* Left category accent line */}
                                <div className="product-accent-line" style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: '3px',
                                    background: `linear-gradient(180deg, ${accentColor}, ${accentColor}40)`,
                                    borderRadius: '3px 0 0 3px',
                                    opacity: 0,
                                    transition: 'opacity 0.3s ease',
                                    zIndex: 3,
                                }} />

                                {/* Product image area with layered gradients + grid dots pattern */}
                                <div style={{
                                    height: '180px',
                                    background: `linear-gradient(135deg, ${colorBg(product.color)} 0%, var(--bg-tertiary) 60%, ${accentColor}08 100%)`,
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2.5rem',
                                    position: 'relative',
                                    zIndex: 1,
                                    overflow: 'hidden',
                                }}>
                                    {/* Grid dots overlay */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundImage: gridDotsPattern,
                                        backgroundRepeat: 'repeat',
                                        opacity: 0.6,
                                        pointerEvents: 'none',
                                    }} />
                                    {/* Layered gradient */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: '50%',
                                        background: `linear-gradient(to top, ${accentColor}10, transparent)`,
                                        pointerEvents: 'none',
                                    }} />
                                    <span style={{ position: 'relative', zIndex: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>🪟</span>
                                </div>

                                {/* Title + badge */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '8px',
                                    position: 'relative',
                                    zIndex: 1,
                                }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.3 }}>{product.name}</h3>
                                    <span className={`badge ${stockBadge(product.status).cls}`}>{stockBadge(product.status).label}</span>
                                </div>

                                {/* Tags */}
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                                    <span style={{
                                        padding: '2px 8px',
                                        fontSize: '0.7rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-full)',
                                        color: 'var(--text-secondary)',
                                    }}>{product.fabric}</span>
                                    <span style={{
                                        padding: '2px 8px',
                                        fontSize: '0.7rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-full)',
                                        color: 'var(--text-secondary)',
                                    }}>{product.color}</span>
                                    <span style={{
                                        padding: '2px 8px',
                                        fontSize: '0.7rem',
                                        background: `${accentColor}12`,
                                        borderRadius: 'var(--radius-full)',
                                        color: accentColor,
                                        border: `1px solid ${accentColor}25`,
                                    }}>{product.category}</span>
                                </div>

                                {/* Price with gradient text */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    position: 'relative',
                                    zIndex: 1,
                                    marginBottom: '10px',
                                }}>
                                    <span style={{
                                        fontFamily: 'var(--font-display)',
                                        fontWeight: 700,
                                        fontSize: '1.2rem',
                                        background: `linear-gradient(135deg, ${accentColor}, #bc8cff)`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}>₺{product.price.toLocaleString('tr-TR')}</span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Stok: {product.stock}</span>
                                </div>

                                {/* Stock mini progress bar */}
                                <div style={{
                                    position: 'relative',
                                    zIndex: 1,
                                    height: '3px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '2px',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        width: `${stockPct}%`,
                                        height: '100%',
                                        background: `linear-gradient(90deg, ${stockBarColor}, ${stockBarColor}90)`,
                                        borderRadius: '2px',
                                        transition: 'width 0.6s ease',
                                    }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                /* List/table view */
                <div className="table-container" style={{ overflowX: 'auto' }}>
                    <table className="table" role="table" style={{ minWidth: '600px' }}>
                        <thead>
                            <tr>
                                <th scope="col" style={{ width: '24%' }}>Ürün</th>
                                <th scope="col" style={{ width: '14%' }}>Kategori</th>
                                <th scope="col" style={{ width: '12%' }}>Kumaş</th>
                                <th scope="col" style={{ width: '10%' }}>Renk</th>
                                <th scope="col" style={{ width: '12%', textAlign: 'right' }}>Fiyat</th>
                                <th scope="col" style={{ width: '10%', textAlign: 'center' }}>Stok</th>
                                <th scope="col" style={{ width: '10%' }}>Durum</th>
                                <th scope="col" style={{ width: '8%', textAlign: 'center' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(product => {
                                const accent = catColor(product.category)
                                return (
                                    <tr key={product.id}
                                        style={{
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            position: 'relative',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = `${accent}08`
                                            const indicator = e.currentTarget.querySelector('.row-accent-indicator')
                                            if (indicator) indicator.style.opacity = '1'
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = 'transparent'
                                            const indicator = e.currentTarget.querySelector('.row-accent-indicator')
                                            if (indicator) indicator.style.opacity = '0'
                                        }}
                                        onClick={() => setSelectedProduct(product)}>
                                        <td style={{ fontWeight: 600, padding: '14px 16px', position: 'relative' }}>
                                            {/* Row accent indicator */}
                                            <div className="row-accent-indicator" style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: '20%',
                                                bottom: '20%',
                                                width: '3px',
                                                background: accent,
                                                borderRadius: '0 2px 2px 0',
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease',
                                            }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: `linear-gradient(135deg, ${colorBg(product.color)}, ${accent}15)`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.9rem',
                                                    flexShrink: 0,
                                                }}>🪟</span>
                                                <span>{product.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                padding: '3px 10px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                background: `${accent}12`,
                                                borderRadius: 'var(--radius-full)',
                                                color: accent,
                                                border: `1px solid ${accent}25`,
                                            }}>{product.category}</span>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{product.fabric}</td>
                                        <td style={{ padding: '14px 16px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{product.color}</td>
                                        <td style={{
                                            padding: '14px 16px',
                                            textAlign: 'right',
                                            fontWeight: 700,
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '0.95rem',
                                        }}>₺{product.price.toLocaleString('tr-TR')}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{product.stock}</span>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span className={`badge ${stockBadge(product.status).cls}`}>{stockBadge(product.status).label}</span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <button className="btn btn-ghost" style={{
                                                padding: '6px 12px',
                                                fontSize: '0.75rem',
                                                borderRadius: 'var(--radius-sm)',
                                                transition: 'all 0.2s ease',
                                            }}
                                                onClick={(e) => { e.stopPropagation(); openEditModal(product) }}>✏️</button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Injected dynamic styles */}
            <style>{`
                .card:hover .product-accent-line {
                    opacity: 1 !important;
                }
                @keyframes gradient-border-spin {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .card:hover .product-gradient-border {
                    opacity: 0.8 !important;
                    background-size: 200% 200%;
                    animation: gradient-border-spin 3s linear infinite;
                }
            `}</style>

            {/* Product Detail Slide-over */}
            {selectedProduct && (
                <div className="overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="overlay__backdrop" />
                    <div onClick={e => e.stopPropagation()} className="slideover">
                        {/* Top accent gradient line */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: `linear-gradient(90deg, ${catColor(selectedProduct.category)}, #bc8cff, #f778ba)`,
                            zIndex: 10,
                        }} />

                        <div className="overlay__header">
                            <h2 className="overlay__title">Ürün Detay</h2>
                            <button className="btn btn-ghost overlay__close" onClick={() => setSelectedProduct(null)}>✕</button>
                        </div>

                        {/* Hero image with parallax-like gradient layers + mesh */}
                        <div style={{
                            height: '200px',
                            background: `linear-gradient(135deg, ${colorBg(selectedProduct.color)} 0%, var(--bg-tertiary) 50%, ${catColor(selectedProduct.category)}10 100%)`,
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3.5rem',
                            marginBottom: '20px',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            {/* Grid dots pattern overlay */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundImage: gridDotsPattern,
                                backgroundRepeat: 'repeat',
                                opacity: 0.5,
                                pointerEvents: 'none',
                            }} />
                            {/* Gradient mesh layer 1 */}
                            <div style={{
                                position: 'absolute',
                                top: '-20%',
                                right: '-10%',
                                width: '60%',
                                height: '80%',
                                borderRadius: '50%',
                                background: `radial-gradient(ellipse, ${catColor(selectedProduct.category)}25 0%, transparent 70%)`,
                                filter: 'blur(30px)',
                                pointerEvents: 'none',
                            }} />
                            {/* Gradient mesh layer 2 */}
                            <div style={{
                                position: 'absolute',
                                bottom: '-10%',
                                left: '-10%',
                                width: '50%',
                                height: '70%',
                                borderRadius: '50%',
                                background: `radial-gradient(ellipse, #bc8cff18 0%, transparent 70%)`,
                                filter: 'blur(25px)',
                                pointerEvents: 'none',
                            }} />
                            {/* Bottom fade */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '40%',
                                background: 'linear-gradient(to top, var(--bg-secondary), transparent)',
                                pointerEvents: 'none',
                            }} />
                            <span style={{
                                position: 'relative',
                                zIndex: 1,
                                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))',
                            }}>🪟</span>
                        </div>

                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>{selectedProduct.name}</h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                            <span className={`badge ${stockBadge(selectedProduct.status).cls}`}>
                                {stockBadge(selectedProduct.status).label}
                            </span>
                            <span style={{
                                padding: '2px 8px', fontSize: '0.7rem',
                                background: `${catColor(selectedProduct.category)}12`,
                                borderRadius: 'var(--radius-full)',
                                color: catColor(selectedProduct.category),
                                border: `1px solid ${catColor(selectedProduct.category)}25`,
                                fontWeight: 600,
                            }}>{selectedProduct.category}</span>
                        </div>

                        {/* Stats grid with glass-effect cards */}
                        <div className="grid-2-col" style={{ marginTop: '8px' }}>
                            {[
                                { label: 'Kategori', val: selectedProduct.category, bg: `${catColor(selectedProduct.category)}08`, accent: catColor(selectedProduct.category) },
                                { label: 'Kumaş', val: selectedProduct.fabric, bg: 'rgba(88,166,255,0.05)', accent: '#58a6ff' },
                                { label: 'Renk', val: selectedProduct.color, bg: `${colorBg(selectedProduct.color)}`, accent: 'var(--text-secondary)' },
                                { label: 'Stok', val: selectedProduct.stock, bg: selectedProduct.status === 'out' ? 'rgba(248,113,113,0.06)' : selectedProduct.status === 'low' ? 'rgba(251,191,36,0.06)' : 'rgba(74,222,128,0.06)', accent: selectedProduct.status === 'out' ? '#f87171' : selectedProduct.status === 'low' ? '#fbbf24' : '#4ade80' },
                            ].map(({ label, val, bg, accent }) => (
                                <div key={label} style={{
                                    padding: '16px',
                                    background: bg,
                                    borderRadius: 'var(--radius-md)',
                                    border: `1px solid ${accent}15`,
                                    backdropFilter: 'blur(8px)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.25s ease',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = `${accent}40`
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = `0 4px 16px ${accent}10`
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = `${accent}15`
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}>
                                    {/* Subtle inner glow */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '-10px',
                                        right: '-10px',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`,
                                        filter: 'blur(10px)',
                                        pointerEvents: 'none',
                                    }} />
                                    <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontWeight: 600 }}>{label}</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', position: 'relative' }}>{val}</div>
                                </div>
                            ))}
                        </div>

                        {/* Price display with animated gradient background */}
                        <div style={{
                            padding: '24px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-lg)',
                            marginTop: '16px',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            border: '1px solid var(--border-primary)',
                        }}>
                            {/* Animated gradient background */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: `linear-gradient(135deg, ${catColor(selectedProduct.category)}08, #bc8cff08, #f778ba08, ${catColor(selectedProduct.category)}08)`,
                                backgroundSize: '300% 300%',
                                animation: 'gradient-shift 6s ease infinite',
                                pointerEvents: 'none',
                            }} />
                            {/* Glow effect behind price */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '160px',
                                height: '70px',
                                borderRadius: '50%',
                                background: `radial-gradient(circle, ${catColor(selectedProduct.category)}15 0%, #bc8cff10 50%, transparent 80%)`,
                                filter: 'blur(20px)',
                                pointerEvents: 'none',
                            }} />
                            <div style={{
                                fontSize: '0.62rem',
                                color: 'var(--text-tertiary)',
                                textTransform: 'uppercase',
                                marginBottom: '8px',
                                letterSpacing: '0.08em',
                                position: 'relative',
                                fontWeight: 700,
                            }}>Fiyat</div>
                            <div style={{
                                fontSize: '2rem',
                                fontWeight: 800,
                                fontFamily: 'var(--font-display)',
                                background: `linear-gradient(135deg, ${catColor(selectedProduct.category)}, #bc8cff, #f778ba)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                position: 'relative',
                            }}>
                                ₺{selectedProduct.price.toLocaleString('tr-TR')}
                            </div>
                        </div>

                        {/* Action buttons with hover glow */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                            <button className="btn btn-primary" style={{
                                flex: 1,
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.boxShadow = `0 8px 32px ${catColor(selectedProduct.category)}35, inset 0 1px 0 rgba(255,255,255,0.2)`
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(88, 166, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
                                }}
                                onClick={() => { openEditModal(selectedProduct); setSelectedProduct(null) }}>
                                ✏️ Düzenle
                            </button>
                            <button className="btn btn-secondary" style={{
                                color: '#e74c3c',
                                borderColor: 'rgba(231,76,60,0.3)',
                                transition: 'all 0.25s ease',
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(231,76,60,0.2)'
                                    e.currentTarget.style.borderColor = 'rgba(231,76,60,0.5)'
                                    e.currentTarget.style.background = 'rgba(231,76,60,0.08)'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.boxShadow = 'none'
                                    e.currentTarget.style.borderColor = 'rgba(231,76,60,0.3)'
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                                }}
                                onClick={() => setDeleteConfirm(selectedProduct.id)}>🗑️</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="overlay overlay--center" onClick={() => setModalOpen(false)}>
                    <div className="overlay__backdrop" />
                    <div onClick={e => e.stopPropagation()} className="modal-panel modal-panel--lg" style={{
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Top accent gradient line */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: `linear-gradient(90deg, ${catColor(form.category)}, #bc8cff, #f778ba)`,
                            transition: 'background 0.4s ease',
                            zIndex: 10,
                        }} />

                        <div className="overlay__header" style={{ position: 'relative', zIndex: 1 }}>
                            <h3 className="overlay__title">
                                {editingProduct ? '✏️ Ürün Düzenle' : '➕ Yeni Ürün'}
                            </h3>
                            <button className="btn btn-ghost overlay__close" onClick={() => setModalOpen(false)}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', zIndex: 1 }}>
                            <div>
                                <label style={labelStyle}>Ürün Adı *</label>
                                <input className="input" value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="Kadife Fon Perde"
                                    style={{ transition: 'all 0.25s ease' }} />
                            </div>
                            <div className="grid-2-col">
                                <div>
                                    <label style={labelStyle}>Kumaş</label>
                                    <input className="input" value={form.fabric} onChange={e => updateForm('fabric', e.target.value)} placeholder="Kadife"
                                        style={{ transition: 'all 0.25s ease' }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Renk</label>
                                    <input className="input" value={form.color} onChange={e => updateForm('color', e.target.value)} placeholder="Bordo"
                                        style={{ transition: 'all 0.25s ease' }} />
                                </div>
                            </div>
                            <div className="grid-2-col">
                                <div>
                                    <label style={labelStyle}>Fiyat (₺) *</label>
                                    <input className="input" type="number" value={form.price} onChange={e => updateForm('price', e.target.value)} placeholder="1300"
                                        style={{ transition: 'all 0.25s ease' }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Stok</label>
                                    <input className="input" type="number" value={form.stock} onChange={e => updateForm('stock', e.target.value)} placeholder="24"
                                        style={{ transition: 'all 0.25s ease' }} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Kategori</label>
                                {/* Category selector with color previews */}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {categories.filter(c => c !== 'Tümü').map(c => {
                                        const isSelected = form.category === c
                                        const cc = catColor(c)
                                        return (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => updateForm('category', c)}
                                                style={{
                                                    padding: '8px 14px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 600,
                                                    fontFamily: 'var(--font-primary)',
                                                    borderRadius: 'var(--radius-md)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    transition: 'all 0.2s ease',
                                                    border: isSelected ? `1.5px solid ${cc}` : '1px solid var(--border-primary)',
                                                    background: isSelected ? `${cc}15` : 'var(--bg-tertiary)',
                                                    color: isSelected ? cc : 'var(--text-secondary)',
                                                    boxShadow: isSelected ? `0 0 12px ${cc}20` : 'none',
                                                }}
                                            >
                                                <span style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: cc,
                                                    boxShadow: isSelected ? `0 0 6px ${cc}60` : 'none',
                                                    transition: 'box-shadow 0.2s ease',
                                                }} />
                                                {c}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', position: 'relative', zIndex: 1 }}>
                            <button className="btn btn-primary" style={{
                                flex: 1,
                                position: 'relative',
                                overflow: 'hidden',
                            }} onClick={handleSave}>
                                {editingProduct ? '💾 Kaydet' : '➕ Ekle'}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>İptal</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal with dramatic red accent */}
            {deleteConfirm && (
                <div className="overlay overlay--center overlay--top" onClick={() => setDeleteConfirm(null)}>
                    <div className="overlay__backdrop" />
                    <div onClick={e => e.stopPropagation()} className="modal-panel modal-panel--sm modal-panel--danger" style={{
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Red gradient accent line */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: 'linear-gradient(90deg, #e74c3c, #ff6b6b, #e74c3c)',
                            backgroundSize: '200% 100%',
                            animation: 'gradient-shift 3s linear infinite',
                            zIndex: 10,
                        }} />
                        {/* Red glow background */}
                        <div style={{
                            position: 'absolute',
                            top: '-30px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '200px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'radial-gradient(ellipse, rgba(231,76,60,0.15) 0%, transparent 70%)',
                            filter: 'blur(25px)',
                            pointerEvents: 'none',
                        }} />
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '14px',
                            position: 'relative',
                            zIndex: 1,
                            filter: 'drop-shadow(0 4px 12px rgba(231,76,60,0.3))',
                        }}>🗑️</div>
                        <h3 style={{
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            marginBottom: '8px',
                            position: 'relative',
                            zIndex: 1,
                            color: '#f87171',
                        }}>Ürünü Sil</h3>
                        <p style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '24px',
                            position: 'relative',
                            zIndex: 1,
                            lineHeight: 1.6,
                        }}>
                            Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}
                                style={{ minWidth: '80px' }}>İptal</button>
                            <button className="btn btn-primary" onClick={() => handleDelete(deleteConfirm)}
                                style={{
                                    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                                    minWidth: '100px',
                                    boxShadow: '0 4px 20px rgba(231,76,60,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(231,76,60,0.45), inset 0 1px 0 rgba(255,255,255,0.15)'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(231,76,60,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                                }}>
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
