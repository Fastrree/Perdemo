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

const categories = ['Tümü', 'Fon Perde', 'Tül Perde', 'Stor Perde', 'Zebra Perde', 'Aksesuar']
const emptyForm = { name: '', fabric: '', color: '', price: '', stock: '', category: 'Fon Perde' }

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

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Ürünler</h1>
                    <p className="page-subtitle">{products.length} ürün kayıtlı</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>+ Yeni Ürün</button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-bar" style={{ maxWidth: '280px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input type="search" className="input input-with-icon" placeholder="Ürün ara..."
                        value={search} onChange={e => setSearch(e.target.value)} aria-label="Ürün ara" />
                </div>
                <div className="tabs" style={{ marginBottom: 0 }}>
                    {categories.map(cat => (
                        <button key={cat} className={`tab ${category === cat ? 'active' : ''}`}
                            onClick={() => setCategory(cat)}>{cat}</button>
                    ))}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                    <button className={`btn btn-icon ${view === 'grid' ? 'btn-secondary' : 'btn-ghost'}`}
                        onClick={() => setView('grid')} aria-label="Grid görünüm">⊞</button>
                    <button className={`btn btn-icon ${view === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
                        onClick={() => setView('list')} aria-label="Liste görünüm">☰</button>
                </div>
            </div>

            {/* Product Grid */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🪟</div>
                    <div className="empty-state-title">Ürün bulunamadı</div>
                    <div className="empty-state-desc">Arama kriterlerinize uygun ürün yok. Filtreleri değiştirmeyi deneyin.</div>
                </div>
            ) : view === 'grid' ? (
                <div className="grid-3">
                    {filtered.map((product, i) => (
                        <div key={product.id} className="card animate-fade-in-up"
                            style={{ animationDelay: `${i * 0.05}s`, cursor: 'pointer' }}
                            onClick={() => setSelectedProduct(product)}>
                            <div style={{
                                height: '160px',
                                background: `linear-gradient(135deg, ${colorBg(product.color)} 0%, var(--bg-tertiary) 100%)`,
                                borderRadius: 'var(--radius-md)', marginBottom: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
                            }}>🪟</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{product.name}</h3>
                                <span className={`badge ${stockBadge(product.status).cls}`}>{stockBadge(product.status).label}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                <span style={{ padding: '2px 8px', fontSize: '0.7rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>{product.fabric}</span>
                                <span style={{ padding: '2px 8px', fontSize: '0.7rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>{product.color}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem' }}>₺{product.price.toLocaleString('tr-TR')}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Stok: {product.stock}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="table-container">
                    <table className="table" role="table">
                        <thead>
                            <tr>
                                <th scope="col">Ürün</th><th scope="col">Kategori</th><th scope="col">Kumaş</th>
                                <th scope="col">Renk</th><th scope="col">Fiyat</th><th scope="col">Stok</th>
                                <th scope="col">Durum</th><th scope="col">İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(product => (
                                <tr key={product.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedProduct(product)}>
                                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                                    <td>{product.category}</td><td>{product.fabric}</td><td>{product.color}</td>
                                    <td style={{ fontWeight: 600 }}>₺{product.price.toLocaleString('tr-TR')}</td>
                                    <td>{product.stock}</td>
                                    <td><span className={`badge ${stockBadge(product.status).cls}`}>{stockBadge(product.status).label}</span></td>
                                    <td>
                                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                            onClick={(e) => { e.stopPropagation(); openEditModal(product) }}>✏️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Product Detail Slide-over */}
            {selectedProduct && (
                <div className="overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="overlay__backdrop" />
                    <div onClick={e => e.stopPropagation()} className="slideover">
                        <div className="overlay__header" style={{ marginBottom: '24px' }}>
                            <h2 className="overlay__title">Ürün Detay</h2>
                            <button className="btn btn-ghost overlay__close" onClick={() => setSelectedProduct(null)}>✕</button>
                        </div>

                        <div style={{
                            height: '180px', background: `linear-gradient(135deg, ${colorBg(selectedProduct.color)} 0%, var(--bg-tertiary) 100%)`,
                            borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '3rem', marginBottom: '20px',
                        }}>🪟</div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>{selectedProduct.name}</h3>
                        <span className={`badge ${stockBadge(selectedProduct.status).cls}`} style={{ marginBottom: '16px', display: 'inline-block' }}>
                            {stockBadge(selectedProduct.status).label}
                        </span>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                            {[
                                ['Kategori', selectedProduct.category],
                                ['Kumaş', selectedProduct.fabric],
                                ['Renk', selectedProduct.color],
                                ['Stok', selectedProduct.stock],
                            ].map(([label, val]) => (
                                <div key={label} style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{val}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginTop: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Fiyat</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                ₺{selectedProduct.price.toLocaleString('tr-TR')}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }}
                                onClick={() => { openEditModal(selectedProduct); setSelectedProduct(null) }}>✏️ Düzenle</button>
                            <button className="btn btn-secondary" style={{ color: '#e74c3c', borderColor: 'rgba(231,76,60,0.3)' }}
                                onClick={() => setDeleteConfirm(selectedProduct.id)}>🗑️</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="overlay overlay--center" onClick={() => setModalOpen(false)}>
                    <div className="overlay__backdrop" />
                    <div onClick={e => e.stopPropagation()} className="modal-panel modal-panel--lg">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>
                            {editingProduct ? '✏️ Ürün Düzenle' : '➕ Yeni Ürün'}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Ürün Adı *</label>
                                <input className="input" value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="Kadife Fon Perde" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Kumaş</label>
                                    <input className="input" value={form.fabric} onChange={e => updateForm('fabric', e.target.value)} placeholder="Kadife" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Renk</label>
                                    <input className="input" value={form.color} onChange={e => updateForm('color', e.target.value)} placeholder="Bordo" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Fiyat (₺) *</label>
                                    <input className="input" type="number" value={form.price} onChange={e => updateForm('price', e.target.value)} placeholder="1300" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Stok</label>
                                    <input className="input" type="number" value={form.stock} onChange={e => updateForm('stock', e.target.value)} placeholder="24" />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Kategori</label>
                                <select className="input" value={form.category} onChange={e => updateForm('category', e.target.value)}>
                                    {categories.filter(c => c !== 'Tümü').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                                {editingProduct ? '💾 Kaydet' : '➕ Ekle'}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>İptal</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="overlay overlay--center overlay--top" onClick={() => setDeleteConfirm(null)}>
                    <div className="overlay__backdrop" />
                    <div onClick={e => e.stopPropagation()} className="modal-panel modal-panel--sm modal-panel--danger">
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗑️</div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>Ürünü Sil</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>İptal</button>
                            <button className="btn btn-primary" onClick={() => handleDelete(deleteConfirm)}
                                style={{ background: '#e74c3c' }}>Evet, Sil</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
