import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../App'

const features = [
    {
        icon: '📊',
        title: 'Akıllı Dashboard',
        desc: 'Satışlarınızı, stoklarınızı ve müşteri eğilimlerini gerçek zamanlı takip edin. Yapay zeka destekli tahminlerle bir adım önde olun.',
        gradient: 'linear-gradient(135deg, #58a6ff 0%, #1e3a5f 100%)',
        glow: 'rgba(88, 166, 255, 0.3)',
    },
    {
        icon: '🪟',
        title: '360° Perde Demo',
        desc: 'Müşterilerinize perdeleri bir referans pencerede canlı deneyim sunun. Kumaş, renk, desen — anında değiştirin.',
        gradient: 'linear-gradient(135deg, #bc8cff 0%, #4a2c7a 100%)',
        glow: 'rgba(188, 140, 255, 0.3)',
    },
    {
        icon: '📦',
        title: 'Sipariş Yönetimi',
        desc: 'Üretimden teslimata kadar tüm süreci tek ekrandan yönetin. Ölçü, dikim, montaj — her adım kontrol altında.',
        gradient: 'linear-gradient(135deg, #f778ba 0%, #7a2c4a 100%)',
        glow: 'rgba(247, 120, 186, 0.3)',
    },
    {
        icon: '🧵',
        title: 'Stok & Kumaş Takibi',
        desc: 'Kumaş rulolarını metre bazında izleyin. Minimum stok uyarıları ile hiçbir siparişi kaçırmayın.',
        gradient: 'linear-gradient(135deg, #f0b429 0%, #7a5a14 100%)',
        glow: 'rgba(240, 180, 41, 0.3)',
    },
    {
        icon: '👥',
        title: 'Müşteri CRM',
        desc: 'Müşteri geçmişi, ölçü kayıtları, tercih analizleri — kişiselleştirilmiş hizmetin anahtarı.',
        gradient: 'linear-gradient(135deg, #2ecc71 0%, #145a32 100%)',
        glow: 'rgba(46, 204, 113, 0.3)',
    },
    {
        icon: '📈',
        title: 'Raporlama & Analiz',
        desc: 'Dönemsel satış raporları, kârlılık analizleri ve popüler ürün trendleri ile stratejik kararlar alın.',
        gradient: 'linear-gradient(135deg, #76e4f7 0%, #1a5a6e 100%)',
        glow: 'rgba(118, 228, 247, 0.3)',
    },
]

const pricingPlans = [
    {
        name: 'Başlangıç',
        desc: 'Küçük perde atölyeleri için',
        price: '₺499',
        period: '/ay',
        features: ['Tek mağaza desteği', '500 ürün kapasitesi', 'Temel raporlama', '360° Demo (limitli)', 'E-posta desteği'],
        popular: false,
        gradient: 'linear-gradient(135deg, rgba(88,166,255,0.1) 0%, rgba(88,166,255,0.02) 100%)',
    },
    {
        name: 'Profesyonel',
        desc: 'Büyüyen perde mağazaları için',
        price: '₺999',
        period: '/ay',
        features: ['3 mağaza desteği', 'Sınırsız ürün', 'Gelişmiş raporlama', '360° Demo (sınırsız)', 'API erişimi', 'Öncelikli destek'],
        popular: true,
        gradient: 'linear-gradient(135deg, rgba(188,140,255,0.15) 0%, rgba(88,166,255,0.1) 100%)',
    },
    {
        name: 'Kurumsal',
        desc: 'Perde zincirleri ve bayiler için',
        price: '₺2.499',
        period: '/ay',
        features: ['Sınırsız mağaza', 'Sınırsız ürün', 'Özel raporlama', '360° Demo (premium)', 'API + Webhook', 'Özel entegrasyonlar', '7/24 canlı destek'],
        popular: false,
        gradient: 'linear-gradient(135deg, rgba(247,120,186,0.1) 0%, rgba(188,140,255,0.05) 100%)',
    },
]

