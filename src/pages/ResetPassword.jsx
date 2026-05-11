import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://asisto-backend-production.up.railway.app';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!password || !confirm) { setError('Completá los dos campos.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (!token) { setError('Enlace inválido. Solicitá uno nuevo.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al restablecer.'); return; }
      setDone(true);
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

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>?</div>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem' }}>¡Contraseña actualizada!</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem', lineHeight: 1.6 }}>
              Ya podés ingresar con tu nueva contraseña.
            </p>
            <button onClick={() => nav('/login')} className="btn-solid-blue" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
              Ir al login ?
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.6rem' }}>Nueva contraseña</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem', lineHeight: 1.6 }}>
              Elegí una contraseña segura para tu cuenta.
            </p>

            {!token && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#f87171', fontSize: '0.9rem' }}>
                Enlace inválido. <a href="/olvide-contrasena" style={{ color: '#f87171' }}>Solicitá uno nuevo</a>.
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nueva contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoFocus style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Repetir contraseña</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repetí la contraseña" style={inputStyle} />
              </div>
              {error && <p style={{ color: '#f87171', margin: 0, fontSize: '0.9rem' }}>{error}</p>}
              <button type="submit" className="btn-solid-blue" disabled={loading || !token} style={{ marginTop: '0.5rem', padding: '0.9rem', fontSize: '1rem' }}>
                {loading ? 'Guardando...' : 'Guardar contraseña ?'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
