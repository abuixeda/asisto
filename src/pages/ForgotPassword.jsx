import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'https://asisto-backend-production.up.railway.app';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email) { setError('Ingres tu email.'); return; }
    setLoading(true);
    try {
      await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '1rem', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', padding: '2rem' }}>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '440px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', fontWeight: 800, fontSize: '1.3rem' }}>
          <div className="brand-logo" style={{ width: '32px', height: '32px', fontSize: '1rem', margin: 0, boxShadow: 'none' }}>TJ</div>
          Atento AI
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>??</div>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem' }}>Revis tu email</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 2rem' }}>
              Si existe una cuenta con <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>, vas a recibir un enlace para restablecer tu contrasea en los prximos minutos.
            </p>
            <button onClick={() => nav('/login')} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.8rem 1.5rem', fontSize: '0.95rem' }}>
              Volver al login
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.6rem' }}>Olvid mi contrasea</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem', lineHeight: 1.6 }}>
              Ingres tu email y te mandamos un enlace para crear una nueva contrasea.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" autoFocus style={inputStyle} />
              </div>
              {error && <p style={{ color: '#f87171', margin: 0, fontSize: '0.9rem' }}>{error}</p>}
              <button type="submit" className="btn-solid-blue" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.9rem', fontSize: '1rem' }}>
                {loading ? 'Enviando...' : 'Enviar enlace ?'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>? Volver al login</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
