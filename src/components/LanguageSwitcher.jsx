import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'es', label: 'Español', flag: '🇦🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', label: 'العربية', flag: '🇦🇪' },
];

export default function LanguageSwitcher({ style = {} }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGS.find(l => l.code === i18n.language) || LANGS[0];

  useEffect(() => {
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function select(code) {
    i18n.changeLanguage(code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px', padding: '0.35rem 0.7rem', cursor: 'pointer',
          color: '#fff', fontSize: '0.85rem', fontWeight: 500,
          transition: 'background 0.15s',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>{current.flag}</span>
        <span>{current.label}</span>
        <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px', overflow: 'hidden', zIndex: 999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: '140px',
        }}>
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => select(l.code)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                width: '100%', padding: '0.55rem 0.9rem', border: 'none',
                background: l.code === i18n.language ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: l.code === i18n.language ? '#60a5fa' : '#d1d5db',
                cursor: 'pointer', fontSize: '0.88rem', textAlign: 'left',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = l.code === i18n.language ? 'rgba(59,130,246,0.15)' : 'transparent'}
            >
              <span style={{ fontSize: '1rem' }}>{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
