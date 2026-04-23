import { ChevronRight, Check, Star, MessageCircle, Clock, Zap, Shield, TrendingUp, Users } from 'lucide-react';

const reviews = [
  { name: 'Marcelo R.', business: 'Ropa · CABA', stars: 5, text: 'Pensé que iba a ser complicado pero me lo dejaron funcionando en el día. Mis clientes preguntan por talle, color, precio y el bot responde todo. Yo solo entro a confirmar los pedidos.' },
  { name: 'Valentina G.', business: 'Suplementos · Córdoba', stars: 5, text: 'Antes perdía ventas a la noche porque no podía responder. Ahora el bot atiende solo a las 3am igual que a las 3pm. En el primer mes amortizó todo el costo del servicio.' },
  { name: 'Diego M.', business: 'Electrónica · Rosario', stars: 5, text: 'Lo que más me sorprendió es que sabe cuándo hay stock y cuándo no. Nunca le prometió algo a un cliente que no teníamos. Eso solo ya vale lo que cuesta.' },
  { name: 'Carolina F.', business: 'Joyería online', stars: 5, text: 'Mis clientes son exigentes y pensé que iban a notar que era un bot. Nada. El tono es exactamente el de nuestra marca. Resultados desde el primer día.' },
  { name: 'Tomás B.', business: 'Ferretería mayorista', stars: 5, text: 'Manejo más de 2000 productos y el bot los conoce todos. Precio, disponibilidad, descripción. Mis vendedores ahora se enfocan en cerrar los pedidos grandes.' },
  { name: 'Lucía P.', business: 'Cosméticos · Mar del Plata', stars: 5, text: 'En dos semanas ya recuperé lo que pagué. Los clientes escriben, el bot responde, yo solo confirmo el pedido. No puedo creer que antes no lo tenía.' },
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
            Asisto AI
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <button onClick={() => scrollTo('features')} style={{ background: 'none', border: 'none', color: C.textSec, cursor: 'pointer', fontSize: '0.95rem' }}>Cómo funciona</button>
            <button onClick={() => scrollTo('reviews')} style={{ background: 'none', border: 'none', color: C.textSec, cursor: 'pointer', fontSize: '0.95rem' }}>Resultados</button>
            <a href="/login" style={{ color: C.textSec, textDecoration: 'none', fontSize: '0.95rem' }}>Ingresar</a>
            <button onClick={() => scrollTo('cta')} style={{ background: C.gradient, border: 'none', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700' }}>
              Quiero mi bot
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '7rem 2rem 5rem', textAlign: 'center', background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.07) 0%, transparent 70%)` }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: C.blueLight, border: `1px solid ${C.blueBorder}`, borderRadius: '99px', padding: '0.35rem 1rem', fontSize: '0.85rem', color: C.blue, marginBottom: '2rem' }}>
            <Zap size={14} /> Servicio completo · Nosotros lo configuramos todo
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: '900', lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '1.5rem', color: C.text }}>
            Tu negocio atiende solo.<br />
            <span style={{ background: C.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Vos solo entrás a cobrar.</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: C.textSec, lineHeight: 1.7, maxWidth: '620px', margin: '0 auto 2.5rem' }}>
            Te instalamos un asistente de WhatsApp con IA que conoce tu negocio al detalle — precios, stock, políticas, horarios. Nosotros lo configuramos, lo entrenamos y lo dejamos funcionando. Vos no tocás nada.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('cta')} style={{ background: C.gradient, border: 'none', color: 'white', padding: '0.9rem 2rem', borderRadius: '10px', cursor: 'pointer', fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Quiero mi bot <ChevronRight size={18} />
            </button>
            <button onClick={() => scrollTo('features')} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.text, padding: '0.9rem 2rem', borderRadius: '10px', cursor: 'pointer', fontSize: '1.05rem' }}>
              Ver cómo funciona
            </button>
          </div>
          <p style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: C.textSec }}>Sin contratos. Sin conocimientos técnicos. Configuración incluida.</p>
        </div>

        {/* Stats */}
        <div style={{ maxWidth: '700px', margin: '5rem auto 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: C.border, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
          {[
            { n: '+2.400', label: 'Consultas respondidas' },
            { n: '< 3 seg', label: 'Tiempo de respuesta' },
            { n: '98%', label: 'Satisfacción de clientes' },
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
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '1rem', color: C.text }}>No es un bot. Es un empleado que nunca falta.</h2>
            <p style={{ color: C.textSec, fontSize: '1.1rem', maxWidth: '550px', margin: '0 auto' }}>La diferencia entre perder una venta y cerrarla está en los primeros 3 minutos de respuesta.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: <MessageCircle size={24} color={C.blue} />, title: 'Responde como humano', desc: 'No hay menús ni botones. Entiende el contexto, recuerda lo que se habló y responde de forma natural. Tus clientes no van a notar la diferencia.' },
              { icon: <Clock size={24} color="#10b981" />, title: 'Disponible las 24 horas', desc: 'Tu competidor tarda 2 horas en responder. Tu bot lo hace en 3 segundos, a las 3am del domingo. Cada mensaje sin respuesta es una venta que se va.' },
              { icon: <Zap size={24} color="#f59e0b" />, title: 'Conoce tu catálogo al detalle', desc: 'Le cargamos tus productos, precios y stock. Nunca va a inventar un precio ni prometer algo que no tenés. Se actualiza solo cuando cambiás la tienda.' },
              { icon: <Shield size={24} color="#8b5cf6" />, title: 'Aprende las reglas de tu negocio', desc: 'Le enseñamos cómo funciona tu local, tus condiciones de venta, tus políticas de envío y devolución. Las aplica en cada conversación.' },
              { icon: <TrendingUp size={24} color="#ef4444" />, title: 'Convierte consultas en ventas', desc: 'No solo informa — guía al cliente hacia la compra. Sugiere productos, calcula precios y cierra el trato cuando el cliente está listo.' },
              { icon: <Users size={24} color="#06b6d4" />, title: 'Nosotros nos encargamos de todo', desc: 'Vos nos contás cómo es tu negocio. Nosotros entrenamos el bot, lo configuramos y te lo entregamos funcionando. Sin que tengas que aprender nada.' },
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
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '1rem', color: C.text }}>Tu bot activo en 24 horas. Vos no hacés nada.</h2>
          <p style={{ color: C.textSec, fontSize: '1.05rem', marginBottom: '3.5rem' }}>Nos contás cómo es tu negocio. Nosotros hacemos el resto.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
            {[
              { n: '1', title: 'Nos contactás', desc: 'Escribinos por WhatsApp o email. Te hacemos unas preguntas simples sobre tu negocio, tus productos y cómo querés que responda el bot.' },
              { n: '2', title: 'Nosotros configuramos todo', desc: 'Entrenamos el bot con tu catálogo, tus precios, tus políticas y la personalidad de tu marca. Vos no tocás nada técnico.' },
              { n: '3', title: 'Escaneás un QR desde tu celular', desc: 'Vinculás tu WhatsApp con un simple escaneo. No necesitás instalar nada ni cambiar tu número.' },
              { n: '4', title: 'El bot empieza a responder', desc: 'Desde ese momento tu negocio atiende solo, las 24 horas. Vos revisás los chats cuando querés, sin presión.' },
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
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '1rem', color: C.text }}>Lo que dicen los negocios que ya lo usan</h2>
            <p style={{ color: C.textSec, fontSize: '1.05rem' }}>Comercios reales. Resultados reales.</p>
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
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: '900', letterSpacing: '-1px', marginBottom: '1rem', color: C.text }}>Tu próxima venta está esperando respuesta.</h2>
          <p style={{ color: C.textSec, fontSize: '1.1rem', marginBottom: '2.5rem' }}>Escribinos hoy y en 24 horas tu bot está respondiendo por vos.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '420px', margin: '0 auto' }}>
            <a href="https://wa.me/5491100000000?text=Hola%2C%20quiero%20instalar%20Asisto%20en%20mi%20negocio" target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', fontSize: '1.1rem', borderRadius: '12px', textDecoration: 'none', background: C.gradient, color: 'white', fontWeight: '700' }}>
              Escribinos por WhatsApp <ChevronRight size={20} />
            </a>
            <a href="mailto:hola@asisto.ai"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', fontSize: '1rem', borderRadius: '12px', textDecoration: 'none', background: 'none', border: `1px solid ${C.border}`, color: C.textSec, fontWeight: '600' }}>
              O escribinos a hola@asisto.ai
            </a>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {['Configuración incluida', 'Sin contratos', 'Soporte directo'].map((t, i) => (
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
            Asisto AI
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
