import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Phone, Settings, CheckCircle, BarChart2, Menu, X } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

/* ─── Paleta ─────────────────────────────────────────── */
const C = {
  bg:          '#ffffff',
  bgAlt:       '#f8fafc',
  bgDark:      '#0f172a',
  bgCard:      '#ffffff',
  text:        '#0f172a',
  textSec:     '#475569',
  textMuted:   '#94a3b8',
  textInv:     '#ffffff',
  accent:      '#4f46e5',
  accentLight: '#6366f1',
  accentSubtle:'#eef2ff',
  border:      '#e2e8f0',
  borderStr:   '#cbd5e1',
};

/* ─── Datos ───────────────────────────────────────────── */
const WA_NUMBER = '5491100000000'; // reemplazar por número real

const STEPS_ICONS = [<Phone size={20} />, <Settings size={20} />, <CheckCircle size={20} />, <BarChart2 size={20} />];

const WA_NUMBER = '5491100000000'; // reemplazar por número real

/* ─── Hooks ───────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── FadeIn ──────────────────────────────────────────── */
function FadeIn({ children, delay = 0, style = {} }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : 'translateY(22px)',
      transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─── WhatsApp Mockup (estética refinada) ─────────────── */
function WhatsAppMockup() {
  const { t } = useTranslation();
  const waMessages = t('agency.waMessages', { returnObjects: true }) || [];
  const mockup = t('agency.mockup', { returnObjects: true });
  const [visible, setVisible] = useState([]);
  const [typing, setTyping] = useState(false);
  const [phase, setPhase] = useState('building'); // building | fading | reset

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setVisible([]);
      setTyping(false);
      setPhase('building');
      for (let i = 0; i < waMessages.length; i++) {
        if (cancelled) return;
        const msg = waMessages[i];
        if (msg.from === 'bot') {
          setTyping(true);
          await sleep(1400);
          if (cancelled) return;
          setTyping(false);
        } else {
          await sleep(800);
          if (cancelled) return;
        }
        setVisible(v => [...v, msg]);
        await sleep(200);
      }
      await sleep(2800);
      if (cancelled) return;
      setPhase('fading');
      await sleep(700);
      if (cancelled) return;
      run();
    }
    run();
    return () => { cancelled = true; };
  }, []);

  const now = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ opacity: phase === 'fading' ? 0 : 1, transition: 'opacity 0.7s', maxWidth: '300px', width: '100%' }}>
      {/* Phone frame */}
      <div style={{ background: '#1a1a1a', borderRadius: '32px', padding: '10px', boxShadow: '0 32px 64px rgba(0,0,0,0.18)', border: '1px solid #333' }}>
        <div style={{ background: '#f0f0f0', borderRadius: '24px', overflow: 'hidden' }}>
          {/* WA header */}
          <div style={{ background: '#075e54', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#128c7e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🤖</div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'white' }}>{mockup.botName}</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.75)' }}>{typing ? mockup.typing : mockup.online}</div>
            </div>
          </div>
          {/* Chat */}
          <div style={{ background: '#e5ddd5', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E\")", padding: '10px', minHeight: '280px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {visible.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'bot' ? 'flex-start' : 'flex-end', animation: 'fadeSlideUp 0.3s ease' }}>
                <div style={{ maxWidth: '82%', padding: '6px 9px 4px', borderRadius: m.from === 'bot' ? '0 8px 8px 8px' : '8px 0 8px 8px', background: m.from === 'bot' ? '#ffffff' : '#d9fdd3', fontSize: '0.75rem', color: '#111', lineHeight: 1.5 }}>
                  {m.text}
                  <div style={{ fontSize: '0.6rem', color: '#999', textAlign: 'right', marginTop: '2px' }}>{now}{m.from === 'client' ? ' ✓✓' : ''}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex' }}>
                <div style={{ background: '#fff', borderRadius: '0 8px 8px 8px', padding: '8px 12px', display: 'flex', gap: '3px', alignItems: 'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#999', animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}
                </div>
              </div>
            )}
          </div>
          {/* Input */}
          <div style={{ background: '#f0f0f0', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ flex: 1, background: 'white', borderRadius: '20px', padding: '6px 12px', fontSize: '0.72rem', color: '#999' }}>{mockup.placeholder}</div>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#075e54', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>🎤</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ─── Accordion ───────────────────────────────────────── */
function Accordion({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', background: 'none', border: 'none', padding: '1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: C.text, fontSize: '0.97rem', fontWeight: 600, textAlign: 'left', gap: '1rem' }}>
        {q}
        <span style={{ fontSize: '1.2rem', color: C.textSec, fontWeight: 300, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>+</span>
      </button>
      <div style={{ overflow: 'hidden', maxHeight: open ? '200px' : '0', transition: 'max-height 0.35s cubic-bezier(0.16,1,0.3,1)', paddingBottom: open ? '1.25rem' : 0 }}>
        <p style={{ margin: 0, color: C.textSec, fontSize: '0.92rem', lineHeight: 1.7 }}>{a}</p>
      </div>
    </div>
  );
}

/* ─── CTA Button ──────────────────────────────────────── */
function CTAButton({ text = 'Agendar una llamada gratuita →', large = false, full = false }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={`https://wa.me/${WA_NUMBER}?text=Hola%2C%20quiero%20agendar%20una%20llamada%20para%20conocer%20el%20servicio%20Atento`}
      target="_blank" rel="noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: hov ? C.accentLight : C.accent,
        color: 'white',
        padding: large ? '1.1rem 2.4rem' : '0.75rem 1.6rem',
        borderRadius: '6px',
        fontSize: large ? '1.05rem' : '0.92rem',
        fontWeight: 600,
        fontFamily: "'Playfair Display', Georgia, serif",
        textDecoration: 'none',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 8px 20px rgba(26,74,58,0.25)' : 'none',
        width: full ? '100%' : 'auto',
        letterSpacing: '0.01em',
      }}
    >
      {text}
    </a>
  );
}

