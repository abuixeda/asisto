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

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── Preview Chat (simulación WhatsApp) ───────────────────────────────────────
function PreviewChat({ botName, onSend }) {
  const [messages, setMessages] = useState([
    { role: 'model', text: '¡Hola! Soy el asistente virtual. ¿En qué te puedo ayudar? 😊' }
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
      setMessages(prev => [...prev, { role: 'model', text: '❌ Error al conectar con el asistente.' }]);
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
              <div style={{ background: '#202c33', borderRadius: '12px 12px 12px 2px', padding: '8px 14px', color: '#aebac1', fontSize: '0.82rem' }}>● ● ●</div>
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

// ─── Panel principal ───────────────────────────────────────────────────────────
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

  // ── Estado general ──
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);

  // ── Config ──
  const [prompt, setPrompt] = useState('');
  const [kb, setKb] = useState('');
  const [responseDelay, setResponseDelay] = useState(2.5);
  const [hours, setHours] = useState({ active: false, start: '09:00', end: '18:00', autoReplyMsg: '' });
  const [adminPhone, setAdminPhone] = useState('');
  const [language, setLanguage] = useState('es');
  const [widget, setWidget] = useState({ enabled: false, welcomeMessage: '', buttonText: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // ── Catálogo ──
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  // ── WhatsApp ──
  const [starting, setStarting] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [startError, setStartError] = useState(null);
  const pollRef = useRef(null);
  const pollCountRef = useRef(0);

  // ── Turnos ──
  const [specialties, setSpecialties] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [apptDate, setApptDate] = useState(new Date().toISOString().slice(0, 10));
  const [newSpec, setNewSpec] = useState({ name: '', duration_minutes: 30, color: '#7c3aed', capacity: 1 });
  const [newAppt, setNewAppt] = useState({ specialty_id: '', client_name: '', client_phone: '', date: new Date().toISOString().slice(0, 10), time: '' });
  const [turnosSaving, setTurnosSaving] = useState(false);
  const [turnosMsg, setTurnosMsg] = useState(null);
  const [showNewSpec, setShowNewSpec] = useState(false);
  const [showNewAppt, setShowNewAppt] = useState(false);

  // ── Marketing ──
  const [customers, setCustomers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [cartConfig, setCartConfig] = useState({ enabled: false, delayHours: 2, message: 'Hola {{nombre}}! 👋 Notamos que dejaste productos en tu carrito:\n\n{{productos}}\n\n¿Querés completar tu compra? 👉 {{url}}' });
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [newCampaign, setNewCampaign] = useState({ name: '', message_template: '', delay_seconds: 30 });
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [marketingMsg, setMarketingMsg] = useState(null);
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [cartSaving, setCartSaving] = useState(false);

  // ── Carga inicial ──
  useEffect(() => {
    shopifyFetch(`${API}/api/shopify/embedded/bot`)
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
  }, []);

  useEffect(() => {
    if (selectedTab === 1) loadTurnos();
  }, [selectedTab]);

  async function loadTurnos() {
    try {
      const [sRes, aRes] = await Promise.all([
        shopifyFetch(`${API}/api/shopify/embedded/specialties`),
        shopifyFetch(`${API}/api/shopify/embedded/appointments?date=${apptDate}`),
      ]);
      setSpecialties(await sRes.json());
      setAppointments(await aRes.json());
    } catch (_e) {}
  }

  useEffect(() => {
    if (selectedTab === 1) {
      shopifyFetch(`${API}/api/shopify/embedded/appointments?date=${apptDate}`)
        .then(r => r.json()).then(setAppointments).catch(() => {});
    }
  }, [apptDate, selectedTab]);

  // ── WhatsApp ──
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
        setStartError('El servidor no pudo iniciar WhatsApp. Revisá los logs e intentá de nuevo.');
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

  // ── Config (guarda todo junto) ──
  async function saveConfig() {
    setSaving(true); setSaveMsg(null);
    try {
      const res = await shopifyFetch(`${API}/api/shopify/embedded/bot`, {
        method: 'POST',
        body: JSON.stringify({ prompt, knowledgeBase: kb, responseDelay, workingHours: hours, adminPhone, widget, language }),
      });
      const d = await res.json();
      setSaveMsg(d.ok ? { ok: true, text: 'Configuración guardada.' } : { ok: false, text: d.error || 'Error.' });
    } catch (_e) { setSaveMsg({ ok: false, text: 'Error de conexión.' }); }
    finally { setSaving(false); }
  }

  async function syncCatalog() {
    setSyncing(true); setSyncMsg(null);
    try {
      const res = await shopifyFetch(`${API}/api/shopify/embedded/sync`, { method: 'POST' });
      const d = await res.json();
      setSyncMsg(d.success ? { ok: true, text: 'Catálogo sincronizado.' } : { ok: false, text: d.error || 'Error.' });
    } catch (_e) { setSyncMsg({ ok: false, text: 'Error de conexión.' }); }
    finally { setSyncing(false); }
  }

  // ── Turnos ──
  async function createSpecialty() {
    if (!newSpec.name) return;
    setTurnosSaving(true); setTurnosMsg(null);
    try {
      await shopifyFetch(`${API}/api/shopify/embedded/specialties`, { method: 'POST', body: JSON.stringify(newSpec) });
      setNewSpec({ name: '', duration_minutes: 30, color: '#7c3aed', capacity: 1 });
      setShowNewSpec(false);
      loadTurnos();
    } catch (_e) { setTurnosMsg({ ok: false, text: 'Error al crear servicio.' }); }
    finally { setTurnosSaving(false); }
  }

  async function deleteSpecialty(id) {
    await shopifyFetch(`${API}/api/shopify/embedded/specialties/${id}`, { method: 'DELETE' });
    loadTurnos();
  }

  async function createAppointment() {
    if (!newAppt.specialty_id || !newAppt.client_phone || !newAppt.date || !newAppt.time) {
      setTurnosMsg({ ok: false, text: 'Completá todos los campos requeridos.' }); return;
    }
    setTurnosSaving(true); setTurnosMsg(null);
    try {
      await shopifyFetch(`${API}/api/shopify/embedded/appointments`, { method: 'POST', body: JSON.stringify(newAppt) });
      setNewAppt({ specialty_id: '', client_name: '', client_phone: '', date: apptDate, time: '' });
      setShowNewAppt(false);
      loadTurnos();
    } catch (_e) { setTurnosMsg({ ok: false, text: 'Error al crear turno.' }); }
    finally { setTurnosSaving(false); }
  }

  async function cancelAppointment(id) {
    await shopifyFetch(`${API}/api/shopify/embedded/appointments/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'cancelled' }) });
    loadTurnos();
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
    } catch (_e) { setMarketingMsg({ ok: false, text: 'Error de conexión.' }); }
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
    } catch (_e) { setMarketingMsg({ ok: false, text: 'Error al crear campaña.' }); }
  }

  async function addCustomersToCampaign(campaignId) {
    try {
      const res = await shopifyFetch(`${API}/api/shopify/embedded/campaigns/${campaignId}/add-customers`, { method: 'POST', body: JSON.stringify({}) });
      const d = await res.json();
      setMarketingMsg({ ok: true, text: `${d.added} clientes agregados a la campaña.` });
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
    { id: 'preview', content: '📱 Probar asistente' },
    { id: 'marketing', content: '📣 Marketing' },
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
    { label: 'Seleccioná un servicio', value: '' },
    ...specialties.map(s => ({ label: s.name, value: s.id })),
  ];

  const statusColors = { confirmed: '#10b981', completed: '#3b82f6', cancelled: '#ef4444' };
  const statusLabels = { confirmed: 'Confirmado', completed: 'Completado', cancelled: 'Cancelado' };

  return (
    <Page title={bot?.name || 'Asisto AI'} subtitle="Asistente virtual con inteligencia artificial">
      <Layout>

        {/* ── Banner estado ── */}
        <Layout.Section>
          <Banner tone={isOn ? 'success' : 'warning'} title={isOn ? '✅ Asistente activo' : '⚠️ Asistente inactivo'}>
            <Text as="p" variant="bodyMd" tone="subdued">
              {isOn
                ? `${metrics.messagesSent || 0} mensajes respondidos · ${metrics.customersHelped || 0} chats atendidos`
                : 'Conectá WhatsApp en la sección de Configuración para activar el asistente.'}
            </Text>
          </Banner>
        </Layout.Section>

        {/* ── Métricas ── */}
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

        {/* ── Tabs ── */}
        <Layout.Section>
          <Card padding="0">
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              <Box padding="400">

                {/* ════ TAB: CONFIGURACIÓN ════ */}
                {selectedTab === 0 && (
                  <BlockStack gap="500">

                    {/* ── WhatsApp ── */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Conexión WhatsApp</Text>
                      {isOn ? (
                        <BlockStack gap="300">
                          <Banner tone="success">
                            <BlockStack gap="100">
                              <Text variant="bodyMd" fontWeight="semibold">WhatsApp conectado y activo</Text>
                              {bot?.businessPhone && (
                                <Text variant="bodySm" tone="subdued">
                                  Número conectado: <strong>+{bot.businessPhone}</strong>
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
                              <Text variant="bodySm" tone="subdued">Escaneá con WhatsApp → Dispositivos vinculados → Escanear QR</Text>
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
                              <Text variant="bodySm" tone="subdued">Iniciando, aguardá el código QR…</Text>
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

                    {/* ── Botón WhatsApp en la tienda ── */}
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
                            placeholder="Chateá con nosotros"
                            helpText="Etiqueta que aparece al lado del botón verde."
                            autoComplete="off"
                          />
                        </BlockStack>
                      )}
                    </BlockStack>

                    <Divider />

                    {/* ── Catálogo ── */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Catálogo de productos</Text>
                      <Text variant="bodySm" tone="subdued">El asistente sincroniza tu catálogo automáticamente al crear o modificar productos. También podés hacerlo manualmente.</Text>
                      {syncMsg && <Banner tone={syncMsg.ok ? 'success' : 'critical'}>{syncMsg.text}</Banner>}
                      <InlineStack>
                        <Button onClick={syncCatalog} loading={syncing}>Sincronizar ahora</Button>
                      </InlineStack>
                    </BlockStack>

                    <Divider />

                    {/* ── Idioma ── */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">🌐 Idioma de respuestas</Text>
                      <Text variant="bodySm" tone="subdued">
                        En qué idioma responde el asistente. Si elegís un idioma distinto al español, el asistente responderá siempre en ese idioma aunque el cliente escriba en otro.
                      </Text>
                      <Select
                        label="Idioma del asistente"
                        options={[
                          { label: '🇦🇷 Español', value: 'es' },
                          { label: '🇺🇸 English', value: 'en' },
                          { label: '🇧🇷 Português', value: 'pt' },
                          { label: '🇩🇪 Deutsch', value: 'de' },
                          { label: '🇫🇷 Français', value: 'fr' },
                          { label: '🇸🇦 العربية', value: 'ar' },
                          { label: '🇮🇹 Italiano', value: 'it' },
                        ]}
                        value={language}
                        onChange={setLanguage}
                      />
                    </BlockStack>

                    <Divider />

                    {/* ── Comportamiento ── */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Comportamiento del asistente</Text>
                      <Text variant="bodySm" tone="subdued">Definí la personalidad: cómo saluda, qué tono usa, si tutea o usa "usted".</Text>
                      <TextField label="Personalidad e instrucciones" value={prompt} onChange={setPrompt} multiline={6}
                        placeholder="Ej: Sos el asistente de [Negocio]. Respondé de forma amigable..." autoComplete="off" />
                    </BlockStack>

                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Base de conocimientos</Text>
                      <Text variant="bodySm" tone="subdued">Horarios, precios, políticas, preguntas frecuentes, catálogo.</Text>
                      <TextField label="Conocimiento del negocio" value={kb} onChange={setKb} multiline={8}
                        placeholder="[HORARIOS]&#10;Lunes a viernes 9-18hs&#10;&#10;[ENVÍOS]&#10;..." autoComplete="off" />
                    </BlockStack>

                    <Divider />

                    {/* ── Tiempo de espera ── */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">⏱️ Tiempo de espera antes de responder</Text>
                      <Text variant="bodySm" tone="subdued">
                        Si el cliente manda varios mensajes seguidos, el asistente espera este tiempo antes de responder — así agrupa todos los mensajes y contesta una sola vez.
                      </Text>
                      <RangeSlider
                        label={`Espera: ${responseDelay}s`}
                        min={0.5} max={60} step={0.5}
                        value={responseDelay}
                        onChange={v => setResponseDelay(v)}
                        output
                        suffix={<Text variant="bodySm" tone="subdued">Recomendado: 2.5s — Mínimo: 0.5s — Máximo: 60s</Text>}
                      />
                    </BlockStack>

                    <Divider />

                    {/* ── Horario ── */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">🕐 Horario de Atención (Anti-Nocturno)</Text>
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

                    {/* ── Celular del dueño ── */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">📱 Tu celular (línea directa con el asistente)</Text>
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

                    {saveMsg && <Banner tone={saveMsg.ok ? 'success' : 'critical'}>{saveMsg.text}</Banner>}
                    <InlineStack>
                      <Button onClick={saveConfig} loading={saving} variant="primary">Guardar configuración</Button>
                    </InlineStack>

                  </BlockStack>
                )}

                {/* ════ TAB: TURNOS ════ */}
                {selectedTab === 1 && (
                  <BlockStack gap="500">

                    <BlockStack gap="300">
                      <InlineStack align="space-between">
                        <Text variant="headingMd" as="h2">Servicios</Text>
                        <Button onClick={() => setShowNewSpec(v => !v)} size="slim">
                          {showNewSpec ? 'Cancelar' : '+ Nuevo servicio'}
                        </Button>
                      </InlineStack>

                      {showNewSpec && (
                        <Card>
                          <BlockStack gap="300">
                            <TextField label="Nombre del servicio" value={newSpec.name}
                              onChange={v => setNewSpec(s => ({ ...s, name: v }))} autoComplete="off" />
                            <InlineStack gap="400">
                              <TextField label="Duración (min)" type="number" value={String(newSpec.duration_minutes)}
                                onChange={v => setNewSpec(s => ({ ...s, duration_minutes: Number(v) }))} autoComplete="off" />
                              <TextField label="Capacidad simultánea" type="number" value={String(newSpec.capacity)}
                                onChange={v => setNewSpec(s => ({ ...s, capacity: Number(v) }))} autoComplete="off" />
                            </InlineStack>
                            <InlineStack>
                              <Button onClick={createSpecialty} loading={turnosSaving} variant="primary">Crear servicio</Button>
                            </InlineStack>
                          </BlockStack>
                        </Card>
                      )}

                      {specialties.length === 0 ? (
                        <Text variant="bodySm" tone="subdued">No hay servicios creados todavía.</Text>
                      ) : (
                        <BlockStack gap="200">
                          {specialties.map(s => (
                            <Card key={s.id}>
                              <InlineStack align="space-between">
                                <InlineStack gap="300">
                                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, marginTop: 4, flexShrink: 0 }} />
                                  <BlockStack gap="100">
                                    <Text variant="bodyMd" fontWeight="semibold">{s.name}</Text>
                                    <Text variant="bodySm" tone="subdued">{s.duration_minutes} min · capacidad {s.capacity}</Text>
                                  </BlockStack>
                                </InlineStack>
                                <Button onClick={() => deleteSpecialty(s.id)} tone="critical" size="slim" variant="plain">Eliminar</Button>
                              </InlineStack>
                            </Card>
                          ))}
                        </BlockStack>
                      )}
                    </BlockStack>

                    <Divider />

                    <BlockStack gap="300">
                      <InlineStack align="space-between">
                        <Text variant="headingMd" as="h2">Turnos</Text>
                        <Button onClick={() => setShowNewAppt(v => !v)} size="slim" disabled={specialties.length === 0}>
                          {showNewAppt ? 'Cancelar' : '+ Nuevo turno'}
                        </Button>
                      </InlineStack>

                      <TextField label="Fecha" type="date" value={apptDate}
                        onChange={v => setApptDate(v)} autoComplete="off" />

                      {showNewAppt && (
                        <Card>
                          <BlockStack gap="300">
                            <Select label="Servicio" options={specOptions} value={newAppt.specialty_id}
                              onChange={v => setNewAppt(a => ({ ...a, specialty_id: v }))} />
                            <InlineStack gap="400">
                              <TextField label="Nombre del cliente" value={newAppt.client_name}
                                onChange={v => setNewAppt(a => ({ ...a, client_name: v }))} autoComplete="off" />
                              <TextField label="Teléfono *" value={newAppt.client_phone}
                                onChange={v => setNewAppt(a => ({ ...a, client_phone: v }))}
                                placeholder="5491123456789" autoComplete="off" />
                            </InlineStack>
                            <InlineStack gap="400">
                              <TextField label="Fecha *" type="date" value={newAppt.date}
                                onChange={v => setNewAppt(a => ({ ...a, date: v }))} autoComplete="off" />
                              <TextField label="Hora *" type="time" value={newAppt.time}
                                onChange={v => setNewAppt(a => ({ ...a, time: v }))} autoComplete="off" />
                            </InlineStack>
                            {turnosMsg && <Banner tone={turnosMsg.ok ? 'success' : 'critical'}>{turnosMsg.text}</Banner>}
                            <InlineStack>
                              <Button onClick={createAppointment} loading={turnosSaving} variant="primary">Crear turno</Button>
                            </InlineStack>
                          </BlockStack>
                        </Card>
                      )}

                      {appointments.length === 0 ? (
                        <Text variant="bodySm" tone="subdued">No hay turnos para esta fecha.</Text>
                      ) : (
                        <BlockStack gap="200">
                          {appointments.map(a => (
                            <Card key={a.id}>
                              <InlineStack align="space-between">
                                <BlockStack gap="100">
                                  <InlineStack gap="200">
                                    <Text variant="bodyMd" fontWeight="semibold">{a.time} — {a.client_name || a.client_phone}</Text>
                                    <span style={{ background: statusColors[a.status] || '#64748b', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                                      {statusLabels[a.status] || a.status}
                                    </span>
                                  </InlineStack>
                                  <Text variant="bodySm" tone="subdued">{a.specialty_name} · {a.client_phone}</Text>
                                </BlockStack>
                                {a.status === 'confirmed' && (
                                  <Button onClick={() => cancelAppointment(a.id)} tone="critical" size="slim" variant="plain">Cancelar</Button>
                                )}
                              </InlineStack>
                            </Card>
                          ))}
                        </BlockStack>
                      )}
                    </BlockStack>

                  </BlockStack>
                )}

                {/* ════ TAB: PROBAR ASISTENTE ════ */}
                {selectedTab === 2 && (
                  <BlockStack gap="300">
                    <Text variant="bodySm" tone="subdued">
                      Probá el asistente con el prompt y la base de conocimientos actuales. No es necesario guardar primero.
                    </Text>
                    <PreviewChat botName={bot?.name} onSend={sendPreview} />
                  </BlockStack>
                )}

                {/* ════ TAB: MARKETING ════ */}
                {selectedTab === 3 && (
                  <BlockStack gap="500">
                    {marketingLoading && <InlineStack align="center"><Spinner size="small" /></InlineStack>}
                    {marketingMsg && <Banner tone={marketingMsg.ok ? 'success' : 'critical'}>{marketingMsg.text}</Banner>}

                    {/* ── Carritos abandonados ── */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">🛒 Recupero de carritos abandonados</Text>
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
                            helpText="Tiempo que espera después del abandono antes de mandar el mensaje. Recomendado: 2 horas."
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

                    {/* ── Clientes ── */}
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">👥 Clientes recolectados</Text>
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
                                <Text variant="bodySm" tone="subdued">Últ. cliente: {customers[0]?.name || customers[0]?.phone || '—'}</Text>
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

                    {/* ── Difusiones ── */}
                    <BlockStack gap="300">
                      <InlineStack align="space-between">
                        <Text variant="headingMd" as="h2">📨 Difusiones</Text>
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
                              placeholder={'Hola {{nombre}}! 👋 Tenemos una novedad especial para vos...'}
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

// ─── Entry point ──────────────────────────────────────────────────────────────
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
