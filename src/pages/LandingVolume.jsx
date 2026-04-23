import { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, Check, Star, MessageCircle, Clock, Zap, Shield,
  TrendingUp, Users, Menu, X, ChevronDown, Send,
} from 'lucide-react';

/* ─── Paleta ─────────────────────────────────────────── */
const C = {
  bg:        '#0a0f1e',
  bgCard:    '#111827',
  bgCard2:   '#0f1629',
  border:    '#1e2d45',
  text:      '#ffffff',
  textSec:   '#94a3b8',
  textMuted: '#64748b',
  blue:      '#3b82f6',
  violet:    '#8b5cf6',
  green:     '#10b981',
  waGreen:   '#25d366',
  waDark:    '#128c7e',
  grad:      'linear-gradient(135deg,#3b82f6,#8b5cf6)',
};

/* ─── Datos ───────────────────────────────────────────── */
const WA_MESSAGES = [
  { from: 'client', text: 'Hola! tienen la campera de cuero en talle M?' },
  { from: 'bot',    text: '¡Hola! Sí, tenemos la campera de cuero negra en talle M. El precio es $89.990. ¿Querés que te reserve una?' },
  { from: 'client', text: 'Si! Cuanto tarda el envío?' },
  { from: 'bot',    text: 'El envío demora entre 24 y 48hs hábiles. Hacemos envíos a todo el país por Correo Argentino o Andreani. ¿Seguimos?' },
  { from: 'client', text: 'Dale, perfecto!' },
  { from: 'bot',    text: '🎉 ¡Listo! Te mando los datos de pago ahora.' },
];

const BRANDS = [
  { icon: '👕', name: 'Indumentaria CABA' },
  { icon: '📱', name: 'Electrónica Rosario' },
  { icon: '💎', name: 'Joyería online' },
  { icon: '🔧', name: 'Ferretería mayorista' },
  { icon: '💄', name: 'Cosméticos MdP' },
  { icon: '💪', name: 'Suplementos' },
  { icon: '🛋️', name: 'Mueblería Córdoba' },
  { icon: '📚', name: 'Librería online' },
];

const FEATURES = [
  { icon: '💬', color: C.blue,   title: 'Responde como humano',          desc: 'No hay menús, no hay botones. Entiende el contexto, recuerda lo que se habló y responde de forma natural en cada conversación.' },
  { icon: '🕐', color: C.green,  title: 'Disponible las 24 horas',       desc: 'Tu competidor tarda 2 horas en responder. Asisto lo hace en 3 segundos, a las 3am del domingo. Cada mensaje sin respuesta es una venta que se va.' },
  { icon: '⚡', color: '#f59e0b', title: 'Conoce tu catálogo en vivo',    desc: 'Se conecta con tu tienda y sabe en tiempo real qué hay en stock, a qué precio y con qué características. Nunca inventa un precio.' },
  { icon: '🛡️', color: C.violet, title: 'Aprende las reglas de tu negocio', desc: 'Le explicás cómo funciona tu local, tus condiciones de venta, tus políticas. Él las aplica en cada conversación.' },
  { icon: '📈', color: '#ef4444', title: 'Convierte consultas en ventas', desc: 'No solo informa — guía al cliente hacia la compra. Sugiere productos, calcula precios y cierra el trato cuando el cliente está listo.' },
  { icon: '🎛️', color: '#06b6d4', title: 'Control total desde tu panel',  desc: 'Modificá el comportamiento del bot, actualizá el catálogo y revisá métricas desde un panel simple. Vos decidís cómo responde.' },
];

const BEFORE_AFTER = [
  { bad: 'Perdés ventas mientras dormís',              good: 'Respondés en 3 segundos a las 3am' },
  { bad: 'Prometés precios que no tenés',              good: 'Siempre informa el stock real' },
  { bad: 'Tardás horas en responder',                  good: 'Respuesta inmediata, siempre' },
  { bad: 'Cada consulta te interrumpe',                good: 'Solo ves las que necesitan tu atención' },
  { bad: 'Pagás sueldo aunque no haya ventas',         good: 'Costo fijo, sin sorpresas' },
];

