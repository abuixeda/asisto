import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API = 'https://asisto-backend-production.up.railway.app';

export default function Register() {
  const [params] = useSearchParams();
  const cameFromPayment = params.get('payment') === 'success';
  const selectedPlan = params.get('plan');
  const [step, setStep] = useState(1); // 1: datos, 2: plataforma, 3: shopify-domain
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [shopDomain, setShopDomain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (selectedPlan) localStorage.setItem('atento_selected_plan', selectedPlan);
  }, [selectedPlan]);

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (!email || !password || !name) { setError('Complet todos los campos.'); return; }
    if (password.length < 6) { setError('La contrasea debe tener al menos 6 caracteres.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/merchant/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && cameFromPayment) {
          setError('Ya existe una cuenta con ese email. Inicia sesion con ese mismo email para acreditar el pago.');
        } else {
          setError(data.error || 'Error al registrarse.');
        }
        return;
      }
      localStorage.setItem('merchant_token', data.token);
      localStorage.setItem('merchant_bot_id', data.botId);
      localStorage.setItem('atento_token', data.token);
      if (data.user) localStorage.setItem('atento_user', JSON.stringify(data.user));
      if (data.whopPaymentApplied) localStorage.setItem('atento_payment_confirmed', 'whop');
      if (selectedPlan) {
        nav(`/mi-panel?checkout=${selectedPlan}`);
        return;
      }
      setStep(2);
    } catch (err) {
      console.error('[Register] fetch error:', err, '| API URL:', API);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError(`No se pudo conectar con el servidor. (${API})`);
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  function handlePlatform(platform) {
    if (platform === 'shopify') {
      setStep(3);
    } else if (platform === 'tiendanube') {
      window.location.href = 'https://www.tiendanube.com/tienda-aplicaciones-nube';
    } else {
      nav('/onboarding');
    }
  }

  function handleShopifyInstall() {
    if (!shopDomain.trim()) { setError('Ingres el dominio de tu tienda.'); return; }
    let raw = shopDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    // handle admin.shopify.com/store/STORENAME format
    const adminMatch = raw.match(/admin\.shopify\.com\/store\/([^/?]+)/);
    if (adminMatch) raw = adminMatch[1];
    const domain = raw.includes('.myshopify.com') ? raw : `${raw}.myshopify.com`;
    window.location.href = `${API}/shopify/install?shop=${domain}`;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', padding: '2rem' }}>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', fontWeight: '800', fontSize: '1.3rem' }}>
          <div className="brand-logo" style={{ width: '32px', height: '32px', fontSize: '1rem', margin: 0, boxShadow: 'none' }}><img src="/atento-logo.png" alt="Atento AI" /></div>
          Atento AI
        </div>

        {cameFromPayment && step === 1 && (
          <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)', borderRadius: '14px', padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ color: '#34d399', fontWeight: 800, marginBottom: '0.35rem' }}>Pago recibido</div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem', lineHeight: 1.55 }}>
              Ahora crea tu cuenta o inicia sesion usando el mismo email con el que pagaste en Whop. Asi Atento puede acreditar automaticamente tu plan{selectedPlan ? ` ${selectedPlan}` : ''}.
            </p>
          </div>
        )}

        {step === 1 && (
          <>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.6rem' }}>Crear cuenta</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem 0' }}>{cameFromPayment ? 'Completa tu cuenta para activar el panel.' : 'Gratis. Sin tarjeta de credito.'}</p>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nombre de tu negocio</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ej: Electro Savage"
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Contrasea</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Mnimo 6 caracteres"
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>
              {error && <p style={{ color: '#f87171', margin: 0, fontSize: '0.9rem' }}>{error}</p>}
              <button type="submit" className="btn-solid-blue" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.9rem', fontSize: '1rem' }}>
                {loading ? 'Creando cuenta...' : 'Continuar ?'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Ya tenes cuenta? <a href={cameFromPayment ? '/login?payment=success' : selectedPlan ? `/login?plan=${selectedPlan}` : '/login'} style={{ color: 'var(--accent)', textDecoration: 'none' }}>Ingresar</a>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Dnde est tu tienda?</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem 0' }}>Eleg tu plataforma para conectar el catlogo automticamente.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button onClick={() => handlePlatform('shopify')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '14px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '1rem', textAlign: 'left', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#96bf48'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span style={{ fontSize: '2rem' }}>???</span>
                <div>
                  <div style={{ fontWeight: '700' }}>Shopify</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Catlogo sincronizado automticamente</div>
                </div>
              </button>

              <button onClick={() => handlePlatform('tiendanube')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '14px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '1rem', textAlign: 'left', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span style={{ fontSize: '2rem' }}>??</span>
                <div>
                  <div style={{ fontWeight: '700' }}>Tiendanube</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Catlogo sincronizado automticamente</div>
                </div>
              </button>

              <button onClick={() => handlePlatform('other')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '14px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '1rem', textAlign: 'left', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span style={{ fontSize: '2rem' }}>??</span>
                <div>
                  <div style={{ fontWeight: '700' }}>Otra plataforma / Web propia</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Carg tu catlogo manualmente o con URL</div>
                </div>
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <button onClick={() => { setStep(2); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: 0, marginBottom: '1.5rem' }}>
              ? Volver
            </button>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Cul es tu tienda Shopify?</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem 0' }}>Ingres el dominio y te redirigimos a Shopify para autorizar la conexin.</p>
            <input
              type="text" value={shopDomain} onChange={e => { setShopDomain(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleShopifyInstall()}
              placeholder="mitienda o mitienda.myshopify.com"
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '1rem', boxSizing: 'border-box', marginBottom: '0.75rem' }}
            />
            {error && <p style={{ color: '#f87171', fontSize: '0.9rem', margin: '0 0 0.75rem' }}>{error}</p>}
            <button onClick={handleShopifyInstall} className="btn-solid-blue" style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}>
              Conectar con Shopify ?
            </button>
          </>
        )}
      </div>
    </div>
  );
}
