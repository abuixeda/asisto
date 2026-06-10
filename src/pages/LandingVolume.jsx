import { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight, Check, Star, Menu, X, ChevronDown, Send,
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

/* ─── Paleta ─────────────────────────────────────────── */
const C = {
  bg:        '#0a0a12',
  bgCard:    '#111120',
  bgCard2:   '#0d0d1a',
  bgCardEl:  '#161628',
  border:    '#1e1e35',
  borderStr: '#272745',
  text:      '#f0f0ff',
  textSec:   '#8888aa',
  textMuted: '#44445a',
  pink:      '#e040fb',
  cyan:      '#00d4ff',
  grad:      'linear-gradient(135deg, #e040fb 0%, #7c3aed 50%, #00d4ff 100%)',
  gradBtn:   'linear-gradient(135deg, #e040fb, #9333ea)',
  gradText:  'linear-gradient(90deg, #e040fb, #00d4ff)',
  green:     '#22d07a',
  waGreen:   '#25d366',
  waDark:    '#128c7e',
};

/* ─── Visual props not in JSON ────────────────────────── */
const FEATURE_STYLES = [
  { borderColor: '#e040fb', iconBg: 'rgba(224,64,251,0.12)' },
  { borderColor: '#00d4ff', iconBg: 'rgba(0,212,255,0.10)'  },
  { borderColor: '#a855f7', iconBg: 'rgba(168,85,247,0.12)' },
  { borderColor: '#e040fb', iconBg: 'rgba(224,64,251,0.12)' },
  { borderColor: '#00d4ff', iconBg: 'rgba(0,212,255,0.10)'  },
  { borderColor: '#a855f7', iconBg: 'rgba(168,85,247,0.12)' },
];

const PLAN_HIGHLIGHTS = [false, true, false];
const WHOP_PLAN_IDS = {
  starter: 'plan_v5NUICSwihOKZ',
  growth: 'plan_074m3NxwBdu3r',
  scale: 'plan_b3RCl3tcxlikv',
};

const LIVE_TOASTS = [
  { name: 'Valentina G.', action: 'activó su bot',              city: 'Córdoba'      },
  { name: 'Diego M.',     action: 'recibió 47 consultas hoy',   city: 'Rosario'      },
  { name: 'Marcelo R.',   action: 'cerró una venta con el bot', city: 'CABA'         },
  { name: 'Carolina F.',  action: 'configuró su catálogo',      city: 'Mendoza'      },
  { name: 'Lucía P.',     action: 'acaba de registrarse',       city: 'Mar del Plata'},
];

/* ─── Helpers ─────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function AnimatedCounter({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    const steps = 60; let i = 0;
    const id = setInterval(() => { i++; setVal(Math.round((target * i) / steps)); if (i >= steps) clearInterval(id); }, 30);
    return () => clearInterval(id);
  }, [inView, target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── Particle Canvas ─────────────────────────────────── */
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const COLORS = ['#e040fb', '#00d4ff', '#c084fc', '#7c3aed', '#38bdf8'];
    const N = 55;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2 + 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 160) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(180,100,255,${(1 - d / 160) * 0.13})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.75 }} />;
}

/* ─── Live Toast ──────────────────────────────────────── */
function LiveToast() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 2500); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % LIVE_TOASTS.length); setVisible(true); }, 600);
    }, 4500);
    return () => clearInterval(id);
  }, [visible]);
  const t = LIVE_TOASTS[idx];
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', left: '1.5rem', zIndex: 200, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.97)', transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)', background: 'rgba(10,10,20,0.96)', backdropFilter: 'blur(12px)', border: '1px solid rgba(224,64,251,0.2)', borderRadius: '14px', padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', maxWidth: '290px', pointerEvents: 'none' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(224,64,251,0.12)', border: '1px solid rgba(224,64,251,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.pink, fontWeight: 800, fontSize: '0.9rem' }}>{t.name[0]}</div>
      <div>
        <div style={{ fontSize: '0.8rem', color: '#dde', fontWeight: 600 }}><span style={{ color: C.pink }}>{t.name}</span>{' '}{t.action}</div>
        <div style={{ fontSize: '0.68rem', color: C.textMuted, marginTop: '2px' }}>📍 {t.city} · ahora</div>
      </div>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, flexShrink: 0, boxShadow: `0 0 6px ${C.green}` }} />
    </div>
  );
}

