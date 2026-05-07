import { useEffect, useState, useCallback } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import {
  AppProvider, Page, Layout, Card, BlockStack, InlineStack,
  Text, Button, TextField, Banner, Spinner, Divider,
  Box, InlineGrid, Checkbox,
} from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import translations from '@shopify/polaris/locales/es.json';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── Panel (requiere window.shopify inyectado por Shopify en el iframe) ────────
function ShopifyPanel() {
  const app = useAppBridge();

  const shopifyFetch = useCallback(async (url, options = {}) => {
    const token = await app.idToken();
    return fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
    });
  }, [app]);

  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [kb, setKb] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [widget, setWidget] = useState({ enabled: false, phone: '', welcomeMessage: '', buttonText: '' });
  const [widgetSaving, setWidgetSaving] = useState(false);
  const [widgetMsg, setWidgetMsg] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  useEffect(() => {
    shopifyFetch(`${API}/api/shopify/embedded/bot`)
      .then(r => r.json())
      .then(data => {
        setBot(data);
        setPrompt(data.prompt || '');
        setKb(data.knowledgeBase || '');
        try { setWidget(JSON.parse(data.widgetConfig || '{}')); } catch (_e) {}
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveConfig() {
    setSaving(true); setSaveMsg(null);
    try {
      const res = await shopifyFetch(`${API}/api/shopify/embedded/bot`, { method: 'POST', body: JSON.stringify({ prompt, knowledgeBase: kb }) });
      const d = await res.json();
      setSaveMsg(d.ok ? { ok: true, text: 'Configuración guardada.' } : { ok: false, text: d.error || 'Error.' });
    } catch (_e) { setSaveMsg({ ok: false, text: 'Error de conexión.' }); }
    finally { setSaving(false); }
  }

  async function saveWidget() {
    setWidgetSaving(true); setWidgetMsg(null);
    try {
      const res = await shopifyFetch(`${API}/api/shopify/embedded/widget`, { method: 'POST', body: JSON.stringify(widget) });
      const d = await res.json();
      setWidgetMsg(d.ok ? { ok: true, text: 'Widget actualizado.' } : { ok: false, text: d.error || 'Error.' });
    } catch (_e) { setWidgetMsg({ ok: false, text: 'Error de conexión.' }); }
    finally { setWidgetSaving(false); }
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

  if (loading) return (
    <Page><Layout><Layout.Section>
      <Card><Box padding="800"><InlineStack align="center"><Spinner size="large" /></InlineStack></Box></Card>
    </Layout.Section></Layout></Page>
  );

  const isOn = bot?.status === 'ON';
  const metrics = (() => { try { return JSON.parse(bot?.metrics || '{}'); } catch { return {}; } })();

  return (
    <Page
      title={bot?.name || 'Asisto AI'}
      subtitle="Asistente virtual con inteligencia artificial"
      primaryAction={{ content: 'Guardar configuración', onAction: saveConfig, loading: saving }}
    >
      <Layout>

        <Layout.Section>
          <Banner tone={isOn ? 'success' : 'warning'} title={isOn ? '✅ Bot activo' : '⚠️ Bot inactivo'}>
            <Text as="p" variant="bodyMd" tone="subdued">
              {isOn
                ? `${metrics.messagesSent || 0} mensajes respondidos · ${metrics.customersHelped || 0} chats atendidos`
                : 'Para conectar WhatsApp, ingresá al panel de Asisto desde el link que recibiste por email.'}
            </Text>
          </Banner>
        </Layout.Section>

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

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Comportamiento del asistente</Text>
              <Text variant="bodySm" tone="subdued">Definí la personalidad del bot: cómo saluda, qué tono usa, si tutea o usa "usted".</Text>
              <TextField label="Personalidad e instrucciones" value={prompt} onChange={setPrompt} multiline={6}
                placeholder="Ej: Sos el asistente de [Negocio]. Respondé de forma amigable..." autoComplete="off" />
              <Divider />
              <Text variant="headingMd" as="h2">Base de conocimientos</Text>
              <Text variant="bodySm" tone="subdued">Horarios, precios, políticas, preguntas frecuentes, catálogo.</Text>
              <TextField label="Conocimiento del negocio" value={kb} onChange={setKb} multiline={8}
                placeholder="[HORARIOS]&#10;Lunes a viernes 9-18hs&#10;&#10;[ENVÍOS]&#10;..." autoComplete="off" />
              {saveMsg && <Banner tone={saveMsg.ok ? 'success' : 'critical'}>{saveMsg.text}</Banner>}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Widget de WhatsApp</Text>
              <Text variant="bodySm" tone="subdued">Botón flotante en tu tienda — los clientes hacen clic y te escriben directo por WhatsApp.</Text>
              <Checkbox label="Activar widget en la tienda" checked={!!widget.enabled} onChange={v => setWidget(w => ({ ...w, enabled: v }))} />
              <TextField label="Número de WhatsApp" value={widget.phone} onChange={v => setWidget(w => ({ ...w, phone: v }))}
                placeholder="5491123456789" helpText="Código de país + número, sin + ni espacios." autoComplete="off" />
              <TextField label="Mensaje de bienvenida" value={widget.welcomeMessage} onChange={v => setWidget(w => ({ ...w, welcomeMessage: v }))}
                placeholder="Hola! Tengo una consulta sobre su tienda." autoComplete="off" />
              <TextField label="Texto del tooltip" value={widget.buttonText} onChange={v => setWidget(w => ({ ...w, buttonText: v }))}
                placeholder="Chateá con nosotros" autoComplete="off" />
              {widgetMsg && <Banner tone={widgetMsg.ok ? 'success' : 'critical'}>{widgetMsg.text}</Banner>}
              <InlineStack><Button onClick={saveWidget} loading={widgetSaving} variant="primary">Guardar widget</Button></InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Catálogo de productos</Text>
              <Text variant="bodySm" tone="subdued">El bot sincroniza tu catálogo automáticamente al crear o modificar productos. También podés hacerlo manualmente.</Text>
              {syncMsg && <Banner tone={syncMsg.ok ? 'success' : 'critical'}>{syncMsg.text}</Banner>}
              <InlineStack><Button onClick={syncCatalog} loading={syncing}>Sincronizar ahora</Button></InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

      </Layout>
    </Page>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────
export default function ShopifyApp() {
  return (
    <AppProvider i18n={translations}>
      <ShopifyPanel />
    </AppProvider>
  );
}
