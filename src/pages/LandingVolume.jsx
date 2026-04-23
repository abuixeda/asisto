import { useState } from 'react';
import { ChevronRight, Check, Star, MessageCircle, Clock, Zap, Shield, TrendingUp, Users } from 'lucide-react';
import '../index.css';


const reviews = [
  { name: 'Marcelo R.', business: 'Indumentaria CABA', stars: 5, text: 'Tenía miedo de que fuera un bot genérico, pero Asisto entiende el contexto de cada mensaje. Mis clientes no saben que están hablando con una IA. Triplicamos las consultas respondidas en el primer mes.' },
  { name: 'Valentina G.', business: 'Tienda de suplementos', stars: 5, text: 'Antes perdía ventas porque no podía responder a la noche. Ahora el bot atiende a las 3am igual que a las 3pm. Las ventas de madrugada solas amortizaron el costo del plan.' },
  { name: 'Diego M.', business: 'Electrónica Rosario', stars: 5, text: 'Lo que más me sorprendió es que sabe cuándo hay stock y cuándo no. Nunca le prometió algo a un cliente que no teníamos. Eso solo ya vale el precio.' },
  { name: 'Carolina F.', business: 'Joyería online', stars: 5, text: 'Mis clientes son exigentes y pensé que iban a notar que era un bot. Nada. El tono que configuré es exactamente el de nuestra marca. Resultados increíbles desde el día 1.' },
  { name: 'Tomás B.', business: 'Ferretería mayorista', stars: 5, text: 'Manejo más de 2000 productos y Asisto los conoce todos. Precio, disponibilidad, descripción. Mis vendedores ahora se enfocan en cerrar los pedidos grandes.' },
  { name: 'Lucía P.', business: 'Cosméticos Mar del Plata', stars: 5, text: 'En dos semanas ya recuperé lo que pagué. Los clientes escriben, el bot responde, yo solo confirmo el pedido. No puedo creer que antes no lo tenía.' },
];

const plans = [
  {
    name: 'Starter',
    price: '$49',
    desc: 'Para negocios que empiezan a automatizar',
    features: ['1 número WhatsApp', 'Hasta 500 mensajes/mes', 'Catálogo sincronizado', 'Panel de control', 'Soporte por email'],
    cta: 'Empezar gratis',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$89',
    desc: 'El más elegido por negocios en crecimiento',
    features: ['1 número WhatsApp', 'Hasta 2.000 mensajes/mes', 'Catálogo sincronizado', 'Panel de control', 'Soporte prioritario', 'Horario anti-nocturno', 'Base de conocimientos avanzada'],
    cta: 'Empezar gratis',
    highlight: true,
  },
  {
    name: 'Business',
    price: '$149',
    desc: 'Para negocios con alto volumen de consultas',
    features: ['1 número WhatsApp', 'Mensajes ilimitados', 'Catálogo sincronizado', 'Panel de control', 'Soporte directo WhatsApp', 'Horario anti-nocturno', 'Base de conocimientos avanzada', '+Instagram próximamente'],
    cta: 'Empezar gratis',
    highlight: false,
  },
];

