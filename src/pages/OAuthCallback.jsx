import { useEffect, useState } from 'react';

export default function OAuthCallback() {
  const [status, setStatus] = useState('loading');
  const [label, setLabel] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('meta_ok')) {
      const pageName = params.get('page_name') || 'tu cuenta';
      setLabel(pageName);
      setStatus('success');
      window.opener?.postMessage({ type: 'meta_ok', pageName }, window.location.origin);
      setTimeout(() => window.close(), 2800);

    } else if (params.get('meta_select')) {
      const token = params.get('meta_select');
      window.opener?.postMessage({ type: 'meta_select', token }, window.location.origin);
      setStatus('redirect');
      setTimeout(() => window.close(), 800);

    } else if (params.get('meta_error')) {
      const err = params.get('meta_error');
      const msgs = {
        acceso_denegado: 'Cancelaste el acceso.',
        sesion_expirada: 'La sesión expiró, intentá de nuevo.',
        sin_paginas: 'No encontramos páginas de Facebook en tu cuenta.',
        error_interno: 'Error interno. Contactá soporte.',
      };
      setLabel(msgs[err] || err);
      setStatus('error');
      window.opener?.postMessage({ type: 'meta_error', error: err }, window.location.origin);
      setTimeout(() => window.close(), 3500);

    } else {
      setLabel('Respuesta inesperada del servidor.');
      setStatus('error');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0d0f17', fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#fff', gap: '1.25rem', padding: '2rem',
    }}>
      {status === 'loading' && (
        <>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid rgba(124,58,237,0.2)',
            borderTopColor: '#7c3aed',
            animation: 'spin 0.75s linear infinite',
          }} />
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>Procesando conexión…</p>
        </>
      )}

      {status === 'redirect' && (
        <>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid rgba(124,58,237,0.2)',
            borderTopColor: '#7c3aed',
            animation: 'spin 0.75s linear infinite',
          }} />
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>Cargando páginas…</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(16,185,129,0.12)',
            border: '2.5px solid #10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path
                d="M9 18.5l6 6 12-13"
                stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: 'drawCheck 0.4s ease 0.2s both' }}
              />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.3rem', fontWeight: 700 }}>¡Conectado!</h2>
            <p style={{ margin: '0 0 0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>{label}</p>
            <p style={{ margin: 0, color: '#4b5563', fontSize: '0.78rem' }}>Esta ventana se cerrará automáticamente…</p>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            border: '2.5px solid #ef4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}>
            ✕
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.15rem', fontWeight: 700 }}>Error al conectar</h2>
            <p style={{ margin: '0 0 0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>{label}</p>
            <p style={{ margin: 0, color: '#4b5563', fontSize: '0.78rem' }}>Esta ventana se cerrará automáticamente…</p>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes drawCheck {
          from { stroke-dashoffset: 30; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