const STEPS = [
  { n: '1', title: 'Creás tu cuenta',             desc: 'Registrate con tu email en menos de 60 segundos.', icon: '👤' },
  { n: '2', title: 'Configurás la personalidad',  desc: 'Le decís cómo tiene que hablar: tono, nombre, idioma, qué puede y qué no puede decir.', icon: '🧠' },
  { n: '3', title: 'Conectás tu catálogo',        desc: 'Pegás el link de tu tienda Shopify o Google Sheets y el bot lo aprende automáticamente.', icon: '⚡' },
  { n: '4', title: 'Escaneás el QR de WhatsApp', desc: 'Vinculás tu número y listo. El bot empieza a responder en segundos.', icon: '📱' },
];

const REVIEWS = [
  { name: 'Marcelo R.',  biz: 'Indumentaria CABA',         text: 'Tenía miedo de que fuera un bot genérico, pero Asisto entiende el contexto. Mis clientes no saben que están hablando con una IA. Triplicamos las consultas respondidas en el primer mes.' },
  { name: 'Valentina G.',biz: 'Tienda de suplementos',     text: 'Antes perdía ventas porque no podía responder a la noche. Ahora el bot atiende a las 3am igual que a las 3pm. Las ventas de madrugada solas amortizaron el costo del plan.' },
  { name: 'Diego M.',    biz: 'Electrónica Rosario',       text: 'Lo que más me sorprendió es que sabe cuándo hay stock y cuándo no. Nunca le prometió algo a un cliente que no teníamos. Eso solo ya vale el precio.' },
  { name: 'Carolina F.', biz: 'Joyería online',            text: 'Mis clientes son exigentes y pensé que iban a notar que era un bot. Nada. El tono que configuré es exactamente el de nuestra marca. Resultados increíbles desde el día 1.' },
  { name: 'Tomás B.',    biz: 'Ferretería mayorista',      text: 'Manejo más de 2000 productos y Asisto los conoce todos. Precio, disponibilidad, descripción. Mis vendedores ahora se enfocan en cerrar los pedidos grandes.' },
  { name: 'Lucía P.',    biz: 'Cosméticos Mar del Plata',  text: 'En dos semanas ya recuperé lo que pagué. Los clientes escriben, el bot responde, yo solo confirmo el pedido. No puedo creer que antes no lo tenía.' },
];

const PLANS = [
  {
    name: 'Starter', price: 49, desc: 'Para negocios que empiezan a automatizar',
    features: ['1 número WhatsApp', 'Hasta 500 mensajes/mes', 'Catálogo sincronizado', 'Panel de control', 'Soporte por email'],
    highlight: false, cta: 'Empezar gratis',
  },
  {
    name: 'Pro', price: 89, desc: 'El más elegido por negocios en crecimiento',
    features: ['Todo lo de Starter', 'Hasta 2.000 mensajes/mes', 'Soporte prioritario', 'Horario anti-nocturno', 'Base de conocimientos avanzada'],
    highlight: true, cta: 'Empezar gratis',
  },
  {
    name: 'Business', price: 149, desc: 'Para negocios con alto volumen de consultas',
    features: ['Todo lo de Pro', 'Mensajes ilimitados', 'Soporte directo WhatsApp', '+Instagram próximamente'],
    highlight: false, cta: 'Empezar gratis',
  },
];

const FAQS = [
  { q: '¿Puedo cancelar cuando quiero?',               a: 'Sí, sin permanencia ni penalidades. Cancelás desde tu panel en cualquier momento.' },
  { q: '¿Qué pasa si supero el límite de mensajes?',   a: 'Te avisamos antes de llegar al límite. Podés upgradear o esperar el próximo mes sin que el servicio se corte abruptamente.' },
  { q: '¿Funciona con cualquier número de WhatsApp?',  a: 'Funciona con WhatsApp Business y números personales. No necesitás cambiar tu número actual.' },
  { q: '¿Puedo cambiar de plan?',                      a: 'Sí, en cualquier momento desde tu panel. El cambio se aplica de forma inmediata.' },
];

