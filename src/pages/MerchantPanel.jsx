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

// ─── CampaignPanel ────────────────────────────────────────────────────────────
function CampaignPanel({ botId, token, api }) {
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

  const tabStyle = { background: 'none', border: 'none', borderBottom: '2px solid transparent', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.6rem 1rem', fontSize: '0.9rem', fontWeight: 500, marginBottom: '-1px' };
  const tabActiveStyle = { ...tabStyle, borderBottom: '2px solid #7c3aed', color: 'var(--text-primary)', fontWeight: 700 };

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
        method: 'POST', body: JSON.stringify(newCampaign)
      }, token);
      if (res.ok) {
        setShowNewModal(false);
        setNewCampaign({ name: '', message_template: '', delay_seconds: 45, use_ai: false, campaign_goal: '' });
        loadCampaigns();
      } else {
        const d = await res.json();
        setCampaignMsg({ ok: false, text: d.error || 'Error al crear.' });
      }
    } catch { setCampaignMsg({ ok: false, text: 'Error de conexión.' }); }
    finally { setSaving(false); }
  }

  async function deleteCampaign(cid) {
    if (!confirm('¿Eliminar esta campaña y todos sus leads?')) return;
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
        setLeadsMsg({ ok: true, text: `✅ ${data.imported} leads importados desde Google Sheets.` });
        setSheetsUrl('');
        const r2 = await authFetch(`${api}/api/bots/${botId}/campaigns/${leadsModal.id}/leads`, {}, token);
        const d2 = await r2.json();
        setLeads(Array.isArray(d2) ? d2 : []);
        loadCampaigns();
      } else { setLeadsMsg({ ok: false, text: `❌ ${data.error}` }); }
    } catch { setLeadsMsg({ ok: false, text: '❌ Error de conexión.' }); }
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
        setLeadsMsg({ ok: true, text: `✅ ${data.imported} leads importados.` });
        setLeadsText('');
        const r2 = await authFetch(`${api}/api/bots/${botId}/campaigns/${leadsModal.id}/leads`, {}, token);
        const d2 = await r2.json();
        setLeads(Array.isArray(d2) ? d2 : []);
        loadCampaigns();
      } else {
        setLeadsMsg({ ok: false, text: `❌ ${data.error}` });
      }
    } catch { setLeadsMsg({ ok: false, text: '❌ Error de conexión.' }); }
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
    replied:   { color: '#10b981', label: 'Respondió' },
    opted_out: { color: '#ef4444', label: 'Opt-out' },
  };

  return (
    <div>
      {/* Modal nueva campaña */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Nueva Campaña</span>
              <button onClick={() => { setShowNewModal(false); setCampaignMsg(null); }} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.3rem 0.7rem' }}>✕</button>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Nombre de la campaña</label>
              <input className="modal-input" value={newCampaign.name} onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Promo Mayo 2025" style={{ marginBottom: 0, background: 'var(--bg-card)' }} />
            </div>
            {/* Toggle modo IA */}
            <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '10px', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' }}>✨ Mensaje generado por IA</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Gemini escribe un mensaje único y personalizado para cada negocio</div>
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
                  placeholder={'Ej: Ofrecer Asisto AI a dueños de negocios locales para que automticen la atención de WhatsApp. Mencionar que tienen 7 días gratis y que configuramos todo nosotros.'} />
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
                  placeholder={'Hola {{nombre}}! Te contactamos desde Asisto AI...'} />
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Delay entre mensajes (segundos)</label>
              <input className="modal-input" type="number" min="10" max="3600" value={newCampaign.delay_seconds}
                onChange={e => setNewCampaign(p => ({ ...p, delay_seconds: Number(e.target.value) }))}
                style={{ marginBottom: 0, background: 'var(--bg-card)', width: '120px' }} />
            </div>
            {campaignMsg && <p style={{ margin: 0, fontSize: '0.875rem', color: campaignMsg.ok ? '#10b981' : '#f87171' }}>{campaignMsg.text}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowNewModal(false); setCampaignMsg(null); }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.6rem 1rem' }}>Cancelar</button>
              <button onClick={createCampaign} disabled={saving} className="btn-solid-blue" style={{ margin: 0, width: 'auto', padding: '0.6rem 1.25rem' }}>
                {saving ? 'Creando...' : 'Crear Campaña'}
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
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Leads — {leadsModal.name}</span>
              <button onClick={() => setLeadsModal(null)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.3rem 0.7rem' }}>✕</button>
            </div>
            <div>
              {/* Toggle manual / sheets */}
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
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Formato: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '0 4px', borderRadius: '4px' }}>teléfono,nombre,negocio,ciudad,url</code> — uno por línea
                  </label>
                  <textarea className="prompt-textarea editable" style={{ minHeight: '90px' }}
                    value={leadsText} onChange={e => setLeadsText(e.target.value)}
                    placeholder={'5491112345678,Juan,Panadería,CABA,https://maps.app.goo.gl/xyz\n5491198765432,María,Ferretería,Córdoba,'} />
                  <button onClick={importLeads} disabled={importingLeads || !leadsText.trim()} className="btn-solid-blue"
                    style={{ margin: '0.5rem 0 0', width: 'auto', padding: '0.5rem 1rem', opacity: (importingLeads || !leadsText.trim()) ? 0.6 : 1 }}>
                    {importingLeads ? 'Importando...' : 'Importar'}
                  </button>
                </>
              )}

              {leadsImportMode === 'sheets' && (
                <>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Link de Google Sheets <span style={{ opacity: 0.6 }}>(debe ser público — "cualquiera con el link puede ver")</span>
                  </label>
                  <input className="modal-input" value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..." style={{ marginBottom: 0, background: 'var(--bg-card)' }} />
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Columnas recomendadas: <strong>teléfono, nombre, negocio, ciudad, url</strong> (con o sin encabezados). La columna <strong>url</strong> puede ser el sitio web o link de Google Maps del negocio — la IA lo analizará antes de escribir el mensaje.
                  </p>
                  <button onClick={importFromSheets} disabled={importingLeads || !sheetsUrl.trim()} className="btn-solid-blue"
                    style={{ margin: '0.5rem 0 0', width: 'auto', padding: '0.5rem 1rem', opacity: (importingLeads || !sheetsUrl.trim()) ? 0.6 : 1 }}>
                    {importingLeads ? 'Importando...' : '📊 Importar desde Sheets'}
                  </button>
                </>
              )}

              {leadsMsg && <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: leadsMsg.ok ? '#10b981' : '#f87171' }}>{leadsMsg.text}</p>}
            </div>
            {leads.length > 0 && (
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{leads.length} leads en esta campaña</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '280px', overflowY: 'auto' }}>
                  {leads.map(lead => (
                    <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                      <span style={{ background: leadStatusBadge[lead.status]?.color || '#64748b', borderRadius: '20px', padding: '2px 8px', fontSize: '0.7rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {leadStatusBadge[lead.status]?.label || lead.status}
                      </span>
                      <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                        {lead.name || lead.phone.replace('@c.us', '')}
                        {lead.city && <span style={{ color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>— {lead.city}</span>}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lead.phone.replace('@c.us', '')}</span>
                      <button onClick={() => deleteLead(lead.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem', padding: '0 4px' }}>🗑</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {leads.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Sin leads todavía. Importá contactos arriba.</p>}
          </div>
        </div>
      )}

      {/* Header campaña */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
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
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📣</div>
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
                      ✨ IA
                    </span>
                  ) : null}
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span>⏳ {c.stats?.pending || 0} pendientes</span>
                  <span style={{ color: '#3b82f6' }}>📤 {c.stats?.sent || 0} enviados</span>
                  <span style={{ color: '#10b981' }}>💬 {c.stats?.replied || 0} respondieron</span>
                  {(c.stats?.opted_out || 0) > 0 && <span style={{ color: '#f87171' }}>🚫 {c.stats.opted_out} opt-out</span>}
                  <span style={{ opacity: 0.5 }}>delay: {c.delay_seconds}s</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => openLeadsModal(c)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                  👥 Leads
                </button>
                {c.status === 'draft' || c.status === 'paused' ? (
                  <button onClick={() => startCampaign(c.id)} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                    ▶ Iniciar
                  </button>
                ) : null}
                {c.status === 'running' ? (
                  <button onClick={() => pauseCampaign(c.id)} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '8px', color: '#f59e0b', cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                    ⏸ Pausar
                  </button>
                ) : null}
                {['draft', 'paused', 'completed'].includes(c.status) ? (
                  <button onClick={() => deleteCampaign(c.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                    🗑
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
// ─── BotPreviewChat ───────────────────────────────────────────────────────────
function BotPreviewChat({ botId, token, botName, currentPrompt, currentKB, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'model', text: '¡Hola! Soy el asistente virtual. ¿En qué te puedo ayudar? 😊' }
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
      setMessages(prev => [...prev, { role: 'model', text: '❌ Error al conectar con el bot.' }]);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '340px',
      zIndex: 9998, display: 'flex', flexDirection: 'column',
      filter: 'drop-shadow(-8px 0 32px rgba(0,0,0,0.5))',
    }}>
      {/* Phone frame */}
      <div style={{
        margin: '16px 16px 16px 0',
        flex: 1, display: 'flex', flexDirection: 'column',
        background: '#111b21', borderRadius: '36px',
        border: '8px solid #1a1a2e', overflow: 'hidden',
        boxShadow: '0 0 0 2px #0d0f18',
      }}>
        {/* Notch */}
        <div style={{ background: '#111b21', display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: '60px', height: '5px', borderRadius: '3px', background: '#1a1a2e' }} />
        </div>

        {/* WA Header */}
        <div style={{ background: '#1f2c34', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer', fontSize: '1.1rem', padding: 0, lineHeight: 1 }}>←</button>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.9rem', flexShrink: 0 }}>
            {(botName || 'B').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#e9edef', fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{botName || 'Mi Bot'}</div>
            <div style={{ color: '#aebac1', fontSize: '0.7rem' }}>en línea</div>
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
                  {now} {m.role === 'user' && '✓✓'}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '6px' }}>
              <div style={{ background: '#202c33', borderRadius: '12px 12px 12px 2px', padding: '8px 14px', color: '#aebac1', fontSize: '0.82rem' }}>
                <span style={{ animation: 'pulse 1s infinite' }}>● ● ●</span>
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
            placeholder="Escribí un mensaje..."
            style={{
              flex: 1, background: '#2a3942', border: 'none', borderRadius: '20px',
              padding: '8px 14px', color: '#e9edef', fontSize: '0.82rem', outline: 'none',
            }}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
            width: '36px', height: '36px', borderRadius: '50%', border: 'none',
            background: loading || !input.trim() ? '#2a3942' : '#00a884',
            color: '#fff', cursor: loading || !input.trim() ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
          }}>➤</button>
        </div>

        {/* Home bar */}
        <div style={{ background: '#111b21', padding: '6px 0 10px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '80px', height: '4px', borderRadius: '2px', background: '#2a3942' }} />
        </div>
      </div>
    </div>
  );
}

// ─── TourOverlay ─────────────────────────────────────────────────────────────
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

  function finish() { localStorage.setItem('asisto_tour_done', '1'); onFinish(); }
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
            {step > 0 && <button onClick={e => { e.stopPropagation(); goPrev(); }} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem', padding: '0.35rem 0.7rem' }}>← Atrás</button>}
            <button onClick={e => { e.stopPropagation(); goNext(); }} style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', padding: '0.35rem 0.85rem', fontWeight: 600 }}>
              {isLast ? '¡Listo! ✓' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── TurnosPanel ─────────────────────────────────────────────────────────────
const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const DAYS_SHORT = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
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

function TurnosPanel({ botId, token, api }) {
  const [specs, setSpecs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [view, setView] = useState('agenda'); // 'agenda' | 'especialidades'
  const [newSpec, setNewSpec] = useState({ name:'', duration_minutes:30, color:'#7c3aed', reminder_enabled:true, reminder_hours:24, capacity:1 });
  const [showNewSpec, setShowNewSpec] = useState(false);
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
      setNewSpec({ name:'', duration_minutes:30, color:'#7c3aed', reminder_enabled:true, reminder_hours:24, capacity:1 });
      loadSpecs();
    } finally { setSaving(false); }
  }

  async function deleteSpec(sid) {
    if (!confirm('¿Eliminar este servicio y todos sus turnos?')) return;
    await authFetch(`${api}/api/bots/${botId}/specialties/${sid}`, { method:'DELETE' }, token);
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
      await authFetch(`${api}/api/bots/${botId}/specialties/${sid}/schedule`, {
        method:'PUT', body: JSON.stringify({ slots })
      }, token);
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
      const res = await authFetch(`${api}/api/bots/${botId}/appointments/available?specialty_id=${newAppt.specialty_id}&date=${newAppt.date}`, {}, token);
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

  const statusColors = { confirmed:'#10b981', cancelled:'#ef4444', completed:'#3b82f6' };
  const statusLabels = { confirmed:'Confirmado', cancelled:'Cancelado', completed:'Completado' };

  const inputStyle = { width:'100%', padding:'0.65rem 0.85rem', borderRadius:'8px', border:'1px solid var(--border)', background:'rgba(255,255,255,0.05)', color:'var(--text-primary)', fontSize:'0.9rem', boxSizing:'border-box' };
  const labelStyle = { fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:'0.25rem' };

  return (
    <div style={{ padding:'1.5rem 2rem' }}>

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
                  {COLORS.map(c => (
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
                <label style={labelStyle}>Horas antes del turno para recordar</label>
                <input style={{...inputStyle, width:'120px'}} type="number" min="1" max="72" value={newSpec.reminder_hours} onChange={e => setNewSpec(p=>({...p,reminder_hours:Number(e.target.value)}))} />
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
        {view === 'agenda' && (
          <button onClick={() => { setShowNewAppt(true); setApptMsg(null); }} style={{ marginLeft:'auto', background:'linear-gradient(135deg,#7c3aed,#3b82f6)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', padding:'0.5rem 1rem', fontSize:'0.875rem', fontWeight:600 }}>
            + Nuevo turno
          </button>
        )}
        {view === 'especialidades' && (
          <button onClick={() => setShowNewSpec(true)} style={{ marginLeft:'auto', background:'linear-gradient(135deg,#7c3aed,#3b82f6)', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', padding:'0.5rem 1rem', fontSize:'0.875rem', fontWeight:600 }}>
            + Nuevo servicio
          </button>
        )}
      </div>

      {/* ── Vista: Horario tipo planilla ── */}
      {view === 'agenda' && (() => {
        const weekDays = getWeekDays(weekOffset);
        const todayStr = new Date().toISOString().slice(0,10);

        // Index appointments: {date_time: appointment}
        const apptIndex = {};
        appointments.forEach(a => { apptIndex[`${a.date}_${a.time}_${a.specialty_id}`] = a; });

        const activeSpec = specs.find(s => s.id === selectedSpecId);
        const { slots, dayMap } = activeSpec ? getTimeSlotsForSpec(activeSpec) : { slots:[], dayMap:{} };

        const statusColors = { confirmed:'#10b981', cancelled:'#ef4444', completed:'#3b82f6' };
        const statusLabels = { confirmed:'Confirmado', cancelled:'Cancelado', completed:'Completado' };

        return (
          <div>
            {/* Cards de servicios */}
            {specs.length === 0 ? (
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px dashed var(--border)', borderRadius:'12px', padding:'2rem', textAlign:'center', color:'var(--text-secondary)', fontSize:'0.85rem', marginBottom:'1rem' }}>
                No hay servicios configurados. Creá uno en <strong>📋 Servicios</strong>.
              </div>
            ) : (
              <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap', marginBottom:'1.25rem' }}>
                {specs.map(spec => {
                  const specAppts = appointments.filter(a => a.specialty_id === spec.id);
                  const confirmed = specAppts.filter(a => a.status==='confirmed').length;
                  const isActive = selectedSpecId === spec.id;
                  return (
                    <div key={spec.id} onClick={() => setSelectedSpecId(spec.id)}
                      style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.6rem 1rem', borderRadius:'12px', border:`2px solid ${isActive ? spec.color : 'var(--border)'}`, background: isActive ? `${spec.color}18` : 'var(--card-bg)', cursor:'pointer', transition:'0.15s', minWidth:'160px' }}>
                      <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:spec.color, flexShrink:0 }} />
                      <div>
                        <div style={{ fontWeight:700, fontSize:'0.85rem', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{spec.name}</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>{spec.duration_minutes}min{spec.capacity>1 ? ` · ${spec.capacity} lugares` : ''} · {confirmed} pendiente{confirmed!==1?'s':''}</div>
                      </div>
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
                          const hasSchedule = !!dayMap[dow];
                          return (
                            <th key={date} style={{ padding:'0.5rem 0.25rem', background: isToday ? `${activeSpec.color}22` : 'rgba(255,255,255,0.03)', borderBottom:'2px solid var(--border)', borderRight: i<6?'1px solid var(--border)':'none', textAlign:'center', opacity: hasSchedule ? 1 : 0.45 }}>
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
                      {slots.length === 0 ? (
                        <tr><td colSpan={8} style={{ padding:'2rem', textAlign:'center', color:'var(--text-secondary)', fontSize:'0.85rem' }}>
                          Este servicio no tiene horarios configurados. Configuralos en <strong>📋 Servicios</strong>.
                        </td></tr>
                      ) : slots.map((slot, si) => (
                        <tr key={slot}>
                          {/* Hora */}
                          <td style={{ padding:'0.3rem 0.5rem', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid var(--border)', borderRight:'1px solid var(--border)', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', textAlign:'right', verticalAlign:'top', whiteSpace:'nowrap' }}>{slot}</td>
                          {weekDays.map((date, di) => {
                            const jsDay = new Date(date+'T12:00').getDay();
                            const dow = jsDay===0?6:jsDay-1;
                            const inSchedule = dayMap[dow] && (() => {
                              const [sh,sm] = slot.split(':').map(Number);
                              const mins = sh*60+sm;
                              return dayMap[dow].some(w => mins >= w.start && mins < w.end);
                            })();
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
                      🔔 Recordatorio {spec.reminder_hours}h antes
                    </span>
                  ) : (
                    <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', opacity:0.5 }}>Sin recordatorio</span>
                  )}
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

// ─────────────────────────────────────────────────────────────────────────────

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
  const [showProfile, setShowProfile] = useState(false);
  const [expandedField, setExpandedField] = useState(null); // 'prompt' | 'kb'
  const [responseDelay, setResponseDelay] = useState(2.5);
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'campaigns'
  const [showTour, setShowTour] = useState(() => !localStorage.getItem('asisto_tour_done'));
  const [showPreview, setShowPreview] = useState(false);
  const pollRef = useRef(null);

  // Meta Config (Instagram/Facebook)
  const [metaPageId, setMetaPageId] = useState('');
  const [metaIgId, setMetaIgId] = useState('');
  const [metaMsg, setMetaMsg] = useState(null);

  // Telegram Config
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramSaving, setTelegramSaving] = useState(false);
  const [telegramMsg, setTelegramMsg] = useState(null);


  useEffect(() => {
    if (!token || !botId) { nav('/registro'); return; }
    loadBot();
    // Handle OAuth callback params
    const params = new URLSearchParams(window.location.search);
    if (params.get('meta_ok')) {
      const pageName = params.get('page_name') || 'tu página';
      setMetaMsg({ ok: true, text: `✅ ¡Conectado con ${pageName}! Instagram y Facebook ya están activos.` });
      window.history.replaceState({}, '', '/mi-panel');
    } else if (params.get('meta_error')) {
      const err = params.get('meta_error');
      const msgs = { acceso_denegado: 'Cancelaste el acceso.', sesion_expirada: 'La sesión expiró, intentá de nuevo.', sin_paginas: 'No se encontraron páginas de Facebook en tu cuenta.', error_interno: 'Error interno, contactá soporte.' };
      setMetaMsg({ ok: false, text: `❌ ${msgs[err] || err}` });
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
        body: JSON.stringify({ prompt, workingHours: hours, knowledgeBase, adminNumber, responseDelay })
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

  async function connectMeta() {
    setMetaMsg(null);
    try {
      const res = await authFetch(`${API}/api/oauth/meta/init`, {
        method: 'POST',
        body: JSON.stringify({ botId })
      }, token);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMetaMsg({ ok: false, text: `❌ ${data.error || 'Error al iniciar conexión.'}` });
      }
    } catch {
      setMetaMsg({ ok: false, text: '❌ Error de conexión con el servidor.' });
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

  async function unlinkWhatsApp() {
    if (!confirm('¿Cerrar sesión de WhatsApp? Deberás escanear el QR nuevamente para reconectar.')) return;
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

  const expandedValue = expandedField === 'prompt' ? prompt : knowledgeBase;
  const expandedSetter = expandedField === 'prompt' ? setPrompt : setKnowledgeBase;
  const expandedTitle = expandedField === 'prompt' ? '🧠 Comportamiento Psicológico' : '🔗 Base de Conocimientos';

  const TOUR_STEPS = [
    { id: 'tour-tabs',           tab: 'config',    title: '🧭 Las 3 secciones del panel',  desc: 'Todo el panel se organiza en 3 pestañas. Cada una tiene una función distinta. El tour te va a mostrar para qué sirve cada una.' },
    { id: 'tour-config-area',    tab: 'config',    title: '⚙️ Configuración del bot',       desc: 'Acá definís cómo habla tu bot: su nombre, su personalidad y las instrucciones de cómo debe responder. También cargás la base de conocimiento con info de tu negocio, catálogo, horarios y FAQ.' },
    { id: 'tour-status',         tab: 'config',    title: '📱 Conectar y activar el bot',   desc: 'Con este botón iniciás o pausás tu bot. Cuando está activo, va a responder automáticamente todos los mensajes de tus clientes en WhatsApp.' },
    { id: 'tour-campaigns-area', tab: 'campaigns', title: '📣 Campañas de mensajería',      desc: 'Desde acá podés enviar mensajes masivos a una lista de clientes. Cargás los contactos (manual, CSV o Google Sheets) y el bot manda el mensaje automáticamente.' },
    { id: 'tour-turnos-area',    tab: 'turnos',    title: '📅 Gestión de turnos',           desc: 'Si tu negocio da turnos (médico, peluquería, estética, etc.), acá configurás los servicios, horarios y capacidad. El bot los reserva solo y manda recordatorios.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', padding: '2rem' }}>

      {showTour && <TourOverlay steps={TOUR_STEPS} onFinish={() => setShowTour(false)} setActiveTab={setActiveTab} />}
      {showPreview && <BotPreviewChat botId={botId} token={token} botName={bot?.name} currentPrompt={prompt} currentKB={knowledgeBase} onClose={() => setShowPreview(false)} />}

      {/* Modal expandido */}
      {expandedField && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 10000, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{expandedTitle}</span>
            <button onClick={() => setExpandedField(null)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.4rem 0.9rem', fontSize: '0.9rem' }}>
              Cerrar ✕
            </button>
          </div>
          <textarea
            className="prompt-textarea editable"
            style={{ flex: 1, resize: 'none', fontSize: '0.9rem', lineHeight: 1.6 }}
            value={expandedValue}
            onChange={e => expandedSetter(e.target.value)}
          />
        </div>
      )}
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

          {/* Tab bar */}
          {(() => {
            const tabStyle = { background: 'none', border: 'none', borderBottom: '2px solid transparent', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.6rem 1rem', fontSize: '0.9rem', fontWeight: 500, marginBottom: '-1px' };
            const tabActiveStyle = { ...tabStyle, borderBottom: '2px solid #7c3aed', color: 'var(--text-primary)', fontWeight: 700 };
            return (
              <div id="tour-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
                <button onClick={() => setActiveTab('config')} style={activeTab === 'config' ? tabActiveStyle : tabStyle}>⚙️ Configuración</button>
                <button onClick={() => setActiveTab('campaigns')} style={activeTab === 'campaigns' ? tabActiveStyle : tabStyle}>📣 Campañas</button>
                <button onClick={() => setActiveTab('turnos')} style={activeTab === 'turnos' ? tabActiveStyle : tabStyle}>📅 Turnos</button>
              </div>
            );
          })()}

          {activeTab === 'campaigns' && <div id="tour-campaigns-area"><CampaignPanel botId={botId} token={token} api={API} /></div>}
          {activeTab === 'turnos' && <div id="tour-turnos-area"><TurnosPanel botId={botId} token={token} api={API} /></div>}

          {activeTab === 'config' && (<>

          {/* Cabecera */}
          <div id="tour-config-area" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ margin: '0 0 0.3rem', fontSize: '1.8rem', fontWeight: 800 }}>
                Bot Manager <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px', verticalAlign: 'middle', marginLeft: '0.4rem' }}>PRO</span>
              </h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Panel de Auto-Gestión Inteligente</p>
            </div>
            <div id="tour-status" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button onClick={() => setShowPreview(p => !p)} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #00a884', background: showPreview ? '#00a884' : 'transparent', color: showPreview ? '#fff' : '#00a884', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📱 {showPreview ? 'Cerrar preview' : 'Probar bot'}
              </button>
              {isOn ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={stopBot} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>
                    Detener bot
                  </button>
                  <button onClick={unlinkWhatsApp} disabled={unlinking} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #6b7280', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '0.9rem' }}>
                    {unlinking ? 'Desvinculando...' : 'Desvincular WhatsApp'}
                  </button>
                </div>
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
            <h3 style={{ flex: 1 }}>Comportamiento Psicológico de la IA</h3>
            <button onClick={() => setExpandedField('prompt')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}>⛶ Expandir</button>
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
            <h3 style={{ flex: 1 }}>Base de Conocimientos</h3>
            <button onClick={() => setExpandedField('kb')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}>⛶ Expandir</button>
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

          {/* ── Tiempo de respuesta ── */}
          <div className="prompt-header" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⏱️</span>
            <h3>Tiempo de espera antes de responder</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem' }}>
            Si el cliente manda varios mensajes seguidos, el bot espera este tiempo antes de responder — así agrupa todos los mensajes y contesta una sola vez.
          </p>
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
            Recomendado: 2.5s — Mínimo: 0.5s — Máximo: 60s
          </p>

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

          {/* ── Integración Meta (Instagram + Facebook) ── */}
          <div className="prompt-header" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '1.1rem', color: '#e1306c' }}>📸</span>
            <h3 style={{ color: '#e1306c' }}>Integración Instagram & Facebook</h3>
          </div>
          {metrics.hasSocialFeature ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              {(metaPageId || metaIgId) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>✅</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#10b981' }}>Cuenta conectada</p>
                    {metaPageId && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Página: {metaPageId} {metaIgId && `· IG: ${metaIgId}`}</p>}
                  </div>
                  <button onClick={connectMeta} style={{ background: 'transparent', border: '1px solid #4b5563', borderRadius: '8px', color: '#9ca3af', cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                    Reconectar
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Conectá tu cuenta de Facebook para que la IA responda mensajes de Instagram y Facebook automáticamente.
                </p>
              )}
              {metaMsg && <p style={{ margin: 0, fontSize: '0.875rem', color: metaMsg.ok ? '#10b981' : '#f87171' }}>{metaMsg.text}</p>}
              {!metaPageId && !metaIgId && (
                <button onClick={connectMeta} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#1877f2', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', padding: '0.75rem 1.25rem', fontSize: '0.95rem', fontWeight: 600, alignSelf: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem' }}>f</span> Conectar con Facebook
                </button>
              )}
            </div>
          ) : (
            <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', opacity: '0.6' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>🔒</span>
              <h4 style={{ margin: '0 0 5px 0', color: 'gray' }}>Módulo de Redes Sociales Bloqueado</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'gray' }}>Comunícate con Soporte para adquirir esta función Elite.</p>
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

          </>)}

        </div>
      </div>
    </div>
  );
}
