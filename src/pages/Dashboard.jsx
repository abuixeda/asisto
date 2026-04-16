import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Settings, Smartphone, Loader, BrainCircuit, MessageCircle, Users, TrendingUp, Lock, Mail, ChevronRight, LogOut, Plus, X, Save, Bell, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import '../index.css';

const socket = io('http://localhost:3001');

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
    const endpoint = isRegistering ? 'http://localhost:3001/api/register' : 'http://localhost:3001/api/login';
    const payload = isRegistering ? { name, email, password } : { email, password };
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Credenciales inválidas o error de red.');
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
  const [user, setUser] = useState(null);
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

  // States 2FA MFA Verification
  const [adminPhoneToVerify, setAdminPhoneToVerify] = useState({});
  const [verificationCode, setVerificationCode] = useState({});
  const [isVerifyingMFA, setIsVerifyingMFA] = useState({});

  const fetchBots = () => {
    fetch('http://localhost:3001/api/bots')
      .then(res => res.json())
      .then(data => setBots(data));
  };

  useEffect(() => {
    if (!user) return;
    
    fetchBots();

    socket.on('bot_status', (data) => {
      setBots(prev => prev.map(bot => bot.id === data.id ? { ...bot, ...data } : bot));
    });
    socket.on('bot_updated', (data) => {
      setBots(prev => prev.map(bot => bot.id === data.id ? { ...bot, prompt: data.prompt, knowledgeBase: data.knowledgeBase, shopifyUrl: data.shopifyUrl, metrics: {...bot.metrics, workingHours: data.workingHours} } : bot));
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
      socket.off('bot_status'); socket.off('bot_updated'); socket.off('bot_added'); socket.off('qr_code'); socket.off('bot_error');
    };
  }, [user]);

  if (!user) return <LoginScreen onLogin={setUser} />;

  const displayBots = user.role === 'admin' ? bots : bots.filter(b => b.id === user.botId);

  const handleStart = async (id) => {
    setQrCodes(prev => ({ ...prev, [id]: null }));
    await fetch(`http://localhost:3001/api/bots/${id}/start`, { method: 'POST' });
  };
  const handleStop = async (id) => {
    await fetch(`http://localhost:3001/api/bots/${id}/stop`, { method: 'POST' });
    setQrCodes(prev => ({ ...prev, [id]: null }));
  };

  const handleSavePrompt = async (botId) => {
    const promptText = editingPrompt[botId];
    const knowledgeText = editingKnowledge[botId];
    const shopifyText = editingShopify[botId];
    const workingHoursData = editingWorkingHours[botId];
    
    // Si no fue modificado, no mandar undef
    let bodyData = {};
    if (promptText !== undefined) bodyData.prompt = promptText;
    if (knowledgeText !== undefined) bodyData.knowledgeBase = knowledgeText;
    if (shopifyText !== undefined) bodyData.shopifyUrl = shopifyText;
    if (workingHoursData !== undefined) bodyData.workingHours = workingHoursData;

    if (Object.keys(bodyData).length === 0) return;
    
    await fetch(`http://localhost:3001/api/bots/${botId}/prompt`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });
    // alert visual
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

  const handleAddClient = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:3001/api/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient)
    });
    setShowAddModal(false);
    setNewClient({ name: '', email: '', password: '', shopifyUrl: '' });
  };

  const handleSendMFA = async (botId) => {
    const phone = adminPhoneToVerify[botId];
    if (!phone) return alert('Por favor ingresa un número de teléfono válido.');
    
    const res = await fetch(`http://localhost:3001/api/bots/${botId}/mfa/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    
    const res = await fetch(`http://localhost:3001/api/bots/${botId}/mfa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
          <button className="btn-logout" onClick={() => setUser(null)}>
            <LogOut size={16} /> Salir
          </button>
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
              <input className="modal-input" placeholder="Shopify URL (Ej: paruolo.myshopify.com)" required value={newClient.shopifyUrl} onChange={e => setNewClient({...newClient, shopifyUrl: e.target.value})} />
              
              <hr style={{borderColor:'var(--border)', margin:'0.5rem 0'}}/>
              <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', margin:0}}>Credenciales del Portal de Cliente:</p>
              
              <input className="modal-input" type="email" placeholder="Correo del local" required value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
              <input className="modal-input" type="password" placeholder="Contraseña segura" required value={newClient.password} onChange={e => setNewClient({...newClient, password: e.target.value})} />
              
              <button type="submit" className="btn-solid-blue">Fundar Espacio de Trabajo</button>
            </form>
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

                {bot.metrics && (
                  <div className="metrics-row">
                    <div className="metric-chip" title="Mensajes de IA Generados">
                      <MessageCircle size={14} className="icon-subtle" /> <span>{bot.metrics.messagesSent.toLocaleString()} msjs</span>
                    </div>
                    <div className="metric-chip" title="Clientes Atendidos">
                      <Users size={14} className="icon-subtle" /> <span>{bot.metrics.customersHelped.toLocaleString()} chats</span>
                    </div>
                    <div className="metric-chip" title="Cierres de Ventas (Estimadas)">
                      <TrendingUp size={14} className="icon-success" /> <span>{bot.metrics.weeklySales.toLocaleString()} conversiones</span>
                    </div>
                    {bot.metrics.adminNumber && (
                      <div className="metric-chip" title="Teléfono autorizado para Campañas Masivas" style={{background: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)'}}>
                        <Lock size={14} color="#8b5cf6" /> <span style={{color: '#8b5cf6', fontWeight: 'bold'}}>Dueño: +{bot.metrics.adminNumber.split('@')[0]}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bot-actions-section">
                <button 
                  className={`btn-settings ${openSettingsId === bot.id ? 'active' : ''}`} 
                  title="Ajustes y Parámetros del Cerebro AI"
                  onClick={() => {
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
                  placeholder="Ej: Remera Roja: $15.000, Gorra: $5000. / Política de Devolución de 30 días..."
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
                <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', margin:'0 0 0.5rem 0'}}>Vincula el número del dueño o encargados (puedes agregar hasta 5 números separados por coma) para autorizar acciones seguras.</p>
                
                <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                  <input className="modal-input" placeholder="Ej: 549112345678, 549118765432" value={adminPhoneToVerify[bot.id] || ''} onChange={e => setAdminPhoneToVerify({...adminPhoneToVerify, [bot.id]: e.target.value})} disabled={bot.status !== 'ON'} />
                  <button className="btn-solid-blue" style={{background: '#8b5cf6', width:'auto', padding:'0.6rem 1rem'}} onClick={() => handleSendMFA(bot.id)} disabled={bot.status !== 'ON'}>
                    Validar Nro
                  </button>
                </div>
                {isVerifyingMFA[bot.id] && (
                   <div style={{display:'flex', gap:'10px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', padding:'10px', borderRadius:'8px', marginTop:'5px'}}>
                      <input className="modal-input" placeholder="Pin Oficial TrenJacker de 4 cifras" style={{background:'var(--bg-app)'}} value={verificationCode[bot.id] || ''} onChange={e => setVerificationCode({...verificationCode, [bot.id]: e.target.value})} />
                      <button className="btn-solid-blue" style={{background: '#10b981', width:'auto', padding:'0.6rem 1rem'}} onClick={() => handleVerifyMFA(bot.id)}>Confirmar</button>
                   </div>
                )}
                
                <div style={{display:'flex', justifyContent:'flex-end', width:'100%', marginTop:'0.75rem'}}>
                  <button id={`save-btn-${bot.id}`} className="btn-solid-blue" onClick={() => handleSavePrompt(bot.id)} style={{width:'auto', padding:'0.6rem 1.25rem', marginTop:0}}>
                    <Save size={16} /> Actualizar Cerebro
                  </button>
                </div>

                <div className="prompt-footer-info">
                  <p><strong>Fusión Algorítmica en vivo:</strong> Las respuestas de esta IA se componen uniendo tres ejes base:</p>
                  <ul>
                    <li><strong>1. Personalidad Nativa:</strong> El comportamiento o jerga que ingreses en la caja de arriba.</li>
                    <li><strong>2. Coraza Catálogo:</strong> Lectura de stock de Shopify usando JSON-Feed Automático contra Alucinaciones.</li>
                    <li><strong>3. Matemática Exacta:</strong> Si no hay stock, no vende. Si transfiere le calcula el -20% OFF en latidos.</li>
                  </ul>
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

          </div>
        ))}
      </main>
    </div>
  );
}

export default Dashboard;
