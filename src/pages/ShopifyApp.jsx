import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AppProvider, Page, Layout, Card, BlockStack, InlineStack,
  Text, Button, TextField, Banner, Spinner, Divider,
  Box, InlineGrid, Checkbox, Tabs, RangeSlider, Select,
} from '@shopify/polaris';
import polarisCssUrl from '@shopify/polaris/build/esm/styles.css?url';
import translations from '@shopify/polaris/locales/es.json';

const API = 'https://asisto-backend-production.up.railway.app';

// --- Preview Chat (simulacin WhatsApp) ---------------------------------------
function PreviewChat({ botName, onSend }) {
  const [messages, setMessages] = useState([
    { role: 'model', text: '¡Hola! Soy el asistente virtual. ¿En qué te puedo ayudar?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const history = newMessages.slice(1, -1).map(m => ({ role: m.role, text: m.text }));
      const reply = await onSend(text, history);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: '? Error al conectar con el asistente.' }]);
    } finally { setLoading(false); }
  }

  const now = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Box padding="0">
      <div style={{ background: '#111b21', borderRadius: '16px', overflow: 'hidden', maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 520 }}>
        <div style={{ background: '#1f2c34', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.9rem', flexShrink: 0 }}>
            {(botName || 'A').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#e9edef', fontWeight: 600, fontSize: '0.9rem' }}>{botName || 'Mi Asistente'}</div>
            <div style={{ color: '#aebac1', fontSize: '0.7rem' }}>en línea</div>
          </div>
          <div style={{ fontSize: '0.6rem', color: '#aebac1', background: '#2a3942', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>PREVIEW</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', background: '#0b141a', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
              <div style={{ maxWidth: '80%', padding: '6px 10px 4px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? '#005c4b' : '#202c33', color: '#e9edef', fontSize: '0.82rem', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                {m.text}
                <div style={{ fontSize: '0.6rem', color: '#aebac1', textAlign: 'right', marginTop: 2 }}>{now} {m.role === 'user' && '✓✓'}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 6 }}>
              <div style={{ background: '#202c33', borderRadius: '12px 12px 12px 2px', padding: '8px 14px', color: '#aebac1', fontSize: '0.82rem' }}>· · ·</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div style={{ background: '#1f2c34', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Escribí un mensaje..."
            style={{ flex: 1, background: '#2a3942', border: 'none', borderRadius: 20, padding: '8px 14px', color: '#e9edef', fontSize: '0.82rem', outline: 'none' }}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: loading || !input.trim() ? '#2a3942' : '#00a884', color: '#fff', cursor: loading || !input.trim() ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>➤</button>
        </div>
      </div>
    </Box>
  );
}

// --- Constantes y helpers de Turnos ------------------------------------------
const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const DAYS_SHORT = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const SPEC_COLORS = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4'];

function getWeekDays(offset) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function getTimeSlotsForSpec(spec) {
  if (!spec?.schedule?.length) return { slots: [], dayMap: {} };
  let minMins = Infinity, maxMins = -Infinity;
  const dayMap = {};
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
  const dur = spec.duration_minutes || 30;
  for (let cur = minMins; cur < maxMins; cur += dur) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`);
  }
  return { slots, dayMap };
}

// --- Panel principal -----------------------------------------------------------
function ShopifyPanel() {
  const app = useAppBridge();
  const shop = new URLSearchParams(window.location.search).get('shop') || '';

  const shopifyFetch = useCallback(async (url, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (shop) headers['X-Shopify-Shop'] = shop;
    try {
      const token = await Promise.race([
        app.idToken(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
      headers['Authorization'] = `Bearer ${token}`;
    } catch (_e) {}
    return fetch(url, { ...options, headers });
  }, [app, shop]);

  // -- Estado general --
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);

  // -- Config --
  const [prompt, setPrompt] = useState('');
  const [kb, setKb] = useState('');
  const [responseDelay, setResponseDelay] = useState(2.5);
  const [hours, setHours] = useState({ active: false, start: '09:00', end: '18:00', autoReplyMsg: '' });
  const [adminPhone, setAdminPhone] = useState('');
  const [language, setLanguage] = useState('es');
  const [widget, setWidget] = useState({ enabled: false, welcomeMessage: '', buttonText: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // -- Catlogo --
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  // -- WhatsApp --
  const [starting, setStarting] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [startError, setStartError] = useState(null);
  const pollRef = useRef(null);
  const pollCountRef = useRef(0);

  // -- Turnos --
  const [specialties, setSpecialties] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [turnosView, setTurnosView] = useState('agenda');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSpecId, setSelectedSpecId] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [apptDetail, setApptDetail] = useState(null);
  const [newSpec, setNewSpec] = useState({ name: '', duration_minutes: 30, color: '#7c3aed', capacity: 1, reminder_enabled: true, reminder_hours: [24] });
  const [newAppt, setNewAppt] = useState({ specialty_id: '', client_name: '', client_phone: '', date: new Date().toISOString().slice(0, 10), time: '', notes: '' });
  const [turnosSaving, setTurnosSaving] = useState(false);
  const [apptMsg, setApptMsg] = useState(null);
  const [showNewSpec, setShowNewSpec] = useState(false);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);

  // -- Multi-bot (Scale) --
  const [allBots, setAllBots] = useState([]);
  const [activeBotId, setActiveBotId] = useState(null);
  const [creatingBot, setCreatingBot] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [botSwitchMsg, setBotSwitchMsg] = useState(null);

  // -- Marketing --
  const [customers, setCustomers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [cartConfig, setCartConfig] = useState({ enabled: false, delayHours: 2, message: 'Hola {{nombre}}! Notamos que dejaste productos en tu carrito:\n\n{{productos}}\n\n¿Querés completar tu compra? {{url}}' });
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [newCampaign, setNewCampaign] = useState({ name: '', message_template: '', delay_seconds: 30 });
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [marketingMsg, setMarketingMsg] = useState(null);
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [cartSaving, setCartSaving] = useState(false);

  // -- Carga inicial --
  useEffect(() => {
    const botParam = activeBotId ? `?botId=${activeBotId}` : '';
    shopifyFetch(`${API}/api/shopify/embedded/bot${botParam}`)
      .then(r => r.json())
      .then(data => {
        setBot(data);
        setPrompt(data.prompt || '');
        setKb(data.knowledgeBase || '');
        try {
          const w = JSON.parse(data.widgetConfig || '{}');
          setWidget({ enabled: !!w.enabled, welcomeMessage: w.welcomeMessage || '', buttonText: w.buttonText || '' });
        } catch (_e) {}
        const m = (() => { try { return JSON.parse(data.metrics || '{}'); } catch { return {}; } })();
        if (m.responseDelay !== undefined) setResponseDelay(m.responseDelay);
        if (m.workingHours) setHours(m.workingHours);
        if (m.adminNumber) setAdminPhone(m.adminNumber.replace('@c.us', ''));
        if (data.language) setLanguage(data.language);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeBotId]);

  // -- Cargar lista de bots (para Scale) --
  useEffect(() => {
    shopifyFetch(`${API}/api/shopify/embedded/bots`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAllBots(data); })
      .catch(() => {});
  }, [activeBotId]);

  async function handleCreateSecondBot() {
    if (!newBotName.trim()) return;
    setCreatingBot(true); setBotSwitchMsg(null);
    try {
      const res = await shopifyFetch(`${API}/api/shopify/embedded/bots`, {
        method: 'POST',
        body: JSON.stringify({ name: newBotName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setBotSwitchMsg({ ok: false, text: data.error || 'Error al crear el bot.' }); return; }
      setNewBotName('');
      setActiveBotId(data.botId);
      setBotSwitchMsg({ ok: true, text: `Bot "${data.name}" creado exitosamente.` });
    } catch (_e) { setBotSwitchMsg({ ok: false, text: 'Error de conexión.' }); }
    finally { setCreatingBot(false); }
  }

  useEffect(() => {
    if (selectedTab === 1) loadTurnos();
  }, [selectedTab]);

  async function loadTurnos() {
    try {
      const [sRes, aRes] = await Promise.all([
        shopifyFetch(`${API}/api/shopify/embedded/specialties`),
        shopifyFetch(`${API}/api/shopify/embedded/appointments`),
      ]);
      const specsData = await sRes.json();
      const apptsData = await aRes.json();
      setSpecialties(Array.isArray(specsData) ? specsData : []);
      setAppointments(Array.isArray(apptsData) ? apptsData : []);
      const sched = {};
      for (const spec of (Array.isArray(specsData) ? specsData : [])) {
        const slots = Array.isArray(spec.schedule) ? spec.schedule : [];
        const dayMap = {};
        for (const sl of slots) {
          const d = sl.day_of_week;
          if (!dayMap[d]) dayMap[d] = [];
          dayMap[d].push({ start_time: sl.start_time, end_time: sl.end_time });
        }
        sched[spec.id] = Array.from({ length: 7 }, (_, i) => ({
          day_of_week: i,
          active: !!(dayMap[i]?.length),
          windows: dayMap[i]?.length ? dayMap[i] : [{ start_time: '09:00', end_time: '18:00' }],
        }));
      }
      setSchedule(sched);
      if (Array.isArray(specsData) && specsData.length > 0) {
        setSelectedSpecId(prev => prev || specsData[0].id);
      }
    } catch (_e) {}
  }

  useEffect(() => {
    async function load() {
      const specId = newAppt.specialty_id;
      const date = newAppt.date;
      if (!specId || !date) { setAvailableSlots([]); return; }
      const spec = specialties.find(s => s.id === specId);
      if (!spec) { setAvailableSlots([]); return; }
      const dow = new Date(date + 'T12:00:00').getDay();
      const adjustedDow = dow === 0 ? 6 : dow - 1;
      const { slots: allSlots, dayMap } = getTimeSlotsForSpec(spec);
      if (!dayMap[adjustedDow]) { setAvailableSlots([]); return; }
      try {
        const res = await shopifyFetch(`${API}/api/shopify/embedded/appointments?date=${date}`);
        const existing = await res.json();
        const taken = new Set(existing.filter(a => a.specialty_id === specId).map(a => a.time?.slice(0, 5)));
        setAvailableSlots(allSlots.filter(s => !taken.has(s)));
      } catch (_e) { setAvailableSlots(allSlots); }
    }
    load();
  }, [newAppt.specialty_id, newAppt.date]);

  // -- WhatsApp --
  async function pollStatus() {
    pollCountRef.current += 1;
    if (pollCountRef.current > 45) {
      clearInterval(pollRef.current);
      setStarting(false); setQrData(null);
      setStartError('No se pudo generar el código QR. Revisá que el servidor tenga Chromium disponible e intentá de nuevo.');
      return;
    }
    try {
      const res = await shopifyFetch(`${API}/api/shopify/embedded/status`);
      const data = await res.json();
      if (data.status === 'OFF' && pollCountRef.current > 5) {
        clearInterval(pollRef.current);
        setStarting(false); setQrData(null);
        setStartError('El servidor no pudo iniciar WhatsApp. Revis los logs e intent de nuevo.');
        return;
      }
      if (data.qr) setQrData(data.qr);
      if (data.businessPhone) setBot(b => ({ ...b, businessPhone: data.businessPhone }));
      if (data.status === 'ON') {
        setBot(b => ({ ...b, status: 'ON', businessPhone: data.businessPhone || b?.businessPhone }));
        setStarting(false); setQrData(null);
        clearInterval(pollRef.current);
      }
    } catch (_e) {}
  }

  async function startBot() {
    setStarting(true); setQrData(null); setStartError(null);
    pollCountRef.current = 0;
    try {
      await shopifyFetch(`${API}/api/shopify/embedded/start`, { method: 'POST' });
      pollRef.current = setInterval(pollStatus, 2000);
    } catch (_e) { setStarting(false); }
  }

  async function stopBot() {
    try { await shopifyFetch(`${API}/api/shopify/embedded/stop`, { method: 'POST' }); } catch (_e) {}
    setBot(b => ({ ...b, status: 'OFF' }));
    setStarting(false); setQrData(null);
    clearInterval(pollRef.current);
  }

  // -- Config (guarda todo junto) --
  async function saveConfig() {
    setSaving(true); setSaveMsg(null);
    try {
      const res = await shopifyFetch(`${API}/api/shopify/embedded/bot`, {
        method: 'POST',
        body: JSON.stringify({ prompt, knowledgeBase: kb, responseDelay, workingHours: hours, adminPhone, widget, language }),
      });
      const d = await res.json();
      setSaveMsg(d.ok ? { ok: true, text: 'Configuración guardada.' } : { ok: false, text: d.error || 'Error.' });
    } catch (_e) { setSaveMsg({ ok: false, text: 'Error de conexin.' }); }
    finally { setSaving(false); }
  }

  async function syncCatalog() {
    setSyncing(true); setSyncMsg(null);
    try {
      const res = await shopifyFetch(`${API}/api/shopify/embedded/sync`, { method: 'POST' });
      const d = await res.json();
      setSyncMsg(d.success ? { ok: true, text: 'Catálogo sincronizado.' } : { ok: false, text: d.error || 'Error.' });
    } catch (_e) { setSyncMsg({ ok: false, text: 'Error de conexin.' }); }
    finally { setSyncing(false); }
  }

  // -- Turnos --
  async function createSpecialty() {
    if (!newSpec.name) return;
    setTurnosSaving(true); setApptMsg(null);
    try {
      await shopifyFetch(`${API}/api/shopify/embedded/specialties`, { method: 'POST', body: JSON.stringify(newSpec) });
      setNewSpec({ name: '', duration_minutes: 30, color: '#7c3aed', capacity: 1, reminder_enabled: true, reminder_hours: [24] });
      setShowNewSpec(false);
      loadTurnos();
    } catch (_e) { setApptMsg({ ok: false, text: 'Error al crear servicio.' }); }
    finally { setTurnosSaving(false); }
  }

  async function updateSpecialty() {
    if (!editingSpec?.name.trim()) return;
    setTurnosSaving(true);
    await shopifyFetch(`${API}/api/shopify/embedded/specialties/${editingSpec.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: editingSpec.name, duration_minutes: editingSpec.duration_minutes, capacity: editingSpec.capacity, color: editingSpec.color, reminder_enabled: editingSpec.reminder_enabled, reminder_hours: editingSpec.reminder_hours })
    });
    setTurnosSaving(false); setEditingSpec(null); loadTurnos();
  }

  async function deleteSpecialty(id) {
    await shopifyFetch(`${API}/api/shopify/embedded/specialties/${id}`, { method: 'DELETE' });
    setSelectedSpecId(prev => prev === id ? null : prev);
    loadTurnos();
  }

  async function createAppointment() {
    if (!newAppt.specialty_id || !newAppt.client_phone || !newAppt.date || !newAppt.time) {
      setApptMsg({ ok: false, text: 'Complet todos los campos requeridos.' }); return;
    }
    setTurnosSaving(true); setApptMsg(null);
    try {
      await shopifyFetch(`${API}/api/shopify/embedded/appointments`, { method: 'POST', body: JSON.stringify(newAppt) });
      setNewAppt({ specialty_id: '', client_name: '', client_phone: '', date: new Date().toISOString().slice(0, 10), time: '', notes: '' });
      setShowNewAppt(false);
      setAvailableSlots([]);
      loadTurnos();
    } catch (_e) { setApptMsg({ ok: false, text: 'Error al crear turno.' }); }
    finally { setTurnosSaving(false); }
  }

  async function updateApptStatus(id, status) {
    await shopifyFetch(`${API}/api/shopify/embedded/appointments/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    setApptDetail(null);
    loadTurnos();
  }

  async function deleteAppt(id) {
    if (!confirm('¿Eliminar este turno definitivamente? Esta acción no se puede deshacer.')) return;
    await shopifyFetch(`${API}/api/shopify/embedded/appointments/${id}`, { method: 'DELETE' });
    setApptDetail(null); loadTurnos();
  }

  function toggleDay(specId, dayIndex, active) {
    setSchedule(prev => {
      const days = [...(prev[specId] || [])];
      days[dayIndex] = { ...days[dayIndex], active };
      return { ...prev, [specId]: days };
    });
  }

  function updateWindow(specId, dayIndex, windowIndex, field, value) {
    setSchedule(prev => {
      const days = [...(prev[specId] || [])];
      const windows = [...(days[dayIndex]?.windows || [])];
      windows[windowIndex] = { ...windows[windowIndex], [field]: value };
      days[dayIndex] = { ...days[dayIndex], windows };
      return { ...prev, [specId]: days };
    });
  }

  function addWindow(specId, dayIndex) {
    setSchedule(prev => {
      const days = [...(prev[specId] || [])];
      const windows = [...(days[dayIndex]?.windows || []), { start_time: '09:00', end_time: '18:00' }];
      days[dayIndex] = { ...days[dayIndex], windows };
      return { ...prev, [specId]: days };
    });
  }

  function removeWindow(specId, dayIndex, windowIndex) {
    setSchedule(prev => {
      const days = [...(prev[specId] || [])];
      const windows = (days[dayIndex]?.windows || []).filter((_, i) => i !== windowIndex);
      days[dayIndex] = { ...days[dayIndex], windows };
      return { ...prev, [specId]: days };
    });
  }

  async function saveSchedule(specId) {
    setSavingSchedule(true); setScheduleMsg(null);
    const daySlots = schedule[specId] || [];
    const slots = [];
    for (const day of daySlots) {
      if (!day.active) continue;
      for (const w of (day.windows || [])) {
        slots.push({ day_of_week: day.day_of_week, start_time: w.start_time, end_time: w.end_time, active: true });
      }
    }
    try {
      const res = await shopifyFetch(`${API}/api/shopify/embedded/specialties/${specId}/schedule`, {
        method: 'PUT', body: JSON.stringify({ slots }),
      });
      const d = await res.json();
      setScheduleMsg(d.ok ? { ok: true, text: 'Horarios guardados correctamente.' } : { ok: false, text: d.error || 'Error.' });
      loadTurnos();
    } catch (_e) { setScheduleMsg({ ok: false, text: 'Error de conexin.' }); }
    finally { setSavingSchedule(false); setTimeout(() => setScheduleMsg(null), 4000); }
  }

  useEffect(() => {
    if (selectedTab === 3) loadMarketing();
  }, [selectedTab]);

  async function loadMarketing() {
    setMarketingLoading(true);
    try {
      const [cRes, camRes, cartRes] = await Promise.all([
        shopifyFetch(`${API}/api/shopify/embedded/customers`),
        shopifyFetch(`${API}/api/shopify/embedded/campaigns`),
        shopifyFetch(`${API}/api/shopify/embedded/abandoned-cart`),
      ]);
      setCustomers(await cRes.json());
      setCampaigns(await camRes.json());
      const cartData = await cartRes.json();
      setCartConfig(cartData.config);
      setAbandonedCarts(cartData.carts || []);
    } catch (_e) {}
    finally { setMarketingLoading(false); }
  }

  async function saveCartConfig() {
    setCartSaving(true);
    try {
      await shopifyFetch(`${API}/api/shopify/embedded/abandoned-cart`, { method: 'PUT', body: JSON.stringify(cartConfig) });
      setMarketingMsg({ ok: true, text: 'Configuración de carritos guardada.' });
    } catch (_e) { setMarketingMsg({ ok: false, text: 'Error de conexin.' }); }
    finally { setCartSaving(false); setTimeout(() => setMarketingMsg(null), 4000); }
  }

  async function createCampaign() {
    if (!newCampaign.name || !newCampaign.message_template) {
      setMarketingMsg({ ok: false, text: 'Nombre y mensaje son requeridos.' }); return;
    }
    try {
      const res = await shopifyFetch(`${API}/api/shopify/embedded/campaigns`, { method: 'POST', body: JSON.stringify(newCampaign) });
      const d = await res.json();
      if (d.id) {
        setNewCampaign({ name: '', message_template: '', delay_seconds: 30 });
        setShowNewCampaign(false);
        loadMarketing();
      }
    } catch (_e) { setMarketingMsg({ ok: false, text: 'Error al crear campaa.' }); }
  }

  async function addCustomersToCampaign(campaignId) {
    try {
      const res = await shopifyFetch(`${API}/api/shopify/embedded/campaigns/${campaignId}/add-customers`, { method: 'POST', body: JSON.stringify({}) });
      const d = await res.json();
      setMarketingMsg({ ok: true, text: `${d.added} clientes agregados a la campaa.` });
      loadMarketing();
    } catch (_e) { setMarketingMsg({ ok: false, text: 'Error al agregar clientes.' }); }
  }

  async function startCampaign(id) {
    try {
      const res = await shopifyFetch(`${API}/api/shopify/embedded/campaigns/${id}/start`, { method: 'POST' });
      const d = await res.json();
      if (!d.ok) setMarketingMsg({ ok: false, text: d.error });
      else loadMarketing();
    } catch (_e) { setMarketingMsg({ ok: false, text: 'Error.' }); }
  }

  async function pauseCampaign(id) {
    try {
      await shopifyFetch(`${API}/api/shopify/embedded/campaigns/${id}/pause`, { method: 'POST' });
      loadMarketing();
    } catch (_e) {}
  }

  async function deleteCampaign(id) {
    try {
      await shopifyFetch(`${API}/api/shopify/embedded/campaigns/${id}`, { method: 'DELETE' });
      loadMarketing();
    } catch (_e) {}
  }

  if (loading) return (
    <Page><Layout><Layout.Section>
      <Card><Box padding="800"><InlineStack align="center"><Spinner size="large" /></InlineStack></Box></Card>
    </Layout.Section></Layout></Page>
  );

  const isOn = bot?.status === 'ON';
  const metrics = (() => { try { return JSON.parse(bot?.metrics || '{}'); } catch { return {}; } })();

  const tabs = [
    { id: 'config', content: 'Configuración' },
    { id: 'turnos', content: 'Turnos' },
    { id: 'preview', content: 'Probar asistente' },
    { id: 'marketing', content: 'Marketing' },
  ];

  async function sendPreview(message, history) {
    const res = await shopifyFetch(`${API}/api/shopify/embedded/preview`, {
      method: 'POST',
      body: JSON.stringify({ message, history, prompt, knowledgeBase: kb }),
    });
    const d = await res.json();
    return d.reply || d.error || 'Sin respuesta.';
  }

  const specOptions = [
    { label: 'Seleccion un servicio', value: '' },
    ...specialties.map(s => ({ label: s.name, value: s.id })),
  ];

  const statusColors = { confirmed: '#10b981', completed: '#3b82f6', cancelled: '#ef4444' };
  const statusLabels = { confirmed: 'Confirmado', completed: 'Completado', cancelled: 'Cancelado' };

  const planLimits = { starter: 1500, growth: 5000, scale: null };
  const planLimit = planLimits[bot?.plan] ?? 1500;
  const msgUsed = bot?.monthlyMessages || 0;
  const msgPct = planLimit ? Math.min(100, Math.round((msgUsed / planLimit) * 100)) : 0;
  const isScale = bot?.plan === 'scale';

  return (
    <Page title={bot?.name || 'Atento AI'} subtitle="Asistente virtual con inteligencia artificial">
      <Layout>

        {/* -- Selector de bot (Scale) -- */}
        {isScale && (
          <Layout.Section>
            <Card>
              <Box padding="400">
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingSm" as="h3">Mis bots — Plan Scale</Text>
                    <Text variant="bodySm" tone="subdued">{allBots.length}/2 bots activos</Text>
                  </InlineStack>
                  <InlineStack gap="200" wrap>
                    {allBots.map(b => (
                      <Button
                        key={b.id}
                        variant={b.id === (activeBotId || allBots[0]?.id) ? 'primary' : 'secondary'}
                        onClick={() => setActiveBotId(b.id)}
                      >
                        {b.name} {b.status === 'ON' ? '🟢' : '⚫'}
                      </Button>
                    ))}
                  </InlineStack>
                  {allBots.length < 2 && (
                    <BlockStack gap="200">
                      <TextField
                        label="Nombre del segundo bot"
                        value={newBotName}
                        onChange={setNewBotName}
                        placeholder="Ej: Bot Sucursal Norte"
                        autoComplete="off"
                      />
                      <Button onClick={handleCreateSecondBot} loading={creatingBot} variant="primary">
                        + Crear segundo bot
                      </Button>
                    </BlockStack>
                  )}
                  {botSwitchMsg && (
                    <Banner tone={botSwitchMsg.ok ? 'success' : 'critical'}>{botSwitchMsg.text}</Banner>
                  )}
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}

        {/* -- Plan y uso de mensajes -- */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text variant="headingSm" as="h3">
                    Plan {bot?.plan ? bot.plan.charAt(0).toUpperCase() + bot.plan.slice(1) : 'Starter'}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    {planLimit
                      ? `${msgUsed.toLocaleString()} / ${planLimit.toLocaleString()} mensajes este mes (${msgPct}%)`
                      : `${msgUsed.toLocaleString()} mensajes este mes — ilimitados`}
                  </Text>
                </BlockStack>
              </InlineStack>
              {planLimit && (
                <Box paddingBlockStart="300">
                  <div style={{ height: 6, background: '#e4e5e7', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${msgPct}%`, background: msgPct >= 90 ? '#ef4444' : msgPct >= 70 ? '#f59e0b' : '#22c55e', borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                </Box>
              )}
            </Box>
          </Card>
        </Layout.Section>

        {/* -- Banner estado -- */}
        <Layout.Section>
          <Banner tone={isOn ? 'success' : 'warning'} title={isOn ? '✅ Asistente activo' : '⚠️ Asistente inactivo'}>
            <Text as="p" variant="bodyMd" tone="subdued">
              {isOn
                ? `${metrics.messagesSent || 0} mensajes respondidos · ${metrics.customersHelped || 0} chats atendidos`
                : 'Conectá WhatsApp en la sección de Configuración para activar el asistente.'}
            </Text>
          </Banner>
        </Layout.Section>

        {/* -- Mtricas -- */}
        <Layout.Section>
          <InlineGrid columns={3} gap="400">
            {[
              { label: 'Mensajes respondidos', value: metrics.messagesSent || 0 },
              { label: 'Clientes atendidos', value: metrics.customersHelped || 0 },
              { label: 'Conversiones', value: metrics.weeklySales || 0 },
            ].map((m, i) => (
              <Card key={i}>
                <Box padding="400">
                  <BlockStack gap="100">
                    <Text variant="headingXl" as="p">{m.value.toLocaleString()}</Text>
                    <Text variant="bodySm" tone="subdued">{m.label}</Text>
                  </BlockStack>
                </Box>
              </Card>
            ))}
          </InlineGrid>
        </Layout.Section>

        {/* -- Tabs -- */}
        <Layout.Section>
          <Card padding="0">
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              <Box padding="400">

                {/* ---- TAB: CONFIGURACIN ---- */}
                {selectedTab === 0 && (
                  <BlockStack gap="500">

                    {/* -- WhatsApp -- */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Conexión WhatsApp</Text>
                      {isOn ? (
                        <BlockStack gap="300">
                          <Banner tone="success">
                            <BlockStack gap="100">
                              <Text variant="bodyMd" fontWeight="semibold">WhatsApp conectado y activo</Text>
                              {bot?.businessPhone && (
                                <Text variant="bodySm" tone="subdued">
                                  Nmero conectado: <strong>+{bot.businessPhone}</strong>
                                </Text>
                              )}
                              <Text variant="bodySm" tone="subdued">El asistente está respondiendo mensajes automáticamente.</Text>
                            </BlockStack>
                          </Banner>
                          <InlineStack>
                            <Button onClick={stopBot} tone="critical">Desconectar WhatsApp</Button>
                          </InlineStack>
                        </BlockStack>
                      ) : startError ? (
                        <BlockStack gap="300">
                          <Banner tone="critical">{startError}</Banner>
                          <InlineStack>
                            <Button onClick={startBot} variant="primary">Reintentar</Button>
                          </InlineStack>
                        </BlockStack>
                      ) : starting ? (
                        <BlockStack gap="400">
                          {qrData ? (
                            <>
                              <Text variant="bodySm" tone="subdued">Abrí WhatsApp &gt; Dispositivos vinculados &gt; Escanear QR</Text>
                              <InlineStack align="center">
                                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', display: 'inline-block' }}>
                                  <QRCodeSVG value={qrData} size={200} />
                                </div>
                              </InlineStack>
                              <Text variant="bodySm" tone="subdued" alignment="center">El código expira en 60 segundos — se actualiza automáticamente.</Text>
                            </>
                          ) : (
                            <InlineStack gap="300">
                              <Spinner size="small" />
                              <Text variant="bodySm" tone="subdued">Iniciando, aguardá el código QR</Text>
                            </InlineStack>
                          )}
                          <InlineStack>
                            <Button onClick={stopBot} variant="plain">Cancelar</Button>
                          </InlineStack>
                        </BlockStack>
                      ) : (
                        <BlockStack gap="300">
                          <Text variant="bodySm" tone="subdued">Escaneá el QR con tu WhatsApp Business para que el asistente empiece a responder mensajes.</Text>
                          <InlineStack>
                            <Button onClick={startBot} variant="primary">Conectar WhatsApp</Button>
                          </InlineStack>
                        </BlockStack>
                      )}
                    </BlockStack>

                    <Divider />

                    {/* -- Botn WhatsApp en la tienda -- */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Botón de WhatsApp en tu tienda</Text>
                      <Text variant="bodySm" tone="subdued">
                        Agrega un botón flotante en tu tienda. Cuando un cliente lo toca, se abre WhatsApp listo para escribirte a vos.
                        {bot?.businessPhone
                          ? ` Los mensajes llegarán al número +${bot.businessPhone}.`
                          : ' Conectá WhatsApp arriba para activarlo.'}
                      </Text>
                      <Checkbox
                        label="Mostrar botón de WhatsApp en la tienda"
                        checked={!!widget.enabled}
                        onChange={v => setWidget(w => ({ ...w, enabled: v }))}
                        disabled={!bot?.businessPhone}
                      />
                      {widget.enabled && (
                        <BlockStack gap="300">
                          <TextField
                            label="Mensaje inicial del cliente"
                            value={widget.welcomeMessage}
                            onChange={v => setWidget(w => ({ ...w, welcomeMessage: v }))}
                            placeholder="Hola! Tengo una consulta sobre un producto."
                            helpText="Texto que aparece pre-escrito en WhatsApp cuando el cliente toca el botón."
                            autoComplete="off"
                          />
                          <TextField
                            label="Texto del botón flotante"
                            value={widget.buttonText}
                            onChange={v => setWidget(w => ({ ...w, buttonText: v }))}
                            placeholder="Chate con nosotros"
                            helpText="Etiqueta que aparece al lado del botón verde."
                            autoComplete="off"
                          />
                        </BlockStack>
                      )}
                    </BlockStack>

                    <Divider />

                    {/* -- Catlogo -- */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Catálogo de productos</Text>
                      <Text variant="bodySm" tone="subdued">El asistente sincroniza tu catálogo automáticamente al crear o modificar productos. También podés hacerlo manualmente.</Text>
                      {syncMsg && <Banner tone={syncMsg.ok ? 'success' : 'critical'}>{syncMsg.text}</Banner>}
                      <InlineStack>
                        <Button onClick={syncCatalog} loading={syncing}>Sincronizar ahora</Button>
                      </InlineStack>
                    </BlockStack>

                    <Divider />

                    {/* -- Idioma -- */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Idioma de respuestas</Text>
                      <Text variant="bodySm" tone="subdued">
                        En qué idioma responde el asistente. Si elegís un idioma distinto al español, el asistente responderá siempre en ese idioma aunque el cliente escriba en otro.
                      </Text>
                      <Select
                        label="Idioma del asistente"
                        options={[
                          { label: 'Español', value: 'es' },
                          { label: 'English', value: 'en' },
                          { label: 'Português', value: 'pt' },
                          { label: 'Deutsch', value: 'de' },
                          { label: 'Français', value: 'fr' },
                          { label: 'العربية', value: 'ar' },
                          { label: 'Italiano', value: 'it' },
                        ]}
                        value={language}
                        onChange={setLanguage}
                      />
                    </BlockStack>

                    <Divider />

                    {/* -- Comportamiento -- */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Comportamiento del asistente</Text>
                      <Text variant="bodySm" tone="subdued">Definí la personalidad: cómo saluda, qué tono usa, si tutea o usa "usted".</Text>
                      <TextField label="Personalidad e instrucciones" value={prompt} onChange={setPrompt} multiline={6}
                        placeholder="Ej: Sos el asistente de [Negocio]. Respond de forma amigable..." autoComplete="off" />
                    </BlockStack>

                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Base de conocimientos</Text>
                      <Text variant="bodySm" tone="subdued">Horarios, precios, políticas, preguntas frecuentes, catálogo.</Text>
                      <TextField label="Conocimiento del negocio" value={kb} onChange={setKb} multiline={8}
                        placeholder="[HORARIOS]&#10;Lunes a viernes 9-18hs&#10;&#10;[ENVOS]&#10;..." autoComplete="off" />
                    </BlockStack>

                    <Divider />

                    {/* -- Tiempo de espera -- */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Tiempo de espera antes de responder</Text>
                      <Text variant="bodySm" tone="subdued">
                        Si el cliente manda varios mensajes seguidos, el asistente espera este tiempo antes de responder — así agrupa todos los mensajes y contesta una sola vez.
                      </Text>
                      <RangeSlider
                        label={`Espera: ${responseDelay}s`}
                        min={0.5} max={60} step={0.5}
                        value={responseDelay}
                        onChange={v => setResponseDelay(v)}
                        output
                        suffix={<Text variant="bodySm" tone="subdued">Recomendado: 2.5s · Mínimo: 0.5s · Máximo: 60s</Text>}
                      />
                    </BlockStack>

                    <Divider />

                    {/* -- Horario -- */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Horario de atención (Anti-Nocturno)</Text>
                      <Text variant="bodySm" tone="subdued">
                        Activá esta opción para que el asistente solo responda dentro de tu horario comercial. Fuera de ese horario, enviará el mensaje automático.
                      </Text>
                      <Checkbox
                        label="Activar límite de horario"
                        checked={!!hours.active}
                        onChange={v => setHours(h => ({ ...h, active: v }))}
                      />
                      {hours.active && (
                        <BlockStack gap="300">
                          <InlineStack gap="400">
                            <TextField label="Abre" type="time" value={hours.start}
                              onChange={v => setHours(h => ({ ...h, start: v }))} autoComplete="off" />
                            <TextField label="Cierra" type="time" value={hours.end}
                              onChange={v => setHours(h => ({ ...h, end: v }))} autoComplete="off" />
                          </InlineStack>
                          <TextField
                            label="Mensaje automático fuera de horario"
                            value={hours.autoReplyMsg}
                            onChange={v => setHours(h => ({ ...h, autoReplyMsg: v }))}
                            placeholder="Ej: Hola! Estamos cerrados ahora, mañana a primera hora te atendemos."
                            multiline={3}
                            autoComplete="off"
                          />
                        </BlockStack>
                      )}
                    </BlockStack>

                    <Divider />

                    {/* -- Celular del dueo -- */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Tu celular (línea directa con el asistente)</Text>
                      <Text variant="bodySm" tone="subdued">
                        Escribile desde este número para dar indicaciones en tiempo real: actualizar info, consultar reportes de ventas, ver turnos del día. El asistente te responde solo a vos con información de dueño.
                      </Text>
                      <TextField
                        label="Tu número de WhatsApp"
                        value={adminPhone}
                        onChange={setAdminPhone}
                        placeholder="5491150001234"
                        helpText="Código de país + número, sin + ni espacios. Ejemplo para Argentina: 5491150001234."
                        autoComplete="off"
                      />
                    </BlockStack>

                    <Divider />

                    {/* -- Instagram & Facebook  Prximamente -- */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Instagram & Facebook DMs</Text>
                      <div style={{ background: 'rgba(225,48,108,0.04)', border: '1px solid rgba(225,48,108,0.18)', borderRadius: 12, padding: '1.1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flexShrink: 0, paddingTop: '0.1rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(225,48,108,0.15)', color: '#e1306c', padding: '2px 6px', borderRadius: 4 }}>IG</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(24,119,242,0.15)', color: '#1877f2', padding: '2px 6px', borderRadius: 4 }}>FB</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                            <Text variant="bodyMd" fontWeight="semibold">Respuestas automáticas por Instagram y Facebook</Text>
                            <span style={{ background: '#ff6900', color: '#fff', fontSize: '0.63rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>Próximamente</span>
                          </div>
                          <Text variant="bodySm" tone="subdued">
                            Estamos tramitando el acceso como Meta Partner. Cuando esté disponible, el asistente responderá DMs de Instagram y mensajes de Facebook Messenger sin configuración adicional.
                          </Text>
                        </div>
                      </div>
                    </BlockStack>

                    {saveMsg && <Banner tone={saveMsg.ok ? 'success' : 'critical'}>{saveMsg.text}</Banner>}
                    <InlineStack>
                      <Button onClick={saveConfig} loading={saving} variant="primary">Guardar configuración</Button>
                    </InlineStack>

                  </BlockStack>
                )}

                {/* ---- TAB: TURNOS ---- */}
                {selectedTab === 1 && (() => {
                  const weekDays = getWeekDays(weekOffset);
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const apptIndex = {};
                  appointments.forEach(a => { apptIndex[`${a.date}_${a.time}_${a.specialty_id}`] = a; });
                  const activeSpec = specialties.find(s => s.id === selectedSpecId);
                  const { slots, dayMap } = activeSpec ? getTimeSlotsForSpec(activeSpec) : { slots: [], dayMap: {} };
                  const hasSchedule = slots.length > 0;
                  const dur = activeSpec?.duration_minutes || 30;
                  const displaySlots = hasSchedule ? slots : Array.from(
                    { length: Math.ceil(720 / dur) },
                    (_, i) => { const m = 480 + i * dur; return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`; }
                  );
                  const inputSt = { width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #c9cccf', background: '#fff', color: '#202223', fontSize: '0.9rem', boxSizing: 'border-box' };
                  const labelSt = { fontSize: '0.8rem', color: '#6d7175', display: 'block', marginBottom: '0.25rem' };
                  return (
                  <div>

                    {/* Modal editar servicio */}
                    {editingSpec && (
                      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#202223' }}>Editar servicio</span>
                            <button onClick={() => setEditingSpec(null)} style={{ background: 'none', border: '1px solid #c9cccf', borderRadius: 8, color: '#6d7175', cursor: 'pointer', padding: '0.3rem 0.7rem' }}>?</button>
                          </div>
                          <div><label style={labelSt}>Nombre *</label>
                            <input style={inputSt} value={editingSpec.name} onChange={e => setEditingSpec(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del servicio..." />
                          </div>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}><label style={labelSt}>Duración (min)</label>
                              <input style={inputSt} type="number" min="5" max="480" value={editingSpec.duration_minutes} onChange={e => setEditingSpec(p => ({ ...p, duration_minutes: Number(e.target.value) }))} />
                            </div>
                            <div style={{ flex: 1 }}><label style={labelSt}>Lugares simultáneos</label>
                              <input style={inputSt} type="number" min="1" max="100" value={editingSpec.capacity} onChange={e => setEditingSpec(p => ({ ...p, capacity: Number(e.target.value) }))} />
                            </div>
                            <div><label style={labelSt}>Color</label>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                {SPEC_COLORS.map(c => (
                                  <div key={c} onClick={() => setEditingSpec(p => ({ ...p, color: c }))}
                                    style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: editingSpec.color === c ? '2px solid #202223' : '2px solid transparent', boxSizing: 'border-box' }} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#202223' }}>Recordatorio automático</div>
                              <div style={{ fontSize: '0.75rem', color: '#6d7175' }}>Avisa al cliente por WhatsApp antes del turno</div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0 }}>
                              <input type="checkbox" checked={!!editingSpec.reminder_enabled} onChange={e => setEditingSpec(p => ({ ...p, reminder_enabled: e.target.checked }))} style={{ opacity: 0, width: 0, height: 0 }} />
                              <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: 34, background: editingSpec.reminder_enabled ? '#7c3aed' : '#c9cccf', transition: '0.2s' }}>
                                <span style={{ position: 'absolute', height: 18, width: 18, left: editingSpec.reminder_enabled ? 23 : 3, bottom: 3, background: 'white', borderRadius: '50%', transition: '0.2s' }} />
                              </span>
                            </label>
                          </div>
                          {editingSpec.reminder_enabled && (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <label style={labelSt}>Avisos antes del turno</label>
                                <button onClick={() => setEditingSpec(p => ({ ...p, reminder_hours: [...p.reminder_hours, 2] }))}
                                  style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', padding: '0.2rem 0.65rem', fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}>+</button>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {editingSpec.reminder_hours.map((h, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.22)', borderRadius: 8, padding: '0.3rem 0.5rem' }}>
                                    <input type="number" min="1" max="168" value={h}
                                      onChange={e => setEditingSpec(p => ({ ...p, reminder_hours: p.reminder_hours.map((v, j) => j === i ? Number(e.target.value) : v) }))}
                                      style={{ ...inputSt, width: 56, margin: 0, padding: '0.25rem 0.4rem' }} />
                                    <span style={{ fontSize: '0.75rem', color: '#6d7175' }}>h antes</span>
                                    {editingSpec.reminder_hours.length > 1 && (
                                      <button onClick={() => setEditingSpec(p => ({ ...p, reminder_hours: p.reminder_hours.filter((_, j) => j !== i) }))}
                                        style={{ background: 'none', border: 'none', color: '#c9cccf', cursor: 'pointer', fontSize: '1rem', padding: '0 2px', lineHeight: 1 }}></button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditingSpec(null)} style={{ background: 'transparent', border: '1px solid #c9cccf', borderRadius: 8, color: '#6d7175', cursor: 'pointer', padding: '0.6rem 1rem' }}>Cancelar</button>
                            <button onClick={updateSpecialty} disabled={turnosSaving || !editingSpec.name.trim()} style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '0.6rem 1.25rem', fontWeight: 600 }}>
                              {turnosSaving ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Modal nuevo servicio */}
                    {showNewSpec && (
                      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#202223' }}>Nuevo servicio</span>
                            <button onClick={() => setShowNewSpec(false)} style={{ background: 'none', border: '1px solid #c9cccf', borderRadius: 8, color: '#6d7175', cursor: 'pointer', padding: '0.3rem 0.7rem' }}>?</button>
                          </div>
                          <div><label style={labelSt}>Nombre *</label>
                            <input style={inputSt} value={newSpec.name} onChange={e => setNewSpec(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Corte de cabello, Consulta médica..." />
                          </div>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}><label style={labelSt}>Duración (min)</label>
                              <input style={inputSt} type="number" min="5" max="480" value={newSpec.duration_minutes} onChange={e => setNewSpec(p => ({ ...p, duration_minutes: Number(e.target.value) }))} />
                            </div>
                            <div style={{ flex: 1 }}><label style={labelSt}>Lugares simultáneos</label>
                              <input style={inputSt} type="number" min="1" max="100" value={newSpec.capacity} onChange={e => setNewSpec(p => ({ ...p, capacity: Number(e.target.value) }))} />
                            </div>
                            <div><label style={labelSt}>Color</label>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                {SPEC_COLORS.map(c => (
                                  <div key={c} onClick={() => setNewSpec(p => ({ ...p, color: c }))}
                                    style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: newSpec.color === c ? '2px solid #202223' : '2px solid transparent', boxSizing: 'border-box' }} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#202223' }}>Recordatorio automático</div>
                              <div style={{ fontSize: '0.75rem', color: '#6d7175' }}>Avisa al cliente por WhatsApp antes del turno</div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0 }}>
                              <input type="checkbox" checked={!!newSpec.reminder_enabled} onChange={e => setNewSpec(p => ({ ...p, reminder_enabled: e.target.checked }))} style={{ opacity: 0, width: 0, height: 0 }} />
                              <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: 34, background: newSpec.reminder_enabled ? '#7c3aed' : '#c9cccf', transition: '0.2s' }}>
                                <span style={{ position: 'absolute', height: 18, width: 18, left: newSpec.reminder_enabled ? 23 : 3, bottom: 3, background: 'white', borderRadius: '50%', transition: '0.2s' }} />
                              </span>
                            </label>
                          </div>
                          {newSpec.reminder_enabled && (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <label style={labelSt}>Avisos antes del turno</label>
                                <button onClick={() => setNewSpec(p => ({ ...p, reminder_hours: [...p.reminder_hours, 2] }))}
                                  style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', padding: '0.2rem 0.65rem', fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}>+</button>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {newSpec.reminder_hours.map((h, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.22)', borderRadius: 8, padding: '0.3rem 0.5rem' }}>
                                    <input type="number" min="1" max="168" value={h}
                                      onChange={e => setNewSpec(p => ({ ...p, reminder_hours: p.reminder_hours.map((v, j) => j === i ? Number(e.target.value) : v) }))}
                                      style={{ ...inputSt, width: 56, margin: 0, padding: '0.25rem 0.4rem' }} />
                                    <span style={{ fontSize: '0.75rem', color: '#6d7175' }}>h antes</span>
                                    {newSpec.reminder_hours.length > 1 && (
                                      <button onClick={() => setNewSpec(p => ({ ...p, reminder_hours: p.reminder_hours.filter((_, j) => j !== i) }))}
                                        style={{ background: 'none', border: 'none', color: '#c9cccf', cursor: 'pointer', fontSize: '1rem', padding: '0 2px', lineHeight: 1 }}></button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowNewSpec(false)} style={{ background: 'transparent', border: '1px solid #c9cccf', borderRadius: 8, color: '#6d7175', cursor: 'pointer', padding: '0.6rem 1rem' }}>Cancelar</button>
                            <button onClick={createSpecialty} disabled={turnosSaving || !newSpec.name.trim()} style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '0.6rem 1.25rem', fontWeight: 600 }}>
                              {turnosSaving ? 'Creando...' : 'Crear servicio'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Modal nuevo turno */}
                    {showNewAppt && (
                      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#202223' }}>Nuevo turno manual</span>
                            <button onClick={() => { setShowNewAppt(false); setApptMsg(null); }} style={{ background: 'none', border: '1px solid #c9cccf', borderRadius: 8, color: '#6d7175', cursor: 'pointer', padding: '0.3rem 0.7rem' }}>?</button>
                          </div>
                          <div><label style={labelSt}>Servicio *</label>
                            <select style={inputSt} value={newAppt.specialty_id} onChange={e => setNewAppt(p => ({ ...p, specialty_id: e.target.value, time: '' }))}>
                              <option value=""> Seleccion </option>
                              {specialties.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes}min)</option>)}
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div style={{ flex: 1 }}><label style={labelSt}>Fecha *</label>
                              <input style={inputSt} type="date" value={newAppt.date} onChange={e => setNewAppt(p => ({ ...p, date: e.target.value, time: '' }))} />
                            </div>
                            <div style={{ flex: 1 }}><label style={labelSt}>Horario *</label>
                              {availableSlots.length > 0 ? (
                                <select style={inputSt} value={newAppt.time} onChange={e => setNewAppt(p => ({ ...p, time: e.target.value }))}>
                                  <option value=""> Seleccion </option>
                                  {availableSlots.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              ) : (
                                <input style={inputSt} type="time" value={newAppt.time} onChange={e => setNewAppt(p => ({ ...p, time: e.target.value }))} />
                              )}
                            </div>
                          </div>
                          <div><label style={labelSt}>Telfono WhatsApp * <span style={{ opacity: 0.6 }}>(ej: 5491123456789)</span></label>
                            <input style={inputSt} value={newAppt.client_phone} onChange={e => setNewAppt(p => ({ ...p, client_phone: e.target.value }))} placeholder="5491123456789" />
                          </div>
                          <div><label style={labelSt}>Nombre del cliente</label>
                            <input style={inputSt} value={newAppt.client_name} onChange={e => setNewAppt(p => ({ ...p, client_name: e.target.value }))} placeholder="Ej: Mara Gonzlez" />
                          </div>
                          <div><label style={labelSt}>Notas</label>
                            <input style={inputSt} value={newAppt.notes} onChange={e => setNewAppt(p => ({ ...p, notes: e.target.value }))} placeholder="Ej: Primera vez, requiere confirmación..." />
                          </div>
                          {apptMsg && <p style={{ margin: 0, fontSize: '0.875rem', color: apptMsg.ok ? '#008060' : '#d82c0d' }}>{apptMsg.text}</p>}
                          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setShowNewAppt(false); setApptMsg(null); }} style={{ background: 'transparent', border: '1px solid #c9cccf', borderRadius: 8, color: '#6d7175', cursor: 'pointer', padding: '0.6rem 1rem' }}>Cancelar</button>
                            <button onClick={createAppointment} disabled={turnosSaving} style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '0.6rem 1.25rem', fontWeight: 600 }}>
                              {turnosSaving ? 'Guardando...' : 'Confirmar turno'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Modal detalle de turno */}
                    {apptDetail && (() => {
                      const spec = specialties.find(s => s.id === apptDetail.specialty_id);
                      const sc = { confirmed: '#10b981', cancelled: '#d82c0d', completed: '#3b82f6' };
                      const sl = { confirmed: 'Confirmado', cancelled: 'Cancelado', completed: 'Completado' };
                      return (
                        <div onClick={() => setApptDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {spec && <div style={{ width: 10, height: 10, borderRadius: '50%', background: spec.color, flexShrink: 0 }} />}
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#202223' }}>{apptDetail.client_name || 'Sin nombre'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6d7175' }}>{spec?.name}  {apptDetail.date} {apptDetail.time}</div>
                              </div>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${sc[apptDetail.status]}20`, color: sc[apptDetail.status], border: `1px solid ${sc[apptDetail.status]}50` }}>{sl[apptDetail.status]}</span>
                              <button onClick={() => setApptDetail(null)} style={{ background: 'none', border: '1px solid #c9cccf', borderRadius: 8, color: '#6d7175', cursor: 'pointer', padding: '0.3rem 0.6rem', flexShrink: 0 }}>?</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {apptDetail.client_phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.85rem', background: '#f6f6f7', borderRadius: 8, border: '1px solid #e1e3e5' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#6d7175' }}>Tel.</span>
                                  <span style={{ fontSize: '0.875rem', flex: 1, color: '#202223' }}>{apptDetail.client_phone}</span>
                                  <a href={`https://wa.me/${apptDetail.client_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                                    style={{ fontSize: '0.72rem', background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.35)', borderRadius: 6, color: '#1a9c44', padding: '2px 8px', textDecoration: 'none', fontWeight: 600 }}>WhatsApp</a>
                                </div>
                              )}
                              {apptDetail.notes && (
                                <div style={{ display: 'flex', gap: '0.6rem', padding: '0.6rem 0.85rem', background: '#f6f6f7', borderRadius: 8, border: '1px solid #e1e3e5' }}>
                                  <span style={{ flexShrink: 0, fontSize: '0.75rem', color: '#6d7175' }}>Nota:</span>
                                  <span style={{ fontSize: '0.875rem', color: '#6d7175', lineHeight: 1.4 }}>{apptDetail.notes}</span>
                                </div>
                              )}
                            </div>
                            {apptDetail.status === 'confirmed' && (
                              <div style={{ display: 'flex', gap: '0.6rem' }}>
                                <button onClick={() => { updateApptStatus(apptDetail.id, 'completed'); setApptDetail(p => ({ ...p, status: 'completed' })); }}
                                  style={{ flex: 1, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 8, color: '#2563eb', cursor: 'pointer', padding: '0.55rem', fontWeight: 600, fontSize: '0.85rem' }}>Completado</button>
                                <button onClick={() => { updateApptStatus(apptDetail.id, 'cancelled'); setApptDetail(p => ({ ...p, status: 'cancelled' })); }}
                                  style={{ flex: 1, background: 'rgba(216,44,13,0.08)', border: '1px solid rgba(216,44,13,0.3)', borderRadius: 8, color: '#d82c0d', cursor: 'pointer', padding: '0.55rem', fontWeight: 600, fontSize: '0.85rem' }}>Cancelar</button>
                              </div>
                            )}
                            {apptDetail.status === 'cancelled' && (
                              <button onClick={() => { updateApptStatus(apptDetail.id, 'confirmed'); setApptDetail(p => ({ ...p, status: 'confirmed' })); }}
                                style={{ width: '100%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#008060', cursor: 'pointer', padding: '0.55rem', fontWeight: 600, fontSize: '0.85rem' }}>Restaurar turno</button>
                            )}
                            <button onClick={() => deleteAppt(apptDetail.id)}
                              style={{ width: '100%', marginTop: '0.5rem', background: 'rgba(216,44,13,0.06)', border: '1px solid rgba(216,44,13,0.25)', borderRadius: 8, color: '#d82c0d', cursor: 'pointer', padding: '0.45rem', fontWeight: 600, fontSize: '0.8rem' }}>
                              Eliminar turno
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Header y tabs de vista */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {[{ id: 'agenda', label: 'Agenda' }, { id: 'servicios', label: 'Servicios' }].map(t => (
                          <button key={t.id} onClick={() => setTurnosView(t.id)}
                            style={{ padding: '0.4rem 0.9rem', borderRadius: 20, border: '1px solid #c9cccf', background: turnosView === t.id ? 'linear-gradient(135deg,#7c3aed,#3b82f6)' : '#f6f6f7', color: turnosView === t.id ? '#fff' : '#6d7175', cursor: 'pointer', fontSize: '0.85rem', fontWeight: turnosView === t.id ? 700 : 400 }}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setShowNewSpec(true)}
                        style={{ marginLeft: 'auto', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600 }}>
                        + Nuevo servicio
                      </button>
                    </div>

                    {/* -- Vista Agenda -- */}
                    {turnosView === 'agenda' && (
                      <div>
                        {specialties.length === 0 ? (
                          <div style={{ background: '#f6f6f7', border: '1px dashed #c9cccf', borderRadius: 12, padding: '2rem', textAlign: 'center', color: '#6d7175', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            No hay servicios configurados. Creá uno en <strong>Servicios</strong>.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {specialties.map(spec => {
                              const confirmed = appointments.filter(a => a.specialty_id === spec.id && a.status === 'confirmed').length;
                              const isActive = selectedSpecId === spec.id;
                              return (
                                <div key={spec.id} onClick={() => setSelectedSpecId(isActive ? null : spec.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.75rem', borderRadius: 20, border: `1.5px solid ${isActive ? spec.color : '#c9cccf'}`, background: isActive ? `${spec.color}18` : '#f6f6f7', cursor: 'pointer', transition: 'all 0.15s' }}>
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: spec.color, flexShrink: 0 }} />
                                  <span style={{ fontWeight: 600, fontSize: '0.82rem', color: isActive ? '#202223' : '#6d7175', whiteSpace: 'nowrap' }}>{spec.name}</span>
                                  {confirmed > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 700, background: spec.color, color: '#fff', borderRadius: 10, padding: '0 5px', lineHeight: '1.4' }}>{confirmed}</span>}
                                  <span style={{ fontSize: '0.75rem', color: '#6d7175', marginLeft: 1 }}>{isActive ? '▲' : '▼'}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {activeSpec && (
                          <div style={{ background: '#fff', border: '1px solid #e1e3e5', borderRadius: 14, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid #e1e3e5', background: '#f6f6f7' }}>
                              <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: 'none', border: '1px solid #c9cccf', borderRadius: 8, color: '#6d7175', cursor: 'pointer', padding: '0.25rem 0.6rem', fontSize: '1rem' }}></button>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: activeSpec.color }} />
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#202223' }}>{activeSpec.name}</span>
                                <span style={{ fontSize: '0.78rem', color: '#6d7175' }}>
                                  {new Date(weekDays[0] + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}  {new Date(weekDays[6] + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ background: 'none', border: '1px solid #c9cccf', borderRadius: 8, color: '#6d7175', cursor: 'pointer', padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}>Hoy</button>}
                                <button onClick={() => setWeekOffset(w => w + 1)} style={{ background: 'none', border: '1px solid #c9cccf', borderRadius: 8, color: '#6d7175', cursor: 'pointer', padding: '0.25rem 0.6rem', fontSize: '1rem' }}></button>
                              </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                <thead>
                                  <tr>
                                    <th style={{ width: 64, padding: '0.5rem', background: '#f6f6f7', borderBottom: '2px solid #e1e3e5', borderRight: '1px solid #e1e3e5', fontSize: '0.7rem', fontWeight: 700, color: '#6d7175', textTransform: 'uppercase' }}>Hora</th>
                                    {weekDays.map((date, i) => {
                                      const isToday = date === todayStr;
                                      const jsDay = new Date(date + 'T12:00').getDay();
                                      const dow = jsDay === 0 ? 6 : jsDay - 1;
                                      return (
                                        <th key={date} style={{ padding: '0.5rem 0.25rem', background: isToday ? `${activeSpec.color}18` : '#f6f6f7', borderBottom: '2px solid #e1e3e5', borderRight: i < 6 ? '1px solid #e1e3e5' : 'none', textAlign: 'center', opacity: (!hasSchedule || dayMap[dow]) ? 1 : 0.4 }}>
                                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6d7175', textTransform: 'uppercase' }}>{DAYS_SHORT[i]}</div>
                                          <div style={{ fontSize: '0.82rem', fontWeight: isToday ? 800 : 600, color: isToday ? activeSpec.color : '#202223' }}>{new Date(date + 'T12:00').getDate()}</div>
                                          {isToday && <div style={{ width: 5, height: 5, borderRadius: '50%', background: activeSpec.color, margin: '2px auto 0' }} />}
                                        </th>
                                      );
                                    })}
                                  </tr>
                                </thead>
                                <tbody>
                                  {displaySlots.map(slot => (
                                    <tr key={slot}>
                                      <td style={{ padding: '0.3rem 0.5rem', background: '#f6f6f7', borderBottom: '1px solid #e1e3e5', borderRight: '1px solid #e1e3e5', fontSize: '0.75rem', fontWeight: 600, color: '#6d7175', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{slot}</td>
                                      {weekDays.map((date, di) => {
                                        const jsDay = new Date(date + 'T12:00').getDay();
                                        const dow = jsDay === 0 ? 6 : jsDay - 1;
                                        const [sh, sm] = slot.split(':').map(Number);
                                        const mins = sh * 60 + sm;
                                        const inSchedule = hasSchedule
                                          ? (dayMap[dow]?.some(w => mins >= w.start && mins < w.end) ?? false)
                                          : true;
                                        const appt = apptIndex[`${date}_${slot}_${activeSpec.id}`];
                                        const isToday = date === todayStr;
                                        return (
                                          <td key={date} style={{ padding: '0.25rem', borderBottom: '1px solid #e1e3e5', borderRight: di < 6 ? '1px solid #e1e3e5' : 'none', verticalAlign: 'top', background: isToday ? `${activeSpec.color}06` : 'transparent', height: 42 }}>
                                            {!inSchedule ? (
                                              <div style={{ height: '100%', background: '#f6f6f7', borderRadius: 4, minHeight: 36 }} />
                                            ) : appt ? (
                                              <div onClick={() => setApptDetail(appt)}
                                                style={{ background: appt.status === 'cancelled' ? 'rgba(216,44,13,0.1)' : appt.status === 'completed' ? 'rgba(59,130,246,0.12)' : `${activeSpec.color}22`, border: `1px solid ${appt.status === 'cancelled' ? 'rgba(216,44,13,0.4)' : appt.status === 'completed' ? 'rgba(59,130,246,0.4)' : `${activeSpec.color}55`}`, borderRadius: 6, padding: '0.25rem 0.4rem', cursor: 'pointer', minHeight: 36 }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: appt.status === 'cancelled' ? '#d82c0d' : appt.status === 'completed' ? '#2563eb' : '#202223' }}>{appt.client_name || ''}</div>
                                                {appt.client_phone && <div style={{ fontSize: '0.62rem', color: '#6d7175', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.client_phone}</div>}
                                              </div>
                                            ) : (
                                              <div onClick={() => { setNewAppt({ specialty_id: activeSpec.id, date, time: slot, client_phone: '', client_name: '', notes: '' }); setShowNewAppt(true); setApptMsg(null); }}
                                                style={{ minHeight: 36, borderRadius: 6, cursor: 'pointer', border: '1px dashed transparent', transition: '0.12s' }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = `${activeSpec.color}55`; e.currentTarget.style.background = `${activeSpec.color}08`; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }} />
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #e1e3e5', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', background: '#fafafa' }}>
                              {[{ color: activeSpec.color, label: 'Confirmado' }, { color: '#3b82f6', label: 'Completado' }, { color: '#d82c0d', label: 'Cancelado' }, { color: '#e1e3e5', label: 'Sin horario' }].map(l => (
                                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#6d7175' }}>
                                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />{l.label}
                                </div>
                              ))}
                              <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#6d7175' }}>Clic en un casillero vacío para crear un turno</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* -- Vista Servicios -- */}
                    {turnosView === 'servicios' && (
                      <div>
                        {specialties.length === 0 && (
                          <div style={{ background: '#f6f6f7', border: '1px dashed #c9cccf', borderRadius: 12, padding: '2.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>+</div>
                            <p style={{ color: '#6d7175', margin: 0 }}>No hay servicios configurados. Creá uno con el botón de arriba.</p>
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {specialties.map(spec => (
                            <div key={spec.id} style={{ background: '#fff', border: '1px solid #e1e3e5', borderRadius: 14, overflow: 'hidden' }}>
                              <div style={{ padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #e1e3e5', background: '#f6f6f7' }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: spec.color, flexShrink: 0 }} />
                                <span style={{ fontWeight: 700, flex: 1, color: '#202223' }}>{spec.name}</span>
                                <span style={{ fontSize: '0.78rem', color: '#6d7175', background: '#fff', border: '1px solid #e1e3e5', borderRadius: 20, padding: '2px 8px' }}>{spec.duration_minutes} min{spec.capacity > 1 ? `  ${spec.capacity} lugares` : ''}</span>
                                {spec.reminder_enabled ? (
                                  <span style={{ fontSize: '0.72rem', color: '#008060', background: 'rgba(0,128,96,0.08)', border: '1px solid rgba(0,128,96,0.25)', borderRadius: 20, padding: '2px 8px' }}>
                                    Recordatorio: {(Array.isArray(spec.reminder_hours) ? spec.reminder_hours : [spec.reminder_hours]).join('h / ')}h antes
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: '#6d7175', opacity: 0.6 }}>Sin recordatorio</span>
                                )}
                                <button onClick={() => setEditingSpec({ ...spec, reminder_hours: Array.isArray(spec.reminder_hours) ? spec.reminder_hours : [spec.reminder_hours || 24] })} style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 7, color: '#7c3aed', cursor: 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Editar</button>
                                <button onClick={() => deleteSpecialty(spec.id)} style={{ background: 'rgba(216,44,13,0.08)', border: '1px solid rgba(216,44,13,0.25)', borderRadius: 7, color: '#d82c0d', cursor: 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Eliminar</button>
                              </div>
                              <div style={{ padding: '1rem 1.1rem' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6d7175', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Horarios disponibles</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {DAYS.map((dayName, i) => {
                                    const day = (schedule[spec.id] || [])[i] || { day_of_week: i, active: false, windows: [{ start_time: '09:00', end_time: '18:00' }] };
                                    const tInput = (disabled, val, onChange) => (
                                      <input type="time" value={val} disabled={disabled} onChange={onChange}
                                        style={{ padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #c9cccf', background: !disabled ? '#fff' : '#f6f6f7', color: !disabled ? '#202223' : '#6d7175', fontSize: '0.82rem', opacity: !disabled ? 1 : 0.5 }} />
                                    );
                                    const totalSlots = day.active ? day.windows.reduce((acc, w) => {
                                      const [sh, sm] = w.start_time.split(':').map(Number);
                                      const [eh, em] = w.end_time.split(':').map(Number);
                                      return acc + Math.max(0, Math.floor(((eh * 60 + em) - (sh * 60 + sm)) / spec.duration_minutes));
                                    }, 0) : 0;
                                    return (
                                      <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', minWidth: 105, paddingTop: '0.35rem' }}>
                                          <input type="checkbox" checked={!!day.active} onChange={e => toggleDay(spec.id, i, e.target.checked)} style={{ accentColor: spec.color, width: 15, height: 15, flexShrink: 0 }} />
                                          <span style={{ fontSize: '0.82rem', color: day.active ? '#202223' : '#6d7175', fontWeight: day.active ? 600 : 400 }}>{dayName}</span>
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
                                          {day.windows.map((win, wi) => (
                                            <div key={wi} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                              {tInput(!day.active, win.start_time, e => updateWindow(spec.id, i, wi, 'start_time', e.target.value))}
                                              <span style={{ fontSize: '0.75rem', color: '#6d7175' }}>a</span>
                                              {tInput(!day.active, win.end_time, e => updateWindow(spec.id, i, wi, 'end_time', e.target.value))}
                                              {day.active && wi === 0 && day.windows.length === 1 && (
                                                <button onClick={() => addWindow(spec.id, i)} title="Agregar horario cortado"
                                                  style={{ background: '#f6f6f7', border: '1px solid #c9cccf', borderRadius: 6, color: '#6d7175', cursor: 'pointer', padding: '0.25rem 0.55rem', fontSize: '0.8rem', fontWeight: 700 }}>+</button>
                                              )}
                                              {day.active && wi > 0 && (
                                                <button onClick={() => removeWindow(spec.id, i, wi)}
                                                  style={{ background: 'rgba(216,44,13,0.08)', border: '1px solid rgba(216,44,13,0.25)', borderRadius: 6, color: '#d82c0d', cursor: 'pointer', padding: '0.25rem 0.55rem', fontSize: '0.8rem', fontWeight: 700 }}>-</button>
                                              )}
                                              {day.active && wi === day.windows.length - 1 && totalSlots > 0 && (
                                                <span style={{ fontSize: '0.71rem', color: '#6d7175', opacity: 0.7 }}>{totalSlots} turnos/da</span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.85rem' }}>
                                  <button onClick={() => saveSchedule(spec.id)} disabled={savingSchedule}
                                    style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {savingSchedule ? 'Guardando...' : 'Guardar horarios'}
                                  </button>
                                  {scheduleMsg && <span style={{ fontSize: '0.82rem', color: scheduleMsg.ok ? '#008060' : '#d82c0d' }}>{scheduleMsg.text}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                  );
                })()}


                {/* ---- TAB: PROBAR ASISTENTE ---- */}
                {selectedTab === 2 && (
                  <BlockStack gap="300">
                    <Text variant="bodySm" tone="subdued">
                      Probá el asistente con el prompt y la base de conocimientos actuales. No es necesario guardar primero.
                    </Text>
                    <PreviewChat botName={bot?.name} onSend={sendPreview} />
                  </BlockStack>
                )}

                {/* ---- TAB: MARKETING ---- */}
                {selectedTab === 3 && (
                  <BlockStack gap="500">
                    {marketingLoading && <InlineStack align="center"><Spinner size="small" /></InlineStack>}
                    {marketingMsg && <Banner tone={marketingMsg.ok ? 'success' : 'critical'}>{marketingMsg.text}</Banner>}

                    {/* -- Carritos abandonados -- */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Recupero de carritos abandonados</Text>
                      <Text variant="bodySm" tone="subdued">
                        Cuando un cliente agrega productos al carrito pero no completa la compra, el asistente le manda un WhatsApp automático recordándole. Requiere WhatsApp conectado.
                      </Text>
                      <Checkbox
                        label="Activar recupero automático de carritos"
                        checked={!!cartConfig.enabled}
                        onChange={v => setCartConfig(c => ({ ...c, enabled: v }))}
                        disabled={!isOn}
                      />
                      {!isOn && <Text variant="bodySm" tone="subdued">Requiere WhatsApp conectado para funcionar.</Text>}
                      {cartConfig.enabled && (
                        <BlockStack gap="300">
                          <TextField
                            label="Horas de espera antes de enviar el recordatorio"
                            type="number"
                            value={String(cartConfig.delayHours)}
                            onChange={v => setCartConfig(c => ({ ...c, delayHours: parseFloat(v) || 2 }))}
                            helpText="Tiempo que espera despus del abandono antes de mandar el mensaje. Recomendado: 2 horas."
                            autoComplete="off"
                          />
                          <TextField
                            label="Mensaje de recupero"
                            value={cartConfig.message}
                            onChange={v => setCartConfig(c => ({ ...c, message: v }))}
                            multiline={5}
                            helpText="Variables disponibles: {{nombre}}, {{productos}}, {{url}}, {{total}}"
                            autoComplete="off"
                          />
                        </BlockStack>
                      )}
                      <InlineStack>
                        <Button onClick={saveCartConfig} loading={cartSaving} variant="primary">Guardar configuración</Button>
                      </InlineStack>

                      {abandonedCarts.length > 0 && (
                        <BlockStack gap="200">
                          <Text variant="headingSm" as="h3">Últimos carritos detectados</Text>
                          {abandonedCarts.slice(0, 8).map(cart => (
                            <Card key={cart.id}>
                              <InlineStack align="space-between">
                                <BlockStack gap="100">
                                  <Text variant="bodyMd" fontWeight="semibold">{cart.name || cart.phone}</Text>
                                  <Text variant="bodySm" tone="subdued">{cart.products?.split('\n')[0] || 'Sin detalle'}</Text>
                                </BlockStack>
                                <span style={{ background: cart.status === 'recovered' ? '#10b981' : cart.status === 'messaged' ? '#3b82f6' : '#64748b', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                                  {cart.status === 'recovered' ? 'Recuperado' : cart.status === 'messaged' ? 'Mensaje enviado' : 'Pendiente'}
                                </span>
                              </InlineStack>
                            </Card>
                          ))}
                        </BlockStack>
                      )}
                    </BlockStack>

                    <Divider />

                    {/* -- Clientes -- */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Clientes recolectados</Text>
                      <Text variant="bodySm" tone="subdued">
                        Cada vez que alguien completa una compra en tu tienda, su nombre y número de WhatsApp quedan guardados automáticamente. Podés usarlos para difusiones.
                      </Text>
                      <Card>
                        <Box padding="400">
                          <InlineStack align="space-between">
                            <BlockStack gap="100">
                              <Text variant="headingXl" as="p">{customers.length}</Text>
                              <Text variant="bodySm" tone="subdued">clientes con WhatsApp</Text>
                            </BlockStack>
                            {customers.length > 0 && (
                              <BlockStack gap="100">
                                <Text variant="bodySm" tone="subdued">Últ. cliente: {customers[0]?.name || customers[0]?.phone || ''}</Text>
                                <Text variant="bodySm" tone="subdued">{customers[0]?.total_orders || 1} compra{customers[0]?.total_orders !== 1 ? 's' : ''}</Text>
                              </BlockStack>
                            )}
                          </InlineStack>
                        </Box>
                      </Card>
                      {customers.length === 0 && (
                        <Banner tone="info">Todavía no hay clientes registrados. Se cargarán automáticamente con cada nueva compra en la tienda.</Banner>
                      )}
                    </BlockStack>

                    <Divider />

                    {/* -- Difusiones -- */}
                    <BlockStack gap="300">
                      <InlineStack align="space-between">
                        <Text variant="headingMd" as="h2">Difusiones</Text>
                        <Button onClick={() => setShowNewCampaign(v => !v)} size="slim" disabled={customers.length === 0}>
                          {showNewCampaign ? 'Cancelar' : '+ Nueva difusión'}
                        </Button>
                      </InlineStack>
                      <Text variant="bodySm" tone="subdued">
                        Mandá un mensaje personalizado a todos tus clientes de una vez. Usá {'{{nombre}}'} para personalizar. El sistema envía los mensajes con un intervalo automático para evitar bloqueos.
                      </Text>
                      <Banner tone="warning">
                        WhatsApp puede bloquear números que envíen mensajes masivos. Usá esta función con moderación, con mensajes de valor real para tus clientes.
                      </Banner>

                      {showNewCampaign && (
                        <Card>
                          <BlockStack gap="300">
                            <Text variant="headingSm" as="h3">Nueva difusión</Text>
                            <TextField
                              label="Nombre de la difusión"
                              value={newCampaign.name}
                              onChange={v => setNewCampaign(c => ({ ...c, name: v }))}
                              placeholder="Ej: Promo Mayo 2026"
                              autoComplete="off"
                            />
                            <TextField
                              label="Mensaje"
                              value={newCampaign.message_template}
                              onChange={v => setNewCampaign(c => ({ ...c, message_template: v }))}
                              multiline={5}
                              placeholder={'Hola {{nombre}}! Tenemos una novedad especial para vos...'}
                              helpText="Usá {{nombre}} para personalizar con el nombre del cliente."
                              autoComplete="off"
                            />
                            <TextField
                              label="Pausa entre mensajes (segundos)"
                              type="number"
                              value={String(newCampaign.delay_seconds)}
                              onChange={v => setNewCampaign(c => ({ ...c, delay_seconds: parseInt(v) || 30 }))}
                              helpText="Mínimo recomendado: 30 segundos. Menos tiempo aumenta el riesgo de bloqueo."
                              autoComplete="off"
                            />
                            <InlineStack>
                              <Button onClick={createCampaign} variant="primary">Crear difusión</Button>
                            </InlineStack>
                          </BlockStack>
                        </Card>
                      )}

                      {campaigns.length === 0 ? (
                        <Text variant="bodySm" tone="subdued">No hay difusiones creadas todavía.</Text>
                      ) : (
                        <BlockStack gap="200">
                          {campaigns.map(c => {
                            const statusLabel = { draft: 'Borrador', running: 'Enviando', paused: 'Pausada', completed: 'Completada' }[c.status] || c.status;
                            const statusColor = { draft: '#64748b', running: '#10b981', paused: '#f59e0b', completed: '#3b82f6' }[c.status] || '#64748b';
                            return (
                              <Card key={c.id}>
                                <BlockStack gap="200">
                                  <InlineStack align="space-between">
                                    <InlineStack gap="300">
                                      <Text variant="bodyMd" fontWeight="semibold">{c.name}</Text>
                                      <span style={{ background: statusColor, color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{statusLabel}</span>
                                    </InlineStack>
                                    <InlineStack gap="200">
                                      {c.status === 'draft' && (
                                        <Button size="slim" onClick={() => addCustomersToCampaign(c.id)}>+ Clientes ({customers.length})</Button>
                                      )}
                                      {['draft', 'paused'].includes(c.status) && (
                                        <Button size="slim" variant="primary" onClick={() => startCampaign(c.id)} disabled={!isOn}>Enviar</Button>
                                      )}
                                      {c.status === 'running' && (
                                        <Button size="slim" onClick={() => pauseCampaign(c.id)}>Pausar</Button>
                                      )}
                                      {['draft', 'paused', 'completed'].includes(c.status) && (
                                        <Button size="slim" tone="critical" variant="plain" onClick={() => deleteCampaign(c.id)}>Eliminar</Button>
                                      )}
                                    </InlineStack>
                                  </InlineStack>
                                  <InlineStack gap="400">
                                    <Text variant="bodySm" tone="subdued">Pendientes: {c.stats?.pending || 0}</Text>
                                    <Text variant="bodySm" tone="subdued">Enviados: {c.stats?.sent || 0}</Text>
                                    <Text variant="bodySm" tone="subdued">Respondieron: {c.stats?.replied || 0}</Text>
                                  </InlineStack>
                                </BlockStack>
                              </Card>
                            );
                          })}
                        </BlockStack>
                      )}
                    </BlockStack>

                  </BlockStack>
                )}

              </Box>
            </Tabs>
          </Card>
        </Layout.Section>

      </Layout>
    </Page>
  );
}

// --- Entry point --------------------------------------------------------------
export default function ShopifyApp() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = polarisCssUrl;
    link.id = 'polaris-styles';
    document.head.appendChild(link);

    return () => {
      document.getElementById('polaris-styles')?.remove();
    };
  }, []);

  return (
    <AppProvider i18n={translations}>
      <ShopifyPanel />
    </AppProvider>
  );
}
