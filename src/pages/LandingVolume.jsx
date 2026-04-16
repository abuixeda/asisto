import React, { useState } from 'react';
import { ChevronRight, Cpu, Zap, HeadphonesIcon, TrendingUp, CheckCircle } from 'lucide-react';
import '../index.css';

function LandingVolume() {
  const [success, setSuccess] = useState(false);

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      {/* Header NavBar */}
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding: '1.5rem 2rem', background: 'var(--card-bg)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', position: 'sticky', top:0, zIndex: 100}}>
        <div style={{display:'flex', alignItems:'center', gap:'0.75rem', fontWeight:'800', fontSize:'1.4rem'}}>
          <div className="brand-logo" style={{width:'32px', height:'32px', fontSize:'1rem', margin:0, boxShadow:'none'}}>TJ</div>
          Asisto SaaS
        </div>
        <div style={{display:'flex', gap:'1rem'}}>
          <a href="/admin" style={{color: 'var(--text-secondary)', textDecoration: 'none', fontWeight:'500', padding:'0.5rem 1rem'}}>Acceder al Panel</a>
          <button className="btn-solid-blue" onClick={() => window.location.href = '#pricing'} style={{margin:0, padding:'0.5rem 1rem', width:'auto', fontSize:'0.9rem'}}>Integrar Ahora</button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{padding: '6rem 2rem', textAlign: 'center', flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', background: 'radial-gradient(circle at 50% 0%, #1e293b 0%, var(--bg-color) 60%)'}}>
        <div className="badge" style={{marginBottom: '1rem'}}>Lanzamiento Público 2026</div>
        <h1 style={{fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-1.5px', maxWidth: '800px'}}>
          El Primer Asistente de Ventas IA que Conoce tu Stock al Milímetro.
        </h1>
        <p style={{fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '2.5rem', lineHeight: '1.6'}}>
          Conéctalo con Shopify en 1 minuto. Responde automáticamente, lee tu catálogo y aumenta tus tasas de cierre un 34% sin tocar una sola línea de código.
        </p>
        <button onClick={() => window.location.href = '#pricing'} className="btn-solid-blue" style={{fontSize: '1.1rem', padding: '1rem 2.5rem', width: 'auto', borderRadius: '99px'}}>
          Empezar Mi Prueba Gratis <ChevronRight size={20} />
        </button>
        <p style={{marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>Sin tarjeta de crédito requerida.</p>
      </section>

      {/* Features Showcase */}
      <section style={{padding: '5rem 2rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border)'}}>
        <div style={{maxWidth: '1000px', margin: '0 auto', display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem'}}>
          <div style={{background: 'var(--card-bg)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)'}}>
           <Cpu size={32} color="#3b82f6" style={{marginBottom:'1rem'}}/>
           <h3 style={{fontSize:'1.3rem', margin:'0 0 0.5rem 0'}}>Cerebro Anti-Alucinaciones</h3>
           <p style={{color:'var(--text-secondary)', margin:0, lineHeight:'1.5'}}>Nuestro algoritmo sincroniza en vivo con Shopify. Nunca inventará un precio o prometerá stock que no tienes.</p>
          </div>
          <div style={{background: 'var(--card-bg)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)'}}>
           <Zap size={32} color="#10b981" style={{marginBottom:'1rem'}}/>
           <h3 style={{fontSize:'1.3rem', margin:'0 0 0.5rem 0'}}>2FA & Seguridad</h3>
           <p style={{color:'var(--text-secondary)', margin:0, lineHeight:'1.5'}}>Protege tus campañas de difusión. Asisto valida por código directo envíos masivos para proteger tu número de Meta.</p>
          </div>
          <div style={{background: 'var(--card-bg)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)'}}>
           <TrendingUp size={32} color="#8b5cf6" style={{marginBottom:'1rem'}}/>
           <h3 style={{fontSize:'1.3rem', margin:'0 0 0.5rem 0'}}>Cálculos Matemáticos</h3>
           <p style={{color:'var(--text-secondary)', margin:0, lineHeight:'1.5'}}>Calcula inteligentemente 20% OFF por transferencia o cuotas al instante. Cierra ventas directo por WhatsApp.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section (Mass Market) */}
      <section id="pricing" style={{padding: '5rem 2rem', textAlign: 'center'}}>
        <h2 style={{fontSize: '2.5rem', marginBottom: '3rem'}}>Precios Simples. Sin Letra Chica.</h2>
        <div style={{background: 'var(--card-bg)', backdropFilter: 'blur(16px)', border: '1px solid var(--accent)', borderRadius: '24px', padding: '3rem', maxWidth: '400px', margin: '0 auto', boxShadow: '0 0 40px rgba(59, 130, 246, 0.15)'}}>
          <h3 style={{fontSize: '1.5rem', margin: '0 0 1rem 0'}}>Plan E-commerce</h3>
          <div style={{fontSize: '3.5rem', fontWeight: '800', marginBottom: '0.5rem'}}>$100<span style={{fontSize:'1.2rem', color:'var(--text-secondary)', fontWeight:'400'}}>/mes</span></div>
          <p style={{color:'var(--text-secondary)', marginBottom: '2rem'}}>Ideal para tiendas que transaccionan fuerte.</p>
          
          <ul style={{textAlign: 'left', listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', color: '#e2e8f0'}}>
            <li style={{display:'flex', gap:'0.75rem', alignItems:'center'}}><CheckCircle size={18} color="#10b981"/> Panel de AutoGestión Completo</li>
            <li style={{display:'flex', gap:'0.75rem', alignItems:'center'}}><CheckCircle size={18} color="#10b981"/> Integración Shopify Automática</li>
            <li style={{display:'flex', gap:'0.75rem', alignItems:'center'}}><CheckCircle size={18} color="#10b981"/> Uso de Inteligencia Artificial ilimitada</li>
            <li style={{display:'flex', gap:'0.75rem', alignItems:'center'}}><CheckCircle size={18} color="#10b981"/> Difusiones Masivas Seguras</li>
          </ul>

          {!success ? (
            <button className="btn-solid-blue" onClick={() => setSuccess(true)} style={{fontSize: '1.1rem', padding: '1rem'}}>Comprar Licencia Múltiple</button>
          ) : (
             <div style={{background: 'rgba(16, 185, 129, 0.1)', padding:'1rem', borderRadius:'12px', border:'1px solid rgba(16, 185, 129, 0.3)', color:'#10b981', fontWeight:'bold'}}>
                ¡Procesando pago! Serás redirigido para fundar tu negocio en segundos.
             </div>
          )}
        </div>
      </section>
      
      <footer style={{padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
        © 2026 Asisto AI. Todos los derechos reservados.
      </footer>
    </div>
  );
}

export default LandingVolume;
