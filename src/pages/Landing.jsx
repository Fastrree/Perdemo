import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../App'

const features = [
    {
        icon: '📊',
        title: 'Akıllı Dashboard',
        desc: 'Satışlarınızı, stoklarınızı ve müşteri eğilimlerini gerçek zamanlı takip edin. Yapay zeka destekli tahminlerle bir adım önde olun.',
        bg: 'rgba(88, 166, 255, 0.1)',
    },
    {
        icon: '🪟',
        title: '360° Perde Demo',
        desc: 'Müşterilerinize perdeleri bir referans pencerede canlı deneyim sunun. Kumaş, renk, desen — anında değiştirin.',
        bg: 'rgba(188, 140, 255, 0.1)',
    },
    {
        icon: '📦',
        title: 'Sipariş Yönetimi',
        desc: 'Üretimden teslimata kadar tüm süreci tek ekrandan yönetin. Ölçü, dikim, montaj — her adım kontrol altında.',
        bg: 'rgba(247, 120, 186, 0.1)',
    },
    {
        icon: '🧵',
        title: 'Stok & Kumaş Takibi',
        desc: 'Kumaş rulolarını metre bazında izleyin. Minimum stok uyarıları ile hiçbir siparişi kaçırmayın.',
        bg: 'rgba(240, 180, 41, 0.1)',
    },
    {
        icon: '👥',
        title: 'Müşteri CRM',
        desc: 'Müşteri geçmişi, ölçü kayıtları, tercih analizleri — kişiselleştirilmiş hizmetin anahtarı.',
        bg: 'rgba(63, 185, 80, 0.1)',
    },
    {
        icon: '📈',
        title: 'Raporlama & Analiz',
        desc: 'Dönemsel satış raporları, kârlılık analizleri ve popüler ürün trendleri ile stratejik kararlar alın.',
        bg: 'rgba(118, 228, 247, 0.1)',
    },
]

const pricingPlans = [
    {
        name: 'Başlangıç',
        desc: 'Küçük perde atölyeleri için',
        price: '₺499',
        period: '/ay',
        features: [
            'Tek mağaza desteği',
            '500 ürün kapasitesi',
            'Temel raporlama',
            '360° Demo (limitli)',
            'E-posta desteği',
        ],
        popular: false,
    },
    {
        name: 'Profesyonel',
        desc: 'Büyüyen perde mağazaları için',
        price: '₺999',
        period: '/ay',
        features: [
            '3 mağaza desteği',
            'Sınırsız ürün',
            'Gelişmiş raporlama',
            '360° Demo (sınırsız)',
            'API erişimi',
            'Öncelikli destek',
        ],
        popular: true,
    },
    {
        name: 'Kurumsal',
        desc: 'Perde zincirleri ve bayiler için',
        price: '₺2.499',
        period: '/ay',
        features: [
            'Sınırsız mağaza',
            'Sınırsız ürün',
            'Özel raporlama',
            '360° Demo (premium)',
            'API + Webhook',
            'Özel entegrasyonlar',
            '7/24 canlı destek',
        ],
        popular: false,
    },
]

export default function Landing() {
    const { theme, toggleTheme } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <div className="landing">
            {/* Navigation */}
            <nav className="landing-nav" role="navigation" aria-label="Ana navigasyon">
                <div className="landing-nav-logo">
                    <div className="logo-icon" aria-hidden="true">P</div>
                    <h1>Perdemo</h1>
                </div>
                <button
                    className="landing-menu-toggle"
                    onClick={() => setMenuOpen(o => !o)}
                    aria-label="Menüyü aç/kapat"
                    aria-expanded={menuOpen}
                >
                    <span /><span /><span />
                </button>
                <div className={`landing-nav-links${menuOpen ? ' open' : ''}`}>
                    <a href="#features" className="landing-nav-link">Özellikler</a>
                    <a href="#pricing" className="landing-nav-link">Fiyatlandırma</a>
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label={`Temayı ${theme === 'dark' ? 'açık' : 'koyu'} moda geçir`}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <Link to="/dashboard" className="btn btn-primary" style={{ marginLeft: '8px' }}>
                        Panele Giriş
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero" aria-labelledby="hero-title">
                <div className="hero-orb hero-orb-1" aria-hidden="true"></div>
                <div className="hero-orb hero-orb-2" aria-hidden="true"></div>
                <div className="hero-orb hero-orb-3" aria-hidden="true"></div>

                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="hero-badge-dot" aria-hidden="true"></span>
                        Perde sektörünün dijital dönüşümü
                    </div>
                    <h2 id="hero-title">
                        <span>Perdeciliği</span>
                        <span className="line-gradient">Yeniden Tanımlıyoruz</span>
                    </h2>
                    <p className="hero-desc">
                        Stok takibinden 360° canlı perde demosuna, müşteri yönetiminden akıllı raporlamaya —
                        perdecilik işinizi tek platformdan yönetin.
                    </p>
                    <div className="hero-actions">
                        <Link to="/dashboard" className="btn btn-primary btn-lg">
                            ✨ Ücretsiz Deneyin
                        </Link>
                        <Link to="/demo" className="btn btn-secondary btn-lg">
                            🎯 360° Demo'yu Keşfet
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features-section" id="features" aria-labelledby="features-title">
                <div className="section-header">
                    <span className="section-label">Özellikler</span>
                    <h2 className="section-title" id="features-title">Perdeciniz İçin Her Şey Tek Yerde</h2>
                    <p className="section-subtitle">
                        Modern perdeciliğin ihtiyaç duyduğu tüm araçlar, güçlü ve sezgisel bir arayüzde.
                    </p>
                </div>
                <div className="features-grid">
                    {features.map((f, i) => (
                        <div
                            key={i}
                            className="feature-card animate-fade-in-up"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        >
                            <div className="feature-icon" style={{ background: f.bg }}>
                                {f.icon}
                            </div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing */}
            <section className="pricing-section" id="pricing" aria-labelledby="pricing-title">
                <div className="section-header">
                    <span className="section-label">Fiyatlandırma</span>
                    <h2 className="section-title" id="pricing-title">İşletmenize Uygun Plan</h2>
                    <p className="section-subtitle">
                        Her ölçekteki perdecilik işletmesi için esnek fiyatlandırma. 14 gün ücretsiz deneyin.
                    </p>
                </div>
                <div className="pricing-grid">
                    {pricingPlans.map((plan, i) => (
                        <div
                            key={i}
                            className={`pricing-card ${plan.popular ? 'popular' : ''} animate-fade-in-up`}
                            style={{ animationDelay: `${i * 0.1}s` }}
                        >
                            {plan.popular && <span className="pricing-badge">En Popüler</span>}
                            <div className="pricing-name">{plan.name}</div>
                            <div className="pricing-desc">{plan.desc}</div>
                            <div className="pricing-price">
                                {plan.price}<span>{plan.period}</span>
                            </div>
                            <ul className="pricing-features">
                                {plan.features.map((feat, fi) => (
                                    <li key={fi}>
                                        <span className="check" aria-hidden="true">✓</span>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to="/dashboard"
                                className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'} btn-lg`}
                                style={{ width: '100%' }}
                            >
                                {plan.popular ? 'Hemen Başla' : 'Deneyin'}
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>© 2026 Perdemo — Tüm hakları saklıdır. Perde sektörünün dijital platformu.</p>
            </footer>
        </div>
    )
}
