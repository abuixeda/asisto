import { ChevronRight, Check, Star, MessageCircle, Clock, Zap, Shield, TrendingUp, Users } from 'lucide-react';

const reviews = [
  { name: 'Marcelo R.', business: 'Agencia · 8 clientes', stars: 5, text: 'Antes manejaba los bots de mis clientes desde 8 paneles distintos. Ahora todo está en uno y puedo ajustar cualquier cosa en segundos. Me ahorro 3 horas por semana fácil.' },
  { name: 'Valentina G.', business: 'Consultora digital · 12 clientes', stars: 5, text: 'Mis clientes me preguntan cómo el bot sabe tanto de su negocio. Les digo que es IA avanzada. La verdad es que tardé 10 minutos en configurarlo. Mis márgenes mejoraron un 40%.' },
  { name: 'Diego M.', business: 'Marketing local · 6 locales', stars: 5, text: 'Ofrezco el bot como servicio adicional y ya lo tengo en 6 locales. El costo por cliente es mínimo y el valor percibido es enorme. Es lo que más me diferencia de la competencia.' },
  { name: 'Carolina F.', business: 'Agencia · 15 clientes', stars: 5, text: 'Escala sin contratar. Agregué 5 clientes nuevos el mes pasado y no tuve que sumar ningún recurso al equipo. El sistema se administra solo una vez que está configurado.' },
  { name: 'Tomás B.', business: 'SaaS local · 20 negocios', stars: 5, text: 'Lo que más valoro es que cada bot tiene su propia personalidad y base de conocimiento. Los clientes sienten que es un producto hecho a medida para ellos.' },
  { name: 'Lucía P.', business: 'Freelance · 4 clientes', stars: 5, text: 'Empecé ofreciéndolo como un extra. Ahora es mi servicio principal. Tengo clientes que llevan 8 meses y ninguno ha cancelado. La retención habla por sí sola.' },
];

const C = {
  bg: '#ffffff',
  bgAlt: '#f8fafc',
  bgAlt2: '#f1f5f9',
  border: '#e2e8f0',
  text: '#0f172a',
  textSec: '#64748b',
  blue: '#2563eb',
  blueLight: 'rgba(37,99,235,0.08)',
  blueBorder: 'rgba(37,99,235,0.25)',
  gradient: 'linear-gradient(135deg,#2563eb,#7c3aed)',
};

