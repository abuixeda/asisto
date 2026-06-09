import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const API = 'https://asisto-backend-production.up.railway.app';

const SLIDES = [
  {
    icon: 'AI',
    color: '#7c3aed',
    title: 'Bienvenido a Atento AI',
    desc: 'Acabas de crear tu asistente virtual. Desde el panel vas a entrenarlo, conectarlo a WhatsApp y medir como responde a tus clientes.',
    cta: 'Empezar tour',
  },
  {
    icon: '24',
    color: '#3b82f6',
    title: 'Responde por vos',
    desc: 'Tus clientes escriben por WhatsApp y el bot responde consultas de precios, disponibilidad, horarios, envios y condiciones sin que tengas que estar conectado todo el dia.',
    cta: 'Siguiente',
  },
  {
    icon: 'KB',
    color: '#8b5cf6',
    title: 'Conoce tu negocio',
    desc: 'Carga la personalidad, la base de conocimiento y el catalogo desde Google Sheets. Cuanto mejor este esa informacion, mejor va a vender y responder.',
    cta: 'Siguiente',
  },
  {
    icon: 'TEST',
    color: '#06b6d4',
    title: 'Proba antes de activar',
    desc: 'En el panel tenes una seccion para hablar con el asistente de prueba. Asi podes ajustar respuestas antes de conectarlo al WhatsApp real del negocio.',
    cta: 'Siguiente',
  },
  {
    icon: 'CHAT',
    color: '#10b981',
    title: 'Revisa chats y metricas',
    desc: 'Vas a poder ver los chats que contesta el bot, medir clientes atendidos, horarios pico, canales, temas frecuentes y uso mensual por plan.',
    cta: 'Siguiente',
  },
  {
    icon: 'CAL',
    color: '#10b981',
    title: 'Toma turnos solo',
    desc: 'Si tu negocio trabaja con turnos, podes configurar servicios, horarios y capacidad para que el asistente reserve automaticamente.',
    cta: 'Siguiente',
  },
  {
    icon: 'BULK',
    color: '#f59e0b',
    title: 'Campanas y seguimiento',
    desc: 'Tambien podes lanzar campanas de mensajes, importar leads y controlar el uso mensual segun el plan contratado.',
    cta: 'Siguiente',
  },
  {
    icon: 'QR',
    color: '#06b6d4',
    title: 'Conecta tu WhatsApp',
    desc: 'El ultimo paso es escanear el codigo QR con WhatsApp para vincular el numero del negocio. Si preferis, tambien podes hacerlo despues desde el panel.',
    cta: null, // handled separately (QR step)
  },
];

