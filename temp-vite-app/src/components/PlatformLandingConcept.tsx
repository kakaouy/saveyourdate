import { useState, type FormEvent } from 'react';
import './platform-landing-concept.css';

const invitationPreviews = [
  ['/previews/aurora.png', 'Aurora'],
  ['/previews/astraea.png', 'Astraea'],
  ['/previews/rosewood.png', 'Rosewood'],
  ['/previews/siena.png', 'Siena'],
  ['/previews/amalfi.png', 'Amalfi'],
  ['/previews/varezzia.png', 'Varezzia'],
  ['/previews/coruscant.png', 'Coruscant'],
  ['/previews/verona.png', 'Verona'],
  ['/previews/rivendell.png', 'Rivendell'],
];

const frequentlyAskedQuestions = [
  ['¿Puedo conocer la plataforma antes de crear mi evento?', 'Sí. La demostración usa datos ficticios para que recorras invitados, confirmaciones, mesas, Living y otros módulos sin registrarte. Nada de lo que hagas allí se guarda.'],
  ['¿Cómo empiezo a organizar un evento real?', 'Cuando tu evento queda habilitado recibís un número de pedido y un código de acceso. Con esos datos ingresás a tu panel privado y empezás a cargar la información.'],
  ['¿La invitación está incluida dentro de la plataforma?', 'Sí. La invitación es uno de los módulos del evento: podés elegir un modelo, personalizar textos, colores, fotos e información, y después vincularla con las confirmaciones de tus invitados.'],
  ['¿Puedo modificar la información después?', 'Sí. Mientras la invitación está en borrador podés editarla y enviarla a revisión. En el panel también podés actualizar invitados, restricciones, mesas, comunicados y accesos según tu rol.'],
  ['¿Tengo que cargar cada invitado manualmente?', 'No. Podés agregarlos uno por uno o importar una lista desde CSV o Excel. Antes de guardar, el sistema permite revisar errores y posibles duplicados.'],
  ['¿Qué diferencia hay entre anfitrión, organizador y proveedor?', 'El anfitrión controla su evento completo. El organizador puede gestionar uno o varios eventos y equipos. Cada proveedor recibe únicamente acceso a la información que necesita para realizar su tarea.'],
  ['¿Cómo funcionan los planes y el pago?', 'El plan para anfitriones se contrata por evento. Para organizadores preparamos una propuesta según la cantidad de eventos a gestionar. Los medios de pago y valores definitivos se informan antes de confirmar.'],
  ['¿Check-in y álbum colaborativo están disponibles?', 'Todavía no. Ambos módulos aparecen identificados como “Próximamente”, para que puedas entender cómo se integrarán sin confundirlos con funciones activas.'],
  ['¿Mis invitados tienen que instalar una aplicación?', 'No. La invitación y las confirmaciones funcionan desde un enlace que pueden abrir en el celular o en la computadora.'],
  ['¿Qué hago si necesito ayuda?', 'Podés escribirnos desde el formulario de contacto. Te ayudamos a elegir el recorrido adecuado y a resolver dudas sobre tu evento, tu pedido o el uso de la plataforma.'],
];

const platformJourneys = [
  { number: '01', eyebrow: 'INVITACIÓN Y COMUNICACIÓN', title: 'Invitá y comunicá', text: 'Diseñá la experiencia, compartí cada detalle y mantené a todos informados desde un mismo lugar.', demo: 'Invitación', preview: 'invite', features: ['Configurá el evento', 'Invitá y comunicá', 'Confirmaciones y RSVP'], more: ['Invitación personalizada', 'Comunicados y recordatorios', 'Galería de imágenes', 'Regalos', 'Canciones sugeridas'] },
  { number: '02', eyebrow: 'PERSONAS Y DISTRIBUCIÓN', title: 'Organizá invitados y mesas', text: 'Gestioná grupos, círculos sociales y necesidades para construir una distribución clara.', demo: 'Mesas y Living', preview: 'tables', features: ['Grupos y acompañantes', 'Mesas y zonas Living', 'Restricciones y accesibilidad'], more: ['Importación de invitados', 'Sugerencias de ubicación', 'Plano del salón'] },
  { number: '03', eyebrow: 'SALÓN Y OPERACIÓN', title: 'Prepará salón y entregables', text: 'Diseñá el plano y compartí con cada proveedor únicamente la información que necesita para trabajar.', demo: 'Proveedores', preview: 'team', features: ['Plano y elementos del salón', 'Numeración de mesas', 'Entregables por destinatario'], more: ['Reporte para catering', 'Plano para montaje', 'Proveedores y accesos', 'Check-in y álbum colaborativo · Próximamente'] },
];

