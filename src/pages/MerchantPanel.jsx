import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Bot,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Database,
  ExternalLink,
  HelpCircle,
  KeyRound,
  Lock,
  MessageCircle,
  Moon,
  PlugZap,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  Sun,
  TestTube2,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';

const API = 'https://asisto-backend-production.up.railway.app';

function authFetch(url, options = {}, token) {
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers }
  });
}

const cardStyle = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.022))',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '1.15rem',
  boxShadow: '0 12px 30px rgba(0,0,0,0.10)'
};

const CAMPAIGN_MIN_DELAY_SECONDS = 5;

const DEFAULT_HUMAN_HANDOFF = {
  enabled: true,
  triggers: {
    paymentRisk: true,
    angryCustomer: true,
    explicitRequest: true,
    unknownAnswer: true,
    highValue: false,
  },
  customRule: '',
  customRuleTitle: '',
  waitingMessage: 'Dame un momento, lo consulto con una persona del equipo y te respondo por acá.'
};

const HANDOFF_TRIGGER_LABELS = [
  { key: 'paymentRisk', title: 'Pago o cierre importante', desc: 'Deriva cuando el cliente está por pagar, manda un comprobante dudoso o la venta necesita confirmación.' },
  { key: 'angryCustomer', title: 'Cliente molesto', desc: 'Deriva reclamos, enojo, amenazas de devolución o situaciones sensibles.' },
  { key: 'explicitRequest', title: 'Pide hablar con una persona', desc: 'Deriva si el cliente pide vendedor, asesor, encargado o atención humana.' },
  { key: 'unknownAnswer', title: 'Falta información', desc: 'Deriva cuando el asistente no tiene datos suficientes para responder con seguridad.' },
  { key: 'highValue', title: 'Oportunidad mayorista', desc: 'Deriva compras grandes, pedidos mayoristas o negociaciones de alto valor.' },
];

const CONFIG_SECTIONS = [
  { id: 'assistant', label: 'Asistente', desc: 'Personalidad, tiempos, prueba e intervención humana.', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  { id: 'knowledge', label: 'Conocimientos', desc: 'Base, catálogo, tienda online y horarios.', color: '#06b6d4', bg: 'rgba(6,182,212,0.13)' },
  { id: 'connections', label: 'Conexiones', desc: 'Canales, administrador y seguridad.', color: '#10b981', bg: 'rgba(16,185,129,0.13)' },
];

function IconBox({ children, tone = 'violet' }) {
  const tones = {
    violet: ['rgba(124,58,237,0.16)', '#a78bfa'],
    blue: ['rgba(59,130,246,0.16)', '#60a5fa'],
    cyan: ['rgba(6,182,212,0.14)', '#22d3ee'],
    green: ['rgba(16,185,129,0.14)', '#34d399'],
    amber: ['rgba(245,158,11,0.14)', '#fbbf24'],
    rose: ['rgba(225,48,108,0.14)', '#fb7185'],
    slate: ['rgba(148,163,184,0.12)', 'var(--text-secondary)']
  };
  const [bg, color] = tones[tone] || tones.violet;
  return (
    <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {children}
    </div>
  );
}

function PanelCard({ children, style, ...props }) {
  return <div {...props} style={{ ...cardStyle, ...style }}>{children}</div>;
}

function SectionHeader({ icon, tone = 'violet', title, desc, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', minWidth: 0 }}>
        <IconBox tone={tone}>{icon}</IconBox>
        <div>
          <h3 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--text-primary)', fontWeight: 800 }}>{title}</h3>
          {desc && <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.55 }}>{desc}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function MetricPill({ icon, value, label }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.55rem 0.75rem', minWidth: 150, display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
      <span style={{ color: 'var(--text-secondary)', display: 'flex' }}>{icon}</span>
      <div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 800, lineHeight: 1 }}>{value}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.73rem', marginTop: '0.2rem' }}>{label}</div>
      </div>
    </div>
  );
}

