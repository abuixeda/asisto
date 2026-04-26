import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/* ─── Paleta Agency ─── */
const C = {
  bg:          '#f8fafc',
  cardBg:      '#ffffff',
  text:        '#0f172a',
  textSec:     '#475569',
  border:      '#e2e8f0',
  accent:      '#4f46e5',
  accentHover: '#4338ca',
  error:       '#ef4444'
};

export default function LoginAgency() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Completá todos los campos.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al ingresar.'); return; }
      localStorage.setItem('merchant_token', data.token);
      localStorage.setItem('merchant_bot_id', data.user.botId);
      nav(data.user.role === 'admin' ? '/admin' : '/mi-panel');
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, padding: '2rem', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '440px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>

        <div onClick={() => nav('/premium')} style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '2rem', cursor: 'pointer' }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 800, color: C.text }}>Asisto</span>
          <span style={{ fontSize: '0.75rem', color: C.accent, fontWeight: 600, letterSpacing: '0.04em', background: '#eef2ff', padding: '3px 8px', borderRadius: '6px' }}>Agency</span>
        </div>

        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.6rem', color: C.text, fontWeight: 700 }}>Ingresar</h2>
        <p style={{ color: C.textSec, margin: '0 0 2rem 0', fontSize: '0.95rem' }}>Accedé a tu panel de control premium.</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: C.textSec, fontWeight: 500 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" autoFocus
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: `1px solid ${C.border}`, background: '#f8fafc', color: C.text, fontSize: '1rem', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = C.accent}
              onBlur={(e) => e.target.style.borderColor = C.border}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: C.textSec, fontWeight: 500 }}>Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: `1px solid ${C.border}`, background: '#f8fafc', color: C.text, fontSize: '1rem', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = C.accent}
              onBlur={(e) => e.target.style.borderColor = C.border}
            />
          </div>
          {error && <p style={{ color: C.error, margin: 0, fontSize: '0.9rem', background: '#fef2f2', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fecaca' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.95rem', fontSize: '1rem', background: C.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={(e) => !loading && (e.target.style.background = C.accentHover)}
            onMouseLeave={(e) => !loading && (e.target.style.background = C.accent)}
          >
            {loading ? 'Ingresando...' : 'Ingresar →'}
          </button>
        </form>

      </div>
    </div>
  );
}