const stats = [
    { value: '2.5K+', label: 'Aktif Kullanıcı' },
    { value: '150K+', label: 'İşlenen Sipariş' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9★', label: 'Kullanıcı Puanı' },
]

const testimonials = [
    { name: 'Ahmet Yılmaz', role: 'Perde Dünyası, İstanbul', text: 'Perdemo ile sipariş takibimiz %40 hızlandı. Müşterilerimiz 3D demo özelliğine bayılıyor!', avatar: '👨‍💼' },
    { name: 'Elif Kaya', role: 'Elif Perde, Ankara', text: 'Stok yönetimi artık çok kolay. Hangi kumaştan ne kadar kaldığını anında görebiliyorum.', avatar: '👩‍💼' },
    { name: 'Mehmet Demir', role: 'Demir Tekstil, İzmir', text: 'Bayi ağımızı tek platformdan yönetiyoruz. Raporlama özellikleri muhteşem!', avatar: '👨‍💼' },
]

function AnimatedCounter({ target, duration = 2000 }) {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const hasAnimated = useRef(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true
                    const numericValue = parseInt(target.replace(/[^0-9]/g, ''))
                    const startTime = Date.now()
                    const animate = () => {
                        const elapsed = Date.now() - startTime
                        const progress = Math.min(elapsed / duration, 1)
                        const easeOut = 1 - Math.pow(1 - progress, 3)
                        setCount(Math.floor(numericValue * easeOut))
                        if (progress < 1) requestAnimationFrame(animate)
                    }
                    animate()
                }
            },
            { threshold: 0.5 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [target, duration])

    const suffix = target.replace(/[0-9.,]/g, '')
    return <span ref={ref}>{count.toLocaleString('tr-TR')}{suffix}</span>
}

