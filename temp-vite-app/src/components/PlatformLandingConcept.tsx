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

const platformModules = [
  { icon: '✦', name: 'Invitación', text: 'Diseño, textos, fotos y toda la información del evento en un único enlace.', demo: 'Invitación' },
  { icon: '♙', name: 'Invitados y RSVP', text: 'Grupos, acompañantes, confirmaciones y seguimiento sin planillas separadas.', demo: 'Invitados' },
  { icon: '↗', name: 'Comunicados', text: 'Novedades y recordatorios para mantener a todos informados.', demo: 'Comunicados' },
  { icon: '◇', name: 'Restricciones', text: 'Alimentación, accesibilidad y necesidades importantes centralizadas.', demo: 'Invitados' },
  { icon: '▦', name: 'Mesas y Living', text: 'Distribución visual de personas, grupos y espacios sin límite de Living.', demo: 'Mesas y Living' },
  { icon: '♡', name: 'Regalos y canciones', text: 'Información para regalos y sugerencias musicales vinculadas al evento.', demo: 'Resumen' },
  { icon: '◎', name: 'Proveedores y accesos', text: 'Cada colaborador ve únicamente la parte que necesita para trabajar.', demo: 'Proveedores' },
  { icon: '▧', name: 'Galería de imágenes', text: 'Fotos y recuerdos integrados a la experiencia de la invitación.', demo: 'Invitación' },
  { icon: '✓', name: 'Check-in', text: 'Recepción y control de llegadas desde el panel del evento.', upcoming: true },
  { icon: '▣', name: 'Álbum colaborativo', text: 'Un espacio para reunir las fotos compartidas por los invitados.', upcoming: true },
];