function useAtentoConfirm() {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const confirmAction = useCallback((options) => new Promise(resolve => {
    resolverRef.current = resolve;
    setDialog({
      title: 'Confirmar accion',
      message: '',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      danger: false,
      ...options
    });
  }), []);

  const closeDialog = useCallback((accepted) => {
    if (resolverRef.current) resolverRef.current(accepted);
    resolverRef.current = null;
    setDialog(null);
  }, []);

  const confirmDialog = dialog ? (
    <div
      onClick={() => closeDialog(false)}
      style={{ position: 'fixed', inset: 0, zIndex: 12000, background: 'rgba(15,23,42,0.68)', backdropFilter: 'blur(7px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 'min(420px, 100%)', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '16px', boxShadow: '0 24px 80px rgba(15,23,42,0.28)', padding: '1.15rem' }}
      >
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
          <IconBox tone="violet">
            {dialog.danger ? <Trash2 size={18} /> : <ShieldCheck size={18} />}
          </IconBox>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, color: 'var(--text-1)', fontSize: '1rem', fontWeight: 850 }}>{dialog.title}</h3>
            {dialog.message && (
              <p style={{ margin: '0.4rem 0 0', color: 'var(--text-2)', fontSize: '0.86rem', lineHeight: 1.55 }}>
                {dialog.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => closeDialog(false)}
            aria-label="Cerrar"
            style={{ width: 32, height: 32, borderRadius: '9px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}
          >
            X
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.2rem' }}>
          <button
            type="button"
            onClick={() => closeDialog(false)}
            style={{ border: '1px solid var(--border-strong)', background: 'var(--surface-2)', color: 'var(--text-2)', borderRadius: '10px', padding: '0.62rem 0.9rem', cursor: 'pointer', fontWeight: 700 }}
          >
            {dialog.cancelText}
          </button>
          <button
            type="button"
            onClick={() => closeDialog(true)}
            style={{ border: 'none', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: '#fff', borderRadius: '10px', padding: '0.62rem 1rem', cursor: 'pointer', fontWeight: 800, boxShadow: '0 12px 30px rgba(124,58,237,0.24)' }}
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirmAction, confirmDialog };
}

// --- CampaignPanel ------------------------------------------------------------
function CampaignPanel({ botId, token, api, confirmAction }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [leadsModal, setLeadsModal] = useState(null); // campaign object or null
  const [newCampaign, setNewCampaign] = useState({ name: '', message_template: '', delay_seconds: 45, use_ai: false, campaign_goal: '' });
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState([]);
  const [leadsText, setLeadsText] = useState('');
  const [leadsImportMode, setLeadsImportMode] = useState('manual'); // 'manual' | 'sheets'
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [importingLeads, setImportingLeads] = useState(false);
  const [leadsMsg, setLeadsMsg] = useState(null);
  const [campaignMsg, setCampaignMsg] = useState(null);

  const statusColors = { draft: '#64748b', running: '#10b981', paused: '#f59e0b', completed: '#3b82f6' };
  const statusLabels = { draft: 'Borrador', running: 'Activa', paused: 'Pausada', completed: 'Completada' };

  const normalizeDelay = value => Math.max(CAMPAIGN_MIN_DELAY_SECONDS, Number(value) || CAMPAIGN_MIN_DELAY_SECONDS);

  async function loadCampaigns() {
    setLoading(true);
    try {
      const res = await authFetch(`${api}/api/bots/${botId}/campaigns`, {}, token);
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch { setCampaigns([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadCampaigns(); }, []);

  async function createCampaign() {
    if (!newCampaign.name) { setCampaignMsg({ ok: false, text: 'El nombre es requerido.' }); return; }
    if (newCampaign.use_ai && !newCampaign.campaign_goal) { setCampaignMsg({ ok: false, text: 'Describí el objetivo de la campaña para el modo IA.' }); return; }
    if (!newCampaign.use_ai && !newCampaign.message_template) { setCampaignMsg({ ok: false, text: 'Escribí el mensaje a enviar.' }); return; }
    setSaving(true); setCampaignMsg(null);
    try {
      const res = await authFetch(`${api}/api/bots/${botId}/campaigns`, {
        method: 'POST', body: JSON.stringify({ ...newCampaign, delay_seconds: normalizeDelay(newCampaign.delay_seconds) })
      }, token);
      if (res.ok) {
        setShowNewModal(false);
        setNewCampaign({ name: '', message_template: '', delay_seconds: 45, use_ai: false, campaign_goal: '' });
        loadCampaigns();
      } else {
        const d = await res.json();
        setCampaignMsg({ ok: false, text: d.error || 'Error al crear.' });
      }
    } catch { setCampaignMsg({ ok: false, text: 'Error de conexion.' }); }
    finally { setSaving(false); }
  }

  async function deleteCampaign(cid) {
    const ok = await confirmAction({
      title: 'Eliminar campaña',
      message: '¿Querés eliminar esta campaña y todos sus leads? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      danger: true
    });
    if (!ok) return;
    await authFetch(`${api}/api/bots/${botId}/campaigns/${cid}`, { method: 'DELETE' }, token);
    loadCampaigns();
  }

  async function startCampaign(cid) {
    await authFetch(`${api}/api/bots/${botId}/campaigns/${cid}/start`, { method: 'POST' }, token);
    loadCampaigns();
  }

  async function pauseCampaign(cid) {
    await authFetch(`${api}/api/bots/${botId}/campaigns/${cid}/pause`, { method: 'POST' }, token);
    loadCampaigns();
  }

  async function importFromSheets() {
    if (!sheetsUrl.trim()) return;
    setImportingLeads(true); setLeadsMsg(null);
    try {
      const res = await authFetch(`${api}/api/bots/${botId}/campaigns/${leadsModal.id}/leads/import-sheets`, {
        method: 'POST', body: JSON.stringify({ sheetsUrl: sheetsUrl.trim() })
      }, token);
      const data = await res.json();
      if (res.ok) {
        setLeadsMsg({ ok: true, text: `${data.imported} leads importados desde Google Sheets.` });
        setSheetsUrl('');
        const r2 = await authFetch(`${api}/api/bots/${botId}/campaigns/${leadsModal.id}/leads`, {}, token);
        const d2 = await r2.json();
        setLeads(Array.isArray(d2) ? d2 : []);
        loadCampaigns();
      } else { setLeadsMsg({ ok: false, text: `${data.error}` }); }
    } catch { setLeadsMsg({ ok: false, text: 'Error de conexion.' }); }
    finally { setImportingLeads(false); }
  }

  async function openLeadsModal(campaign) {
    setLeadsModal(campaign);
    setLeadsText('');
    setSheetsUrl('');
    setLeadsImportMode('manual');
    setLeadsMsg(null);
    try {
      const res = await authFetch(`${api}/api/bots/${botId}/campaigns/${campaign.id}/leads`, {}, token);
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch { setLeads([]); }
  }

  async function importLeads() {
    if (!leadsText.trim()) return;
    setImportingLeads(true); setLeadsMsg(null);
    const lines = leadsText.trim().split('\n').filter(l => l.trim());
    const parsed = lines.map(line => {
      const [phone, name, business_type, city] = line.split(',').map(s => s.trim());
      return { phone, name: name || '', business_type: business_type || '', city: city || '' };
    }).filter(l => l.phone);

    try {
      const res = await authFetch(`${api}/api/bots/${botId}/campaigns/${leadsModal.id}/leads`, {
        method: 'POST', body: JSON.stringify({ leads: parsed })
      }, token);
      const data = await res.json();
      if (res.ok) {
        setLeadsMsg({ ok: true, text: `${data.imported} leads importados.` });
        setLeadsText('');
        const r2 = await authFetch(`${api}/api/bots/${botId}/campaigns/${leadsModal.id}/leads`, {}, token);
        const d2 = await r2.json();
        setLeads(Array.isArray(d2) ? d2 : []);
        loadCampaigns();
      } else {
        setLeadsMsg({ ok: false, text: `${data.error}` });
      }
    } catch { setLeadsMsg({ ok: false, text: 'Error de conexion.' }); }
    finally { setImportingLeads(false); }
  }

  async function deleteLead(lid) {
    await authFetch(`${api}/api/bots/${botId}/campaigns/${leadsModal.id}/leads/${lid}`, { method: 'DELETE' }, token);
    const r = await authFetch(`${api}/api/bots/${botId}/campaigns/${leadsModal.id}/leads`, {}, token);
    const d = await r.json();
    setLeads(Array.isArray(d) ? d : []);
    loadCampaigns();
  }

  const leadStatusBadge = {
    pending:   { color: '#64748b', label: 'Pendiente' },
    sent:      { color: '#3b82f6', label: 'Enviado' },
    replied:   { color: '#10b981', label: 'Respondio' },
    opted_out: { color: '#ef4444', label: 'Opt-out' },
  };

  return (
    <div>
      {/* Modal nueva campana */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Nueva campaña</span>
              <button onClick={() => { setShowNewModal(false); setCampaignMsg(null); }} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.3rem 0.7rem' }}>Cerrar</button>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Nombre de la campaña</label>
              <input className="modal-input" value={newCampaign.name} onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Promo Mayo 2026" style={{ marginBottom: 0, background: 'var(--bg-card)' }} />
            </div>
            {/* Toggle modo IA */}
            <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '10px', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' }}>Mensaje generado por IA</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Gemini escribe un mensaje unico y personalizado para cada negocio</div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                <input type="checkbox" checked={newCampaign.use_ai}
                  onChange={e => setNewCampaign(p => ({ ...p, use_ai: e.target.checked }))}
                  style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: '34px',
                  background: newCampaign.use_ai ? '#7c3aed' : 'rgba(255,255,255,0.15)',
                  transition: '0.2s',
                }}>
                  <span style={{
                    position: 'absolute', content: '', height: '18px', width: '18px', left: newCampaign.use_ai ? '23px' : '3px',
                    bottom: '3px', background: 'white', borderRadius: '50%', transition: '0.2s',
                  }} />
                </span>
              </label>
            </div>

            {/* Modo IA: campo objetivo */}
            {newCampaign.use_ai && (
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Objetivo de la campaña <span style={{ opacity: 0.6 }}>(qué querés lograr con cada mensaje)</span>
                </label>
                <textarea className="prompt-textarea editable" style={{ minHeight: '90px' }}
                  value={newCampaign.campaign_goal}
                  onChange={e => setNewCampaign(p => ({ ...p, campaign_goal: e.target.value }))}
                  placeholder={'Ej: Ofrecer Atento AI a duenos de negocios locales para que automaticen la atencion de WhatsApp. Mencionar que tienen 7 dias gratis y que configuramos todo nosotros.'} />
              </div>
            )}

            {/* Modo manual: template */}
            {!newCampaign.use_ai && (
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Mensaje a enviar <span style={{ opacity: 0.6 }}>(variables: {'{{nombre}}'}, {'{{negocio}}'}, {'{{ciudad}}'})</span>
                </label>
                <textarea className="prompt-textarea editable" style={{ minHeight: '120px' }}
                  value={newCampaign.message_template}
                  onChange={e => setNewCampaign(p => ({ ...p, message_template: e.target.value }))}
                  placeholder={'Hola {{nombre}}! Te contactamos desde Atento AI...'} />
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Espera entre mensajes (segundos)</label>
              <input className="modal-input" type="number" min={CAMPAIGN_MIN_DELAY_SECONDS} max="3600" value={newCampaign.delay_seconds}
                onChange={e => setNewCampaign(p => ({ ...p, delay_seconds: normalizeDelay(e.target.value) }))}
                style={{ marginBottom: 0, background: 'var(--bg-card)', width: '120px' }} />
              <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.45 }}>
                Mínimo {CAMPAIGN_MIN_DELAY_SECONDS}s para reducir riesgo de bloqueo por actividad tipo spam.
              </p>
            </div>
            {campaignMsg && <p style={{ margin: 0, fontSize: '0.875rem', color: campaignMsg.ok ? '#10b981' : '#f87171' }}>{campaignMsg.text}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowNewModal(false); setCampaignMsg(null); }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.6rem 1rem' }}>Cancelar</button>
              <button onClick={createCampaign} disabled={saving} className="btn-solid-blue" style={{ margin: 0, width: 'auto', padding: '0.6rem 1.25rem' }}>
                {saving ? 'Creando...' : 'Crear campaña'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal leads */}
      {leadsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '620px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Leads - {leadsModal.name}</span>
              <button onClick={() => setLeadsModal(null)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.3rem 0.7rem' }}>Cerrar</button>
            </div>
            <div>
              {/* Toggle manual / sheets */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {['manual', 'sheets'].map(mode => (
                  <button key={mode} onClick={() => { setLeadsImportMode(mode); setLeadsMsg(null); }}
                    style={{ padding: '0.35rem 0.9rem', borderRadius: '20px', border: '1px solid var(--border)', fontSize: '0.82rem', cursor: 'pointer', fontWeight: leadsImportMode === mode ? 700 : 400, background: leadsImportMode === mode ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: leadsImportMode === mode ? '#fff' : 'var(--text-secondary)', transition: '0.15s' }}>
                    {mode === 'manual' ? 'Manual (CSV)' : 'Google Sheets'}
                  </button>
                ))}
              </div>

              {leadsImportMode === 'manual' && (
                <>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Formato: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '0 4px', borderRadius: '4px' }}>telefono,nombre,negocio,ciudad,url</code>  uno por linea
                  </label>
                  <textarea className="prompt-textarea editable" style={{ minHeight: '90px' }}
                    value={leadsText} onChange={e => setLeadsText(e.target.value)}
                    placeholder={'5491112345678,Juan,Panaderia,CABA,https://maps.app.goo.gl/xyz\n5491198765432,Maria,Ferreteria,Cordoba,'} />
                  <button onClick={importLeads} disabled={importingLeads || !leadsText.trim()} className="btn-solid-blue"
                    style={{ margin: '0.5rem 0 0', width: 'auto', padding: '0.5rem 1rem', opacity: (importingLeads || !leadsText.trim()) ? 0.6 : 1 }}>
                    {importingLeads ? 'Importando...' : 'Importar'}
                  </button>
                </>
              )}

              {leadsImportMode === 'sheets' && (
                <>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Link de Google Sheets <span style={{ opacity: 0.6 }}>(debe ser pblico  "cualquiera con el link puede ver")</span>
                  </label>
                  <input className="modal-input" name="campaign_sheet_url" autoComplete="off" value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)}
                    placeholder="Pega aca el enlace publico de Google Sheets" style={{ marginBottom: 0, background: 'var(--bg-card)' }} />
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Columnas recomendadas: <strong>telefono, nombre, negocio, ciudad, url</strong> (con o sin encabezados). La columna <strong>url</strong> puede ser el sitio web o link de Google Maps del negocio  la IA lo analizar antes de escribir el mensaje.
                  </p>
                  <button onClick={importFromSheets} disabled={importingLeads || !sheetsUrl.trim()} className="btn-solid-blue"
                    style={{ margin: '0.5rem 0 0', width: 'auto', padding: '0.5rem 1rem', opacity: (importingLeads || !sheetsUrl.trim()) ? 0.6 : 1 }}>
                    {importingLeads ? 'Importando...' : 'Importar desde Sheets'}
                  </button>
                </>
              )}

              {leadsMsg && <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: leadsMsg.ok ? '#10b981' : '#f87171' }}>{leadsMsg.text}</p>}
            </div>
            {leads.length > 0 && (
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{leads.length} leads en esta campana</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '280px', overflowY: 'auto' }}>
                  {leads.map(lead => (
                    <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                      <span style={{ background: leadStatusBadge[lead.status]?.color || '#64748b', borderRadius: '20px', padding: '2px 8px', fontSize: '0.7rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {leadStatusBadge[lead.status]?.label || lead.status}
                      </span>
                      <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                        {lead.name || lead.phone.replace('@c.us', '')}
                        {lead.city && <span style={{ color: 'var(--text-secondary)', marginLeft: '0.4rem' }}> {lead.city}</span>}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lead.phone.replace('@c.us', '')}</span>
                      <button onClick={() => deleteLead(lead.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem', padding: '0 4px' }}>Eliminar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {leads.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Sin leads todavia. Importa contactos arriba.</p>}
          </div>
        </div>
      )}

      {/* Header campana */}
      <div id="tour-campaigns-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.1rem', fontWeight: 700 }}>Campañas de mensajería saliente</h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Enviá mensajes masivos personalizados a tus contactos de forma automática.</p>
        </div>
        <button onClick={() => { setShowNewModal(true); setCampaignMsg(null); }} className="btn-solid-blue" style={{ margin: 0, width: 'auto', padding: '0.6rem 1rem', fontSize: '0.875rem' }}>
          + Nueva campaña
        </button>
      </div>

      {loading && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cargando...</p>}

      {!loading && campaigns.length === 0 && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>WA</div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>No tenés campañas todavía. Creá una para empezar a enviar mensajes masivos.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {campaigns.map(c => (
          <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.name}</span>
                  <span style={{ background: statusColors[c.status] || '#64748b', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                    {statusLabels[c.status] || c.status}
                  </span>
                  {c.use_ai ? (
                    <span style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(124,58,237,0.4)' }}>
                      ? IA
                    </span>
                  ) : null}
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span>{c.stats?.pending || 0} pendientes</span>
                  <span style={{ color: '#3b82f6' }}>{c.stats?.sent || 0} enviados</span>
                  <span style={{ color: '#10b981' }}>{c.stats?.replied || 0} respondieron</span>
                  {(c.stats?.opted_out || 0) > 0 && <span style={{ color: '#f87171' }}>{c.stats.opted_out} opt-out</span>}
                  <span style={{ opacity: 0.5 }}>delay: {c.delay_seconds}s</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => openLeadsModal(c)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                  Leads
                </button>
                {c.status === 'draft' || c.status === 'paused' ? (
                  <button onClick={() => startCampaign(c.id)} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                    ? Iniciar
                  </button>
                ) : null}
                {c.status === 'running' ? (
                  <button onClick={() => pauseCampaign(c.id)} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '8px', color: '#f59e0b', cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                    ? Pausar
                  </button>
                ) : null}
                {['draft', 'paused', 'completed'].includes(c.status) ? (
                  <button onClick={() => deleteCampaign(c.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                    Cerrar
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// --- BotPreviewChat -----------------------------------------------------------
function BotPreviewChat({ botId, token, botName, currentPrompt, currentKB, onClose, embedded = false }) {
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hola! Soy el asistente virtual. En que te puedo ayudar?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const history = newMessages.slice(1, -1).map(m => ({ role: m.role, text: m.text }));
      const res = await fetch(`${API}/api/bots/${botId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, history, prompt: currentPrompt, knowledgeBase: currentKB })
      });
      const d = await res.json();
      setMessages(prev => [...prev, { role: 'model', text: d.reply || d.error || 'Sin respuesta.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: 'Error al conectar con el asistente.' }]);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      position: embedded ? 'relative' : 'fixed',
      top: embedded ? 'auto' : 0,
      right: embedded ? 'auto' : 0,
      bottom: embedded ? 'auto' : 0,
      width: embedded ? '100%' : '340px',
      maxWidth: embedded ? '460px' : 'none',
      height: embedded ? '520px' : 'auto',
      zIndex: embedded ? 'auto' : 9998,
      display: 'flex',
      flexDirection: 'column',
      filter: embedded ? 'none' : 'drop-shadow(-8px 0 32px rgba(0,0,0,0.5))',
      margin: embedded ? '0 auto' : 0,
    }}>
      {/* Phone frame */}
      <div style={{
        margin: embedded ? 0 : '16px 16px 16px 0',
        flex: 1, display: 'flex', flexDirection: 'column',
        background: '#111b21', borderRadius: embedded ? '24px' : '36px',
        border: '8px solid #1a1a2e', overflow: 'hidden',
        boxShadow: '0 0 0 2px #0d0f18',
      }}>
        {/* Notch */}
        <div style={{ background: '#111b21', display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: '60px', height: '5px', borderRadius: '3px', background: '#1a1a2e' }} />
        </div>

        {/* WA Header */}
        <div style={{ background: '#1f2c34', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!embedded && <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer', fontSize: '1.1rem', padding: 0, lineHeight: 1 }}>Cerrar</button>}
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.9rem', flexShrink: 0 }}>
            {(botName || 'B').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#e9edef', fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{botName || 'Mi Asistente'}</div>
            <div style={{ color: '#aebac1', fontSize: '0.7rem' }}>en lnea</div>
          </div>
          <div style={{ fontSize: '0.6rem', color: '#aebac1', background: '#2a3942', padding: '2px 7px', borderRadius: '8px', fontWeight: 600 }}>PREVIEW</div>
        </div>

        {/* Chat area */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '12px 10px',
          background: '#0b141a',
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '6px' }}>
              <div style={{
                maxWidth: '80%', padding: '6px 10px 4px',
                borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: m.role === 'user' ? '#005c4b' : '#202c33',
                color: '#e9edef', fontSize: '0.82rem', lineHeight: 1.5,
                wordBreak: 'break-word', whiteSpace: 'pre-wrap',
              }}>
                {m.text}
                <div style={{ fontSize: '0.6rem', color: '#aebac1', textAlign: 'right', marginTop: '2px' }}>
                  {now} {m.role === 'user' && 'Cliente'}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '6px' }}>
              <div style={{ background: '#202c33', borderRadius: '12px 12px 12px 2px', padding: '8px 14px', color: '#aebac1', fontSize: '0.82rem' }}>
                <span style={{ animation: 'pulse 1s infinite' }}>? ? ?</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ background: '#1f2c34', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Escrib un mensaje..."
            style={{
              flex: 1, background: '#2a3942', border: 'none', borderRadius: '20px',
              padding: '8px 14px', color: '#e9edef', fontSize: '0.82rem', outline: 'none',
            }}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} title="Enviar mensaje" style={{
            width: '36px', height: '36px', borderRadius: '50%', border: 'none',
            background: loading || !input.trim() ? '#2a3942' : '#00a884',
            color: '#fff', cursor: loading || !input.trim() ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
          }}><Send size={16} /></button>
        </div>

        {/* Home bar */}
        <div style={{ background: '#111b21', padding: '6px 0 10px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '80px', height: '4px', borderRadius: '2px', background: '#2a3942' }} />
        </div>
      </div>
    </div>
  );
}

function MerchantChatsPanel({ botId, token, api }) {
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [interventions, setInterventions] = useState([]);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [humanReply, setHumanReply] = useState('');
  const [saveHumanLearning, setSaveHumanLearning] = useState(true);
  const [replying, setReplying] = useState(false);
  const [interventionMsg, setInterventionMsg] = useState(null);

  const fmt = (ts) => {
    if (!ts) return '';
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const displayClient = (clientNumber = '') => {
    if (clientNumber.startsWith('tg_')) return `Telegram ${clientNumber.replace('tg_', '')}`;
    if (clientNumber.startsWith('ig_')) return `Instagram ${clientNumber.replace('ig_', '')}`;
    if (clientNumber.startsWith('fb_')) return `Facebook ${clientNumber.replace('fb_', '')}`;
    return `+${clientNumber.replace(/@[\w.]+$/, '')}`;
  };

  const channelLabel = (clientNumber = '') => {
    if (clientNumber.startsWith('tg_')) return 'Telegram';
    if (clientNumber.startsWith('ig_')) return 'Instagram';
    if (clientNumber.startsWith('fb_')) return 'Facebook';
    return 'WhatsApp';
  };

  async function loadChats() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ bot_id: botId, limit: '250' });
      if (search.trim()) params.set('client', search.trim());
      const res = await authFetch(`${api}/api/merchant/conversations?${params}`, {}, token);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setThreads(list);
      setSelected(prev => {
        if (prev && list.some(t => t.client_number === prev.client_number)) {
          return list.find(t => t.client_number === prev.client_number);
        }
        return list[0] || null;
      });
    } catch {
      setThreads([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadInterventions() {
    try {
      const params = new URLSearchParams({ bot_id: botId });
      const res = await authFetch(`${api}/api/merchant/interventions?${params}`, {}, token);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setInterventions(list);
      setSelectedIntervention(prev => {
        if (prev && list.some(i => i.id === prev.id)) return list.find(i => i.id === prev.id);
        return list[0] || null;
      });
    } catch {
      setInterventions([]);
      setSelectedIntervention(null);
    }
  }

  async function refreshAll() {
    await Promise.all([loadChats(), loadInterventions()]);
  }

  async function sendHumanReply() {
    if (!selectedIntervention || !humanReply.trim()) return;
    setReplying(true);
    setInterventionMsg(null);
    try {
      const res = await authFetch(`${api}/api/merchant/interventions/${selectedIntervention.id}/respond`, {
        method: 'POST',
        body: JSON.stringify({ answer: humanReply.trim(), saveLearning: saveHumanLearning })
      }, token);
      const data = await res.json();
      if (res.ok) {
        setHumanReply('');
        setSaveHumanLearning(true);
        setInterventionMsg({ ok: true, text: saveHumanLearning ? 'Respuesta enviada y aprendizaje guardado.' : 'Respuesta enviada sin guardar aprendizaje.' });
        await refreshAll();
      } else {
        setInterventionMsg({ ok: false, text: data.error || 'No se pudo enviar la respuesta.' });
      }
    } catch {
      setInterventionMsg({ ok: false, text: 'Error de conexión al enviar la respuesta.' });
    } finally {
      setReplying(false);
      setTimeout(() => setInterventionMsg(null), 4500);
    }
  }

  useEffect(() => {
    refreshAll();
  }, [botId, search]);

  const lastMessage = selected?.messages?.[selected.messages.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <PanelCard id="tour-chats-header">
        <SectionHeader
          icon={<MessageCircle size={18} />}
          tone="blue"
          title="Chats atendidos por el asistente"
          desc="Historial de conversaciones que el asistente esta respondiendo en tus canales conectados."
          action={
            <button onClick={refreshAll} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}>
              Actualizar
            </button>
          }
        />
        <input
          className="modal-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por numero o ID del cliente"
          style={{ marginBottom: 0, background: 'var(--bg-card)' }}
        />
      </PanelCard>

      <PanelCard style={{ borderColor: interventions.length ? 'rgba(245,158,11,0.36)' : 'var(--border)' }}>
        <SectionHeader
          icon={<ShieldCheck size={18} />}
          tone={interventions.length ? 'amber' : 'green'}
          title="Necesitan intervención humana"
          desc={interventions.length ? 'Chats pausados esperando una respuesta del dueño o del equipo.' : 'No hay conversaciones esperando intervención en este momento.'}
          action={<span style={{ background: interventions.length ? 'rgba(245,158,11,0.14)' : 'rgba(16,185,129,0.12)', color: interventions.length ? '#fbbf24' : '#34d399', border: `1px solid ${interventions.length ? 'rgba(245,158,11,0.28)' : 'rgba(16,185,129,0.24)'}`, borderRadius: 99, padding: '4px 10px', fontSize: '0.76rem', fontWeight: 800 }}>{interventions.length} pendientes</span>}
        />

        {interventions.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: '1rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '300px', overflowY: 'auto' }}>
              {interventions.map(item => {
                const active = selectedIntervention?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setSelectedIntervention(item); setHumanReply(''); setSaveHumanLearning(true); setInterventionMsg(null); }}
                    style={{
                      textAlign: 'left',
                      border: `1px solid ${active ? 'rgba(245,158,11,0.6)' : 'var(--border)'}`,
                      background: active ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.035)',
                      borderRadius: '12px',
                      padding: '0.8rem',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <strong style={{ fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayClient(item.client_number)}</strong>
                      <span style={{ fontSize: '0.68rem', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 99, padding: '2px 7px', flexShrink: 0 }}>{channelLabel(item.client_number)}</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.4 }}>{item.question}</p>
                    <span style={{ display: 'block', color: 'var(--text-3)', fontSize: '0.7rem', marginTop: '0.4rem' }}>{fmt(item.created_at)}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0.9rem' }}>
              {selectedIntervention ? (
                <>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{ display: 'block', fontSize: '0.92rem', marginBottom: '0.25rem' }}>{displayClient(selectedIntervention.client_number)}</strong>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.45 }}>{selectedIntervention.question}</p>
                  </div>
                  {selectedIntervention.messages?.length > 0 && (
                    <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.65rem', marginBottom: '0.75rem', background: 'rgba(11,20,26,0.45)' }}>
                      {selectedIntervention.messages.map(message => (
                        <div key={message.id} style={{ color: message.role === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.76rem', lineHeight: 1.45, marginBottom: '0.45rem' }}>
                          <strong>{message.role === 'user' ? 'Cliente' : 'Asistente'}:</strong> {message.content}
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    className="prompt-textarea editable"
                    value={humanReply}
                    onChange={e => setHumanReply(e.target.value)}
                    placeholder="Escribí la respuesta que recibirá el cliente..."
                    style={{ minHeight: '100px', marginBottom: '0.75rem' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.035)', borderRadius: '10px', padding: '0.7rem 0.8rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={saveHumanLearning}
                      onChange={e => setSaveHumanLearning(e.target.checked)}
                      style={{ marginTop: 3, accentColor: '#10b981' }}
                    />
                    <span>
                      <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.84rem' }}>Guardar esta respuesta en la base de conocimiento</span>
                      <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.76rem', lineHeight: 1.4, marginTop: '0.2rem' }}>Si lo desactivás, la respuesta se envía al cliente pero no se usa como aprendizaje futuro.</span>
                    </span>
                  </label>
                  {interventionMsg && <p style={{ margin: '0 0 0.75rem', color: interventionMsg.ok ? '#34d399' : '#f87171', fontSize: '0.82rem' }}>{interventionMsg.text}</p>}
                  <button onClick={sendHumanReply} disabled={replying || !humanReply.trim()} className="btn-solid-blue" style={{ margin: 0, width: 'auto', padding: '0.62rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Send size={15} /> {replying ? 'Enviando...' : 'Responder y cerrar'}
                  </button>
                </>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.86rem' }}>Seleccioná una intervención para responder.</p>
              )}
            </div>
          </div>
        )}
      </PanelCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '1rem', alignItems: 'start' }}>
        <PanelCard style={{ minHeight: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <strong style={{ fontSize: '0.95rem' }}>Conversaciones</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{threads.length} chats</span>
          </div>
          {loading && <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>Cargando chats...</p>}
          {!loading && threads.length === 0 && (
            <div style={{ border: '1px dashed var(--border)', borderRadius: '12px', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.86rem', textAlign: 'center' }}>
              Todavia no hay conversaciones registradas.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '620px', overflowY: 'auto' }}>
            {threads.map(thread => {
              const active = selected?.client_number === thread.client_number;
              const msg = thread.messages?.[thread.messages.length - 1];
              return (
                <button
                  key={thread.client_number}
                  onClick={() => setSelected(thread)}
                  style={{
                    textAlign: 'left',
                    border: `1px solid ${active ? 'rgba(124,58,237,0.55)' : 'var(--border)'}`,
                    background: active ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.035)',
                    borderRadius: '12px',
                    padding: '0.85rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayClient(thread.client_number)}</strong>
                    <span style={{ fontSize: '0.68rem', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.28)', borderRadius: 99, padding: '2px 7px', flexShrink: 0 }}>{channelLabel(thread.client_number)}</span>
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg?.content || 'Sin mensajes'}
                  </span>
                  <span style={{ color: 'var(--text-3)', fontSize: '0.72rem' }}>{fmt(thread.last_at)}</span>
                </button>
              );
            })}
          </div>
        </PanelCard>

        <PanelCard style={{ minHeight: '420px' }}>
          {selected ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{displayClient(selected.client_number)}</h2>
                  <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {channelLabel(selected.client_number)} - Ultimo mensaje {fmt(selected.last_at)}
                  </p>
                </div>
                <span style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.24)', borderRadius: 99, padding: '4px 10px', fontSize: '0.76rem', fontWeight: 800 }}>
                  {selected.messages.length} mensajes
                </span>
              </div>
              <div style={{ background: 'rgba(11,20,26,0.75)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem', minHeight: '330px', maxHeight: '620px', overflowY: 'auto' }}>
                {selected.messages.map(message => {
                  const fromUser = message.role === 'user';
                  return (
                    <div key={message.id} style={{ display: 'flex', justifyContent: fromUser ? 'flex-start' : 'flex-end', marginBottom: '0.65rem' }}>
                      <div style={{ maxWidth: '82%', background: fromUser ? '#202c33' : '#005c4b', color: '#e9edef', borderRadius: fromUser ? '13px 13px 13px 3px' : '13px 13px 3px 13px', padding: '0.65rem 0.8rem', fontSize: '0.86rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {message.content}
                        <div style={{ color: '#aebac1', fontSize: '0.65rem', marginTop: '0.35rem', textAlign: 'right' }}>
                          {fromUser ? 'Cliente' : 'Asistente'} - {fmt(message.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {lastMessage && (
                <p style={{ margin: '0.75rem 0 0', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  Vista de solo lectura. El asistente sigue respondiendo automaticamente desde WhatsApp/Telegram.
                </p>
              )}
            </>
          ) : (
            <div style={{ minHeight: '330px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>
              Selecciona un chat para ver el historial.
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
}

function MerchantMetricsPanel({ botId, token, api, bot }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMetrics() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ bot_id: botId });
      const res = await authFetch(`${api}/api/analytics/user?${params}`, {}, token);
      const payload = await res.json();
      setData(res.ok ? payload : null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, [botId]);

  const botMetrics = (() => {
    try { return typeof bot?.metrics === 'string' ? JSON.parse(bot.metrics || '{}') : (bot?.metrics || {}); } catch { return {}; }
  })();

  const MetricCard = ({ icon, value, label, tone = 'blue' }) => (
    <PanelCard style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <IconBox tone={tone}>{icon}</IconBox>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 850, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.3rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      </div>
    </PanelCard>
  );

  const MiniBarList = ({ items, valueKey = 'count', labelKey = 'label', colorKey = 'color', empty = 'Sin datos aun.' }) => {
    const max = Math.max(...(items || []).map(i => i[valueKey] || 0), 1);
    if (!items || items.length === 0) return <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>{empty}</p>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {items.map((item, idx) => (
          <div key={`${item[labelKey]}-${idx}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 0.8fr) 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item[labelKey]}</span>
            <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${((item[valueKey] || 0) / max) * 100}%`, height: '100%', background: item[colorKey] || 'linear-gradient(135deg,#7c3aed,#3b82f6)', borderRadius: 99 }} />
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', minWidth: 34, textAlign: 'right' }}>{item[valueKey] || 0}</span>
          </div>
        ))}
      </div>
    );
  };

  const peakHours = data?.peakHours || [];
  const maxPeak = Math.max(...peakHours.map(h => h.count || 0), 1);
  const peak = peakHours.reduce((best, h) => (h.count || 0) > (best.count || 0) ? h : best, { hour: '--', count: 0 });
  const topKeywords = data?.topKeywords || [];

  if (loading) {
    return (
      <PanelCard id="tour-metrics-header">
        <SectionHeader icon={<PlugZap size={18} />} tone="violet" title="Métricas del asistente" desc="Cargando actividad del asistente..." />
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Cargando métricas...</p>
      </PanelCard>
    );
  }

  if (!data) {
    return (
      <PanelCard id="tour-metrics-header">
        <SectionHeader icon={<PlugZap size={18} />} tone="violet" title="Métricas del asistente" desc="No se pudieron cargar los datos." />
        <button onClick={loadMetrics} className="btn-solid-blue" style={{ width: 'auto', margin: 0, padding: '0.6rem 1rem' }}>Reintentar</button>
      </PanelCard>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <PanelCard id="tour-metrics-header">
        <SectionHeader
          icon={<PlugZap size={18} />}
          tone="violet"
          title="Métricas del asistente"
          desc="Rendimiento, actividad y temas más consultados por tus clientes."
          action={<button onClick={loadMetrics} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}>Actualizar</button>}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
          <MetricCard icon={<MessageCircle size={18} />} value={data.todayClients || 0} label="Clientes hoy" tone="blue" />
          <MetricCard icon={<Bot size={18} />} value={data.weekClients || 0} label="Clientes semana" tone="green" />
          <MetricCard icon={<CheckCircle2 size={18} />} value={`${data.responseRate || 0}%`} label="Tasa respuesta" tone="cyan" />
          <MetricCard icon={<Clock size={18} />} value={data.avgLength || 0} label="Msgs por chat" tone="amber" />
        </div>
      </PanelCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '1rem' }}>
        <PanelCard>
          <SectionHeader icon={<Clock size={18} />} tone="amber" title="Horario pico" desc="Momentos con más consultas en los últimos 7 días." />
          <div style={{ display: 'flex', alignItems: 'end', gap: 4, height: 120, padding: '0.5rem 0 0.25rem' }}>
            {peakHours.map((h, idx) => (
              <div key={h.hour} title={`${h.hour}:00 - ${h.count} mensajes`} style={{ flex: 1, minWidth: 3, height: `${Math.max(5, ((h.count || 0) / maxPeak) * 100)}%`, background: (idx % 6 === 0 || h.hour === peak.hour) ? 'linear-gradient(180deg,#a78bfa,#3b82f6)' : 'rgba(124,58,237,0.32)', borderRadius: '5px 5px 2px 2px' }} />
            ))}
          </div>
          <p style={{ margin: '0.6rem 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Pico actual: <strong style={{ color: 'var(--text-primary)' }}>{peak.hour}:00</strong> con {peak.count || 0} mensajes.
          </p>
        </PanelCard>

        <PanelCard>
          <SectionHeader icon={<MessageCircle size={18} />} tone="blue" title="Canales" desc="Distribución de mensajes recibidos en los últimos 30 días." />
          <MiniBarList items={data.socialBreakdown || []} />
        </PanelCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '1rem' }}>
        <PanelCard>
          <SectionHeader icon={<Bot size={18} />} tone="green" title="Clientes" desc="Nuevos contra recurrentes en los últimos 30 días." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            {[
              ['Nuevos', data.newClients || 0, '#818cf8'],
              ['Recurrentes', data.returningClients || 0, '#f59e0b'],
              ['Total 30d', (data.newClients || 0) + (data.returningClients || 0), '#34d399'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0.9rem' }}>
                <div style={{ color, fontWeight: 850, fontSize: '1.35rem', lineHeight: 1 }}>{value}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.73rem', marginTop: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard>
          <SectionHeader icon={<PlugZap size={18} />} tone="violet" title="Temas frecuentes" desc="Palabras que más aparecen en las consultas de clientes." />
          <MiniBarList items={topKeywords} labelKey="word" empty="Todavía no hay suficientes mensajes para detectar temas." />
        </PanelCard>
      </div>

      <PanelCard>
        <SectionHeader icon={<CheckCircle2 size={18} />} tone="cyan" title="Resumen acumulado" desc="Datos totales guardados por el asistente." />
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <MetricPill icon={<MessageCircle size={16} />} value={(botMetrics.messagesSent || 0).toLocaleString()} label="Mensajes respondidos" />
          <MetricPill icon={<Bot size={16} />} value={(botMetrics.customersHelped || 0).toLocaleString()} label="Chats atendidos" />
          <MetricPill icon={<CheckCircle2 size={16} />} value={(botMetrics.weeklySales || 0).toLocaleString()} label="Conversiones" />
        </div>
      </PanelCard>
    </div>
  );
}

// --- TourOverlay -------------------------------------------------------------
function TourOverlay({ steps, onFinish, setActiveTab }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);

  const s = steps[step];

  useEffect(() => {
    if (s.tab) setActiveTab(s.tab);
    setRect(null);
    const delay = s.tab ? 120 : 0;
    const t = setTimeout(() => {
      const el = document.getElementById(s.id);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setRect(el.getBoundingClientRect()), 300);
    }, delay);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    const update = () => {
      const el = document.getElementById(steps[step].id);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [step]);

  function finish() { localStorage.setItem('atento_tour_done', '1'); onFinish(); }
  function goNext() { if (step === steps.length - 1) { finish(); return; } setStep(p => p + 1); }
  function goPrev() { if (step > 0) setStep(p => p - 1); }

  const isLast = step === steps.length - 1;
  const PAD = 10;

  if (!rect) {
    return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Preparando tour...</div>
    </div>;
  }

  const rr = { x: rect.left - PAD, y: rect.top - PAD, w: rect.width + PAD * 2, h: rect.height + PAD * 2 };
  const TW = 320;
  const spaceBelow = window.innerHeight - (rr.y + rr.h);
  const spaceAbove = rr.y;
  const showBelow = spaceBelow >= 200 || spaceBelow > spaceAbove;
  const ty = showBelow ? rr.y + rr.h + 14 : rr.y - 14 - 200;
  let tx = rr.x + rr.w / 2 - TW / 2;
  tx = Math.max(12, Math.min(tx, window.innerWidth - TW - 12));
  const arrowX = Math.max(12, Math.min(rr.x + rr.w / 2 - tx - 8, TW - 28));

  return (
    <>
      <svg onClick={finish} style={{ position: 'fixed', inset: 0, zIndex: 9999, width: '100%', height: '100%', cursor: 'default', pointerEvents: 'all' }}>
        <defs>
          <mask id="tour-hole">
            <rect width="100%" height="100%" fill="white" />
            <rect x={rr.x} y={rr.y} width={rr.w} height={rr.h} rx="10" fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#tour-hole)" />
        <rect x={rr.x} y={rr.y} width={rr.w} height={rr.h} rx="10" fill="none" stroke="#7c3aed" strokeWidth="2.5">
          <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite" />
        </rect>
      </svg>
      <div style={{ position: 'fixed', top: ty, left: tx, width: TW, zIndex: 10000, background: '#161a2e', border: '1px solid rgba(124,58,237,0.45)', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
        {showBelow ? (
          <div style={{ position: 'absolute', top: -9, left: arrowX, width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '9px solid rgba(124,58,237,0.45)' }} />
        ) : (
          <div style={{ position: 'absolute', bottom: -9, left: arrowX, width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '9px solid rgba(124,58,237,0.45)' }} />
        )}
        <div style={{ fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.95rem', color: '#f1f5f9' }}>{s.title}</div>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.65, margin: '0 0 1rem' }}>{s.desc}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {steps.map((_, i) => <div key={i} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 99, background: i === step ? '#7c3aed' : 'rgba(255,255,255,0.15)', transition: 'all 0.3s' }} />)}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button onClick={finish} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}>Saltar</button>
            {step > 0 && <button onClick={e => { e.stopPropagation(); goPrev(); }} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem', padding: '0.35rem 0.7rem' }}>Atras</button>}
            <button onClick={e => { e.stopPropagation(); goNext(); }} style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', padding: '0.35rem 0.85rem', fontWeight: 600 }}>
              {isLast ? 'Listo' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// --- TurnosPanel -------------------------------------------------------------
const DAYS = ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'];
const DAYS_SHORT = ['Lun','Mar','Mi','Jue','Vie','Sab','Dom'];
const COLORS = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4'];

function getWeekDays(offset) {
  const today = new Date();
  const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function getTimeSlotsForSpec(spec) {
  if (!spec?.schedule?.length) return { slots: [], dayMap: {} };
  let minMins = Infinity, maxMins = -Infinity;
  const dayMap = {}; // dayOfWeek -> [{start, end}]
  spec.schedule.forEach(s => {
    if (!s.active) return;
    const [sh, sm] = s.start_time.split(':').map(Number);
    const [eh, em] = s.end_time.split(':').map(Number);
    const start = sh * 60 + sm, end = eh * 60 + em;
    minMins = Math.min(minMins, start);
    maxMins = Math.max(maxMins, end);
    if (!dayMap[s.day_of_week]) dayMap[s.day_of_week] = [];
    dayMap[s.day_of_week].push({ start, end });
  });
  if (!isFinite(minMins)) return { slots: [], dayMap };
  const slots = [];
  for (let cur = minMins; cur < maxMins; cur += spec.duration_minutes) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`);
  }
  return { slots, dayMap };
}

function TurnosPanel({ botId, token, api, confirmAction }) {
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
  const [agendaCollapsed, setAgendaCollapsed] = useState(false);

  async function loadSpecs() {
    try {
      const res = await authFetch(`${api}/api/bots/${botId}/specialties`, {}, token);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setSpecs(list);
      if (list.length > 0) setSelectedSpecId(prev => prev || list[0].id);
      const sch = {};
      for (const s of list) {
        sch[s.id] = DAYS.map((_, i) => {
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
      const res = await authFetch(`${api}/api/bots/${botId}/appointments`, {}, token);
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
      await authFetch(`${api}/api/bots/${botId}/specialties`, { method:'POST', body: JSON.stringify(newSpec) }, token);
      setShowNewSpec(false);
      setNewSpec({ name:'', duration_minutes:30, color:'#7c3aed', reminder_enabled:true, reminder_hours:[24], capacity:1 });
      loadSpecs();
    } finally { setSaving(false); }
  }

  async function updateSpec() {
    if (!editingSpec?.name.trim()) return;
    setSaving(true);
    await authFetch(`${api}/api/bots/${botId}/specialties/${editingSpec.id}`, {
      method:'PUT',
      body: JSON.stringify({ name:editingSpec.name, duration_minutes:editingSpec.duration_minutes, capacity:editingSpec.capacity, color:editingSpec.color, reminder_enabled:editingSpec.reminder_enabled, reminder_hours:editingSpec.reminder_hours })
    }, token);
    setSaving(false); setEditingSpec(null); loadSpecs();
  }

  async function deleteSpec(sid) {
    const ok = await confirmAction({
      title: 'Eliminar servicio',
      message: '¿Querés eliminar este servicio y todos sus turnos? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      danger: true
    });
    if (!ok) return;
    await authFetch(`${api}/api/bots/${botId}/specialties/${sid}`, { method:'DELETE' }, token);
    loadSpecs(); loadAppointments();
  }

  async function deleteAppt(aid) {
    const ok = await confirmAction({
      title: 'Eliminar turno',
      message: '¿Querés eliminar este turno definitivamente? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      danger: true
    });
    if (!ok) return;
    await authFetch(`${api}/api/bots/${botId}/appointments/${aid}`, { method:'DELETE' }, token);
    setApptDetail(null); loadAppointments();
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
      await authFetch(`${api}/api/bots/${botId}/specialties/${sid}/schedule`, {
        method:'PUT', body: JSON.stringify({ slots })
      }, token);
      setScheduleMsg({ ok:true, text:'? Horarios guardados.' });
      loadSpecs();
    } catch { setScheduleMsg({ ok:false, text:'Error al guardar.' }); }
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
      const res = await authFetch(`${api}/api/bots/${botId}/appointments/available?specialty_id=${newAppt.specialty_id}&date=${newAppt.date}`, {}, token);
      setAvailableSlots(await res.json());
    } catch { setAvailableSlots([]); }
  }

  useEffect(() => { loadAvailableSlots(); }, [newAppt.specialty_id, newAppt.date]);

  async function createAppointment() {
    if (!newAppt.specialty_id || !newAppt.client_phone || !newAppt.date || !newAppt.time) {
      setApptMsg({ ok:false, text:'Complet todos los campos obligatorios.' }); return;
    }
    setSaving(true); setApptMsg(null);
    try {
      const res = await authFetch(`${api}/api/bots/${botId}/appointments`, { method:'POST', body: JSON.stringify(newAppt) }, token);
      const data = await res.json();
      if (res.ok) {
        setShowNewAppt(false);
        setNewAppt({ specialty_id:'', client_phone:'', client_name:'', date:'', time:'', notes:'' });
        loadAppointments();
      } else { setApptMsg({ ok:false, text: data.error || 'Error al crear.' }); }
    } finally { setSaving(false); }
  }

  async function updateApptStatus(aid, status) {
    await authFetch(`${api}/api/bots/${botId}/appointments/${aid}`, { method:'PUT', body: JSON.stringify({ status }) }, token);
    loadAppointments();
  }

  const inputStyle = { width:'100%', padding:'0.65rem 0.85rem', borderRadius:'8px', border:'1px solid var(--border)', background:'rgba(255,255,255,0.05)', color:'var(--text-primary)', fontSize:'0.9rem', boxSizing:'border-box' };
  const labelStyle = { fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:'0.25rem' };

  return (
    <div style={{ padding:'1.5rem 2rem' }}>

      {/* Modal nuevo servicio */}
      {editingSpec && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'16px', padding:'1.5rem', width:'100%', maxWidth:'420px', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, fontSize:'1rem' }}>Editar servicio</span>
              <button onClick={() => setEditingSpec(null)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.3rem 0.7rem' }}>Cerrar</button>
            </div>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input style={inputStyle} value={editingSpec.name} onChange={e => setEditingSpec(p=>({...p,name:e.target.value}))} placeholder="Nombre del servicio..." />
            </div>
            <div style={{ display:'flex', gap:'1rem' }}>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>Duracin del turno (min)</label>
                <input style={inputStyle} type="number" min="5" max="480" value={editingSpec.duration_minutes} onChange={e => setEditingSpec(p=>({...p,duration_minutes:Number(e.target.value)}))} />
              </div>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>Lugares simultneos</label>
                <input style={inputStyle} type="number" min="1" max="100" value={editingSpec.capacity} onChange={e => setEditingSpec(p=>({...p,capacity:Number(e.target.value)}))} />
              </div>
              <div>
                <label style={labelStyle}>Color</label>
                <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginTop:'0.25rem' }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setEditingSpec(p=>({...p,color:c}))}
                      style={{ width:'24px', height:'24px', borderRadius:'50%', background:c, cursor:'pointer', border: editingSpec.color===c ? '2px solid white' : '2px solid transparent', boxSizing:'border-box' }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:'10px', padding:'0.75rem 1rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
              <div>
                <div style={{ fontWeight:600, fontSize:'0.875rem' }}>Recordatorio automatico</div>
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
                          style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:'1rem', padding:'0 2px', lineHeight:1, opacity:0.5 }}></button>
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

      {showNewSpec && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'16px', padding:'1.5rem', width:'100%', maxWidth:'420px', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, fontSize:'1rem' }}>Nuevo servicio</span>
              <button onClick={() => setShowNewSpec(false)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.3rem 0.7rem' }}>Cerrar</button>
            </div>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input style={inputStyle} value={newSpec.name} onChange={e => setNewSpec(p=>({...p,name:e.target.value}))} placeholder="Ej: Corte de cabello, Consulta mdica, Asesora..." />
            </div>
            <div style={{ display:'flex', gap:'1rem' }}>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>Duracin del turno (min)</label>
                <input style={{...inputStyle}} type="number" min="5" max="480" value={newSpec.duration_minutes} onChange={e => setNewSpec(p=>({...p,duration_minutes:Number(e.target.value)}))} />
              </div>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>Lugares simultneos</label>
                <input style={{...inputStyle}} type="number" min="1" max="100" value={newSpec.capacity} onChange={e => setNewSpec(p=>({...p,capacity:Number(e.target.value)}))} />
              </div>
              <div>
                <label style={labelStyle}>Color</label>
                <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginTop:'0.25rem' }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setNewSpec(p=>({...p,color:c}))}
                      style={{ width:'24px', height:'24px', borderRadius:'50%', background:c, cursor:'pointer', border: newSpec.color===c ? '2px solid white' : '2px solid transparent', boxSizing:'border-box' }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:'10px', padding:'0.75rem 1rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
              <div>
                <div style={{ fontWeight:600, fontSize:'0.875rem' }}>Recordatorio automatico</div>
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
                          style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:'1rem', padding:'0 2px', lineHeight:1, opacity:0.5 }}></button>
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
              <button onClick={() => { setShowNewAppt(false); setApptMsg(null); }} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.3rem 0.7rem' }}>Cerrar</button>
            </div>
            <div>
              <label style={labelStyle}>Servicio *</label>
              <select style={inputStyle} value={newAppt.specialty_id} onChange={e => setNewAppt(p=>({...p,specialty_id:e.target.value,time:''}))}>
                <option value=""> Seleccion </option>
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
                    <option value=""> Seleccion </option>
                    {availableSlots.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input style={inputStyle} type="time" value={newAppt.time} onChange={e => setNewAppt(p=>({...p,time:e.target.value}))} placeholder="HH:MM" />
                )}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Telefono WhatsApp * <span style={{ opacity:0.6 }}>(con codigo de pais, ej: 5491123456789)</span></label>
              <input style={inputStyle} value={newAppt.client_phone} onChange={e => setNewAppt(p=>({...p,client_phone:e.target.value}))} placeholder="5491123456789" />
            </div>
            <div>
              <label style={labelStyle}>Nombre del cliente</label>
              <input style={inputStyle} value={newAppt.client_name} onChange={e => setNewAppt(p=>({...p,client_name:e.target.value}))} placeholder="Ej: Mara Gonzlez" />
            </div>
            <div>
              <label style={labelStyle}>Notas</label>
              <input style={inputStyle} value={newAppt.notes} onChange={e => setNewAppt(p=>({...p,notes:e.target.value}))} placeholder="Ej: Primera vez, trae documentacin, requiere confirmacin..." />
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
                  <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>{spec?.name}  {apptDetail.date} {apptDetail.time}</div>
                </div>
                <span style={{ fontSize:'0.72rem', fontWeight:700, padding:'3px 10px', borderRadius:'20px', background:`${statusColors[apptDetail.status]}20`, color:statusColors[apptDetail.status], border:`1px solid ${statusColors[apptDetail.status]}50` }}>
                  {statusLabels[apptDetail.status]}
                </span>
                <button onClick={() => setApptDetail(null)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.3rem 0.6rem', flexShrink:0 }}>Cerrar</button>
              </div>
              {/* Info */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {apptDetail.client_phone && (
                  <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.6rem 0.85rem', background:'rgba(255,255,255,0.04)', borderRadius:'8px', border:'1px solid var(--border)' }}>
                    <span style={{ fontSize:'1rem' }}>•</span>
                    <span style={{ fontSize:'0.875rem', flex:1 }}>{apptDetail.client_phone}</span>
                    <a href={`https://wa.me/${apptDetail.client_phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                      style={{ fontSize:'0.72rem', background:'rgba(37,211,102,0.15)', border:'1px solid rgba(37,211,102,0.3)', borderRadius:'6px', color:'#25d366', padding:'2px 8px', textDecoration:'none', fontWeight:600 }}>
                      WhatsApp
                    </a>
                  </div>
                )}
                {apptDetail.notes && (
                  <div style={{ display:'flex', gap:'0.6rem', padding:'0.6rem 0.85rem', background:'rgba(255,255,255,0.04)', borderRadius:'8px', border:'1px solid var(--border)' }}>
                    <span style={{ fontSize:'1rem', flexShrink:0 }}>•</span>
                    <span style={{ fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:1.4 }}>{apptDetail.notes}</span>
                  </div>
                )}
                {!apptDetail.client_phone && !apptDetail.notes && (
                  <p style={{ margin:0, fontSize:'0.8rem', color:'var(--text-secondary)', textAlign:'center' }}>Sin informacin adicional</p>
                )}
              </div>
              {/* Acciones */}
              {apptDetail.status === 'confirmed' && (
                <div style={{ display:'flex', gap:'0.6rem' }}>
                  <button onClick={() => { updateApptStatus(apptDetail.id,'completed'); setApptDetail(p => ({...p, status:'completed'})); }}
                    style={{ flex:1, background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.4)', borderRadius:'8px', color:'#60a5fa', cursor:'pointer', padding:'0.55rem', fontWeight:600, fontSize:'0.85rem' }}>
                    ? Completado
                  </button>
                  <button onClick={() => { updateApptStatus(apptDetail.id,'cancelled'); setApptDetail(p => ({...p, status:'cancelled'})); }}
                    style={{ flex:1, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.35)', borderRadius:'8px', color:'#f87171', cursor:'pointer', padding:'0.55rem', fontWeight:600, fontSize:'0.85rem' }}>
                    ? Cancelar
                  </button>
                </div>
              )}
              {apptDetail.status === 'cancelled' && (
                <button onClick={() => { updateApptStatus(apptDetail.id,'confirmed'); setApptDetail(p => ({...p, status:'confirmed'})); }}
                  style={{ width:'100%', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.35)', borderRadius:'8px', color:'#34d399', cursor:'pointer', padding:'0.55rem', fontWeight:600, fontSize:'0.85rem' }}>
                  ? Restaurar turno
                </button>
              )}
              <button onClick={() => deleteAppt(apptDetail.id)}
                style={{ width:'100%', marginTop:'0.5rem', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', color:'#f87171', cursor:'pointer', padding:'0.45rem', fontWeight:600, fontSize:'0.8rem' }}>
                Eliminar turno
              </button>
            </div>
          </div>
        );
      })()}

      {/* Header y tabs de vista */}
      <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:'0.4rem' }}>
          {[{id:'agenda',label:'Agenda'},{id:'especialidades',label:'Servicios'}].map(t => (
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

      {/* -- Vista: Horario tipo planilla -- */}
      {view === 'agenda' && (() => {
        const weekDays = getWeekDays(weekOffset);
        const todayStr = new Date().toISOString().slice(0,10);

        // Index appointments: {date_time: appointment}
        const apptIndex = {};
        appointments.forEach(a => { apptIndex[`${a.date}_${a.time}_${a.specialty_id}`] = a; });

        const activeSpec = specs.find(s => s.id === selectedSpecId);
        const { slots, dayMap } = activeSpec ? getTimeSlotsForSpec(activeSpec) : { slots:[], dayMap:{} };
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
                No hay servicios configurados. Crea uno en <strong>Servicios</strong>.
              </div>
            ) : (
              <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginBottom:'1rem' }}>
                {specs.map(spec => {
                  const confirmed = appointments.filter(a => a.specialty_id === spec.id && a.status==='confirmed').length;
                  const isActive = selectedSpecId === spec.id;
                  return (
                    <div key={spec.id} onClick={() => {
                      if (isActive) {
                        setAgendaCollapsed(v => !v);
                      } else {
                        setSelectedSpecId(spec.id);
                        setAgendaCollapsed(false);
                      }
                    }}
                      style={{ display:'flex', alignItems:'center', gap:'0.45rem', padding:'0.35rem 0.75rem', borderRadius:'20px', border:`1.5px solid ${isActive ? spec.color : 'var(--border)'}`, background: isActive ? `${spec.color}20` : 'var(--card-bg)', cursor:'pointer', transition:'all 0.15s' }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:spec.color, flexShrink:0 }} />
                      <span style={{ fontWeight:600, fontSize:'0.82rem', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace:'nowrap' }}>{spec.name}</span>
                      {confirmed > 0 && <span style={{ fontSize:'0.7rem', fontWeight:700, background:spec.color, color:'#fff', borderRadius:'10px', padding:'0 5px', lineHeight:'1.4' }}>{confirmed}</span>}
                      <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginLeft:'1px' }}>{isActive ? (agendaCollapsed ? 'Ver' : 'Minimizar') : 'Ver'}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grilla semanal */}
            {activeSpec && agendaCollapsed && (
              <PanelCard style={{ padding:'0.9rem 1rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap', borderColor:`${activeSpec.color}55` }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', minWidth:0 }}>
                  <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:activeSpec.color, flexShrink:0 }} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ color:'var(--text-primary)', fontWeight:850, fontSize:'0.95rem' }}>{activeSpec.name}</div>
                    <div style={{ color:'var(--text-secondary)', fontSize:'0.78rem', marginTop:'0.15rem' }}>
                      Semana del {new Date(weekDays[0]+'T12:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'})} al {new Date(weekDays[6]+'T12:00').toLocaleDateString('es-AR',{day:'numeric',month:'short',year:'numeric'})} · {appointments.filter(a => a.specialty_id === activeSpec.id && a.status === 'confirmed').length} turnos confirmados
                    </div>
                  </div>
                </div>
                <button onClick={() => setAgendaCollapsed(false)} style={{ border:'1px solid var(--border)', borderRadius:'9px', background:'var(--surface-2)', color:'var(--text-primary)', cursor:'pointer', padding:'0.55rem 0.8rem', fontWeight:800 }}>
                  Desplegar agenda
                </button>
              </PanelCard>
            )}
            {activeSpec && !agendaCollapsed && (
              <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>

                {/* Nav semana */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1rem', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
                  <button onClick={() => setWeekOffset(w => w-1)}
                    style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.25rem 0.6rem', fontSize:'1rem' }}></button>
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
                      style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.25rem 0.6rem', fontSize:'1rem' }}></button>
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
                              <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{DAYS_SHORT[i]}</div>
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
                                      {appt.client_name || ''}
                                    </div>
                                    {appt.client_phone && (
                                      <div style={{ fontSize:'0.62rem', color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'1px' }}>
                                        {appt.client_phone}
                                      </div>
                                    )}
                                    {appt.notes && (
                                      <div style={{ fontSize:'0.62rem', color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'1px', opacity:0.8 }}>
                                        {appt.notes}
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
                  <div style={{ marginLeft:'auto', fontSize:'0.72rem', color:'var(--text-secondary)' }}>Hac clic en un casillero vaco para crear un turno</div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* -- Vista: Servicios + Horarios -- */}
      {view === 'especialidades' && (
        <>
          {specs.length === 0 && (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px dashed var(--border)', borderRadius:'12px', padding:'2.5rem', textAlign:'center' }}>
              <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>WA</div>
              <p style={{ color:'var(--text-secondary)', margin:0 }}>Todava no configuraste ningn servicio. Cre uno arriba para que el asistente pueda gestionar turnos automaticamente.</p>
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
                    {spec.duration_minutes} min / turno{spec.capacity > 1 ? `  ${spec.capacity} lugares` : ''}
                  </span>
                  {spec.reminder_enabled ? (
                    <span style={{ fontSize:'0.72rem', color:'#10b981', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'20px', padding:'2px 8px' }}>
                      {(Array.isArray(spec.reminder_hours) ? spec.reminder_hours : [spec.reminder_hours]).join('h / ')}h antes
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
                    {DAYS.map((dayName, i) => {
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
                          {/* Checkbox + nombre da */}
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

                                {/* Botn + (solo en primer turno si hay 1 ventana) */}
                                {day.active && wi === 0 && day.windows.length === 1 && (
                                  <button onClick={() => addWindow(spec.id, i)}
                                    title="Agregar horario cortado"
                                    style={{ background:'rgba(255,255,255,0.07)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text-secondary)', cursor:'pointer', padding:'0.25rem 0.55rem', fontSize:'0.8rem', fontWeight:700, lineHeight:1 }}>+</button>
                                )}

                                {/* Botn - (solo en la segunda ventana) */}
                                {day.active && wi > 0 && (
                                  <button onClick={() => removeWindow(spec.id, i, wi)}
                                    title="Quitar este horario"
                                    style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'6px', color:'#f87171', cursor:'pointer', padding:'0.25rem 0.55rem', fontSize:'0.8rem', fontWeight:700, lineHeight:1 }}>-</button>
                                )}

                                {/* Contador de turnos (solo en ltima ventana) */}
                                {day.active && wi === day.windows.length - 1 && totalSlots > 0 && (
                                  <span style={{ fontSize:'0.71rem', color:'var(--text-secondary)', opacity:0.7 }}>{totalSlots} turnos/da</span>
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

// --- WidgetPanel --------------------------------------------------------------
function WidgetPanel({ botId, token, api }) {
  const [cfg, setCfg] = useState({ enabled: false, phone: '', welcomeMessage: '', buttonText: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    authFetch(`${api}/api/bots/${botId}/widget-config`, {}, token)
      .then(r => r.json())
      .then(d => { if (d && typeof d.enabled !== 'undefined') setCfg(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [botId, token, api]);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const r = await authFetch(`${api}/api/bots/${botId}/widget-config`, { method: 'POST', body: JSON.stringify(cfg) }, token);
      const d = await r.json();
      if (d.ok) setMsg({ ok: true, text: 'Configuracion guardada.' });
      else setMsg({ ok: false, text: d.error || 'Error al guardar.' });
    } catch { setMsg({ ok: false, text: 'Error de conexion.' }); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Cargando...</div>;

  const inputStyle = { width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', padding: '0.65rem 0.85rem', fontSize: '0.9rem', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.4rem' }}>Widget de WhatsApp</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1.75rem' }}>
        Aparece como botn flotante en tu tienda Shopify. Tus clientes hacen clic y te escriben directo por WhatsApp.
      </p>

      {/* Enable toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>Activar widget en la tienda</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Muestra el botn de WhatsApp en todas las pginas de tu tienda</div>
        </div>
        <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', flexShrink: 0 }}>
          <input type="checkbox" checked={cfg.enabled} onChange={e => setCfg(c => ({ ...c, enabled: e.target.checked }))} style={{ opacity: 0, width: 0, height: 0 }} />
          <span style={{ position: 'absolute', inset: 0, borderRadius: '99px', background: cfg.enabled ? 'linear-gradient(135deg,#7c3aed,#3b82f6)' : 'var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}>
            <span style={{ position: 'absolute', top: '3px', left: cfg.enabled ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
          </span>
        </label>
      </div>

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={labelStyle}>Nmero de WhatsApp <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={inputStyle} placeholder="5491123456789 (sin + ni espacios)" value={cfg.phone} onChange={e => setCfg(c => ({ ...c, phone: e.target.value }))} />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Codigo de pas + numero. Ej: 5491123456789 para Argentina</div>
        </div>
        <div>
          <label style={labelStyle}>Mensaje de bienvenida</label>
          <input style={inputStyle} placeholder="Hola! Tengo una consulta sobre su tienda." value={cfg.welcomeMessage} onChange={e => setCfg(c => ({ ...c, welcomeMessage: e.target.value }))} />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Texto que aparece pre-escrito cuando el cliente abre WhatsApp</div>
        </div>
        <div>
          <label style={labelStyle}>Texto del tooltip</label>
          <input style={inputStyle} placeholder="Chate con nosotros" value={cfg.buttonText} onChange={e => setCfg(c => ({ ...c, buttonText: e.target.value }))} />
        </div>
      </div>

      {/* Preview */}
      <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Vista previa del botn</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: cfg.enabled ? '#25d366' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: cfg.enabled ? '0 4px 20px rgba(37,211,102,0.4)' : 'none', flexShrink: 0, transition: 'all 0.2s' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cfg.buttonText || 'Chate con nosotros'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cfg.enabled ? '? Visible en tu tienda' : '? Desactivado'}</div>
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.ok ? '#10b981' : '#ef4444'}`, borderRadius: '10px', padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: msg.ok ? '#10b981' : '#ef4444' }}>
          {msg.text}
        </div>
      )}

      <button onClick={save} disabled={saving} style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: saving ? 'wait' : 'pointer', padding: '0.75rem 2rem', fontWeight: 700, fontSize: '0.95rem', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Guardando...' : 'Guardar configuracin'}
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------

function PaymentRemindersPanel({ botId, token, api, confirmAction }) {
  const [debtors, setDebtors] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', amount: '', dueDate: '', reminderFrequency: 'monthly', totalInstallments: '1', remindersEnabled: true, reminderTime: '10:00', note: '', reminderMessage: '', paymentKnowledge: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [msg, setMsg] = useState(null);
  const [installments, setInstallments] = useState([{ number: 1, amount: '', dueDate: '', status: 'pending' }]);
  const [reminderDaysBeforeList, setReminderDaysBeforeList] = useState([7, 0]);
  const [newReminderDay, setNewReminderDay] = useState('');
  const [expandedDebtors, setExpandedDebtors] = useState({});
  const previousInstallmentDefaultsRef = useRef({ amount: '', dueDate: '', frequency: 'monthly' });

  const loadDebtors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${api}/api/bots/${botId}/debtors`, {}, token);
      const data = await res.json();
      setDebtors(Array.isArray(data) ? data : []);
    } catch {
      setMsg({ ok: false, text: 'No se pudieron cargar los recordatorios.' });
    } finally {
      setLoading(false);
    }
  }, [api, botId, token]);

  useEffect(() => {
    loadDebtors();
  }, [loadDebtors]);

  const pending = debtors.filter(d => d.status === 'pending');
  const paid = debtors.filter(d => d.status === 'paid');
  const pendingTotal = pending.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const parseDateParts = useCallback((date) => {
    if (!date) return '';
    const [year, month, day] = date.split('-').map(Number);
    if (!year || !month || !day) return '';
    return { year, month, day };
  }, []);
  const formatDateParts = useCallback((year, month, day) => {
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }, []);
  const addDaysToDate = useCallback((date, days) => {
    const parts = parseDateParts(date);
    if (!parts) return '';
    const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
    d.setUTCDate(d.getUTCDate() + days);
    return formatDateParts(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }, [formatDateParts, parseDateParts]);
  const addMonthsToDate = useCallback((date, months) => {
    const parts = parseDateParts(date);
    if (!parts) return '';
    const monthIndex = parts.month - 1 + months;
    const year = parts.year + Math.floor(monthIndex / 12);
    const month = ((monthIndex % 12) + 12) % 12 + 1;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return formatDateParts(year, month, Math.min(parts.day, lastDay));
  }, [formatDateParts, parseDateParts]);

  useEffect(() => {
    const total = Math.max(1, Math.min(120, Number(form.totalInstallments) || 1));
    const previousDefaults = previousInstallmentDefaultsRef.current;
    const getDefaultDueDate = (baseDate, frequency, idx) => {
      if (frequency === 'weekly') return addDaysToDate(baseDate, idx * 7);
      if (frequency === 'biweekly') return addDaysToDate(baseDate, idx * 14);
      if (frequency === 'daily') return addDaysToDate(baseDate, idx);
      if (frequency === 'quarterly') return addMonthsToDate(baseDate, idx * 3);
      if (frequency === 'semiannual') return addMonthsToDate(baseDate, idx * 6);
      if (frequency === 'annual') return addMonthsToDate(baseDate, idx * 12);
      return addMonthsToDate(baseDate, idx);
    };
    setInstallments(prev => Array.from({ length: total }, (_, idx) => {
      const existing = prev[idx] || {};
      const dueDate = getDefaultDueDate(form.dueDate, form.reminderFrequency, idx);
      const previousDueDate = getDefaultDueDate(previousDefaults.dueDate, previousDefaults.frequency, idx);
      const amountWasCustomized = existing.amount && existing.amount !== previousDefaults.amount;
      const dueDateWasCustomized = existing.dueDate && existing.dueDate !== previousDueDate;
      return {
        number: idx + 1,
        amount: amountWasCustomized ? existing.amount : form.amount || '',
        dueDate: dueDateWasCustomized ? existing.dueDate : dueDate,
        status: existing.status || 'pending'
      };
    }));
    previousInstallmentDefaultsRef.current = {
      amount: form.amount || '',
      dueDate: form.dueDate || '',
      frequency: form.reminderFrequency || 'monthly'
    };
  }, [addDaysToDate, addMonthsToDate, form.amount, form.dueDate, form.reminderFrequency, form.totalInstallments]);

  async function createDebtor() {
    const payload = {
      name: form.name.trim(),
      phone: form.phone.replace(/[^\d]/g, ''),
      amount: form.amount,
      dueDate: form.dueDate,
      reminderFrequency: form.reminderFrequency,
      totalInstallments: Number(form.totalInstallments) || 1,
      reminderDaysBefore: Math.max(...reminderDaysBeforeList, 0),
      reminderDaysBeforeList,
      remindersEnabled: form.remindersEnabled,
      reminderTime: form.reminderTime || '10:00',
      installments,
      reminderMessage: form.reminderMessage.trim(),
      paymentKnowledge: form.paymentKnowledge.trim(),
      note: form.note.trim()
    };
    if (!payload.name || !payload.phone || !payload.amount) {
      setMsg({ ok: false, text: 'Completá nombre, WhatsApp y monto.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await authFetch(`${api}/api/bots/${botId}/debtors`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }, token);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el recordatorio.');
      setForm({ name: '', phone: '', amount: '', dueDate: '', reminderFrequency: 'monthly', totalInstallments: '1', remindersEnabled: true, reminderTime: '10:00', note: '', reminderMessage: '', paymentKnowledge: '' });
      setInstallments([{ number: 1, amount: '', dueDate: '', status: 'pending' }]);
      setReminderDaysBeforeList([7, 0]);
      setMsg({ ok: true, text: 'Recordatorio cargado. Atento enviará el aviso automático a las 10:00 AM.' });
      await loadDebtors();
    } catch (err) {
      setMsg({ ok: false, text: err.message || 'Error al guardar.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 4000);
    }
  }

  async function generateReminderMessage() {
    setGeneratingMessage(true);
    setMsg(null);
    try {
      const res = await authFetch(`${api}/api/bots/${botId}/debtors/generate-message`, {
        method: 'POST',
        body: JSON.stringify({
          name: form.name || 'Cliente',
          amount: form.amount || installments[0]?.amount || '',
          dueDate: form.dueDate || installments[0]?.dueDate || '',
          totalInstallments: Number(form.totalInstallments) || installments.length || 1,
          note: form.note
        })
      }, token);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo generar el mensaje.');
      setForm(f => ({ ...f, reminderMessage: data.message || f.reminderMessage }));
    } catch (err) {
      setMsg({ ok: false, text: err.message || 'No se pudo generar el mensaje.' });
    } finally {
      setGeneratingMessage(false);
    }
  }

  async function updateStatus(id, status, installmentNumber = null) {
    await authFetch(`${api}/api/bots/${botId}/debtors/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, installmentNumber })
    }, token);
    loadDebtors();
  }

  function addReminderDay() {
    const value = Math.max(0, Math.min(365, Number(newReminderDay)));
    if (!Number.isFinite(value)) return;
    setReminderDaysBeforeList(list => [...new Set([...list, Math.round(value)])].sort((a, b) => b - a));
    setNewReminderDay('');
  }

  function removeReminderDay(day) {
    setReminderDaysBeforeList(list => list.filter(item => item !== day));
  }

  function insertReminderVariable(variable) {
    setForm(f => ({
      ...f,
      reminderMessage: `${f.reminderMessage}${f.reminderMessage ? ' ' : ''}{{${variable}}}`
    }));
  }

  function previewReminderMessage() {
    const firstInstallment = installments[0] || {};
    const template = form.reminderMessage || 'Hola {{nombre}}, te recordamos la cuota {{cuota}}/{{total_cuotas}} por ${{monto}}, con vencimiento {{vencimiento}}.';
    return template
      .replace(/\{\{\s*nombre\s*\}\}/gi, form.name || 'Juan Perez')
      .replace(/\{\{\s*monto\s*\}\}/gi, firstInstallment.amount || form.amount || '5000')
      .replace(/\{\{\s*cuota\s*\}\}/gi, '1')
      .replace(/\{\{\s*total_cuotas\s*\}\}/gi, String(installments.length || form.totalInstallments || 1))
      .replace(/\{\{\s*vencimiento\s*\}\}/gi, firstInstallment.dueDate || form.dueDate || '2026-06-10')
      .replace(/\{\{\s*concepto\s*\}\}/gi, form.note || 'concepto del pago')
      .replace(/\{\{\s*negocio\s*\}\}/gi, 'tu negocio');
  }

  async function confirmInstallmentPaid(id, number) {
    const ok = await confirmAction({
      title: `Marcar cuota #${number} como cobrada`,
      message: 'Atento no enviará más recordatorios por esta cuota. ¿Confirmás que ya fue cobrada?',
      confirmText: 'Sí, marcar cobrada'
    });
    if (!ok) return;
    await updateStatus(id, 'paid', number);
  }

  async function removeDebtor(id) {
    const ok = await confirmAction({
      title: 'Borrar recordatorio',
      message: '¿Querés borrar este recordatorio de pago?',
      confirmText: 'Borrar',
      danger: true
    });
    if (!ok) return;
    await authFetch(`${api}/api/bots/${botId}/debtors/${id}`, { method: 'DELETE' }, token);
    loadDebtors();
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    color: 'var(--text-primary)',
    padding: '0.72rem 0.85rem',
    fontSize: '0.9rem',
    boxSizing: 'border-box'
  };
  const frequencyLabel = {
    daily: 'Diaria',
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    semiannual: 'Semestral',
    annual: 'Anual'
  };
  const parseInstallments = (value) => {
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const renderDebtor = (d) => {
    const debtorInstallments = parseInstallments(d.installments);
    const currentInstallment = Number(d.currentInstallment || 1);
    const totalInstallments = Number(d.totalInstallments || debtorInstallments.length || 1);
    const expanded = expandedDebtors[d.id] !== false;
    const currentItem = debtorInstallments[currentInstallment - 1] || {};
    const nextDueDate = currentItem.dueDate || d.dueDate || '-';
    const pendingInstallments = d.status === 'paid' ? 0 : Math.max(1, debtorInstallments.filter((item, idx) => item.status !== 'paid' && idx + 1 >= currentInstallment).length);

    return (
    <PanelCard key={d.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start', padding: '1rem' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.96rem' }}>{d.name}</strong>
          <span style={{ color: d.status === 'paid' ? 'var(--success)' : '#f59e0b', background: d.status === 'paid' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${d.status === 'paid' ? 'rgba(16,185,129,0.28)' : 'rgba(245,158,11,0.28)'}`, borderRadius: '999px', padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 800 }}>
            {d.status === 'paid' ? 'Pagado' : 'Pendiente'}
          </span>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.28rem', display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
          +{d.phone} · ${Number(d.amount || 0).toLocaleString('es-AR')}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.28rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>Cuota {currentInstallment}/{totalInstallments}</span>
          <span>Próximo vencimiento: {nextDueDate}</span>
          <span>Hora: {d.reminderTime || '10:00'}</span>
          <span>{pendingInstallments} pendiente{pendingInstallments === 1 ? '' : 's'}</span>
        </div>
        {expanded && (
          <>
        {d.dueDate && <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.22rem' }}>Vencimiento: {d.dueDate}</div>}
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.22rem' }}>
          Cuota actual: {currentInstallment}/{totalInstallments} · Cobro {frequencyLabel[d.reminderFrequency] || 'Mensual'} · Hora {d.reminderTime || '10:00'} · Avisos enviados: {Number(d.remindersSent || 0)}
        </div>
        {d.note && <div style={{ color: 'var(--text-3)', fontSize: '0.78rem', marginTop: '0.22rem' }}>{d.note}</div>}
        {debtorInstallments.length > 0 && (
          <div style={{ marginTop: '0.85rem', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', maxWidth: 760 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr 120px', gap: '0.5rem', padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.035)', color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 850, textTransform: 'uppercase' }}>
              <span>Cuota</span>
              <span>Monto</span>
              <span>Vence</span>
              <span>Estado</span>
            </div>
            {debtorInstallments.map((item, idx) => {
              const isPaid = item.status === 'paid' || idx + 1 < currentInstallment || d.status === 'paid';
              return (
                <div key={`${d.id}-${item.number || idx}`} style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr 120px', gap: '0.5rem', alignItems: 'center', padding: '0.55rem 0.7rem', borderTop: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>#{item.number || idx + 1}</strong>
                  <span>${Number(item.amount || d.amount || 0).toLocaleString('es-AR')}</span>
                  <span>{item.dueDate || d.dueDate || '-'}</span>
                  {isPaid ? (
                    <span style={{ justifySelf: 'start', color: 'var(--success)', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)', borderRadius: '999px', padding: '0.18rem 0.5rem', fontSize: '0.7rem', fontWeight: 850 }}>Cobrada</span>
                  ) : (
                    <button onClick={() => confirmInstallmentPaid(d.id, item.number || idx + 1)} style={{ justifySelf: 'start', color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.32)', borderRadius: '999px', padding: '0.25rem 0.6rem', fontSize: '0.72rem', fontWeight: 850, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      Pendiente <CheckCircle2 size={13} color="var(--success)" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button onClick={() => setExpandedDebtors(prev => ({ ...prev, [d.id]: expanded ? false : true }))} style={{ border: '1px solid var(--border)', borderRadius: '9px', background: 'var(--surface-2)', color: 'var(--text-secondary)', padding: '0.55rem 0.75rem', cursor: 'pointer', fontWeight: 800 }}>
          {expanded ? 'Minimizar' : 'Ver cuotas'}
        </button>
        {d.status === 'pending' && totalInstallments <= 1 && (
          <button onClick={() => updateStatus(d.id, 'paid')} style={{ border: 'none', borderRadius: '9px', background: 'rgba(16,185,129,0.16)', color: 'var(--success)', padding: '0.55rem 0.75rem', cursor: 'pointer', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={15} /> Pagó
          </button>
        )}
        <button onClick={() => removeDebtor(d.id)} aria-label="Borrar recordatorio" style={{ border: '1px solid var(--danger-border)', borderRadius: '9px', background: 'transparent', color: 'var(--danger)', padding: '0.55rem 0.65rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
          <Trash2 size={15} />
        </button>
      </div>
    </PanelCard>
  );
  };

  return (
    <div id="tour-payments-area">
      <SectionHeader
        icon={<CircleDollarSign size={18} />}
        tone="amber"
        title="Recordatorios de pago"
        desc="Agendá cuotas o pagos recurrentes y definí desde cuántos días antes Atento debe recordarlos."
        action={<button onClick={loadDebtors} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}>Actualizar</button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
        <PanelCard style={{ padding: '1rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800 }}>Pendientes</div>
          <div style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 900, marginTop: '0.2rem' }}>{pending.length}</div>
        </PanelCard>
        <PanelCard style={{ padding: '1rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800 }}>Monto pendiente</div>
          <div style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 900, marginTop: '0.2rem' }}>${pendingTotal.toLocaleString('es-AR')}</div>
        </PanelCard>
        <PanelCard style={{ padding: '1rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800 }}>Pagados</div>
          <div style={{ color: 'var(--success)', fontSize: '1.75rem', fontWeight: 900, marginTop: '0.2rem' }}>{paid.length}</div>
        </PanelCard>
      </div>

      <PanelCard style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <IconBox tone="amber"><CircleDollarSign size={19} /></IconBox>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 850 }}>Nuevo pago pendiente</h2>
            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Indicá monto por cuota, cantidad de cuotas, frecuencia de cobro y cuántos días antes avisar.</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.75rem' }}>
          {[
            ['Nombre del cliente', <input style={inputStyle} placeholder="Ej: Juan Perez" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />],
            ['WhatsApp del cliente', <input style={inputStyle} inputMode="tel" placeholder="5491122334455" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />],
            ['Monto base por cuota', <input style={inputStyle} inputMode="decimal" type="number" placeholder="Ej: 20000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />],
            ['Primer vencimiento', <input style={inputStyle} type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />],
            ['Frecuencia de cobro', <select style={inputStyle} value={form.reminderFrequency} onChange={e => setForm(f => ({ ...f, reminderFrequency: e.target.value }))}>
              <option style={{ color: '#111827', background: '#fff' }} value="monthly">Mensual</option>
              <option style={{ color: '#111827', background: '#fff' }} value="weekly">Semanal</option>
              <option style={{ color: '#111827', background: '#fff' }} value="biweekly">Quincenal</option>
              <option style={{ color: '#111827', background: '#fff' }} value="quarterly">Trimestral</option>
              <option style={{ color: '#111827', background: '#fff' }} value="semiannual">Semestral</option>
              <option style={{ color: '#111827', background: '#fff' }} value="annual">Anual</option>
              <option style={{ color: '#111827', background: '#fff' }} value="daily">Diaria</option>
            </select>],
            ['Cantidad de cuotas', <input style={inputStyle} inputMode="numeric" type="number" min="1" max="120" placeholder="Ej: 12" value={form.totalInstallments} onChange={e => setForm(f => ({ ...f, totalInstallments: e.target.value }))} />],
            ['Hora de envío', <input style={inputStyle} type="time" value={form.reminderTime} onChange={e => setForm(f => ({ ...f, reminderTime: e.target.value }))} />],
          ].map(([label, field]) => (
            <label key={label} style={{ display: 'grid', gap: '0.35rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 750 }}>{label}</span>
              {field}
            </label>
          ))}
        </div>
        <div style={{ marginTop: '1rem', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '12px', padding: '0.9rem', background: form.remindersEnabled ? 'rgba(124,58,237,0.055)' : 'rgba(148,163,184,0.06)', opacity: form.remindersEnabled ? 1 : 0.72 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 850, fontSize: '0.9rem' }}>Preavisos automáticos</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{form.remindersEnabled ? `Elegí cuántos días antes del vencimiento se envía cada aviso. Usá 0 para avisar el mismo día. Todos se envían a las ${form.reminderTime || '10:00'}.` : 'Activá esta opción si querés que Atento envíe recordatorios automáticos por WhatsApp.'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <button type="button" onClick={() => setForm(f => ({ ...f, remindersEnabled: !f.remindersEnabled }))} aria-label={form.remindersEnabled ? 'Desactivar preavisos' : 'Activar preavisos'} aria-pressed={form.remindersEnabled} style={{ border: 'none', background: 'transparent', padding: 0, display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                <span style={{ width: 42, height: 24, borderRadius: 999, background: form.remindersEnabled ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : '#334155', padding: 3, boxSizing: 'border-box', display: 'inline-flex', justifyContent: form.remindersEnabled ? 'flex-end' : 'flex-start', alignItems: 'center', transition: 'all 160ms ease', boxShadow: form.remindersEnabled ? '0 0 16px rgba(124,58,237,0.45)' : 'inset 0 0 0 1px rgba(148,163,184,0.18)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px rgba(15,23,42,0.25)', display: 'block' }} />
                </span>
              </button>
              <button type="button" onClick={addReminderDay} disabled={!form.remindersEnabled} style={{ width: 34, height: 30, border: 'none', borderRadius: '8px', background: form.remindersEnabled ? 'linear-gradient(135deg,#8b5cf6,#3b82f6)' : 'var(--surface-2)', color: '#fff', fontWeight: 900, cursor: form.remindersEnabled ? 'pointer' : 'not-allowed' }}>+</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
            {reminderDaysBeforeList.map(day => (
              <button key={day} type="button" disabled={!form.remindersEnabled} onClick={() => removeReminderDay(day)} title="Quitar preaviso" style={{ border: '1px solid rgba(124,58,237,0.3)', borderRadius: '9px', background: 'var(--input-bg)', color: 'var(--text-primary)', padding: '0.5rem 0.75rem', cursor: form.remindersEnabled ? 'pointer' : 'not-allowed' }}>
                {day} día{day === 1 ? '' : 's'} antes
              </button>
            ))}
            <input style={{ ...inputStyle, width: 130 }} disabled={!form.remindersEnabled} inputMode="numeric" type="number" min="0" max="365" placeholder="Días antes" value={newReminderDay} onChange={e => setNewReminderDay(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addReminderDay(); } }} />
          </div>
        </div>
        <div style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.025)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr', gap: '0.75rem', padding: '0.75rem 0.9rem', color: 'var(--text-secondary)', fontSize: '0.76rem', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
            <span>Cuota</span><span>Monto</span><span>Vencimiento</span>
          </div>
          {installments.map((item, idx) => (
            <div key={item.number} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr', gap: '0.75rem', alignItems: 'center', padding: '0.65rem 0.9rem', borderBottom: idx === installments.length - 1 ? 'none' : '1px solid var(--border)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>#{item.number}</strong>
              <input style={inputStyle} inputMode="decimal" type="number" value={item.amount} onChange={e => setInstallments(list => list.map((it, i) => i === idx ? { ...it, amount: e.target.value } : it))} />
              <input style={inputStyle} type="date" value={item.dueDate} onChange={e => setInstallments(list => list.map((it, i) => i === idx ? { ...it, dueDate: e.target.value } : it))} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.55rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 850 }}>Mensaje que recibe el cliente</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Atento reemplaza automáticamente los datos de cada cuota antes de enviar.</div>
            </div>
            <button type="button" onClick={generateReminderMessage} disabled={generatingMessage} style={{ border: '1px solid rgba(124,58,237,0.35)', borderRadius: '9px', background: 'rgba(124,58,237,0.14)', color: 'var(--accent)', padding: '0.55rem 0.75rem', fontWeight: 850, cursor: generatingMessage ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <BrainCircuit size={15} /> {generatingMessage ? 'Generando...' : 'Generar con IA'}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {[
              ['nombre', 'Nombre'],
              ['monto', 'Monto'],
              ['cuota', 'Cuota actual'],
              ['total_cuotas', 'Total cuotas'],
              ['vencimiento', 'Vencimiento'],
              ['concepto', 'Concepto'],
              ['negocio', 'Negocio']
            ].map(([key, label]) => (
              <button key={key} type="button" onClick={() => insertReminderVariable(key)} style={{ border: '1px solid var(--border)', borderRadius: '999px', background: 'var(--surface-2)', color: 'var(--text-secondary)', padding: '0.32rem 0.6rem', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer' }}>
                + {label}
              </button>
            ))}
          </div>
          <textarea style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }} placeholder="Hola {{nombre}}, te recordamos la cuota {{cuota}}/{{total_cuotas}} por ${{monto}}, con vencimiento {{vencimiento}}." value={form.reminderMessage} onChange={e => setForm(f => ({ ...f, reminderMessage: e.target.value }))} />
          <div style={{ border: '1px solid rgba(16,185,129,0.22)', background: 'rgba(16,185,129,0.07)', borderRadius: '10px', padding: '0.75rem 0.85rem' }}>
            <div style={{ color: 'var(--success)', fontSize: '0.74rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Vista previa</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.84rem', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{previewReminderMessage()}</div>
          </div>
        </div>
        <textarea style={{ ...inputStyle, minHeight: 78, marginTop: '0.75rem', resize: 'vertical' }} placeholder="Concepto del cobro: pedido, detalle de la cuota o aclaración que puede aparecer en el mensaje" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
        <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.4rem' }}>
          <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 850 }}>Conocimiento para respuestas de cobro</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Usalo para decirle a Atento cómo responder si el cliente contesta el recordatorio.</div>
          <textarea
            style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }}
            placeholder={`Ej: Si dice que ya pagó, pedir comprobante. Alias: atento.mp. Si pide prórroga, ofrecer hasta 48 hs y avisar que se consulta con administración. No confirmar pagos sin validación del dueño.`}
            value={form.paymentKnowledge}
            onChange={e => setForm(f => ({ ...f, paymentKnowledge: e.target.value }))}
          />
        </div>
        {msg && (
          <div style={{ marginTop: '0.75rem', border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.35)' : 'var(--danger-border)'}`, background: msg.ok ? 'rgba(16,185,129,0.09)' : 'var(--danger-dim)', color: msg.ok ? 'var(--success)' : 'var(--danger)', borderRadius: '10px', padding: '0.65rem 0.8rem', fontSize: '0.85rem' }}>
            {msg.text}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.9rem' }}>
          <button onClick={createDebtor} disabled={saving} className="btn-solid-blue" style={{ width: 'auto', marginTop: 0, padding: '0.7rem 1rem' }}>
            {saving ? 'Guardando...' : 'Cargar recordatorio'}
          </button>
        </div>
      </PanelCard>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {loading ? (
          <PanelCard style={{ color: 'var(--text-secondary)' }}>Cargando recordatorios...</PanelCard>
        ) : debtors.length ? (
          debtors.map(renderDebtor)
        ) : (
          <PanelCard style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            <CircleDollarSign size={30} style={{ marginBottom: '0.6rem', color: '#f59e0b' }} />
            <div style={{ color: 'var(--text-primary)', fontWeight: 850, marginBottom: '0.25rem' }}>No hay pagos pendientes cargados</div>
            <div style={{ fontSize: '0.86rem' }}>Cargá un cliente, monto y WhatsApp para que Atento lo recuerde automáticamente.</div>
          </PanelCard>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------

export default function MerchantPanel() {
  const nav = useNavigate();
  const token = localStorage.getItem('merchant_token');
  const botId = localStorage.getItem('merchant_bot_id');
  const { confirmAction, confirmDialog } = useAtentoConfirm();

  const [bot, setBot] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [hours, setHours] = useState({ active: false, start: '09:00', end: '18:00', autoReplyMsg: '' });
  const [qrData, setQrData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [starting, setStarting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
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
  const [expandedField, setExpandedField] = useState(null); // 'prompt' | 'kb'
  const [responseDelay, setResponseDelay] = useState(2.5);
  const [humanHandoff, setHumanHandoff] = useState(DEFAULT_HUMAN_HANDOFF);
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'chats' | 'metrics' | 'campaigns' | 'payments' | 'turnos'
  const [configSection, setConfigSection] = useState('assistant');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showTour, setShowTour] = useState(() => !localStorage.getItem('atento_tour_done'));
  const [theme, setTheme] = useState(() => localStorage.getItem('atento_theme') || 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pollRef = useRef(null);

  // Meta Config (Instagram/Facebook)
  const [, setMetaPageId] = useState('');
  const [, setMetaIgId] = useState('');

  // Telegram Config
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramSaving, setTelegramSaving] = useState(false);
  const [telegramMsg, setTelegramMsg] = useState(null);
  const [telegramHelpOpen, setTelegramHelpOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('atento_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!token || !botId) { nav('/registro'); return; }
    loadBot();
    // Handle OAuth callback params
    const params = new URLSearchParams(window.location.search);
    if (params.get('meta_ok') || params.get('meta_error')) {
      window.history.replaceState({}, '', '/mi-panel');
    }
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
      if (m.responseDelay !== undefined) setResponseDelay(m.responseDelay);
      if (m.humanHandoff) {
        setHumanHandoff({
          ...DEFAULT_HUMAN_HANDOFF,
          ...m.humanHandoff,
          triggers: { ...DEFAULT_HUMAN_HANDOFF.triggers, ...(m.humanHandoff.triggers || {}) }
        });
      }
      const kb = data.knowledgeBase || '';
      setKnowledgeBase(kb);
      const catMatch = kb.match(/\[CATALOGO\]([\s\S]*?)(?=\n\[|$)/i);
      setCatalog(catMatch ? catMatch[1].trim() : '');

      if (data.metaPageId) setMetaPageId(data.metaPageId);
      if (data.metaIgId) setMetaIgId(data.metaIgId);
      if (data.telegramBotToken) setTelegramBotToken(data.telegramBotToken);
    } catch {
      nav('/registro');
    }
  }

  async function changePassword() {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) { setPwMsg({ ok: false, text: 'Complet todos los campos.' }); return; }
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ ok: false, text: 'Las contrasenas nuevas no coinciden.' }); return; }
    if (pwForm.next.length < 6) { setPwMsg({ ok: false, text: 'Minimo 6 caracteres.' }); return; }
    setPwSaving(true); setPwMsg(null);
    try {
      const res = await authFetch(`${API}/api/merchant/password`, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next })
      }, token);
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ ok: true, text: 'Contrasena actualizada.' });
        setPwForm({ current: '', next: '', confirm: '' });
      } else {
        setPwMsg({ ok: false, text: data.error || 'Error al cambiar la contrasena.' });
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
        body: JSON.stringify({ prompt, workingHours: hours, knowledgeBase, adminNumber, responseDelay, humanHandoff })
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

  async function saveTelegramConfig() {
    setTelegramSaving(true); setTelegramMsg(null);
    try {
      const res = await authFetch(`${API}/api/bots/${botId}/telegram`, {
        method: 'PUT',
        body: JSON.stringify({ token: telegramBotToken })
      }, token);
      const data = await res.json();
      if (res.ok) {
        setTelegramMsg({ ok: true, text: '? ' + data.message });
      } else {
        setTelegramMsg({ ok: false, text: `? ${data.error || 'Error al conectar.'}` });
      }
    } catch {
      setTelegramMsg({ ok: false, text: 'Error de conexion.' });
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
        setImportMsg({ ok: true, text: `? ${data.count} productos importados.`, preview: data.preview });
      } else {
        setImportMsg({ ok: false, text: `${data.error}` });
      }
    } catch {
      setImportMsg({ ok: false, text: 'Error al conectar con el servidor.' });
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

  async function unlinkWhatsApp() {
    const ok = await confirmAction({
      title: 'Cerrar sesión de WhatsApp',
      message: '¿Querés cerrar la sesión de WhatsApp? Deberás escanear el QR nuevamente para reconectar.',
      confirmText: 'Cerrar sesión',
      danger: true
    });
    if (!ok) return;
    setUnlinking(true);
    await authFetch(`${API}/api/bots/${botId}/logout`, { method: 'POST' }, token);
    setBot(b => ({ ...b, status: 'OFF' }));
    setQrData(null);
    setStarting(false);
    if (pollRef.current) clearInterval(pollRef.current);
    setUnlinking(false);
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
    } catch (_e) { /* ignore poll errors */ }
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
  const planLimits = { starter: 1500, growth: 5000, scale: 20000 };
  const usage = bot.usage || {
    plan: bot.plan || 'starter',
    used: bot.monthlyMessages || 0,
    limit: planLimits[bot.plan || 'starter'] ?? 1500,
    unlimited: (bot.plan || 'starter') === 'scale'
  };
  const usageLimit = usage.limit;
  const usageUsed = usage.used || 0;
  const usagePct = usageLimit ? Math.min(100, Math.round((usageUsed / usageLimit) * 100)) : 0;
  const planName = (usage.plan || 'starter').charAt(0).toUpperCase() + (usage.plan || 'starter').slice(1);

  const expandedValue = expandedField === 'prompt' ? prompt : knowledgeBase;
  const expandedSetter = expandedField === 'prompt' ? setPrompt : setKnowledgeBase;
  const expandedTitle = expandedField === 'prompt' ? 'Comportamiento Psicologico' : 'Base de Conocimientos';
  const expandedDesc = expandedField === 'prompt'
    ? 'Edita la personalidad, el tono y las reglas principales del asistente.'
    : 'Edita la informacion fija que Atento usa para responder sobre productos, precios, envios y condiciones.';

  const TOUR_STEPS = [
    { id: 'tour-tabs',           tab: 'config',    title: 'Menú principal',              desc: 'El panel se organiza por secciones: configuración, chats, métricas, campañas, cobros y turnos. Desde acá cambiás rápido de área.' },
    { id: 'tour-config-area',    tab: 'config',    title: 'Configuración del asistente', desc: 'Acá definís cómo habla tu asistente, cargás la base de conocimiento, conectás catálogo y preparás las reglas principales del negocio.' },
    { id: 'tour-status',         tab: 'config',    title: 'WhatsApp y estado',           desc: 'Con este boton conectas WhatsApp por QR, pausas el asistente o lo vuelves a activar cuando quieras.' },
    { id: 'tour-preview-area',   tab: 'config',    title: 'Probar asistente',            desc: 'Usa este chat para probar respuestas antes de dejarlo contestando clientes reales. Sirve para ajustar personalidad, precios y condiciones.' },
    { id: 'tour-chats-header',   tab: 'chats',     title: 'Chats respondidos',           desc: 'Acá ves las conversaciones que está contestando el asistente, con historial de mensajes y canal de origen.' },
    { id: 'tour-metrics-header', tab: 'metrics',   title: 'Métricas del asistente',      desc: 'Acá controlás clientes atendidos, tasa de respuesta, horarios pico, canales, temas frecuentes y uso mensual del plan.' },
    { id: 'tour-campaigns-header', tab: 'campaigns', title: 'Campañas de mensajería',    desc: 'Desde acá podés enviar mensajes masivos a una lista de clientes. Cargás contactos manualmente, por CSV o Google Sheets.' },
    { id: 'tour-payments-area',  tab: 'payments',  title: 'Recordatorios de pago',       desc: 'Agendá clientes con pagos pendientes para que Atento les envíe un recordatorio automático por WhatsApp.' },
    { id: 'tour-turnos-area',    tab: 'turnos',    title: 'Gestion de turnos',           desc: 'Si tu negocio da turnos, aca configuras servicios, horarios y capacidad para que el asistente pueda reservar automaticamente.' },
  ];

  function replayTour() {
    localStorage.removeItem('atento_tour_done');
    setActiveTab('config');
    setSidebarOpen(false);
    setShowTour(true);
  }

  return (
    <>
      {confirmDialog}
      {showTour && <TourOverlay steps={TOUR_STEPS} onFinish={() => setShowTour(false)} setActiveTab={setActiveTab} />}

      {/* Modal expandido */}
      {expandedField && (
        <div
          onClick={() => setExpandedField(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.68)', backdropFilter: 'blur(7px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(1rem, 3vw, 2rem)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: 'min(980px, 100%)', maxHeight: '82vh', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '18px', boxShadow: '0 26px 90px rgba(15,23,42,0.34)', padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 850, fontSize: '1.02rem', color: 'var(--text-1)' }}>{expandedTitle}</span>
                <span style={{ display: 'block', color: 'var(--text-2)', fontSize: '0.82rem', marginTop: '0.18rem', lineHeight: 1.45 }}>{expandedDesc}</span>
              </div>
              <button onClick={() => setExpandedField(null)} style={{ width: 36, height: 36, flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-2)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>
                X
              </button>
            </div>
            <textarea
              className="prompt-textarea editable"
              style={{ minHeight: 'min(560px, 58vh)', maxHeight: '58vh', resize: 'vertical', fontSize: '0.9rem', lineHeight: 1.62, background: 'var(--input-bg)', color: 'var(--text-1)', borderColor: 'var(--border-strong)' }}
              value={expandedValue}
              onChange={e => expandedSetter(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button onClick={() => setExpandedField(null)} style={{ border: '1px solid var(--border-strong)', background: 'var(--surface-2)', color: 'var(--text-2)', borderRadius: '10px', padding: '0.62rem 0.95rem', cursor: 'pointer', fontWeight: 750 }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {previewOpen && (
        <div
          onClick={() => setPreviewOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.82)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: 'min(390px, 100%)', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 850 }}>Probar asistente</h2>
                <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>Simulación con la configuración actual.</p>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                style={{ width: 36, height: 36, borderRadius: '10px', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: '1.15rem', lineHeight: 1 }}
                aria-label="Cerrar prueba"
              >
                ×
              </button>
            </div>
            <BotPreviewChat
              botId={botId}
              token={token}
              botName={bot?.name}
              currentPrompt={prompt}
              currentKB={knowledgeBase}
              embedded
            />
          </div>
        </div>
      )}
      <div className="app-shell">
        <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
        {/* -- Sidebar -- */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon"><img src="/atento-logo.png" alt="Atento AI" /></div>
            Atento AI
          </div>
          <nav className="sidebar-nav" id="tour-tabs">
            <span className="sidebar-nav-section">Principal</span>
            <div className={`sidebar-nav-item${activeTab === 'config' ? ' active' : ''}`} onClick={() => { setActiveTab('config'); setSidebarOpen(false); }}><Settings size={16} /> Configuración</div>
            <div className={`sidebar-nav-item${activeTab === 'chats' ? ' active' : ''}`} onClick={() => { setActiveTab('chats'); setSidebarOpen(false); }}><MessageCircle size={16} /> Chats</div>
            <div className={`sidebar-nav-item${activeTab === 'metrics' ? ' active' : ''}`} onClick={() => { setActiveTab('metrics'); setSidebarOpen(false); }}><PlugZap size={16} /> Métricas</div>
            <div className={`sidebar-nav-item${activeTab === 'campaigns' ? ' active' : ''}`} onClick={() => { setActiveTab('campaigns'); setSidebarOpen(false); }}><Send size={16} /> Campañas</div>
            <div className={`sidebar-nav-item${activeTab === 'payments' ? ' active' : ''}`} onClick={() => { setActiveTab('payments'); setSidebarOpen(false); }}><CircleDollarSign size={16} /> Cobros</div>
            <div className={`sidebar-nav-item${activeTab === 'turnos' ? ' active' : ''}`} onClick={() => { setActiveTab('turnos'); setSidebarOpen(false); }}><CalendarClock size={16} /> Turnos</div>
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-avatar">{(bot?.name || 'U').charAt(0).toUpperCase()}</div>
              <div>
                <div className="sidebar-user-name">{bot?.name || 'Mi negocio'}</div>
                <div className="sidebar-user-role">Merchant</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', paddingTop: '0.2rem' }}>
              <a href="/olvide-contrasena" style={{ fontSize: '0.75rem', color: 'var(--text-3)', textDecoration: 'none', padding: '0.2rem 0.1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>Olvide mi contrasena</a>
              <button
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.55rem 0.85rem', cursor: 'pointer', color: 'var(--text-2)', fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.15s' }}
              >
                {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#818cf8" />}
                <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
              </button>
              <button
                onClick={replayTour}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.55rem 0.85rem', cursor: 'pointer', color: 'var(--text-2)', fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.15s', textAlign: 'left' }}
              >
                <HelpCircle size={15} color="#60a5fa" />
                <span>Ver tour</span>
              </button>
              <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', background: 'transparent', border: '1px solid var(--danger-border)', borderRadius: '8px', padding: '0.55rem 0.85rem', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.15s', textAlign: 'left' }}>Cerrar sesion</button>
            </div>
          </div>
        </aside>

        {/* -- Main -- */}
        <main className="main-content" style={{ overflow: 'auto' }}>
          <div style={{ padding: 'clamp(1rem, 3vw, 2rem)' }}>
            <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu" style={{ marginBottom: '1rem' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="4.5" x2="16" y2="4.5" />
                <line x1="2" y1="9" x2="16" y2="9" />
                <line x1="2" y1="13.5" x2="16" y2="13.5" />
              </svg>
            </button>
            {activeTab === 'campaigns' && <CampaignPanel botId={botId} token={token} api={API} confirmAction={confirmAction} />}
            {activeTab === 'chats' && <MerchantChatsPanel botId={botId} token={token} api={API} />}
            {activeTab === 'metrics' && <MerchantMetricsPanel botId={botId} token={token} api={API} bot={bot} />}
            {activeTab === 'payments' && <PaymentRemindersPanel botId={botId} token={token} api={API} confirmAction={confirmAction} />}
            {activeTab === 'turnos' && <div id="tour-turnos-area"><TurnosPanel botId={botId} token={token} api={API} confirmAction={confirmAction} /></div>}

          {activeTab === 'config' && (<>

          <PanelCard style={{ marginBottom: '1rem', padding: '1.25rem 1.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <IconBox tone={isOn ? 'green' : starting ? 'amber' : 'blue'}>
                  {isOn ? <Wifi size={20} /> : starting ? <Clock size={20} /> : <Bot size={20} />}
                </IconBox>
                <div>
                  <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.65rem', fontWeight: 850, letterSpacing: 0 }}>Asistente Manager</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 750 }}>{bot.name}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: isOn ? '#34d399' : starting ? '#f59e0b' : 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOn ? '#10b981' : starting ? '#f59e0b' : '#64748b' }} />
                      {isOn ? 'Activo' : starting ? 'Conectando' : 'Pausado'}
                    </span>
                    <span style={{ background: 'rgba(59,130,246,0.14)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.24)', fontSize: '0.66rem', padding: '2px 8px', borderRadius: 999, fontWeight: 800 }}>PLAN {planName.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div id="tour-status" style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {isOn ? (
                  <>
                    <button onClick={stopBot} style={{ padding: '0.65rem 0.95rem', borderRadius: '9px', border: '1px solid rgba(239,68,68,0.55)', background: 'rgba(239,68,68,0.08)', color: '#f87171', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <WifiOff size={16} /> Detener
                    </button>
                    <button onClick={unlinkWhatsApp} disabled={unlinking} style={{ padding: '0.65rem 0.95rem', borderRadius: '9px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700 }}>
                      {unlinking ? 'Desvinculando...' : 'Desvincular'}
                    </button>
                  </>
                ) : (
                  <button onClick={startBot} disabled={starting} className="btn-solid-blue" style={{ margin: 0, width: 'auto', padding: '0.68rem 1rem', fontSize: '0.88rem', opacity: starting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Smartphone size={16} /> {starting ? 'Iniciando...' : 'Conectar WhatsApp'}
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '0.75rem' }}>
              <MetricPill icon={<MessageCircle size={16} />} value={(metrics.messagesSent || 0).toLocaleString()} label="Mensajes respondidos" />
              <MetricPill icon={<Bot size={16} />} value={(metrics.customersHelped || 0).toLocaleString()} label="Chats atendidos" />
              <MetricPill icon={<CheckCircle2 size={16} />} value={(metrics.weeklySales || 0).toLocaleString()} label="Conversiones" />
              <div style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.65rem 0.75rem', minWidth: 190 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem', fontWeight: 750 }}>Uso mensual</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 850 }}>
                    {usageUsed.toLocaleString()} / {usageLimit ? usageLimit.toLocaleString() : 'ilimitados'}
                  </span>
                </div>
                {usageLimit && (
                  <div style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${usagePct}%`, height: '100%', borderRadius: 999, background: usagePct >= 90 ? '#f87171' : usagePct >= 75 ? '#f59e0b' : 'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />
                  </div>
                )}
                <p style={{ margin: '0.45rem 0 0', color: usagePct >= 90 ? '#f87171' : 'var(--text-secondary)', fontSize: '0.72rem' }}>
                  {usageLimit ? `${Math.max(0, usageLimit - usageUsed).toLocaleString()} disponibles` : 'Mensajes sin limite'}
                </p>
              </div>
            </div>
          </PanelCard>

          {(starting || isOn) && (
            <PanelCard style={{ marginBottom: '1rem', borderColor: isOn ? 'rgba(16,185,129,0.24)' : 'var(--border)' }}>
              <SectionHeader
                icon={isOn ? <Wifi size={18} /> : <Smartphone size={18} />}
                tone={isOn ? 'green' : 'blue'}
                title={isOn ? 'WhatsApp conectado' : 'Conectar WhatsApp'}
                desc={isOn ? 'El asistente esta activo y responde automaticamente.' : 'Escanea el codigo desde WhatsApp para vincular el numero del negocio.'}
              />
              {starting && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', padding: '0.5rem 0 0.2rem' }}>
                  {qrData ? (
                    <>
                      <div style={{ background: 'white', padding: 12, borderRadius: 14, border: '4px solid rgba(124,58,237,0.65)', boxShadow: '0 10px 30px rgba(0,0,0,0.24)' }}>
                        <QRCodeSVG value={qrData} size={178} />
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0, textAlign: 'center' }}>
                        WhatsApp &gt; Dispositivos vinculados &gt; Vincular dispositivo.
                      </p>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', padding: '0.75rem' }}>
                      <Clock size={18} />
                      <span style={{ fontSize: '0.9rem' }}>Generando codigo QR...</span>
                    </div>
                  )}
                </div>
              )}
            </PanelCard>
          )}

          <PanelCard style={{ marginBottom: '1rem', padding: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(210px,100%),1fr))', gap: '0.55rem' }}>
              {CONFIG_SECTIONS.map(section => {
                const active = configSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setConfigSection(section.id)}
                    style={{
                      textAlign: 'left',
                      border: `1px solid ${active ? section.color : 'var(--border)'}`,
                      background: active ? section.bg : 'rgba(255,255,255,0.035)',
                      color: 'var(--text-primary)',
                      borderRadius: '10px',
                      padding: '0.75rem 0.85rem',
                      cursor: 'pointer',
                      boxShadow: active ? `0 0 0 1px ${section.color}22, 0 10px 24px ${section.color}18` : 'none'
                    }}
                  >
                    <span style={{ display: 'block', fontWeight: 850, fontSize: '0.88rem', marginBottom: '0.18rem', color: active ? section.color : 'var(--text-primary)' }}>{section.label}</span>
                    <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.74rem', lineHeight: 1.35 }}>{section.desc}</span>
                  </button>
                );
              })}
            </div>
          </PanelCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '920px', margin: '0 auto', alignItems: 'stretch' }}>
          <div style={{ display: configSection === 'connections' ? 'none' : 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>

          {configSection === 'assistant' && <PanelCard id="tour-config-area">
          <SectionHeader
            icon={<BrainCircuit size={18} />}
            tone="violet"
            title="Personalidad del asistente"
            desc='Defini como saluda, que tono usa y que reglas debe respetar cuando responde.'
            action={<button onClick={() => setExpandedField('prompt')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>Expandir <ExternalLink size={13} /></button>}
          />
          <textarea
            className="prompt-textarea editable"
            style={{ minHeight: '110px' }}
            value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder="Describi como debe hablar y comportarse el asistente con tus clientes..."
          />
          </PanelCard>}

          {configSection === 'knowledge' && <PanelCard>
          <SectionHeader
            icon={<Database size={18} />}
            tone="blue"
            title="Catalogo sincronizado"
            desc='Pega un Google Sheets publico para importar productos, precios y variantes.'
          />
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <input
              className="modal-input" type="url" name="catalog_sheet_url" autoComplete="off" value={sheetsUrl}
              onChange={e => { setSheetsUrl(e.target.value); setImportMsg(null); }}
              placeholder="Pega aca el enlace publico de Google Sheets"
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
          </PanelCard>}

          {configSection === 'knowledge' && <PanelCard>
          <SectionHeader
            icon={<Bot size={18} />}
            tone="green"
            title="Base de conocimiento"
            desc='Informacion fija del negocio: envios, pagos, garantias, ubicacion, ventas y condiciones especiales.'
            action={<button onClick={() => setExpandedField('kb')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>Expandir <ExternalLink size={13} /></button>}
          />
          <textarea
            className="prompt-textarea editable"
            style={{ minHeight: '150px', borderColor: 'rgba(16,185,129,0.3)' }}
            value={knowledgeBase} onChange={e => setKnowledgeBase(e.target.value)}
            placeholder={`Organiza la info por secciones para que la IA solo lea lo relevante en cada pregunta:\n\n[ENVIO]\nEnvios en 24-48hs. Costo fijo $2.000 a todo el pais.\n\n[PAGOS]\nEfectivo, transferencia (10% OFF) o tarjeta hasta 6 cuotas.\n\n[UBICACION]\nAv. Corrientes 1234, CABA. Lun-Sab 9 a 20hs.\n\n[GARANTIA]\n30 dias para cambios sin cargo.`}
          />
          </PanelCard>}

          {configSection === 'assistant' && <PanelCard id="tour-preview-area">
            <SectionHeader
              icon={<TestTube2 size={18} />}
              tone="cyan"
              title="Probar asistente"
              desc="Abrí una vista tipo celular para probar cómo respondería antes de atender clientes reales."
              action={
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="btn-solid-blue"
                  style={{ margin: 0, width: 'auto', padding: '0.55rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Smartphone size={15} /> Abrir simulador
                </button>
              }
            />
            <div style={{ border: '1px dashed rgba(34,211,238,0.26)', background: 'rgba(34,211,238,0.055)', borderRadius: '12px', padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
              La prueba usa la personalidad y la base de conocimiento que tenés cargadas en esta pantalla, incluso antes de guardar.
            </div>
          </PanelCard>}

          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>

          {configSection === 'assistant' && <PanelCard>
          <SectionHeader
            icon={<Clock size={18} />}
            tone="amber"
            title="Tiempo de respuesta"
            desc="Agrupa mensajes seguidos antes de contestar para sonar mas natural."
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <input
              type="range" min="0.5" max="60" step="0.5"
              value={responseDelay}
              onChange={e => setResponseDelay(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: '#7c3aed' }}
            />
            <span style={{ minWidth: '48px', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {responseDelay}s
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>
            Recomendado: 2.5s  Minimo: 0.5s  Maximo: 60s
          </p>
          </PanelCard>}

          {configSection === 'knowledge' && <PanelCard>
          <SectionHeader
            icon={<CalendarClock size={18} />}
            tone="blue"
            title="Horario de atencion"
            desc="Define cuando responde el asistente y que mensaje usa fuera de horario."
          />
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <label className="ios-toggle">
              <input type="checkbox" checked={hours.active} onChange={e => setHours(h => ({ ...h, active: e.target.checked }))} />
              <span className="slider"></span>
            </label>
            <span>Activar Limite de Horario</span>
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
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Mensaje automatico (Si lo dejas vacio, no contestara fuera de horario)</label>
              <textarea className="prompt-textarea editable" style={{ minHeight: '60px' }}
                placeholder="Ej: Hola! Nuestro local esta cerrado ahora, pero manana a primera hora te asisto."
                value={hours.autoReplyMsg} onChange={e => setHours(h => ({ ...h, autoReplyMsg: e.target.value }))} />
            </div>
          )}
          </PanelCard>}

          {configSection === 'assistant' && <PanelCard>
          <SectionHeader
            icon={<ShieldCheck size={18} />}
            tone="green"
            title="Intervención humana"
            desc="Define cuándo el asistente debe pausar la conversación y pedirle ayuda al dueño antes de seguir."
            action={
              <label className="ios-toggle" title="Activar intervención humana">
                <input
                  type="checkbox"
                  checked={humanHandoff.enabled}
                  onChange={e => setHumanHandoff(h => ({ ...h, enabled: e.target.checked }))}
                />
                <span className="slider"></span>
              </label>
            }
          />
          <div style={{ opacity: humanHandoff.enabled ? 1 : 0.55, transition: 'opacity 0.15s' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.45rem', marginBottom: '0.85rem' }}>
              {HANDOFF_TRIGGER_LABELS.map(item => {
                const checked = !!humanHandoff.triggers[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={!humanHandoff.enabled}
                    onClick={() => setHumanHandoff(h => ({
                      ...h,
                      triggers: { ...h.triggers, [item.key]: !h.triggers[item.key] }
                    }))}
                    style={{
                      textAlign: 'left',
                      border: `1px solid ${checked ? 'rgba(16,185,129,0.42)' : 'var(--border)'}`,
                      background: checked ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.035)',
                      borderRadius: '10px',
                      padding: '0.5rem 0.6rem',
                      color: 'var(--text-primary)',
                      cursor: humanHandoff.enabled ? 'pointer' : 'not-allowed',
                      minHeight: 0
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.16rem', fontWeight: 800, fontSize: '0.82rem' }}>
                      <span style={{ width: 18, height: 18, borderRadius: 6, border: `1px solid ${checked ? '#10b981' : 'var(--border)'}`, background: checked ? '#10b981' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.72rem', flexShrink: 0 }}>
                        {checked ? <CheckCircle2 size={13} /> : ''}
                      </span>
                      {item.title}
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.72rem', lineHeight: 1.32 }}>{item.desc}</p>
                  </button>
                );
              })}
            </div>

            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Mensaje de espera para el cliente</label>
            <textarea
              className="prompt-textarea editable"
              disabled={!humanHandoff.enabled}
              style={{ minHeight: '68px', marginBottom: '0.75rem' }}
              value={humanHandoff.waitingMessage}
              onChange={e => setHumanHandoff(h => ({ ...h, waitingMessage: e.target.value }))}
              placeholder="Ej: Dame un momento, lo consulto con una persona del equipo y te respondo por acá."
            />

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.45rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Condición personalizada</label>
              </div>

              {(humanHandoff.customRule || humanHandoff.customRuleTitle) ? (
                <div style={{ border: '1px solid rgba(16,185,129,0.28)', background: 'rgba(16,185,129,0.07)', borderRadius: '10px', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ width: 18, height: 18, borderRadius: 6, background: '#10b981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                      <CheckCircle2 size={13} />
                    </span>
                    <input
                      className="modal-input"
                      disabled={!humanHandoff.enabled}
                      value={humanHandoff.customRuleTitle || ''}
                      onChange={e => setHumanHandoff(h => ({ ...h, customRuleTitle: e.target.value }))}
                      placeholder="Título de la condición"
                      style={{ marginBottom: 0, background: 'var(--bg-card)', fontWeight: 800, padding: '0.55rem 0.65rem', minHeight: '36px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setHumanHandoff(h => ({ ...h, customRuleTitle: '', customRule: '' }))}
                      style={{ border: '1px solid rgba(239,68,68,0.32)', background: 'rgba(239,68,68,0.08)', color: '#f87171', borderRadius: '8px', padding: '0.42rem 0.6rem', cursor: 'pointer', fontSize: '0.76rem', flexShrink: 0 }}
                    >
                      Quitar
                    </button>
                  </div>
                  <textarea
                    className="prompt-textarea editable"
                    disabled={!humanHandoff.enabled}
                    style={{ minHeight: '62px', marginBottom: 0 }}
                    value={humanHandoff.customRule}
                    onChange={e => setHumanHandoff(h => ({ ...h, customRule: e.target.value }))}
                    placeholder="Descripción. Ej: Derivar siempre que el cliente pida descuento mayor al 15%, quiera retirar hoy o consulte por una compra mayorista."
                  />
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!humanHandoff.enabled}
                  onClick={() => setHumanHandoff(h => ({ ...h, customRuleTitle: 'Condición personalizada' }))}
                  style={{
                    width: '100%',
                    border: '1px dashed rgba(16,185,129,0.42)',
                    background: 'rgba(16,185,129,0.055)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.75rem',
                    color: 'var(--text-primary)',
                    cursor: humanHandoff.enabled ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <span style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(16,185,129,0.18)', color: '#34d399', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>+</span>
                  <span>
                    <strong style={{ display: 'block', fontSize: '0.84rem' }}>Agregar condición personalizada</strong>
                    <small style={{ display: 'block', color: 'var(--text-secondary)', marginTop: '0.12rem', fontSize: '0.73rem' }}>Creá una regla propia con título y descripción.</small>
                  </span>
                </button>
              )}
            </div>

            {!metrics.adminNumber && (
              <p style={{ margin: '0.75rem 0 0', color: '#f59e0b', fontSize: '0.8rem', lineHeight: 1.45 }}>
                Para que la derivación llegue por WhatsApp, configurá abajo el celular de administrador.
              </p>
            )}
          </div>
          </PanelCard>}

          {configSection === 'connections' && <PanelCard>
          <SectionHeader
            icon={<Send size={18} />}
            tone="cyan"
            title="Conexion con Telegram"
            desc="Conecta tu asistente a Telegram usando el token de BotFather."
            action={
              <button
                type="button"
                onClick={() => setTelegramHelpOpen(v => !v)}
                title="Ver instrucciones"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <HelpCircle size={17} />
              </button>
            }
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {telegramHelpOpen && (
              <div style={{ border: '1px solid rgba(34,211,238,0.25)', background: 'rgba(34,211,238,0.08)', borderRadius: '12px', padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Como conectarlo:</strong>
                <ol style={{ margin: '0.45rem 0 0', paddingLeft: '1.1rem' }}>
                  <li>Abri Telegram y busca <strong>@BotFather</strong>.</li>
                  <li>Envia <strong>/newbot</strong>, elegi nombre y usuario para el asistente.</li>
                  <li>Copia el token que te entrega BotFather.</li>
                  <li>Pegalo aca y toca <strong>Guardar y conectar</strong>.</li>
                </ol>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Token de Telegram</label>
              <input className="modal-input" type="password" name="telegram_bot_token" autoComplete="off" placeholder="Pega aca el token de BotFather" value={telegramBotToken} onChange={e => setTelegramBotToken(e.target.value)} style={{ marginBottom: 0, background: 'var(--bg-card)' }} />
            </div>
            {telegramMsg && <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: telegramMsg.ok ? '#10b981' : '#f87171' }}>{telegramMsg.text}</p>}
            <button onClick={saveTelegramConfig} disabled={telegramSaving} className="btn-solid-blue" style={{ marginTop: '0.5rem', width: 'auto', alignSelf: 'flex-start', padding: '0.6rem 1rem' }}>
              {telegramSaving ? 'Conectando...' : 'Guardar y Conectar'}
            </button>
          </div>
          </PanelCard>}

          {configSection === 'connections' && <PanelCard>
          <SectionHeader
            icon={<ShieldCheck size={18} />}
            tone="violet"
            title="Celular de administrador"
            desc="Autoriza un numero seguro para dar instrucciones desde WhatsApp."
          />
          {metrics.adminNumber ? (
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={17} color="#10b981" />
              <div>
                <p style={{ margin: 0, color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>Numero de contacto seguro vinculado</p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#10b981', opacity: 0.9 }}>+{metrics.adminNumber.replace('@c.us', '')}</p>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem' }}>
              Vincula tu numero para que el asistente te reconozca como dueno y puedas darle instrucciones, lanzar difusiones y cambiar reglas directamente desde WhatsApp.
            </p>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <select className="modal-input" defaultValue="549"
              style={{ width: '90px', padding: '0.5rem', background: '#252b36', color: 'white', border: '1px solid var(--border)', marginBottom: 0 }}>
              <option value="549">AR +54</option>
              <option value="52">MX +52</option>
              <option value="56">CL +56</option>
              <option value="57">CO +57</option>
              <option value="51">PE +51</option>
              <option value="1">US +1</option>
            </select>
            <input className="modal-input" type="tel" name="admin_whatsapp_number" autoComplete="off" value={adminNumber} onChange={e => setAdminNumber(e.target.value)}
              placeholder="Tu numero local sin prefijo" style={{ flex: 1, marginBottom: 0, background: 'var(--bg-card)' }} />
          </div>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
            Sin codigo de pais, sin espacios y sin el 15.
          </p>
          </PanelCard>}

          {/* -- Guardar -- */}
          <PanelCard style={{ position: 'sticky', bottom: '1rem', zIndex: 3, background: 'var(--surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              <Lock size={15} /> Los cambios se aplican al asistente activo.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {saveMsg === 'ok' && <span style={{ color: '#10b981', fontSize: '0.875rem' }}>Cambios guardados.</span>}
            {saveMsg === 'err' && <span style={{ color: '#f87171', fontSize: '0.875rem' }}>Error al guardar.</span>}
            <button onClick={save} disabled={saving} className="btn-solid-blue" style={{ margin: 0, width: 'auto', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BrainCircuit size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            </div>
          </div>
          </PanelCard>

          {configSection === 'connections' && <PanelCard>
            <button onClick={() => setPwOpen(o => !o)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, width: '100%', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><KeyRound size={17} color="#a78bfa" /> Seguridad de cuenta</span>
              <ChevronRight size={16} style={{ transform: pwOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {pwOpen && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: '380px' }}>
                {[{ label: 'Contrasena actual', key: 'current' }, { label: 'Nueva contrasena', key: 'next' }, { label: 'Repetir nueva contrasena', key: 'confirm' }].map(({ label, key }) => (
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
                  {pwSaving ? 'Guardando...' : 'Cambiar contrasena'}
                </button>
              </div>
            )}
          </PanelCard>}

          {configSection === 'connections' && <PanelCard style={{ background: 'linear-gradient(135deg, rgba(225,48,108,0.06), rgba(24,119,242,0.045))', border: '1px dashed rgba(225,48,108,0.28)', opacity: 0.9 }}>
            <SectionHeader
              icon={<PlugZap size={18} />}
              tone="rose"
              title="Instagram & Facebook"
              desc="Canales sociales en preparacion para futuras versiones."
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Mensajes de Instagram y Facebook</span>
                <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-secondary)', fontSize: '0.63rem', fontWeight: 800, padding: '2px 9px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>PROXIMAMENTE</span>
              </div>
              <p style={{ margin: '0 0 0.85rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Esta integracion estara disponible mas adelante para responder DMs de Instagram y Facebook Messenger desde el mismo asistente. Por ahora Atento opera con WhatsApp y Telegram.
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(225,48,108,0.1)', border: '1px solid rgba(225,48,108,0.22)', borderRadius: '20px', padding: '4px 12px', fontSize: '0.78rem', color: '#e1306c', fontWeight: 600 }}>Instagram DMs</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(24,119,242,0.1)', border: '1px solid rgba(24,119,242,0.22)', borderRadius: '20px', padding: '4px 12px', fontSize: '0.78rem', color: '#1877f2', fontWeight: 600 }}>Facebook Messenger</span>
              </div>
            </div>
          </PanelCard>}

          </div>
          </div>

          </>)}

          </div>
        </main>
      </div>
    </>
  );
}

