import { useState, useEffect, useRef, memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../App'
import LanguageSwitcher from '../components/LanguageSwitcher'

/* ═══════════════════════════════════════════════════════════════
   DATA (static, non-translatable)
   ═══════════════════════════════════════════════════════════════ */
const featureLinks = ['/demo', '/dashboard', '/orders', '/inventory-oracle', '/customers', '/analytics']
const featureColors = ['#bc8cff', '#58a6ff', '#2ecc71', '#f0b429', '#f778ba', '#76e4f7']

const curtainColors = [
    { color: '#8B4513', nameKey: 'showcase.colors.brown' },
    { color: '#DC143C', nameKey: 'showcase.colors.burgundy' },
    { color: '#1E3A5F', nameKey: 'showcase.colors.navy' },
    { color: '#F5F5DC', nameKey: 'showcase.colors.cream' },
]

const logos = ['Koçtaş', 'Bauhaus', 'Tekzen', 'Evidea', 'Kelebek', 'İstikbal']

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
    const { t } = useTranslation('landing')
    const { theme, toggleTheme } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [activeTesti, setActiveTesti] = useState(0)
    const [curtainColor, setCurtainColor] = useState('#DC143C')

    const stats = t('stats', { returnObjects: true })
    const featureItems = t('features.items', { returnObjects: true })
    const showcaseList = t('showcase.list', { returnObjects: true })
    const testimonialsItems = t('testimonials.items', { returnObjects: true })
    const pricingPlans = t('pricing.plans', { returnObjects: true })

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        const id = setInterval(() => setActiveTesti(p => (p + 1) % testimonialsItems.length), 5000)
        return () => clearInterval(id)
    }, [testimonialsItems.length])

    return (
        <div className="lp">
            {/* ═══════ NAVBAR ═══════ */}
            <header className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
                <div className="lp-nav__inner">
                    <button
                        className="lp-nav__brand"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        aria-label={t('nav.scrollTop')}
                    >
                        <div className="lp-nav__logo">P</div>
                        <span className="lp-nav__wordmark">Perdemo</span>
                    </button>

                    <nav className={`lp-nav__menu ${menuOpen ? 'lp-nav__menu--open' : ''}`}>
                        <a href="#features" onClick={() => setMenuOpen(false)}>{t('nav.features')}</a>
                        <a href="#pricing" onClick={() => setMenuOpen(false)}>{t('nav.pricing')}</a>
                        <a href="#testimonials" onClick={() => setMenuOpen(false)}>{t('nav.testimonials')}</a>
                        <Link to="/demo" onClick={() => setMenuOpen(false)}>{t('nav.demo')}</Link>
                    </nav>

                    <div className="lp-nav__actions">
                        <LanguageSwitcher />
                        <button className="lp-nav__theme" onClick={toggleTheme} aria-label={t('nav.toggleTheme')} data-tooltip={t('nav.toggleTheme')}>
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                        <Link to="/dashboard" className="lp-nav__cta">
                            {t('nav.login')} <span>→</span>
                        </Link>
                        <button className={`lp-nav__burger ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label={t('nav.menu')}>
                            <span /><span /><span />
                        </button>
                    </div>
                </div>
            </header>

            {/* ═══════ HERO ═══════ */}
            <section className="lp-hero">
                <div className="lp-hero__bg">
                    <div className="lp-hero__gradient" />
                    <div className="lp-hero__orb lp-hero__orb--1" />
                    <div className="lp-hero__orb lp-hero__orb--2" />
                    <div className="lp-hero__orb lp-hero__orb--3" />
                </div>

                <div className="lp-hero__content">
                    <div className="lp-hero__eyebrow">
                        <span className="lp-hero__pulse" />
                        <span>{t('hero.eyebrow')}</span>
                    </div>

                    <h1 className="lp-hero__title">
                        {t('hero.title1')}<br />
                        <span className="lp-hero__gradient-text">{t('hero.title2')}</span>
                    </h1>

                    <p className="lp-hero__subtitle">
                        {t('hero.subtitle')}<br />
                        <strong>{t('hero.subtitleBold')}</strong>
                    </p>

                    <div className="lp-hero__ctas">
                        <Link to="/dashboard" className="lp-btn lp-btn--primary lp-btn--xl">
                            <span className="lp-btn__shine" />
                            <span className="lp-btn__text">{t('hero.cta')}</span>
                            <span className="lp-btn__arrow">→</span>
                        </Link>
                        <Link to="/demo" className="lp-btn lp-btn--ghost lp-btn--xl">
                            <span className="lp-btn__icon">▶</span>
                            <span className="lp-btn__text">{t('hero.ctaDemo')}</span>
                        </Link>
                    </div>

                    <div className="lp-hero__proof">
                        <div className="lp-hero__avatars">
                            {['🧑‍💼', '👩‍💼', '👨‍💼', '👩‍🦰', '🧔'].map((a, i) => (
                                <div key={i} className="lp-hero__avatar" style={{ '--i': i }}>{a}</div>
                            ))}
                        </div>
                        <div className="lp-hero__proof-text">
                            <strong>{t('hero.proofCount')}</strong> {t('hero.proofText')}
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
                                        <div className="lp-hero__ui-label">{t('hero.todaySales')}</div>
                                        <div className="lp-hero__ui-value">₺24,850</div>
                                        <div className="lp-hero__ui-trend">↑ 12%</div>
                                    </div>
                                    <div className="lp-hero__ui-card lp-hero__ui-card--purple">
                                        <div className="lp-hero__ui-label">{t('hero.activeOrders')}</div>
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
                    <span>{t('hero.scroll')}</span>
                    <div className="lp-hero__scroll-icon">↓</div>
                </a>
            </section>

            {/* ═══════ LOGOS ═══════ */}
            <section className="lp-logos">
                <p className="lp-logos__label">{t('logos.label')}</p>
                <Marquee items={logos} />
            </section>

            {/* ═══════ STATS ═══════ */}
            <section className="lp-stats">
                <div className="lp-stats__inner">
                    {Array.isArray(stats) && stats.map((s, i) => (
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
                    <span className="lp-section__eyebrow">{t('features.eyebrow')}</span>
                    <h2 className="lp-section__title">
                        {t('features.title1')}<br /><span className="lp-gradient-text">{t('features.title2')}</span>
                    </h2>
                    <p className="lp-section__desc">
                        {t('features.desc')}
                    </p>
                </div>

                <div className="lp-features__grid">
                    {Array.isArray(featureItems) && featureItems.map((f, i) => (
                        <Link key={i} to={featureLinks[i]} className={`lp-feature ${i === 0 ? 'lp-feature--hero' : ''}`} style={{ '--accent': featureColors[i], '--delay': `${i * 0.1}s`, textDecoration: 'none', color: 'inherit' }}>
                            {f.tag && <span className="lp-feature__tag">{f.tag}</span>}
                            <div className="lp-feature__icon">{f.icon}</div>
                            <h3 className="lp-feature__title">{f.title}</h3>
                            <p className="lp-feature__desc">{f.desc}</p>
                            <div className="lp-feature__link">
                                {t('features.explore')} <span>→</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ═══════ SHOWCASE ═══════ */}
            <section className="lp-showcase">
                <div className="lp-showcase__inner">
                    <div className="lp-showcase__content">
                        <span className="lp-section__eyebrow">{t('showcase.eyebrow')}</span>
                        <h2 className="lp-section__title">
                            {t('showcase.title1')}<br /><span className="lp-gradient-text">{t('showcase.title2')}</span>
                        </h2>
                        <p className="lp-section__desc">
                            {t('showcase.desc')}
                        </p>
                        <ul className="lp-showcase__list">
                            {Array.isArray(showcaseList) && showcaseList.map((item, i) => (
                                <li key={i}><span>✓</span> {item}</li>
                            ))}
                        </ul>
                        <Link to="/demo" className="lp-btn lp-btn--primary">
                            {t('showcase.cta')} <span>→</span>
                        </Link>
                    </div>
                    <div className="lp-showcase__visual">
                        <div className="lp-showcase__frame">
                            <div className="lp-showcase__window">
                                <div className="lp-showcase__curtain" style={{ background: `linear-gradient(180deg, ${curtainColor} 0%, ${curtainColor}99 100%)` }} />
                                <div className="lp-showcase__curtain" style={{ background: `linear-gradient(180deg, ${curtainColor} 0%, ${curtainColor}99 100%)` }} />
                            </div>
                            <div className="lp-showcase__controls">
                                {curtainColors.map((c) => (
                                    <button
                                        key={c.color}
                                        className={`lp-showcase__swatch ${curtainColor === c.color ? 'lp-showcase__swatch--active' : ''}`}
                                        style={{ background: c.color }}
                                        onClick={() => setCurtainColor(c.color)}
                                        aria-label={t(c.nameKey)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ TESTIMONIALS ═══════ */}
            <section className="lp-testimonials" id="testimonials">
                <div className="lp-section__header">
                    <span className="lp-section__eyebrow">{t('testimonials.eyebrow')}</span>
                    <h2 className="lp-section__title">
                        {t('testimonials.title1')}<br /><span className="lp-gradient-text">{t('testimonials.title2')}</span>
                    </h2>
                </div>

                <div className="lp-testimonials__carousel">
                    {Array.isArray(testimonialsItems) && testimonialsItems.map((ti, i) => (
                        <blockquote key={i} className={`lp-testimonial ${i === activeTesti ? 'lp-testimonial--active' : ''}`}>
                            <p className="lp-testimonial__text">"{ti.text}"</p>
                            <footer className="lp-testimonial__author">
                                <div className="lp-testimonial__avatar">{ti.author[0]}</div>
                                <div>
                                    <strong>{ti.author}</strong>
                                    <span>{ti.company}, {ti.city}</span>
                                </div>
                            </footer>
                        </blockquote>
                    ))}
                </div>

                <div className="lp-testimonials__dots">
                    {Array.isArray(testimonialsItems) && testimonialsItems.map((_, i) => (
                        <button key={i} className={`lp-dot ${i === activeTesti ? 'lp-dot--active' : ''}`} onClick={() => setActiveTesti(i)} aria-label={`${t('testimonials.ariaLabel')} ${i + 1}`} />
                    ))}
                </div>
            </section>

            {/* ═══════ PRICING ═══════ */}
            <section className="lp-pricing" id="pricing">
                <div className="lp-section__header">
                    <span className="lp-section__eyebrow">{t('pricing.eyebrow')}</span>
                    <h2 className="lp-section__title">
                        {t('pricing.title1')}<br /><span className="lp-gradient-text">{t('pricing.title2')}</span>
                    </h2>
                    <p className="lp-section__desc">
                        {t('pricing.desc')}
                    </p>
                </div>

                <div className="lp-pricing__grid">
                    {Array.isArray(pricingPlans) && pricingPlans.map((p, i) => (
                        <article key={i} className={`lp-plan ${p.popular ? 'lp-plan--popular' : ''}`} style={{ '--delay': `${i * 0.15}s` }}>
                            {p.popular && <div className="lp-plan__badge">{t('pricing.popular')}</div>}
                            <div className="lp-plan__header">
                                <h3 className="lp-plan__name">{p.name}</h3>
                                <p className="lp-plan__desc">{p.desc}</p>
                            </div>
                            <div className="lp-plan__price">
                                <span className="lp-plan__currency">₺</span>
                                <span className="lp-plan__amount">{p.price}</span>
                                <span className="lp-plan__period">{t('pricing.period')}</span>
                            </div>
                            <ul className="lp-plan__features">
                                {p.features.map((f, fi) => (
                                    <li key={fi}><span>✓</span>{f}</li>
                                ))}
                            </ul>
                            <Link to="/dashboard" className={`lp-btn ${p.popular ? 'lp-btn--primary' : 'lp-btn--outline'} lp-btn--full`}>
                                {p.popular ? t('pricing.ctaPopular') : t('pricing.ctaOther')}
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
                    <h2 className="lp-cta__title">{t('cta.title')}</h2>
                    <p className="lp-cta__desc">{t('cta.desc')}</p>
                    <div className="lp-cta__actions">
                        <Link to="/dashboard" className="lp-btn lp-btn--white lp-btn--xl">
                            {t('cta.btn')} <span>→</span>
                        </Link>
                        <Link to="/demo" className="lp-btn lp-btn--ghost-light lp-btn--xl">
                            {t('cta.demo')}
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
                        <p>{t('footer.tagline')}</p>
                    </div>
                    <div className="lp-footer__links">
                        <div className="lp-footer__col">
                            <h4>{t('footer.col1Title')}</h4>
                            <a href="#features">{t('footer.col1.features')}</a>
                            <a href="#pricing">{t('footer.col1.pricing')}</a>
                            <Link to="/demo">{t('footer.col1.demo')}</Link>
                            <Link to="/dashboard">{t('footer.col1.panel')}</Link>
                        </div>
                        <div className="lp-footer__col">
                            <h4>{t('footer.col2Title')}</h4>
                            <Link to="/products">{t('footer.col2.products')}</Link>
                            <Link to="/orders">{t('footer.col2.orders')}</Link>
                            <Link to="/customers">{t('footer.col2.customers')}</Link>
                            <Link to="/inventory-oracle">{t('footer.col2.inventory')}</Link>
                        </div>
                        <div className="lp-footer__col">
                            <h4>{t('footer.col3Title')}</h4>
                            <Link to="/quote">{t('footer.col3.quote')}</Link>
                            <Link to="/measure">{t('footer.col3.measure')}</Link>
                            <Link to="/analytics">{t('footer.col3.analytics')}</Link>
                            <Link to="/white-label">{t('footer.col3.whitelabel')}</Link>
                        </div>
                    </div>
                </div>
                <div className="lp-footer__bottom">
                    <p>{t('footer.rights')}</p>
                </div>
            </footer>
        </div>
    )
}