export default function LandingAgency() {
  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'inherit' }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}`, padding: '0 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '800', fontSize: '1.25rem', color: C.text }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: C.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 900, color: 'white' }}>A</div>
            Asisto Agency
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <button onClick={() => scrollTo('features')} style={{ background: 'none', border: 'none', color: C.textSec, cursor: 'pointer', fontSize: '0.95rem' }}>Funciones</button>
            <button onClick={() => scrollTo('reviews')} style={{ background: 'none', border: 'none', color: C.textSec, cursor: 'pointer', fontSize: '0.95rem' }}>Resultados</button>
            <a href="/login" style={{ color: C.textSec, textDecoration: 'none', fontSize: '0.95rem' }}>Ingresar</a>
            <button onClick={() => scrollTo('cta')} style={{ background: C.gradient, border: 'none', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700' }}>
              Hablar con ventas
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '7rem 2rem 5rem', textAlign: 'center', background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.07) 0%, transparent 70%)` }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: C.blueLight, border: `1px solid ${C.blueBorder}`, borderRadius: '99px', padding: '0.35rem 1rem', fontSize: '0.85rem', color: C.blue, marginBottom: '2rem' }}>
            <Zap size={14} /> Para agencias y consultoras digitales
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: '900', lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '1.5rem', color: C.text }}>
            Un bot de IA por cliente.<br />
            <span style={{ background: C.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Todo desde un solo panel.</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: C.textSec, lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '620px', margin: '0 auto 2.5rem' }}>
            Asisto Agency te permite gestionar los asistentes de WhatsApp de todos tus clientes desde un lugar. Cada bot tiene su propia personalidad, catálogo y base de conocimientos.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('cta')} style={{ background: C.gradient, border: 'none', color: 'white', padding: '0.9rem 2rem', borderRadius: '10px', cursor: 'pointer', fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Hablar con ventas <ChevronRight size={18} />
            </button>
            <button onClick={() => scrollTo('features')} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.text, padding: '0.9rem 2rem', borderRadius: '10px', cursor: 'pointer', fontSize: '1.05rem' }}>
              Ver cómo funciona
            </button>
          </div>
          <p style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: C.textSec }}>Precios a medida según tu cartera de clientes</p>
        </div>

        {/* Stats */}
        <div style={{ maxWidth: '700px', margin: '5rem auto 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: C.border, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
          {[
            { n: '+50', label: 'Agencias usando Asisto' },
            { n: '< 10 min', label: 'Para configurar un cliente nuevo' },
            { n: '0%', label: 'Churn promedio en el primer año' },
          ].map((s, i) => (
            <div key={i} style={{ background: C.bg, padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: C.text }}>{s.n}</div>
              <div style={{ fontSize: '0.85rem', color: C.textSec, marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '6rem 2rem', borderTop: `1px solid ${C.border}`, background: C.bgAlt }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '1rem', color: C.text }}>Construido para escalar. No para una sola tienda.</h2>
            <p style={{ color: C.textSec, fontSize: '1.1rem', maxWidth: '550px', margin: '0 auto' }}>Cada función fue pensada para que puedas agregar clientes sin agregar fricción operativa.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: <Users size={24} color={C.blue} />, title: 'Multi-cliente desde un panel', desc: 'Cada cliente tiene su propio espacio aislado. Cambiás de uno a otro en segundos. Sin mezclar datos, sin confusiones.' },
              { icon: <MessageCircle size={24} color="#10b981" />, title: 'Bots con personalidad propia', desc: 'El bot de la ferretería no habla igual que el de la joyería. Configurás el tono, el nombre y las reglas de cada cliente de forma independiente.' },
              { icon: <Zap size={24} color="#f59e0b" />, title: 'Catálogo sincronizado por cliente', desc: 'Cada bot aprende el catálogo de su tienda automáticamente. Precio, stock, descripciones. Actualizaciones en tiempo real.' },
              { icon: <Shield size={24} color="#8b5cf6" />, title: 'Acceso controlado por cliente', desc: 'Podés darle acceso limitado a cada cliente para que vea sus métricas o ajuste su prompt. Vos mantenés el control total.' },
              { icon: <TrendingUp size={24} color="#ef4444" />, title: 'Margen claro por cliente', desc: 'El costo de Asisto Agency es fijo. Lo que cobrés a cada cliente es tuyo. Más clientes = más margen sin costos variables.' },
              { icon: <Clock size={24} color="#06b6d4" />, title: 'Soporte y onboarding prioritario', desc: 'Tenés acceso a soporte directo por WhatsApp. Cuando incorporás un cliente nuevo, te ayudamos a configurarlo rápido.' },
            ].map((f, i) => (
              <div key={i}
                style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.75rem', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 4px 24px rgba(37,99,235,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: C.text }}>{f.title}</h3>
                <p style={{ color: C.textSec, lineHeight: 1.6, margin: 0, fontSize: '0.95rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '6rem 2rem', background: C.bgAlt2, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '1rem', color: C.text }}>Un cliente nuevo en menos de 10 minutos</h2>
          <p style={{ color: C.textSec, fontSize: '1.05rem', marginBottom: '3.5rem' }}>El proceso es tan rápido que tus clientes no pueden creer que ya está funcionando.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
            {[
              { n: '1', title: 'Abrís el panel Agency', desc: 'Creás un nuevo perfil de cliente con su nombre y datos básicos del negocio.' },
              { n: '2', title: 'Configurás su bot', desc: 'Definís cómo habla, qué puede decir y cuáles son sus políticas. Podés copiar la config de otro cliente como punto de partida.' },
              { n: '3', title: 'Conectás el catálogo', desc: 'Pegás el link de la tienda Shopify del cliente y el bot aprende los productos automáticamente.' },
              { n: '4', title: 'El cliente escanea el QR', desc: 'Le mandás el QR por WhatsApp, lo escanea desde su celular y listo. El bot ya está respondiendo.' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: C.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', flexShrink: 0, color: 'white' }}>{s.n}</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.25rem', color: C.text }}>{s.title}</div>
                  <div style={{ color: C.textSec, fontSize: '0.95rem' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" style={{ padding: '6rem 2rem', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '1rem', color: C.text }}>Lo que dicen las agencias que ya lo usan</h2>
            <p style={{ color: C.textSec, fontSize: '1.05rem' }}>Resultados reales de agencias reales.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {reviews.map((r, i) => (
              <div key={i} style={{ background: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {Array.from({ length: r.stars }).map((_, j) => <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ color: C.textSec, lineHeight: 1.65, margin: 0, fontSize: '0.95rem', fontStyle: 'italic' }}>"{r.text}"</p>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: C.text }}>{r.name}</div>
                  <div style={{ fontSize: '0.82rem', color: C.textSec }}>{r.business}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" style={{ padding: '7rem 2rem', textAlign: 'center', background: C.bgAlt }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: '900', letterSpacing: '-1px', marginBottom: '1rem', color: C.text }}>Escalá tu agencia sin escalar tu equipo.</h2>
          <p style={{ color: C.textSec, fontSize: '1.1rem', marginBottom: '2.5rem' }}>Hablá con nosotros y armamos un plan a medida según tu cartera de clientes.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '420px', margin: '0 auto' }}>
            <a href="https://wa.me/5491100000000?text=Hola%2C%20quiero%20info%20sobre%20Asisto%20Agency" target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', fontSize: '1.1rem', borderRadius: '12px', textDecoration: 'none', background: C.gradient, color: 'white', fontWeight: '700' }}>
              Hablar con ventas por WhatsApp <ChevronRight size={20} />
            </a>
            <a href="mailto:hola@asisto.ai"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', fontSize: '1rem', borderRadius: '12px', textDecoration: 'none', background: 'none', border: `1px solid ${C.border}`, color: C.textSec, fontWeight: '600' }}>
              O escribinos a hola@asisto.ai
            </a>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {['Precio por cartera', 'Onboarding incluido', 'Soporte directo'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: C.textSec }}>
                  <Check size={14} color="#10b981" /> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '2.5rem 2rem', borderTop: `1px solid ${C.border}`, background: C.bg }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '800', color: C.text }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: C.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900, color: 'white' }}>A</div>
            Asisto Agency
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: C.textSec }}>
            <a href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Ingresar</a>
            <a href="mailto:hola@asisto.ai" style={{ color: 'inherit', textDecoration: 'none' }}>Contacto</a>
          </div>
          <div style={{ fontSize: '0.85rem', color: C.textSec }}>© 2026 Asisto AI. Todos los derechos reservados.</div>
        </div>
      </footer>

    </div>
  );
}
