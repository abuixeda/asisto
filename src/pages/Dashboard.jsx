import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Settings, Smartphone, Loader, BrainCircuit, MessageCircle, Users, TrendingUp, Lock, Mail, ChevronRight, LogOut, Plus, X, Save, Bell, Clock, Trash2, Sun, Moon, Bot, BarChart2, Search, ChevronDown, ChevronUp, Megaphone, Calendar, ChevronLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import '../index.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://asisto-backend-production.up.railway.app';
const socket = io(API_URL);

function authFetch(url, options = {}) {
  const token = localStorage.getItem('atento_token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  }).then(res => {
    if (res.status === 401) {
      localStorage.removeItem('atento_token');
      localStorage.removeItem('atento_user');
      window.location.reload();
    }
    return res;
  });
}

// ─── Conversations Panel ───────────────────────────────────────
const PLATFORMS = {
  whatsapp: { label: 'WhatsApp', color: '#25d366', bg: 'rgba(37,211,102,0.12)', icon: '💬', prefix: null },
  telegram:  { label: 'Telegram', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', icon: '✈️', prefix: 'tg_' },
  instagram: { label: 'Instagram', color: '#e1306c', bg: 'rgba(225,48,108,0.12)', icon: '📷', prefix: 'ig_' },
  facebook:  { label: 'Facebook',  color: '#1877f2', bg: 'rgba(24,119,242,0.12)', icon: '🔵', prefix: 'fb_' },
};

function getPlatform(clientNumber) {
  if (clientNumber.startsWith('tg_')) return { ...PLATFORMS.telegram, displayId: clientNumber.replace('tg_', 'ID ') };
  if (clientNumber.startsWith('ig_')) return { ...PLATFORMS.instagram, displayId: clientNumber.replace('ig_', 'IG ') };
  if (clientNumber.startsWith('fb_')) return { ...PLATFORMS.facebook, displayId: clientNumber.replace('fb_', 'FB ') };
  return { ...PLATFORMS.whatsapp, displayId: '+' + clientNumber.replace(/@[\w.]+$/, '') };
}

function ConversationsPanel({ bots }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBot, setFilterBot] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [openThread, setOpenThread] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterBot) params.set('bot_id', filterBot);
    if (search) params.set('client', search);
    params.set('limit', '200');
    authFetch(`${API_URL}/api/conversations?${params}`)
      .then(r => r.json())
      .then(data => { setThreads(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filterBot, search]);

  const fmt = (ts) => {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit' }) + ' ' + d.toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' });
  };

  const filtered = filterPlatform
    ? threads.filter(t => {
        const p = getPlatform(t.client_number);
        return p.label.toLowerCase() === filterPlatform;
      })
    : threads;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--sidebar-bg)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents:'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por número o ID..."
            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.25rem', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-1)', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }} />
        </div>
        <select value={filterBot} onChange={e => setFilterBot(e.target.value)}
          style={{ padding: '0.6rem 1rem', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-1)', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
          <option value="">Todos los bots</option>
          {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {/* Platform filter pills */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[{ v:'', l:'Todas' }, ...Object.values(PLATFORMS).map(p => ({ v: p.label.toLowerCase(), l: `${p.icon} ${p.label}` }))].map(opt => (
            <button key={opt.v} onClick={() => setFilterPlatform(opt.v)}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '20px', border: '1px solid var(--border-strong)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                background: filterPlatform === opt.v ? 'var(--gradient)' : 'var(--surface-2)',
                color: filterPlatform === opt.v ? '#fff' : 'var(--text-2)' }}>
              {opt.l}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', whiteSpace:'nowrap' }}>{filtered.length} conversaciones</span>
      </div>

      {/* Thread list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}><Loader className="spinner" size={22} style={{ margin: '0 auto' }} /></div>}
        {!loading && filtered.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '3rem 0' }}>No hay conversaciones registradas.</p>}
        {filtered.map((t, i) => {
          const key = `${t.bot_id}__${t.client_number}`;
          const isOpen = openThread === key;
          const lastMsg = t.messages[0];
          const platform = getPlatform(t.client_number);
          return (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              {/* Thread header */}
              <div onClick={() => setOpenThread(isOpen ? null : key)}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.25rem', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>

                {/* Avatar with platform color */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: platform.bg, border: `1.5px solid ${platform.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: platform.color, fontSize: '0.9rem' }}>
                    {platform.displayId.replace(/\D/g,'').slice(-2) || '??'}
                  </div>
                  {/* Platform icon badge */}
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%', background: platform.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', border: '1.5px solid var(--surface)' }}>
                    {platform.icon}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-1)' }}>{platform.displayId}</span>
                    {/* Platform badge */}
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: '20px', background: platform.bg, color: platform.color, border: `1px solid ${platform.color}40`, letterSpacing: '0.03em' }}>
                      {platform.label}
                    </span>
                    {/* Bot badge */}
                    <span style={{ fontSize: '0.68rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 6px', color: 'var(--text-3)' }}>
                      {t.bot_name}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '520px' }}>
                    {lastMsg?.content?.slice(0, 120)}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{fmt(t.last_at)}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', background: 'var(--surface-2)', padding: '1px 6px', borderRadius: '4px' }}>{t.messages.length} msgs</span>
                </div>
                {isOpen ? <ChevronUp size={14} color="var(--text-3)" /> : <ChevronDown size={14} color="var(--text-3)" />}
              </div>

              {/* Messages */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
                  {[...t.messages].reverse().map((m, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-start' : 'flex-end' }}>
                      <div style={{
                        maxWidth: '75%', padding: '0.55rem 0.85rem', borderRadius: m.role === 'user' ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                        background: m.role === 'user' ? 'var(--surface-3)' : 'var(--gradient-soft)',
                        border: `1px solid ${m.role === 'user' ? 'var(--border)' : 'rgba(124,58,237,0.2)'}`,
                        fontSize: '0.82rem', color: 'var(--text-1)', lineHeight: 1.5
                      }}>
                        {m.content}
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '0.25rem', textAlign: 'right' }}>{fmt(m.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Subscription Panel (LemonSqueezy) ────────────────────────
const LS_PLANS = [
  {
    variantId: import.meta.env.VITE_LS_VARIANT_STARTER || '',
    name: 'Plan Starter', price: '$59', currency: 'USD', period: 'mes',
    key: 'starter',
    features: ['1 número WhatsApp', 'Hasta 1.500 mensajes/mes', 'Catálogo sincronizado', 'Panel de control', 'Soporte por email'],
  },
  {
    variantId: import.meta.env.VITE_LS_VARIANT_GROWTH || '',
    name: 'Plan Growth', price: '$99', currency: 'USD', period: 'mes',
    key: 'growth',
    recommended: true,
    features: ['Todo lo de Starter', 'Hasta 5.000 mensajes/mes', 'Soporte prioritario', 'Horario anti-nocturno', 'Base de conocimientos avanzada'],
  },
  {
    variantId: import.meta.env.VITE_LS_VARIANT_SCALE || '',
    name: 'Plan Scale', price: '$179', currency: 'USD', period: 'mes',
    key: 'scale',
    features: ['Todo lo de Growth', 'Mensajes ilimitados', 'Instagram DMs', 'Soporte directo WhatsApp', 'Multi-idioma'],
  },
];

function SubscriptionPanel({ user, bots }) {
  const [loading, setLoading] = useState(null); // variantId del plan en proceso
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    authFetch(`${API_URL}/api/payments/subscription`)
      .then(r => r.json())
      .then(data => { if (!data.error) setSubscription(data); })
      .catch(() => {})
      .finally(() => setSubLoading(false));
  }, []);

  const handleSubscribe = async (variantId) => {
    if (!variantId) return alert('Variant ID no configurado. Revisá las variables de entorno del frontend.');
    setLoading(variantId);
    try {
      const res = await authFetch(`${API_URL}/api/payments/create-checkout`, {
        method: 'POST',
        body: JSON.stringify({ variantId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Error al iniciar el pago.');
      }
    } catch {
      alert('Error de conexión con el servidor.');
    } finally {
      setLoading(null);
    }
  };

  const isActive = subscription && ['active', 'on_trial'].includes(subscription.status);
  const renewDate = subscription?.renewsAt
    ? new Date(subscription.renewsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const statusLabel = {
    active: 'Activa',
    on_trial: 'En período de prueba',
    cancelled: 'Cancelada',
    expired: 'Expirada',
    paused: 'Pausada',
    none: null,
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg)', flex: 1 }}>

      {/* Banner suscripción activa */}
      {!subLoading && isActive && (
        <div style={{ width: '100%', maxWidth: '900px', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(59,130,246,0.10))', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '20px', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              <strong style={{ color: 'var(--text-1)', fontSize: '1.05rem' }}>
                {statusLabel[subscription.status] || subscription.status} — {subscription.plan ? `Plan ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}` : ''}
              </strong>
            </div>
            {renewDate && (
              <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.85rem' }}>
                Próxima renovación: {renewDate}
              </p>
            )}
          </div>
          <a
            href={`https://app.lemonsqueezy.com/my-orders`}
            target="_blank"
            rel="noreferrer"
            style={{ padding: '0.6rem 1.4rem', borderRadius: '12px', border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-1)', fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none', cursor: 'pointer' }}
          >
            Gestionar suscripción →
          </a>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: '700px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem', background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Potenciá tu Negocio con Atento AI
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '1.15rem', lineHeight: 1.5 }}>
          Activá tu suscripción para mantener tu bot atendiendo clientes las 24hs.
          <br/><strong style={{ color: 'var(--success)' }}>Incluye 7 días de prueba gratis.</strong> Cancelá cuando quieras.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1100px', width: '100%' }}>
        {LS_PLANS.map(plan => {
          const isCurrent = isActive && subscription?.plan === plan.key;
          return (
            <div key={plan.key} style={{ background: 'var(--surface)', border: isCurrent ? '2px solid #7c3aed' : '1px solid var(--border-strong)', borderRadius: '28px', padding: '3rem 2.5rem', width: '360px', display: 'flex', flexDirection: 'column', boxShadow: isCurrent ? '0 0 0 4px rgba(124,58,237,0.1), var(--shadow-lg)' : 'var(--shadow-lg)', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s' }}>
              {plan.recommended && !isCurrent && (
                <div style={{ position: 'absolute', top: '15px', right: '-40px', background: 'var(--success)', color: '#fff', padding: '5px 45px', transform: 'rotate(45deg)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                  MÁS ELEGIDO
                </div>
              )}
              {isCurrent && (
                <div style={{ position: 'absolute', top: '15px', right: '-40px', background: '#7c3aed', color: '#fff', padding: '5px 45px', transform: 'rotate(45deg)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em', boxShadow: '0 2px 8px rgba(124,58,237,0.4)' }}>
                  TU PLAN
                </div>
              )}

              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-1)' }}>{plan.name}</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-1)' }}>{plan.price}</span>
                  <span style={{ color: 'var(--text-3)', fontWeight: 600, fontSize: '1rem' }}>{plan.currency}/{plan.period}</span>
                </div>
              </div>

              <div style={{ flex: 1, marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.4 }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(124,58,237,0.12)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, marginTop: '2px', fontWeight: 800 }}>✓</div>
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => !isCurrent && handleSubscribe(plan.variantId)}
                disabled={!!loading || isCurrent}
                className="btn-primary"
                style={{ width: '100%', padding: '1.1rem', borderRadius: '16px', fontSize: '1.05rem', fontWeight: 700, boxShadow: isCurrent ? 'none' : '0 4px 15px rgba(124,58,237,0.3)', cursor: isCurrent ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: isCurrent ? 0.7 : 1, background: isCurrent ? 'var(--surface-2)' : undefined }}
              >
                {loading === plan.variantId
                  ? <Loader className="spinner" size={20} />
                  : isCurrent
                    ? <>Plan actual ✓</>
                    : <>Suscribirse ahora <ChevronRight size={18} /></>}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.88rem', maxWidth: '650px', background: 'var(--surface-2)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <p style={{ margin: 0 }}>
          🛡️ Transacción segura vía <strong>LemonSqueezy</strong>.
          <br/>La activación es instantánea una vez procesado el pago. Podés gestionar tu suscripción y descargar facturas desde el portal de LemonSqueezy.
        </p>
      </div>
    </div>
  );
}

// ─── Smooth Area Chart (SVG, interactive) ─────────────────────
function SmoothAreaChart({ data, color = '#3b82f6', height = 160, tooltipFn }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const svgRef = useRef(null);

  const W = 800, H = height;
  const PAD = { top: 16, right: 20, bottom: 30, left: 48 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const GRID = 4;

  // Compute pts before early return so hooks are always called unconditionally
  const validData = !!(data && data.length >= 2);
  const maxVal = validData ? Math.max(...data.map(d => d.value), 1) : 1;
  const pts = validData ? data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * chartW,
    y: PAD.top + chartH - (d.value / maxVal) * chartH,
    raw: d,
  })) : [];

  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0, bestDist = Infinity;
    pts.forEach((p, i) => { const d = Math.abs(p.x - mouseX); if (d < bestDist) { bestDist = d; best = i; } });
    setHoveredIdx(best);
  }, [pts.length]);

  if (!validData) return (
    <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-3)', fontSize:'0.82rem' }}>
      Sin datos suficientes aún.
    </div>
  );

  // Catmull-Rom → cubic bezier smooth path
  const buildPath = (points) => points.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const p0 = points[Math.max(0, i - 2)];
    const p1 = points[i - 1];
    const p3 = points[Math.min(points.length - 1, i + 1)];
    const cp1x = (p1.x + (p.x - p0.x) / 6).toFixed(1);
    const cp1y = (p1.y + (p.y - p0.y) / 6).toFixed(1);
    const cp2x = (p.x - (p3.x - p1.x) / 6).toFixed(1);
    const cp2y = (p.y - (p3.y - p1.y) / 6).toFixed(1);
    return `${acc} C${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }, '');

  const linePath = buildPath(pts);
  const baseline = (PAD.top + chartH).toFixed(1);
  const areaPath = `${linePath} L${pts[pts.length-1].x.toFixed(1)},${baseline} L${pts[0].x.toFixed(1)},${baseline}Z`;

  const gradId = `grad_${color.replace('#','')}`;

  const step = Math.max(1, Math.floor(pts.length / 6));
  const xLabels = pts.filter((_, i) => i === 0 || i === pts.length - 1 || i % step === 0);

  const hp = hoveredIdx !== null ? pts[hoveredIdx] : null;

  // Tooltip box — keep inside chart
  const TW = 148, TH = 54;
  const tx = hp ? Math.max(PAD.left, Math.min(hp.x - TW / 2, W - PAD.right - TW)) : 0;
  const ty = hp ? Math.max(PAD.top, hp.y - TH - 12) : 0;

  const fmtVal = (v) => v >= 1000000 ? `${(v/1000000).toFixed(2)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toLocaleString();

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}
      style={{ width:'100%', height:`${H}px`, display:'block', cursor:'crosshair', userSelect:'none' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIdx(null)}>

      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="85%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {Array.from({ length: GRID + 1 }, (_, i) => {
        const y = PAD.top + (i / GRID) * chartH;
        const val = maxVal * (1 - i / GRID);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="var(--border)" strokeWidth={i === GRID ? 1.5 : 1} opacity={i === GRID ? 0.8 : 0.5} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10.5" fill="var(--text-3)" fontFamily="Inter,sans-serif">
              {fmtVal(Math.round(val))}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Vertical crosshair */}
      {hp && (
        <line x1={hp.x} y1={PAD.top} x2={hp.x} y2={PAD.top + chartH}
          stroke={color} strokeWidth="1" strokeDasharray="4,3" opacity="0.45" />
      )}

      {/* X-axis labels */}
      {xLabels.map((p, i) => (
        <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize="10.5" fill="var(--text-3)" fontFamily="Inter,sans-serif">
          {String(p.raw.label).slice(-5)}
        </text>
      ))}

      {/* Active dot */}
      {hp && <>
        <circle cx={hp.x} cy={hp.y} r="7" fill={color} opacity="0.15" />
        <circle cx={hp.x} cy={hp.y} r="4.5" fill={color} stroke="var(--surface)" strokeWidth="2" />
      </>}

      {/* Tooltip */}
      {hp && (
        <g>
          <rect x={tx} y={ty} width={TW} height={TH} rx="8"
            fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1"
            style={{ filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} />
          <text x={tx + 12} y={ty + 18} fontSize="10.5" fill="var(--text-3)" fontFamily="Inter,sans-serif">
            {hp.raw.label}
          </text>
          <text x={tx + 12} y={ty + 38} fontSize="15" fontWeight="700" fill={color} fontFamily="Inter,sans-serif">
            {tooltipFn ? tooltipFn(hp.raw) : fmtVal(hp.raw.value)}
          </text>
        </g>
      )}
    </svg>
  );
}