/* ─── Helpers ─────────────────────────────────────────── */
function getDemoResponse(input) {
  const t = input.toLowerCase();
  if (/precio|cuanto|cuesta|vale|costo/.test(t))      return '¡Hola! El precio varía según el modelo. Los más vendidos arrancan desde $29.990. ¿Querés que te cuente más sobre alguno en particular?';
  if (/stock|tienen|hay|disponible/.test(t))           return 'Sí, tenemos stock disponible 👌 ¿En qué talle, color o modelo te interesa?';
  if (/envío|mandan|llega|despacho/.test(t))           return 'Enviamos a todo el país 🚚 El envío demora 24-48hs hábiles por Correo Argentino o Andreani.';
  if (/pago|transferencia|mercadopago|tarjeta/.test(t)) return 'Aceptamos transferencia bancaria, Mercado Pago y tarjeta de crédito en cuotas 💳';
  if (/horario|atienden|cuando|abierto/.test(t))       return 'Asisto responde automáticamente las 24 horas, los 7 días de la semana, feriados incluidos 😄';
  if (/devolución|cambio|garantía/.test(t))            return 'Tenemos 30 días de garantía. Si el producto llega en mal estado, el cambio es sin costo.';
  return '¡Hola! Podés preguntarme sobre precios, stock, envíos, formas de pago o cualquier duda sobre los productos 😊';
}

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
    const steps = 60;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setVal(Math.round((target * i) / steps));
      if (i >= steps) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [inView, target]);
  return <span ref={ref}>{typeof target === 'number' ? val.toLocaleString() : target}{suffix}</span>;
}

/* ─── WhatsApp Mockup ─────────────────────────────────── */
function WhatsAppMockup() {
  const [visible, setVisible] = useState([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let idx = 0;
    function next() {
      if (idx >= WA_MESSAGES.length) return;
      const msg = WA_MESSAGES[idx];
      if (msg.from === 'bot') {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          setVisible(v => [...v, msg]);
          idx++;
          setTimeout(next, 1200);
        }, 1500);
      } else {
        setVisible(v => [...v, msg]);
        idx++;
        setTimeout(next, 900);
      }
    }
    setTimeout(next, 600);
  }, []);

  const now = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ width: '100%', maxWidth: '340px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.6)', border: '6px solid #1a1a2e', background: '#0b141a', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header WA */}
      <div style={{ background: '#202c33', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>A</div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>Asisto AI Bot</div>
          <div style={{ fontSize: '0.72rem', color: '#8696a0' }}>{typing ? 'escribiendo...' : 'en línea'}</div>
        </div>
      </div>
      {/* Chat body */}
      <div style={{ background: '#0b141a', padding: '12px', minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3C/svg%3E\")" }}>
        {visible.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'bot' ? 'flex-start' : 'flex-end', animation: 'fadeSlideUp 0.3s ease' }}>
            <div style={{
              maxWidth: '80%', padding: '7px 10px 5px', borderRadius: m.from === 'bot' ? '0 10px 10px 10px' : '10px 0 10px 10px',
              background: m.from === 'bot' ? '#202c33' : '#005c4b',
              fontSize: '0.82rem', color: 'white', lineHeight: 1.5, position: 'relative',
            }}>
              {m.text}
              <div style={{ fontSize: '0.65rem', color: '#8696a0', textAlign: 'right', marginTop: '3px' }}>
                {now} {m.from === 'bot' ? '' : '✓✓'}
              </div>
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#202c33', borderRadius: '0 10px 10px 10px', padding: '10px 14px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#8696a0', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Input WA */}
      <div style={{ background: '#202c33', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, background: '#2a3942', borderRadius: '20px', padding: '8px 14px', fontSize: '0.82rem', color: '#8696a0' }}>Escribí un mensaje</div>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: C.waDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🎤</div>
      </div>
    </div>
  );
}

