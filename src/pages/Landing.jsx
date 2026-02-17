import { useState, useEffect, useRef, memo } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../App'

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */
const features = [
    { icon: '🎯', title: '360° Canlı Demo', desc: 'Müşterilerinize perdeleri gerçek zamanlı gösterin. Kumaş, renk, ışık — hepsini anında değiştirin.', tag: 'EN POPÜLER', color: '#bc8cff' },
    { icon: '📊', title: 'Akıllı Dashboard', desc: 'AI destekli satış tahminleri, stok uyarıları ve müşteri analizleri tek ekranda.', color: '#58a6ff' },
    { icon: '📦', title: 'Sipariş Takibi', desc: 'Üretimden montaja kadar her adımı izleyin. Müşterilerinizi otomatik bilgilendirin.', color: '#2ecc71' },
    { icon: '🧵', title: 'Stok Yönetimi', desc: 'Kumaş rulolarını metre bazında takip edin. Kritik stok uyarıları alın.', color: '#f0b429' },
    { icon: '👥', title: 'Müşteri CRM', desc: 'Ölçü geçmişi, tercihler, satın alma davranışları — hepsi kayıt altında.', color: '#f778ba' },
    { icon: '📈', title: 'Gelişmiş Raporlar', desc: 'Kârlılık analizleri, trend raporları, bayi performansları.', color: '#76e4f7' },
]

const stats = [
    { value: '2,847', label: 'Aktif Perdeci', suffix: '' },
    { value: '156', label: 'Bin Sipariş', suffix: 'K+' },
    { value: '99.9', label: 'Uptime', suffix: '%' },
    { value: '4.9', label: 'App Store', suffix: '★' },
]

const logos = ['Koçtaş', 'Bauhaus', 'Tekzen', 'Evidea', 'Kelebek', 'İstikbal']

const testimonials = [
    { text: 'Perdemo ile siparişlerimiz %40 arttı. 3D demo müşterileri ikna ediyor.', author: 'Ahmet Y.', company: 'Perde Dünyası', city: 'İstanbul' },
    { text: 'Stok takibi artık çocuk oyuncağı. Hangi kumaştan ne kaldı anında görüyorum.', author: 'Elif K.', company: 'Elif Perde', city: 'Ankara' },
    { text: '12 bayimizi tek panelden yönetiyoruz. Raporlama muhteşem.', author: 'Mehmet D.', company: 'Demir Tekstil', city: 'İzmir' },
]

const plans = [
    { name: 'Starter', price: '499', desc: 'Küçük atölyeler için', features: ['1 mağaza', '500 ürün', 'Temel raporlar', 'E-posta destek'] },
    { name: 'Pro', price: '999', desc: 'Büyüyen mağazalar için', features: ['3 mağaza', 'Sınırsız ürün', '360° Demo', 'API erişimi', 'Öncelikli destek'], popular: true },
    { name: 'Enterprise', price: '2,499', desc: 'Zincirler ve bayiler için', features: ['Sınırsız mağaza', 'Özel entegrasyon', 'Dedicated manager', '7/24 destek', 'SLA garantisi'] },
]

