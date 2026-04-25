import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Settings, Smartphone, Loader, BrainCircuit, MessageCircle, Users, TrendingUp, Lock, Mail, ChevronRight, LogOut, Plus, X, Save, Bell, Clock, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import '../index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const socket = io(API_URL);

// FIX 3: Helper centralizado que adjunta el token JWT a cada request autenticado.
// Antes, el token que devolvía el backend en el login nunca se almacenaba ni se enviaba,
// por lo que todos los endpoints protegidos habrían rechazado las peticiones del frontend.
function authFetch(url, options = {}) {
  const token = localStorage.getItem('asisto_token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  }).then(res => {
    // Si el token expiró o no existe, limpiar sesión y recargar al login
    if (res.status === 401) {
      localStorage.removeItem('asisto_token');
      localStorage.removeItem('asisto_user');
      window.location.reload();
    }
    return res;
  });
}

function LoginScreen({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const endpoint = isRegistering ? `${API_URL}/api/register` : `${API_URL}/api/login`;
    const payload = isRegistering ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Credenciales inválidas o error de red.');

      // FIX 3: Almacenar el token para que authFetch pueda enviarlo en cada request posterior.
      localStorage.setItem('asisto_token', data.token);
      localStorage.setItem('asisto_user', JSON.stringify(data.user));
      setTimeout(() => onLogin(data.user), 500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="brand-logo">TJ</div>
          <h2>Asisto AI</h2>
          <p>{isRegistering ? 'Crea tu Espacio de Trabajo' : 'Portal de Acceso Privado SaaS'}</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {isRegistering && (
             <div className="input-group">
                <Smartphone size={18} className="input-icon" />
                <input type="text" placeholder="Nombre completo del Comercio" required value={name} onChange={e => setName(e.target.value)} disabled={loading} />
             </div>
          )}
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input type="email" placeholder="Correo electrónico del Alta" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
          </div>
          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input type="password" placeholder="Contraseña segura" required value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
          </div>
          <button type="submit" className="btn-solid-blue" disabled={loading}>
            {loading ? <Loader className="spinner" size={18}/> : <>{isRegistering ? 'Fundar Mi Negocio' : 'Autenticar Cuenta'} <ChevronRight size={18} /></>}
          </button>
        </form>
        <div className="login-footer" style={{marginTop:'1.5rem'}}>
           <p style={{marginBottom:'10px'}}>Protegido por encriptación 256-bit.</p>
           <button style={{background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontWeight:'bold'}} onClick={() => { setIsRegistering(!isRegistering); setError(''); }}>
             {isRegistering ? '¿Ya tienes cuenta? Ingresa aquí' : '¿Nuevo emprendedor? Regístrate Gratis'}
           </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [user, setUser] = useState(() => {
     const savedUser = localStorage.getItem('asisto_user');
     return savedUser ? JSON.parse(savedUser) : null;
  });
  const [bots, setBots] = useState([]);
  const [qrCodes, setQrCodes] = useState({});

  // States Modal Settings (Prompt & Knowledge Base)
  const [openSettingsId, setOpenSettingsId] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState({});
  const [editingKnowledge, setEditingKnowledge] = useState({});
  const [editingShopify, setEditingShopify] = useState({});
  const [editingWorkingHours, setEditingWorkingHours] = useState({});

  // States Modal Add Client
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', password: '', shopifyUrl: '' });

  // Custom Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Profile dropdown
  const [showProfile, setShowProfile] = useState(false);

  // States 2FA MFA Verification
  const [adminPhoneCountryCode, setAdminPhoneCountryCode] = useState({});
  const [adminPhoneToVerify, setAdminPhoneToVerify] = useState({});
  const [verificationCode, setVerificationCode] = useState({});
  const [isVerifyingMFA, setIsVerifyingMFA] = useState({});

  // States Debtors
  const [debtors, setDebtors] = useState({});
  const [newDebtor, setNewDebtor] = useState({});

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // FIX 3: Todos los fetches del dashboard usan authFetch para enviar el token.
  const fetchBots = () => {
    authFetch(`${API_URL}/api/bots`)
      .then(res => res.json())
      .then(data => setBots(Array.isArray(data) ? data : []));
  };

  const fetchDebtors = async (botId) => {
    const res = await authFetch(`${API_URL}/api/bots/${botId}/debtors`);
    const data = await res.json();
    setDebtors(prev => ({...prev, [botId]: data}));
  };

  useEffect(() => {
    if (!user) return;

    fetchBots();

    // Auto-sync de la UI cuando la PC despierta de suspensión o reconecta el internet
    socket.on('connect', fetchBots);
    const onFocus = () => fetchBots();
    window.addEventListener('focus', onFocus);

    socket.on('bot_status', (data) => {
      setBots(prev => prev.map(bot => bot.id === data.id ? { ...bot, ...data } : bot));
    });
    socket.on('bot_updated', (data) => {
      setBots(prev => prev.map(bot => bot.id === data.id ? { ...bot, prompt: data.prompt, knowledgeBase: data.knowledgeBase, shopifyUrl: data.shopifyUrl, metrics: {...bot.metrics, workingHours: data.workingHours, hasDebtorsFeature: data.hasDebtorsFeature, hasSocialFeature: data.hasSocialFeature} } : bot));
    });
    socket.on('bot_added', fetchBots);
    socket.on('qr_code', (data) => {
      setQrCodes(prev => ({ ...prev, [data.id]: data.qr }));
    });
    socket.on('bot_error', (data) => {
      let cleanMsg = data.message;
      if (cleanMsg.includes('429 Too Many Requests') || cleanMsg.includes('quota')) {
          cleanMsg = "Límite gratuito de IA excedido (429).";
      } else if (cleanMsg.includes('API key not valid')) {
          cleanMsg = "API Key inválida o no configurada.";
      }

      const newNotif = {
        id: Date.now() + Math.random(),
        title: "⚠️ Alerta Técnica AI",
        botName: data.botName,
        message: cleanMsg
      };
      setNotifications(prev => [newNotif, ...prev]);
    });

    return () => {
      socket.off('connect', fetchBots);
      window.removeEventListener('focus', onFocus);
      socket.off('bot_status'); socket.off('bot_updated'); socket.off('bot_added'); socket.off('qr_code'); socket.off('bot_error');
    };
  }, [user]);

  if (!user) return <LoginScreen onLogin={setUser} />;

  const displayBots = user.role === 'admin' ? bots : bots.filter(b => b.id === user.botId);

  const handleStart = async (id) => {
    setQrCodes(prev => ({ ...prev, [id]: null }));
    await authFetch(`${API_URL}/api/bots/${id}/start`, { method: 'POST' });
  };
  const handleStop = async (id) => {
    await authFetch(`${API_URL}/api/bots/${id}/stop`, { method: 'POST' });
    setQrCodes(prev => ({ ...prev, [id]: null }));
  };

  const handleSavePrompt = async (botId) => {
    const promptText = editingPrompt[botId];
    const knowledgeText = editingKnowledge[botId];
    const shopifyText = editingShopify[botId];
    const workingHoursData = editingWorkingHours[botId];

    let bodyData = {};
    if (promptText !== undefined) bodyData.prompt = promptText;
    if (knowledgeText !== undefined) bodyData.knowledgeBase = knowledgeText;
    if (shopifyText !== undefined) bodyData.shopifyUrl = shopifyText;
    if (workingHoursData !== undefined) bodyData.workingHours = workingHoursData;

    if (Object.keys(bodyData).length === 0) return;

    await authFetch(`${API_URL}/api/bots/${botId}/prompt`, {
      method: 'PUT',
      body: JSON.stringify(bodyData)
    });

    const btn = document.getElementById(`save-btn-${botId}`);
    if(btn) {
      btn.innerText = "¡Guardado!";
      btn.style.background = "#10b981";
      setTimeout(() => {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-save"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg> Actualizar Cerebro`;
        btn.style.background = "";
      }, 2000);
    }
  };

  const handleDeleteBot = async (id) => {
    await authFetch(`${API_URL}/api/bots/${id}`, { method: 'DELETE' });
    setBots(prev => prev.filter(b => b.id !== id));
    setConfirmDeleteId(null);
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    await authFetch(`${API_URL}/api/bots`, {
      method: 'POST',
      body: JSON.stringify(newClient)
    });
    setShowAddModal(false);
    setNewClient({ name: '', email: '', password: '', shopifyUrl: '' });
  };

  const handleSendMFA = async (botId) => {
    let localPhone = adminPhoneToVerify[botId];
    if (!localPhone) return alert('Por favor ingresa un número de teléfono válido.');

    localPhone = localPhone.replace(/\D/g, '');
    const code = adminPhoneCountryCode[botId] || '549';
    const phone = code + localPhone;

    const res = await authFetch(`${API_URL}/api/bots/${botId}/mfa/send`, {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (res.ok) {
        setIsVerifyingMFA(prev => ({...prev, [botId]: true}));
    } else {
        alert(data.error || 'Error al enviar código. Recuerda que el Bot debe estar encendido (ON).');
    }
  };

  const handleVerifyMFA = async (botId) => {
    const code = verificationCode[botId];
    if (!code) return;

    const res = await authFetch(`${API_URL}/api/bots/${botId}/mfa/verify`, {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (res.ok) {
        setIsVerifyingMFA(prev => ({...prev, [botId]: false}));
        setAdminPhoneToVerify(prev => ({...prev, [botId]: ''}));
        setVerificationCode(prev => ({...prev, [botId]: ''}));
        alert('¡Número de Dueño vinculado permanentemente con éxito!');
    } else {
        alert(data.error || 'Código incorrecto. Vuelve a intentarlo.');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="header header-flex">
        <div className="header-titles">
          <h1>Bot Manager <span className="badge">PRO</span></h1>
          <p>{user.role === 'admin'
            ? 'Vista Global Súper Administrador'
            : `Panel de Auto-Gestión Inteligente`}</p>
        </div>
        <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
          {/* Notification Bell */}
          <div style={{position: 'relative', cursor: 'pointer', marginRight: '5px'}} onClick={() => setShowNotifications(!showNotifications)}>
             <Bell size={22} color={notifications.length > 0 ? '#ef4444' : 'currentColor'} />
             {notifications.length > 0 && (
                <div style={{position:'absolute', top:'-6px', right:'-6px', background:'#ef4444', color:'white', borderRadius:'50%', width:'16px', height:'16px', fontSize:'10px', display:'flex', justifyContent:'center', alignItems:'center', fontWeight:'bold'}}>
                  {notifications.length}
                </div>
             )}
          </div>

          {user.role === 'admin' && (
            <button className="btn-solid-blue" onClick={() => setShowAddModal(true)} style={{marginTop:0, padding:'0.6rem 1.25rem'}}>
              <Plus size={18} /> Alta Cliente
            </button>
          )}
          {/* Profile Avatar */}
          <div style={{ position: 'relative' }}>
            <div onClick={() => setShowProfile(!showProfile)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', color: 'white', border: '2px solid var(--border)', userSelect: 'none' }}>
              {(user.name || user.email || 'A').charAt(0).toUpperCase()}
            </div>
            {showProfile && (
              <div style={{ position: 'absolute', top: '48px', right: 0, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1rem', minWidth: '200px', zIndex: 9999, boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.1rem', color: 'white', flexShrink: 0 }}>
                    {(user.name || user.email || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{user.name || user.email}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </div>
                  </div>
                </div>
                <button onClick={() => { localStorage.removeItem('asisto_user'); localStorage.removeItem('asisto_token'); setUser(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.9rem', padding: '0.4rem 0' }}>
                  <LogOut size={15} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Alert Center Dropdown */}
      {showNotifications && (
        <div style={{ position:'fixed', top:'80px', right:'30px', zIndex:9999, display:'flex', flexDirection:'column', gap:'10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '15px', width: '320px', maxHeight: '400px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', animation: 'fadein 0.2s' }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '5px'}}>
              <h3 style={{margin: 0, fontSize: '1rem'}}>Centro de Alertas</h3>
              {notifications.length > 0 && <button style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.8rem'}} onClick={() => setNotifications([])}>Limpiar</button>}
          </div>
          {notifications.length === 0 ? (
             <p style={{textAlign: 'center', color: 'gray', fontSize: '0.85rem', margin: '20px 0'}}>No hay alertas pendientes.</p>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} style={{
                borderLeft: '3px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)',
                padding: '10px', borderRadius: '4px'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#ef4444', fontSize: '0.85rem' }}>{notif.botName}</h4>
                    <button style={{background:'none', border:'none', color:'gray', cursor:'pointer', padding: 0}} onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}><X size={14}/></button>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight:'1.4' }}>{notif.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Agregar Cliente */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="login-box" style={{margin:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
              <h3 style={{margin:0}}>Registrar Nuevo Negocio</h3>
              <button style={{background:'none', border:'none', color:'white', cursor:'pointer'}} onClick={() => setShowAddModal(false)}>
                <X size={24}/>
              </button>
            </div>
            <form onSubmit={handleAddClient} className="login-form">
              <input className="modal-input" placeholder="Nombre de la Tienda (Ej: Paruolo)" required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
              <input className="modal-input" placeholder="Shopify URL (opcional, Ej: paruolo.myshopify.com)" value={newClient.shopifyUrl} onChange={e => setNewClient({...newClient, shopifyUrl: e.target.value})} />

              <hr style={{borderColor:'var(--border)', margin:'0.5rem 0'}}/>
              <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', margin:0}}>Credenciales del Portal de Cliente:</p>

              <input className="modal-input" type="email" placeholder="Correo del local" required value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
              <input className="modal-input" type="password" placeholder="Contraseña segura" required value={newClient.password} onChange={e => setNewClient({...newClient, password: e.target.value})} />

              <button type="submit" className="btn-solid-blue">Fundar Espacio de Trabajo</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminar */}
      {confirmDeleteId && (
        <div className="modal-overlay">
          <div className="login-box" style={{ margin: 'auto', maxWidth: '380px', textAlign: 'center' }}>
            <Trash2 size={40} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem' }}>¿Eliminar este bot?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
              Se borrarán el bot, el usuario y todos los datos asociados. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDeleteId(null)} style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => handleDeleteBot(confirmDeleteId)} style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '700' }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="bots-list">
        {displayBots.length === 0 && <p style={{textAlign:'center', color:'gray'}}>Aún no tenés ningún negocio conectado a la nube.</p>}
        {displayBots.map(bot => (
          <div key={bot.id} className="bot-card-horizontal">

            <div className="bot-card-main">
              <div className="bot-info-section">
                <div className="bot-title-row">
                  <Smartphone size={24} className="icon-blue" />
                  <h2>{bot.name}</h2>
                  <div className={`status-badge ${bot.status.toLowerCase()}`}>
                    {bot.status}
                  </div>
                </div>
                <p className="shop-url">{bot.shopifyUrl}</p>

                {bot.metrics && (() => {
                  const inp = bot.metrics.tokensInput  || 0;
                  const out = bot.metrics.tokensOutput || 0;
                  const costUSD = ((inp * 0.075 + out * 0.30) / 1_000_000).toFixed(4);
                  const totalTokens = inp + out;
                  return (
                  <div className="metrics-row">
                    <div className="metric-chip" title="Mensajes de IA Generados">
                      <MessageCircle size={14} className="icon-subtle" /> <span>{(bot.metrics.messagesSent || 0).toLocaleString()} msjs</span>
                    </div>
                    <div className="metric-chip" title="Clientes Atendidos">
                      <Users size={14} className="icon-subtle" /> <span>{(bot.metrics.customersHelped || 0).toLocaleString()} chats</span>
                    </div>
                    <div className="metric-chip" title="Conversiones estimadas">
                      <TrendingUp size={14} className="icon-success" /> <span>{(bot.metrics.weeklySales || 0).toLocaleString()} conv.</span>
                    </div>
                    <div className="metric-chip" title="Tokens de Gemini consumidos (entrada + salida)" style={{background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)'}}>
                      <BrainCircuit size={14} color="#f59e0b" /> <span style={{color: '#f59e0b'}}>{totalTokens.toLocaleString()} tokens</span>
                    </div>
                    <div className="metric-chip" title={`Costo estimado Gemini: entrada $0.075/1M · salida $0.30/1M`} style={{background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)'}}>
                      <TrendingUp size={14} color="#10b981" /> <span style={{color: '#10b981'}}>USD ${costUSD}</span>
                    </div>
                    {bot.metrics.adminNumber && (
                      <div className="metric-chip" title="Teléfono autorizado para Campañas Masivas" style={{background: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)'}}>
                        <Lock size={14} color="#8b5cf6" /> <span style={{color: '#8b5cf6', fontWeight: 'bold'}}>Dueño: +{bot.metrics.adminNumber.split('@')[0]}</span>
                      </div>
                    )}
                  </div>
                  );
                })()}
              </div>

              <div className="bot-actions-section">
                {user.role === 'admin' && (
                  <button
                    title="Eliminar bot"
                    onClick={() => setConfirmDeleteId(bot.id)}
                    style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button
                  className={`btn-settings ${openSettingsId === bot.id ? 'active' : ''}`}
                  title="Ajustes y Parámetros del Cerebro AI"
                  onClick={() => {
                    if (openSettingsId !== bot.id) {
                        fetchDebtors(bot.id);
                    }
                    setOpenSettingsId(openSettingsId === bot.id ? null : bot.id);
                    if (editingPrompt[bot.id] === undefined) {
                      setEditingPrompt({...editingPrompt, [bot.id]: bot.prompt || ''});
                    }
                    if (editingKnowledge[bot.id] === undefined) {
                      setEditingKnowledge({...editingKnowledge, [bot.id]: bot.knowledgeBase || ''});
                    }
                    if (editingShopify[bot.id] === undefined) {
                      setEditingShopify({...editingShopify, [bot.id]: bot.shopifyUrl || ''});
                    }
                    if (editingWorkingHours[bot.id] === undefined) {
                      setEditingWorkingHours({...editingWorkingHours, [bot.id]: bot.metrics?.workingHours || { active: false, start: '09:00', end: '18:00', autoReplyMsg: '' }});
                    }
                  }}
                >
                  <Settings size={20} />
                </button>
                <div className="ios-toggle-wrapper">
                  <span className="toggle-label">{bot.status === 'OFF' ? 'OFF' : 'ON'}</span>
                  <label className="ios-toggle">
                    <input
                      type="checkbox"
                      checked={bot.status !== 'OFF'}
                      onChange={() => bot.status === 'OFF' ? handleStart(bot.id) : handleStop(bot.id)}
                      disabled={bot.status === 'STARTING' || bot.status === 'QR_READY'}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Prompt Viewer Editable */}
            {openSettingsId === bot.id && (
              <div className="bot-card-expanded prompt-editor-container">
                {user.role === 'admin' && (
                  <>
                    <div className="prompt-header">
                      <BrainCircuit size={20} className="icon-purple" />
                      <h3>Comportamiento Psicológico de la IA</h3>
                    </div>
                    <textarea
                      className="prompt-textarea editable"
                      value={editingPrompt[bot.id] !== undefined ? editingPrompt[bot.id] : bot.prompt}
                      onChange={(e) => setEditingPrompt({...editingPrompt, [bot.id]: e.target.value})}
                      placeholder="Escribí aquí las instrucciones secretas para tu vendedor IA..."
                    />
                  </>
                )}

                <div className="prompt-header" style={{marginTop:'1.5rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                  <Settings size={20} className="icon-blue" />
                  <h3>Conexión Catálogo Activo (Tienda Online)</h3>
                </div>
                <input
                  className="modal-input"
                  style={{marginBottom: '1rem', background: 'var(--bg-card)'}}
                  value={editingShopify[bot.id] !== undefined ? editingShopify[bot.id] : bot.shopifyUrl}
                  onChange={(e) => setEditingShopify({...editingShopify, [bot.id]: e.target.value})}
                  placeholder="Ej: mitienda.com (Dejar vacío si no usas Tienda Online)"
                />

                <div className="prompt-header" style={{marginTop:'1.5rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                  <BrainCircuit size={20} className="icon-success" style={{color: '#10b981'}} />
                  <h3>Base de Conocimientos (Listas de Precio o Reglas del Local)</h3>
                </div>
                <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', margin:'0 0 0.5rem 0'}}>Pega aquí texto libre con precios, links o detalles de servicios. La IA lo memorizará.</p>
                <textarea
                  className="prompt-textarea editable"
                  style={{minHeight: '120px', borderColor: 'rgba(16, 185, 129, 0.3)'}}
                  value={editingKnowledge[bot.id] !== undefined ? editingKnowledge[bot.id] : (bot.knowledgeBase || '')}
                  onChange={(e) => setEditingKnowledge({...editingKnowledge, [bot.id]: e.target.value})}
                  placeholder={`Organizá la info por secciones para que la IA solo lea lo relevante en cada pregunta:\n\n[ENVIO]\nEnvíos en 24-48hs. Costo fijo $2.000 a todo el país.\n\n[PAGOS]\nEfectivo, transferencia (10% OFF) o tarjeta hasta 6 cuotas.\n\n[UBICACION]\nAv. Corrientes 1234, CABA. Lun-Sáb 9 a 20hs.\n\n[DEVOLUCIONES]\n30 días para cambios sin cargo.\n\nSin secciones también funciona, pero con secciones la IA es más eficiente.`}
                />

                <div className="prompt-header" style={{marginTop:'1.5rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                  <Clock size={20} className="icon-blue" />
                  <h3>Horario de Atención (Anti-Nocturno)</h3>
                </div>
                <div style={{display:'flex', gap:'10px', alignItems:'center', marginBottom:'10px'}}>
                  <label className="ios-toggle">
                    <input type="checkbox" checked={editingWorkingHours[bot.id]?.active || false} onChange={e => setEditingWorkingHours({...editingWorkingHours, [bot.id]: {...(editingWorkingHours[bot.id] || {}), active: e.target.checked}})} />
                    <span className="slider"></span>
                  </label>
                  <span>Activar Límite de Horario</span>
                </div>

                {editingWorkingHours[bot.id]?.active && (
                  <div style={{background: 'rgba(59, 130, 246, 0.05)', padding:'1rem', borderRadius:'8px', border:'1px solid rgba(59, 130, 246, 0.2)', marginBottom:'1rem'}}>
                    <div style={{display:'flex', gap:'1rem', marginBottom:'1rem'}}>
                      <div>
                        <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'0.2rem'}}>Abre (Ej: 09:00)</label>
                        <input className="modal-input" type="time" value={editingWorkingHours[bot.id]?.start || '09:00'} onChange={e => setEditingWorkingHours({...editingWorkingHours, [bot.id]: {...editingWorkingHours[bot.id], start: e.target.value}})} style={{padding:'0.5rem', width: 'auto'}} />
                      </div>
                      <div>
                        <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'0.2rem'}}>Cierra (Ej: 18:00)</label>
                        <input className="modal-input" type="time" value={editingWorkingHours[bot.id]?.end || '18:00'} onChange={e => setEditingWorkingHours({...editingWorkingHours, [bot.id]: {...editingWorkingHours[bot.id], end: e.target.value}})} style={{padding:'0.5rem', width: 'auto'}} />
                      </div>
                    </div>
                    <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'0.2rem'}}>Mensaje Automático (Si lo dejas vacío, no contestará de noche)</label>
                    <textarea
                      className="prompt-textarea editable"
                      style={{minHeight:'60px'}}
                      placeholder="Ej: Hola! Nuestro local está cerrado ahora, pero mañana a primera hora te asisto."
                      value={editingWorkingHours[bot.id]?.autoReplyMsg || ''}
                      onChange={e => setEditingWorkingHours({...editingWorkingHours, [bot.id]: {...editingWorkingHours[bot.id], autoReplyMsg: e.target.value}})}
                    />
                  </div>
                )}

                <div className="prompt-header" style={{marginTop:'1.5rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                  <Lock size={20} color="#8b5cf6" />
                  <h3 style={{color: '#8b5cf6'}}>Seguridad: Celular de Administrador</h3>
                </div>

                {bot.metrics?.adminNumber ? (
                  <div style={{background: 'rgba(16, 185, 129, 0.1)', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <div>
                      <p style={{margin: 0, color: '#10b981', fontWeight: 'bold'}}>Número de Contacto Seguro Validado</p>
                      <p style={{margin: 0, fontSize: '0.85rem', color: '#10b981', opacity: 0.9}}>+{bot.metrics.adminNumber.split('@')[0]}</p>
                    </div>
                  </div>
                ) : (
                  <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', margin:'0 0 0.5rem 0'}}>Vincula el número del dueño o encargados (puedes agregar hasta 5 números separados por coma) para autorizar acciones seguras.</p>
                )}

                <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                  <select
                    className="modal-input"
                    style={{width: '90px', padding: '0.5rem', background: '#252b36', color: 'white', border: '1px solid var(--border)'}}
                    value={adminPhoneCountryCode[bot.id] || '549'}
                    onChange={e => setAdminPhoneCountryCode({...adminPhoneCountryCode, [bot.id]: e.target.value})}
                  >
                    <option value="549">🇦🇷 +54</option>
                    <option value="52">🇲🇽 +52</option>
                    <option value="56">🇨🇱 +56</option>
                    <option value="57">🇨🇴 +57</option>
                    <option value="51">🇵🇪 +51</option>
                    <option value="34">🇪🇸 +34</option>
                    <option value="1">🇺🇸 +1</option>
                  </select>
                  <input className="modal-input" placeholder="Ej: 1156687137" style={{flex: 1}} value={adminPhoneToVerify[bot.id] || ''} onChange={e => setAdminPhoneToVerify({...adminPhoneToVerify, [bot.id]: e.target.value})} />
                  <button className="btn-solid-blue" style={{background: '#8b5cf6', width:'auto', padding:'0.6rem 1rem'}} onClick={() => handleSendMFA(bot.id)}>
                    Validar Nro
                  </button>
                </div>
                {isVerifyingMFA[bot.id] && (
                   <div style={{display:'flex', gap:'10px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', padding:'10px', borderRadius:'8px', marginTop:'5px'}}>
                      <input className="modal-input" placeholder="Pin Oficial TrenJacker de 6 cifras" style={{background:'var(--bg-app)'}} value={verificationCode[bot.id] || ''} onChange={e => setVerificationCode({...verificationCode, [bot.id]: e.target.value})} />
                      <button className="btn-solid-blue" style={{background: '#10b981', width:'auto', padding:'0.6rem 1rem'}} onClick={() => handleVerifyMFA(bot.id)}>Confirmar</button>
                   </div>
                )}

                <div style={{display:'flex', justifyContent:'flex-end', width:'100%', marginTop:'0.75rem'}}>
                  <button id={`save-btn-${bot.id}`} className="btn-solid-blue" onClick={() => handleSavePrompt(bot.id)} style={{width:'auto', padding:'0.6rem 1.25rem', marginTop:0}}>
                    <Save size={16} /> Actualizar Cerebro
                  </button>
                </div>

                {/* ===== UPSELLS / BLOCKED FEATURES AT THE BOTTOM ===== */}
                <div style={{marginTop:'2rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                  {bot.metrics?.hasDebtorsFeature ? (
                    <>
                      <div className="prompt-header">
                        <Users size={20} color="#ef4444" />
                        <h3 style={{color: '#ef4444'}}>Motor Asistente Automático (Gestión de Deudores)</h3>
                      </div>

                      {user.role === 'admin' && (
                        <div style={{display:'flex', gap:'10px', alignItems:'center', marginBottom:'10px'}}>
                          <label className="ios-toggle">
                            <input
                              type="checkbox"
                              checked={bot.metrics?.hasDebtorsFeature || false}
                              onChange={async (e) => {
                                  const val = e.target.checked;
                                  setBots(prev => prev.map(b => b.id === bot.id ? { ...b, metrics: { ...b.metrics, hasDebtorsFeature: val } } : b));
                                  await authFetch(`${API_URL}/api/bots/${bot.id}/prompt`, { method: 'PUT', body: JSON.stringify({ hasDebtorsFeature: val }) });
                              }}
                            />
                            <span className="slider"></span>
                          </label>
                          <span style={{color: 'gray', fontWeight: 'bold'}}>Habilitar Servicio Elite (Solo Admin)</span>
                        </div>
                      )}

                      <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', margin:'0 0 0.5rem 0'}}>Agenda un cliente aquí y la IA cobrará de forma elegante a las 10:00 AM cada día en automático.</p>

                      <div style={{display:'flex', gap:'5px', marginBottom:'10px', flexWrap:'wrap'}}>
                        <input className="modal-input" placeholder="Nombre" style={{flex: 1, minWidth: '100px'}} value={newDebtor[bot.id]?.name || ''} onChange={e => setNewDebtor({...newDebtor, [bot.id]: {...newDebtor[bot.id], name: e.target.value}})} />
                        <input className="modal-input" placeholder="Wsp (Ej: 549112233)" style={{flex: 1, minWidth: '100px'}} value={newDebtor[bot.id]?.phone || ''} onChange={e => setNewDebtor({...newDebtor, [bot.id]: {...newDebtor[bot.id], phone: e.target.value}})} />
                        <input className="modal-input" placeholder="Monto ($)" type="number" style={{flex: 1, minWidth: '100px'}} value={newDebtor[bot.id]?.amount || ''} onChange={e => setNewDebtor({...newDebtor, [bot.id]: {...newDebtor[bot.id], amount: e.target.value}})} />
                        <button className="btn-solid-blue" style={{background: '#ef4444', width:'auto', padding:'0.6rem 1rem'}} onClick={async () => {
                            const d = newDebtor[bot.id];
                            if(!d || !d.name || !d.phone || !d.amount) return alert('Completa todos los campos');
                            await authFetch(`${API_URL}/api/bots/${bot.id}/debtors`, { method: 'POST', body: JSON.stringify(d) });
                            setNewDebtor({...newDebtor, [bot.id]: {name:'', phone:'', amount:''}});
                            fetchDebtors(bot.id);
                        }}>Cargar</button>
                      </div>

                      {debtors[bot.id] && debtors[bot.id].length > 0 && (
                        <div style={{background: 'rgba(239, 68, 68, 0.05)', borderRadius:'8px', border:'1px solid rgba(239, 68, 68, 0.2)', padding:'10px', maxHeight: '150px', overflowY: 'auto'}}>
                          {debtors[bot.id].map(d => (
                              <div key={d.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid rgba(239, 68, 68, 0.1)', padding:'5px 0'}}>
                                  <div style={{fontSize:'0.85rem'}}>
                                      <strong style={{color: d.status === 'pending' ? '#ef4444' : '#10b981'}}>{d.name}</strong> - ${d.amount} <br/><span style={{color:'gray', fontSize:'0.75rem'}}>+{d.phone} ({d.status})</span>
                                  </div>
                                  <div style={{display:'flex', gap:'5px'}}>
                                    {d.status === 'pending' && (
                                      <button style={{background:'#10b981', color:'white', border:'none', borderRadius:'4px', padding:'4px 8px', cursor:'pointer', fontSize:'0.75rem'}} onClick={async () => {
                                          await authFetch(`${API_URL}/api/bots/${bot.id}/debtors/${d.id}`, { method: 'PUT', body: JSON.stringify({status: 'paid'}) });
                                          fetchDebtors(bot.id);
                                      }}>Pagó</button>
                                    )}
                                    <button style={{background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border)', borderRadius:'4px', padding:'4px 8px', cursor:'pointer', fontSize:'0.75rem'}} onClick={async () => {
                                        await authFetch(`${API_URL}/api/bots/${bot.id}/debtors/${d.id}`, { method: 'DELETE' });
                                        fetchDebtors(bot.id);
                                    }}>Borrar</button>
                                  </div>
                              </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{background: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', width: '100%', boxSizing: 'border-box', opacity: '0.6'}}>
                        <Lock size={32} color="gray" style={{margin: '0 auto 10px auto', display: 'block'}}/>
                        <h4 style={{margin: '0 0 5px 0', color: 'gray'}}>Terminal Recordatorio de Pagos a Clientes</h4>
                        <p style={{margin: 0, fontSize: '0.85rem', color: 'gray'}}>Comunícate con Soporte para adquirir esta función Elite. La IA enviará alertas de cobro amigables por WhatsApp a tus clientes deudores de forma 100% automática a las 10:00 AM.</p>

                        {user.role === 'admin' && (
                          <div style={{display:'inline-flex', gap:'10px', alignItems:'center', marginTop:'15px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px'}}>
                            <span style={{color: 'gray', fontWeight: 'bold', fontSize: '0.8rem'}}>Desbloquear VIP (Admin)</span>
                            <label className="ios-toggle">
                              <input
                                type="checkbox"
                                checked={bot.metrics?.hasDebtorsFeature || false}
                                onChange={async (e) => {
                                    const val = e.target.checked;
                                    setBots(prev => prev.map(b => b.id === bot.id ? { ...b, metrics: { ...b.metrics, hasDebtorsFeature: val } } : b));
                                    await authFetch(`${API_URL}/api/bots/${bot.id}/prompt`, { method: 'PUT', body: JSON.stringify({ hasDebtorsFeature: val }) });
                                }}
                              />
                              <span className="slider"></span>
                            </label>
                          </div>
                        )}
                    </div>
                  )}

                  <div style={{marginTop:'2rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                    <div className="prompt-header">
                      <MessageCircle size={20} color="#e1306c" />
                      <h3 style={{color: '#e1306c'}}>Integración Instagram DMs</h3>
                    </div>

                    {user.role === 'admin' && (
                      <div style={{display:'flex', gap:'10px', alignItems:'center', marginBottom:'10px'}}>
                        <label className="ios-toggle">
                          <input
                            type="checkbox"
                            checked={bot.metrics?.hasSocialFeature || false}
                            onChange={async (e) => {
                                const val = e.target.checked;
                                setBots(prev => prev.map(b => b.id === bot.id ? { ...b, metrics: { ...b.metrics, hasSocialFeature: val } } : b));
                                await authFetch(`${API_URL}/api/bots/${bot.id}/prompt`, { method: 'PUT', body: JSON.stringify({ hasSocialFeature: val }) });
                            }}
                          />
                          <span className="slider"></span>
                        </label>
                        <span style={{color: 'gray', fontWeight: 'bold'}}>Habilitar Servicio Elite (Solo Admin)</span>
                      </div>
                    )}
                    <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', margin:'0 0 0.5rem 0'}}>Permite al cliente conectar su cuenta de Instagram para que la IA responda Mensajes Directos.</p>
                  </div>
                </div>

              </div>
            )}

            {bot.status === 'QR_READY' && qrCodes[bot.id] && (
              <div className="bot-card-expanded qr-container">
                <p>Escanea este Código Oficial con la cuenta de WhatsApp Business para conectar la IA a la Nube:</p>
                <div className="qr-wrapper">
                  <QRCodeSVG value={qrCodes[bot.id]} size={180} />
                </div>
              </div>
            )}

            {bot.status === 'STARTING' && (
              <div className="bot-card-expanded loading-state">
                <Loader className="spinner" size={28} />
                <p>Ensamblando el navegador aislado Chromium de alta velocidad...</p>
              </div>
            )}

            {bot.status === 'ON' && (
              <div className="bot-card-expanded" style={{background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center', padding: '1rem'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{margin: '0 auto 10px auto', display: 'block'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <h4 style={{margin: '0 0 5px 0', color: '#10b981'}}>¡IA Conectada a WhatsApp Oficialmente!</h4>
                <p style={{margin: 0, fontSize: '0.85rem', color: '#10b981', opacity: 0.9}}>Escaneo exitoso. TrendJacker ya tiene el control de las respuestas automáticas para este número.</p>
              </div>
            )}

          </div>
        ))}
      </main>
    </div>
  );
}

export default Dashboard;