function PrivacyPolicy() {
  return <div className="concept-privacy-policy">
    <p className="concept-policy-date">Última actualización: 27 de agosto de 2026</p>
    <section><h3>1. Alcance de esta Política</h3><p>Esta Política explica cómo SaveYourDate recoge, utiliza, comparte y protege los datos personales cuando una persona consulta, contrata o utiliza la plataforma para organizar un evento. Al usar el servicio también aceptás las Condiciones de Uso aplicables.</p></section>
    <section><h3>2. Información que recogemos</h3><p>Recogemos la información que nos facilitás directamente. El correo electrónico es necesario para crear o gestionar un pedido, habilitar accesos y comunicarnos contigo; sin ese dato es posible que no podamos prestar determinadas funciones. El resto depende del servicio contratado y de los campos que decidas utilizar.</p><ul><li>Nombre, correo electrónico, teléfono y datos del pedido o del evento.</li><li>Información de perfil y datos de los colaboradores a quienes concedas acceso.</li><li>Datos de facturación o de la operación tratados por Mercado Pago y los medios de pago disponibles, como país, importe, referencia e identificación fiscal cuando corresponda. SaveYourDate no almacena los datos completos de tu tarjeta.</li><li>Datos del evento, invitaciones, planos, mesas y personas invitadas que cargues, incluidos nombres, datos de contacto, acompañantes, confirmaciones, restricciones alimentarias, accesibilidad y otros campos de RSVP que configures.</li><li>Consultas de soporte, registros técnicos, accesos y acciones necesarias para mantener la seguridad y trazabilidad del servicio.</li></ul><p>Cuando cargás datos de invitados, sos responsable de contar con una base jurídica válida y de informarles adecuadamente sobre el tratamiento.</p></section>
    <section><h3>3. Cómo usamos tu información</h3><p>Utilizamos la información para:</p><ul><li>Prestar, mantener, proteger y mejorar SaveYourDate.</li><li>Crear pedidos, habilitar eventos, gestionar accesos y publicar invitaciones.</li><li>Tramitar pagos, verificar operaciones, emitir comprobantes y gestionar la vigencia del servicio.</li><li>Enviar códigos de acceso, avisos técnicos, alertas de seguridad, recordatorios y mensajes de soporte.</li><li>Gestionar confirmaciones, grupos, mesas, restricciones, proveedores y demás módulos que actives.</li><li>Responder consultas y, únicamente con tu consentimiento cuando sea exigible, medir el uso o comunicar novedades del producto.</li></ul></section>
    <section><h3>4. Bases jurídicas y datos de invitados</h3><p>Tratamos tus datos para ejecutar el contrato, atender solicitudes, cumplir obligaciones legales, proteger la seguridad del servicio y, cuando corresponda, sobre la base de tu consentimiento. Respecto de los datos de invitados que cargás, vos actuás como responsable del tratamiento y SaveYourDate como encargado, limitado a prestar las funciones que solicitaste.</p></section>
    <section><h3>5. Conservación</h3><p>Conservamos la información mientras el evento o la relación contractual estén activos y durante los plazos necesarios para soporte, seguridad y cumplimiento legal. Desde el panel podés solicitar la eliminación del evento. Algunos registros mínimos de pagos, seguridad o eliminación pueden conservarse cuando exista una obligación legal o un interés legítimo documentado.</p></section>
    <section><h3>6. Comunicación de información</h3><p>No vendemos tus datos personales ni los usamos para publicidad de terceros. Solo los compartimos cuando es necesario para operar el servicio, cumplir la ley o proteger nuestros derechos y a nuestros usuarios.</p><ul><li><strong>Supabase:</strong> base de datos, autenticación técnica y almacenamiento asociado al servicio.</li><li><strong>Resend y FormSubmit:</strong> envío de correos transaccionales o recepción de formularios, según el recorrido utilizado.</li><li><strong>Mercado Pago:</strong> procesamiento o verificación de pagos.</li><li>Autoridades u organismos competentes ante una obligación o requerimiento legal válido.</li><li>Una entidad sucesora en una fusión, adquisición o venta de activos, con garantías adecuadas.</li></ul><p>Los proveedores actúan bajo sus propias políticas y, cuando corresponde, como encargados o subencargados sujetos a obligaciones de confidencialidad y protección de datos.</p></section>
    <section><h3>7. Transferencias internacionales</h3><p>Algunos proveedores pueden tratar información fuera de tu país. Cuando la normativa lo exige, aplicamos o exigimos mecanismos adecuados de transferencia y protección contractual.</p></section>
    <section><h3>8. Seguridad de los datos</h3><p>Aplicamos medidas técnicas y organizativas razonables para proteger la información frente al acceso, alteración, divulgación o destrucción no autorizados. Entre ellas se incluyen cifrado en tránsito mediante HTTPS, controles de acceso por rol, sesiones y códigos firmados, seguridad a nivel de fila en las tablas de la base de datos, accesos acotados a los recursos almacenados, registros de actividad y verificación de firmas en los webhooks que recibimos.</p><p>Ningún sistema es completamente infalible. Si detectás un acceso no autorizado, comunicate con nosotros cuanto antes.</p></section>
    <section><h3>9. Menores</h3><p>El servicio está dirigido a personas adultas que organizan eventos. Si se incorporan datos de menores como invitados, quien organiza el evento debe contar con la autorización o base jurídica correspondiente y cargar únicamente la información necesaria.</p></section>
    <section><h3>10. Tus derechos</h3><p>Según la normativa aplicable, incluido el RGPD cuando corresponda, podés:</p><ul><li>Acceder a tu información personal.</li><li>Rectificar datos inexactos o incompletos.</li><li>Solicitar la supresión de tus datos.</li><li>Limitar el tratamiento u oponerte a él.</li><li>Retirar un consentimiento sin afectar el tratamiento previo.</li><li>Solicitar la portabilidad o exportar los datos disponibles desde las herramientas del panel.</li><li>Presentar una reclamación ante la autoridad de protección de datos competente.</li></ul><p>Podemos pedirte información razonable para verificar tu identidad antes de responder una solicitud. Si sos invitado, algunas solicitudes deberán dirigirse primero a quien organiza el evento, que es quien decidió cargar tus datos.</p></section>
    <section><h3>11. Cookies y seguimiento</h3><p>Usamos cookies o tecnologías equivalentes estrictamente necesarias para mantener sesiones, recordar preferencias y operar funciones de seguridad. Si en el futuro habilitamos analítica u otras cookies no esenciales, se utilizarán con tu consentimiento cuando corresponda y podrás modificar tus preferencias.</p></section>
    <section><h3>12. Cambios en esta Política</h3><p>Podemos actualizar esta Política para reflejar cambios legales, técnicos o del servicio. Publicaremos la versión vigente en esta página y actualizaremos la fecha de “Última actualización”. Si un cambio modifica sustancialmente cómo usamos tus datos, lo comunicaremos por un medio adecuado.</p></section>
    <section><h3>13. Contacto</h3><p>Para realizar una consulta o ejercer tus derechos, escribinos a <a href="mailto:hola@saveyourdate.site">hola@saveyourdate.site</a>.</p></section>
  </div>;
}