export default function LandingVolume() {
  const [menuOpen, setMenuOpen] = useState(false);

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'inherit' }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '0 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '800', fontSize: '1.25rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 900, color: 'white' }}>A</div>
            Asisto AI
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <button onClick={() => scrollTo('features')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem' }}>Funciones</button>
            <button onClick={() => scrollTo('pricing')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem' }}>Precios</button>
            <a href="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.95rem' }}>Ingresar</a>
            <button onClick={() => scrollTo('cta')} className="btn-solid-blue" style={{ margin: 0, padding: '0.5rem 1.25rem', width: 'auto', fontSize: '0.9rem', borderRadius: '8px' }}>
              Empezar gratis
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '7rem 2rem 5rem', textAlign: 'center', background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.15) 0%, transparent 70%)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '99px', padding: '0.35rem 1rem', fontSize: '0.85rem', color: '#93c5fd', marginBottom: '2rem' }}>
            <Zap size={14} /> Nuevo · Asisto AI 2.0 ya disponible
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: '900', lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '1.5rem' }}>
            Tu negocio responde solo.<br />
            <span style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>24 horas. Sin errores. Sin sueldo.</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Asisto AI es un empleado virtual que atiende por WhatsApp, conoce tu catálogo al detalle y responde como un humano — sin que vos estés presente.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('cta')} className="btn-solid-blue" style={{ margin: 0, padding: '0.9rem 2rem', width: 'auto', fontSize: '1.05rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Empezar gratis <ChevronRight size={18} />
            </button>
            <button onClick={() => scrollTo('reviews')} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.9rem 2rem', borderRadius: '10px', cursor: 'pointer', fontSize: '1.05rem' }}>
              Ver resultados reales
            </button>
          </div>
          <p style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sin tarjeta de crédito · Configuración en 5 minutos</p>
        </div>

        {/* Stats */}
        <div style={{ maxWidth: '700px', margin: '5rem auto 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {[
            { n: '+2.400', label: 'Consultas respondidas' },
            { n: '< 3 seg', label: 'Tiempo de respuesta' },
            { n: '98%', label: 'Satisfacción de clientes' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--card-bg)', padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{s.n}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '6rem 2rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '1rem' }}>No es un bot. Es un empleado que nunca falta.</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '550px', margin: '0 auto' }}>La diferencia entre perder una venta y cerrarla está en los primeros 3 minutos de respuesta.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: <MessageCircle size={24} color="#3b82f6" />, title: 'Responde como humano', desc: 'No hay menús, no hay botones, no hay respuestas predefinidas. Entiende el contexto, recuerda lo que se habló y responde de forma natural en cada conversación.' },
              { icon: <Clock size={24} color="#10b981" />, title: 'Disponible las 24 horas', desc: 'Tu competidor tarda 2 horas en responder. Asisto lo hace en 3 segundos, a las 3am del domingo. Cada mensaje sin respuesta es una venta que se va.' },
              { icon: <Zap size={24} color="#f59e0b" />, title: 'Conoce tu catálogo en vivo', desc: 'Se conecta con tu tienda y sabe en tiempo real qué hay en stock, a qué precio y con qué características. Nunca va a inventar un precio ni prometer algo que no tenés.' },
              { icon: <Shield size={24} color="#8b5cf6" />, title: 'Aprende las reglas de tu negocio', desc: 'Le explicás cómo funciona tu local, cuáles son tus condiciones de venta, tus políticas. Él las aplica en cada conversación sin que vos estés presente.' },
              { icon: <TrendingUp size={24} color="#ef4444" />, title: 'Convierte consultas en ventas', desc: 'No solo informa — guía al cliente hacia la compra. Sugiere productos, calcula precios con descuento y cierra el trato cuando el cliente está listo.' },
              { icon: <Users size={24} color="#06b6d4" />, title: 'Control total desde tu panel', desc: 'Modificá el comportamiento del bot, actualizá el catálogo y revisá métricas desde un panel simple. Vos decidís cómo responde cada vez.' },
            ].map((f, i) => (
              <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.75rem', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(59,130,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontSize: '0.95rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '6rem 2rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '1rem' }}>En 5 minutos tu bot está activo</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '3.5rem' }}>Sin instalar nada, sin programar nada, sin conocimientos técnicos.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
            {[
              { n: '1', title: 'Creás tu cuenta', desc: 'Registrate con tu email en menos de 60 segundos.' },
              { n: '2', title: 'Configurás la personalidad', desc: 'Le decís cómo tiene que hablar: tono, nombre, idioma, qué puede y qué no puede decir.' },
              { n: '3', title: 'Conectás tu catálogo', desc: 'Pegás el link de tu tienda Shopify o Google Sheets y el bot lo aprende automáticamente.' },
              { n: '4', title: 'Escaneás el QR de WhatsApp', desc: 'Vinculás tu número y listo. El bot empieza a responder en segundos.' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', flexShrink: 0 }}>{s.n}</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.25rem' }}>{s.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" style={{ padding: '6rem 2rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '1rem' }}>Lo que dicen los que ya lo usan</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Negocios reales, resultados reales.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {reviews.map((r, i) => (
              <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {Array.from({ length: r.stars }).map((_, j) => <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0, fontSize: '0.95rem', fontStyle: 'italic' }}>"{r.text}"</p>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{r.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{r.business}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '6rem 2rem', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '1rem' }}>Precios claros. Sin sorpresas.</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Todos los planes incluyen 7 días de prueba gratis.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
            {plans.map((p, i) => (
              <div key={i} style={{ background: 'var(--card-bg)', border: `1px solid ${p.highlight ? '#3b82f6' : 'var(--border)'}`, borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', boxShadow: p.highlight ? '0 0 40px rgba(59,130,246,0.15)' : 'none' }}>
                {p.highlight && (
                  <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', borderRadius: '99px', padding: '0.25rem 1rem', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap' }}>MÁS POPULAR</div>
                )}
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{p.name}</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px' }}>{p.price}<span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text-secondary)' }}>/mes</span></div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{p.desc}</div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.92rem' }}>
                      <Check size={15} color="#10b981" style={{ flexShrink: 0 }} /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => scrollTo('cta')} className={p.highlight ? 'btn-solid-blue' : ''} style={{ margin: 0, padding: '0.85rem', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', ...(p.highlight ? {} : { background: 'none', border: '1px solid var(--border)', color: 'var(--text-primary)' }) }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            ¿Manejás múltiples negocios o necesitás algo personalizado? <a href="mailto:hola@asisto.ai" style={{ color: '#3b82f6', textDecoration: 'none' }}>Escribinos para el plan Agency →</a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" style={{ padding: '7rem 2rem', textAlign: 'center', background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(59,130,246,0.12) 0%, transparent 70%)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: '900', letterSpacing: '-1px', marginBottom: '1rem' }}>Tu próxima venta está esperando respuesta.</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>Empezá hoy. En 5 minutos tu bot está activo y respondiendo.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '420px', margin: '0 auto' }}>
            <a href="/registro" className="btn-solid-blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', fontSize: '1.1rem', borderRadius: '12px', textDecoration: 'none', margin: 0 }}>
              Crear mi cuenta gratis <ChevronRight size={20} />
            </a>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>Sin tarjeta de crédito · 7 días gratis · Cancelás cuando quieras</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '2.5rem 2rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '800' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900, color: 'white' }}>A</div>
            Asisto AI
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <a href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Ingresar</a>
            <a href="/registro" style={{ color: 'inherit', textDecoration: 'none' }}>Registrarse</a>
            <a href="mailto:hola@asisto.ai" style={{ color: 'inherit', textDecoration: 'none' }}>Contacto</a>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>© 2026 Asisto AI. Todos los derechos reservados.</div>
        </div>
      </footer>

    </div>
  );
}
