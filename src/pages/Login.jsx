import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Login() {
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
      nav('/mi-panel');
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', padding: '2rem' }}>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '440px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', fontWeight: '800', fontSize: '1.3rem' }}>
          <div className="brand-logo" style={{ width: '32px', height: '32px', fontSize: '1rem', margin: 0, boxShadow: 'none' }}>TJ</div>
          Asisto AI
        </div>

        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.6rem' }}>Ingresar</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem 0' }}>Accedé a tu panel de control.</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" autoFocus
              style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>
          {error && <p style={{ color: '#f87171', margin: 0, fontSize: '0.9rem' }}>{error}</p>}
          <button type="submit" className="btn-solid-blue" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.9rem', fontSize: '1rem' }}>
            {loading ? 'Ingresando...' : 'Ingresar →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          ¿No tenés cuenta? <a href="/registro" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Crear cuenta</a>
        </p>
      </div>
    </div>
  );
}