export default function Landing() {
    const { theme, toggleTheme } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [activeTestimonial, setActiveTestimonial] = useState(0)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial(prev => (prev + 1) % testimonials.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="landing-page">
            {/* ══════════════════════════════════════════════
                NAVIGATION — Glassmorphism + Scroll Effect
                ══════════════════════════════════════════════ */}
            <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`} role="navigation" aria-label="Ana navigasyon">
                <div className="nav__container">
                    <Link to="/" className="nav__logo">
                        <div className="nav__logo-icon">
                            <span>P</span>
                            <div className="nav__logo-glow" />
                        </div>
                        <span className="nav__logo-text">Perdemo</span>
                    </Link>

                    <button
                        className={`nav__toggle ${menuOpen ? 'nav__toggle--active' : ''}`}
                        onClick={() => setMenuOpen(o => !o)}
                        aria-label="Menüyü aç/kapat"
                        aria-expanded={menuOpen}
                    >
                        <span /><span /><span />
                    </button>

                    <div className={`nav__menu ${menuOpen ? 'nav__menu--open' : ''}`}>
                        <a href="#features" className="nav__link" onClick={() => setMenuOpen(false)}>Özellikler</a>
                        <a href="#pricing" className="nav__link" onClick={() => setMenuOpen(false)}>Fiyatlandırma</a>
                        <a href="#testimonials" className="nav__link" onClick={() => setMenuOpen(false)}>Referanslar</a>
                        <button className="nav__theme-toggle" onClick={toggleTheme} aria-label={`Temayı ${theme === 'dark' ? 'açık' : 'koyu'} moda geçir`}>
                            <span className="nav__theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
                        </button>
                        <Link to="/dashboard" className="nav__cta">
                            Panele Giriş
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ══════════════════════════════════════════════
                HERO — Immersive 3D-like Experience
                ══════════════════════════════════════════════ */}
            <section className="hero" aria-labelledby="hero-title">
                <div className="hero__bg">
                    <div className="hero__grid" />
                    <div className="hero__orb hero__orb--1" />
                    <div className="hero__orb hero__orb--2" />
                    <div className="hero__orb hero__orb--3" />
                    <div className="hero__particles">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="hero__particle" style={{
                                '--delay': `${i * 0.5}s`,
                                '--x': `${Math.random() * 100}%`,
                                '--duration': `${15 + Math.random() * 10}s`,
                            }} />
                        ))}
                    </div>
                </div>

                <div className="hero__content">
                    <div className="hero__badge">
                        <span className="hero__badge-dot" />
                        <span>Perde sektörünün dijital dönüşümü</span>
                        <span className="hero__badge-new">YENİ</span>
                    </div>

                    <h1 id="hero-title" className="hero__title">
                        <span className="hero__title-line">Perdeciliği</span>
                        <span className="hero__title-gradient">Yeniden Tanımlıyoruz</span>
                    </h1>

                    <p className="hero__desc">
                        Stok takibinden 360° canlı perde demosuna, müşteri yönetiminden akıllı raporlamaya —
                        <strong> perdecilik işinizi tek platformdan yönetin.</strong>
                    </p>

                    <div className="hero__actions">
                        <Link to="/dashboard" className="hero__btn hero__btn--primary">
                            <span className="hero__btn-bg" />
                            <span className="hero__btn-content">
                                <span className="hero__btn-icon">✨</span>
                                Ücretsiz Deneyin
                            </span>
                        </Link>
                        <Link to="/demo" className="hero__btn hero__btn--secondary">
                            <span className="hero__btn-content">
                                <span className="hero__btn-icon">🎯</span>
                                360° Demo'yu Keşfet
                            </span>
                        </Link>
                    </div>

                    <div className="hero__stats">
                        {stats.map((stat, i) => (
                            <div key={i} className="hero__stat">
                                <div className="hero__stat-value">
                                    <AnimatedCounter target={stat.value} />
                                </div>
                                <div className="hero__stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hero__scroll-indicator">
                    <span>Keşfet</span>
                    <div className="hero__scroll-arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                FEATURES — Bento Grid Style
                ══════════════════════════════════════════════ */}
            <section className="features" id="features" aria-labelledby="features-title">
                <div className="features__container">
                    <div className="section-header">
                        <span className="section-header__label">
                            <span className="section-header__label-icon">⚡</span>
                            Özellikler
                        </span>
                        <h2 className="section-header__title" id="features-title">
                            Perdeciniz İçin <span className="text-gradient">Her Şey</span> Tek Yerde
                        </h2>
                        <p className="section-header__desc">
                            Modern perdeciliğin ihtiyaç duyduğu tüm araçlar, güçlü ve sezgisel bir arayüzde.
                        </p>
                    </div>

                    <div className="features__grid">
                        {features.map((f, i) => (
                            <article
                                key={i}
                                className={`feature-card feature-card--${i === 0 ? 'large' : 'normal'}`}
                                style={{ '--card-gradient': f.gradient, '--card-glow': f.glow, '--delay': `${i * 0.1}s` }}
                            >
                                <div className="feature-card__glow" />
                                <div className="feature-card__icon">
                                    <span>{f.icon}</span>
                                </div>
                                <h3 className="feature-card__title">{f.title}</h3>
                                <p className="feature-card__desc">{f.desc}</p>
                                <div className="feature-card__arrow">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                TESTIMONIALS — Social Proof
                ══════════════════════════════════════════════ */}
            <section className="testimonials" id="testimonials" aria-labelledby="testimonials-title">
                <div className="testimonials__container">
                    <div className="section-header">
                        <span className="section-header__label">
                            <span className="section-header__label-icon">💬</span>
                            Referanslar
                        </span>
                        <h2 className="section-header__title" id="testimonials-title">
                            Müşterilerimiz <span className="text-gradient">Ne Diyor?</span>
                        </h2>
                    </div>

                    <div className="testimonials__carousel">
                        {testimonials.map((t, i) => (
                            <div key={i} className={`testimonial-card ${i === activeTestimonial ? 'testimonial-card--active' : ''}`}>
                                <div className="testimonial-card__quote">"</div>
                                <p className="testimonial-card__text">{t.text}</p>
                                <div className="testimonial-card__author">
                                    <div className="testimonial-card__avatar">{t.avatar}</div>
                                    <div className="testimonial-card__info">
                                        <div className="testimonial-card__name">{t.name}</div>
                                        <div className="testimonial-card__role">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="testimonials__dots">
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                className={`testimonials__dot ${i === activeTestimonial ? 'testimonials__dot--active' : ''}`}
                                onClick={() => setActiveTestimonial(i)}
                                aria-label={`Referans ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                PRICING — Premium Cards
                ══════════════════════════════════════════════ */}
            <section className="pricing" id="pricing" aria-labelledby="pricing-title">
                <div className="pricing__container">
                    <div className="section-header">
                        <span className="section-header__label">
                            <span className="section-header__label-icon">💎</span>
                            Fiyatlandırma
                        </span>
                        <h2 className="section-header__title" id="pricing-title">
                            İşletmenize <span className="text-gradient">Uygun Plan</span>
                        </h2>
                        <p className="section-header__desc">
                            Her ölçekteki perdecilik işletmesi için esnek fiyatlandırma. <strong>14 gün ücretsiz deneyin.</strong>
                        </p>
                    </div>

                    <div className="pricing__grid">
                        {pricingPlans.map((plan, i) => (
                            <article
                                key={i}
                                className={`pricing-card ${plan.popular ? 'pricing-card--popular' : ''}`}
                                style={{ '--card-bg': plan.gradient, '--delay': `${i * 0.15}s` }}
                            >
                                {plan.popular && (
                                    <div className="pricing-card__badge">
                                        <span>⭐ En Popüler</span>
                                    </div>
                                )}
                                <div className="pricing-card__header">
                                    <h3 className="pricing-card__name">{plan.name}</h3>
                                    <p className="pricing-card__desc">{plan.desc}</p>
                                </div>
                                <div className="pricing-card__price">
                                    <span className="pricing-card__price-value">{plan.price}</span>
                                    <span className="pricing-card__price-period">{plan.period}</span>
                                </div>
                                <ul className="pricing-card__features">
                                    {plan.features.map((feat, fi) => (
                                        <li key={fi}>
                                            <span className="pricing-card__check">✓</span>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to="/dashboard"
                                    className={`pricing-card__btn ${plan.popular ? 'pricing-card__btn--primary' : ''}`}
                                >
                                    {plan.popular ? 'Hemen Başla' : 'Deneyin'}
                                </Link>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                CTA — Final Push
                ══════════════════════════════════════════════ */}
            <section className="cta">
                <div className="cta__bg">
                    <div className="cta__orb cta__orb--1" />
                    <div className="cta__orb cta__orb--2" />
                </div>
                <div className="cta__container">
                    <h2 className="cta__title">Perdeciliğinizi Dijitalleştirmeye Hazır mısınız?</h2>
                    <p className="cta__desc">14 gün ücretsiz deneyin, kredi kartı gerekmez.</p>
                    <div className="cta__actions">
                        <Link to="/dashboard" className="cta__btn cta__btn--primary">
                            Ücretsiz Başla
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <a href="#features" className="cta__btn cta__btn--secondary">Daha Fazla Bilgi</a>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                FOOTER
                ══════════════════════════════════════════════ */}
            <footer className="footer">
                <div className="footer__container">
                    <div className="footer__brand">
                        <div className="footer__logo">
                            <div className="footer__logo-icon">P</div>
                            <span>Perdemo</span>
                        </div>
                        <p className="footer__tagline">Perde sektörünün dijital platformu</p>
                    </div>
                    <div className="footer__links">
                        <div className="footer__column">
                            <h4>Ürün</h4>
                            <a href="#features">Özellikler</a>
                            <a href="#pricing">Fiyatlandırma</a>
                            <Link to="/demo">Demo</Link>
                        </div>
                        <div className="footer__column">
                            <h4>Şirket</h4>
                            <a href="#testimonials">Hakkımızda</a>
                            <a href="#testimonials">Referanslar</a>
                            <a href="#pricing">İletişim</a>
                        </div>
                        <div className="footer__column">
                            <h4>Destek</h4>
                            <a href="#features">Yardım Merkezi</a>
                            <a href="#features">API Dokümantasyon</a>
                            <a href="#features">Durum</a>
                        </div>
                    </div>
                </div>
                <div className="footer__bottom">
                    <p>© 2026 Perdemo — Tüm hakları saklıdır.</p>
                    <div className="footer__social">
                        <a href="#" aria-label="Twitter">𝕏</a>
                        <a href="#" aria-label="LinkedIn">in</a>
                        <a href="#" aria-label="Instagram">📷</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