// ─── Admin Campaigns Panel ─────────────────────────────────────
function AdminCampaignsPanel({ bots }) {
  const token = localStorage.getItem('atento_token');
  const [selectedBotId, setSelectedBotId] = useState(bots?.[0]?.id || null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal nueva campaña
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', message_template: '', delay_seconds: 45, use_ai: false, campaign_goal: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Modal detalle (config + leads)
  const [detailModal, setDetailModal] = useState(null);
  const [detailTab, setDetailTab] = useState('config');
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState(null);

  // Leads
  const [leads, setLeads] = useState([]);
  const [leadsText, setLeadsText] = useState('');
  const [leadsImportMode, setLeadsImportMode] = useState('manual');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [leadsMsg, setLeadsMsg] = useState(null);
  const [importingLeads, setImportingLeads] = useState(false);

  const statusColors = { draft: '#64748b', running: '#10b981', paused: '#f59e0b', completed: '#3b82f6' };
  const statusLabels = { draft: 'Borrador', running: 'Activa', paused: 'Pausada', completed: 'Completada' };
  const leadStatusBadge = { pending: { color: '#64748b', label: 'Pendiente' }, sent: { color: '#3b82f6', label: 'Enviado' }, replied: { color: '#10b981', label: 'Respondió' }, opted_out: { color: '#ef4444', label: 'Opt-out' } };

  const selectedBot = bots?.find(b => b.id === selectedBotId);

  async function loadCampaigns(botId) {
    if (!botId) return;
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/api/bots/${botId}/campaigns`, {}, token);
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch { setCampaigns([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (selectedBotId) loadCampaigns(selectedBotId); }, [selectedBotId]);

  async function createCampaign() {
    if (!newCampaign.name) { setMsg({ ok: false, text: 'El nombre es requerido.' }); return; }
    if (newCampaign.use_ai && !newCampaign.campaign_goal) { setMsg({ ok: false, text: 'Describí el objetivo de la campaña.' }); return; }
    if (!newCampaign.use_ai && !newCampaign.message_template) { setMsg({ ok: false, text: 'Escribí el mensaje a enviar.' }); return; }
    setSaving(true); setMsg(null);
    try {
      const res = await authFetch(`${API_URL}/api/bots/${selectedBotId}/campaigns`, { method: 'POST', body: JSON.stringify(newCampaign) }, token);
      if (res.ok) {
        setShowNewModal(false);
        setNewCampaign({ name: '', message_template: '', delay_seconds: 45, use_ai: false, campaign_goal: '' });
        loadCampaigns(selectedBotId);
      } else { const d = await res.json(); setMsg({ ok: false, text: d.error || 'Error al crear.' }); }
    } catch { setMsg({ ok: false, text: 'Error de conexión.' }); }
    finally { setSaving(false); }
  }

  async function openDetail(c, tab = 'config') {
    setDetailModal(c);
    setDetailTab(tab);
    setEditForm({ name: c.name, message_template: c.message_template || '', campaign_goal: c.campaign_goal || '', delay_seconds: c.delay_seconds, use_ai: !!c.use_ai });
    setEditMsg(null); setLeadsMsg(null); setLeadsText(''); setSheetsUrl(''); setLeadsImportMode('manual');
    try {
      const res = await authFetch(`${API_URL}/api/bots/${selectedBotId}/campaigns/${c.id}/leads`, {}, token);
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch { setLeads([]); }
  }

  async function saveCampaignEdit() {
    if (!editForm.name) { setEditMsg({ ok: false, text: 'El nombre es requerido.' }); return; }
    setEditSaving(true); setEditMsg(null);
    try {
      const res = await authFetch(`${API_URL}/api/bots/${selectedBotId}/campaigns/${detailModal.id}`, {
        method: 'PUT', body: JSON.stringify(editForm)
      }, token);
      if (res.ok) {
        setEditMsg({ ok: true, text: '✅ Cambios guardados.' });
        const updated = { ...detailModal, ...editForm };
        setDetailModal(updated);
        loadCampaigns(selectedBotId);
      } else { const d = await res.json(); setEditMsg({ ok: false, text: d.error || 'Error al guardar.' }); }
    } catch { setEditMsg({ ok: false, text: 'Error de conexión.' }); }
    finally { setEditSaving(false); }
  }

  async function deleteCampaign(cid) {
    if (!confirm('¿Eliminar esta campaña y todos sus leads?')) return;
    await authFetch(`${API_URL}/api/bots/${selectedBotId}/campaigns/${cid}`, { method: 'DELETE' }, token);
    setDetailModal(null);
    loadCampaigns(selectedBotId);
  }

  async function startCampaign(cid) {
    await authFetch(`${API_URL}/api/bots/${selectedBotId}/campaigns/${cid}/start`, { method: 'POST' }, token);
    loadCampaigns(selectedBotId);
    if (detailModal?.id === cid) setDetailModal(p => ({ ...p, status: 'running' }));
  }

  async function pauseCampaign(cid) {
    await authFetch(`${API_URL}/api/bots/${selectedBotId}/campaigns/${cid}/pause`, { method: 'POST' }, token);
    loadCampaigns(selectedBotId);
    if (detailModal?.id === cid) setDetailModal(p => ({ ...p, status: 'paused' }));
  }

  async function importFromSheets() {
    if (!sheetsUrl.trim()) return;
    setImportingLeads(true); setLeadsMsg(null);
    try {
      const res = await authFetch(`${API_URL}/api/bots/${selectedBotId}/campaigns/${detailModal.id}/leads/import-sheets`, {
        method: 'POST', body: JSON.stringify({ sheetsUrl: sheetsUrl.trim() })
      }, token);
      const data = await res.json();
      if (res.ok) {
        setLeadsMsg({ ok: true, text: `✅ ${data.imported} leads importados desde Google Sheets.` });
        setSheetsUrl('');
        const r2 = await authFetch(`${API_URL}/api/bots/${selectedBotId}/campaigns/${detailModal.id}/leads`, {}, token);
        const d2 = await r2.json();
        setLeads(Array.isArray(d2) ? d2 : []);
        loadCampaigns(selectedBotId);
      } else { setLeadsMsg({ ok: false, text: `❌ ${data.error}` }); }
    } catch { setLeadsMsg({ ok: false, text: '❌ Error de conexión.' }); }
    finally { setImportingLeads(false); }
  }

  async function importLeads() {
    if (!leadsText.trim()) return;
    setImportingLeads(true); setLeadsMsg(null);
    const parsed = leadsText.trim().split('\n').filter(l => l.trim()).map(line => {
      const parts = line.split(',').map(s => s.trim());
      return { phone: parts[0], name: parts[1] || '', business_type: parts[2] || '', city: parts[3] || '', website: parts[4] || '' };
    }).filter(l => l.phone);
    try {
      const res = await authFetch(`${API_URL}/api/bots/${selectedBotId}/campaigns/${detailModal.id}/leads`, { method: 'POST', body: JSON.stringify({ leads: parsed }) }, token);
      const data = await res.json();
      if (res.ok) {
        setLeadsMsg({ ok: true, text: `✅ ${data.imported} leads importados.` });
        setLeadsText('');
        const r2 = await authFetch(`${API_URL}/api/bots/${selectedBotId}/campaigns/${detailModal.id}/leads`, {}, token);
        const d2 = await r2.json();
        setLeads(Array.isArray(d2) ? d2 : []);
        loadCampaigns(selectedBotId);
      } else { setLeadsMsg({ ok: false, text: `❌ ${data.error}` }); }
    } catch { setLeadsMsg({ ok: false, text: '❌ Error de conexión.' }); }
    finally { setImportingLeads(false); }
  }

  async function deleteLead(lid) {
    await authFetch(`${API_URL}/api/bots/${selectedBotId}/campaigns/${detailModal.id}/leads/${lid}`, { method: 'DELETE' }, token);
    const r = await authFetch(`${API_URL}/api/bots/${selectedBotId}/campaigns/${detailModal.id}/leads`, {}, token);
    const d = await r.json(); setLeads(Array.isArray(d) ? d : []);
    loadCampaigns(selectedBotId);
  }

  if (!bots || bots.length === 0) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>No hay bots disponibles.</div>;

  return (
    <div style={{ padding: '1.5rem 2rem' }}>

      {/* ── Modal detalle de campaña (config + leads) ── */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', width: '100%', maxWidth: '660px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{detailModal.name}</span>
                  <span style={{ background: statusColors[detailModal.status] || '#64748b', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px' }}>{statusLabels[detailModal.status] || detailModal.status}</span>
                  {detailModal.use_ai && <span style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', border: '1px solid rgba(124,58,237,0.4)' }}>✨ IA</span>}
                </div>
              </div>
              {/* Acciones rápidas */}
              <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                {(detailModal.status === 'draft' || detailModal.status === 'paused') && (
                  <button onClick={() => startCampaign(detailModal.id)} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>▶ Iniciar</button>
                )}
                {detailModal.status === 'running' && (
                  <button onClick={() => pauseCampaign(detailModal.id)} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '8px', color: '#f59e0b', cursor: 'pointer', padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>⏸ Pausar</button>
                )}
                {['draft', 'paused', 'completed'].includes(detailModal.status) && (
                  <button onClick={() => deleteCampaign(detailModal.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', cursor: 'pointer', padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>🗑</button>
                )}
                <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.35rem 0.7rem' }}>✕</button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              {[{ id: 'config', label: '⚙️ Configuración' }, { id: 'leads', label: `👥 Leads (${leads.length})` }].map(t => (
                <button key={t.id} onClick={() => setDetailTab(t.id)}
                  style={{ padding: '0.75rem 1.25rem', border: 'none', borderBottom: detailTab === t.id ? '2px solid #7c3aed' : '2px solid transparent', background: 'none', color: detailTab === t.id ? '#a78bfa' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: detailTab === t.id ? 700 : 400, transition: '0.15s' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* ── Tab Configuración ── */}
              {detailTab === 'config' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Nombre</label>
                    <input className="modal-input" value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={{ marginBottom: 0, background: 'var(--surface-2)' }} />
                  </div>

                  <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '10px', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' }}>✨ Mensaje generado por IA</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Gemini escribe un mensaje único para cada negocio</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                      <input type="checkbox" checked={!!editForm.use_ai} onChange={e => setEditForm(p => ({ ...p, use_ai: e.target.checked }))} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: '34px', background: editForm.use_ai ? '#7c3aed' : 'rgba(255,255,255,0.15)', transition: '0.2s' }}>
                        <span style={{ position: 'absolute', height: '18px', width: '18px', left: editForm.use_ai ? '23px' : '3px', bottom: '3px', background: 'white', borderRadius: '50%', transition: '0.2s' }} />
                      </span>
                    </label>
                  </div>

                  {editForm.use_ai ? (
                    <div>
                      <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Objetivo de la campaña</label>
                      <textarea className="prompt-textarea editable" style={{ minHeight: '90px' }} value={editForm.campaign_goal || ''} onChange={e => setEditForm(p => ({ ...p, campaign_goal: e.target.value }))} placeholder="Ej: Ofrecer Atento AI a negocios locales. Mencionar los 7 días gratis." />
                    </div>
                  ) : (
                    <div>
                      <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                        Mensaje <span style={{ opacity: 0.6 }}>(variables: {'{{nombre}}'}, {'{{negocio}}'}, {'{{ciudad}}'})</span>
                      </label>
                      <textarea className="prompt-textarea editable" style={{ minHeight: '110px' }} value={editForm.message_template || ''} onChange={e => setEditForm(p => ({ ...p, message_template: e.target.value }))} placeholder="Hola {{nombre}}! Te escribimos desde Atento AI..." />
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Delay entre mensajes (segundos)</label>
                    <input className="modal-input" type="number" min="10" max="3600" value={editForm.delay_seconds || 45} onChange={e => setEditForm(p => ({ ...p, delay_seconds: Number(e.target.value) }))} style={{ marginBottom: 0, background: 'var(--surface-2)', width: '130px' }} />
                  </div>

                  {editMsg && <p style={{ margin: 0, fontSize: '0.875rem', color: editMsg.ok ? '#10b981' : '#f87171' }}>{editMsg.text}</p>}

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={saveCampaignEdit} disabled={editSaving} className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
                      {editSaving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </>
              )}

              {/* ── Tab Leads ── */}
              {detailTab === 'leads' && (
                <>
                  {/* Modo de importación */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Agregar prospectos</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {['manual', 'sheets'].map(mode => (
                        <button key={mode} onClick={() => { setLeadsImportMode(mode); setLeadsMsg(null); }}
                          style={{ padding: '0.35rem 0.9rem', borderRadius: '20px', border: '1px solid var(--border)', fontSize: '0.82rem', cursor: 'pointer', fontWeight: leadsImportMode === mode ? 700 : 400, background: leadsImportMode === mode ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: leadsImportMode === mode ? '#fff' : 'var(--text-secondary)', transition: '0.15s' }}>
                          {mode === 'manual' ? '📋 Manual (CSV)' : '📊 Google Sheets'}
                        </button>
                      ))}
                    </div>

                    {leadsImportMode === 'manual' && (
                      <>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                          Formato: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '0 4px', borderRadius: '4px', fontSize: '0.78rem' }}>teléfono,nombre,negocio,ciudad,url_web</code> — uno por línea
                        </label>
                        <textarea className="prompt-textarea editable" style={{ minHeight: '100px', fontSize: '0.82rem' }} value={leadsText} onChange={e => setLeadsText(e.target.value)}
                          placeholder={'5491112345678,Juan García,Panadería El Sol,CABA,https://maps.app.goo.gl/xyz\n5491198765432,María López,Ferretería Norte,Córdoba,'} />
                        <button onClick={importLeads} disabled={importingLeads || !leadsText.trim()} className="btn-primary" style={{ marginTop: '0.6rem', padding: '0.5rem 1.1rem', fontSize: '0.875rem' }}>
                          {importingLeads ? 'Importando...' : '+ Agregar leads'}
                        </button>
                      </>
                    )}

                    {leadsImportMode === 'sheets' && (
                      <>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                          Link de Google Sheets <span style={{ opacity: 0.6 }}>(debe ser público — "cualquiera con el link puede ver")</span>
                        </label>
                        <input className="modal-input" value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/..." style={{ marginBottom: '0.4rem', background: 'var(--surface-2)' }} />
                        <p style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          Columnas esperadas: <strong>teléfono, nombre, negocio, ciudad, url</strong>. La columna <strong>url</strong> puede ser el sitio web o Google Maps — la IA lo analiza antes de escribir el mensaje.
                        </p>
                        <button onClick={importFromSheets} disabled={importingLeads || !sheetsUrl.trim()} className="btn-primary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.875rem' }}>
                          {importingLeads ? 'Importando...' : '📊 Importar desde Sheets'}
                        </button>
                      </>
                    )}

                    {leadsMsg && <p style={{ margin: '0.6rem 0 0', fontSize: '0.875rem', color: leadsMsg.ok ? '#10b981' : '#f87171' }}>{leadsMsg.text}</p>}
                  </div>

                  {/* Lista de leads */}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Prospectos cargados — {leads.length}
                    </div>
                    {leads.length === 0 && (
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)', borderRadius: '10px', padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Todavía no hay prospectos. Agregá usando CSV o Google Sheets arriba.
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {leads.map(lead => (
                        <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                          <span style={{ background: leadStatusBadge[lead.status]?.color || '#64748b', borderRadius: '20px', padding: '2px 8px', fontSize: '0.68rem', color: '#fff', fontWeight: 600, flexShrink: 0 }}>{leadStatusBadge[lead.status]?.label || lead.status}</span>
                          <span style={{ flex: 1, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lead.name || lead.phone.replace('@c.us', '')}
                            {lead.business_type && <span style={{ color: 'var(--text-secondary)' }}> · {lead.business_type}</span>}
                            {lead.city && <span style={{ color: 'var(--text-secondary)' }}>, {lead.city}</span>}
                          </span>
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{lead.phone.replace('@c.us', '')}</span>
                          <button onClick={() => deleteLead(lead.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.2rem', flexShrink: 0 }}>🗑</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal nueva campaña ── */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Nueva Campaña — {selectedBot?.name}</span>
              <button onClick={() => { setShowNewModal(false); setMsg(null); }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.3rem 0.7rem' }}>✕</button>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Nombre de la campaña</label>
              <input className="modal-input" value={newCampaign.name} onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Prospección Mayo 2026" style={{ marginBottom: 0, background: 'var(--surface-2)' }} />
            </div>
            <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '10px', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' }}>✨ Mensaje generado por IA</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Gemini escribe un mensaje único para cada negocio</div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                <input type="checkbox" checked={newCampaign.use_ai} onChange={e => setNewCampaign(p => ({ ...p, use_ai: e.target.checked }))} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: '34px', background: newCampaign.use_ai ? '#7c3aed' : 'rgba(255,255,255,0.15)', transition: '0.2s' }}>
                  <span style={{ position: 'absolute', height: '18px', width: '18px', left: newCampaign.use_ai ? '23px' : '3px', bottom: '3px', background: 'white', borderRadius: '50%', transition: '0.2s' }} />
                </span>
              </label>
            </div>
            {newCampaign.use_ai ? (
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Objetivo de la campaña</label>
                <textarea className="prompt-textarea editable" style={{ minHeight: '90px' }} value={newCampaign.campaign_goal} onChange={e => setNewCampaign(p => ({ ...p, campaign_goal: e.target.value }))} placeholder="Ej: Ofrecer Atento AI a negocios locales. Mencionar los 7 días gratis." />
              </div>
            ) : (
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Mensaje <span style={{ opacity: 0.6 }}>(variables: {'{{nombre}}'}, {'{{negocio}}'}, {'{{ciudad}}'})</span></label>
                <textarea className="prompt-textarea editable" style={{ minHeight: '110px' }} value={newCampaign.message_template} onChange={e => setNewCampaign(p => ({ ...p, message_template: e.target.value }))} placeholder="Hola {{nombre}}! Te escribimos desde Atento AI..." />
              </div>
            )}
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Delay entre mensajes (segundos)</label>
              <input className="modal-input" type="number" min="10" max="3600" value={newCampaign.delay_seconds} onChange={e => setNewCampaign(p => ({ ...p, delay_seconds: Number(e.target.value) }))} style={{ marginBottom: 0, background: 'var(--surface-2)', width: '120px' }} />
            </div>
            {msg && <p style={{ margin: 0, fontSize: '0.875rem', color: msg.ok ? '#10b981' : '#f87171' }}>{msg.text}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowNewModal(false); setMsg(null); }} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.6rem 1rem' }}>Cancelar</button>
              <button onClick={createCampaign} disabled={saving} className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>{saving ? 'Creando...' : 'Crear Campaña'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Selector de bot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {bots.map(b => (
            <button key={b.id} onClick={() => setSelectedBotId(b.id)}
              style={{ padding: '0.4rem 0.9rem', borderRadius: '20px', border: '1px solid var(--border)', background: selectedBotId === b.id ? 'var(--gradient)' : 'var(--surface-2)', color: selectedBotId === b.id ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: selectedBotId === b.id ? 700 : 400, transition: '0.15s' }}>
              {b.name}
            </button>
          ))}
        </div>
        <button onClick={() => { setShowNewModal(true); setMsg(null); }} className="btn-primary" style={{ marginLeft: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <Plus size={14} /> Nueva campaña
        </button>
      </div>

      {loading && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cargando...</p>}

      {!loading && campaigns.length === 0 && (
        <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📣</div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No hay campañas para {selectedBot?.name}. Creá una arriba.</p>
        </div>
      )}

      {/* Lista de campañas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {campaigns.map(c => (
          <div key={c.id} onClick={() => openDetail(c)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem', cursor: 'pointer', transition: '0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.name}</span>
                <span style={{ background: statusColors[c.status] || '#64748b', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>{statusLabels[c.status] || c.status}</span>
                {c.use_ai ? <span style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(124,58,237,0.4)' }}>✨ IA</span> : null}
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                <span>⏳ {c.stats?.pending || 0} pendientes</span>
                <span style={{ color: '#3b82f6' }}>📤 {c.stats?.sent || 0} enviados</span>
                <span style={{ color: '#10b981' }}>💬 {c.stats?.replied || 0} respondieron</span>
                {(c.stats?.opted_out || 0) > 0 && <span style={{ color: '#f87171' }}>🚫 {c.stats.opted_out} opt-out</span>}
                <span style={{ opacity: 0.5 }}>delay: {c.delay_seconds}s</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button onClick={e => { e.stopPropagation(); openDetail(c, 'leads'); }}
                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: '#60a5fa', cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                👥 Leads {c.stats?.total > 0 ? `(${c.stats.total})` : ''}
              </button>
              <button onClick={e => { e.stopPropagation(); openDetail(c, 'config'); }}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                ⚙️ Config
              </button>
              {(c.status === 'draft' || c.status === 'paused') && (
                <button onClick={e => { e.stopPropagation(); startCampaign(c.id); }}
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                  ▶ Iniciar
                </button>
              )}
              {c.status === 'running' && (
                <button onClick={e => { e.stopPropagation(); pauseCampaign(c.id); }}
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '8px', color: '#f59e0b', cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                  ⏸ Pausar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Analytics Panel (router by role) ─────────────────────────
function AnalyticsPanel({ user }) {
  if (user?.role === 'admin') return <AdminAnalyticsPanel />;
  return <UserAnalyticsPanel botId={user?.botId} />;
}

// ─── User Analytics Panel ──────────────────────────────────────
function UserAnalyticsPanel({ botId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = botId ? `?bot_id=${botId}` : '';
    authFetch(`${API_URL}/api/analytics/user${params}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [botId]);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', flex:1, background:'var(--bg)' }}><Loader className="spinner" size={26} color="#818cf8" /></div>;
  if (!data) return <div style={{ padding:'3rem', textAlign:'center', color:'var(--text-3)' }}>No se pudo cargar analíticas.</div>;

  const maxKw   = data.topKeywords[0]?.count || 1;

  const card = (icon, value, label, bg) => (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'1.1rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem', boxShadow:'var(--shadow-sm)' }}>
      <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--text-1)', letterSpacing:'-0.03em', lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:'0.73rem', color:'var(--text-2)', marginTop:'0.3rem', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
      </div>
    </div>
  );

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'1.5rem 2rem', background:'var(--bg)', display:'flex', flexDirection:'column', gap:'1.25rem' }}>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(170px, 1fr))', gap:'1rem' }}>
        {card(<MessageCircle size={18} color="#818cf8"/>, data.todayClients, 'Clientes hoy', 'var(--gradient-soft)')}
        {card(<Users size={18} color="var(--warning)"/>, data.weekClients, 'Clientes esta semana', 'var(--warning-dim)')}
        {card(<TrendingUp size={18} color="var(--success)"/>, `${data.responseRate}%`, 'Tasa de respuesta', 'var(--success-dim)')}
        {card(<MessageCircle size={18} color="#3b82f6"/>, data.avgLength, 'Msgs prom. por chat', 'rgba(59,130,246,0.12)')}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
        {/* Horario pico */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'1.25rem', boxShadow:'var(--shadow-sm)' }}>
          <h3 style={{ margin:'0 0 1rem', fontSize:'0.875rem', fontWeight:600, color:'var(--text-1)' }}>Horario pico (últimos 7 días)</h3>
          <SmoothAreaChart
            data={data.peakHours.map(h => ({ label: `${h.hour}:00`, value: h.count }))}
            color="#7c3aed"
            height={110}
            tooltipFn={d => `${d.value} msgs`}
          />
          {(() => { const peak = data.peakHours.reduce((a,b)=>b.count>a.count?b:a,data.peakHours[0]); return peak.count > 0 && <p style={{ margin:'0.25rem 0 0', fontSize:'0.78rem', color:'var(--text-2)' }}>Pico: <strong style={{color:'var(--text-1)'}}>{peak.hour}:00 hs</strong> ({peak.count} msgs)</p>; })()}
        </div>

        {/* Nuevos vs Recurrentes */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'1.25rem', boxShadow:'var(--shadow-sm)' }}>
          <h3 style={{ margin:'0 0 1rem', fontSize:'0.875rem', fontWeight:600, color:'var(--text-1)' }}>Nuevos vs Recurrentes (30d)</h3>
          {(data.newClients + data.returningClients) === 0
            ? <p style={{ color:'var(--text-3)', fontSize:'0.82rem', textAlign:'center', padding:'1.5rem 0' }}>Sin datos aún.</p>
            : (() => {
              const total = data.newClients + data.returningClients;
              const newPct = Math.round(data.newClients / total * 100);
              return (
                <>
                  <div style={{ display:'flex', gap:'1px', borderRadius:'8px', overflow:'hidden', height:'28px', marginBottom:'1rem' }}>
                    <div style={{ width:`${newPct}%`, background:'var(--gradient)', transition:'width 0.5s' }} title={`Nuevos: ${data.newClients}`} />
                    <div style={{ flex:1, background:'rgba(245,158,11,0.35)' }} title={`Recurrentes: ${data.returningClients}`} />
                  </div>
                  <div style={{ display:'flex', gap:'1.5rem' }}>
                    <div><div style={{ fontSize:'1.6rem', fontWeight:800, color:'#818cf8', letterSpacing:'-0.03em' }}>{data.newClients}</div><div style={{ fontSize:'0.72rem', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Nuevos</div></div>
                    <div><div style={{ fontSize:'1.6rem', fontWeight:800, color:'var(--warning)', letterSpacing:'-0.03em' }}>{data.returningClients}</div><div style={{ fontSize:'0.72rem', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Recurrentes</div></div>
                    <div style={{ marginLeft:'auto', textAlign:'right' }}><div style={{ fontSize:'1.6rem', fontWeight:800, color:'var(--text-2)', letterSpacing:'-0.03em' }}>{total}</div><div style={{ fontSize:'0.72rem', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total</div></div>
                  </div>
                </>
              );
            })()
          }
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
        {/* Social breakdown */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'1.25rem', boxShadow:'var(--shadow-sm)' }}>
          <h3 style={{ margin:'0 0 1rem', fontSize:'0.875rem', fontWeight:600, color:'var(--text-1)' }}>Mensajes por red social (30d)</h3>
          {data.socialBreakdown.length === 0
            ? <p style={{ color:'var(--text-3)', fontSize:'0.82rem', textAlign:'center', padding:'1.5rem 0' }}>Sin datos aún.</p>
            : (
              <>
                {/* Stacked bar */}
                <div style={{ display:'flex', gap:'2px', borderRadius:'8px', overflow:'hidden', height:'22px', marginBottom:'1rem' }}>
                  {data.socialBreakdown.map((s,i) => (
                    <div key={i} title={`${s.label}: ${s.count} msgs (${s.pct}%)`} style={{ width:`${s.pct}%`, background:s.color, transition:'width 0.5s', minWidth: s.pct > 0 ? '4px' : 0 }} />
                  ))}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                  {data.socialBreakdown.map((s,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <div style={{ width:'10px', height:'10px', borderRadius:'3px', background:s.color, flexShrink:0 }} />
                      <span style={{ fontSize:'0.82rem', color:'var(--text-1)', fontWeight:500, flex:1 }}>{s.label}</span>
                      <div style={{ flex:2, height:'6px', background:'var(--surface-3)', borderRadius:'3px', overflow:'hidden' }}>
                        <div style={{ height:'100%', background:s.color, borderRadius:'3px', width:`${s.pct}%` }} />
                      </div>
                      <span style={{ fontSize:'0.78rem', color:'var(--text-2)', width:'32px', textAlign:'right' }}>{s.pct}%</span>
                      <span style={{ fontSize:'0.72rem', color:'var(--text-3)', width:'36px', textAlign:'right' }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </div>

        {/* Top keywords */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'1.25rem', boxShadow:'var(--shadow-sm)' }}>
          <h3 style={{ margin:'0 0 1rem', fontSize:'0.875rem', fontWeight:600, color:'var(--text-1)' }}>Consultas más frecuentes (30d)</h3>
          {data.topKeywords.length === 0
            ? <p style={{ color:'var(--text-3)', fontSize:'0.82rem', textAlign:'center', padding:'1.5rem 0' }}>Sin datos aún.</p>
            : <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {data.topKeywords.map((kw,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <span style={{ fontSize:'0.68rem', color:'var(--text-3)', width:'14px', textAlign:'right', flexShrink:0 }}>{i+1}</span>
                  <span style={{ fontSize:'0.82rem', color:'var(--text-1)', fontWeight:500, width:'90px', flexShrink:0, textTransform:'capitalize' }}>{kw.word}</span>
                  <div style={{ flex:1, height:'6px', background:'var(--surface-3)', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'var(--gradient)', borderRadius:'3px', width:`${(kw.count/maxKw)*100}%` }} />
                  </div>
                  <span style={{ fontSize:'0.72rem', color:'var(--text-2)', width:'28px', textAlign:'right', flexShrink:0 }}>{kw.count}</span>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Admin Analytics Panel ─────────────────────────────────────
function AdminAnalyticsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  const load = (p) => {
    setLoading(true);
    authFetch(`${API_URL}/api/analytics/admin?period=${p}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(period); }, [period]);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', flex:1, background:'var(--bg)' }}><Loader className="spinner" size={26} color="#818cf8" /></div>;
  if (!data) return <div style={{ padding:'3rem', textAlign:'center', color:'var(--text-3)' }}>No se pudieron cargar analíticas.</div>;

  const maxBotMsgs = data.topBots[0]?.user_msgs || 1;
  const PERIODS = [{ v:'day', l:'Día' }, { v:'week', l:'Semana' }, { v:'month', l:'Mes' }, { v:'year', l:'Año' }];

  const fmtTs = (ts) => {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit' }) + ' ' + d.toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' });
  };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'1.5rem 2rem', background:'var(--bg)', display:'flex', flexDirection:'column', gap:'1.25rem' }}>

      {/* Token chart */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'1.25rem', boxShadow:'var(--shadow-sm)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.5rem' }}>
          <h3 style={{ margin:0, fontSize:'0.9rem', fontWeight:600, color:'var(--text-1)' }}>Tokens consumidos (Gemini)</h3>
          <div style={{ display:'flex', gap:'4px', background:'var(--surface-2)', borderRadius:'8px', padding:'3px' }}>
            {PERIODS.map(p => (
              <button key={p.v} onClick={() => setPeriod(p.v)}
                style={{ padding:'0.3rem 0.75rem', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'0.78rem', fontWeight:600, fontFamily:'Inter, sans-serif', background: period===p.v ? 'var(--gradient)' : 'transparent', color: period===p.v ? '#fff' : 'var(--text-2)', transition:'all 0.15s' }}>
                {p.l}
              </button>
            ))}
          </div>
        </div>
        {data.tokenChart.length === 0
          ? <div style={{ textAlign:'center', padding:'2.5rem', color:'var(--text-3)', fontSize:'0.85rem' }}>Sin datos de tokens aún. Los gráficos se poblarán a medida que los bots procesen mensajes.</div>
          : (
            <>
              <div style={{ display:'flex', gap:'1rem', marginBottom:'1rem' }}>
                {[
                  { label:'Input (prompts)',   color:'#7c3aed' },
                  { label:'Output (respuestas)', color:'#3b82f6' },
                  { label:'Total combinado',   color:'#06b6d4' },
                ].map((s,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <div style={{ width:'24px', height:'2px', background:s.color, borderRadius:'1px' }} />
                    <span style={{ fontSize:'0.72rem', color:'var(--text-2)' }}>{s.label}</span>
                  </div>
                ))}
              </div>
              <SmoothAreaChart
                data={data.tokenChart.map(r => ({ label: r.label, value: (r.inp||0)+(r.out||0), inp: r.inp||0, out: r.out||0 }))}
                color="#3b82f6"
                height={168}
                tooltipFn={d => `${((d.value)/1000).toFixed(1)}k tokens`}
              />
            </>
          )
        }
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
        {/* Top bots */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'1.25rem', boxShadow:'var(--shadow-sm)' }}>
          <h3 style={{ margin:'0 0 1rem', fontSize:'0.875rem', fontWeight:600, color:'var(--text-1)' }}>Top bots por volumen (30d)</h3>
          {data.topBots.length === 0
            ? <p style={{ color:'var(--text-3)', fontSize:'0.82rem', textAlign:'center', padding:'1rem 0' }}>Sin datos aún.</p>
            : <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
              {data.topBots.map((b,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <span style={{ fontSize:'0.68rem', color:'var(--text-3)', width:'14px', textAlign:'right', flexShrink:0 }}>{i+1}</span>
                  <span style={{ fontSize:'0.82rem', color:'var(--text-1)', fontWeight:500, width:'110px', flexShrink:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{b.bot_name}</span>
                  <div style={{ flex:1, height:'7px', background:'var(--surface-3)', borderRadius:'4px', overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'var(--gradient)', borderRadius:'4px', width:`${(b.user_msgs/maxBotMsgs)*100}%` }} />
                  </div>
                  <span style={{ fontSize:'0.72rem', color:'var(--text-2)', width:'40px', textAlign:'right', flexShrink:0 }}>{b.user_msgs} msgs</span>
                </div>
              ))}
            </div>
          }
        </div>

        {/* Churn risk + uptime */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'1.25rem', boxShadow:'var(--shadow-sm)' }}>
            <h3 style={{ margin:'0 0 0.75rem', fontSize:'0.875rem', fontWeight:600, color:'var(--text-1)' }}>En riesgo de abandono <span style={{ fontSize:'0.72rem', color:'var(--danger)', fontWeight:500 }}>(sin actividad 7d)</span></h3>
            {data.churnRisk.length === 0
              ? <p style={{ color:'var(--success)', fontSize:'0.82rem', margin:0 }}>✓ Todos los bots activos</p>
              : <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', maxHeight:'120px', overflowY:'auto' }}>
                {data.churnRisk.map((b,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.4rem 0.6rem', background:'var(--danger-dim)', border:'1px solid var(--danger-border)', borderRadius:'7px' }}>
                    <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--danger)', flexShrink:0 }} />
                    <span style={{ fontSize:'0.82rem', color:'var(--text-1)', fontWeight:500 }}>{b.name}</span>
                  </div>
                ))}
              </div>
            }
          </div>

          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'1.25rem', boxShadow:'var(--shadow-sm)', flex:1 }}>
            <h3 style={{ margin:'0 0 0.75rem', fontSize:'0.875rem', fontWeight:600, color:'var(--text-1)' }}>Actividad por bot (días/30)</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', maxHeight:'130px', overflowY:'auto' }}>
              {data.uptimeByBot.map((b,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                  <span style={{ fontSize:'0.78rem', color:'var(--text-1)', fontWeight:500, width:'100px', flexShrink:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{b.name}</span>
                  <div style={{ flex:1, height:'6px', background:'var(--surface-3)', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', background: b.pct >= 70 ? 'var(--success)' : b.pct >= 30 ? 'var(--warning)' : 'var(--danger)', borderRadius:'3px', width:`${b.pct}%` }} />
                  </div>
                  <span style={{ fontSize:'0.72rem', color:'var(--text-2)', width:'36px', textAlign:'right', flexShrink:0 }}>{b.activeDays}d</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* API Errors */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'1.25rem', boxShadow:'var(--shadow-sm)' }}>
        <h3 style={{ margin:'0 0 1rem', fontSize:'0.875rem', fontWeight:600, color:'var(--text-1)' }}>Errores de API recientes</h3>
        {data.recentErrors.length === 0
          ? <p style={{ color:'var(--success)', fontSize:'0.82rem', margin:0 }}>✓ Sin errores registrados</p>
          : <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', maxHeight:'200px', overflowY:'auto' }}>
            {data.recentErrors.map((e,i) => (
              <div key={i} style={{ display:'flex', gap:'0.75rem', padding:'0.55rem 0.85rem', background:'var(--danger-dim)', border:'1px solid var(--danger-border)', borderRadius:'8px', alignItems:'flex-start' }}>
                <div style={{ flexShrink:0, marginTop:'2px' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--danger)' }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--danger)', marginBottom:'2px' }}>{e.bot_name}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-2)', lineHeight:1.4 }}>{e.message}</div>
                </div>
                <span style={{ fontSize:'0.65rem', color:'var(--text-3)', flexShrink:0 }}>{fmtTs(e.created_at)}</span>
              </div>
            ))}
          </div>
        }
      </div>

    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const endpoint = isRegistering ? `${API_URL}/api/register` : `${API_URL}/api/login`;
    const payload = isRegistering ? { name, email, password } : { email, password };
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Credenciales inválidas o error de red.');
      localStorage.setItem('atento_token', data.token);
      localStorage.setItem('atento_user', JSON.stringify(data.user));
      setTimeout(() => onLogin(data.user), 500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="brand-logo"><img src="/atento-logo.png" alt="Atento AI" /></div>
          <h2>Atento AI</h2>
          <p>{isRegistering ? 'Crea tu Espacio de Trabajo' : 'Portal de Acceso Privado SaaS'}</p>
        </div>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit} className="login-form">
          {isRegistering && (
            <div className="input-group">
              <Smartphone size={18} className="input-icon" />
              <input type="text" placeholder="Nombre completo del Comercio" required value={name} onChange={e => setName(e.target.value)} disabled={loading} />
            </div>
          )}
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input type="email" placeholder="Correo electrónico" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
          </div>
          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input type="password" placeholder="Contraseña" required value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
          </div>
          <button type="submit" className="btn-solid-blue" disabled={loading}>
            {loading ? <Loader className="spinner" size={18}/> : <>{isRegistering ? 'Crear cuenta' : 'Ingresar'} <ChevronRight size={18} /></>}
          </button>
        </form>
        <div className="login-footer" style={{marginTop:'1.5rem'}}>
          <p style={{marginBottom:'10px'}}>Protegido por encriptación 256-bit.</p>
          <button style={{background:'none', border:'none', color:'#818cf8', cursor:'pointer', fontWeight:'bold'}} onClick={() => { setIsRegistering(!isRegistering); setError(''); }}>
            {isRegistering ? '¿Ya tienes cuenta? Ingresa aquí' : '¿Nuevo emprendedor? Regístrate Gratis'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers compartidos con MerchantPanel ────────────────────────────────────
const AT_DAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const AT_DAYS_FULL = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const STATUS_COLOR = { confirmed:'#3b82f6', completed:'#10b981', cancelled:'#ef4444' };
const STATUS_LABEL = { confirmed:'Confirmado', completed:'Completado', cancelled:'Cancelado' };

function atGetWeekDays(offset) {
  const today = new Date();
  const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function atGetSlots(spec) {
  if (!spec?.schedule?.length) return { slots: [], dayMap: {} };
  let minM = Infinity, maxM = -Infinity;
  const dayMap = {};
  spec.schedule.forEach(s => {
    if (!s.active) return;
    const [sh, sm] = s.start_time.split(':').map(Number);
    const [eh, em] = s.end_time.split(':').map(Number);
    const start = sh * 60 + sm, end = eh * 60 + em;
    minM = Math.min(minM, start); maxM = Math.max(maxM, end);
    if (!dayMap[s.day_of_week]) dayMap[s.day_of_week] = [];
    dayMap[s.day_of_week].push({ start, end });
  });
  if (!isFinite(minM)) return { slots: [], dayMap };
  const slots = [];
  for (let cur = minM; cur < maxM; cur += (spec.duration_minutes || 30))
    slots.push(`${String(Math.floor(cur/60)).padStart(2,'0')}:${String(cur%60).padStart(2,'0')}`);
  return { slots, dayMap };
}

// ─── AdminTurnosPanel ─────────────────────────────────────────────────────────
const SPEC_COLORS = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4'];

function AdminTurnosPanel({ botId }) {
  const [specs, setSpecs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [view, setView] = useState('agenda'); // 'agenda' | 'especialidades'
  const [newSpec, setNewSpec] = useState({ name:'', duration_minutes:30, color:'#7c3aed', reminder_enabled:true, reminder_hours:[24], capacity:1 });
  const [showNewSpec, setShowNewSpec] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState(null);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [newAppt, setNewAppt] = useState({ specialty_id:'', client_phone:'', client_name:'', date:'', time:'', notes:'' });
  const [apptDetail, setApptDetail] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [apptMsg, setApptMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  // Timetable state
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSpecId, setSelectedSpecId] = useState(null);

  async function loadSpecs() {
    try {
      const res = await authFetch(`${API_URL}/api/bots/${botId}/specialties`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setSpecs(list);
      if (list.length > 0) setSelectedSpecId(prev => prev || list[0].id);
      const sch = {};
      for (const s of list) {
        sch[s.id] = AT_DAYS_FULL.map((_, i) => {
          const daySlots = (s.schedule || []).filter(sl => sl.day_of_week === i && sl.active);
          if (daySlots.length > 0) {
            return { day_of_week: i, active: true, windows: daySlots.map(sl => ({ start_time: sl.start_time, end_time: sl.end_time })) };
          }
          return { day_of_week: i, active: false, windows: [{ start_time: '09:00', end_time: '18:00' }] };
        });
      }
      setSchedule(sch);
    } catch { setSpecs([]); }
  }

  async function loadAppointments() {
    try {
      const res = await authFetch(`${API_URL}/api/bots/${botId}/appointments`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch { setAppointments([]); }
  }

  useEffect(() => { loadSpecs(); }, [botId]);
  useEffect(() => { loadAppointments(); }, [botId]);

  async function createSpec() {
    if (!newSpec.name.trim()) return;
    setSaving(true);
    try {
      await authFetch(`${API_URL}/api/bots/${botId}/specialties`, { method:'POST', body: JSON.stringify(newSpec) });
      setShowNewSpec(false);
      setNewSpec({ name:'', duration_minutes:30, color:'#7c3aed', reminder_enabled:true, reminder_hours:[24], capacity:1 });
      loadSpecs();
    } finally { setSaving(false); }
  }

  async function updateSpec() {
    if (!editingSpec?.name.trim()) return;
    setSaving(true);
    await authFetch(`${API_URL}/api/bots/${botId}/specialties/${editingSpec.id}`, {
      method:'PUT',
      body: JSON.stringify({ name:editingSpec.name, duration_minutes:editingSpec.duration_minutes, capacity:editingSpec.capacity, color:editingSpec.color, reminder_enabled:editingSpec.reminder_enabled, reminder_hours:editingSpec.reminder_hours })
    });
    setSaving(false); setEditingSpec(null); loadSpecs();
  }

  async function deleteSpec(sid) {
    if (!confirm('¿Eliminar este servicio y todos sus turnos?')) return;
    await authFetch(`${API_URL}/api/bots/${botId}/specialties/${sid}`, { method:'DELETE' });
    loadSpecs(); loadAppointments();
  }

  async function saveSchedule(sid) {
    setSavingSchedule(true); setScheduleMsg(null);
    try {
      const slots = [];
      for (const day of (schedule[sid] || [])) {
        if (!day.active) continue;
        for (const win of day.windows) {
          slots.push({ day_of_week: day.day_of_week, start_time: win.start_time, end_time: win.end_time, active: 1 });
        }
      }
      await authFetch(`${API_URL}/api/bots/${botId}/specialties/${sid}/schedule`, {
        method:'PUT', body: JSON.stringify({ slots })
      });
      setScheduleMsg({ ok:true, text:'✅ Horarios guardados.' });
      loadSpecs();
    } catch { setScheduleMsg({ ok:false, text:'❌ Error al guardar.' }); }
    finally { setSavingSchedule(false); }
  }

  function toggleDay(sid, dayIdx, active) {
    setSchedule(prev => ({ ...prev, [sid]: prev[sid].map((d, i) => i === dayIdx ? { ...d, active } : d) }));
  }

  function updateWindow(sid, dayIdx, winIdx, field, value) {
    setSchedule(prev => ({
      ...prev,
      [sid]: prev[sid].map((d, i) => i !== dayIdx ? d : {
        ...d, windows: d.windows.map((w, wi) => wi === winIdx ? { ...w, [field]: value } : w)
      })
    }));
  }

  function addWindow(sid, dayIdx) {
    setSchedule(prev => ({
      ...prev,
      [sid]: prev[sid].map((d, i) => i !== dayIdx ? d : {
        ...d, windows: [...d.windows, { start_time: '15:00', end_time: '18:00' }]
      })
    }));
  }

  function removeWindow(sid, dayIdx, winIdx) {
    setSchedule(prev => ({
      ...prev,
      [sid]: prev[sid].map((d, i) => i !== dayIdx ? d : {
        ...d, windows: d.windows.filter((_, wi) => wi !== winIdx)
      })
    }));
  }

  async function loadAvailableSlots() {
    if (!newAppt.specialty_id || !newAppt.date) { setAvailableSlots([]); return; }
    try {
      const res = await authFetch(`${API_URL}/api/bots/${botId}/appointments/available?specialty_id=${newAppt.specialty_id}&date=${newAppt.date}`);
      setAvailableSlots(await res.json());
    } catch { setAvailableSlots([]); }
  }

  useEffect(() => { loadAvailableSlots(); }, [newAppt.specialty_id, newAppt.date]);

  async function createAppointment() {
    if (!newAppt.specialty_id || !newAppt.client_phone || !newAppt.date || !newAppt.time) {
      setApptMsg({ ok:false, text:'Completá todos los campos obligatorios.' }); return;
    }
    setSaving(true); setApptMsg(null);
    try {
      const res = await authFetch(`${API_URL}/api/bots/${botId}/appointments`, { method:'POST', body: JSON.stringify(newAppt) });
      const data = await res.json();
      if (res.ok) {
        setShowNewAppt(false);
        setNewAppt({ specialty_id:'', client_phone:'', client_name:'', date:'', time:'', notes:'' });
        loadAppointments();
      } else { setApptMsg({ ok:false, text: data.error || 'Error al crear.' }); }
    } finally { setSaving(false); }
  }

  async function updateApptStatus(aid, status) {
    await authFetch(`${API_URL}/api/bots/${botId}/appointments/${aid}`, { method:'PUT', body: JSON.stringify({ status }) });
    loadAppointments();
  }

  async function deleteAppt(aid) {
    if (!confirm('¿Eliminar este turno definitivamente? Esta acción no se puede deshacer.')) return;
    await authFetch(`${API_URL}/api/bots/${botId}/appointments/${aid}`, { method:'DELETE' });
    setApptDetail(null); loadAppointments();
  }

  const inputStyle = { width:'100%', padding:'0.65rem 0.85rem', borderRadius:'8px', border:'1px solid var(--border)', background:'rgba(255,255,255,0.05)', color:'var(--text-primary)', fontSize:'0.9rem', boxSizing:'border-box' };
  const labelStyle = { fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:'0.25rem' };

  return (
    <div style={{ padding:'1.5rem 2rem' }}>

      {/* Modal editar servicio */}
      {editingSpec && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'16px', padding:'1.5rem', width:'100%', maxWidth:'420px', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, fontSize:'1rem' }}>Editar servicio</span>
              <button onClick={() => setEditingSpec(null)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.3rem 0.7rem' }}>✕</button>
            </div>
            <div><label style={labelStyle}>Nombre *</label>
              <input style={inputStyle} value={editingSpec.name} onChange={e => setEditingSpec(p=>({...p,name:e.target.value}))} placeholder="Nombre del servicio..." />
            </div>
            <div style={{ display:'flex', gap:'1rem' }}>
              <div style={{ flex:1 }}><label style={labelStyle}>Duración (min)</label>
                <input style={inputStyle} type="number" min="5" max="480" value={editingSpec.duration_minutes} onChange={e => setEditingSpec(p=>({...p,duration_minutes:Number(e.target.value)}))} />
              </div>
              <div style={{ flex:1 }}><label style={labelStyle}>Lugares simultáneos</label>
                <input style={inputStyle} type="number" min="1" max="100" value={editingSpec.capacity} onChange={e => setEditingSpec(p=>({...p,capacity:Number(e.target.value)}))} />
              </div>
              <div><label style={labelStyle}>Color</label>
                <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginTop:'0.25rem' }}>
                  {SPEC_COLORS.map(c => (
                    <div key={c} onClick={() => setEditingSpec(p=>({...p,color:c}))}
                      style={{ width:'24px', height:'24px', borderRadius:'50%', background:c, cursor:'pointer', border: editingSpec.color===c ? '2px solid white' : '2px solid transparent', boxSizing:'border-box' }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:'10px', padding:'0.75rem 1rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
              <div>
                <div style={{ fontWeight:600, fontSize:'0.875rem' }}>🔔 Recordatorio automático</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>Avisa al cliente por WhatsApp antes del turno</div>
              </div>
              <label style={{ position:'relative', display:'inline-block', width:'44px', height:'24px', flexShrink:0 }}>
                <input type="checkbox" checked={!!editingSpec.reminder_enabled} onChange={e => setEditingSpec(p=>({...p,reminder_enabled:e.target.checked}))} style={{ opacity:0, width:0, height:0 }} />
                <span style={{ position:'absolute', cursor:'pointer', inset:0, borderRadius:'34px', background:editingSpec.reminder_enabled?'#7c3aed':'rgba(255,255,255,0.15)', transition:'0.2s' }}>
                  <span style={{ position:'absolute', height:'18px', width:'18px', left:editingSpec.reminder_enabled?'23px':'3px', bottom:'3px', background:'white', borderRadius:'50%', transition:'0.2s' }} />
                </span>
              </label>
            </div>
            {editingSpec.reminder_enabled && (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.4rem' }}>
                  <label style={labelStyle}>Avisos antes del turno</label>
                  <button onClick={() => setEditingSpec(p => ({ ...p, reminder_hours: [...p.reminder_hours, 2] }))}
                    style={{ background:'linear-gradient(135deg,#7c3aed,#3b82f6)', border:'none', borderRadius:'6px', color:'#fff', cursor:'pointer', padding:'0.2rem 0.65rem', fontSize:'1rem', fontWeight:700, lineHeight:1 }}>+</button>
                </div>
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  {editingSpec.reminder_hours.map((h, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.3rem', background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.22)', borderRadius:'8px', padding:'0.3rem 0.5rem' }}>
                      <input type="number" min="1" max="168" value={h}
                        onChange={e => setEditingSpec(p => ({ ...p, reminder_hours: p.reminder_hours.map((v, j) => j === i ? Number(e.target.value) : v) }))}
                        style={{...inputStyle, width:'56px', margin:0, padding:'0.25rem 0.4rem'}} />
                      <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>h antes</span>
                      {editingSpec.reminder_hours.length > 1 && (
                        <button onClick={() => setEditingSpec(p => ({ ...p, reminder_hours: p.reminder_hours.filter((_, j) => j !== i) }))}
                          style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:'1rem', padding:'0 2px', lineHeight:1, opacity:0.5 }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
              <button onClick={() => setEditingSpec(null)} style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.6rem 1rem' }}>Cancelar</button>
              <button onClick={updateSpec} disabled={saving || !editingSpec.name.trim()} style={{ background:'linear-gradient(135deg,#7c3aed,#3b82f6)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', padding:'0.6rem 1.25rem', fontWeight:600 }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo servicio */}
      {showNewSpec && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'16px', padding:'1.5rem', width:'100%', maxWidth:'420px', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, fontSize:'1rem' }}>Nuevo servicio</span>
              <button onClick={() => setShowNewSpec(false)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.3rem 0.7rem' }}>✕</button>
            </div>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input style={inputStyle} value={newSpec.name} onChange={e => setNewSpec(p=>({...p,name:e.target.value}))} placeholder="Ej: Corte de cabello, Consulta médica, Asesoría..." />
            </div>
            <div style={{ display:'flex', gap:'1rem' }}>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>Duración del turno (min)</label>
                <input style={{...inputStyle}} type="number" min="5" max="480" value={newSpec.duration_minutes} onChange={e => setNewSpec(p=>({...p,duration_minutes:Number(e.target.value)}))} />
              </div>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>Lugares simultáneos</label>
                <input style={{...inputStyle}} type="number" min="1" max="100" value={newSpec.capacity} onChange={e => setNewSpec(p=>({...p,capacity:Number(e.target.value)}))} />
              </div>
              <div>
                <label style={labelStyle}>Color</label>
                <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginTop:'0.25rem' }}>
                  {SPEC_COLORS.map(c => (
                    <div key={c} onClick={() => setNewSpec(p=>({...p,color:c}))}
                      style={{ width:'24px', height:'24px', borderRadius:'50%', background:c, cursor:'pointer', border: newSpec.color===c ? '2px solid white' : '2px solid transparent', boxSizing:'border-box' }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:'10px', padding:'0.75rem 1rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
              <div>
                <div style={{ fontWeight:600, fontSize:'0.875rem' }}>🔔 Recordatorio automático</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>Avisa al cliente por WhatsApp antes del turno</div>
              </div>
              <label style={{ position:'relative', display:'inline-block', width:'44px', height:'24px', flexShrink:0 }}>
                <input type="checkbox" checked={!!newSpec.reminder_enabled} onChange={e => setNewSpec(p=>({...p,reminder_enabled:e.target.checked}))} style={{ opacity:0, width:0, height:0 }} />
                <span style={{ position:'absolute', cursor:'pointer', inset:0, borderRadius:'34px', background:newSpec.reminder_enabled?'#7c3aed':'rgba(255,255,255,0.15)', transition:'0.2s' }}>
                  <span style={{ position:'absolute', height:'18px', width:'18px', left:newSpec.reminder_enabled?'23px':'3px', bottom:'3px', background:'white', borderRadius:'50%', transition:'0.2s' }} />
                </span>
              </label>
            </div>
            {newSpec.reminder_enabled && (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.4rem' }}>
                  <label style={labelStyle}>Avisos antes del turno</label>
                  <button onClick={() => setNewSpec(p => ({ ...p, reminder_hours: [...p.reminder_hours, 2] }))}
                    style={{ background:'linear-gradient(135deg,#7c3aed,#3b82f6)', border:'none', borderRadius:'6px', color:'#fff', cursor:'pointer', padding:'0.2rem 0.65rem', fontSize:'1rem', fontWeight:700, lineHeight:1 }}>+</button>
                </div>
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  {newSpec.reminder_hours.map((h, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.3rem', background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.22)', borderRadius:'8px', padding:'0.3rem 0.5rem' }}>
                      <input type="number" min="1" max="168" value={h}
                        onChange={e => setNewSpec(p => ({ ...p, reminder_hours: p.reminder_hours.map((v, j) => j === i ? Number(e.target.value) : v) }))}
                        style={{...inputStyle, width:'56px', margin:0, padding:'0.25rem 0.4rem'}} />
                      <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>h antes</span>
                      {newSpec.reminder_hours.length > 1 && (
                        <button onClick={() => setNewSpec(p => ({ ...p, reminder_hours: p.reminder_hours.filter((_, j) => j !== i) }))}
                          style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:'1rem', padding:'0 2px', lineHeight:1, opacity:0.5 }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
              <button onClick={() => setShowNewSpec(false)} style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.6rem 1rem' }}>Cancelar</button>
              <button onClick={createSpec} disabled={saving || !newSpec.name.trim()} style={{ background:'linear-gradient(135deg,#7c3aed,#3b82f6)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', padding:'0.6rem 1.25rem', fontWeight:600 }}>
                {saving ? 'Creando...' : 'Crear servicio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo turno manual */}
      {showNewAppt && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'16px', padding:'1.5rem', width:'100%', maxWidth:'460px', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, fontSize:'1rem' }}>Nuevo turno manual</span>
              <button onClick={() => { setShowNewAppt(false); setApptMsg(null); }} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.3rem 0.7rem' }}>✕</button>
            </div>
            <div>
              <label style={labelStyle}>Servicio *</label>
              <select style={inputStyle} value={newAppt.specialty_id} onChange={e => setNewAppt(p=>({...p,specialty_id:e.target.value,time:''}))}>
                <option value="">— Seleccioná —</option>
                {specs.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes}min)</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>Fecha *</label>
                <input style={inputStyle} type="date" value={newAppt.date} onChange={e => setNewAppt(p=>({...p,date:e.target.value,time:''}))} />
              </div>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>Horario *</label>
                {availableSlots.length > 0 ? (
                  <select style={inputStyle} value={newAppt.time} onChange={e => setNewAppt(p=>({...p,time:e.target.value}))}>
                    <option value="">— Seleccioná —</option>
                    {availableSlots.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input style={inputStyle} type="time" value={newAppt.time} onChange={e => setNewAppt(p=>({...p,time:e.target.value}))} placeholder="HH:MM" />
                )}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Teléfono WhatsApp * <span style={{ opacity:0.6 }}>(con código de país, ej: 5491123456789)</span></label>
              <input style={inputStyle} value={newAppt.client_phone} onChange={e => setNewAppt(p=>({...p,client_phone:e.target.value}))} placeholder="5491123456789" />
            </div>
            <div>
              <label style={labelStyle}>Nombre del cliente</label>
              <input style={inputStyle} value={newAppt.client_name} onChange={e => setNewAppt(p=>({...p,client_name:e.target.value}))} placeholder="Ej: María González" />
            </div>
            <div>
              <label style={labelStyle}>Notas</label>
              <input style={inputStyle} value={newAppt.notes} onChange={e => setNewAppt(p=>({...p,notes:e.target.value}))} placeholder="Ej: Primera vez, trae documentación, requiere confirmación..." />
            </div>
            {apptMsg && <p style={{ margin:0, fontSize:'0.875rem', color:apptMsg.ok?'#10b981':'#f87171' }}>{apptMsg.text}</p>}
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
              <button onClick={() => { setShowNewAppt(false); setApptMsg(null); }} style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.6rem 1rem' }}>Cancelar</button>
              <button onClick={createAppointment} disabled={saving} style={{ background:'linear-gradient(135deg,#7c3aed,#3b82f6)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', padding:'0.6rem 1.25rem', fontWeight:600 }}>
                {saving ? 'Guardando...' : 'Confirmar turno'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle de turno */}
      {apptDetail && (() => {
        const spec = specs.find(s => s.id === apptDetail.specialty_id);
        const statusColors = { confirmed:'#10b981', cancelled:'#ef4444', completed:'#3b82f6' };
        const statusLabels = { confirmed:'Confirmado', cancelled:'Cancelado', completed:'Completado' };
        return (
          <div onClick={() => setApptDetail(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'16px', padding:'1.5rem', width:'100%', maxWidth:'380px', display:'flex', flexDirection:'column', gap:'1rem' }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                {spec && <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:spec.color, flexShrink:0 }} />}
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:'1rem' }}>{apptDetail.client_name || 'Sin nombre'}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>{spec?.name} · {apptDetail.date} {apptDetail.time}</div>
                </div>
                <span style={{ fontSize:'0.72rem', fontWeight:700, padding:'3px 10px', borderRadius:'20px', background:`${statusColors[apptDetail.status]}20`, color:statusColors[apptDetail.status], border:`1px solid ${statusColors[apptDetail.status]}50` }}>
                  {statusLabels[apptDetail.status]}
                </span>
                <button onClick={() => setApptDetail(null)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.3rem 0.6rem', flexShrink:0 }}>✕</button>
              </div>
              {/* Info */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {apptDetail.client_phone && (
                  <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.6rem 0.85rem', background:'rgba(255,255,255,0.04)', borderRadius:'8px', border:'1px solid var(--border)' }}>
                    <span style={{ fontSize:'1rem' }}>📱</span>
                    <span style={{ fontSize:'0.875rem', flex:1 }}>{apptDetail.client_phone}</span>
                    <a href={`https://wa.me/${apptDetail.client_phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                      style={{ fontSize:'0.72rem', background:'rgba(37,211,102,0.15)', border:'1px solid rgba(37,211,102,0.3)', borderRadius:'6px', color:'#25d366', padding:'2px 8px', textDecoration:'none', fontWeight:600 }}>
                      WhatsApp
                    </a>
                  </div>
                )}
                {apptDetail.notes && (
                  <div style={{ display:'flex', gap:'0.6rem', padding:'0.6rem 0.85rem', background:'rgba(255,255,255,0.04)', borderRadius:'8px', border:'1px solid var(--border)' }}>
                    <span style={{ fontSize:'1rem', flexShrink:0 }}>📝</span>
                    <span style={{ fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:1.4 }}>{apptDetail.notes}</span>
                  </div>
                )}
                {!apptDetail.client_phone && !apptDetail.notes && (
                  <p style={{ margin:0, fontSize:'0.8rem', color:'var(--text-secondary)', textAlign:'center' }}>Sin información adicional</p>
                )}
              </div>
              {/* Acciones */}
              {apptDetail.status === 'confirmed' && (
                <div style={{ display:'flex', gap:'0.6rem' }}>
                  <button onClick={() => { updateApptStatus(apptDetail.id,'completed'); setApptDetail(p => ({...p, status:'completed'})); }}
                    style={{ flex:1, background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.4)', borderRadius:'8px', color:'#60a5fa', cursor:'pointer', padding:'0.55rem', fontWeight:600, fontSize:'0.85rem' }}>
                    ✓ Completado
                  </button>
                  <button onClick={() => { updateApptStatus(apptDetail.id,'cancelled'); setApptDetail(p => ({...p, status:'cancelled'})); }}
                    style={{ flex:1, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.35)', borderRadius:'8px', color:'#f87171', cursor:'pointer', padding:'0.55rem', fontWeight:600, fontSize:'0.85rem' }}>
                    ✕ Cancelar
                  </button>
                </div>
              )}
              {apptDetail.status === 'cancelled' && (
                <button onClick={() => { updateApptStatus(apptDetail.id,'confirmed'); setApptDetail(p => ({...p, status:'confirmed'})); }}
                  style={{ width:'100%', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.35)', borderRadius:'8px', color:'#34d399', cursor:'pointer', padding:'0.55rem', fontWeight:600, fontSize:'0.85rem' }}>
                  ↩ Restaurar turno
                </button>
              )}
              <button onClick={() => deleteAppt(apptDetail.id)}
                style={{ width:'100%', marginTop:'0.5rem', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', color:'#f87171', cursor:'pointer', padding:'0.45rem', fontWeight:600, fontSize:'0.8rem' }}>
                🗑 Eliminar turno
              </button>
            </div>
          </div>
        );
      })()}

      {/* Header y tabs de vista */}
      <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:'0.4rem' }}>
          {[{id:'agenda',label:'📅 Agenda'},{id:'especialidades',label:'📋 Servicios'}].map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              style={{ padding:'0.4rem 0.9rem', borderRadius:'20px', border:'1px solid var(--border)', background:view===t.id?'linear-gradient(135deg,#7c3aed,#3b82f6)':'rgba(255,255,255,0.05)', color:view===t.id?'#fff':'var(--text-secondary)', cursor:'pointer', fontSize:'0.85rem', fontWeight:view===t.id?700:400, transition:'0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowNewSpec(true)} style={{ marginLeft:'auto', background:'linear-gradient(135deg,#7c3aed,#3b82f6)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', padding:'0.5rem 1rem', fontSize:'0.875rem', fontWeight:600 }}>
          + Nuevo servicio
        </button>
      </div>

      {/* ── Vista: Horario tipo planilla ── */}
      {view === 'agenda' && (() => {
        const weekDays = atGetWeekDays(weekOffset);
        const todayStr = new Date().toISOString().slice(0,10);

        // Index appointments: {date_time: appointment}
        const apptIndex = {};
        appointments.forEach(a => { apptIndex[`${a.date}_${a.time}_${a.specialty_id}`] = a; });

        const activeSpec = specs.find(s => s.id === selectedSpecId);
        const { slots, dayMap } = activeSpec ? atGetSlots(activeSpec) : { slots:[], dayMap:{} };
        const hasSchedule = slots.length > 0;
        const dur = activeSpec?.duration_minutes || 30;
        const displaySlots = hasSchedule ? slots : Array.from(
          { length: Math.ceil(720 / dur) },
          (_, i) => { const m = 480 + i * dur; return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`; }
        );

        return (
          <div>
            {/* Cards de servicios */}
            {specs.length === 0 ? (
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px dashed var(--border)', borderRadius:'12px', padding:'2rem', textAlign:'center', color:'var(--text-secondary)', fontSize:'0.85rem', marginBottom:'1rem' }}>
                No hay servicios configurados. Creá uno en <strong>📋 Servicios</strong>.
              </div>
            ) : (
              <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginBottom:'1rem' }}>
                {specs.map(spec => {
                  const confirmed = appointments.filter(a => a.specialty_id === spec.id && a.status==='confirmed').length;
                  const isActive = selectedSpecId === spec.id;
                  return (
                    <div key={spec.id} onClick={() => setSelectedSpecId(isActive ? null : spec.id)}
                      style={{ display:'flex', alignItems:'center', gap:'0.45rem', padding:'0.35rem 0.75rem', borderRadius:'20px', border:`1.5px solid ${isActive ? spec.color : 'var(--border)'}`, background: isActive ? `${spec.color}20` : 'var(--card-bg)', cursor:'pointer', transition:'all 0.15s' }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:spec.color, flexShrink:0 }} />
                      <span style={{ fontWeight:600, fontSize:'0.82rem', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace:'nowrap' }}>{spec.name}</span>
                      {confirmed > 0 && <span style={{ fontSize:'0.7rem', fontWeight:700, background:spec.color, color:'#fff', borderRadius:'10px', padding:'0 5px', lineHeight:'1.4' }}>{confirmed}</span>}
                      <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginLeft:'1px' }}>{isActive ? '▲' : '▼'}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grilla semanal */}
            {activeSpec && (
              <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>

                {/* Nav semana */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1rem', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
                  <button onClick={() => setWeekOffset(w => w-1)}
                    style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.25rem 0.6rem', fontSize:'1rem' }}>‹</button>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:activeSpec.color }} />
                    <span style={{ fontWeight:700, fontSize:'0.9rem' }}>{activeSpec.name}</span>
                    <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>
                      Semana del {new Date(weekDays[0]+'T12:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'})} al {new Date(weekDays[6]+'T12:00').toLocaleDateString('es-AR',{day:'numeric',month:'short',year:'numeric'})}
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:'0.4rem' }}>
                    {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.25rem 0.55rem', fontSize:'0.72rem' }}>Hoy</button>}
                    <button onClick={() => setWeekOffset(w => w+1)}
                      style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.25rem 0.6rem', fontSize:'1rem' }}>›</button>
                  </div>
                </div>

                {/* Tabla */}
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
                    <thead>
                      <tr>
                        {/* Col "Hora" */}
                        <th style={{ width:'64px', padding:'0.5rem', background:'rgba(255,255,255,0.03)', borderBottom:'2px solid var(--border)', borderRight:'1px solid var(--border)', fontSize:'0.7rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Hora</th>
                        {weekDays.map((date, i) => {
                          const isToday = date === todayStr;
                          const jsDay = new Date(date+'T12:00').getDay();
                          const dow = jsDay===0?6:jsDay-1;
                          const colHasSchedule = hasSchedule ? !!dayMap[dow] : true;
                          return (
                            <th key={date} style={{ padding:'0.5rem 0.25rem', background: isToday ? `${activeSpec.color}22` : 'rgba(255,255,255,0.03)', borderBottom:'2px solid var(--border)', borderRight: i<6?'1px solid var(--border)':'none', textAlign:'center', opacity: colHasSchedule ? 1 : 0.45 }}>
                              <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{AT_DAYS[i]}</div>
                              <div style={{ fontSize:'0.82rem', fontWeight: isToday ? 800 : 600, color: isToday ? activeSpec.color : 'var(--text-primary)', marginTop:'0.1rem' }}>
                                {new Date(date+'T12:00').getDate()}
                              </div>
                              {isToday && <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:activeSpec.color, margin:'2px auto 0' }} />}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {displaySlots.map((slot) => (
                        <tr key={slot}>
                          {/* Hora */}
                          <td style={{ padding:'0.3rem 0.5rem', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid var(--border)', borderRight:'1px solid var(--border)', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', textAlign:'right', verticalAlign:'top', whiteSpace:'nowrap' }}>{slot}</td>
                          {weekDays.map((date, di) => {
                            const jsDay = new Date(date+'T12:00').getDay();
                            const dow = jsDay===0?6:jsDay-1;
                            const [sh,sm] = slot.split(':').map(Number);
                            const mins = sh*60+sm;
                            const inSchedule = hasSchedule
                              ? (dayMap[dow]?.some(w => mins >= w.start && mins < w.end) ?? false)
                              : true;
                            const appt = apptIndex[`${date}_${slot}_${activeSpec.id}`];
                            const isToday = date === todayStr;

                            return (
                              <td key={date} style={{ padding:'0.25rem', borderBottom:'1px solid var(--border)', borderRight: di<6?'1px solid var(--border)':'none', verticalAlign:'top', background: isToday ? `${activeSpec.color}08` : 'transparent', minHeight:'42px', height:'42px' }}>
                                {!inSchedule ? (
                                  <div style={{ height:'100%', background:'rgba(0,0,0,0.15)', borderRadius:'4px', minHeight:'36px' }} />
                                ) : appt ? (
                                  <div onClick={() => setApptDetail(appt)} style={{
                                    background: appt.status==='cancelled'?'rgba(239,68,68,0.15)':appt.status==='completed'?'rgba(59,130,246,0.18)':`${activeSpec.color}25`,
                                    border:`1px solid ${appt.status==='cancelled'?'rgba(239,68,68,0.4)':appt.status==='completed'?'rgba(59,130,246,0.4)':`${activeSpec.color}55`}`,
                                    borderRadius:'6px', padding:'0.25rem 0.4rem', cursor:'pointer', minHeight:'36px',
                                  }}>
                                    <div style={{ fontSize:'0.7rem', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: appt.status==='cancelled'?'#f87171':appt.status==='completed'?'#60a5fa':'var(--text-primary)' }}>
                                      {appt.client_name || '—'}
                                    </div>
                                    {appt.client_phone && (
                                      <div style={{ fontSize:'0.62rem', color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'1px' }}>
                                        📱 {appt.client_phone}
                                      </div>
                                    )}
                                    {appt.notes && (
                                      <div style={{ fontSize:'0.62rem', color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'1px', opacity:0.8 }}>
                                        📝 {appt.notes}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div onClick={() => { setNewAppt({ specialty_id:activeSpec.id, date, time:slot, client_phone:'', client_name:'', notes:'' }); setShowNewAppt(true); setApptMsg(null); }}
                                    style={{ minHeight:'36px', borderRadius:'6px', cursor:'pointer', border:'1px dashed transparent', transition:'0.12s', display:'flex', alignItems:'center', justifyContent:'center' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor=`${activeSpec.color}55`; e.currentTarget.style.background=`${activeSpec.color}08`; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.background='transparent'; }}>
                                    <span style={{ fontSize:'0.65rem', color:'var(--text-secondary)', opacity:0, transition:'0.12s' }}
                                      onMouseEnter={e=>e.currentTarget.style.opacity=1}
                                      onMouseLeave={e=>e.currentTarget.style.opacity=0}>+</span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Leyenda */}
                <div style={{ padding:'0.5rem 1rem', borderTop:'1px solid var(--border)', display:'flex', gap:'1.25rem', flexWrap:'wrap', alignItems:'center' }}>
                  {[{color:activeSpec.color,label:'Confirmado'},{color:'#3b82f6',label:'Completado'},{color:'#ef4444',label:'Cancelado'},{color:'rgba(0,0,0,0.4)',label:'Sin horario'}].map(l => (
                    <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.72rem', color:'var(--text-secondary)' }}>
                      <div style={{ width:'10px', height:'10px', borderRadius:'2px', background:l.color }} />{l.label}
                    </div>
                  ))}
                  <div style={{ marginLeft:'auto', fontSize:'0.72rem', color:'var(--text-secondary)' }}>Hacé clic en un casillero vacío para crear un turno</div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Vista: Servicios + Horarios ── */}
      {view === 'especialidades' && (
        <>
          {specs.length === 0 && (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px dashed var(--border)', borderRadius:'12px', padding:'2.5rem', textAlign:'center' }}>
              <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📋</div>
              <p style={{ color:'var(--text-secondary)', margin:0 }}>Todavía no configuraste ningún servicio. Creá uno arriba para que el bot pueda gestionar turnos automáticamente.</p>
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            {specs.map(spec => (
              <div key={spec.id} style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
                {/* Header servicio */}
                <div style={{ padding:'0.85rem 1.1rem', display:'flex', alignItems:'center', gap:'0.75rem', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
                  <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:spec.color, flexShrink:0 }} />
                  <span style={{ fontWeight:700, flex:1 }}>{spec.name}</span>
                  <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', borderRadius:'20px', padding:'2px 8px' }}>
                    {spec.duration_minutes} min / turno{spec.capacity > 1 ? ` · ${spec.capacity} lugares` : ''}
                  </span>
                  {spec.reminder_enabled ? (
                    <span style={{ fontSize:'0.72rem', color:'#10b981', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'20px', padding:'2px 8px' }}>
                      🔔 {(Array.isArray(spec.reminder_hours) ? spec.reminder_hours : [spec.reminder_hours]).join('h / ')}h antes
                    </span>
                  ) : (
                    <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', opacity:0.5 }}>Sin recordatorio</span>
                  )}
                  <button onClick={() => setEditingSpec({ ...spec, reminder_hours: Array.isArray(spec.reminder_hours) ? spec.reminder_hours : [spec.reminder_hours || 24] })} style={{ background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.3)', borderRadius:'7px', color:'#818cf8', cursor:'pointer', padding:'0.3rem 0.6rem', fontSize:'0.75rem' }}>Editar</button>
                  <button onClick={() => deleteSpec(spec.id)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'7px', color:'#f87171', cursor:'pointer', padding:'0.3rem 0.6rem', fontSize:'0.75rem' }}>Eliminar</button>
                </div>

                {/* Grilla de horarios semanal */}
                <div style={{ padding:'1rem 1.1rem' }}>
                  <div style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.75rem' }}>Horarios disponibles</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                    {AT_DAYS_FULL.map((dayName, i) => {
                      const day = (schedule[spec.id] || [])[i] || { day_of_week:i, active:false, windows:[{start_time:'09:00',end_time:'18:00'}] };
                      const timeInput = (disabled, val, onChange) => (
                        <input type="time" value={val} disabled={disabled} onChange={onChange}
                          style={{ padding:'0.3rem 0.5rem', borderRadius:'6px', border:'1px solid var(--border)', background:!disabled?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.02)', color:!disabled?'var(--text-primary)':'var(--text-secondary)', fontSize:'0.82rem', opacity:!disabled?1:0.4 }} />
                      );
                      const totalSlots = day.active ? day.windows.reduce((acc, w) => {
                        const [sh,sm]=w.start_time.split(':').map(Number);
                        const [eh,em]=w.end_time.split(':').map(Number);
                        return acc + Math.max(0, Math.floor(((eh*60+em)-(sh*60+sm))/spec.duration_minutes));
                      }, 0) : 0;

                      return (
                        <div key={i} style={{ display:'flex', gap:'0.6rem', alignItems:'flex-start' }}>
                          {/* Checkbox + nombre día */}
                          <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', cursor:'pointer', minWidth:'105px', paddingTop:'0.35rem' }}>
                            <input type="checkbox" checked={!!day.active} onChange={e => toggleDay(spec.id, i, e.target.checked)}
                              style={{ accentColor:spec.color, width:'15px', height:'15px', flexShrink:0 }} />
                            <span style={{ fontSize:'0.82rem', color:day.active?'var(--text-primary)':'var(--text-secondary)', fontWeight:day.active?600:400 }}>{dayName}</span>
                          </label>

                          {/* Ventanas horarias */}
                          <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem', flex:1 }}>
                            {day.windows.map((win, wi) => (
                              <div key={wi} style={{ display:'flex', alignItems:'center', gap:'0.4rem', flexWrap:'wrap' }}>
                                {timeInput(!day.active, win.start_time, e => updateWindow(spec.id, i, wi, 'start_time', e.target.value))}
                                <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>a</span>
                                {timeInput(!day.active, win.end_time, e => updateWindow(spec.id, i, wi, 'end_time', e.target.value))}

                                {/* Botón + (solo en primer turno si hay 1 ventana) */}
                                {day.active && wi === 0 && day.windows.length === 1 && (
                                  <button onClick={() => addWindow(spec.id, i)}
                                    title="Agregar horario cortado"
                                    style={{ background:'rgba(255,255,255,0.07)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.25rem 0.55rem', fontSize:'0.8rem', fontWeight:700, lineHeight:1 }}>+</button>
                                )}

                                {/* Botón − (solo en la segunda ventana) */}
                                {day.active && wi > 0 && (
                                  <button onClick={() => removeWindow(spec.id, i, wi)}
                                    title="Quitar este horario"
                                    style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'6px', color:'#f87171', cursor:'pointer', padding:'0.25rem 0.55rem', fontSize:'0.8rem', fontWeight:700, lineHeight:1 }}>−</button>
                                )}

                                {/* Contador de turnos (solo en última ventana) */}
                                {day.active && wi === day.windows.length - 1 && totalSlots > 0 && (
                                  <span style={{ fontSize:'0.71rem', color:'var(--text-secondary)', opacity:0.7 }}>{totalSlots} turnos/día</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginTop:'0.85rem' }}>
                    <button onClick={() => saveSchedule(spec.id)} disabled={savingSchedule}
                      style={{ background:'linear-gradient(135deg,#7c3aed,#3b82f6)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', padding:'0.5rem 1.1rem', fontSize:'0.85rem', fontWeight:600 }}>
                      {savingSchedule ? 'Guardando...' : 'Guardar horarios'}
                    </button>
                    {scheduleMsg && <span style={{ fontSize:'0.82rem', color:scheduleMsg.ok?'#10b981':'#f87171' }}>{scheduleMsg.text}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Dashboard() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('atento_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [bots, setBots] = useState([]);
  const [qrCodes, setQrCodes] = useState({});

  const [openSettingsId, setOpenSettingsId] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState({});
  const [editingKnowledge, setEditingKnowledge] = useState({});
  const [editingShopify, setEditingShopify] = useState({});
  const [editingWorkingHours, setEditingWorkingHours] = useState({});
  const [expandedField, setExpandedField] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', password: '', shopifyUrl: '' });
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [newManager, setNewManager] = useState({ name: '', email: '', password: '' });
  const [managerError, setManagerError] = useState('');
  const [botSearch, setBotSearch] = useState('');
  const [filterManagerId, setFilterManagerId] = useState('');
  const [managerList, setManagerList] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [adminPhoneCountryCode, setAdminPhoneCountryCode] = useState({});
  const [adminPhoneToVerify, setAdminPhoneToVerify] = useState({});
  const [verificationCode, setVerificationCode] = useState({});
  const [isVerifyingMFA, setIsVerifyingMFA] = useState({});

  const [telegramTokens, setTelegramTokens] = useState({});
  const [telegramSaving, setTelegramSaving] = useState({});
  const [telegramMsg, setTelegramMsg] = useState({});
  const [whatsappCloudForm, setWhatsappCloudForm] = useState({});
  const [whatsappCloudSaving, setWhatsappCloudSaving] = useState({});
  const [whatsappCloudMsg, setWhatsappCloudMsg] = useState({});
  const [igManualInputs, setIgManualInputs] = useState({}); // botId → username string
  const [igManualShow, setIgManualShow] = useState({});     // botId → bool (show manual input)
  const [igManualSaving, setIgManualSaving] = useState({});
  const [editingLanguage, setEditingLanguage] = useState({});

  const [debtors, setDebtors] = useState({});
  const [newDebtor, setNewDebtor] = useState({});

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [metaPageSelect, setMetaPageSelect] = useState(null);
  const [metaConnecting, setMetaConnecting] = useState(false);
  const [whatsappNumberSelect, setWhatsappNumberSelect] = useState(null);
  const [whatsappConnecting, setWhatsappConnecting] = useState(false);

  const [theme, setTheme] = useState(() => localStorage.getItem('atento_theme') || 'dark');
  const [currentView, setCurrentView] = useState('bots');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('atento_theme', theme);
  }, [theme]);

  const fetchBots = () => {
    authFetch(`${API_URL}/api/bots`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setBots(list);
        setQrCodes(prev => {
          const next = { ...prev };
          list.forEach(bot => {
            if (bot.qr) next[bot.id] = bot.qr;
            else if (bot.status !== 'QR_READY') delete next[bot.id];
          });
          return next;
        });
      });
  };

  const fetchDebtors = async (botId) => {
    const res = await authFetch(`${API_URL}/api/bots/${botId}/debtors`);
    const data = await res.json();
    setDebtors(prev => ({...prev, [botId]: data}));
  };

  useEffect(() => {
    if (!user) return;
    fetchBots();
    if (user.role === 'admin') {
      authFetch(`${API_URL}/api/managers`).then(r => r.json()).then(d => setManagerList(Array.isArray(d) ? d : []));
    }
    socket.on('connect', fetchBots);
    const onFocus = () => fetchBots();
    window.addEventListener('focus', onFocus);
    socket.on('bot_status', (data) => {
      setBots(prev => prev.map(bot => bot.id === data.id ? { ...bot, ...data } : bot));
    });
    socket.on('bot_updated', (data) => {
      setBots(prev => prev.map(bot => bot.id === data.id ? { ...bot, prompt: data.prompt, knowledgeBase: data.knowledgeBase, shopifyUrl: data.shopifyUrl, metrics: {...bot.metrics, workingHours: data.workingHours, hasDebtorsFeature: data.hasDebtorsFeature, hasSocialFeature: data.hasSocialFeature} } : bot));
    });
    socket.on('bot_added', fetchBots);
    socket.on('qr_code', (data) => {
      setQrCodes(prev => ({ ...prev, [data.id]: data.qr }));
    });
    socket.on('bot_error', (data) => {
      let cleanMsg = data.message;
      if (cleanMsg.includes('429 Too Many Requests') || cleanMsg.includes('quota')) cleanMsg = "Límite gratuito de IA excedido (429).";
      else if (cleanMsg.includes('API key not valid')) cleanMsg = "API Key inválida o no configurada.";
      setNotifications(prev => [{ id: Date.now() + Math.random(), title: "⚠️ Alerta Técnica AI", botName: data.botName, message: cleanMsg }, ...prev]);
    });
    const params = new URLSearchParams(window.location.search);
    const selToken = params.get('meta_select');
    if (selToken) {
      window.history.replaceState({}, '', window.location.pathname);
      authFetch(`${API_URL}/api/oauth/meta/pages?token=${selToken}`)
        .then(r => r.json())
        .then(data => { if (data.pages) setMetaPageSelect({ token: selToken, pages: data.pages }); })
        .catch(() => {});
    }
    const waToken = params.get('whatsapp_select');
    if (waToken) {
      window.history.replaceState({}, '', window.location.pathname);
      authFetch(`${API_URL}/api/oauth/whatsapp/numbers?token=${waToken}`)
        .then(r => r.json())
        .then(data => { if (data.numbers) setWhatsappNumberSelect({ token: waToken, numbers: data.numbers }); })
        .catch(() => {});
    }
    const onOAuthMessage = (e) => {
      if (e.origin !== window.location.origin) return;
      const { type, token, error } = e.data || {};
      if (type === 'meta_ok') {
        fetchBots();
      } else if (type === 'whatsapp_ok') {
        fetchBots();
      } else if (type === 'meta_select') {
        authFetch(`${API_URL}/api/oauth/meta/pages?token=${token}`)
          .then(r => r.json())
          .then(data => { if (data.pages) setMetaPageSelect({ token, pages: data.pages }); })
          .catch(() => {});
      } else if (type === 'whatsapp_select') {
        authFetch(`${API_URL}/api/oauth/whatsapp/numbers?token=${token}`)
          .then(r => r.json())
          .then(data => { if (data.numbers) setWhatsappNumberSelect({ token, numbers: data.numbers }); })
          .catch(() => {});
      } else if (type === 'meta_error') {
        const msgs = { acceso_denegado: 'Cancelaste el acceso.', sesion_expirada: 'La sesión expiró.', sin_paginas: 'No se encontraron páginas de Facebook.', sin_whatsapp: 'No se encontraron números de WhatsApp.', error_whatsapp: 'No pudimos conectar WhatsApp.', error_interno: 'Error interno.' };
        alert(msgs[error] || error);
      }
    };
    window.addEventListener('message', onOAuthMessage);
    return () => {
      socket.off('connect', fetchBots);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('message', onOAuthMessage);
      socket.off('bot_status'); socket.off('bot_updated'); socket.off('bot_added'); socket.off('qr_code'); socket.off('bot_error');
    };
  }, [user]);

  if (!user) return <LoginScreen onLogin={setUser} />;

  const baseBots = user.role === 'admin' || user.role === 'manager' ? bots : bots.filter(b => b.id === user.botId);
  const displayBots = baseBots.filter(b => {
    if (botSearch) {
      const q = botSearch.toLowerCase();
      const adminNum = (b.metrics?.adminNumber || '').replace('@c.us','').replace('@s.whatsapp.net','');
      if (!b.name.toLowerCase().includes(q) && !adminNum.includes(q)) return false;
    }
    if (filterManagerId === 'none' && b.manager_id) return false;
    if (filterManagerId && filterManagerId !== 'none' && b.manager_id !== filterManagerId) return false;
    return true;
  });

  // KPI totals
  const activeBots = displayBots.filter(b => b.status === 'ON').length;
  const totalMsgs = displayBots.reduce((s, b) => s + (b.metrics?.messagesSent || 0), 0);
  const totalClients = displayBots.reduce((s, b) => s + (b.metrics?.customersHelped || 0), 0);
  const totalCost = displayBots.reduce((s, b) => {
    const inp = b.metrics?.tokensInput || 0;
    const out = b.metrics?.tokensOutput || 0;
    return s + (inp * 0.075 + out * 0.30) / 1_000_000;
  }, 0);

  const handleStart = async (id) => {
    const bot = bots.find(b => b.id === id);
    const hasMetaOrTelegram = bot?.metaPageId || bot?.metaIgId || bot?.telegramBotToken;
    const hasWhatsApp = bot?.businessPhone;
    // WhatsApp uses QR/Web session. Meta/Telegram can still activate without QR.
    if (hasMetaOrTelegram && !hasWhatsApp) {
      const res = await authFetch(`${API_URL}/api/bots/${id}/activate-meta`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) alert(data.error || 'Error al activar.');
      return;
    }
    setQrCodes(prev => ({ ...prev, [id]: null }));
    await authFetch(`${API_URL}/api/bots/${id}/start`, { method: 'POST' });
  };
  const handleStop = async (id) => {
    await authFetch(`${API_URL}/api/bots/${id}/stop`, { method: 'POST' });
    setQrCodes(prev => ({ ...prev, [id]: null }));
  };

  const handleSaveWhatsAppCloud = async (bot, disconnect = false) => {
    const form = whatsappCloudForm[bot.id] || {};
    const payload = disconnect ? { disconnect: true } : {
      phoneNumberId: form.phoneNumberId ?? bot.whatsappPhoneNumberId ?? '',
      businessAccountId: form.businessAccountId ?? bot.whatsappBusinessAccountId ?? '',
      accessToken: form.accessToken ?? '',
    };
    setWhatsappCloudSaving(s => ({ ...s, [bot.id]: true }));
    setWhatsappCloudMsg(m => ({ ...m, [bot.id]: null }));
    try {
      const res = await authFetch(`${API_URL}/api/bots/${bot.id}/whatsapp-cloud`, { method: 'PUT', body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        setWhatsappCloudMsg(m => ({ ...m, [bot.id]: { ok: false, text: data.error || 'Error al guardar WhatsApp API.' } }));
        return;
      }
      setBots(prev => prev.map(b => b.id === bot.id ? {
        ...b,
        whatsappPhoneNumberId: data.connected ? data.phoneNumberId : null,
        whatsappBusinessAccountId: data.connected ? data.businessAccountId : null,
        whatsappAccessToken: data.connected ? (payload.accessToken || b.whatsappAccessToken || 'configured') : null,
        whatsappMode: data.connected ? 'cloud' : 'webjs',
      } : b));
      setWhatsappCloudForm(f => ({ ...f, [bot.id]: { phoneNumberId: data.phoneNumberId || '', businessAccountId: data.businessAccountId || '', accessToken: '' } }));
      setWhatsappCloudMsg(m => ({ ...m, [bot.id]: { ok: true, text: data.connected ? 'WhatsApp API conectado.' : 'WhatsApp API desconectado.' } }));
    } catch {
      setWhatsappCloudMsg(m => ({ ...m, [bot.id]: { ok: false, text: 'Error de conexión.' } }));
    } finally {
      setWhatsappCloudSaving(s => ({ ...s, [bot.id]: false }));
      setTimeout(() => setWhatsappCloudMsg(m => ({ ...m, [bot.id]: null })), 4500);
    }
  };

  const handleLogout = async (id) => {
    if (!confirm('¿Desvincular WhatsApp? Se borrará la sesión y deberás escanear el QR nuevamente.')) return;
    await authFetch(`${API_URL}/api/bots/${id}/logout`, { method: 'POST' });
    setQrCodes(prev => ({ ...prev, [id]: null }));
  };

  const handleSavePrompt = async (botId) => {
    const bodyData = {};
    if (editingPrompt[botId] !== undefined) bodyData.prompt = editingPrompt[botId];
    if (editingKnowledge[botId] !== undefined) bodyData.knowledgeBase = editingKnowledge[botId];
    if (editingShopify[botId] !== undefined) bodyData.shopifyUrl = editingShopify[botId];
    if (editingWorkingHours[botId] !== undefined) bodyData.workingHours = editingWorkingHours[botId];
    if (editingLanguage[botId] !== undefined) bodyData.language = editingLanguage[botId];
    if (Object.keys(bodyData).length === 0) return;
    await authFetch(`${API_URL}/api/bots/${botId}/prompt`, { method: 'PUT', body: JSON.stringify(bodyData) });
    const btn = document.getElementById(`save-btn-${botId}`);
    if (btn) {
      btn.innerText = "¡Guardado!";
      btn.style.background = "#10b981";
      setTimeout(() => {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg> Actualizar Cerebro`;
        btn.style.background = "";
      }, 2000);
    }
  };

  const handleDeleteBot = async (id) => {
    await authFetch(`${API_URL}/api/bots/${id}`, { method: 'DELETE' });
    setBots(prev => prev.filter(b => b.id !== id));
    setConfirmDeleteId(null);
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    await authFetch(`${API_URL}/api/bots`, { method: 'POST', body: JSON.stringify(newClient) });
    setShowAddModal(false);
    setNewClient({ name: '', email: '', password: '', shopifyUrl: '' });
  };

  const handleAddManager = async (e) => {
    e.preventDefault();
    setManagerError('');
    const res = await authFetch(`${API_URL}/api/managers`, { method: 'POST', body: JSON.stringify(newManager) });
    const data = await res.json();
    if (!res.ok) { setManagerError(data.error || 'Error al crear administrador.'); return; }
    setShowAddManagerModal(false);
    setNewManager({ name: '', email: '', password: '' });
  };

  const handleSendMFA = async (botId) => {
    let localPhone = adminPhoneToVerify[botId];
    if (!localPhone) return alert('Por favor ingresa un número de teléfono válido.');
    localPhone = localPhone.replace(/\D/g, '');
    const code = adminPhoneCountryCode[botId] || '549';
    const phone = code + localPhone;
    const res = await authFetch(`${API_URL}/api/bots/${botId}/mfa/send`, { method: 'POST', body: JSON.stringify({ phone }) });
    const data = await res.json();
    if (res.ok) setIsVerifyingMFA(prev => ({...prev, [botId]: true}));
    else alert(data.error || 'Error al enviar código. Recuerda que el Bot debe estar encendido (ON).');
  };

  const handleVerifyMFA = async (botId) => {
    const code = verificationCode[botId];
    if (!code) return;
    const res = await authFetch(`${API_URL}/api/bots/${botId}/mfa/verify`, { method: 'POST', body: JSON.stringify({ code }) });
    const data = await res.json();
    if (res.ok) {
      setIsVerifyingMFA(prev => ({...prev, [botId]: false}));
      setAdminPhoneToVerify(prev => ({...prev, [botId]: ''}));
      setVerificationCode(prev => ({...prev, [botId]: ''}));
      alert('¡Número de Dueño vinculado permanentemente con éxito!');
    } else {
      alert(data.error || 'Código incorrecto. Vuelve a intentarlo.');
    }
  };

  const expandedValue = expandedField
    ? (expandedField.field === 'prompt' ? (editingPrompt[expandedField.botId] ?? '') : (editingKnowledge[expandedField.botId] ?? ''))
    : '';
  const expandedSetter = expandedField
    ? (expandedField.field === 'prompt'
        ? v => setEditingPrompt(p => ({ ...p, [expandedField.botId]: v }))
        : v => setEditingKnowledge(k => ({ ...k, [expandedField.botId]: v })))
    : null;
  const expandedTitle = expandedField?.field === 'prompt' ? '🧠 Comportamiento Psicológico' : '🔗 Base de Conocimientos';

  const handleConnectMetaPage = async (pageId) => {
    if (!metaPageSelect) return;
    setMetaConnecting(true);
    try {
      const res = await authFetch(`${API_URL}/api/oauth/meta/connect-page`, { method: 'POST', body: JSON.stringify({ token: metaPageSelect.token, pageId }) });
      const data = await res.json();
      if (data.ok) { setMetaPageSelect(null); fetchBots(); alert(`✅ Página "${data.pageName}" conectada correctamente.`); }
      else alert(data.error || 'Error al conectar la página.');
    } catch { alert('Error de conexión.'); }
    setMetaConnecting(false);
  };

  const handleConnectWhatsAppNumber = async (phoneNumberId) => {
    if (!whatsappNumberSelect) return;
    setWhatsappConnecting(true);
    try {
      const res = await authFetch(`${API_URL}/api/oauth/whatsapp/connect-number`, {
        method: 'POST',
        body: JSON.stringify({ token: whatsappNumberSelect.token, phoneNumberId }),
      });
      const data = await res.json();
      if (data.ok) {
        setWhatsappNumberSelect(null);
        fetchBots();
        alert(`WhatsApp "${data.phone}" conectado correctamente.`);
      } else {
        alert(data.error || 'Error al conectar WhatsApp.');
      }
    } catch {
      alert('Error de conexión.');
    }
    setWhatsappConnecting(false);
  };

  return (
    <div className="app-shell">

      {/* ── Modal selector de páginas de Facebook ── */}
      {metaPageSelect && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', maxWidth: '420px', width: '90%' }}>
            <h3 style={{ margin: '0 0 0.4rem', color: 'var(--text-1)' }}>Seleccioná la página de Facebook</h3>
            <p style={{ margin: '0 0 0.6rem', fontSize: '0.85rem', color: 'var(--text-2)' }}>Elegí la página que quieras conectar al bot.</p>
            {metaPageSelect.pages.some(p => p.hasIg) && (
              <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', background: 'rgba(131,58,180,0.12)', border: '1px solid rgba(131,58,180,0.3)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#c084fc' }}>
                📷 Para recibir DMs de Instagram, elegí la página que tiene el badge <strong>+ Instagram</strong>
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {metaPageSelect.pages.map(p => (
                <button key={p.id} onClick={() => handleConnectMetaPage(p.id)} disabled={metaConnecting}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: p.hasIg ? 'rgba(131,58,180,0.08)' : 'rgba(24,119,242,0.08)', border: `1px solid ${p.hasIg ? 'rgba(131,58,180,0.4)' : 'rgba(24,119,242,0.3)'}`, borderRadius: '10px', color: 'var(--text-1)', cursor: 'pointer', padding: '0.85rem 1rem', fontSize: '0.95rem', fontWeight: 500 }}>
                  <span><span style={{ fontWeight: 900, color: '#1877f2', marginRight: '0.5rem' }}>f</span>{p.name}</span>
                  {p.hasIg
                    ? <span style={{ fontSize: '0.75rem', background: 'rgba(131,58,180,0.25)', color: '#c084fc', padding: '3px 9px', borderRadius: '6px', fontWeight: 600 }}>📷 Instagram</span>
                    : <span style={{ fontSize: '0.72rem', color: 'var(--text-2)' }}>Sin Instagram</span>
                  }
                </button>
              ))}
            </div>
            <button onClick={() => setMetaPageSelect(null)} style={{ marginTop: '1rem', width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-2)', cursor: 'pointer', padding: '0.5rem' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Modal expandido ── */}
      {whatsappNumberSelect && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', maxWidth: '460px', width: '90%' }}>
            <h3 style={{ margin: '0 0 0.4rem', color: 'var(--text-1)' }}>Seleccioná el número de WhatsApp</h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-2)' }}>Elegí el número oficial que va a atender este bot.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {whatsappNumberSelect.numbers.map(n => (
                <button key={n.phoneNumberId} onClick={() => handleConnectWhatsAppNumber(n.phoneNumberId)} disabled={whatsappConnecting}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '10px', color: 'var(--text-1)', cursor: 'pointer', padding: '0.85rem 1rem', fontSize: '0.95rem', fontWeight: 600 }}>
                  <span>{n.displayPhoneNumber || n.verifiedName || n.phoneNumberId}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-2)', fontWeight: 400 }}>
                    {n.verifiedName || 'WhatsApp Business'} · {n.wabaName || n.wabaId}
                  </span>
                </button>
              ))}
            </div>
            <button onClick={() => setWhatsappNumberSelect(null)} style={{ marginTop: '1rem', width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-2)', cursor: 'pointer', padding: '0.5rem' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {expandedField && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-1)' }}>{expandedTitle}</span>
            <button onClick={() => setExpandedField(null)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-1)', cursor: 'pointer', padding: '0.4rem 0.9rem', fontSize: '0.9rem' }}>
              Cerrar ✕
            </button>
          </div>
          <textarea className="prompt-textarea editable" style={{ flex: 1, resize: 'none', fontSize: '0.9rem', lineHeight: 1.6 }} value={expandedValue} onChange={e => expandedSetter(e.target.value)} />
        </div>
      )}

      {/* ── Modal Agregar Manager ── */}
      {showAddManagerModal && (
        <div className="modal-overlay">
          <div className="login-box" style={{margin:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
              <h3 style={{margin:0}}>Registrar Administrador</h3>
              <button style={{background:'none', border:'none', color:'var(--text-1)', cursor:'pointer'}} onClick={() => { setShowAddManagerModal(false); setManagerError(''); }}><X size={24}/></button>
            </div>
            <p style={{margin:'0 0 1rem', fontSize:'0.82rem', color:'var(--text-2)', background:'var(--gradient-soft)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:'8px', padding:'0.6rem 0.85rem'}}>
              Este administrador podrá cargar y configurar bots de sus propios clientes. No tendrá acceso a costos de tokens ni a clientes de otros administradores.
            </p>
            {managerError && <div className="login-error">{managerError}</div>}
            <form onSubmit={handleAddManager} className="login-form">
              <input className="modal-input" placeholder="Nombre completo" required value={newManager.name} onChange={e => setNewManager({...newManager, name: e.target.value})} />
              <input className="modal-input" type="email" placeholder="Correo electrónico" required value={newManager.email} onChange={e => setNewManager({...newManager, email: e.target.value})} />
              <input className="modal-input" type="password" placeholder="Contraseña (mín. 8 caracteres)" required value={newManager.password} onChange={e => setNewManager({...newManager, password: e.target.value})} />
              <button type="submit" className="btn-solid-blue">Crear Administrador</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Agregar Cliente ── */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="login-box" style={{margin:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
              <h3 style={{margin:0}}>Registrar Nuevo Negocio</h3>
              <button style={{background:'none', border:'none', color:'var(--text-1)', cursor:'pointer'}} onClick={() => setShowAddModal(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleAddClient} className="login-form">
              <input className="modal-input" placeholder="Nombre de la Tienda" required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
              <input className="modal-input" placeholder="Shopify URL (opcional)" value={newClient.shopifyUrl} onChange={e => setNewClient({...newClient, shopifyUrl: e.target.value})} />
              <hr style={{borderColor:'var(--border)', margin:'0.5rem 0'}}/>
              <p style={{fontSize:'0.85rem', color:'var(--text-2)', margin:0}}>Credenciales del Portal de Cliente:</p>
              <input className="modal-input" type="email" placeholder="Correo del local" required value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
              <input className="modal-input" type="password" placeholder="Contraseña segura" required value={newClient.password} onChange={e => setNewClient({...newClient, password: e.target.value})} />
              <button type="submit" className="btn-solid-blue">Fundar Espacio de Trabajo</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminar ── */}
      {confirmDeleteId && (
        <div className="modal-overlay">
          <div className="login-box" style={{ margin: 'auto', maxWidth: '380px', textAlign: 'center' }}>
            <Trash2 size={40} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem' }}>¿Eliminar este bot?</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>Se borrarán el bot, el usuario y todos los datos asociados. Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDeleteId(null)} style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-1)', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => handleDeleteBot(confirmDeleteId)} style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--danger)', color: 'white', cursor: 'pointer', fontWeight: '700' }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar overlay (mobile) ── */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><img src="/atento-logo.png" alt="Atento AI" /></div>
          <span>Atento AI</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-section">Principal</div>
          <div className={`sidebar-nav-item ${currentView === 'bots' ? 'active' : ''}`} onClick={() => { setCurrentView('bots'); setSidebarOpen(false); }}>
            <Bot size={16} />
            <span>Bot Manager</span>
          </div>
          <div className={`sidebar-nav-item ${currentView === 'conversations' ? 'active' : ''}`} onClick={() => { setCurrentView('conversations'); setSidebarOpen(false); }}>
            <MessageCircle size={16} />
            <span>Conversaciones</span>
          </div>
          <div className={`sidebar-nav-item ${currentView === 'analytics' ? 'active' : ''}`} onClick={() => { setCurrentView('analytics'); setSidebarOpen(false); }}>
            <BarChart2 size={16} />
            <span>Analíticas</span>
          </div>
          <div className={`sidebar-nav-item ${currentView === 'campaigns' ? 'active' : ''}`} onClick={() => { setCurrentView('campaigns'); setSidebarOpen(false); }}>
            <Megaphone size={16} />
            <span>Campañas</span>
          </div>
          <div className={`sidebar-nav-item ${currentView === 'subscription' ? 'active' : ''}`} onClick={() => { setCurrentView('subscription'); setSidebarOpen(false); }}>
            <TrendingUp size={16} />
            <span>Suscripción</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{(user.name || user.email || 'A').charAt(0).toUpperCase()}</div>
            <div style={{minWidth: 0}}>
              <div className="sidebar-user-name">{user.name || user.email}</div>
              <div className="sidebar-user-role">{user.role === 'admin' ? 'Super Admin' : user.role === 'manager' ? 'Administrador' : 'Usuario'}</div>
            </div>
          </div>
          <a href="/olvide-contrasena" style={{ fontSize:'0.75rem', color:'var(--text-3)', textDecoration:'none', padding:'0.1rem 0.1rem', display:'flex', alignItems:'center', gap:'0.35rem' }}>🔑 Olvidé mi contraseña</a>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{ display:'flex', alignItems:'center', gap:'0.6rem', width:'100%', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'8px', padding:'0.55rem 0.85rem', cursor:'pointer', color:'var(--text-2)', fontSize:'0.82rem', fontWeight:500, transition:'all 0.15s' }}
          >
            {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#818cf8" />}
            <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <button
            onClick={() => { localStorage.removeItem('atento_user'); localStorage.removeItem('atento_token'); setUser(null); }}
            style={{ display:'flex', alignItems:'center', gap:'0.6rem', width:'100%', background:'transparent', border:'1px solid var(--danger-border)', borderRadius:'8px', padding:'0.55rem 0.85rem', cursor:'pointer', color:'var(--danger)', fontSize:'0.82rem', fontWeight:500, transition:'all 0.15s' }}
          >
            <LogOut size={15} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════ MAIN CONTENT ══════════════════ */}
      <div className="main-content">

        {/* ── Header ── */}
        <header className="main-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Menú">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="4.5" x2="16" y2="4.5"/>
              <line x1="2" y1="9" x2="16" y2="9"/>
              <line x1="2" y1="13.5" x2="16" y2="13.5"/>
            </svg>
          </button>
          <div>
            <div className="page-title">
              {currentView === 'bots' && <>Bot Manager <span className="badge">PRO</span></>}
              {currentView === 'conversations' && 'Conversaciones'}
              {currentView === 'analytics' && 'Analíticas'}
              {currentView === 'campaigns' && 'Campañas'}
              {currentView === 'subscription' && 'Plan y Facturación'}
            </div>
            <div className="page-subtitle">
              {currentView === 'bots' && (user.role === 'admin' ? 'Vista Global Súper Administrador' : 'Panel de Auto-Gestión Inteligente')}
              {currentView === 'conversations' && 'Historial de mensajes por cliente y bot'}
              {currentView === 'analytics' && 'Métricas de actividad en tiempo real'}
              {currentView === 'campaigns' && 'Gestión de campañas de mensajería saliente'}
              {currentView === 'subscription' && 'Gestioná tu suscripción y métodos de pago local'}
            </div>
          </div>
          <div className="header-actions">
            <div className="notif-bell" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={17} color={notifications.length > 0 ? 'var(--danger)' : 'currentColor'} />
              {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
            </div>
            {(user.role === 'admin' || user.role === 'manager') && currentView === 'bots' && (
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={15} /> Alta Cliente
              </button>
            )}
            {user.role === 'admin' && currentView === 'bots' && (
              <button className="btn-primary" onClick={() => setShowAddManagerModal(true)}
                style={{background:'var(--surface-2)', border:'1px solid rgba(124,58,237,0.4)', color:'#818cf8'}}>
                <Plus size={15} /> Alta Admin
              </button>
            )}
          </div>
        </header>

        {/* ── Alert Center Dropdown ── */}
        {showNotifications && (
          <div style={{ position:'fixed', top:'72px', right:'24px', zIndex:9999, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', width: '310px', maxHeight: '380px', overflowY: 'auto', boxShadow: 'var(--shadow-md)', animation: 'fadein 0.2s' }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.65rem', marginBottom: '0.65rem'}}>
              <h3 style={{margin: 0, fontSize: '0.9rem', fontWeight: 600}}>Centro de Alertas</h3>
              {notifications.length > 0 && <button style={{background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:'0.78rem'}} onClick={() => setNotifications([])}>Limpiar</button>}
            </div>
            {notifications.length === 0 ? (
              <p style={{textAlign: 'center', color: 'var(--text-3)', fontSize: '0.85rem', margin: '1.25rem 0'}}>No hay alertas pendientes.</p>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} style={{ borderLeft: '3px solid var(--danger)', background: 'var(--danger-dim)', padding: '0.6rem 0.75rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <h4 style={{ margin: '0 0 4px', color: 'var(--danger)', fontSize: '0.8rem' }}>{notif.botName}</h4>
                    <button style={{background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', padding: 0}} onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}><X size={13}/></button>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-2)', lineHeight:'1.4' }}>{notif.message}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Views ── */}
        {currentView === 'conversations' && <ConversationsPanel bots={bots} />}
        {currentView === 'analytics' && <AnalyticsPanel user={user} />}
        {currentView === 'campaigns' && <AdminCampaignsPanel bots={bots} />}
        {currentView === 'subscription' && <SubscriptionPanel user={user} bots={bots} />}

        {currentView === 'bots' && <>
        {/* ── KPI Cards ── */}
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-icon" style={{background: 'var(--gradient-soft)'}}>
              <Smartphone size={19} color="#818cf8" />
            </div>
            <div>
              <div className="kpi-value">{activeBots}<span className="kpi-total">/{displayBots.length}</span></div>
              <div className="kpi-label">Bots Activos</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{background: 'var(--success-dim)'}}>
              <MessageCircle size={19} color="var(--success)" />
            </div>
            <div>
              <div className="kpi-value">{totalMsgs.toLocaleString()}</div>
              <div className="kpi-label">Mensajes Enviados</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{background: 'var(--warning-dim)'}}>
              <Users size={19} color="var(--warning)" />
            </div>
            <div>
              <div className="kpi-value">{totalClients.toLocaleString()}</div>
              <div className="kpi-label">Clientes Atendidos</div>
            </div>
          </div>
          {user.role !== 'manager' && (
          <div className="kpi-card">
            <div className="kpi-icon" style={{background: 'rgba(59,130,246,0.12)'}}>
              <TrendingUp size={19} color="#3b82f6" />
            </div>
            <div>
              <div className="kpi-value" style={{fontSize: '1.1rem'}}>USD ${totalCost.toFixed(3)}</div>
              <div className="kpi-label">Costo IA Total</div>
            </div>
          </div>
          )}
        </div>

        {/* ── Search / Filter ── */}
        {(user.role === 'admin' || user.role === 'manager') && (
          <div style={{ display:'flex', gap:'0.75rem', padding:'0.75rem 2rem 0.5rem', flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
              <Search size={15} style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-3)', pointerEvents:'none' }} />
              <input
                value={botSearch} onChange={e => setBotSearch(e.target.value)}
                placeholder="Buscar por nombre o número de teléfono..."
                style={{ width:'100%', padding:'0.6rem 1rem 0.6rem 2.25rem', background:'var(--surface)', border:'1px solid var(--border-strong)', borderRadius:'8px', color:'var(--text-1)', fontSize:'0.875rem', fontFamily:'Inter, sans-serif' }}
              />
            </div>
            {user.role === 'admin' && (
              <select value={filterManagerId} onChange={e => setFilterManagerId(e.target.value)}
                style={{ padding:'0.6rem 1rem', background:'var(--surface)', border:'1px solid var(--border-strong)', borderRadius:'8px', color:'var(--text-1)', fontSize:'0.875rem', fontFamily:'Inter, sans-serif', cursor:'pointer', minWidth:'180px' }}>
                <option value="">Todos los administradores</option>
                <option value="none">{user.name || user.email} (mis clientes)</option>
                {managerList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
            {(botSearch || filterManagerId) && (
              <button onClick={() => { setBotSearch(''); setFilterManagerId(''); }}
                style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-3)', cursor:'pointer', padding:'0.6rem 0.85rem', fontSize:'0.8rem', whiteSpace:'nowrap' }}>
                Limpiar
              </button>
            )}
            <span style={{ fontSize:'0.78rem', color:'var(--text-3)', whiteSpace:'nowrap' }}>{displayBots.length} bot{displayBots.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* ── Bot List ── */}
        <main className="bots-list">
          {displayBots.length === 0 && <p style={{textAlign:'center', color:'var(--text-3)', padding: '2rem 0'}}>Aún no tenés ningún negocio conectado a la nube.</p>}
          {displayBots.map(bot => (
            <div key={bot.id} className="bot-card-horizontal">

              <div className="bot-card-main">
                <div className="bot-info-section">
                  <div className="bot-title-row">
                    <Smartphone size={22} className="icon-blue" />
                    <h2>{bot.name}</h2>
                    <div className={`status-badge ${bot.status.toLowerCase()}`}>{bot.status}</div>
                    {user.role === 'admin' && (
                      <span style={{ fontSize:'0.7rem', padding:'2px 8px', borderRadius:'6px', fontWeight:600, background:'var(--gradient-soft)', color:'#818cf8', border:'1px solid rgba(124,58,237,0.25)', whiteSpace:'nowrap' }}>
                        👤 {bot.manager_name || user.name || user.email}
                      </span>
                    )}
                  </div>
                  <p className="shop-url">{bot.shopifyUrl}</p>
                  {bot.metrics && (() => {
                    const inp = bot.metrics.tokensInput || 0;
                    const out = bot.metrics.tokensOutput || 0;
                    const costUSD = ((inp * 0.075 + out * 0.30) / 1_000_000).toFixed(4);
                    const totalTokens = inp + out;
                    return (
                      <div className="metrics-row">
                        <div className="metric-chip" title="Mensajes de IA Generados"><MessageCircle size={13} className="icon-subtle" /> <span>{(bot.metrics.messagesSent || 0).toLocaleString()} msjs</span></div>
                        <div className="metric-chip" title="Clientes Atendidos"><Users size={13} className="icon-subtle" /> <span>{(bot.metrics.customersHelped || 0).toLocaleString()} chats</span></div>
                        <div className="metric-chip" title="Conversiones estimadas"><TrendingUp size={13} className="icon-success" /> <span>{(bot.metrics.weeklySales || 0).toLocaleString()} conv.</span></div>
                        <div className="metric-chip" title="Tokens Gemini" style={{background:'rgba(245,158,11,0.08)', borderColor:'rgba(245,158,11,0.25)'}}>
                          <BrainCircuit size={13} color="#f59e0b" /> <span style={{color:'#f59e0b'}}>{totalTokens.toLocaleString()} tokens</span>
                        </div>
                        {user.role !== 'manager' && (
                        <div className="metric-chip" title="Costo estimado Gemini" style={{background:'rgba(16,185,129,0.08)', borderColor:'rgba(16,185,129,0.25)'}}>
                          <TrendingUp size={13} color="#10b981" /> <span style={{color:'#10b981'}}>USD ${costUSD}</span>
                        </div>
                        )}
                        {bot.metrics.adminNumber && (
                          <div className="metric-chip" title="Teléfono de Administrador" style={{background:'rgba(124,58,237,0.08)', borderColor:'rgba(124,58,237,0.25)'}}>
                            <Lock size={13} color="#a78bfa" /> <span style={{color:'#a78bfa', fontWeight:'600'}}>Dueño: +{bot.metrics.adminNumber.split('@')[0]}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="bot-actions-section">
                  {user.role === 'admin' && (
                    <button title="Eliminar bot" onClick={() => setConfirmDeleteId(bot.id)}
                      style={{ background: 'none', border: '1px solid var(--danger-border)', borderRadius: '8px', padding: '0.45rem', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button className={`btn-settings ${openSettingsId === bot.id ? 'active' : ''}`} title="Configuración del Bot"
                    onClick={() => {
                      if (openSettingsId !== bot.id) fetchDebtors(bot.id);
                      setOpenSettingsId(openSettingsId === bot.id ? null : bot.id);
                      if (editingPrompt[bot.id] === undefined) setEditingPrompt({...editingPrompt, [bot.id]: bot.prompt || ''});
                      if (editingKnowledge[bot.id] === undefined) setEditingKnowledge({...editingKnowledge, [bot.id]: bot.knowledgeBase || ''});
                      if (editingShopify[bot.id] === undefined) setEditingShopify({...editingShopify, [bot.id]: bot.shopifyUrl || ''});
                      if (editingWorkingHours[bot.id] === undefined) setEditingWorkingHours({...editingWorkingHours, [bot.id]: bot.metrics?.workingHours || { active: false, start: '09:00', end: '18:00', autoReplyMsg: '' }});
                    }}>
                    <Settings size={17} />
                  </button>
                  <div className="ios-toggle-wrapper">
                    <span className="toggle-label">{bot.status === 'OFF' ? 'OFF' : 'ON'}</span>
                    <label className="ios-toggle">
                      <input type="checkbox" checked={bot.status !== 'OFF'}
                        onChange={() => bot.status === 'OFF' ? handleStart(bot.id) : handleStop(bot.id)}
                        disabled={bot.status === 'STARTING' || bot.status === 'QR_READY'} />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ── Settings Panel ── */}
              {openSettingsId === bot.id && (
                <div className="bot-card-expanded prompt-editor-container">
                  <div className="prompt-header">
                    <BrainCircuit size={18} className="icon-purple" />
                    <h3 style={{ flex: 1 }}>Comportamiento Psicológico de la IA</h3>
                    <button onClick={() => { if (editingPrompt[bot.id] === undefined) setEditingPrompt(p => ({...p, [bot.id]: bot.prompt || ''})); setExpandedField({ botId: bot.id, field: 'prompt' }); }} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-2)', cursor: 'pointer', padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}>⛶ Expandir</button>
                  </div>
                  <textarea className="prompt-textarea editable"
                    value={editingPrompt[bot.id] !== undefined ? editingPrompt[bot.id] : bot.prompt}
                    onChange={(e) => setEditingPrompt({...editingPrompt, [bot.id]: e.target.value})}
                    placeholder="Instrucciones para tu vendedor IA..." />

                  <div className="prompt-header" style={{marginTop:'1.5rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                    <Settings size={18} className="icon-blue" />
                    <h3>Conexión Catálogo (Tienda Online)</h3>
                  </div>
                  <input className="modal-input" style={{marginBottom: '1rem', background: 'var(--surface)'}}
                    value={editingShopify[bot.id] !== undefined ? editingShopify[bot.id] : bot.shopifyUrl}
                    onChange={(e) => setEditingShopify({...editingShopify, [bot.id]: e.target.value})}
                    placeholder="Ej: mitienda.com" />

                  <div className="prompt-header" style={{marginTop:'1.5rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                    <BrainCircuit size={18} color="var(--success)" style={{ flex: 1 }} />
                    <h3 style={{ flex: 1 }}>Base de Conocimientos</h3>
                    <button onClick={() => { if (editingKnowledge[bot.id] === undefined) setEditingKnowledge(k => ({...k, [bot.id]: bot.knowledgeBase || ''})); setExpandedField({ botId: bot.id, field: 'kb' }); }} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-2)', cursor: 'pointer', padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}>⛶ Expandir</button>
                  </div>
                  <p style={{fontSize:'0.82rem', color:'var(--text-2)', margin:'0 0 0.5rem 0'}}>Pegá precios, links o detalles de servicios. La IA lo memorizará.</p>
                  <textarea className="prompt-textarea editable" style={{minHeight: '120px', borderColor: 'rgba(16,185,129,0.3)'}}
                    value={editingKnowledge[bot.id] !== undefined ? editingKnowledge[bot.id] : (bot.knowledgeBase || '')}
                    onChange={(e) => setEditingKnowledge({...editingKnowledge, [bot.id]: e.target.value})}
                    placeholder={`[ENVIO]\nEnvíos en 24-48hs. Costo fijo $2.000.\n\n[PAGOS]\nEfectivo, transferencia o tarjeta.\n\n[UBICACION]\nAv. Corrientes 1234, CABA.`} />

                  <div className="prompt-header" style={{marginTop:'1.5rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                    <Clock size={18} className="icon-blue" />
                    <h3>Horario de Atención (Anti-Nocturno)</h3>
                  </div>
                  <div style={{display:'flex', gap:'10px', alignItems:'center', marginBottom:'10px'}}>
                    <label className="ios-toggle">
                      <input type="checkbox" checked={editingWorkingHours[bot.id]?.active || false}
                        onChange={e => setEditingWorkingHours({...editingWorkingHours, [bot.id]: {...(editingWorkingHours[bot.id] || {}), active: e.target.checked}})} />
                      <span className="slider"></span>
                    </label>
                    <span style={{fontSize: '0.875rem'}}>Activar Límite de Horario</span>
                  </div>

                  {editingWorkingHours[bot.id]?.active && (
                    <div style={{background: 'var(--surface-3)', padding:'1rem', borderRadius:'8px', border:'1px solid var(--border)', marginBottom:'1rem'}}>
                      <div style={{display:'flex', gap:'1rem', marginBottom:'1rem'}}>
                        <div>
                          <label style={{display:'block', fontSize:'0.82rem', color:'var(--text-2)', marginBottom:'0.2rem'}}>Abre</label>
                          <input className="modal-input" type="time" value={editingWorkingHours[bot.id]?.start || '09:00'} onChange={e => setEditingWorkingHours({...editingWorkingHours, [bot.id]: {...editingWorkingHours[bot.id], start: e.target.value}})} style={{padding:'0.5rem', width: 'auto'}} />
                        </div>
                        <div>
                          <label style={{display:'block', fontSize:'0.82rem', color:'var(--text-2)', marginBottom:'0.2rem'}}>Cierra</label>
                          <input className="modal-input" type="time" value={editingWorkingHours[bot.id]?.end || '18:00'} onChange={e => setEditingWorkingHours({...editingWorkingHours, [bot.id]: {...editingWorkingHours[bot.id], end: e.target.value}})} style={{padding:'0.5rem', width: 'auto'}} />
                        </div>
                      </div>
                      <label style={{display:'block', fontSize:'0.82rem', color:'var(--text-2)', marginBottom:'0.2rem'}}>Mensaje Automático fuera de horario</label>
                      <textarea className="prompt-textarea editable" style={{minHeight:'60px'}}
                        placeholder="Ej: Hola! Nuestro local está cerrado ahora, pero mañana te asisto."
                        value={editingWorkingHours[bot.id]?.autoReplyMsg || ''}
                        onChange={e => setEditingWorkingHours({...editingWorkingHours, [bot.id]: {...editingWorkingHours[bot.id], autoReplyMsg: e.target.value}})} />
                    </div>
                  )}

                  <div className="prompt-header" style={{marginTop:'1.5rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                    <Lock size={18} color="#a78bfa" />
                    <h3 style={{color: '#a78bfa'}}>Seguridad: Celular de Administrador</h3>
                  </div>

                  {bot.metrics?.adminNumber ? (
                    <div style={{background:'rgba(16,185,129,0.08)', padding:'10px 15px', borderRadius:'8px', border:'1px solid var(--success-border)', marginBottom:'15px', display:'flex', alignItems:'center', gap:'10px'}}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      <div>
                        <p style={{margin:0, color:'var(--success)', fontWeight:'600', fontSize:'0.85rem'}}>Número Validado</p>
                        <p style={{margin:0, fontSize:'0.82rem', color:'var(--success)', opacity:0.85}}>+{bot.metrics.adminNumber.split('@')[0]}</p>
                      </div>
                    </div>
                  ) : (
                    <p style={{fontSize:'0.82rem', color:'var(--text-2)', margin:'0 0 0.5rem 0'}}>Vincula el número del dueño para autorizar acciones seguras.</p>
                  )}

                  <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                    <select className="modal-input"
                      style={{width:'90px', padding:'0.5rem', background:'var(--surface-2)', color:'var(--text-1)', border:'1px solid var(--border-strong)'}}
                      value={adminPhoneCountryCode[bot.id] || '549'}
                      onChange={e => setAdminPhoneCountryCode({...adminPhoneCountryCode, [bot.id]: e.target.value})}>
                      <option value="549">🇦🇷 +54</option>
                      <option value="52">🇲🇽 +52</option>
                      <option value="56">🇨🇱 +56</option>
                      <option value="57">🇨🇴 +57</option>
                      <option value="51">🇵🇪 +51</option>
                      <option value="34">🇪🇸 +34</option>
                      <option value="1">🇺🇸 +1</option>
                    </select>
                    <input className="modal-input" placeholder="Ej: 1156687137" style={{flex:1}} value={adminPhoneToVerify[bot.id] || ''} onChange={e => setAdminPhoneToVerify({...adminPhoneToVerify, [bot.id]: e.target.value})} />
                    <button className="btn-solid-blue" style={{background:'#7c3aed', width:'auto', padding:'0.6rem 1rem', marginTop:0}} onClick={() => handleSendMFA(bot.id)}>Validar Nro</button>
                  </div>
                  {isVerifyingMFA[bot.id] && (
                    <div style={{display:'flex', gap:'10px', background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.2)', padding:'10px', borderRadius:'8px', marginTop:'5px'}}>
                      <input className="modal-input" placeholder="Pin de 6 cifras" style={{background:'var(--surface)'}} value={verificationCode[bot.id] || ''} onChange={e => setVerificationCode({...verificationCode, [bot.id]: e.target.value})} />
                      <button className="btn-solid-blue" style={{background:'var(--success)', width:'auto', padding:'0.6rem 1rem', marginTop:0}} onClick={() => handleVerifyMFA(bot.id)}>Confirmar</button>
                    </div>
                  )}

                  {/* Idioma del bot */}
                  <div className="prompt-header" style={{marginTop:'1.5rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                    <span style={{fontSize:'1rem'}}>🌐</span>
                    <h3 style={{flex:1}}>Idioma del Bot</h3>
                    <span style={{fontSize:'0.72rem', color:'var(--text-2)'}}>La IA responderá siempre en este idioma</span>
                  </div>
                  <select
                    className="modal-input"
                    value={editingLanguage[bot.id] !== undefined ? editingLanguage[bot.id] : (bot.language || 'es')}
                    onChange={e => setEditingLanguage(l => ({ ...l, [bot.id]: e.target.value }))}
                    style={{background:'var(--surface-2)', color:'var(--text-1)', border:'1px solid var(--border-strong)', fontSize:'0.9rem', marginBottom:'0.5rem'}}
                  >
                    <option value="es">🇦🇷 Español</option>
                    <option value="en">🇬🇧 English</option>
                    <option value="de">🇩🇪 Deutsch</option>
                    <option value="pt">🇧🇷 Português</option>
                    <option value="fr">🇫🇷 Français</option>
                    <option value="it">🇮🇹 Italiano</option>
                    <option value="ar">🇦🇪 العربية</option>
                  </select>

                  <div style={{display:'flex', justifyContent:'flex-end', width:'100%', marginTop:'1rem'}}>
                    <button id={`save-btn-${bot.id}`} className="btn-solid-blue" onClick={() => handleSavePrompt(bot.id)} style={{width:'auto', padding:'0.6rem 1.25rem', marginTop:0}}>
                      <Save size={15} /> Actualizar Cerebro
                    </button>
                  </div>

                  {/* ── Features / Upsells ── */}
                  <div style={{marginTop:'2rem', borderTop:'1px solid var(--border)', paddingTop:'1rem', width:'100%'}}>
                    {bot.metrics?.hasDebtorsFeature ? (
                      <>
                        <div className="prompt-header">
                          <Users size={18} color="var(--danger)" />
                          <h3 style={{color:'var(--danger)'}}>Gestión de Deudores</h3>
                        </div>
                        {user.role === 'admin' && (
                          <div style={{display:'flex', gap:'10px', alignItems:'center', marginBottom:'10px'}}>
                            <label className="ios-toggle">
                              <input type="checkbox" checked={bot.metrics?.hasDebtorsFeature || false}
                                onChange={async (e) => {
                                  const val = e.target.checked;
                                  setBots(prev => prev.map(b => b.id === bot.id ? { ...b, metrics: { ...b.metrics, hasDebtorsFeature: val } } : b));
                                  await authFetch(`${API_URL}/api/bots/${bot.id}/prompt`, { method: 'PUT', body: JSON.stringify({ hasDebtorsFeature: val }) });
                                }} />
                              <span className="slider"></span>
                            </label>
                            <span style={{color:'var(--text-2)', fontSize:'0.85rem'}}>Habilitar (Solo Admin)</span>
                          </div>
                        )}
                        <p style={{fontSize:'0.82rem', color:'var(--text-2)', margin:'0 0 0.5rem 0'}}>La IA cobrará a las 10:00 AM a clientes deudores de forma automática.</p>
                        <div style={{display:'flex', gap:'5px', marginBottom:'10px', flexWrap:'wrap'}}>
                          <input className="modal-input" placeholder="Nombre" style={{flex:1, minWidth:'100px'}} value={newDebtor[bot.id]?.name || ''} onChange={e => setNewDebtor({...newDebtor, [bot.id]: {...newDebtor[bot.id], name: e.target.value}})} />
                          <input className="modal-input" placeholder="WhatsApp (Ej: 549112233)" style={{flex:1, minWidth:'100px'}} value={newDebtor[bot.id]?.phone || ''} onChange={e => setNewDebtor({...newDebtor, [bot.id]: {...newDebtor[bot.id], phone: e.target.value}})} />
                          <input className="modal-input" placeholder="Monto ($)" type="number" style={{flex:1, minWidth:'100px'}} value={newDebtor[bot.id]?.amount || ''} onChange={e => setNewDebtor({...newDebtor, [bot.id]: {...newDebtor[bot.id], amount: e.target.value}})} />
                          <button className="btn-solid-blue" style={{background:'var(--danger)', width:'auto', padding:'0.6rem 1rem', marginTop:0}}
                            onClick={async () => {
                              const d = newDebtor[bot.id];
                              if (!d || !d.name || !d.phone || !d.amount) return alert('Completa todos los campos');
                              await authFetch(`${API_URL}/api/bots/${bot.id}/debtors`, { method: 'POST', body: JSON.stringify(d) });
                              setNewDebtor({...newDebtor, [bot.id]: {name:'',phone:'',amount:''}});
                              fetchDebtors(bot.id);
                            }}>Cargar</button>
                        </div>
                        {debtors[bot.id] && debtors[bot.id].length > 0 && (
                          <div style={{background:'var(--danger-dim)', borderRadius:'8px', border:'1px solid var(--danger-border)', padding:'10px', maxHeight:'150px', overflowY:'auto'}}>
                            {debtors[bot.id].map(d => (
                              <div key={d.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border)', padding:'5px 0'}}>
                                <div style={{fontSize:'0.82rem'}}>
                                  <strong style={{color: d.status === 'pending' ? 'var(--danger)' : 'var(--success)'}}>{d.name}</strong> — ${d.amount}
                                  <br/><span style={{color:'var(--text-3)', fontSize:'0.72rem'}}>+{d.phone} ({d.status})</span>
                                </div>
                                <div style={{display:'flex', gap:'5px'}}>
                                  {d.status === 'pending' && (
                                    <button style={{background:'var(--success)', color:'white', border:'none', borderRadius:'4px', padding:'3px 8px', cursor:'pointer', fontSize:'0.72rem'}}
                                      onClick={async () => { await authFetch(`${API_URL}/api/bots/${bot.id}/debtors/${d.id}`, { method: 'PUT', body: JSON.stringify({status:'paid'}) }); fetchDebtors(bot.id); }}>Pagó</button>
                                  )}
                                  <button style={{background:'transparent', color:'var(--text-2)', border:'1px solid var(--border)', borderRadius:'4px', padding:'3px 8px', cursor:'pointer', fontSize:'0.72rem'}}
                                    onClick={async () => { await authFetch(`${API_URL}/api/bots/${bot.id}/debtors/${d.id}`, { method: 'DELETE' }); fetchDebtors(bot.id); }}>Borrar</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{background:'var(--surface-3)', border:'1px dashed var(--border-strong)', padding:'1.25rem', borderRadius:'8px', textAlign:'center', opacity:'0.65'}}>
                        <Lock size={28} color="var(--text-3)" style={{margin:'0 auto 8px', display:'block'}}/>
                        <h4 style={{margin:'0 0 5px', color:'var(--text-2)', fontSize:'0.9rem'}}>Recordatorio de Pagos</h4>
                        <p style={{margin:0, fontSize:'0.82rem', color:'var(--text-3)'}}>La IA enviará alertas de cobro amigables a tus clientes deudores a las 10:00 AM.</p>
                        {user.role === 'admin' && (
                          <div style={{display:'inline-flex', gap:'10px', alignItems:'center', marginTop:'12px'}}>
                            <span style={{color:'var(--text-3)', fontSize:'0.78rem'}}>Desbloquear (Admin)</span>
                            <label className="ios-toggle">
                              <input type="checkbox" checked={false}
                                onChange={async (e) => {
                                  const val = e.target.checked;
                                  setBots(prev => prev.map(b => b.id === bot.id ? { ...b, metrics: { ...b.metrics, hasDebtorsFeature: val } } : b));
                                  await authFetch(`${API_URL}/api/bots/${bot.id}/prompt`, { method: 'PUT', body: JSON.stringify({ hasDebtorsFeature: val }) });
                                }} />
                              <span className="slider"></span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {false && (
                    /* WhatsApp Cloud API */
                    <div style={{marginTop:'2rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                      <div className="prompt-header">
                        <Smartphone size={18} color="#25d366" />
                        <h3 style={{color:'#25d366', flex:1}}>WhatsApp API oficial</h3>
                        {bot.whatsappPhoneNumberId && <span style={{fontSize:'0.72rem', background:'rgba(16,185,129,0.12)', color:'var(--success)', padding:'2px 8px', borderRadius:'6px', border:'1px solid var(--success-border)'}}>● Cloud conectado</span>}
                      </div>
                      <p style={{fontSize:'0.82rem', color:'var(--text-2)', margin:'0 0 0.75rem'}}>Conectá WhatsApp oficial desde Meta para responder sin QR. El token se guarda automáticamente en el servidor.</p>
                      <button onClick={async () => {
                        const w=620,h=740,l=Math.round(window.screenX+(window.outerWidth-w)/2),t=Math.round(window.screenY+(window.outerHeight-h)/2);
                        const popup = window.open('about:blank','atento_whatsapp_oauth',`width=${w},height=${h},left=${l},top=${t},scrollbars=yes`);
                        try {
                          const res = await authFetch(`${API_URL}/api/oauth/whatsapp/init`, { method: 'POST', body: JSON.stringify({ botId: bot.id, returnPath: '/oauth-callback' }) });
                          const data = await res.json();
                          if (data.url && popup && !popup.closed) { popup.location.href = data.url; }
                          else { popup?.close(); alert(data.error || 'Error'); }
                        } catch { popup?.close(); alert('Error de conexión'); }
                      }} className="btn-solid-blue" style={{margin:'0 0 0.75rem', width:'auto', padding:'0.65rem 1rem', background:'#25d366'}}>
                        {bot.whatsappPhoneNumberId ? 'Reconectar con Meta' : 'Conectar WhatsApp con Meta'}
                      </button>
                      <details style={{marginBottom:'0.75rem'}}>
                        <summary style={{cursor:'pointer', color:'var(--text-2)', fontSize:'0.78rem'}}>Configuración manual avanzada</summary>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'0.75rem', background:'rgba(37,211,102,0.04)', border:'1px solid rgba(37,211,102,0.18)', borderRadius:'12px', padding:'1rem'}}>
                        <input className="modal-input" inputMode="numeric" placeholder="Phone Number ID"
                          value={whatsappCloudForm[bot.id]?.phoneNumberId ?? (bot.whatsappPhoneNumberId || '')}
                          onChange={e => setWhatsappCloudForm(f => ({...f, [bot.id]: {...f[bot.id], phoneNumberId: e.target.value.replace(/\D/g, '')}}))}
                          style={{marginBottom:0, background:'var(--surface)'}} />
                        <input className="modal-input" inputMode="numeric" placeholder="WhatsApp Business Account ID"
                          value={whatsappCloudForm[bot.id]?.businessAccountId ?? (bot.whatsappBusinessAccountId || '')}
                          onChange={e => setWhatsappCloudForm(f => ({...f, [bot.id]: {...f[bot.id], businessAccountId: e.target.value.replace(/\D/g, '')}}))}
                          style={{marginBottom:0, background:'var(--surface)'}} />
                        <input className="modal-input" type="password" placeholder={bot.whatsappAccessToken ? 'Token guardado (pegá uno nuevo para cambiarlo)' : 'Access Token permanente'}
                          value={whatsappCloudForm[bot.id]?.accessToken ?? ''}
                          onChange={e => setWhatsappCloudForm(f => ({...f, [bot.id]: {...f[bot.id], accessToken: e.target.value}}))}
                          style={{marginBottom:0, background:'var(--surface)', gridColumn:'1 / -1'}} />
                        <div style={{display:'flex', gap:'0.6rem', alignItems:'center', flexWrap:'wrap', gridColumn:'1 / -1'}}>
                          <button disabled={whatsappCloudSaving[bot.id]}
                            onClick={() => handleSaveWhatsAppCloud(bot)}
                            className="btn-solid-blue" style={{margin:0, width:'auto', padding:'0.6rem 1rem', background:'#25d366'}}>
                            {whatsappCloudSaving[bot.id] ? 'Guardando...' : (bot.whatsappPhoneNumberId ? 'Actualizar API' : 'Conectar API')}
                          </button>
                          {bot.whatsappPhoneNumberId && (
                            <button disabled={whatsappCloudSaving[bot.id]}
                              onClick={() => { if (confirm('¿Desconectar WhatsApp API oficial? El bot volverá al modo QR.')) handleSaveWhatsAppCloud(bot, true); }}
                              style={{background:'transparent', border:'1px solid var(--danger-border)', borderRadius:'8px', color:'var(--danger)', cursor:'pointer', padding:'0.55rem 0.9rem', fontSize:'0.82rem'}}>
                              Desconectar API
                            </button>
                          )}
                          {whatsappCloudMsg[bot.id] && <span style={{fontSize:'0.85rem', color: whatsappCloudMsg[bot.id].ok ? 'var(--success)' : 'var(--danger)'}}>{whatsappCloudMsg[bot.id].text}</span>}
                        </div>
                      </div>
                      </details>
                    </div>

                    )}

                    {/* Instagram / Facebook */}
                    <div style={{marginTop:'2rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                      <div className="prompt-header">
                        <MessageCircle size={18} color="#e1306c" />
                        <h3 style={{color:'#e1306c'}}>Integración Instagram DMs</h3>
                      </div>
                      {user.role === 'admin' && (
                        <div style={{display:'flex', gap:'10px', alignItems:'center', marginBottom:'10px'}}>
                          <label className="ios-toggle">
                            <input type="checkbox" checked={bot.metrics?.hasSocialFeature || false}
                              onChange={async (e) => {
                                const val = e.target.checked;
                                setBots(prev => prev.map(b => b.id === bot.id ? { ...b, metrics: { ...b.metrics, hasSocialFeature: val } } : b));
                                await authFetch(`${API_URL}/api/bots/${bot.id}/prompt`, { method: 'PUT', body: JSON.stringify({ hasSocialFeature: val }) });
                              }} />
                            <span className="slider"></span>
                          </label>
                          <span style={{color:'var(--text-2)', fontSize:'0.85rem'}}>Habilitar (Solo Admin)</span>
                        </div>
                      )}
                      <p style={{fontSize:'0.82rem', color:'var(--text-2)', margin:'0 0 0.75rem'}}>Conectá Facebook/Instagram para que la IA responda mensajes automáticamente.</p>
                      {bot.metrics?.hasSocialFeature && (
                        <div style={{display:'flex', flexDirection:'column', gap:'0.6rem'}}>
                          {/* Facebook row */}
                          <div style={{display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap'}}>
                            {bot.metaPageId ? (
                              <div style={{display:'flex', alignItems:'center', gap:'0.6rem', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'10px', padding:'0.45rem 0.9rem', minWidth:'200px'}}>
                                <span style={{display:'flex', alignItems:'center', justifyContent:'center', width:'20px', height:'20px', borderRadius:'50%', background:'#10b981', flexShrink:0}}>
                                  <span style={{color:'#fff', fontSize:'0.7rem', fontWeight:900}}>✓</span>
                                </span>
                                <div style={{flex:1, minWidth:0}}>
                                  <div style={{fontSize:'0.7rem', color:'var(--text-2)', lineHeight:1.2}}>Facebook</div>
                                  <div style={{fontSize:'0.83rem', fontWeight:700, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{bot.metaPageName || bot.metaPageId}</div>
                                </div>
                                <button onClick={async () => {
                                  const w=580,h=680,l=Math.round(window.screenX+(window.outerWidth-w)/2),t=Math.round(window.screenY+(window.outerHeight-h)/2);
                                  const popup = window.open('about:blank','atento_oauth',`width=${w},height=${h},left=${l},top=${t},scrollbars=yes`);
                                  try {
                                    const res = await authFetch(`${API_URL}/api/oauth/meta/init`, { method: 'POST', body: JSON.stringify({ botId: bot.id, returnPath: '/oauth-callback' }) });
                                    const data = await res.json();
                                    if (data.url && popup && !popup.closed) { popup.location.href = data.url; }
                                    else { popup?.close(); alert(data.error || 'Error'); }
                                  } catch { popup?.close(); alert('Error de conexión'); }
                                }} style={{background:'transparent', border:'none', color:'var(--text-2)', cursor:'pointer', fontSize:'0.72rem', padding:'0', whiteSpace:'nowrap', textDecoration:'underline'}}>reconectar</button>
                                <button onClick={async () => {
                                  if (!confirm(`¿Desconectar "${bot.metaPageName || bot.metaPageId}"?`)) return;
                                  await authFetch(`${API_URL}/api/bots/${bot.id}/meta/disconnect`, { method: 'POST' });
                                  setBots(prev => prev.map(b => b.id === bot.id ? { ...b, metaPageId: null, metaPageName: null, metaIgId: null, metaIgUsername: null } : b));
                                }} style={{background:'transparent', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:'0.85rem', padding:'0', lineHeight:1}}>✕</button>
                              </div>
                            ) : (
                              <button onClick={async () => {
                                const w=580,h=680,l=Math.round(window.screenX+(window.outerWidth-w)/2),t=Math.round(window.screenY+(window.outerHeight-h)/2);
                                const popup = window.open('about:blank','atento_oauth',`width=${w},height=${h},left=${l},top=${t},scrollbars=yes`);
                                try {
                                  const res = await authFetch(`${API_URL}/api/oauth/meta/init`, { method: 'POST', body: JSON.stringify({ botId: bot.id, returnPath: '/oauth-callback' }) });
                                  const data = await res.json();
                                  if (data.url && popup && !popup.closed) { popup.location.href = data.url; }
                                  else { popup?.close(); alert(data.error || 'Error'); }
                                } catch { popup?.close(); alert('Error de conexión'); }
                              }} style={{display:'flex', alignItems:'center', gap:'0.5rem', background:'#1877f2', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', padding:'0.5rem 1rem', fontSize:'0.85rem', fontWeight:600}}>
                                <span style={{fontWeight:900}}>f</span> Conectar con Facebook
                              </button>
                            )}
                          </div>
                          {/* Instagram row */}
                          <div style={{display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap'}}>
                            {bot.metaIgId ? (
                              <div style={{display:'flex', alignItems:'center', gap:'0.6rem', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'10px', padding:'0.45rem 0.9rem', minWidth:'200px'}}>
                                <span style={{display:'flex', alignItems:'center', justifyContent:'center', width:'20px', height:'20px', borderRadius:'50%', background:'#10b981', flexShrink:0}}>
                                  <span style={{color:'#fff', fontSize:'0.7rem', fontWeight:900}}>✓</span>
                                </span>
                                <div style={{flex:1, minWidth:0}}>
                                  <div style={{fontSize:'0.7rem', color:'var(--text-2)', lineHeight:1.2}}>Instagram</div>
                                  <div style={{fontSize:'0.83rem', fontWeight:700, background:'linear-gradient(90deg,#833ab4,#fd1d1d,#fcb045)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                    {bot.metaIgUsername ? `@${bot.metaIgUsername}` : 'Cuenta vinculada'}
                                  </div>
                                </div>
                                <button onClick={async () => {
                                  const w=580,h=680,l=Math.round(window.screenX+(window.outerWidth-w)/2),t=Math.round(window.screenY+(window.outerHeight-h)/2);
                                  const popup = window.open('about:blank','atento_oauth',`width=${w},height=${h},left=${l},top=${t},scrollbars=yes`);
                                  try {
                                    const res = await authFetch(`${API_URL}/api/oauth/instagram/init`, { method: 'POST', body: JSON.stringify({ botId: bot.id, returnPath: '/oauth-callback' }) });
                                    const data = await res.json();
                                    if (data.url && popup && !popup.closed) { popup.location.href = data.url; }
                                    else { popup?.close(); alert(data.error || 'Error'); }
                                  } catch { popup?.close(); alert('Error de conexión'); }
                                }} style={{background:'transparent', border:'none', color:'var(--text-2)', cursor:'pointer', fontSize:'0.72rem', padding:'0', whiteSpace:'nowrap', textDecoration:'underline'}}>reconectar</button>
                              </div>
                            ) : bot.metaPageId ? (
                              <div style={{display:'flex', flexDirection:'column', gap:'0.35rem'}}>
                                {!igManualShow[bot.id] ? (
                                  <>
                                    <button onClick={async () => {
                                      try {
                                        const res = await authFetch(`${API_URL}/api/bots/${bot.id}/meta/link-instagram`, { method: 'POST' });
                                        const data = await res.json();
                                        if (data.ok) {
                                          setBots(prev => prev.map(b => b.id === bot.id ? { ...b, metaIgId: data.igId, metaIgUsername: data.igUsername } : b));
                                        } else {
                                          setIgManualShow(s => ({ ...s, [bot.id]: true }));
                                        }
                                      } catch { setIgManualShow(s => ({ ...s, [bot.id]: true })); }
                                    }} style={{display:'flex', alignItems:'center', gap:'0.5rem', background:'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', padding:'0.5rem 1rem', fontSize:'0.85rem', fontWeight:600}}>
                                      📷 Detectar Instagram
                                    </button>
                                    <span style={{fontSize:'0.7rem', color:'var(--text-2)', paddingLeft:'0.2rem'}}>Requiere cuenta profesional (Empresa/Creador) en IG</span>
                                  </>
                                ) : (
                                  <div style={{display:'flex', flexDirection:'column', gap:'0.4rem'}}>
                                    <span style={{fontSize:'0.72rem', color:'var(--text-2)'}}>No se detectó automáticamente. Ingresá el usuario de Instagram:</span>
                                    <div style={{display:'flex', gap:'0.4rem', alignItems:'center'}}>
                                      <span style={{color:'var(--text-2)', fontSize:'0.9rem', lineHeight:1}}>@</span>
                                      <input
                                        className="modal-input"
                                        type="text"
                                        placeholder="usuario_de_instagram"
                                        value={igManualInputs[bot.id] || ''}
                                        onChange={e => setIgManualInputs(s => ({ ...s, [bot.id]: e.target.value.replace(/^@/, '').trim() }))}
                                        style={{flex:1, marginBottom:0, background:'var(--surface)', fontSize:'0.85rem', padding:'0.4rem 0.6rem'}}
                                      />
                                      <button
                                        disabled={igManualSaving[bot.id] || !igManualInputs[bot.id]}
                                        onClick={async () => {
                                          const username = (igManualInputs[bot.id] || '').trim();
                                          if (!username) return;
                                          setIgManualSaving(s => ({ ...s, [bot.id]: true }));
                                          try {
                                            const res = await authFetch(`${API_URL}/api/bots/${bot.id}/meta/set-instagram`, { method: 'POST', body: JSON.stringify({ igUsername: username }) });
                                            const data = await res.json();
                                            if (data.ok) {
                                              setBots(prev => prev.map(b => b.id === bot.id ? { ...b, metaIgId: data.igId, metaIgUsername: data.igUsername } : b));
                                              setIgManualShow(s => ({ ...s, [bot.id]: false }));
                                              setIgManualInputs(s => ({ ...s, [bot.id]: '' }));
                                            } else {
                                              alert(data.error || 'Error al guardar.');
                                            }
                                          } catch { alert('Error de conexión'); }
                                          finally { setIgManualSaving(s => ({ ...s, [bot.id]: false })); }
                                        }}
                                        style={{background:'linear-gradient(135deg,#833ab4,#fd1d1d)', border:'none', borderRadius:'7px', color:'#fff', cursor:'pointer', padding:'0.4rem 0.8rem', fontSize:'0.82rem', fontWeight:600, whiteSpace:'nowrap', opacity: igManualSaving[bot.id] ? 0.6 : 1}}
                                      >
                                        {igManualSaving[bot.id] ? '...' : 'Guardar'}
                                      </button>
                                      <button onClick={() => setIgManualShow(s => ({ ...s, [bot.id]: false }))} style={{background:'transparent', border:'none', color:'var(--text-2)', cursor:'pointer', fontSize:'0.85rem', padding:'0.2rem 0.3rem'}}>✕</button>
                                    </div>
                                    <span style={{fontSize:'0.68rem', color:'var(--text-2)', paddingLeft:'1rem'}}>Asegurate que sea cuenta Profesional (Empresa o Creador)</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{display:'flex', flexDirection:'column', gap:'0.25rem'}}>
                                <button onClick={async () => {
                                  const w=580,h=680,l=Math.round(window.screenX+(window.outerWidth-w)/2),t=Math.round(window.screenY+(window.outerHeight-h)/2);
                                  const popup = window.open('about:blank','atento_oauth',`width=${w},height=${h},left=${l},top=${t},scrollbars=yes`);
                                  try {
                                    const res = await authFetch(`${API_URL}/api/oauth/instagram/init`, { method: 'POST', body: JSON.stringify({ botId: bot.id, returnPath: '/oauth-callback' }) });
                                    const data = await res.json();
                                    if (data.url && popup && !popup.closed) { popup.location.href = data.url; }
                                    else { popup?.close(); alert(data.error || 'Error'); }
                                  } catch { popup?.close(); alert('Error de conexión'); }
                                }} style={{display:'flex', alignItems:'center', gap:'0.5rem', background:'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', padding:'0.5rem 1rem', fontSize:'0.85rem', fontWeight:600}}>
                                  📷 Vincular Instagram
                                </button>
                                <span style={{fontSize:'0.7rem', color:'var(--text-2)', paddingLeft:'0.2rem'}}>Primero conectá Facebook</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Telegram */}
                    <div style={{marginTop:'2rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                      <div className="prompt-header">
                        <span style={{fontSize:'1rem'}}>✈️</span>
                        <h3 style={{color:'#38bdf8', flex:1}}>Integración Telegram Bot</h3>
                        {bot.telegramBotToken && <span style={{fontSize:'0.72rem', background:'rgba(16,185,129,0.12)', color:'var(--success)', padding:'2px 8px', borderRadius:'6px', border:'1px solid var(--success-border)'}}>● Conectado</span>}
                      </div>
                      <p style={{fontSize:'0.82rem', color:'var(--text-2)', margin:'0 0 0.75rem'}}>Creá un bot en @BotFather y pegá el token aquí. La IA responde en Telegram sin QR.</p>
                      <div style={{display:'flex', gap:'0.75rem', flexWrap:'wrap'}}>
                        <input className="modal-input" type="password" placeholder="Token de Telegram (123456789:AAH...)"
                          value={telegramTokens[bot.id] ?? (bot.telegramBotToken || '')}
                          onChange={e => setTelegramTokens(t => ({...t, [bot.id]: e.target.value}))}
                          style={{flex:1, marginBottom:0, background:'var(--surface)'}} />
                        <button disabled={telegramSaving[bot.id]}
                          onClick={async () => {
                            const tkn = telegramTokens[bot.id] ?? '';
                            setTelegramSaving(s => ({...s, [bot.id]: true}));
                            setTelegramMsg(m => ({...m, [bot.id]: null}));
                            try {
                              const res = await authFetch(`${API_URL}/api/bots/${bot.id}/telegram`, { method: 'PUT', body: JSON.stringify({ token: tkn }) });
                              const data = await res.json();
                              setTelegramMsg(m => ({...m, [bot.id]: { ok: res.ok, text: res.ok ? '✅ ' + data.message : '❌ ' + (data.error || 'Error') }}));
                              if (res.ok) setBots(prev => prev.map(b => b.id === bot.id ? {...b, telegramBotToken: tkn || null} : b));
                            } catch { setTelegramMsg(m => ({...m, [bot.id]: { ok: false, text: '❌ Error de conexión' }})); }
                            finally { setTelegramSaving(s => ({...s, [bot.id]: false})); setTimeout(() => setTelegramMsg(m => ({...m, [bot.id]: null})), 4000); }
                          }}
                          className="btn-solid-blue" style={{margin:0, width:'auto', padding:'0.6rem 1rem', whiteSpace:'nowrap'}}>
                          {telegramSaving[bot.id] ? 'Conectando...' : (bot.telegramBotToken ? 'Actualizar' : 'Conectar')}
                        </button>
                      </div>
                      {telegramMsg[bot.id] && <p style={{margin:'0.5rem 0 0', fontSize:'0.875rem', color: telegramMsg[bot.id].ok ? 'var(--success)' : 'var(--danger)'}}>{telegramMsg[bot.id].text}</p>}
                    </div>
                  </div>

                  {/* ── Turnos ── */}
                  <div className="prompt-header" style={{ marginTop:'1.5rem', borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
                    <Calendar size={18} color="#818cf8" />
                    <h3>Gestión de Turnos</h3>
                  </div>
                  <AdminTurnosPanel botId={bot.id} />

                </div>
              )}

              {/* QR */}
              {bot.status === 'QR_READY' && (
                <div className="bot-card-expanded qr-container">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem', width: '100%' }}>
                    <button onClick={() => handleLogout(bot.id)} style={{ background: 'transparent', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger)', cursor: 'pointer', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 500 }}>
                      ✕ Desvincular WhatsApp
                    </button>
                  </div>
                  <p>Escanea este Código con WhatsApp Business para conectar la IA:</p>
                  {qrCodes[bot.id] ? (
                    <div className="qr-wrapper"><QRCodeSVG value={qrCodes[bot.id]} size={180} /></div>
                  ) : (
                    <div className="qr-wrapper" style={{ minHeight: 180, display: 'grid', placeItems: 'center', color: 'var(--text-2)', fontSize: '0.86rem', textAlign: 'center', padding: '1rem' }}>
                      Generando QR...
                    </div>
                  )}
                </div>
              )}

              {/* Starting */}
              {bot.status === 'STARTING' && (
                <div className="bot-card-expanded loading-state">
                  <Loader className="spinner" size={26} />
                  <p>Iniciando el motor de IA...</p>
                </div>
              )}

              {/* ON state */}
              {bot.status === 'ON' && (
                <div className="bot-card-expanded" style={{background:'var(--success-dim)', border:'1px solid var(--success-border)', textAlign:'center', padding:'1rem', borderTop:'1px solid var(--success-border)'}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{margin:'0 auto 8px', display:'block'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  <h4 style={{margin:'0 0 4px', color:'var(--success)', fontSize:'0.95rem'}}>¡IA Conectada a WhatsApp!</h4>
                  <p style={{margin:'0 0 0.75rem', fontSize:'0.82rem', color:'var(--success)', opacity:0.85}}>Atento ya controla las respuestas automáticas para este número.</p>
                  <button onClick={() => handleLogout(bot.id)} style={{ background: 'transparent', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger)', cursor: 'pointer', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 500 }}>
                    ✕ Desvincular WhatsApp
                  </button>
                </div>
              )}

            </div>
          ))}
        </main>
        </>}

      </div>
    </div>
  );
}

export default Dashboard;