/* ═══════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
const Counter = memo(function Counter({ value, suffix = '' }) {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const animated = useRef(false)

    useEffect(() => {
        const observer = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !animated.current) {
                animated.current = true
                const target = parseFloat(value.replace(/,/g, ''))
                const duration = 2000
                const start = performance.now()
                const tick = (now) => {
                    const p = Math.min((now - start) / duration, 1)
                    const ease = 1 - Math.pow(1 - p, 4)
                    setCount(target * ease)
                    if (p < 1) requestAnimationFrame(tick)
                }
                requestAnimationFrame(tick)
            }
        }, { threshold: 0.5 })
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [value])

    const formatted = count >= 1000 ? count.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) 
        : count % 1 === 0 ? count.toFixed(0) : count.toFixed(1)
    return <span ref={ref}>{formatted}{suffix}</span>
})

const Marquee = memo(function Marquee({ items }) {
    return (
        <div className="marquee">
            <div className="marquee__track">
                {[...items, ...items].map((item, i) => (
                    <span key={i} className="marquee__item">{item}</span>
                ))}
            </div>
        </div>
    )
})

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function Landing() {
    const { theme, toggleTheme } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [activeTesti, setActiveTesti] = useState(0)
    const heroRef = useRef(null)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        const id = setInterval(() => setActiveTesti(p => (p + 1) % testimonials.length), 5000)
        return () => clearInterval(id)
    }, [])

    // Mouse parallax for hero
    useEffect(() => {
        const hero = heroRef.current
        if (!hero) return
        const onMove = (e) => {
            const { clientX, clientY } = e
            const { innerWidth, innerHeight } = window
            const x = (clientX / innerWidth - 0.5) * 30
            const y = (clientY / innerHeight - 0.5) * 30
            hero.style.setProperty('--mx', `${x}px`)
            hero.style.setProperty('--my', `${y}px`)
        }
        window.addEventListener('mousemove', onMove, { passive: true })
        return () => window.removeEventListener('mousemove', onMove)
    }, [])

    return (
        <div className="lp">
            {/* ═══════ NAVBAR ═══════ */}
            <header className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
                <div className="lp-nav__inner">
                    <Link to="/" className="lp-nav__brand">
                        <div className="lp-nav__logo">P</div>
                        <span className="lp-nav__wordmark">Perdemo</span>
                    </Link>

                    <nav className={`lp-nav__menu ${menuOpen ? 'lp-nav__menu--open' : ''}`}>
                        <a href="#features" onClick={() => setMenuOpen(false)}>Özellikler</a>
                        <a href="#pricing" onClick={() => setMenuOpen(false)}>Fiyatlar</a>
                        <a href="#testimonials" onClick={() => setMenuOpen(false)}>Referanslar</a>
                        <Link to="/demo" onClick={() => setMenuOpen(false)}>Demo</Link>
                    </nav>

                    <div className="lp-nav__actions">
                        <button className="lp-nav__theme" onClick={toggleTheme} aria-label="Tema değiştir">
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                        <Link to="/dashboard" className="lp-nav__cta">
                            Giriş Yap <span>→</span>
                        </Link>
                        <button className={`lp-nav__burger ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menü">
                            <span /><span /><span />
                        </button>
                    </div>
                </div>
            </header>

            {/* ═══════ HERO ═══════ */}
            <section className="lp-hero" ref={heroRef}>
                <div className="lp-hero__bg">
                    <div className="lp-hero__gradient" />
                    <div className="lp-hero__grid" />
                    <div className="lp-hero__orb lp-hero__orb--1" />
                    <div className="lp-hero__orb lp-hero__orb--2" />
                    <div className="lp-hero__orb lp-hero__orb--3" />
                    <div className="lp-hero__glow" />
                </div>

                <div className="lp-hero__content">
                    <div className="lp-hero__eyebrow">
                        <span className="lp-hero__pulse" />
                        <span>Türkiye'nin #1 Perde Yönetim Platformu</span>
                    </div>

                    <h1 className="lp-hero__title">
                        Perdeciliği<br />
                        <span className="lp-hero__gradient-text">Yeniden Keşfedin</span>
                    </h1>

                    <p className="lp-hero__subtitle">
                        Stok takibi, 3D demo, sipariş yönetimi, müşteri CRM —<br />
                        <strong>tüm perdecilik operasyonunuz tek platformda.</strong>
                    </p>

                    <div className="lp-hero__ctas">
                        <Link to="/dashboard" className="lp-btn lp-btn--primary lp-btn--xl">
                            <span className="lp-btn__shine" />
                            <span className="lp-btn__text">Ücretsiz Başla</span>
                            <span className="lp-btn__arrow">→</span>
                        </Link>
                        <Link to="/demo" className="lp-btn lp-btn--ghost lp-btn--xl">
                            <span className="lp-btn__icon">▶</span>
                            <span className="lp-btn__text">Demo İzle</span>
                        </Link>
                    </div>

                    <div className="lp-hero__proof">
                        <div className="lp-hero__avatars">
                            {['🧑‍💼', '👩‍💼', '👨‍💼', '👩‍🦰', '🧔'].map((a, i) => (
                                <div key={i} className="lp-hero__avatar" style={{ '--i': i }}>{a}</div>
                            ))}
                        </div>
                        <div className="lp-hero__proof-text">
                            <strong>2,500+</strong> perdeci güveniyor
                            <span className="lp-hero__stars">★★★★★</span>
                        </div>
                    </div>
                </div>

                <div className="lp-hero__visual">
                    <div className="lp-hero__mockup">
                        <div className="lp-hero__screen">
                            <div className="lp-hero__screen-header">
                                <span /><span /><span />
                            </div>
                            <div className="lp-hero__screen-content">
                                <div className="lp-hero__ui-row">
                                    <div className="lp-hero__ui-card lp-hero__ui-card--blue">
                                        <div className="lp-hero__ui-label">Bugünkü Satış</div>
                                        <div className="lp-hero__ui-value">₺24,850</div>
                                        <div className="lp-hero__ui-trend">↑ 12%</div>
                                    </div>
                                    <div className="lp-hero__ui-card lp-hero__ui-card--purple">
                                        <div className="lp-hero__ui-label">Aktif Sipariş</div>
                                        <div className="lp-hero__ui-value">47</div>
                                        <div className="lp-hero__ui-trend">↑ 8%</div>
                                    </div>
                                </div>
                                <div className="lp-hero__ui-chart">
                                    <svg viewBox="0 0 200 60" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#58a6ff" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="#58a6ff" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M0,50 Q25,45 50,35 T100,25 T150,30 T200,15 V60 H0 Z" fill="url(#chartGrad)" />
                                        <path d="M0,50 Q25,45 50,35 T100,25 T150,30 T200,15" fill="none" stroke="#58a6ff" strokeWidth="2" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <a href="#features" className="lp-hero__scroll">
                    <span>Keşfet</span>
                    <div className="lp-hero__scroll-icon">↓</div>
                </a>
            </section>

            {/* ═══════ LOGOS ═══════ */}
            <section className="lp-logos">
                <p className="lp-logos__label">Türkiye'nin önde gelen markaları güveniyor</p>
                <Marquee items={logos} />
            </section>

            {/* ═══════ STATS ═══════ */}
            <section className="lp-stats">
                <div className="lp-stats__inner">
                    {stats.map((s, i) => (
                        <div key={i} className="lp-stat">
                            <div className="lp-stat__value">
                                <Counter value={s.value} suffix={s.suffix} />
                            </div>
                            <div className="lp-stat__label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════ FEATURES ═══════ */}
            <section className="lp-features" id="features">
                <div className="lp-section__header">
                    <span className="lp-section__eyebrow">✦ Özellikler</span>
                    <h2 className="lp-section__title">
                        Perdeciniz için<br /><span className="lp-gradient-text">ihtiyacınız olan her şey</span>
                    </h2>
                    <p className="lp-section__desc">
                        Satıştan üretime, stoktan müşteri ilişkilerine — tek platform.
                    </p>
                </div>

                <div className="lp-features__grid">
                    {features.map((f, i) => (
                        <article key={i} className={`lp-feature ${i === 0 ? 'lp-feature--hero' : ''}`} style={{ '--accent': f.color, '--delay': `${i * 0.1}s` }}>
                            {f.tag && <span className="lp-feature__tag">{f.tag}</span>}
                            <div className="lp-feature__icon">{f.icon}</div>
                            <h3 className="lp-feature__title">{f.title}</h3>
                            <p className="lp-feature__desc">{f.desc}</p>
                            <div className="lp-feature__link">
                                Daha fazla <span>→</span>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* ═══════ SHOWCASE ═══════ */}
            <section className="lp-showcase">
                <div className="lp-showcase__inner">
                    <div className="lp-showcase__content">
                        <span className="lp-section__eyebrow">✦ 360° Demo</span>
                        <h2 className="lp-section__title">
                            Perdeyi satmadan<br /><span className="lp-gradient-text">önce gösterin</span>
                        </h2>
                        <p className="lp-section__desc">
                            Müşteriniz kumaşı, rengi, deseni gerçek zamanlı değiştirsin. 
                            Satın alma kararını kolaylaştırın.
                        </p>
                        <ul className="lp-showcase__list">
                            <li><span>✓</span> Gerçek zamanlı kumaş değişimi</li>
                            <li><span>✓</span> Gün ışığı simülasyonu</li>
                            <li><span>✓</span> Ölçü bazlı görselleştirme</li>
                            <li><span>✓</span> Müşteri ile canlı paylaşım</li>
                        </ul>
                        <Link to="/demo" className="lp-btn lp-btn--primary">
                            Demo'yu Dene <span>→</span>
                        </Link>
                    </div>
                    <div className="lp-showcase__visual">
                        <div className="lp-showcase__frame">
                            <div className="lp-showcase__window">
                                <div className="lp-showcase__curtain" />
                                <div className="lp-showcase__curtain" />
                            </div>
                            <div className="lp-showcase__controls">
                                <div className="lp-showcase__swatch" style={{ background: '#8B4513' }} />
                                <div className="lp-showcase__swatch lp-showcase__swatch--active" style={{ background: '#DC143C' }} />
                                <div className="lp-showcase__swatch" style={{ background: '#1E3A5F' }} />
                                <div className="lp-showcase__swatch" style={{ background: '#F5F5DC' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ TESTIMONIALS ═══════ */}
            <section className="lp-testimonials" id="testimonials">
                <div className="lp-section__header">
                    <span className="lp-section__eyebrow">✦ Referanslar</span>
                    <h2 className="lp-section__title">
                        Perdeciler<br /><span className="lp-gradient-text">ne diyor?</span>
                    </h2>
                </div>

                <div className="lp-testimonials__carousel">
                    {testimonials.map((t, i) => (
                        <blockquote key={i} className={`lp-testimonial ${i === activeTesti ? 'lp-testimonial--active' : ''}`}>
                            <p className="lp-testimonial__text">"{t.text}"</p>
                            <footer className="lp-testimonial__author">
                                <div className="lp-testimonial__avatar">{t.author[0]}</div>
                                <div>
                                    <strong>{t.author}</strong>
                                    <span>{t.company}, {t.city}</span>
                                </div>
                            </footer>
                        </blockquote>
                    ))}
                </div>

                <div className="lp-testimonials__dots">
                    {testimonials.map((_, i) => (
                        <button key={i} className={`lp-dot ${i === activeTesti ? 'lp-dot--active' : ''}`} onClick={() => setActiveTesti(i)} aria-label={`Referans ${i + 1}`} />
                    ))}
                </div>
            </section>

            {/* ═══════ PRICING ═══════ */}
            <section className="lp-pricing" id="pricing">
                <div className="lp-section__header">
                    <span className="lp-section__eyebrow">✦ Fiyatlandırma</span>
                    <h2 className="lp-section__title">
                        İşletmenize<br /><span className="lp-gradient-text">uygun plan</span>
                    </h2>
                    <p className="lp-section__desc">
                        14 gün ücretsiz deneyin. Kredi kartı gerekmez.
                    </p>
                </div>

                <div className="lp-pricing__grid">
                    {plans.map((p, i) => (
                        <article key={i} className={`lp-plan ${p.popular ? 'lp-plan--popular' : ''}`} style={{ '--delay': `${i * 0.15}s` }}>
                            {p.popular && <div className="lp-plan__badge">En Popüler</div>}
                            <div className="lp-plan__header">
                                <h3 className="lp-plan__name">{p.name}</h3>
                                <p className="lp-plan__desc">{p.desc}</p>
                            </div>
                            <div className="lp-plan__price">
                                <span className="lp-plan__currency">₺</span>
                                <span className="lp-plan__amount">{p.price}</span>
                                <span className="lp-plan__period">/ay</span>
                            </div>
                            <ul className="lp-plan__features">
                                {p.features.map((f, fi) => (
                                    <li key={fi}><span>✓</span>{f}</li>
                                ))}
                            </ul>
                            <Link to="/dashboard" className={`lp-btn ${p.popular ? 'lp-btn--primary' : 'lp-btn--outline'} lp-btn--full`}>
                                {p.popular ? 'Hemen Başla' : 'Deneyin'}
                            </Link>
                        </article>
                    ))}
                </div>
            </section>

            {/* ═══════ CTA ═══════ */}
            <section className="lp-cta">
                <div className="lp-cta__bg">
                    <div className="lp-cta__orb lp-cta__orb--1" />
                    <div className="lp-cta__orb lp-cta__orb--2" />
                </div>
                <div className="lp-cta__inner">
                    <h2 className="lp-cta__title">Perdeciliğinizi<br />dijitalleştirmeye hazır mısınız?</h2>
                    <p className="lp-cta__desc">14 gün ücretsiz, kredi kartı yok, iptal ücreti yok.</p>
                    <div className="lp-cta__actions">
                        <Link to="/dashboard" className="lp-btn lp-btn--white lp-btn--xl">
                            Ücretsiz Başla <span>→</span>
                        </Link>
                        <Link to="/demo" className="lp-btn lp-btn--ghost-light lp-btn--xl">
                            Demo İzle
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════ FOOTER ═══════ */}
            <footer className="lp-footer">
                <div className="lp-footer__inner">
                    <div className="lp-footer__brand">
                        <div className="lp-footer__logo">
                            <div className="lp-nav__logo">P</div>
                            <span>Perdemo</span>
                        </div>
                        <p>Perde sektörünün dijital platformu.</p>
                        <div className="lp-footer__social">
                            <a href="#" aria-label="Twitter">𝕏</a>
                            <a href="#" aria-label="LinkedIn">in</a>
                            <a href="#" aria-label="Instagram">📷</a>
                        </div>
                    </div>
                    <div className="lp-footer__links">
                        <div className="lp-footer__col">
                            <h4>Ürün</h4>
                            <a href="#features">Özellikler</a>
                            <a href="#pricing">Fiyatlar</a>
                            <Link to="/demo">Demo</Link>
                            <a href="#">API</a>
                        </div>
                        <div className="lp-footer__col">
                            <h4>Şirket</h4>
                            <a href="#">Hakkımızda</a>
                            <a href="#">Blog</a>
                            <a href="#">Kariyer</a>
                            <a href="#">İletişim</a>
                        </div>
                        <div className="lp-footer__col">
                            <h4>Destek</h4>
                            <a href="#">Yardım Merkezi</a>
                            <a href="#">Dokümantasyon</a>
                            <a href="#">Durum</a>
                            <a href="#">Güvenlik</a>
                        </div>
                    </div>
                </div>
                <div className="lp-footer__bottom">
                    <p>© 2026 Perdemo. Tüm hakları saklıdır.</p>
                    <div className="lp-footer__legal">
                        <a href="#">Gizlilik</a>
                        <a href="#">Kullanım Şartları</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