export default function PlatformLandingConcept() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState('es');
  const [plansOpen, setPlansOpen] = useState(false);
  const [eventsInQuarter, setEventsInQuarter] = useState('3');
  const [legalOpen, setLegalOpen] = useState<'privacy' | 'terms' | null>(null);
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setContactStatus('sending');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        <p className="concept-kicker"><span>01</span> Tu evento empieza acá</p>
        <h1>Lo lindo se ve.<br /><em>Todo lo demás</em><br />queda organizado.</h1>
        <p className="concept-lead">Creá la invitación, gestioná invitados y compartí cada detalle sin vivir entre planillas y mensajes.</p>
        <div className="concept-actions"><a className="concept-action-create" href="/admin">Crear mi evento <span>→</span></a><a className="concept-action-demo" href="/?demo=panel">Probar la plataforma <span>→</span></a><a className="concept-action-pro" href="#organizadores">Organizo eventos <span>→</span></a></div>
        <p className="concept-proof"><b>Una sola plataforma</b><span>Invitación · Comunicados · RSVP · Mesas · Proveedores</span></p>
      </div>

      <div className="concept-worktable" role="img" aria-label="Mesa de trabajo vista desde arriba con invitaciones, agenda y herramientas para organizar un evento">
        {['INVITACIÓN','PLANIFICACIÓN','GESTIÓN','FIESTA','CELEBRACIÓN','ORGANIZACIÓN','ENCUENTRO','EMOCIÓN','RECUERDOS','DETALLES','MÚSICA','BRINDIS','INVITADOS','MOMENTOS','ALEGRÍA','CONEXIÓN'].map((word,index)=><span key={word} style={{'--tag-index':index} as React.CSSProperties}>{word}</span>)}
      </div>
      <div className="concept-scroll">DESLIZÁ PARA DESCUBRIR <span>↓</span></div>
    </section>

    <section className="concept-less" aria-label="Beneficios principales">
      <div><span>MENOS RUIDO. MÁS EVENTO.</span><p>Menos planillas.</p><p>Menos mensajes perdidos.</p><p>Menos errores.</p><strong>Más tiempo para vivir el evento.</strong></div>
    </section>

    <section className="concept-connected" id="como-funciona">
      <div className="concept-flow">
        <div className="concept-section-heading"><p><span>02</span> Empezar es simple</p><h2>Del primer dato<br /><em>al evento organizado.</em></h2><p>Un recorrido claro para pasar de la idea a un panel listo para trabajar.</p></div>
        <div className="concept-flow-line concept-flow-three">
          <article><b>01</b><span>✦</span><h3>Contanos qué estás organizando</h3><p>Elegís si sos anfitrión u organizador y completás los datos básicos.</p></article>
          <article><b>02</b><span>↗</span><h3>Recibí el acceso a tu evento</h3><p>Se genera el pedido y recibís los datos para entrar al panel privado.</p></article>
          <article><b>03</b><span>▦</span><h3>Organizá todo desde el panel</h3><p>Creás la invitación, cargás invitados y activás los módulos necesarios.</p></article>
        </div>
        <div className="concept-path-choice"><article><span>RECORRIDO REAL</span><h3>Crear mi evento</h3><p>Para comenzar un evento, recibir el acceso y gestionar información real.</p><a href="/admin">Empezar mi evento <b>→</b></a></article><article><span>RECORRIDO DE PRUEBA</span><h3>Probar la plataforma</h3><p>Para explorar los módulos con datos ficticios. Nada se guarda.</p><a href="/?demo=panel">Abrir demostración <b>→</b></a></article></div>
      </div>
      <div className="concept-modules" id="modulos">
        <header><p>Lo que encontrás al ingresar</p><h2>Todo tu evento,<br /><em>en un solo lugar.</em></h2><div><p>No son herramientas sueltas. La información de cada módulo se conecta para evitar repetir tareas y reducir errores.</p><a href="/?demo=panel">Recorrer la demostración →</a></div></header>
        <div className="concept-module-grid">{platformModules.map((module, index) => <article key={module.name} className={module.upcoming ? 'is-upcoming' : ''}><div><span>{module.icon}</span><i>{String(index + 1).padStart(2, '0')}</i></div><h3>{module.name}</h3><p>{module.text}</p>{module.upcoming ? <small>PRÓXIMAMENTE</small> : <a href={`/?demo=panel&modulo=${encodeURIComponent(module.demo || 'Resumen')}`}>Ver en la demo <span>→</span></a>}</article>)}</div>
      </div>
    </section>

    <section className="concept-audiences" id="para-quien">
      <article className="concept-host">
        <div className="concept-audience-photo"><img src="/concept/planner-heart-polaroids-v2.png" alt="Álbum de evento con un corazón dorado y recuerdos de distintas celebraciones" /><span>PARA NOVIOS, QUINCEAÑERAS Y ANFITRIONES</span></div>
        <div className="concept-audience-copy"><p>Organizo mi propio evento</p><h2>Disfrutá más.<br />Coordiná menos.</h2><ul><li>Invitación y comunicados</li><li>Confirmaciones y acompañantes</li><li>Regalos, canciones y detalles</li><li>Mesas y zonas Living</li></ul><a href="/admin">Quiero crear mi evento →</a></div>
      </article>
      <article className="concept-pro" id="organizadores">
        <div className="concept-pro-board"><span className="board-label">EVENTOS ACTIVOS</span><strong>Todo lo importante,<br />a la vista.</strong><div className="event-row"><i className="coral" /><b>Sofía & Mateo</b><span>15 pendientes</span></div><div className="event-row"><i className="mint" /><b>Quince de Juanita</b><span>Mesas listas</span></div><div className="event-row"><i className="gold" /><b>Evento corporativo</b><span>3 proveedores</span></div></div>
        <div className="concept-audience-copy"><p>Organizo eventos profesionalmente</p><h2>Más eventos.<br />Menos tareas repetidas.</h2><ul><li>Varios eventos en una cuenta</li><li>Invitados, mesas y pendientes</li><li>Accesos para equipo y proveedores</li><li>Información siempre actualizada</li></ul><a href="/admin">Gestionar mis eventos →</a></div>
      </article>
    </section>

    <section className="concept-role-compare" aria-labelledby="role-compare-title"><header><span>04 · COLABORACIÓN SIN RUIDO</span><h2 id="role-compare-title">Cada persona ve<br /><em>sólo lo que necesita.</em></h2><p>La misma plataforma adapta el alcance según la responsabilidad de cada persona dentro del evento.</p></header><div className="concept-role-table"><div className="role-head"><span>ROL</span><b>ALCANCE</b><b>QUÉ PUEDE VER</b></div><div><span>ANFITRIÓN</span><p>Control completo del evento</p><p>Todo el evento</p></div><div><span>ORGANIZADOR</span><p>Gestión y coordinación</p><p>Invitados · Mesas · Equipo</p></div><div><span>PROVEEDOR INVITADO</span><p>Acceso específico</p><p>Su tarea · Su información</p></div><div><span>MODALIDAD</span><p>Plan por evento</p><p>Propuesta por volumen para organizadores</p></div></div><div className="concept-role-actions"><a href="/admin">Soy anfitrión <b>→</b></a><button type="button" onClick={() => setPlansOpen(true)}>Organizo eventos <b>→</b></button></div></section>

    <section className="concept-invitations" id="invitaciones">
      <div className="concept-invite-copy"><p><span>03</span> Creá tu invitación</p><h2>La primera impresión<br />también cuenta.</h2><p>Empezá por una invitación que entusiasme. Personalizá colores, textos, fotos y cada detalle de la experiencia.</p><a className="concept-explore-cta" href="/?catalogo=1">Explorar todas las invitaciones <span>→</span></a></div>
      <div className="concept-invite-stack">{[...invitationPreviews, ...invitationPreviews.slice(0, 6)].map(([src, label], index) => <figure key={`${src}-${index}`} tabIndex={0} style={{ '--card-index': index } as React.CSSProperties}><img src={src} alt={`Invitación ${label}`} /><figcaption>{label}</figcaption></figure>)}</div>
    </section>

    <section className="concept-existing-event" aria-labelledby="existing-event-title">
      <div><span>¿YA EMPEZASTE?</span><h2 id="existing-event-title">Tu evento sigue donde lo dejaste.</h2><p>El pedido y el panel cumplen funciones diferentes. Elegí el acceso que necesitás.</p></div>
      <div className="concept-existing-actions">
        <article><span>SEGUIMIENTO</span><h3>Consultar mi pedido</h3><p>Revisá el estado del pago, la preparación o la publicación de tu invitación.</p><a href="/consultar">Consultar estado <b>→</b></a></article>
        <article><span>GESTIÓN</span><h3>Ingresar a mi evento</h3><p>Entrá al panel para gestionar invitados, módulos, mesas y accesos.</p><a href="/admin">Abrir mi panel <b>→</b></a></article>
      </div>
    </section>

    <section className="concept-trust" aria-labelledby="trust-title"><header><span>CONFIANZA SIN LETRA CHICA</span><h2 id="trust-title">Probalo. Entendelo.<br /><em>Después decidí.</em></h2></header><div><article><b>01</b><h3>Demo sin registro</h3><p>Recorré la plataforma con datos ficticios antes de compartir información propia.</p></article><article><b>02</b><h3>Acceso privado</h3><p>El evento real se protege con los datos del pedido y un código de seguridad.</p></article><article><b>03</b><h3>Permisos por rol</h3><p>Cada persona accede únicamente a los módulos necesarios para su tarea.</p></article><article><b>04</b><h3>Revisión antes de publicar</h3><p>La invitación atraviesa un circuito de borrador, revisión y aprobación.</p></article><article><b>05</b><h3>Soporte humano</h3><p>Podés consultar antes de comenzar o pedir ayuda durante la organización.</p></article></div></section>

    <section className="concept-faq" id="preguntas">
      <div className="concept-faq-heading"><p><span>05</span> Antes de empezar</p><h2>Preguntas simples.<br /><em>Respuestas claras.</em></h2><p>Todo lo importante para decidir cómo querés organizar tu evento.</p><a href="#contacto">¿Tenés otra pregunta? Hablemos →</a></div>
      <div className="concept-faq-list">{frequentlyAskedQuestions.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>{String(index + 1).padStart(2, '0')}</span>{question}<i aria-hidden="true">＋</i></summary><p>{answer}</p></details>)}</div>
    </section>

    <section className="concept-final" id="empezar"><span>Save the date. Save your time.</span><h2>Tu evento puede ser hermoso<br /><em>y fácil de organizar.</em></h2><p>Ingresá al caso real con los datos de tu evento, o recorré una demostración sin guardar información.</p><div><a href="/admin">Crear o ingresar a mi evento</a><a href="/?demo=panel">Probar la plataforma</a><a href="#contacto">Hablar con el equipo</a></div></section>
    <section className="concept-contact" id="contacto"><div><span>CONVERSEMOS</span><h2>Contanos qué estás organizando.</h2><p>Te ayudamos a elegir la mejor forma de gestionar tu evento.</p></div><form onSubmit={submitContact}><label>Nombre<input name="name" autoComplete="name" required /></label><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Mensaje<textarea name="message" rows={4} required /></label><label className="concept-contact-trap" aria-hidden="true">Empresa<input name="company" tabIndex={-1} autoComplete="off" /></label><button type="submit" disabled={contactStatus === 'sending'}>{contactStatus === 'sending' ? 'Enviando…' : 'Enviar consulta →'}</button>{contactStatus === 'success' && <p className="concept-contact-status is-success" role="status">¡Gracias! Tu consulta fue enviada correctamente.</p>}{contactStatus === 'error' && <p className="concept-contact-status is-error" role="alert">No pudimos enviarla. Revisá tu conexión e intentá nuevamente.</p>}</form></section>
    <footer className="concept-footer"><img src="/logo.svg" alt="Save Your Date" /><nav aria-label="Pie de página"><a href="#como-funciona">Cómo funciona</a><a href="/?catalogo=1">Invitaciones</a><a href="#preguntas">Preguntas</a><a href="/consultar">Consultar pedido</a><a href="/admin">Ingresar</a><button onClick={() => setLegalOpen('privacy')}>Privacidad</button><button onClick={() => setLegalOpen('terms')}>Condiciones</button></nav><span>Invitaciones que emocionan. Gestión que simplifica.</span></footer>
    {plansOpen && <div className="concept-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPlansOpen(false); }}><section className="concept-plans-modal" role="dialog" aria-modal="true" aria-labelledby="plans-title"><button className="concept-modal-close" type="button" aria-label="Cerrar planes" onClick={() => setPlansOpen(false)}>×</button><header><span>PLANES</span><h2 id="plans-title">Una forma para cada manera de organizar.</h2><p>Elegí un evento propio o una operación profesional con varios eventos.</p></header><div className="concept-plan-grid"><article><span>PARA UN EVENTO</span><h3>Plan Anfitrión</h3><p>Un evento con control completo para novios, quinceañeras y anfitriones.</p><ul><li>Invitación digital y galería</li><li>Invitados, grupos y confirmaciones</li><li>Restricciones, regalos y canciones</li><li>Mesas y zonas Living</li><li>Comunicados y recordatorios</li><li>Accesos específicos para proveedores</li></ul><div className="concept-plan-status"><b>Incluidos</b><span>Los módulos activos indicados arriba</span><b>Próximamente</b><span>Check-in y álbum colaborativo</span></div><div className="concept-payment-note"><b>Pago y vigencia</b><span>Se informan antes de confirmar el evento. No se realiza ningún cobro desde este modal.</span></div><div className="concept-plan-actions"><a href="/admin">Crear mi evento</a><a href="/?demo=panel">Probar antes</a></div></article><article className="concept-plan-pro"><span>PARA ORGANIZADORES</span><h3>Plan Profesional</h3><p>Varios eventos, equipos y proveedores dentro de una misma operación.</p><ul><li>Todo lo incluido para cada evento</li><li>Vista de múltiples eventos</li><li>Roles para equipo y proveedores</li><li>Procesos reutilizables y seguimiento</li></ul><label>¿Cuántos eventos querés gestionar en 3 meses?<select value={eventsInQuarter} onChange={(event) => setEventsInQuarter(event.target.value)}><option value="1">1 evento</option><option value="3">2 a 3 eventos</option><option value="6">4 a 6 eventos</option><option value="10">7 a 10 eventos</option><option value="more">Más de 10 eventos</option></select></label><div className="concept-payment-note"><b>Propuesta por volumen</b><span>El valor se consulta según la cantidad seleccionada y las necesidades del equipo.</span></div><div className="concept-plan-actions"><a href={`mailto:hola@saveyourdate.site?subject=Consulta plan organizadores&body=Quiero gestionar ${eventsInQuarter} eventos en 3 meses.`}>Consultar propuesta</a><a href="/?demo=panel">Ver la demo</a></div></article></div><p className="concept-plans-footnote">Las funciones marcadas como próximas no forman parte de las funcionalidades activas actuales.</p></section></div>}
    {legalOpen && <div className="concept-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setLegalOpen(null); }}><section className="concept-legal-modal" role="dialog" aria-modal="true"><button className="concept-modal-close" onClick={() => setLegalOpen(null)} aria-label="Cerrar">×</button><span>{legalOpen === 'privacy' ? 'PRIVACIDAD' : 'CONDICIONES DE USO'}</span><h2>{legalOpen === 'privacy' ? 'Tu información merece cuidado.' : 'Un servicio claro desde el comienzo.'}</h2>{legalOpen === 'privacy' ? <><p>El acceso real utiliza datos asociados al pedido y un código de seguridad. La demostración trabaja únicamente con información ficticia.</p><ul><li>Los accesos se limitan según el rol asignado.</li><li>No uses la demo para cargar datos personales reales.</li><li>Las solicitudes sobre datos del evento se gestionan mediante soporte.</li></ul></> : <><p>Este resumen explica el funcionamiento general y no reemplaza las condiciones contractuales definitivas que se informarán antes de contratar.</p><ul><li>Las funciones “Próximamente” no se consideran activas.</li><li>Precio, vigencia, forma de pago y alcance se confirman antes del alta.</li><li>La publicación de la invitación requiere completar el circuito de revisión.</li></ul></>}<a href="mailto:hola@saveyourdate.site">Consultar al equipo →</a></section></div>}
  </main>;
}
