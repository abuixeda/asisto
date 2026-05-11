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

export default function TermsOfService() {
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
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem' }}>Términos y Condiciones</h1>
          <p style={{ color: C.textSec, fontSize: '0.95rem' }}>Última actualización: 2 de mayo de 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <Section title="1. Aceptación de los términos">
            <p>Al crear una cuenta o usar el servicio Atento AI (&quot;el Servicio&quot;), aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, no podés usar el Servicio.</p>
            <p>Estos términos se aplican tanto al plan self-service (LandingVolume) como al servicio gestionado por agencia (&quot;Atento Servicio&quot;).</p>
          </Section>

          <Section title="2. Descripción del servicio">
            <p>Atento AI provee un asistente de inteligencia artificial que atiende mensajes entrantes en WhatsApp e Instagram en nombre del usuario (&quot;el Comerciante&quot;).</p>
            <p>El Servicio incluye:</p>
            <ul>
              <li>Configuración y entrenamiento del bot con información del negocio</li>
              <li>Conexión con WhatsApp Business y/o Instagram DMs</li>
              <li>Panel de control con métricas e historial de conversaciones</li>
              <li>Soporte técnico según el plan contratado</li>
            </ul>
            <p>El plan &quot;Atento Servicio&quot; incluye además instalación, configuración y gestión continua por parte del equipo de Atento.</p>
          </Section>

          <Section title="3. Registro y cuenta">
            <ul>
              <li>Debés tener al menos 18 años y capacidad legal para contratar</li>
              <li>La información de registro debe ser veraz y estar actualizada</li>
              <li>Sos responsable de mantener la confidencialidad de tu contraseña</li>
              <li>Una cuenta corresponde a un negocio. Para múltiples negocios se requiere una cuenta por cada uno o un plan Agency</li>
              <li>Atento puede suspender cuentas con información falsa o actividad sospechosa</li>
            </ul>
          </Section>

          <Section title="4. Planes y facturación">
            <p><strong style={{ color: C.text }}>Período de prueba:</strong> Todos los planes incluyen 7 días de prueba gratuita. No se requiere tarjeta de crédito para comenzar.</p>
            <p><strong style={{ color: C.text }}>Facturación:</strong> Los planes se facturan mensualmente en USD. El cobro se realiza al inicio de cada período.</p>
            <p><strong style={{ color: C.text }}>Límites de mensajes:</strong> Los planes Starter y Pro tienen un límite mensual de mensajes. Si superás el límite, te notificaremos antes de interrumpir el servicio. El plan Business incluye mensajes ilimitados.</p>
            <p><strong style={{ color: C.text }}>Cambios de plan:</strong> Podés cambiar de plan en cualquier momento desde tu panel. Los cambios se aplican de forma inmediata con ajuste proporcional.</p>
            <p><strong style={{ color: C.text }}>Reembolsos:</strong> No ofrecemos reembolsos por períodos ya facturados, salvo falla técnica imputable a Atento AI que haya impedido el uso del servicio por más de 48 horas continuas.</p>
          </Section>

          <Section title="5. Uso aceptable">
            <p>El Servicio debe usarse únicamente para atención legítima de clientes reales de tu negocio. Está expresamente prohibido:</p>
            <ul>
              <li>Usar el bot para enviar spam, mensajes no solicitados o publicidad masiva</li>
              <li>Usar el bot para actividades ilegales, fraudulentas o engañosas</li>
              <li>Hacerse pasar por otra empresa o persona</li>
              <li>Distribuir contenido que viole derechos de terceros</li>
              <li>Intentar acceder a cuentas de otros usuarios o a infraestructura del sistema</li>
              <li>Usar el servicio para acosar, amenazar o discriminar a usuarios</li>
            </ul>
            <p>El incumplimiento puede resultar en suspensión inmediata sin reembolso.</p>
          </Section>

          <Section title="6. Contenido y responsabilidad del comerciante">
            <p>Sos el único responsable por:</p>
            <ul>
              <li>La exactitud del catálogo, precios y políticas de venta que cargás en el sistema</li>
              <li>Las promesas comerciales realizadas por el bot en tu nombre</li>
              <li>Cumplir con las leyes de protección al consumidor vigentes en tu país</li>
              <li>Obtener el consentimiento apropiado de tus clientes para el uso de IA en la atención</li>
              <li>Respetar los Términos de Servicio de WhatsApp Business y Meta</li>
            </ul>
            <p>Atento AI no se hace responsable por ventas perdidas, malentendidos o conflictos derivados de respuestas del bot basadas en información incorrecta proporcionada por el Comerciante.</p>
          </Section>

          <Section title="7. Disponibilidad del servicio">
            <p>Nos comprometemos a mantener el Servicio disponible de forma continua. Sin embargo:</p>
            <ul>
              <li>No garantizamos disponibilidad ininterrumpida del 100%</li>
              <li>Realizamos mantenimientos programados con notificación previa siempre que sea posible</li>
              <li>Interrupciones por causas ajenas a nosotros (caída de WhatsApp, falla de proveedores de nube) no son responsabilidad de Atento AI</li>
            </ul>
            <p>En caso de interrupción mayor a 48 horas continuas imputable a Atento, acreditaremos días proporcionales en tu próxima factura.</p>
          </Section>

          <Section title="8. Propiedad intelectual">
            <p>Todo el código, diseño, marca y contenido de Atento AI es propiedad exclusiva de Atento AI y está protegido por leyes de propiedad intelectual.</p>
            <p>Al usar el Servicio, nos otorgás una licencia limitada, no exclusiva y no transferible para procesar el contenido de tu negocio (catálogo, instrucciones, conversaciones) con el único fin de prestar el servicio contratado.</p>
          </Section>

          <Section title="9. Cancelación">
            <p><strong style={{ color: C.text }}>Por tu parte:</strong> Podés cancelar en cualquier momento desde tu panel de control. La cancelación es efectiva al final del período ya abonado. No hay penalidades ni períodos mínimos de permanencia.</p>
            <p><strong style={{ color: C.text }}>Por nuestra parte:</strong> Podemos suspender o cancelar tu cuenta si:</p>
            <ul>
              <li>Incumplís estos Términos</li>
              <li>No se procesa el pago luego de 7 días de gracia</li>
              <li>Detectamos uso fraudulento o actividad que ponga en riesgo la plataforma</li>
            </ul>
            <p>En caso de cancelación por nuestra parte por causas no imputables a vos, reembolsaremos el proporcional del período no utilizado.</p>
          </Section>

          <Section title="10. Limitación de responsabilidad">
            <p>En la máxima medida permitida por la ley aplicable, Atento AI no será responsable por:</p>
            <ul>
              <li>Pérdida de ganancias, ventas o ingresos</li>
              <li>Pérdida de datos o información</li>
              <li>Daños indirectos, incidentales o consecuentes</li>
              <li>Acciones u omisiones de plataformas de terceros (WhatsApp, Meta, etc.)</li>
            </ul>
            <p>La responsabilidad total de Atento AI en cualquier caso no superará el monto pagado por el Comerciante en los 3 meses anteriores al incidente.</p>
          </Section>

          <Section title="11. Modificaciones a los términos">
            <p>Podemos modificar estos Términos notificando por correo electrónico con al menos 15 días de anticipación. Si continuás usando el Servicio después de la fecha de vigencia, se considera que aceptás los nuevos Términos.</p>
          </Section>

          <Section title="12. Ley aplicable">
            <p>Estos Términos se rigen por las leyes de la República Argentina. Cualquier disputa se someterá a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.</p>
          </Section>

          <Section title="13. Contacto">
            <p>Para consultas sobre estos Términos:</p>
            <p>
              <strong style={{ color: C.text }}>Atento AI</strong><br />
              Email: <a href="mailto:hola@atento.ai" style={{ color: C.accent }}>hola@atento.ai</a><br />
              País: Argentina
            </p>
          </Section>
        </div>

        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/privacidad" style={{ color: C.accent, fontSize: '0.9rem', textDecoration: 'none' }}>Política de Privacidad →</Link>
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
