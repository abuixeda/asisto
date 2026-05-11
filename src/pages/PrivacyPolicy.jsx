import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const C = {
  bg: '#0d0f18',
  surface: '#161a2e',
  border: 'rgba(255,255,255,0.07)',
  text: '#f1f5f9',
  textSec: '#94a3b8',
  textMuted: '#475569',
  accent: '#7c3aed',
  grad: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
};

export default function PrivacyPolicy() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(13,15,24,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, padding: '0 2rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <span style={{ fontSize: '1.2rem' }}>🤖</span>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: C.text }}>Atento AI</span>
          </Link>
          <Link to="/" style={{ fontSize: '0.875rem', color: C.textSec, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            ← Volver al inicio
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: '0.75rem' }}>Legal</p>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem' }}>Política de Privacidad</h1>
          <p style={{ color: C.textSec, fontSize: '0.95rem' }}>Última actualización: 2 de mayo de 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <Section title="1. Quiénes somos">
            <p>Atento AI (&quot;Atento&quot;, &quot;nosotros&quot;, &quot;nuestro&quot;) es un servicio de automatización de atención al cliente mediante inteligencia artificial para WhatsApp e Instagram, operado desde Argentina.</p>
            <p>Esta Política de Privacidad describe cómo recopilamos, usamos y protegemos la información de nuestros usuarios y visitantes.</p>
            <p>Contacto: <a href="mailto:hola@atento.ai" style={{ color: C.accent }}>hola@atento.ai</a></p>
          </Section>

          <Section title="2. Información que recopilamos">
            <p><strong style={{ color: C.text }}>Datos que vos nos proporcionás:</strong></p>
            <ul>
              <li>Nombre del negocio, correo electrónico y contraseña al registrarte</li>
              <li>Número de WhatsApp que vinculás al servicio</li>
              <li>Información de tu catálogo, precios y políticas de venta que cargás en el panel</li>
              <li>Mensajes de configuración e instrucciones que le das al bot</li>
            </ul>
            <p><strong style={{ color: C.text }}>Datos generados por el uso del servicio:</strong></p>
            <ul>
              <li>Conversaciones que el bot gestiona en tu nombre (mensajes de tus clientes y respuestas del bot)</li>
              <li>Métricas de uso: cantidad de mensajes, tiempo de respuesta, tasa de resolución</li>
              <li>Logs de actividad del sistema para diagnóstico técnico</li>
            </ul>
            <p><strong style={{ color: C.text }}>Datos técnicos:</strong></p>
            <ul>
              <li>Dirección IP, tipo de navegador y sistema operativo al acceder al panel</li>
              <li>Cookies de sesión para mantener tu sesión iniciada</li>
            </ul>
          </Section>

          <Section title="3. Cómo usamos tu información">
            <ul>
              <li>Para proveer y operar el servicio de atención automática</li>
              <li>Para entrenar y mejorar las respuestas del bot en tu negocio específico</li>
              <li>Para enviarte notificaciones del servicio (alertas de uso, actualizaciones, soporte)</li>
              <li>Para generar estadísticas de uso y mostrártelas en tu panel</li>
              <li>Para cumplir obligaciones legales o responder requerimientos de autoridades competentes</li>
            </ul>
            <p>No usamos tu información para publicidad de terceros ni la vendemos bajo ninguna circunstancia.</p>
          </Section>

          <Section title="4. Compartición de datos con terceros">
            <p>Para operar el servicio, compartimos datos con los siguientes proveedores:</p>
            <ul>
              <li><strong style={{ color: C.text }}>Meta / WhatsApp Business API:</strong> para enviar y recibir mensajes. Sujeto a los Términos de WhatsApp Business.</li>
              <li><strong style={{ color: C.text }}>Proveedores de IA (OpenAI y similares):</strong> para procesar el lenguaje natural de las conversaciones. Los mensajes se transmiten de forma encriptada.</li>
              <li><strong style={{ color: C.text }}>Servicios de infraestructura en la nube:</strong> hosting, base de datos y almacenamiento, con acuerdos de confidencialidad vigentes.</li>
            </ul>
            <p>Todos los proveedores están contractualmente obligados a proteger tu información y usarla únicamente para prestar el servicio.</p>
          </Section>

          <Section title="5. Retención de datos">
            <p>Conservamos tus datos mientras tu cuenta esté activa. Si cancelás el servicio:</p>
            <ul>
              <li>Tus datos de configuración y conversaciones se eliminan dentro de los 30 días posteriores a la baja</li>
              <li>Los datos de facturación se conservan durante 5 años por obligación contable</li>
              <li>Podés solicitar la eliminación anticipada escribiéndonos a <a href="mailto:hola@atento.ai" style={{ color: C.accent }}>hola@atento.ai</a></li>
            </ul>
          </Section>

          <Section title="6. Tus derechos">
            <p>Tenés derecho a:</p>
            <ul>
              <li><strong style={{ color: C.text }}>Acceder</strong> a los datos personales que tenemos sobre vos</li>
              <li><strong style={{ color: C.text }}>Rectificar</strong> información incorrecta o incompleta</li>
              <li><strong style={{ color: C.text }}>Eliminar</strong> tu cuenta y todos los datos asociados</li>
              <li><strong style={{ color: C.text }}>Exportar</strong> tus datos en formato legible</li>
              <li><strong style={{ color: C.text }}>Oponerte</strong> al procesamiento de tus datos en ciertos contextos</li>
            </ul>
            <p>Para ejercer cualquiera de estos derechos escribinos a <a href="mailto:hola@atento.ai" style={{ color: C.accent }}>hola@atento.ai</a>. Respondemos en un plazo de 10 días hábiles.</p>
          </Section>

          <Section title="7. Seguridad">
            <p>Aplicamos medidas técnicas y organizativas razonables para proteger tu información:</p>
            <ul>
              <li>Comunicaciones cifradas mediante HTTPS/TLS</li>
              <li>Contraseñas almacenadas con hash irreversible (bcrypt)</li>
              <li>Acceso a datos de producción restringido al personal autorizado</li>
              <li>Monitoreo continuo de accesos anómalos</li>
            </ul>
            <p>Ningún sistema es 100% seguro. En caso de incidente de seguridad que afecte tus datos, te notificaremos en un plazo máximo de 72 horas.</p>
          </Section>

          <Section title="8. Cookies">
            <p>Usamos cookies estrictamente necesarias para:</p>
            <ul>
              <li>Mantener tu sesión iniciada en el panel</li>
              <li>Recordar tu preferencia de idioma</li>
            </ul>
            <p>No usamos cookies de seguimiento publicitario ni de terceros con fines analíticos externos.</p>
          </Section>

          <Section title="9. Cambios a esta política">
            <p>Podemos actualizar esta política periódicamente. Si realizamos cambios significativos, te notificaremos por correo electrónico con al menos 15 días de anticipación. El uso continuado del servicio después de la notificación implica aceptación de la nueva política.</p>
          </Section>

          <Section title="10. Contacto">
            <p>Para consultas sobre esta Política de Privacidad:</p>
            <p>
              <strong style={{ color: C.text }}>Atento AI</strong><br />
              Email: <a href="mailto:hola@atento.ai" style={{ color: C.accent }}>hola@atento.ai</a><br />
              País: Argentina
            </p>
          </Section>
        </div>

        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/terminos" style={{ color: C.accent, fontSize: '0.9rem', textDecoration: 'none' }}>Términos y Condiciones →</Link>
          <Link to="/" style={{ color: C.textSec, fontSize: '0.9rem', textDecoration: 'none' }}>← Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ borderLeft: '3px solid rgba(124,58,237,0.4)', paddingLeft: '1.5rem' }}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: '#f1f5f9' }}>{title}</h2>
      <div style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {children}
      </div>
    </div>
  );
}