export default function PlatformLandingConcept() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState('es');
  const [plansOpen, setPlansOpen] = useState(false);
  const [audience, setAudience] = useState<'host' | 'pro'>('host');
  const [eventsInQuarter, setEventsInQuarter] = useState('3');
  const [legalOpen, setLegalOpen] = useState<'privacy' | 'terms' | null>(null);
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setContactStatus('sending');
    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'contact',
          name: data.get('name'), email: data.get('email'),
          message: data.get('message'), company: data.get('company')
        })
      });
      if (!response.ok) throw new Error('No se pudo enviar');
      form.reset();
      setContactStatus('success');
    } catch {
      setContactStatus('error');
    }
  };

  return <main className="platform-concept">
    <header className="concept-nav">
      <nav className={menuOpen ? 'is-open' : ''} aria-label="Principal"><a href="#como-funciona" onClick={() => setMenuOpen(false)}>Cómo funciona</a><a href="#para-quien" onClick={() => setMenuOpen(false)}>Para quién es</a><a href="/?catalogo=1" onClick={() => setMenuOpen(false)}>Invitaciones</a><button type="button" onClick={() => { setMenuOpen(false); setPlansOpen(true); }}>Planes</button><a href="#preguntas" onClick={() => setMenuOpen(false)}>Preguntas</a><a className="concept-mobile-login" href="/consultar">Consultar pedido</a><a className="concept-mobile-login" href="/?demo=panel">Probar la plataforma</a><a className="concept-mobile-login" href="/admin">Ingresar</a></nav>
      <div className="concept-nav-actions">
        <label className="concept-language"><span className="sr-only">Idioma</span><select aria-label="Seleccionar idioma" value={language} onChange={(event) => setLanguage(event.target.value)}><option value="es">ES</option><option value="en">EN</option><option value="pt">PT</option></select></label>
        <a className="concept-login" href="/admin">Ingresar</a><a className="concept-nav-cta" href="/admin">Crear mi evento</a>
        <button className="concept-menu-button" type="button" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /><span /></button>
      </div>
    </header>

    <section className="concept-hero">
      <div className="concept-hero-slides" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <div className="concept-hero-copy">
        <img className="concept-hero-logo" src="/logo.svg" alt="Save Your Date" />
        <p className="concept-kicker">Tu evento empieza acá</p>
        <h1>Lo lindo se ve.<br /><em>Todo lo demás</em><br />queda organizado.</h1>
        <p className="concept-lead">Invitaciones, confirmaciones, invitados, mesas y salón conectados en un solo lugar, desde la planificación hasta el día del evento.</p>
        <div className="concept-actions"><a className="concept-action-create" href="/admin">Crear mi evento <span>→</span></a><a className="concept-action-demo" href="/?demo=panel">Probar la plataforma <span>→</span></a><a className="concept-action-pro" href="#organizadores">Organizo eventos <span>→</span></a></div>
        <p className="concept-proof"><b>Una sola plataforma</b><span>Invitación · Comunicados · RSVP · Mesas · Proveedores</span></p>
        <div className="concept-scroll">DESLIZÁ PARA DESCUBRIR <span>↓</span></div>
      </div>

      <div className="concept-worktable" role="img" aria-label="Mesa de trabajo vista desde arriba con invitaciones, agenda y herramientas para organizar un evento">
        {['INVITACIÓN','PLANIFICACIÓN','GESTIÓN','FIESTA','CELEBRACIÓN','ORGANIZACIÓN','ENCUENTRO','EMOCIÓN','RECUERDOS','DETALLES','MÚSICA','BRINDIS','INVITADOS','MOMENTOS','ALEGRÍA','CONEXIÓN'].map((word,index)=><span key={word} style={{'--tag-index':index} as React.CSSProperties}>{word}</span>)}
      </div>
    </section>

    <section className="concept-less" aria-label="Beneficios principales">
      <div><span>MENOS RUIDO. MÁS EVENTO.</span><p>Menos planillas.</p><p>Menos mensajes perdidos.</p><p>Menos errores.</p><strong>Más tiempo para vivir el evento.</strong></div>
      <article className="concept-event-overview" aria-label="Ejemplo de organización del evento">
        <header><div><small>ORGANIZACIÓN DEL EVENTO</small><h2>Todo conectado</h2></div><b>En progreso</b></header>
        <div className="concept-event-progress" aria-label="Tres de cuatro áreas preparadas"><i /><i /><i /><i /></div>
        <div className="concept-event-stats"><div><strong>259</strong><span>Confirmados</span></div><div><strong>16</strong><span>Mesas</span></div><div><strong>0</strong><span>Sin ubicar</span></div></div>
        <div className="concept-event-row"><i /><div><b>Mesa Familia</b><small>Círculo social · Familia</small></div><span>12/12</span></div>
        <div className="concept-event-row"><i /><div><b>Mesa Facultad</b><small>Círculo social · Facultad</small></div><span>10/12</span></div>
        <div className="concept-event-row"><i /><div><b>Mesa Amigos</b><small>Círculo social · Amigos</small></div><span>8/10</span></div>
      </article>
    </section>

    <section className="concept-connected" id="como-funciona">
      <div className="concept-modules" id="modulos">
        <div className="concept-how-intro"><p>Cómo funciona</p><div className="concept-how-card"><header><small>UN RECORRIDO CONECTADO</small><h3>De la primera lista al evento listo para compartir</h3><p>Cargá la información una vez y usala durante toda la organización.</p></header><ol><li><b>01</b><div><strong>Configurá e importá</strong><span>Completá los datos principales o subí tu lista de invitados.</span></div></li><li><b>02</b><div><strong>Ordená personas y grupos</strong><span>Reuní acompañantes, círculos sociales y confirmaciones.</span></div></li><li><b>03</b><div><strong>Diseñá mesas y salón</strong><span>Ubicá invitados y adaptá cada elemento al espacio real.</span></div></li><li><b>04</b><div><strong>Revisá y compartí</strong><span>Generá entregables claros para coordinación y proveedores.</span></div></li></ol></div></div>
        <header><h2>Todo tu evento,<br /><em>en un solo lugar.</em></h2><div><p>Tres momentos conectados para configurar, organizar y preparar el evento sin repetir información ni depender de herramientas separadas.</p><a href="/?demo=panel">Recorrer la demostración →</a></div></header>
        <div className="concept-journey-grid">{platformJourneys.map((journey) => <article className="concept-journey-card" key={journey.title}>
          <div className={`concept-journey-preview is-${journey.preview}`} aria-hidden="true">
            <div className="concept-preview-nav"><i /><i /><i /><span /></div>
            {journey.preview === 'invite' && <div className="concept-preview-invite"><section><small>INVITACIÓN</small><b>Sofía &amp; Mateo</b><span>12 · 10 · 2026</span><button>Confirmar asistencia</button></section><aside><i /><i /><i /></aside><div className="concept-preview-guest-sheet"><div className="concept-preview-rsvp-stats"><span><b>245</b>Confirmados</span><span><b>34</b>Pendientes</span><span><b>63</b>No asisten</span></div><header><b>INVITADOS</b><span>Estado</span></header><p><i>SM</i><b>Sofía M.</b><span>Confirmado</span></p><p><i>JL</i><b>Juan L.</b><span>Pendiente</span></p><p><i>AR</i><b>Ana R.</b><span>Confirmado</span></p><p><i>MC</i><b>Martín C.</b><span>No asiste</span></p><p><i>LV</i><b>Lucía V.</b><span>Confirmado</span></p></div></div>}
            {journey.preview === 'tables' && <div className="concept-preview-seating"><aside><small>INVITADOS Y GRUPOS</small><label>Buscar grupo…</label><div><i>F</i><span><b>Familia</b><small>Grupo confirmado</small></span></div><div><i>A</i><span><b>Amigos</b><small>Sin ubicar</small></span></div><div><i>U</i><span><b>Facultad</b><small>Mesa asignada</small></span></div></aside><main><header><div><small>ORGANIZACIÓN DE MESAS</small><b>Ubicá grupos completos</b></div><span>+ Añadir mesa</span></header><section><article><b>Mesa Familia</b><div className="concept-mini-table"><i /><i /><i /><i /><i /><i /><strong>F</strong></div><small>Grupo ubicado</small></article><article><b>Mesa Amigos</b><div className="concept-mini-table"><i /><i /><i /><i /><i /><i /><strong>+</strong></div><small>Elegí un grupo para ubicar</small></article></section></main></div>}
            {journey.preview === 'team' && <div className="concept-preview-team"><section><i>12</i><div><b>Numeración de mesas</b><span>Números listos para imprimir</span></div><strong>Listo</strong></section><section><i>SA</i><div><b>Salón</b><span>Plano de montaje</span></div><strong>Listo</strong></section><section><i>CP</i><div><b>Catering</b><span>Listado por mesa y asiento</span></div><strong>Listo</strong></section></div>}
          </div>
          <div className="concept-journey-copy"><span>{journey.number} · {journey.eyebrow}</span><h3>{journey.title}</h3><p>{journey.text}</p><ul>{journey.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><details><summary>Ver todas las funciones</summary><ul>{journey.more.map((feature) => <li key={feature}>{feature}</li>)}</ul></details><a href={`/?demo=panel&modulo=${encodeURIComponent(journey.demo)}`}>Ver en la demostración <b>→</b></a></div>
        </article>)}</div>
      </div>
    </section>

    <section className="concept-audience-switch" id="para-quien" aria-labelledby="audience-title">
      <header><span>PARA QUIÉN ES</span><h2 id="audience-title">La misma plataforma.<br /><em>El recorrido que necesitás.</em></h2><div className="concept-audience-tabs" role="tablist" aria-label="Elegir forma de organización"><button type="button" role="tab" aria-selected={audience === 'host'} onClick={() => setAudience('host')}>Mi evento</button><button type="button" role="tab" aria-selected={audience === 'pro'} onClick={() => setAudience('pro')}>Varios eventos</button></div></header>
      <article className={`concept-audience-panel is-${audience}`} role="tabpanel">
        <div className="concept-audience-visual">
          {audience === 'host' ? <img src="/concept/planner-heart-polaroids-v2.png" alt="Recuerdos e invitaciones de una celebración" /> : <div className="concept-pro-board"><span className="board-label">EVENTOS ACTIVOS</span><strong>Todo lo importante,<br />a la vista.</strong><div className="event-row"><i className="coral" /><b>Sofía &amp; Mateo</b><span>15 pendientes</span></div><div className="event-row"><i className="mint" /><b>Quince de Juanita</b><span>Mesas listas</span></div><div className="event-row"><i className="gold" /><b>Evento corporativo</b><span>3 proveedores</span></div></div>}
        </div>
        <div className="concept-audience-content">{audience === 'host' ? <><span>PARA ANFITRIONES</span><h3>Tu evento, claro<br />de principio a fin.</h3><p>Invitación, respuestas, invitados y salón conectados en un mismo recorrido.</p><ul><li>Una sola vista de todo el evento</li><li>Confirmaciones y acompañantes</li><li>Mesas, plano y entregables</li></ul><a href="/admin">Crear mi evento <b>→</b></a></> : <><span>PARA ORGANIZADORES</span><h3>Todos tus eventos,<br />sin repetir trabajo.</h3><p>Un espacio profesional para gestionar eventos, equipo y pendientes con una operación consistente.</p><ul><li>Varios eventos en una cuenta</li><li>Procesos reutilizables y seguimiento</li><li>Accesos acotados para colaboradores</li></ul><button type="button" onClick={() => setPlansOpen(true)}>Consultar modalidad profesional <b>→</b></button></>}
          <aside><b>¿Trabajás como proveedor?</b><span>No necesitás contratar un plan. El anfitrión o el organizador te concede acceso únicamente a la información necesaria para tu tarea.</span></aside>
        </div>
      </article>
    </section>

    <section className="concept-invitations" id="invitaciones">
      <div className="concept-invite-copy"><p><span>03</span> Creá tu invitación</p><h2>La primera impresión<br />también cuenta.</h2><p>Empezá por una invitación que entusiasme. Personalizá colores, textos, fotos y cada detalle de la experiencia.</p><a className="concept-explore-cta" href="/?catalogo=1">Explorar todas las invitaciones <span>→</span></a></div>
      <div className="concept-invite-stack">{[...invitationPreviews, ...invitationPreviews.slice(0, 6)].map(([src, label], index) => <figure key={`${src}-${index}`} tabIndex={0} style={{ '--card-index': index } as React.CSSProperties}><img src={src} alt={`Invitación ${label}`} /><figcaption>{label}</figcaption></figure>)}</div>
    </section>

    <nav className="concept-return-links" aria-label="Accesos para eventos existentes"><a href="/consultar"><small>SEGUIMIENTO</small>Consultar mi pedido <b>→</b></a><a href="/admin"><small>GESTIÓN</small>Ingresar a mi evento <b>→</b></a></nav>

    <section className="concept-trust" aria-labelledby="trust-title"><header><span>CONFIANZA SIN LETRA CHICA</span><h2 id="trust-title">Probalo. Entendelo.<br /><em>Después decidí.</em></h2></header><div><article><b>01</b><h3>Demo sin registro</h3><p>Recorré la plataforma con datos ficticios antes de compartir información propia.</p></article><article><b>02</b><h3>Acceso privado</h3><p>El evento real se protege con los datos del pedido y un código de seguridad.</p></article><article><b>03</b><h3>Permisos por rol</h3><p>Cada persona accede únicamente a los módulos necesarios para su tarea.</p></article><article><b>04</b><h3>Revisión antes de publicar</h3><p>La invitación atraviesa un circuito de borrador, revisión y aprobación.</p></article><article><b>05</b><h3>Soporte humano</h3><p>Podés consultar antes de comenzar o pedir ayuda durante la organización.</p></article></div></section>

    <section className="concept-faq" id="preguntas">
      <div className="concept-faq-heading"><p><span>05</span> Antes de empezar</p><h2>Preguntas simples.<br /><em>Respuestas claras.</em></h2><p>Todo lo importante para decidir cómo querés organizar tu evento.</p><a href="#contacto">¿Tenés otra pregunta? Hablemos →</a></div>
      <div className="concept-faq-list">{frequentlyAskedQuestions.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>{String(index + 1).padStart(2, '0')}</span>{question}<i aria-hidden="true">＋</i></summary><p>{answer}</p></details>)}</div>
    </section>

    <section className="concept-final" id="empezar"><span>Save the date. Save your time.</span><h2>Todo listo para empezar<br /><em>a organizar tu evento.</em></h2><p>Creá tu espacio de trabajo o recorré primero una demostración con información ficticia.</p><div><a href="/admin">Crear mi evento <b>→</b></a><a href="/?demo=panel">Ver la demostración</a></div><a className="concept-final-contact" href="#contacto">¿Necesitás ayuda para decidir? Hablemos</a></section>
    <section className="concept-contact" id="contacto"><div><span>CONVERSEMOS</span><h2>Contanos qué estás organizando.</h2><p>Te ayudamos a elegir la mejor forma de gestionar tu evento.</p></div><form onSubmit={submitContact}><label>Nombre<input name="name" autoComplete="name" required /></label><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Mensaje<textarea name="message" rows={4} required /></label><label className="concept-contact-trap" aria-hidden="true">Empresa<input name="company" tabIndex={-1} autoComplete="off" /></label><button type="submit" disabled={contactStatus === 'sending'}>{contactStatus === 'sending' ? 'Enviando…' : 'Enviar consulta →'}</button>{contactStatus === 'success' && <p className="concept-contact-status is-success" role="status">¡Gracias! Tu consulta fue enviada correctamente.</p>}{contactStatus === 'error' && <p className="concept-contact-status is-error" role="alert">No pudimos enviarla. Revisá tu conexión e intentá nuevamente.</p>}</form></section>
    <footer className="concept-footer"><img src="/logo.svg" alt="Save Your Date" /><nav aria-label="Pie de página"><a href="#como-funciona">Cómo funciona</a><a href="/?catalogo=1">Invitaciones</a><a href="#preguntas">Preguntas</a><a href="/consultar">Consultar pedido</a><a href="/admin">Ingresar</a><button onClick={() => setLegalOpen('privacy')}>Privacidad</button><button onClick={() => setLegalOpen('terms')}>Condiciones</button></nav><span>Invitaciones que emocionan. Gestión que simplifica.</span></footer>
    {plansOpen && <div className="concept-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPlansOpen(false); }}><section className="concept-plans-modal" role="dialog" aria-modal="true" aria-labelledby="plans-title"><button className="concept-modal-close" type="button" aria-label="Cerrar planes" onClick={() => setPlansOpen(false)}>×</button><header><span>PLANES</span><h2 id="plans-title">Elegí según cuántos eventos organizás.</h2><p>La plataforma es la misma. Cambian el alcance, la cantidad de eventos y la forma de acompañarte.</p></header><div className="concept-plan-shared"><b>AMBOS INCLUYEN</b><span>Invitación y RSVP</span><span>Invitados y grupos</span><span>Mesas y salón</span><span>Entregables y accesos</span></div><div className="concept-plan-grid"><article><span>UN EVENTO</span><h3>Mi evento</h3><p>Para organizar una celebración propia de principio a fin.</p><ul><li>Un evento con todos los módulos activos</li><li>Acceso para anfitriones y proveedores</li><li>Acompañamiento durante la organización</li></ul><div className="concept-plan-actions"><a href="/admin">Crear mi evento</a><a href="/?demo=panel">Ver la demo</a></div></article><article className="concept-plan-pro"><span>VARIOS EVENTOS</span><h3>Organización profesional</h3><p>Para equipos que necesitan repetir un proceso claro en varios eventos.</p><ul><li>Vista centralizada de eventos</li><li>Roles para equipo y proveedores</li><li>Seguimiento y procesos reutilizables</li></ul><label>Eventos estimados en 3 meses<select value={eventsInQuarter} onChange={(event) => setEventsInQuarter(event.target.value)}><option value="1">1 evento</option><option value="3">2 a 3 eventos</option><option value="6">4 a 6 eventos</option><option value="10">7 a 10 eventos</option><option value="more">Más de 10 eventos</option></select></label><div className="concept-plan-actions"><a href={`mailto:hola@saveyourdate.site?subject=Consulta para varios eventos&body=Quiero gestionar ${eventsInQuarter} eventos en 3 meses.`}>Consultar propuesta</a><a href="/?demo=panel">Ver la demo</a></div></article></div><p className="concept-plans-footnote">Precio, vigencia y medios de pago se informan antes de confirmar. Check-in y álbum colaborativo continúan marcados como “Próximamente”.</p></section></div>}
    {legalOpen && <div className="concept-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setLegalOpen(null); }}><section className={`concept-legal-modal ${legalOpen === 'privacy' ? 'is-policy' : ''}`} role="dialog" aria-modal="true" aria-labelledby="concept-legal-title"><button className="concept-modal-close" onClick={() => setLegalOpen(null)} aria-label="Cerrar">×</button><span>{legalOpen === 'privacy' ? 'POLÍTICA DE PRIVACIDAD' : 'CONDICIONES DE USO'}</span><h2 id="concept-legal-title">{legalOpen === 'privacy' ? 'Tu información merece cuidado.' : 'Un servicio claro desde el comienzo.'}</h2>{legalOpen === 'privacy' ? <PrivacyPolicy /> : <><p>Este resumen explica el funcionamiento general y no reemplaza las condiciones contractuales definitivas que se informarán antes de contratar.</p><ul><li>Las funciones “Próximamente” no se consideran activas.</li><li>Precio, vigencia, forma de pago y alcance se confirman antes del alta.</li><li>La publicación de la invitación requiere completar el circuito de revisión.</li></ul><a href="mailto:hola@saveyourdate.site">Consultar al equipo →</a></>}</section></div>}
  </main>;
}