/* ─── MAIN ────────────────────────────────────────────── */
export default function LandingAgency() {
  const { t } = useTranslation();
  const navTexts = t('agency.nav', { returnObjects: true });
  const differentiators = t('agency.differentiators', { returnObjects: true }) || [];
  const stepsData = t('agency.steps', { returnObjects: true }) || [];
  const steps = stepsData.map((s, i) => ({ ...s, icon: STEPS_ICONS[i] }));
  const setupItems = t('agency.setupItems', { returnObjects: true }) || [];
  const monthlyItems = t('agency.monthlyItems', { returnObjects: true }) || [];
  const testimonials = t('agency.testimonials', { returnObjects: true }) || [];
  const faqs = t('agency.faqs', { returnObjects: true }) || [];

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-5px); } }
        .serif { font-family: 'Playfair Display', Georgia, serif; }
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-mockup { display: none !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .include-grid { grid-template-columns: 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .metrics-bar { flex-direction: column !important; gap: 1.5rem !important; }
          .metrics-bar > * + * { border-left: none !important; padding-left: 0 !important; }
        }
      `}</style>

      {/* ════════════ NAVBAR ════════════ */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(250,250,249,0.95)', backdropFilter: 'blur(8px)', borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent', transition: 'border-color 0.3s', padding: '0 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '66px' }}>
          {/* Logo */}
          <div onClick={() => scrollTo('hero')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="serif" style={{ fontSize: '1.25rem', fontWeight: 800, color: C.text }}>Atento</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.04em', background: C.accentSubtle, padding: '2px 6px', borderRadius: '4px', color: C.accent }}>Servicio</span>
          </div>
          {/* Desktop nav */}
          <div className="desktop-nav" style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
            <LanguageSwitcher />
            {[['proceso', navTexts.howItWorks],['resultados', navTexts.results],['cta', navTexts.contact]].map(([id,label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: C.textSec, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>{label}</button>
            ))}
            <a href="/login-premium" style={{ color: C.textSec, fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', padding: '0.5rem 0.75rem', borderRadius: '6px', border: `1px solid ${C.border}`, transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >{navTexts.login}</a>
            <CTAButton text={navTexts.schedule} />
          </div>
          {/* Hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="hamburger" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: C.text }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <div style={{ borderTop: `1px solid ${C.border}`, padding: '1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: C.bg }}>
            {[['proceso', navTexts.howItWorks],['resultados', navTexts.results],['cta', navTexts.contact]].map(([id,label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: C.textSec, cursor: 'pointer', fontSize: '1rem', textAlign: 'left', padding: '0.2rem 0' }}>{label}</button>
            ))}
            <a href="/login-premium" style={{ color: C.accent, fontSize: '1rem', fontWeight: 600, textDecoration: 'none', padding: '0.2rem 0' }}>{navTexts.login} →</a>
            <CTAButton text={navTexts.scheduleFree} full />
          </div>
        )}
      </nav>

      {/* ════════════ HERO ════════════ */}
      <section id="hero" style={{ padding: 'clamp(4rem,8vw,8rem) 2rem clamp(3rem,6vw,6rem)', borderBottom: `1px solid ${C.border}` }}>
        <div className="hero-grid" style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '5rem', alignItems: 'center' }}>
          <div>
            {/* Badge */}
            <FadeIn>
              <div style={{ display: 'inline-block', background: C.accentSubtle, color: C.accent, fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em', padding: '0.35rem 0.9rem', borderRadius: '4px', marginBottom: '2rem' }}>
                {t('agency.hero.badge')}
              </div>
            </FadeIn>
            {/* Headline */}
            <FadeIn delay={0.08}>
              <h1 className="serif" dangerouslySetInnerHTML={{ __html: t('agency.hero.title') }} style={{ fontSize: 'clamp(2.6rem,5vw,4.2rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: '1.5rem', color: C.text }} />
            </FadeIn>
            {/* Sub */}
            <FadeIn delay={0.14}>
              <p style={{ fontSize: '1.1rem', color: C.textSec, lineHeight: 1.75, maxWidth: '480px', marginBottom: '2.5rem' }}>
                {t('agency.hero.subtitle')}
              </p>
            </FadeIn>
            {/* CTA */}
            <FadeIn delay={0.2}>
              <CTAButton text={navTexts.scheduleFree} large />
              <p style={{ marginTop: '0.85rem', fontSize: '0.82rem', color: C.textMuted }}>{t('agency.hero.ctaHint')}</p>
            </FadeIn>
          </div>
          {/* Mockup */}
          <div className="hero-mockup" style={{ display: 'flex', justifyContent: 'center' }}>
            <FadeIn delay={0.25}>
              <WhatsAppMockup />
            </FadeIn>
          </div>
        </div>

        {/* Métricas */}
        <div className="metrics-bar" style={{ maxWidth: '700px', margin: '5rem auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {(t('agency.hero.metrics', { returnObjects: true }) || []).map((m, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0 2rem', borderLeft: i > 0 ? `1px solid ${C.border}` : 'none' }}>
              <div className="serif" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, color: C.text, marginBottom: '0.3rem' }}>{m.big}</div>
              <div style={{ fontSize: '0.8rem', color: C.textMuted, lineHeight: 1.4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════ PROPUESTA VALOR — FONDO OSCURO ════════════ */}
      <section style={{ background: C.bgDark, padding: 'clamp(4rem,8vw,7rem) 2rem', borderBottom: `1px solid #222` }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="serif" dangerouslySetInnerHTML={{ __html: t('agency.valueProp.title') }} style={{ fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.5px', color: C.textInv, marginBottom: '1.25rem' }} />
            <p style={{ color: '#9ca3af', fontSize: '1.05rem', lineHeight: 1.75, maxWidth: '560px', margin: '0 auto' }}>
              {t('agency.valueProp.subtitle')}
            </p>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '2rem' }}>
            {differentiators.map((d, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div style={{ borderTop: `1px solid #2d7a5f`, paddingTop: '1.5rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2d7a5f', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>0{i + 1}</div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: C.textInv, marginBottom: '0.6rem' }}>{d.title}</h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>{d.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ PROCESO ════════════ */}
      <section id="proceso" style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <FadeIn style={{ marginBottom: '3.5rem' }}>
            <h2 className="serif" dangerouslySetInnerHTML={{ __html: t('agency.process.title') }} style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.5px', marginBottom: '0.75rem' }} />
            <p style={{ color: C.textSec, fontSize: '1.05rem' }}>{t('agency.process.subtitle')}</p>
          </FadeIn>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0' }}>
            {steps.map((s, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div style={{ padding: '0 1.5rem 0 0', borderRight: i < STEPS.length - 1 ? `1px solid ${C.border}` : 'none', paddingRight: i < STEPS.length - 1 ? '1.5rem' : 0, marginRight: i < STEPS.length - 1 ? '1.5rem' : 0, position: 'relative' }}>
                  <div className="serif" style={{ fontSize: '4rem', fontWeight: 800, color: C.accentSubtle, lineHeight: 1, marginBottom: '1rem', userSelect: 'none' }}>{s.n}</div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: C.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, marginBottom: '0.85rem' }}>{s.icon}</div>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>{s.title}</h3>
                  <p style={{ color: C.textSec, fontSize: '0.87rem', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ LO QUE INCLUYE ════════════ */}
      <section style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', background: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 className="serif" style={{ fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.75rem' }}>{t('agency.included.title')}</h2>
            <p style={{ color: C.textSec, fontSize: '1.05rem' }}>{t('agency.included.subtitle')}</p>
          </FadeIn>
          <div className="include-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {[
              { label: t('agency.included.setupLabel'), items: setupItems },
              { label: t('agency.included.monthlyLabel'), items: monthlyItems },
            ].map((col, ci) => (
              <FadeIn key={ci} delay={ci * 0.1}>
                <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '2rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: C.accent, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>{col.label}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {col.items.map((item, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.9rem', color: C.textSec }}>
                        <Check size={15} color={C.accent} style={{ flexShrink: 0, marginTop: '1px' }} /> {item}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.15} style={{ textAlign: 'center', marginTop: '1.75rem' }}>
            <p style={{ fontSize: '0.88rem', color: C.accent, fontWeight: 500 }}>{t('agency.included.priceHint')}</p>
          </FadeIn>
        </div>
      </section>

      {/* ════════════ TESTIMONIOS ════════════ */}
      <section id="resultados" style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <FadeIn style={{ marginBottom: '3.5rem' }}>
            <h2 className="serif" style={{ fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.5px' }}>{t('agency.results.title')}</h2>
          </FadeIn>
          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2rem', marginBottom: '3.5rem' }}>
            {testimonials.map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div style={{ borderTop: `2px solid ${C.accent}`, paddingTop: '1.75rem' }}>
                  <div className="serif" style={{ fontSize: '3rem', color: C.accentSubtle, lineHeight: 1, marginBottom: '1rem', userSelect: 'none' }}>"</div>
                  <p style={{ fontSize: '0.95rem', color: C.textSec, lineHeight: 1.75, marginBottom: '1.5rem', fontStyle: 'italic' }}>{t.text}</p>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.8rem', color: C.textMuted }}>{t.role} · {t.city}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          {/* Métricas globales */}
          <FadeIn>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '2rem', display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {(t('agency.results.metrics', { returnObjects: true }) || []).map((t, i) => (
                <span key={i} className="serif" style={{ fontSize: '1.05rem', fontWeight: 700, color: C.textSec }}>{t}</span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════ FAQ ════════════ */}
      <section style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', background: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <FadeIn style={{ marginBottom: '3rem' }}>
            <h2 className="serif" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 800, letterSpacing: '-0.5px' }}>{t('agency.faq.title')}</h2>
          </FadeIn>
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            {faqs.map((f, i) => <Accordion key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ════════════ CTA FINAL ════════════ */}
      <section id="cta" style={{ padding: 'clamp(5rem,10vw,9rem) 2rem', background: C.bgAlt, textAlign: 'center' }}>
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          <FadeIn>
            <h2 className="serif" dangerouslySetInnerHTML={{ __html: t('agency.cta.title') }} style={{ fontSize: 'clamp(2rem,4.5vw,3.4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.5px', marginBottom: '1.25rem', color: C.text }} />
          </FadeIn>
          <FadeIn delay={0.08}>
            <p style={{ color: C.textSec, fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '2.5rem', maxWidth: '420px', margin: '0 auto 2.5rem' }}>
              {t('agency.cta.subtitle')}
            </p>
          </FadeIn>
          <FadeIn delay={0.14}>
            <CTAButton text={navTexts.scheduleFree} large />
            <div style={{ marginTop: '1.1rem' }}>
              <a href="mailto:hola@atento.ai" style={{ fontSize: '0.88rem', color: C.textMuted, textDecoration: 'none' }}>
                {t('agency.cta.orWriteUs')} <span style={{ color: C.accent, fontWeight: 600 }}>hola@atento.ai</span>
              </a>
            </div>
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '1.75rem', flexWrap: 'wrap' }}>
              {(t('agency.cta.trust', { returnObjects: true }) || []).map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: C.textSec }}>
                  <Check size={14} color={C.accent} /> {t}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '2.5rem 2rem', background: C.bg }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span className="serif" style={{ fontSize: '1.1rem', fontWeight: 800 }}>Atento</span>
              <span style={{ fontSize: '0.7rem', color: C.accent, fontWeight: 500, background: C.accentSubtle, padding: '2px 6px', borderRadius: '4px' }}>Servicio</span>
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[['proceso', navTexts.howItWorks],['resultados', navTexts.results],['cta', navTexts.contact]].map(([id,label]) => (
                <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: '0.85rem' }}>{label}</button>
              ))}
              <a href="/privacidad" style={{ color: C.textMuted, textDecoration: 'none', fontSize: '0.85rem' }}>Política de privacidad</a>
              <a href="/terminos" style={{ color: C.textMuted, textDecoration: 'none', fontSize: '0.85rem' }}>Términos y condiciones</a>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.82rem', color: C.textMuted }}>{t('agency.footer.rights')}</span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {['Instagram','LinkedIn','WhatsApp'].map(s => (
                <a key={s} href={s === 'WhatsApp' ? `https://wa.me/${WA_NUMBER}` : '#'} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: C.textMuted, textDecoration: 'none' }}>{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