/* ─── Demo Interactivo ────────────────────────────────── */
function DemoChat() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: '¡Hola! Soy el asistente virtual. Preguntame sobre precios, stock, envíos o lo que necesites 😊' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const now = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  function send() {
    const txt = input.trim();
    if (!txt || loading) return;
    setInput('');
    setMessages(m => [...m, { from: 'client', text: txt }]);
    setLoading(true);
    setTimeout(() => {
      setMessages(m => [...m, { from: 'bot', text: getDemoResponse(txt) }]);
      setLoading(false);
    }, 1200);
  }

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', borderRadius: '24px', overflow: 'hidden', border: '1px solid #1e2d45', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
      <div style={{ background: '#202c33', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white' }}>A</div>
        <div>
          <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>Demo — Asisto AI</div>
          <div style={{ fontSize: '0.75rem', color: C.waGreen }}>● en línea ahora</div>
        </div>
      </div>
      <div style={{ background: '#0b141a', padding: '14px', height: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'bot' ? 'flex-start' : 'flex-end' }}>
            <div style={{ maxWidth: '80%', padding: '8px 11px 5px', borderRadius: m.from === 'bot' ? '0 10px 10px 10px' : '10px 0 10px 10px', background: m.from === 'bot' ? '#202c33' : '#005c4b', fontSize: '0.85rem', color: 'white', lineHeight: 1.5 }}>
              {m.text}
              <div style={{ fontSize: '0.65rem', color: '#8696a0', textAlign: 'right', marginTop: '3px' }}>{now}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex' }}>
            <div style={{ background: '#202c33', borderRadius: '0 10px 10px 10px', padding: '10px 14px', display: 'flex', gap: '4px' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#8696a0', animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ background: '#202c33', padding: '10px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Escribí tu consulta..."
          style={{ flex: 1, background: '#2a3942', border: 'none', borderRadius: '20px', padding: '9px 16px', color: 'white', fontSize: '0.88rem', outline: 'none' }}
        />
        <button onClick={send} style={{ width: '38px', height: '38px', borderRadius: '50%', background: C.waDark, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={16} color="white" />
        </button>
      </div>
    </div>
  );
}

/* ─── FAQ Accordion ───────────────────────────────────── */
function Accordion({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${open ? C.blue : C.border}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s', marginBottom: '0.75rem' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', background: C.bgCard, border: 'none', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: C.text, fontSize: '0.97rem', fontWeight: 600, textAlign: 'left' }}>
        {q}
        <ChevronDown size={18} color={C.textSec} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>
      {open && <div style={{ background: C.bgCard2, padding: '0 1.25rem 1rem', color: C.textSec, fontSize: '0.92rem', lineHeight: 1.65 }}>{a}</div>}
    </div>
  );
}

/* ─── FadeIn wrapper ──────────────────────────────────── */
function FadeIn({ children, delay = 0, style = {} }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(28px)', transition: `opacity 0.6s ${delay}s, transform 0.6s ${delay}s`, ...style }}>
      {children}
    </div>
  );
}

/* ─── MAIN ────────────────────────────────────────────── */
export default function LandingVolume() {
  const [menuOpen, setMenuOpen] = useState(false);

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
        @keyframes bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-6px); } }
        @keyframes marquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes shimmer { 0%,100% { box-shadow:0 0 0 0 rgba(59,130,246,0); } 50% { box-shadow:0 0 24px 8px rgba(59,130,246,0.35); } }
        @keyframes glow { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
        .btn-cta:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(59,130,246,0.4); }
        .btn-ghost:hover { background:rgba(255,255,255,0.06); }
        .feature-card:hover { border-color:${C.blue} !important; transform:translateY(-4px); box-shadow:0 12px 28px rgba(0,0,0,0.4); }
        .review-card:hover { transform:translateY(-3px); }
        .plan-card:hover { transform:translateY(-4px); }
      `}</style>

      {/* ════════════ NAVBAR ════════════ */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,15,30,0.88)', backdropFilter: 'blur(18px)', borderBottom: `1px solid ${C.border}`, padding: '0 2rem' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '66px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => scrollTo('hero')}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', color: 'white' }}>A</div>
            Asisto AI
          </div>
          {/* Desktop links */}
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="desktop-nav">
            {['features|Funciones','pricing|Precios','reviews|Casos de éxito'].map(s => {
              const [id, label] = s.split('|');
              return <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: C.textSec, cursor: 'pointer', fontSize: '0.92rem', fontWeight: 500 }}>{label}</button>;
            })}
            <a href="/login" style={{ color: C.textSec, textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500 }}>Ingresar</a>
            <button onClick={() => scrollTo('cta')} className="btn-cta" style={{ background: C.blue, border: 'none', color: 'white', padding: '0.5rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Empezar gratis <ChevronRight size={15} />
            </button>
          </div>
          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', color: C.text, cursor: 'pointer' }} className="hamburger">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ borderTop: `1px solid ${C.border}`, padding: '1rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {['features|Funciones','pricing|Precios','reviews|Casos de éxito'].map(s => {
              const [id, label] = s.split('|');
              return <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: C.textSec, cursor: 'pointer', fontSize: '1rem', textAlign: 'left', padding: '0.25rem 0' }}>{label}</button>;
            })}
            <a href="/login" style={{ color: C.textSec, textDecoration: 'none', fontSize: '1rem' }}>Ingresar</a>
            <button onClick={() => scrollTo('cta')} className="btn-cta" style={{ background: C.blue, border: 'none', color: 'white', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, transition: 'all 0.2s' }}>
              Empezar gratis →
            </button>
          </div>
        )}
      </nav>

      {/* ════════════ HERO ════════════ */}
      <section id="hero" style={{ padding: 'clamp(4rem,10vw,8rem) 2rem clamp(3rem,6vw,5rem)', background: `radial-gradient(ellipse 80% 55% at 50% -5%, rgba(59,130,246,0.14) 0%, transparent 70%)` }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: '4rem', alignItems: 'center' }}>
          <div>
            {/* Badge */}
            <FadeIn>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '99px', padding: '0.35rem 1rem', fontSize: '0.82rem', color: '#93c5fd', marginBottom: '1.75rem' }}>
                <Zap size={13} /> Nuevo · Asisto AI 2.0 ya disponible
              </div>
            </FadeIn>
            {/* Headline */}
            <FadeIn delay={0.05}>
              <h1 style={{ fontSize: 'clamp(2.4rem,5vw,4.2rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2.5px', marginBottom: '1.5rem', margin: '0 0 1.5rem' }}>
                Tu negocio responde solo.<br />
                <span style={{ background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  24 horas. Sin errores. Sin sueldo.
                </span>
              </h1>
            </FadeIn>
            {/* Sub */}
            <FadeIn delay={0.1}>
              <p style={{ fontSize: '1.15rem', color: C.textSec, lineHeight: 1.7, maxWidth: '520px', marginBottom: '2.25rem' }}>
                Asisto AI es un empleado virtual que atiende por WhatsApp, conoce tu catálogo al detalle y responde como un humano — sin que vos estés presente.
              </p>
            </FadeIn>
            {/* CTAs */}
            <FadeIn delay={0.15}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <button onClick={() => scrollTo('cta')} className="btn-cta" style={{ background: C.grad, border: 'none', color: 'white', padding: '0.9rem 1.8rem', borderRadius: '10px', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 700, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'shimmer 2.5s infinite' }}>
                  Empezar gratis <ChevronRight size={18} />
                </button>
                <button onClick={() => scrollTo('demo')} className="btn-ghost" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.text, padding: '0.9rem 1.8rem', borderRadius: '10px', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 500, transition: 'all 0.2s' }}>
                  Ver demo en vivo
                </button>
              </div>
              <p style={{ fontSize: '0.82rem', color: C.textMuted }}>Sin tarjeta de crédito · Configuración en 5 minutos</p>
            </FadeIn>
          </div>

          {/* WhatsApp Mockup */}
          <FadeIn delay={0.2} style={{ display: 'flex', justifyContent: 'center' }}>
            <WhatsAppMockup />
          </FadeIn>
        </div>

        {/* Metrics bar */}
        <div style={{ maxWidth: '700px', margin: '4.5rem auto 0', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: C.border, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
          {[
            { n: 2400, suffix: '+', label: 'Consultas respondidas', pre: '' },
            { n: null, label: 'Tiempo de respuesta', pre: '< 3 seg' },
            { n: 98, suffix: '%', label: 'Satisfacción de clientes', pre: '' },
          ].map((s, i) => (
            <FadeIn key={i} delay={0.25 + i * 0.07} style={{ background: C.bgCard, padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: C.text }}>
                {s.n !== null ? <><AnimatedCounter target={s.n} />{s.suffix}</> : s.pre}
              </div>
              <div style={{ fontSize: '0.82rem', color: C.textSec, marginTop: '0.3rem' }}>{s.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ════════════ SOCIAL PROOF BAR ════════════ */}
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '2rem 0', overflow: 'hidden', background: C.bgCard2 }}>
        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Negocios que ya confían en Asisto AI</p>
        <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 22s linear infinite' }}>
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '99px', padding: '0.4rem 1rem', marginRight: '1rem', whiteSpace: 'nowrap', fontSize: '0.85rem', color: C.textSec }}>
              <span style={{ fontSize: '1rem' }}>{b.icon}</span> {b.name}
            </div>
          ))}
        </div>
      </section>

      {/* ════════════ FEATURES ════════════ */}
      <section id="features" style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.9rem)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '1rem' }}>No es un bot. Es un empleado que nunca falta.</h2>
            <p style={{ color: C.textSec, fontSize: '1.1rem', maxWidth: '520px', margin: '0 auto' }}>La diferencia entre perder una venta y cerrarla está en los primeros 3 minutos de respuesta.</p>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.25rem' }}>
            {FEATURES.map((f, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="feature-card" style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.75rem', transition: 'all 0.25s', height: '100%' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: `${f.color}18`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '1.1rem' }}>{f.icon}</div>
                  <h3 style={{ fontSize: '1.08rem', fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
                  <p style={{ color: C.textSec, fontSize: '0.92rem', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ ANTES / DESPUÉS ════════════ */}
      <section style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', background: C.bgCard2, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '0.75rem' }}>Lo que cambia cuando Asisto trabaja para vos</h2>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <FadeIn delay={0.05}>
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '1.25rem', fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>❌ Sin Asisto AI</div>
                {BEFORE_AFTER.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.85rem', fontSize: '0.92rem', color: C.textSec }}>
                    <span style={{ color: '#f87171', flexShrink: 0, marginTop: '1px' }}>✕</span> {r.bad}
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ fontWeight: 700, color: C.green, marginBottom: '1.25rem', fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>✅ Con Asisto AI</div>
                {BEFORE_AFTER.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.85rem', fontSize: '0.92rem', color: C.textSec }}>
                    <span style={{ color: C.green, flexShrink: 0, marginTop: '1px' }}>✓</span> {r.good}
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ════════════ CÓMO FUNCIONA ════════════ */}
      <section style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '0.75rem' }}>En 5 minutos tu bot está activo</h2>
            <p style={{ color: C.textSec, fontSize: '1.05rem' }}>Sin instalar nada, sin programar nada, sin conocimientos técnicos.</p>
          </FadeIn>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {STEPS.map((s, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.4rem 1.6rem', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.blue}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem', flexShrink: 0, color: 'white' }}>{s.n}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.2rem' }}>{s.title}</div>
                    <div style={{ color: C.textSec, fontSize: '0.92rem' }}>{s.desc}</div>
                  </div>
                  <div style={{ fontSize: '1.6rem', flexShrink: 0 }}>{s.icon}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ DEMO INTERACTIVO ════════════ */}
      <section id="demo" style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', background: C.bgCard2, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '99px', padding: '0.3rem 0.9rem', fontSize: '0.8rem', color: C.waGreen, marginBottom: '1rem' }}>
              ● Demo en vivo
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '0.75rem' }}>Probalo ahora, sin registrarte</h2>
            <p style={{ color: C.textSec, fontSize: '1.05rem' }}>Escribile un mensaje como si fueras un cliente. Mirá cómo responde.</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <DemoChat />
          </FadeIn>
          <FadeIn delay={0.15} style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button onClick={() => scrollTo('cta')} className="btn-cta" style={{ background: C.grad, border: 'none', color: 'white', padding: '0.85rem 2rem', borderRadius: '10px', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              ¿Te gustó? Creá tu propio bot gratis <ChevronRight size={17} />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ════════════ TESTIMONIOS ════════════ */}
      <section id="reviews" style={{ padding: 'clamp(4rem,8vw,7rem) 2rem', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '0.75rem' }}>Lo que dicen los que ya lo usan</h2>
            <p style={{ color: C.textSec, fontSize: '1.05rem' }}>Negocios reales, resultados reales.</p>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
            {REVIEWS.map((r, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <div className="review-card" style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', transition: 'transform 0.2s' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {Array.from({length:5}).map((_,j) => <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />)}
                  </div>
                  <p style={{ color: C.textSec, lineHeight: 1.65, margin: 0, fontSize: '0.92rem', fontStyle: 'italic', flex: 1 }}>"{r.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', color: 'white', flexShrink: 0 }}>{r.name[0]}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.name}</div>
                      <div style={{ fontSize: '0.78rem', color: C.textMuted }}>{r.biz}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          {/* Métricas globales */}
          <FadeIn>
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.1rem 2rem', display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', fontSize: '0.88rem', color: C.textSec }}>
              {['10.000+ mensajes respondidos esta semana', '4.9/5 promedio de satisfacción', '340+ negocios activos'].map((t,i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: C.green }}>●</span> {t}
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
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '0.75rem' }}>Precios claros. Sin sorpresas.</h2>
            <p style={{ color: C.textSec, fontSize: '1.05rem' }}>Todos los planes incluyen 7 días de prueba gratis.</p>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: '1.5rem', alignItems: 'stretch', marginBottom: '2rem' }}>
            {PLANS.map((p, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <div className="plan-card" style={{ background: C.bgCard, border: `1px solid ${p.highlight ? C.blue : C.border}`, borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', boxShadow: p.highlight ? '0 0 40px rgba(59,130,246,0.14)' : 'none', transition: 'transform 0.2s', height: '100%' }}>
                  {p.highlight && <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: C.grad, borderRadius: '99px', padding: '0.25rem 1rem', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', color: 'white' }}>MÁS POPULAR</div>}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: C.textSec, marginBottom: '0.5rem' }}>{p.name}</div>
                    <div style={{ fontSize: '2.6rem', fontWeight: 900, letterSpacing: '-1.5px' }}>USD {p.price}<span style={{ fontSize: '1rem', fontWeight: 400, color: C.textSec }}>/mes</span></div>
                    <div style={{ fontSize: '0.88rem', color: C.textMuted, marginTop: '0.25rem' }}>{p.desc}</div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                    {p.features.map((f, j) => (
                      <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.9rem' }}>
                        <Check size={14} color={C.green} style={{ flexShrink: 0, marginTop: '2px' }} /> {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => scrollTo('cta')} className={p.highlight ? 'btn-cta' : 'btn-ghost'} style={{ padding: '0.85rem', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', ...(p.highlight ? { background: C.grad, border: 'none', color: 'white' } : { background: 'none', border: `1px solid ${C.border}`, color: C.text }) }}>
                    {p.cta}
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn>
            <p style={{ textAlign: 'center', color: C.textSec, fontSize: '0.88rem' }}>
              Los precios son en USD · <a href="mailto:hola@asisto.ai" style={{ color: C.blue, textDecoration: 'none' }}>¿Manejás múltiples negocios? Escribinos para el plan Agency →</a>
            </p>
          </FadeIn>
          {/* FAQ */}
          <FadeIn delay={0.1} style={{ maxWidth: '650px', margin: '3rem auto 0' }}>
            <h3 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.15rem', marginBottom: '1.5rem', color: C.textSec }}>Preguntas frecuentes</h3>
            {FAQS.map((f, i) => <Accordion key={i} q={f.q} a={f.a} />)}
          </FadeIn>
        </div>
      </section>

      {/* ════════════ CTA FINAL ════════════ */}
      <section id="cta" style={{ padding: 'clamp(5rem,10vw,9rem) 2rem', textAlign: 'center', background: `radial-gradient(ellipse 80% 60% at 50% 100%, rgba(59,130,246,0.12) 0%, transparent 65%)` }}>
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          <FadeIn>
            <h2 style={{ fontSize: 'clamp(1.9rem,3.5vw,3rem)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '1rem', lineHeight: 1.1 }}>Tu próxima venta está esperando respuesta.</h2>
          </FadeIn>
          <FadeIn delay={0.06}>
            <p style={{ color: C.textSec, fontSize: '1.1rem', marginBottom: '2.5rem' }}>Empezá hoy. En 5 minutos tu bot está activo y respondiendo.</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <a href="/registro" className="btn-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1.05rem 2.4rem', fontSize: '1.1rem', borderRadius: '12px', textDecoration: 'none', background: C.grad, color: 'white', fontWeight: 700, transition: 'all 0.2s' }}>
              Crear mi cuenta gratis <ChevronRight size={20} />
            </a>
            <p style={{ marginTop: '1rem', fontSize: '0.82rem', color: C.textMuted }}>Sin tarjeta de crédito · 7 días gratis · Cancelás cuando quieras</p>
          </FadeIn>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '3rem 2rem', background: C.bgCard2 }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', color: 'white' }}>A</div>
                Asisto AI
              </div>
              <p style={{ color: C.textMuted, fontSize: '0.88rem', lineHeight: 1.6, maxWidth: '260px' }}>El empleado que nunca falla. Disponible 24/7, conoce tu negocio al detalle y responde como humano.</p>
            </div>
            {/* Links */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: C.textSec, marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Producto</div>
              {['Funciones|features','Precios|pricing','Casos de éxito|reviews'].map(s => {
                const [label, id] = s.split('|');
                return <div key={id} style={{ marginBottom: '0.6rem' }}><button onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: '0.88rem', padding: 0 }}>{label}</button></div>;
              })}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: C.textSec, marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Legal</div>
              {['Política de privacidad','Términos y condiciones','Contacto'].map(t => (
                <div key={t} style={{ marginBottom: '0.6rem' }}><a href={`mailto:hola@asisto.ai`} style={{ color: C.textMuted, textDecoration: 'none', fontSize: '0.88rem' }}>{t}</a></div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.82rem', color: C.textMuted }}>© 2026 Asisto AI. Todos los derechos reservados. · Hecho en Argentina 🇦🇷</div>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem' }}>
              <a href="mailto:hola@asisto.ai" style={{ color: C.textMuted, textDecoration: 'none' }}>hola@asisto.ai</a>
              <a href="/login" style={{ color: C.textMuted, textDecoration: 'none' }}>Ingresar</a>
              <a href="/registro" style={{ color: C.blue, textDecoration: 'none', fontWeight: 600 }}>Registrarse</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
          #hero > div > div:first-child + div { display: none; }
          #hero > div { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          #pricing > div > div:nth-child(2) { grid-template-columns: 1fr !important; }
          footer > div > div:first-child { grid-template-columns: 1fr !important; }
          #reviews > div > div:nth-child(2) { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
