import React from 'react';
import { ShieldCheck, Clock, UserCheck, MessageSquare, ChevronRight } from 'lucide-react';
import '../index.css';

function LandingAgency() {
  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      {/* Header NavBar */}
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding: '1.5rem 2rem', position: 'absolute', top:0, width:'100%', boxSizing:'border-box', zIndex: 100}}>
        <div style={{display:'flex', alignItems:'center', gap:'0.75rem', fontWeight:'800', fontSize:'1.4rem'}}>
          <div className="brand-logo" style={{width:'32px', height:'32px', fontSize:'1rem', margin:0, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)'}}>TJ</div>
          Savage Elite
        </div>
        <div style={{display:'flex', gap:'1rem'}}>
          <a href="/admin" style={{color: 'var(--text-secondary)', textDecoration: 'none', fontWeight:'500', padding:'0.5rem 1rem'}}>Acceso Clientes</a>
        </div>
      </header>

      {/* Hero VIP */}
      <section style={{padding: '8rem 2rem 5rem 2rem', textAlign: 'center', background: 'radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, var(--bg-color) 70%)'}}>
        <div className="badge" style={{marginBottom: '1rem', background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', border: '1px solid rgba(139, 92, 246, 0.4)'}}>Solo con Invitación Privada</div>
        <h1 style={{fontSize: '3.8rem', fontWeight: '800', marginBottom: '1.5rem', letterSpacing: '-1.5px', maxWidth: '900px', margin: '0 auto', color: '#ffffff'}}>
          Automatizamos tu Atención al Cliente. <br/><span style={{background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Tú solo dedícate a cobrar.</span>
        </h1>
        <p style={{fontSize: '1.3rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 3rem auto', lineHeight: '1.6'}}>
          Un servicio "Llave en Mano" para comercios físicos y de servicios. Nosotros entrenamos a la Inteligencia Artificial con tus precios, horarios y reglas. La instalamos, la monitoreamos y te liberamos de WhatsApp.
        </p>
        <button onClick={() => window.open('https://wa.me/5491100000000?text=Hola,%20vengo%20de%20la%20invitaci%C3%B3n%20VIP%20Savage%20Elite', '_blank')} className="btn-solid-blue" style={{background: 'linear-gradient(135deg, #3b82f6, #6366f1)', fontSize: '1.2rem', padding: '1.2rem 3rem', width: 'auto', borderRadius: '99px', margin: '0 auto', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)', color: '#ffffff'}}>
          Agendar Entrevista de Análisis <ChevronRight size={20} />
        </button>
      </section>

      {/* Benefits Hand-made */}
      <section style={{padding: '5rem 2rem', maxWidth: '1000px', margin: '0 auto'}}>
        <h2 style={{fontSize: '2.5rem', textAlign: 'center', marginBottom: '4rem'}}>¿Por qué los mejores locales nos eligen?</h2>
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '3rem'}}>
          <div style={{display: 'flex', gap: '2rem', alignItems: 'flex-start', background: 'var(--card-bg)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)'}}>
            <div style={{background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px'}}>
              <UserCheck size={32} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{fontSize: '1.5rem', marginTop: 0, marginBottom: '0.5rem'}}>Cero Configuración para Ti</h3>
              <p style={{color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.5'}}>No te entregamos un software vacío para que aprendas a usarlo. Nosotros nos sentamos contigo, mapeamos tus servicios, inyectamos tus reglas de negocio y dejamos el clon digital funcionando perfectamente.</p>
            </div>
          </div>

          <div style={{display: 'flex', gap: '2rem', alignItems: 'flex-start', background: 'var(--card-bg)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)'}}>
            <div style={{background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px'}}>
              <Clock size={32} color="#10b981" />
            </div>
            <div>
              <h3 style={{fontSize: '1.5rem', marginTop: 0, marginBottom: '0.5rem'}}>Control Total de Horarios</h3>
              <p style={{color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.5'}}>Tú decides cuándo opera. Si quieres que atienda 24/7 o que trabaje solo de Lunes a Viernes de 09 a 18 hs. Fuera de esos horarios, puede dejar avisos de cierre automático a tus clientes e incluso guardar las conversaciones en cola para atraparlos temprano a la mañana.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing VIP */}
      <section style={{padding: '5rem 2rem', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center'}}>
        <h2 style={{fontSize: '2.5rem', marginBottom: '1.5rem'}}>Contratación Directa</h2>
        <p style={{color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.1rem'}}>Cupos estrictamente limitados en la zona para asegurar calidad de servicio.</p>
        
        <div style={{background: 'linear-gradient(180deg, var(--card-bg), rgba(0,0,0,0))', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '24px', padding: '4rem 2rem', maxWidth: '500px', margin: '0 auto', boxShadow: '0 0 40px rgba(139, 92, 246, 0.1)'}}>
          <h3 style={{fontSize: '1.8rem', margin: '0 0 1.5rem 0', color: '#ffffff'}}>Plan Llave en Mano</h3>
          <div style={{fontSize: '4rem', fontWeight: '800', marginBottom: '0.5rem', lineHeight: '1', color: '#ffffff'}}>$350<span style={{fontSize:'1.5rem', color:'var(--text-secondary)', fontWeight:'400'}}>usd</span></div>
          <p style={{color:'var(--text-secondary)', marginBottom: '2rem'}}>Único Pago por Configuración Exhaustiva.</p>
          
          <div style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
            + $70 usd / mensual <br/><span style={{fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal'}}>Mantenimiento de IA y Servidor Host Dedicado</span>
          </div>
          
          <button onClick={() => window.open('https://wa.me/5491100000000?text=Hola,%20quiero%20reservar%20mi%20cupo%20de%20350%20USD', '_blank')} className="btn-solid-blue" style={{background: '#6366f1', fontSize: '1.1rem', padding: '1.2rem', margin: '0 auto'}}>Reservar Reunión de Cupo</button>
        </div>
      </section>

      <footer style={{padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
        © 2026 TrendJacker Agency. Un servicio personalizado.
      </footer>
    </div>
  );
}

export default LandingAgency;