/* ─── Animated Bar Chart ──────────────────────────────── */
function BarChart() {
  const { t } = useTranslation();
  const [ref, inView] = useInView(0.3);
  const bars = [
    { label: t('platform.chartWithBot'),      pct: 97, color: 'linear-gradient(90deg,#e040fb,#9333ea)' },
    { label: t('platform.chartManual'), pct: 42, color: 'linear-gradient(90deg,#7c3aed,#a855f7)' },
    { label: t('platform.chartBasic'),  pct: 61, color: 'linear-gradient(90deg,#00d4ff,#38bdf8)' },
    { label: t('platform.chartNone'),    pct: 18, color: 'linear-gradient(90deg,#e040fb,#00d4ff)' },
  ];
  return (
    <div ref={ref} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.5rem' }}>
      <div style={{ fontSize: '0.72rem', color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.25rem', fontWeight: 600 }}>
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: C.pink, marginRight: 6 }} />
        {t('platform.conversionLabel')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {bars.map((b, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
              <span style={{ color: C.textSec }}>{b.label}</span>
              <span style={{ color: C.text, fontWeight: 700 }}>{b.pct}%</span>
            </div>
            <div style={{ background: C.bgCard2, borderRadius: '99px', height: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '99px', background: b.color, width: inView ? `${b.pct}%` : '0%', transition: `width 1.2s cubic-bezier(0.16,1,0.3,1) ${i * 0.15}s` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Demo Interactivo ────────────────────────────────── */
function DemoChat() {
  const { t } = useTranslation();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const now = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    setMessages([{ from: 'bot', text: t('demo.greeting') }]);
  }, [t]);

  useEffect(() => { if (messages.length > 1 || loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function send() {
    const txt = input.trim();
    if (!txt || loading) return;
    setInput('');
    const newMsgs = [...messages, { from: 'client', text: txt }];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const API_URL = 'https://asisto-backend-production.up.railway.app';
      const res = await fetch(`${API_URL}/api/demo/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs })
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setMessages([...newMsgs, { from: 'bot', text: data.text }]);
      } else {
        setMessages([...newMsgs, { from: 'bot', text: data.error || t('demo.errors.network') }]);
      }
    } catch (err) {
      setMessages([...newMsgs, { from: 'bot', text: t('demo.errors.brain') }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', borderRadius: '20px', overflow: 'hidden', border: `1px solid ${C.borderStr}`, boxShadow: `0 0 0 1px rgba(224,64,251,0.1), 0 24px 60px rgba(0,0,0,0.5)` }}>
      <div style={{ background: '#202c33', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: C.gradBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{t('demo.title')}</div>
          <div style={{ fontSize: '0.72rem', color: C.waGreen }}>{t('demo.online')}</div>
        </div>
      </div>
      <div style={{ background: '#0b141a', padding: '14px', height: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'bot' ? 'flex-start' : 'flex-end' }}>
            <div style={{ maxWidth: '80%', padding: '8px 11px 5px', borderRadius: m.from === 'bot' ? '0 10px 10px 10px' : '10px 0 10px 10px', background: m.from === 'bot' ? '#202c33' : '#005c4b', fontSize: '0.85rem', color: 'white', lineHeight: 1.5 }}>
              {m.text}
              <div style={{ fontSize: '0.6rem', color: '#8696a0', textAlign: 'right', marginTop: '3px' }}>{now}</div>
            </div>
          </div>
        ))}
        {loading && <div style={{ display: 'flex' }}><div style={{ background: '#202c33', borderRadius: '0 10px 10px 10px', padding: '10px 14px', display: 'flex', gap: '4px' }}>{[0,1,2].map(i => <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#8696a0', animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}</div></div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ background: '#202c33', padding: '10px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={t('demo.placeholder')} style={{ flex: 1, background: '#2a3942', border: 'none', borderRadius: '20px', padding: '9px 16px', color: 'white', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }} />
        <button onClick={send} style={{ width: '38px', height: '38px', borderRadius: '50%', background: C.gradBtn, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={15} color="white" />
        </button>
      </div>
    </div>
  );
}

/* ─── Product Demo browser ────────────────────────────── */
function ProductDemo() {
  const METRICS = [
    { label: 'Consultas hoy',     val: '247', delta: '+18%', color: C.pink },
    { label: 'Tasa de respuesta', val: '99.8%', delta: 'óptimo', color: C.cyan },
    { label: 'Ventas asistidas',  val: '34',  delta: '+6 vs ayer', color: '#a855f7' },
  ];
  const CONV = [
    { from: 'client', text: 'Hola, tienen zapatillas Nike en el 42?' },
    { from: 'bot',    text: 'Sí! Tenemos Air Max en blanco y negro en el 42. $94.900. ¿Te interesa?' },
    { from: 'client', text: 'El blanco, lo reservo' },
    { from: 'bot',    text: '¡Perfecto! 🎉 Te mando el link de pago ahora mismo.' },
  ];
  const [shown, setShown] = useState(0);
  const [ref, inView] = useInView(0.2);
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setShown(s => s < CONV.length ? s + 1 : s), 950);
    return () => clearInterval(id);
  }, [inView]);
  return (
    <div ref={ref} style={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.borderStr}`, boxShadow: `0 0 80px rgba(224,64,251,0.07), 0 40px 80px rgba(0,0,0,0.4)` }}>
      <div style={{ background: '#0d0d1a', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: C.bgCard2, borderRadius: '6px', padding: '4px 12px', fontSize: '0.7rem', color: C.textMuted, marginLeft: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: C.green, fontSize: '0.6rem' }}>🔒</span> app.atento.ai/dashboard
        </div>
      </div>
      <div style={{ padding: '1.25rem', background: '#090912' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {METRICS.map((m, i) => (
            <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '0.85rem 1rem', borderTop: `2px solid ${m.color}` }}>
              <div style={{ fontSize: '0.66rem', color: C.textMuted, marginBottom: '0.3rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>{m.val}</div>
              <div style={{ fontSize: '0.68rem', color: m.color, fontWeight: 700, marginTop: '0.2rem' }}>{m.delta}</div>
            </div>
          ))}
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ background: C.bgCard2, padding: '0.7rem 1rem', fontSize: '0.73rem', color: C.textSec, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, display: 'inline-block', boxShadow: `0 0 6px ${C.green}` }} /> Conversación en vivo
          </div>
          <div style={{ padding: '0.85rem', background: '#0b141a', display: 'flex', flexDirection: 'column', gap: '7px', minHeight: '120px' }}>
            {CONV.slice(0, shown).map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'bot' ? 'flex-start' : 'flex-end', animation: 'fadeSlideUp 0.35s ease' }}>
                <div style={{ maxWidth: '80%', padding: '5px 9px 4px', borderRadius: m.from === 'bot' ? '0 8px 8px 8px' : '8px 0 8px 8px', background: m.from === 'bot' ? '#202c33' : '#005c4b', fontSize: '0.72rem', color: 'white', lineHeight: 1.45 }}>{m.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ Accordion ───────────────────────────────────── */
function Accordion({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', background: 'none', border: 'none', padding: '1.1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: C.text, fontSize: '0.95rem', fontWeight: 600, textAlign: 'left', gap: '1rem', fontFamily: 'inherit' }}>
        {q}
        <ChevronDown size={17} color={C.textSec} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.22s', flexShrink: 0 }} />
      </button>
      <div style={{ overflow: 'hidden', maxHeight: open ? '180px' : '0', transition: 'max-height 0.35s cubic-bezier(0.16,1,0.3,1)', paddingBottom: open ? '1rem' : 0 }}>
        <p style={{ margin: 0, color: C.textSec, fontSize: '0.9rem', lineHeight: 1.72 }}>{a}</p>
      </div>
    </div>
  );
}

/* ─── FadeIn ──────────────────────────────────────────── */
function FadeIn({ children, delay = 0, style = {} }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(24px)', transition: `opacity 0.65s ${delay}s, transform 0.65s ${delay}s`, ...style }}>
      {children}
    </div>
  );
}

/* ─── GradientText ────────────────────────────────────── */
function GradText({ children, style = {} }) {
  return <span style={{ background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', ...style }}>{children}</span>;
}

function WhopCheckoutModal({ checkout, onClose }) {
  const returnUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://www.atento-ai.com/registro';
    return `${window.location.origin}/registro?payment=success&plan=${checkout?.key || 'starter'}`;
  }, [checkout?.key]);

  useEffect(() => {
    if (!checkout) return;
    const existing = document.getElementById('whop-checkout-loader');
    existing?.remove();
    const script = document.createElement('script');
    script.id = 'whop-checkout-loader';
    script.src = 'https://js.whop.com/static/checkout/loader.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [checkout]);

  if (!checkout) return null;

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(3,3,10,0.82)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: 'min(100%, 860px)', maxHeight: '92vh', overflow: 'auto', background: C.bgCard, border: `1px solid ${C.borderStr}`, borderRadius: '18px', boxShadow: '0 30px 90px rgba(0,0,0,0.55)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.2rem', borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div style={{ color: C.text, fontWeight: 900, fontSize: '1.05rem' }}>Finalizar compra en Atento</div>
            <div style={{ color: C.textSec, fontSize: '0.82rem', marginTop: '0.12rem' }}>{checkout.name} · pago seguro procesado por Whop</div>
          </div>
          <button onClick={onClose} aria-label="Cerrar checkout" style={{ width: 38, height: 38, borderRadius: '10px', border: `1px solid ${C.borderStr}`, background: C.bgCardEl, color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '1.2rem', minHeight: '520px' }}>
          <div
            key={checkout.planId}
            data-whop-checkout-plan-id={checkout.planId}
            data-whop-checkout-return-url={returnUrl}
            data-whop-checkout-theme="dark"
          />
          <p style={{ margin: '1rem 0 0', color: C.textMuted, fontSize: '0.78rem', textAlign: 'center' }}>
            Si el formulario no carga, desactivá bloqueadores del navegador o abrilo desde Whop.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN ────────────────────────────────────────────── */
export default function LandingVolume() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkout, setCheckout] = useState(null);

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  }

  const brands    = t('brands',           { returnObjects: true });
  const features  = t('features.items',   { returnObjects: true });
  const baItems   = t('beforeAfter.items',{ returnObjects: true });
  const steps     = t('howItWorks.steps', { returnObjects: true });
  const reviews   = t('reviews.items',    { returnObjects: true });
  const plans     = t('pricing.plans',    { returnObjects: true });
  const faqs      = t('faq.items',        { returnObjects: true });

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
        @keyframes bounce      { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-6px); } }
        @keyframes marquee     { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes heroGlow    { 0%,100% { opacity:0.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.08); } }
        @keyframes btnPulse    { 0%,100% { box-shadow:0 0 0 0 rgba(224,64,251,0); } 50% { box-shadow:0 0 28px 6px rgba(224,64,251,0.25); } }
        * { box-sizing: border-box; }
        .btn-primary { background: linear-gradient(135deg,#e040fb,#9333ea); color:white; border:none; font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.2s; }
        .btn-primary:hover { opacity:0.88; transform:translateY(-2px); box-shadow:0 10px 32px rgba(224,64,251,0.35); }
        .btn-ghost   { background:rgba(255,255,255,0.04); border:1px solid ${C.borderStr}; color:${C.text}; cursor:pointer; font-family:inherit; transition:all 0.2s; font-weight:600; }
        .btn-ghost:hover   { background:rgba(255,255,255,0.08); }
        .feature-card { transition:all 0.22s; }
        .feature-card:hover { transform:translateY(-5px); background:${C.bgCardEl} !important; }
        .plan-card  { transition:transform 0.2s; }
        .plan-card:hover  { transform:translateY(-5px); }
        .review-card { transition:transform 0.2s; }
        .review-card:hover { transform:translateY(-4px); }
        .step-row { transition:all 0.2s; }
        .step-row:hover { border-color:${C.pink} !important; background:${C.bgCardEl} !important; }
        @media (max-width:900px) {
          .desktop-nav { display:none !important; }
          .hamburger   { display:flex !important; }
          .ba-grid,.review-grid,.plan-grid,.footer-grid,.platform-grid,.perf-grid { grid-template-columns:1fr !important; }
        }
        @media (max-width:600px) {
          .stats-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      <LiveToast />
      <WhopCheckoutModal checkout={checkout} onClose={() => setCheckout(null)} />

      {/* ════════════ NAVBAR ════════════ */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,18,0.9)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}`, padding: '0 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '62px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => scrollTo('hero')}>
            <img src="/atento-logo.png" alt="Atento AI" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }} />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: C.text }}>Atento AI</span>
          </div>
          <div className="desktop-nav" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            {[['features', t('nav.features')],['pricing', t('nav.pricing')],['reviews', t('nav.clients')]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: C.textSec, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, fontFamily: 'inherit' }}>{label}</button>
            ))}
            <a href="/login" style={{ color: C.textSec, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>{t('nav.login')}</a>
            <LanguageSwitcher />
            <button onClick={() => scrollTo('cta')} className="btn-primary" style={{ padding: '0.48rem 1.15rem', borderRadius: '8px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {t('nav.start')} <ChevronRight size={14} />
            </button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="hamburger" style={{ display: 'none', background: 'none', border: 'none', color: C.text, cursor: 'pointer' }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <div style={{ borderTop: `1px solid ${C.border}`, padding: '1rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: C.bgCard }}>
            {[['features', t('nav.features')],['pricing', t('nav.pricing')],['reviews', t('nav.clients')]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: C.textSec, cursor: 'pointer', fontSize: '1rem', textAlign: 'left', padding: '0.2rem 0', fontFamily: 'inherit' }}>{label}</button>
            ))}
            <a href="/login" style={{ color: C.textSec, textDecoration: 'none', fontSize: '1rem' }}>{t('nav.login')}</a>
            <button onClick={() => scrollTo('cta')} className="btn-primary" style={{ padding: '0.85rem', borderRadius: '10px', fontSize: '1rem', textAlign: 'center' }}>{t('nav.start')} →</button>
          </div>
        )}
      </nav>

      {/* ════════════ HERO ════════════ */}
      <section id="hero" style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(2rem,4vw,3.5rem) 2rem clamp(3rem,6vw,5rem)', textAlign: 'center' }}>
        <ParticleField />
        <div style={{ position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '600px', background: 'radial-gradient(ellipse at center, rgba(90,20,120,0.55) 0%, rgba(40,0,80,0.3) 35%, transparent 70%)', animation: 'heroGlow 8s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <FadeIn>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: '8px', padding: '0.5rem 1.2rem', fontSize: '0.9rem', color: '#ff453a', marginBottom: '1.5rem', fontWeight: 800, boxShadow: '0 0 20px rgba(255,59,48,0.15)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff453a', display: 'inline-block', boxShadow: '0 0 8px #ff453a', animation: 'heroGlow 2s infinite' }} />
              {t('hero.urgency')}
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(224,64,251,0.1)', border: '1px solid rgba(224,64,251,0.25)', borderRadius: '99px', padding: '0.3rem 1rem', fontSize: '0.8rem', color: C.pink, marginBottom: '1.5rem', fontWeight: 700 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.pink, display: 'inline-block', boxShadow: `0 0 8px ${C.pink}` }} />
              {t('hero.badge')}
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <h1 style={{ fontSize: 'clamp(2.8rem,6vw,5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>
              {t('hero.title')}<br />
              <GradText>{t('hero.titleHighlight')}</GradText>
            </h1>
          </FadeIn>

          <FadeIn delay={0.1}>
            <p style={{ fontSize: '1.15rem', color: C.textSec, lineHeight: 1.75, maxWidth: '560px', margin: '0 auto 0.75rem', fontWeight: 500 }}>
              {t('hero.subtitle')}
            </p>
            <p style={{ fontSize: '0.9rem', color: C.textMuted, marginBottom: '2rem' }}>
              {t('hero.hint')}
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button onClick={() => scrollTo('cta')} className="btn-primary" style={{ padding: '0.95rem 2rem', borderRadius: '10px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'btnPulse 3s infinite' }}>
                {t('hero.cta')} <ChevronRight size={18} />
              </button>
              <button onClick={() => scrollTo('demo')} className="btn-ghost" style={{ padding: '0.95rem 2rem', borderRadius: '10px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {t('hero.ctaSecondary')}
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: C.textMuted }}>{t('hero.noCc')}</p>
          </FadeIn>

          <FadeIn delay={0.22}>
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: C.borderStr, borderRadius: '14px', overflow: 'hidden', border: `1px solid ${C.borderStr}`, maxWidth: '580px', margin: '3rem auto 0' }}>
              {[
                { n: 2400, suffix: '+', label: t('hero.stats.responses') },
                { n: null, pre: '< 3 seg', label: t('hero.stats.uptime') },
                { n: 98,   suffix: '%',    label: t('hero.stats.satisfaction') },
              ].map((s, i) => (
                <div key={i} style={{ background: C.bgCard, padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {s.n !== null ? <><AnimatedCounter target={s.n} />{s.suffix}</> : s.pre}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: C.textMuted, marginTop: '0.3rem', fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════ SOCIAL PROOF ════════════ */}
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '1.75rem 0', overflow: 'hidden', background: C.bgCard2 }}>
        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: C.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.1rem', fontWeight: 700 }}>{t('socialProof.title')}</p>
        <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 22s linear infinite' }}>
          {[...brands, ...brands].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '99px', padding: '0.38rem 1rem', marginRight: '0.75rem', whiteSpace: 'nowrap', fontSize: '0.82rem', color: C.textSec, fontWeight: 500 }}>
              <span>{b.icon}</span> {b.name}
            </div>
          ))}
        </div>
      </section>

      {/* ════════════ PLATAFORMAS ════════════ */}
      <section style={{ padding: '2.75rem 2rem', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: C.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.5rem', fontWeight: 700 }}>{t('platformAvailability.label')}</div>
          <div className="platform-grid" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { emoji: '🛍️', name: t('platformAvailability.shopify.name'), sub: t('platformAvailability.shopify.sub'), soon: false },
              { emoji: '☁️', name: t('platformAvailability.tiendaNube.name'), sub: t('platformAvailability.tiendaNube.sub'), soon: false },
              { emoji: '📊', name: t('platformAvailability.googleSheets.name'), sub: t('platformAvailability.googleSheets.sub'), soon: false },
            ].map((p, i) => (
              <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.85rem', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '0.9rem 1.35rem', textAlign: 'left' }}>
                <div style={{ fontSize: '1.7rem' }}>{p.emoji}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: C.text }}>{p.name}</div>
                  <div style={{ fontSize: '0.73rem', color: C.textMuted }}>{p.sub}</div>
                </div>
                {p.soon  && <div style={{ position: 'absolute', top: '-10px', right: '10px', background: C.gradBtn, color: 'white', fontSize: '0.6rem', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{t('platformAvailability.badges.soon')}</div>}
                {!p.soon && <div style={{ position: 'absolute', top: '-10px', right: '10px', background: C.green, color: 'white', fontSize: '0.6rem', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t('platformAvailability.badges.now')}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ FEATURES ════════════ */}
      <section id="features" style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.72rem', color: C.pink, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>{t('nav.features').toUpperCase()}</div>
            <h2 style={{ fontSize: 'clamp(1.9rem,3.5vw,3rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '0.75rem', lineHeight: 1.1 }}>
              {t('features.title')}<br /><GradText>{t('features.titleHighlight')}</GradText>
            </h2>
            <p style={{ color: C.textSec, fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>{t('features.subtitle')}</p>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1px', background: C.border, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="feature-card" style={{ background: C.bgCard, padding: '2rem', height: '100%', borderTop: `2px solid ${FEATURE_STYLES[i % FEATURE_STYLES.length].borderColor}` }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: FEATURE_STYLES[i % FEATURE_STYLES.length].iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '1.1rem' }}>{f.icon}</div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.55rem', color: C.text }}>{f.title}</h3>
                  <p style={{ color: C.textSec, fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ PERFORMANCE ════════════ */}
      <section style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', background: C.bgCard2, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.72rem', color: C.cyan, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>{t('platform.label')}</div>
            <h2 style={{ fontSize: 'clamp(1.9rem,3.5vw,3rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              {t('platform.title')} <GradText>{t('platform.titleHighlight')}</GradText>
            </h2>
          </FadeIn>
          <div className="perf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'center' }}>
            <FadeIn delay={0.05}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '10px', background: 'rgba(224,64,251,0.12)', border: '1px solid rgba(224,64,251,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>⚡</div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.3rem', color: C.text }}>{t('platform.speed')}</h3>
                </div>
                <p style={{ color: C.textSec, fontSize: '1rem', lineHeight: 1.75, marginBottom: '1.5rem' }}>
                  {t('platform.speedDesc')}
                </p>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  {[{ n: t('platform.metrics.time'), unit: t('platform.metrics.timeUnit'), label: t('platform.metrics.timeLabel') }, { n: t('platform.metrics.uptime'), unit: '', label: t('platform.metrics.uptimeLabel') }, { n: t('platform.metrics.errors'), unit: '', label: t('platform.metrics.errorsLabel') }].map((m, i) => (
                    <div key={i}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>{m.n}<span style={{ fontSize: '0.9rem', color: C.pink }}>{m.unit}</span></div>
                      <div style={{ fontSize: '0.72rem', color: C.textMuted, fontWeight: 600 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}><BarChart /></FadeIn>
          </div>
        </div>
      </section>

      {/* ════════════ ANTES / DESPUÉS ════════════ */}
      <section style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.7rem)', fontWeight: 900, letterSpacing: '-0.04em' }}>{t('beforeAfter.title')}</h2>
          </FadeIn>
          <div className="ba-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <FadeIn delay={0.05}>
              <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '16px', padding: '1.5rem', borderTop: '2px solid rgba(239,68,68,0.5)' }}>
                <div style={{ fontWeight: 800, color: '#f87171', marginBottom: '1.25rem', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>✕ {t('beforeAfter.before')}</div>
                {baItems.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.85rem', fontSize: '0.9rem', color: C.textSec }}>
                    <span style={{ color: '#f87171', flexShrink: 0 }}>✕</span> {r.bad}
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div style={{ background: 'rgba(224,64,251,0.04)', border: '1px solid rgba(224,64,251,0.2)', borderRadius: '16px', padding: '1.5rem', borderTop: `2px solid ${C.pink}` }}>
                <div style={{ fontWeight: 800, color: C.pink, marginBottom: '1.25rem', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>✓ {t('beforeAfter.after')}</div>
                {baItems.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.85rem', fontSize: '0.9rem', color: C.textSec }}>
                    <span style={{ color: C.cyan, flexShrink: 0 }}>✓</span> {r.good}
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ════════════ PANEL EN VIVO ════════════ */}
      <section style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', background: C.bgCard2, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.72rem', color: C.pink, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>{t('dashboard.label')}</div>
            <h2 style={{ fontSize: 'clamp(1.9rem,3.5vw,3rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 }}>{t('dashboard.title')}</h2>
            <p style={{ color: C.textSec, fontSize: '1.05rem', maxWidth: '460px', margin: '0.75rem auto 0' }}>{t('dashboard.desc')}</p>
          </FadeIn>
          <FadeIn delay={0.1}><ProductDemo /></FadeIn>
        </div>
      </section>

      {/* ════════════ CÓMO FUNCIONA ════════════ */}
      <section style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.72rem', color: C.cyan, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>{t('howItWorks.label')}</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.7rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>{t('howItWorks.title')} <GradText>{t('howItWorks.titleHighlight')}</GradText></h2>
            <p style={{ color: C.textSec, fontSize: '1.05rem' }}>{t('howItWorks.desc')}</p>
          </FadeIn>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {steps.map((s, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <div className="step-row" style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.25rem 1.5rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(224,64,251,0.1)', border: '1px solid rgba(224,64,251,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', flexShrink: 0, color: C.pink }}>{s.n}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem', color: C.text }}>{s.title}</div>
                    <div style={{ color: C.textSec, fontSize: '0.9rem' }}>{s.desc}</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{s.icon}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ DEMO INTERACTIVO ════════════ */}
      <section id="demo" style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', background: C.bgCard2, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.22)', borderRadius: '99px', padding: '0.3rem 0.9rem', fontSize: '0.78rem', color: C.waGreen, marginBottom: '1rem', fontWeight: 700 }}>● {t('liveDemo.label')}</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.5rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '0.6rem' }}>{t('liveDemo.title')}</h2>
            <p style={{ color: C.textSec, fontSize: '1.05rem' }}>{t('liveDemo.desc')}</p>
          </FadeIn>
          <FadeIn delay={0.1}><DemoChat /></FadeIn>
          <FadeIn delay={0.15} style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button onClick={() => scrollTo('cta')} className="btn-primary" style={{ padding: '0.85rem 2rem', borderRadius: '10px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              {t('liveDemo.tryIt')} <ChevronRight size={17} />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ════════════ TESTIMONIOS ════════════ */}
      <section id="reviews" style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.72rem', color: C.pink, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>{t('nav.clients').toUpperCase()}</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.7rem)', fontWeight: 900, letterSpacing: '-0.04em' }}>{t('reviews.title')} <GradText>{t('reviews.titleHighlight')}</GradText></h2>
          </FadeIn>
          <div className="review-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1px', background: C.border, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.border}`, marginBottom: '2.5rem' }}>
            {reviews.map((r, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="review-card" style={{ background: C.bgCard, padding: '1.75rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>{Array.from({length:5}).map((_,j) => <Star key={j} size={13} fill="#f59e0b" color="#f59e0b" />)}</div>
                  <p style={{ color: C.textSec, lineHeight: 1.68, margin: 0, fontSize: '0.9rem', flex: 1 }}>"{r.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(224,64,251,0.1)', border: '1px solid rgba(224,64,251,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: C.pink, flexShrink: 0 }}>{r.name[0]}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: C.text }}>{r.name}</div>
                      <div style={{ fontSize: '0.75rem', color: C.textMuted }}>{r.biz}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn>
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1rem 1.75rem', display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
              {[t('stats.messages'), t('stats.satisfaction'), t('stats.businesses')].map((t,i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: C.textSec }}>
                  <span style={{ color: C.pink, fontSize: '0.6rem' }}>●</span> {t}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════ PRICING ════════════ */}
      <section id="pricing" style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', background: C.bgCard2, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.72rem', color: C.cyan, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>{t('nav.pricing').toUpperCase()}</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.7rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '0.6rem' }}>{t('pricing.title')} <GradText>{t('pricing.titleHighlight')}</GradText></h2>
            <p style={{ color: C.textSec, fontSize: '1.05rem' }}>{t('pricing.trialInfo')}</p>
          </FadeIn>
          <div className="plan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(265px,1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {plans.map((p, i) => {
              const highlight = PLAN_HIGHLIGHTS[i] || false;
              return (
                <FadeIn key={i} delay={i * 0.07}>
                  <div className="plan-card" style={{ background: C.bgCard, border: `1px solid ${highlight ? C.pink : C.border}`, borderTop: `2px solid ${highlight ? C.pink : i === 0 ? '#7c3aed' : C.cyan}`, borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', position: 'relative', boxShadow: highlight ? '0 0 48px rgba(224,64,251,0.08)' : 'none', height: '100%' }}>
                    {highlight && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: C.gradBtn, color: 'white', borderRadius: '99px', padding: '0.2rem 1rem', fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{t('pricing.popular').toUpperCase()}</div>}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: highlight ? C.pink : C.textSec, marginBottom: '0.4rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.name}</div>
                      {p.oldPrice && (
                        <div style={{ fontSize: '1.2rem', color: C.textMuted, textDecoration: 'line-through', marginBottom: '-0.3rem', fontWeight: 600 }}>USD {p.oldPrice}</div>
                      )}
                      <div style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.03em', color: C.text }}>USD {p.price}<span style={{ fontSize: '1rem', fontWeight: 500, color: C.textSec }}>/{t('pricing.monthly')}</span></div>
                      <div style={{ fontSize: '0.85rem', color: highlight ? C.pink : C.cyan, marginTop: '0.25rem', fontWeight: 600 }}>{p.desc}</div>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                      {p.features.map((f, j) => (
                        <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.88rem', color: C.textSec }}>
                          <Check size={14} color={highlight ? C.pink : C.cyan} style={{ flexShrink: 0, marginTop: '2px' }} /> {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => {
                        const planKey = ['starter', 'growth', 'scale'][i] || 'starter';
                        setCheckout({ key: planKey, name: p.name, planId: WHOP_PLAN_IDS[planKey] });
                      }}
                      className={highlight ? 'btn-primary' : 'btn-ghost'}
                      style={{ padding: '0.85rem', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}
                    >
                      {p.cta}
                    </button>
                  </div>
                </FadeIn>
              );
            })}
          </div>
          <FadeIn>
            <p style={{ textAlign: 'center', color: C.textSec, fontSize: '0.88rem' }}>
              <a href="/premium" style={{ color: C.pink, textDecoration: 'none', fontWeight: 700 }}>{t('pricing.agencyPrompt')}</a>
            </p>
          </FadeIn>
          <FadeIn delay={0.1} style={{ maxWidth: '620px', margin: '3rem auto 0' }}>
            <h3 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem', color: C.textSec }}>{t('faq.title')}</h3>
            <div style={{ borderTop: `1px solid ${C.border}` }}>
              {faqs.map((f, i) => <Accordion key={i} q={f.q} a={f.a} />)}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════ CTA FINAL ════════════ */}
      <section id="cta" style={{ padding: 'clamp(5rem,10vw,9rem) 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <ParticleField />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '500px', background: 'radial-gradient(ellipse, rgba(90,20,120,0.5) 0%, transparent 65%)', pointerEvents: 'none', animation: 'heroGlow 8s ease-in-out infinite' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '560px', margin: '0 auto' }}>
          <FadeIn>
            <h2 style={{ fontSize: 'clamp(2rem,4vw,3.4rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '1rem', lineHeight: 1.08 }}>
              {t('cta.title')}<br /><GradText>{t('cta.titleHighlight')}</GradText>
            </h2>
          </FadeIn>
          <FadeIn delay={0.06}>
            <p style={{ color: C.textSec, fontSize: '1.1rem', marginBottom: '2.25rem' }}>{t('cta.subtitle')}</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <a href="/registro" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1.1rem 2.4rem', fontSize: '1.1rem', borderRadius: '12px', textDecoration: 'none', fontFamily: 'inherit', animation: 'btnPulse 3s infinite' }}>
              {t('cta.button')} <ChevronRight size={20} />
            </a>
            <p style={{ marginTop: '1rem', fontSize: '0.82rem', color: C.textMuted }}>{t('cta.trust')}</p>
          </FadeIn>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '2.5rem 2rem', background: C.bgCard }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '3rem', marginBottom: '2.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.75rem' }}>
                <img src="/atento-logo.png" alt="Atento AI" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', boxShadow: '0 4px 14px rgba(124,58,237,0.28)' }} />
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: C.text }}>Atento AI</span>
              </div>
              <p style={{ color: C.textMuted, fontSize: '0.87rem', lineHeight: 1.65, maxWidth: '240px', margin: 0 }}>{t('footer.tagline')}</p>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: C.textSec, marginBottom: '1rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('footer.product')}</div>
              {[['features', t('nav.features')],['pricing', t('nav.pricing')],['reviews', t('nav.clients')]].map(([id, label]) => (
                <div key={id} style={{ marginBottom: '0.6rem' }}><button onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: '0.87rem', padding: 0, fontFamily: 'inherit' }}>{label}</button></div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: C.textSec, marginBottom: '1rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('footer.legal')}</div>
              {[[t('footer.privacy'),'/privacidad'],[t('footer.terms'),'/terminos'],[t('footer.contact'),'mailto:hola@atento.ai']].map(([label, href]) => (
                <div key={label} style={{ marginBottom: '0.6rem' }}><a href={href} style={{ color: C.textMuted, textDecoration: 'none', fontSize: '0.87rem' }}>{label}</a></div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: C.textMuted }}>© 2026 Atento AI. {t('footer.rights')} · Hecho en Argentina 🇦🇷</span>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem' }}>
              <a href="mailto:hola@atento.ai" style={{ color: C.textMuted, textDecoration: 'none' }}>hola@atento.ai</a>
              <a href="/login" style={{ color: C.textMuted, textDecoration: 'none' }}>{t('nav.login')}</a>
              <a href="/registro" style={{ background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none', fontWeight: 700 }}>{t('nav.start')}</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