export default function Onboarding() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('merchant_token') || '');
  const [botId, setBotId] = useState(localStorage.getItem('merchant_bot_id') || '');
  const [tempPwd, setTempPwd] = useState('');

  const [slide, setSlide] = useState(0);
  const [animating, setAnimating] = useState(false);

  // WhatsApp
  const [qrData, setQrData] = useState(null);
  const [botStatus, setBotStatus] = useState('OFF');
  const pollRef = useRef(null);

  const isLastSlide = slide === SLIDES.length - 1;

  useEffect(() => {
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('merchant_token', urlToken);
      setToken(urlToken);
      try {
        const payload = JSON.parse(atob(urlToken.split('.')[1]));
        if (payload.botId) {
          localStorage.setItem('merchant_bot_id', payload.botId);
          setBotId(payload.botId);
        }
      } catch (_e) { /* ignore */ }
      fetch(`${API}/api/merchant/temp-password`, {
        headers: { Authorization: `Bearer ${urlToken}` }
      }).then(r => r.json()).then(d => { if (d.tempPwd) setTempPwd(d.tempPwd); }).catch(() => {});
    }
    if (params.get('shop') || (params.get('platform') && params.get('platform') !== 'other')) {
      setSlide(SLIDES.length - 1);
    }
  }, [params]);

  async function startBot() {
    if (!botId || !token) return;
    try {
      await fetch(`${API}/api/bots/${botId}/start`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      pollRef.current = setInterval(pollStatus, 2000);
    } catch (_e) { /* ignore */ }
  }

  async function pollStatus() {
    try {
      const res = await fetch(`${API}/api/bots/${botId}/status`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.qr) setQrData(d.qr);
      if (d.status === 'ON') {
        setBotStatus('ON');
        clearInterval(pollRef.current);
      }
    } catch (_e) { /* ignore */ }
  }

  useEffect(() => {
    if (isLastSlide) startBot();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isLastSlide]);

  function goTo(idx) {
    if (animating || idx === slide) return;
    setAnimating(true);
    setTimeout(() => {
      setSlide(idx);
      setAnimating(false);
    }, 200);
  }

  function next() { if (!isLastSlide) goTo(slide + 1); }

  const s = SLIDES[slide];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '1rem' }}>
          <div className="brand-logo" style={{ width: '28px', height: '28px', fontSize: '0.85rem', margin: 0, boxShadow: 'none' }}><img src="/atento-logo.png" alt="Atento AI" /></div>
          Atento AI
        </div>
        <button onClick={() => nav('/mi-panel')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem' }}>
          Saltar
        </button>
      </div>

      {/* Contrasena temporal */}
      {tempPwd && (
        <div style={{ margin: '0 2rem', background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#10b981', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 8, padding: '0.35rem 0.45rem', flexShrink: 0 }}>KEY</span>
          <div>
            <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '0.25rem' }}>Guarda tu contrasena temporal. Solo se muestra esta vez.</div>
            <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '2px', color: '#fff', userSelect: 'all' }}>{tempPwd}</div>
          </div>
        </div>
      )}

      {/* Slide principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', transition: 'opacity 0.2s', opacity: animating ? 0 : 1 }}>

        {/* Icono */}
        <div style={{
          width: '110px', height: '110px', borderRadius: '32px',
          background: `linear-gradient(135deg, ${s.color}33, ${s.color}11)`,
          border: `2px solid ${s.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: s.icon.length > 3 ? '1.35rem' : '2rem', marginBottom: '2rem',
          fontWeight: 900,
          letterSpacing: 0,
          color: s.color,
          boxShadow: `0 0 40px ${s.color}22`,
          transition: 'all 0.2s',
        }}>
          {s.icon}
        </div>

        {/* Texto */}
        <div style={{ maxWidth: '480px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, margin: '0 0 1rem', lineHeight: 1.2 }}>
            {s.title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 0 2.5rem' }}>
            {s.desc}
          </p>
        </div>

        {/* QR (ultimo slide) */}
        {isLastSlide && (
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            {botStatus === 'ON' ? (
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', marginBottom: '0.75rem' }}>OK</div>
                <p style={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem', margin: '0 0 1.5rem' }}>WhatsApp conectado!</p>
                <button onClick={() => nav('/mi-panel')} style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none', borderRadius: '12px', color: '#fff', cursor: 'pointer', padding: '1rem 2.5rem', fontSize: '1.05rem', fontWeight: 700 }}>
                  Ir a mi panel
                </button>
              </div>
            ) : qrData ? (
              <div>
                <div style={{ background: 'white', padding: '14px', borderRadius: '16px', border: `3px solid ${s.color}`, display: 'inline-block', marginBottom: '1rem' }}>
                  <QRCodeSVG value={qrData} size={220} />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Esperando que escanees...</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: s.color, marginBottom: '0.5rem' }}>QR</div>
                <p style={{ margin: 0 }}>Generando codigo QR...</p>
              </div>
            )}
          </div>
        )}

        {/* CTA button (slides que no son el ultimo o el ultimo sin QR listo) */}
        {!isLastSlide && (
          <button onClick={next} style={{
            background: `linear-gradient(135deg, ${s.color}, ${s.color}bb)`,
            border: 'none', borderRadius: '14px', color: '#fff', cursor: 'pointer',
            padding: '1rem 2.5rem', fontSize: '1.05rem', fontWeight: 700,
            boxShadow: `0 4px 20px ${s.color}44`, transition: 'transform 0.1s, box-shadow 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${s.color}55`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 20px ${s.color}44`; }}>
            {s.cta}
          </button>
        )}

        {/* Boton ir al panel sin conectar (ultimo slide) */}
        {isLastSlide && botStatus !== 'ON' && (
          <button onClick={() => nav('/mi-panel')} style={{ marginTop: '1.25rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}>
            Conectar WhatsApp despues
          </button>
        )}
      </div>

      {/* Dots de progreso */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1.5rem 2rem 2.5rem' }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i === slide ? '24px' : '8px', height: '8px',
            borderRadius: '99px', border: 'none', cursor: 'pointer', padding: 0,
            background: i === slide ? SLIDES[slide].color : 'var(--border)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>
    </div>
  );
}
