import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function authFetch(url, options = {}, token) {
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers }
  });
}

export default function MerchantPanel() {
  const nav = useNavigate();
  const token = localStorage.getItem('merchant_token');
  const botId = localStorage.getItem('merchant_bot_id');

  const [bot, setBot] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [hours, setHours] = useState({ active: false, start: '09:00', end: '18:00', autoReplyMsg: '' });
  const [qrData, setQrData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [starting, setStarting] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [catalog, setCatalog] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [adminNumber, setAdminNumber] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const pollRef = useRef(null);

  // Meta Config (Instagram)
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaPageId, setMetaPageId] = useState('');
  const [metaIgId, setMetaIgId] = useState('');
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaMsg, setMetaMsg] = useState(null);
  const [metaVerifyToken, setMetaVerifyToken] = useState('');

  // Telegram Config
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramSaving, setTelegramSaving] = useState(false);
  const [telegramMsg, setTelegramMsg] = useState(null);


  useEffect(() => {
    if (!token || !botId) { nav('/registro'); return; }
    loadBot();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function loadBot() {
    try {
      const res = await authFetch(`${API}/api/bots/${botId}`, {}, token);
      const data = await res.json();
      if (!res.ok) { nav('/registro'); return; }
      setBot(data);
      setPrompt(data.prompt || '');
      const m = (() => { try { return JSON.parse(data.metrics || '{}'); } catch { return {}; } })();
      if (m.workingHours) setHours(m.workingHours);
      if (m.adminNumber) setAdminNumber(m.adminNumber.replace('@c.us', ''));
      const kb = data.knowledgeBase || '';
      setKnowledgeBase(kb);
      const catMatch = kb.match(/\[CATALOGO\]([\s\S]*?)(?=\n\[|$)/i);
      setCatalog(catMatch ? catMatch[1].trim() : '');

      if (data.metaAccessToken) setMetaAccessToken(data.metaAccessToken);
      if (data.metaPageId) setMetaPageId(data.metaPageId);
      if (data.metaIgId) setMetaIgId(data.metaIgId);
      if (data.telegramBotToken) setTelegramBotToken(data.telegramBotToken);
    } catch {
      nav('/registro');
    }
  }

  async function changePassword() {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) { setPwMsg({ ok: false, text: 'Completá todos los campos.' }); return; }
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ ok: false, text: 'Las contraseñas nuevas no coinciden.' }); return; }
    if (pwForm.next.length < 6) { setPwMsg({ ok: false, text: 'Mínimo 6 caracteres.' }); return; }
    setPwSaving(true); setPwMsg(null);
    try {
      const res = await authFetch(`${API}/api/merchant/password`, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next })
      }, token);
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ ok: true, text: 'Contraseña actualizada.' });
        setPwForm({ current: '', next: '', confirm: '' });
      } else {
        setPwMsg({ ok: false, text: data.error || 'Error al cambiar la contraseña.' });
      }
    } catch {
      setPwMsg({ ok: false, text: 'Error al conectar con el servidor.' });
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwMsg(null), 4000);
    }
  }

  async function save() {
    setSaving(true); setSaveMsg('');
    try {
      const res = await authFetch(`${API}/api/bots/${botId}/prompt`, {
        method: 'PUT',
        body: JSON.stringify({ prompt, workingHours: hours, knowledgeBase, adminNumber })
      }, token);
      if (res.ok) setSaveMsg('ok');
      else setSaveMsg('err');
    } catch {
      setSaveMsg('err');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  }

  async function saveMetaConfig() {
    setMetaSaving(true); setMetaMsg(null);
    try {
      const res = await authFetch(`${API}/api/merchant/meta-config`, {
        method: 'POST',
        body: JSON.stringify({ botId, metaAccessToken, metaPageId, metaIgId })
      }, token);
      const data = await res.json();
      if (res.ok) {
        setMetaVerifyToken(data.verifyToken || '');
        setMetaMsg({ ok: true, text: '✅ Credenciales guardadas. Copiá el Verify Token de abajo para configurar el Webhook en Meta Developers.' });
      } else {
        setMetaMsg({ ok: false, text: `❌ ${data.error || 'Error al guardar.'}` });
        setTimeout(() => setMetaMsg(null), 4000);
      }
    } catch {
      setMetaMsg({ ok: false, text: '❌ Error de conexión.' });
      setTimeout(() => setMetaMsg(null), 4000);
    } finally {
      setMetaSaving(false);
    }
  }

  async function saveTelegramConfig() {
    setTelegramSaving(true); setTelegramMsg(null);
    try {
      const res = await authFetch(`${API}/api/bots/${botId}/telegram`, {
        method: 'PUT',
        body: JSON.stringify({ token: telegramBotToken })
      }, token);
      const data = await res.json();
      if (res.ok) {
        setTelegramMsg({ ok: true, text: '✅ ' + data.message });
      } else {
        setTelegramMsg({ ok: false, text: `❌ ${data.error || 'Error al conectar.'}` });
      }
    } catch {
      setTelegramMsg({ ok: false, text: '❌ Error de conexión.' });
    } finally {
      setTelegramSaving(false);
      setTimeout(() => setTelegramMsg(null), 4000);
    }
  }

  async function startBot() {
    setStarting(true);
    setQrData(null);
    await authFetch(`${API}/api/bots/${botId}/start`, { method: 'POST' }, token);
    pollRef.current = setInterval(pollStatus, 2000);
  }

  async function importSheets() {
    if (!sheetsUrl.trim()) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await authFetch(`${API}/api/bots/${botId}/catalog/sheets`, {
        method: 'POST',
        body: JSON.stringify({ sheetsUrl: sheetsUrl.trim() })
      }, token);
      const data = await res.json();
      if (res.ok) {
        setImportMsg({ ok: true, text: `✅ ${data.count} productos importados.`, preview: data.preview });
      } else {
        setImportMsg({ ok: false, text: `❌ ${data.error}` });
      }
    } catch {
      setImportMsg({ ok: false, text: '❌ Error al conectar con el servidor.' });
    } finally {
      setImporting(false);
    }
  }

  async function stopBot() {
    await authFetch(`${API}/api/bots/${botId}/stop`, { method: 'POST' }, token);
    setBot(b => ({ ...b, status: 'OFF' }));
    setQrData(null);
    setStarting(false);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  async function pollStatus() {
    try {
      const res = await authFetch(`${API}/api/bots/${botId}/status`, {}, token);
      const data = await res.json();
      if (data.qr) setQrData(data.qr);
      if (data.status === 'ON') {
        setBot(b => ({ ...b, status: 'ON' }));
        setStarting(false);
        clearInterval(pollRef.current);
      }
    } catch {}
  }

  function logout() {
    localStorage.removeItem('merchant_token');
    localStorage.removeItem('merchant_bot_id');
    nav('/');
  }

  if (!bot) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-secondary)' }}>
      Cargando...
    </div>
  );

  const metrics = (() => { try { return JSON.parse(bot.metrics || '{}'); } catch { return {}; } })();
  const isOn = bot.status === 'ON';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '900px', margin: '0 auto 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '800', fontSize: '1.3rem' }}>
          <div className="brand-logo" style={{ width: '32px', height: '32px', fontSize: '1rem', margin: 0, boxShadow: 'none' }}>TJ</div>
          Asisto AI
        </div>
        <div style={{ position: 'relative' }}>
          <div onClick={() => setShowProfile(!showProfile)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', color: 'white', border: '2px solid var(--border)', userSelect: 'none' }}>
            {(bot?.name || 'U').charAt(0).toUpperCase()}
          </div>
          {showProfile && (
            <div style={{ position: 'absolute', top: '48px', right: 0, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1rem', minWidth: '200px', zIndex: 9999, boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.1rem', color: 'white', flexShrink: 0 }}>
                  {(bot?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{bot?.name || 'Mi negocio'}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Usuario</div>
                </div>
              </div>
              <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.9rem', padding: '0.4rem 0' }}>
                &#8594; Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="bot-card" style={{ border: isOn ? '1px solid rgba(16,185,129,0.3)' : undefined }}>

          {/* Cabecera */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ margin: '0 0 0.3rem', fontSize: '1.8rem', fontWeight: 800 }}>
                Bot Manager <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px', verticalAlign: 'middle', marginLeft: '0.4rem' }}>PRO</span>
              </h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Panel de Auto-Gestión Inteligente</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {isOn ? (
                <button onClick={stopBot} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>
                  Detener bot
                </button>
              ) : (
                <button onClick={startBot} disabled={starting} className="btn-solid-blue" style={{ margin: 0, width: 'auto', padding: '0.6rem 1.2rem', fontSize: '0.9rem', opacity: starting ? 0.7 : 1 }}>
                  {starting ? 'Iniciando...' : 'Conectar WhatsApp'}
                </button>
              )}
            </div>
          </div>

          {/* Card resumen del bot */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🤖</div>
              <div>
                <div style={{ fontWeight: 700 }}>{bot.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isOn ? '#10b981' : starting ? '#f59e0b' : '#6b7280' }} />
                  <span style={{ fontSize: '0.8rem', color: isOn ? '#10b981' : 'var(--text-secondary)' }}>
                    {isOn ? 'ON' : starting ? 'Iniciando...' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { emoji: '💬', value: (metrics.messagesSent || 0).toLocaleString(), label: 'mensajes respondidos' },
                { emoji: '👥', value: (metrics.customersHelped || 0).toLocaleString(), label: 'chats atendidos' },
                { emoji: '🎯', value: (metrics.weeklySales || 0).toLocaleString(), label: 'conversiones' },
              ].map((m, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>{m.emoji}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.value}</span>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* QR */}
          {starting && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              {qrData ? (
                <>
                  <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '4px solid var(--accent)' }}>
                    <QRCodeSVG value={qrData} size={180} />
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, textAlign: 'center' }}>
                    Abrí WhatsApp → Dispositivos vinculados → Escanear código QR
                  </p>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', padding: '0.75rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>⏳</span>
                  <span style={{ fontSize: '0.9rem' }}>Generando código QR...</span>
                </div>
              )}
            </div>
          )}
          {isOn && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>✅</span>
              <p style={{ margin: 0, color: '#10b981', fontSize: '0.875rem' }}>WhatsApp conectado. El bot ya responde automáticamente.</p>
            </div>
          )}

          {/* ── Comportamiento ── */}
          <div className="prompt-header" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🧠</span>
            <h3>Comportamiento Psicológico de la IA</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.6rem' }}>
            Definí la personalidad de tu asistente: cómo saluda, qué tono usa, si trata de "vos" o "usted", si es formal o relajado. Cuanto más detallado, mejor va a representar a tu negocio.
          </p>
          <textarea
            className="prompt-textarea editable"
            value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder="Describí cómo debe hablar y comportarse el bot con tus clientes..."
          />

          {/* ── Catálogo Google Sheets ── */}
          <div className="prompt-header" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⚙️</span>
            <h3>Conexión Catálogo Activo (Google Sheets)</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.6rem' }}>
            Pegá el link de tu Google Sheets. La hoja debe ser pública ("cualquiera con el link puede ver").
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <input
              className="modal-input" type="url" value={sheetsUrl}
              onChange={e => { setSheetsUrl(e.target.value); setImportMsg(null); }}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              style={{ flex: 1, marginBottom: 0, background: 'var(--bg-card)' }}
            />
            <button onClick={importSheets} disabled={importing || !sheetsUrl.trim()} className="btn-solid-blue"
              style={{ margin: 0, width: 'auto', padding: '0.6rem 1rem', opacity: (importing || !sheetsUrl.trim()) ? 0.6 : 1, whiteSpace: 'nowrap' }}>
              {importing ? 'Importando...' : 'Importar'}
            </button>
          </div>
          {importMsg && (
            <div style={{ marginBottom: '0.5rem' }}>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.875rem', color: importMsg.ok ? '#10b981' : '#f87171' }}>{importMsg.text}</p>
              {importMsg.ok && importMsg.preview && (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {importMsg.preview.map((p, i) => <div key={i}>{p}</div>)}
                  {importMsg.preview.length < importMsg.count && <div style={{ opacity: 0.5 }}>...</div>}
                </div>
              )}
            </div>
          )}
          {catalog && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.6rem 0.9rem', fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '130px', overflowY: 'auto', lineHeight: 1.7 }}>
              {catalog}
            </div>
          )}

          {/* ── Base de Conocimientos ── */}
          <div className="prompt-header" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '1.1rem', color: '#10b981' }}>🔗</span>
            <h3>Base de Conocimientos</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>
            Todo lo que tu asistente necesita saber para responder correctamente: métodos de pago, zonas de envío, garantías, condiciones especiales. Organizá la info por secciones usando corchetes como <strong>[ENVIO]</strong>, <strong>[PAGOS]</strong>, <strong>[GARANTIA]</strong> para que la IA sepa dónde buscar cada dato.
          </p>
          <textarea
            className="prompt-textarea editable"
            style={{ minHeight: '120px', borderColor: 'rgba(16,185,129,0.3)' }}
            value={knowledgeBase} onChange={e => setKnowledgeBase(e.target.value)}
            placeholder={`Organizá la info por secciones para que la IA solo lea lo relevante en cada pregunta:\n\n[ENVIO]\nEnvíos en 24-48hs. Costo fijo $2.000 a todo el país.\n\n[PAGOS]\nEfectivo, transferencia (10% OFF) o tarjeta hasta 6 cuotas.\n\n[UBICACION]\nAv. Corrientes 1234, CABA. Lun-Sáb 9 a 20hs.\n\n[GARANTIA]\n30 días para cambios sin cargo.`}
          />

          {/* ── Horario de Atención ── */}
          <div className="prompt-header" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🕐</span>
            <h3>Horario de Atención (Anti-Nocturno)</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem' }}>
            Activá esta opción para que el bot solo responda dentro de tu horario comercial. Fuera de ese horario, enviará automáticamente el mensaje que escribas abajo.
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <label className="ios-toggle">
              <input type="checkbox" checked={hours.active} onChange={e => setHours(h => ({ ...h, active: e.target.checked }))} />
              <span className="slider"></span>
            </label>
            <span>Activar Límite de Horario</span>
          </div>
          {hours.active && (
            <div style={{ background: 'rgba(59,130,246,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Abre (Ej: 09:00)</label>
                  <input className="modal-input" type="time" value={hours.start} onChange={e => setHours(h => ({ ...h, start: e.target.value }))} style={{ padding: '0.5rem', width: 'auto' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Cierra (Ej: 18:00)</label>
                  <input className="modal-input" type="time" value={hours.end} onChange={e => setHours(h => ({ ...h, end: e.target.value }))} style={{ padding: '0.5rem', width: 'auto' }} />
                </div>
              </div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Mensaje Automático (Si lo dejás vacío, no contestará fuera de horario)</label>
              <textarea className="prompt-textarea editable" style={{ minHeight: '60px' }}
                placeholder="Ej: Hola! Nuestro local está cerrado ahora, pero mañana a primera hora te asisto."
                value={hours.autoReplyMsg} onChange={e => setHours(h => ({ ...h, autoReplyMsg: e.target.value }))} />
            </div>
          )}

          {/* ── Integración Meta (Instagram) ── */}
          <div className="prompt-header" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '1.1rem', color: '#e1306c' }}>📸</span>
            <h3 style={{ color: '#e1306c' }}>Integración Instagram DMs</h3>
          </div>
          {metrics.hasSocialFeature ? (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                Para que la IA responda Mensajes Directos de Instagram, ingresa las credenciales de la API de Meta Graph (Fase Beta).
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>ID de la Página de Facebook</label>
              <input className="modal-input" type="text" placeholder="Ej: 1234567890" value={metaPageId} onChange={e => setMetaPageId(e.target.value)} style={{ marginBottom: 0, background: 'var(--bg-card)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>ID de la Cuenta de Instagram (Business)</label>
              <input className="modal-input" type="text" placeholder="Ej: 9876543210" value={metaIgId} onChange={e => setMetaIgId(e.target.value)} style={{ marginBottom: 0, background: 'var(--bg-card)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Token de Acceso de Meta (System User)</label>
              <input className="modal-input" type="password" placeholder="EAABw..." value={metaAccessToken} onChange={e => setMetaAccessToken(e.target.value)} style={{ marginBottom: 0, background: 'var(--bg-card)' }} />
            </div>
            
            {metaMsg && <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: metaMsg.ok ? '#10b981' : '#f87171' }}>{metaMsg.text}</p>}

            <button onClick={saveMetaConfig} disabled={metaSaving} className="btn-solid-blue" style={{ marginTop: '0.5rem', width: 'auto', alignSelf: 'flex-start', padding: '0.6rem 1rem' }}>
              {metaSaving ? 'Guardando...' : 'Vincular Instagram'}
            </button>

            {metaVerifyToken && (
              <div style={{ marginTop: '0.75rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  🔑 Verify Token para Meta Developers → Webhooks:
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <code style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '0.4rem 0.6rem', fontSize: '0.82rem', wordBreak: 'break-all', color: '#93c5fd' }}>
                    {metaVerifyToken}
                  </code>
                  <button onClick={() => navigator.clipboard.writeText(metaVerifyToken)}
                    style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '6px', color: '#93c5fd', cursor: 'pointer', padding: '0.4rem 0.65rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    Copiar
                  </button>
                </div>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                  Pegalo en el campo "Verify Token" al registrar el webhook en Meta Developers. Si recargás la página se regenerará al guardar de nuevo.
                </p>
              </div>
            )}
              </div>
            </>
          ) : (
            <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', width: '100%', boxSizing: 'border-box', opacity: '0.6' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>🔒</span>
                <h4 style={{ margin: '0 0 5px 0', color: 'gray' }}>Módulo de Redes Sociales Bloqueado</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'gray' }}>Comunícate con Soporte para adquirir esta función Elite. La IA podrá responder todos los mensajes de tu Instagram automáticamente, capturando leads 24/7.</p>
            </div>
          )}

          {/* ── Integración Telegram ── */}
          <div className="prompt-header" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '1.1rem', color: '#38bdf8' }}>✈️</span>
            <h3 style={{ color: '#38bdf8' }}>Integración Telegram Bot</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
            Respondé a tus clientes por Telegram. Creá un bot con @BotFather y pegá el Token aquí. (Dejar vacío para desconectar)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Bot Token de Telegram</label>
              <input className="modal-input" type="password" placeholder="123456789:AAH..." value={telegramBotToken} onChange={e => setTelegramBotToken(e.target.value)} style={{ marginBottom: 0, background: 'var(--bg-card)' }} />
            </div>
            {telegramMsg && <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: telegramMsg.ok ? '#10b981' : '#f87171' }}>{telegramMsg.text}</p>}
            <button onClick={saveTelegramConfig} disabled={telegramSaving} className="btn-solid-blue" style={{ marginTop: '0.5rem', width: 'auto', alignSelf: 'flex-start', padding: '0.6rem 1rem' }}>
              {telegramSaving ? 'Conectando...' : 'Guardar y Conectar'}
            </button>
          </div>

          {/* ── Celular del Dueño ── */}
          <div className="prompt-header" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🔒</span>
            <h3 style={{ color: '#8b5cf6' }}>Seguridad: Celular de Administrador</h3>
          </div>
          {metrics.adminNumber ? (
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#10b981' }}>✔</span>
              <div>
                <p style={{ margin: 0, color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>Número de Contacto Seguro Vinculado</p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#10b981', opacity: 0.9 }}>+{metrics.adminNumber.replace('@c.us', '')}</p>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem' }}>
              Vinculá tu número para que el bot te reconozca como dueño y puedas darle instrucciones, lanzar difusiones y cambiar reglas directamente desde WhatsApp.
            </p>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <select className="modal-input" defaultValue="549"
              style={{ width: '90px', padding: '0.5rem', background: '#252b36', color: 'white', border: '1px solid var(--border)', marginBottom: 0 }}>
              <option value="549">🇦🇷 +54</option>
              <option value="52">🇲🇽 +52</option>
              <option value="56">🇨🇱 +56</option>
              <option value="57">🇨🇴 +57</option>
              <option value="51">🇵🇪 +51</option>
              <option value="1">🇺🇸 +1</option>
            </select>
            <input className="modal-input" type="tel" value={adminNumber} onChange={e => setAdminNumber(e.target.value)}
              placeholder="Ej: 1156687137" style={{ flex: 1, marginBottom: 0, background: 'var(--bg-card)' }} />
          </div>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
            Sin código de país ni el 15. Ej: <strong>1156781234</strong>
          </p>

          {/* ── Guardar ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            {saveMsg === 'ok' && <span style={{ color: '#10b981', fontSize: '0.875rem' }}>✅ Cambios guardados.</span>}
            {saveMsg === 'err' && <span style={{ color: '#f87171', fontSize: '0.875rem' }}>❌ Error al guardar.</span>}
            <button onClick={save} disabled={saving} className="btn-solid-blue" style={{ margin: 0, width: 'auto', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              💾 {saving ? 'Guardando...' : 'Actualizar Cerebro'}
            </button>
          </div>

          {/* ── Cambiar contraseña — colapsable ── */}
          <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
            <button onClick={() => setPwOpen(o => !o)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.7 }}>
              🔑 Cambiar contraseña {pwOpen ? '▲' : '▼'}
            </button>
            {pwOpen && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: '380px' }}>
                {[{ label: 'Contraseña actual', key: 'current' }, { label: 'Nueva contraseña', key: 'next' }, { label: 'Repetir nueva contraseña', key: 'confirm' }].map(({ label, key }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</label>
                    <input className="modal-input" type="password" value={pwForm[key]}
                      onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ marginBottom: 0, background: 'var(--bg-card)' }} />
                  </div>
                ))}
                {pwMsg && <p style={{ margin: 0, fontSize: '0.875rem', color: pwMsg.ok ? '#10b981' : '#f87171' }}>{pwMsg.text}</p>}
                <button onClick={changePassword} disabled={pwSaving} className="btn-solid-blue"
                  style={{ margin: 0, width: 'auto', padding: '0.6rem 1rem', alignSelf: 'flex-start' }}>
                  {pwSaving ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
