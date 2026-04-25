import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Onboarding() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('merchant_token') || '');
  const [botId, setBotId] = useState(localStorage.getItem('merchant_bot_id') || '');
  const [tempPwd, setTempPwd] = useState('');

  // Steps: catalog | qr
  const [step, setStep] = useState('catalog');
  const [storeUrl, setStoreUrl] = useState('');
  const [products, setProducts] = useState([]); // [{name, price, description}]
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '' });
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');
  const [qrData, setQrData] = useState(null);
  const [botStatus, setBotStatus] = useState('OFF');
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    let currentToken = token;
    
    // Extraer token de la URL si venimos de Shopify OAuth
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('merchant_token', urlToken);
      setToken(urlToken);
      currentToken = urlToken;
      
      try {
        const payload = JSON.parse(atob(urlToken.split('.')[1]));
        if (payload.botId) {
          localStorage.setItem('merchant_bot_id', payload.botId);
          setBotId(payload.botId);
        }
      } catch (e) {}

      // Consumir la contraseña temporal segura (solo funciona 1 vez)
      fetch(`${API}/api/merchant/temp-password`, {
        headers: { Authorization: `Bearer ${urlToken}` }
      })
      .then(r => r.json())
      .then(data => {
         if (data.tempPwd) setTempPwd(data.tempPwd);
      }).catch(() => {});
    }

    // Si viene de Shopify callback ya tiene catálogo, saltar a QR
    if (params.get('platform') !== 'other' || params.get('shop')) {
      setStep('qr');
    }
  }, [params]);

  useEffect(() => {
    if (step === 'qr') startBot();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step]);

  async function startBot() {
    if (!botId || !token) return;
    try {
      await fetch(`${API}/api/bots/${botId}/start`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      pollRef.current = setInterval(() => pollStatus(), 2000);
    } catch {}
  }

  async function pollStatus() {
    try {
      const res = await fetch(`${API}/api/bots/${botId}/status`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.qr) setQrData(data.qr);
      if (data.status === 'ON') {
        setBotStatus('ON');
        clearInterval(pollRef.current);
      }
    } catch {}
  }

  async function handleScrape() {
    if (!storeUrl.trim()) { setError('Ingresá la URL de tu tienda.'); return; }
    setError('');
    setScraping(true);
    setScrapeMsg('Analizando tu tienda...');
    try {
      const res = await fetch(`${API}/api/merchant/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: storeUrl, botId })
      });
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        setProducts(data.products);
        setScrapeMsg(`✅ ${data.products.length} productos encontrados automáticamente.`);
      } else {
        setScrapeMsg('No pudimos leer el catálogo automáticamente. Cargalos manualmente abajo.');
      }
    } catch {
      setScrapeMsg('Error al analizar la URL. Cargá los productos manualmente.');
    } finally {
      setScraping(false);
    }
  }

  function addProduct() {
    if (!newProduct.name || !newProduct.price) { setError('Nombre y precio son obligatorios.'); return; }
    setError('');
    setProducts(prev => [...prev, { ...newProduct }]);
    setNewProduct({ name: '', price: '', description: '' });
  }

  function removeProduct(i) {
    setProducts(prev => prev.filter((_, idx) => idx !== i));
  }

  async function saveCatalog() {
    if (products.length === 0) { setError('Agregá al menos un producto.'); return; }
    setError('');
    try {
      await fetch(`${API}/api/merchant/catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ botId, products })
      });
      setStep('qr');
    } catch {
      setError('Error guardando el catálogo. Intentá de nuevo.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', padding: '2rem' }}>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '560px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', fontWeight: '800', fontSize: '1.3rem' }}>
          <div className="brand-logo" style={{ width: '32px', height: '32px', fontSize: '1rem', margin: 0, boxShadow: 'none' }}>TJ</div>
          Asisto AI
        </div>

        {/* Banner Contraseña Temporal (One-Time) */}
        {tempPwd && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '1.2rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 style={{ color: '#10b981', margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔐</span> ¡Guarda tu contraseña!
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Se ha creado tu cuenta con tu email de Shopify. Esta contraseña solo se mostrará una vez.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '1.2rem', color: '#fff', textAlign: 'center', letterSpacing: '2px', marginTop: '0.5rem', userSelect: 'all' }}>
              {tempPwd}
            </div>
          </div>
        )}

        {/* Stepper */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {['catalog', 'qr'].map((s, i) => (
            <div key={s} style={{ flex: 1, height: '4px', borderRadius: '99px', background: step === 'qr' || s === 'catalog' && step === 'catalog' ? (i === 0 ? '#3b82f6' : step === 'qr' ? '#3b82f6' : 'var(--border)') : 'var(--border)' }} />
          ))}
        </div>

        {step === 'catalog' && (
          <>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Cargá tu catálogo</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem 0' }}>Ingresá la URL de tu tienda y lo hacemos automático, o cargá los productos a mano.</p>

            {/* URL scraper */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <input
                type="text" value={storeUrl} onChange={e => setStoreUrl(e.target.value)}
                placeholder="https://mitienda.com"
                style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '0.95rem' }}
              />
              <button onClick={handleScrape} disabled={scraping} className="btn-solid-blue" style={{ margin: 0, padding: '0.8rem 1.2rem', width: 'auto', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                {scraping ? '...' : 'Importar'}
              </button>
            </div>
            {scrapeMsg && <p style={{ fontSize: '0.85rem', color: scrapeMsg.startsWith('✅') ? '#10b981' : 'var(--text-secondary)', marginBottom: '1rem' }}>{scrapeMsg}</p>}

            {/* Lista de productos */}
            {products.length > 0 && (
              <div style={{ marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {products.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.9rem' }}>
                    <span>{p.name} — <strong>${p.price}</strong></span>
                    <button onClick={() => removeProduct(i)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Carga manual */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: products.length > 0 ? 0 : '0.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>Agregar producto manualmente:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input type="text" placeholder="Nombre del producto *" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                  style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                <input type="text" placeholder="Precio (ej: 15000) *" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
                  style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                <input type="text" placeholder="Descripción (opcional)" value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                  style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                <button onClick={addProduct} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px dashed var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.95rem' }}>
                  + Agregar producto
                </button>
              </div>
            </div>

            {error && <p style={{ color: '#f87171', fontSize: '0.9rem', marginTop: '1rem' }}>{error}</p>}

            <button onClick={saveCatalog} className="btn-solid-blue" style={{ marginTop: '1.5rem', width: '100%', padding: '0.9rem', fontSize: '1rem' }}
              disabled={products.length === 0}>
              Guardar catálogo y continuar →
            </button>
          </>
        )}

        {step === 'qr' && (
          <>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
              {botStatus === 'ON' ? '¡Tu bot está activo! 🎉' : 'Conectá tu WhatsApp'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem 0' }}>
              {botStatus === 'ON'
                ? 'El bot ya está respondiendo clientes automáticamente.'
                : 'Abrí WhatsApp en tu celular → Dispositivos vinculados → Escanear código QR.'}
            </p>

            {botStatus === 'ON' ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                <button onClick={() => nav('/mi-panel')} className="btn-solid-blue" style={{ padding: '1rem 2rem', fontSize: '1rem', width: 'auto' }}>
                  Ir a mi panel →
                </button>
              </div>
            ) : qrData ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '4px solid var(--accent)', display: 'inline-block' }}>
                  <QRCodeSVG value={qrData} size={200} />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '1rem 0 0' }}>Esperando escaneo...</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                Generando código QR...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
