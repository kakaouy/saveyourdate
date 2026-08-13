import './platform-landing-concept.css';

const invitationPreviews = [
  ['/previews/aurora.png', 'Aurora'],
  ['/previews/astraea.png', 'Astraea'],
  ['/previews/rosewood.png', 'Rosewood'],
];

export default function PlatformLandingConcept() {
  return <main className="platform-concept">
    <header className="concept-nav">
      <a className="concept-brand" href="/"><img src="/logo.svg" alt="Save Your Date" /></a>
      <nav aria-label="Principal"><a href="#como-funciona">Cómo funciona</a><a href="#para-quien">Para quién es</a><a href="#invitaciones">Invitaciones</a></nav>
      <div><a className="concept-login" href="/admin">Ingresar</a><a className="concept-nav-cta" href="#empezar">Crear mi evento</a></div>
    </header>

    <section className="concept-hero">
      <div className="concept-hero-copy">
        <p className="concept-kicker"><span>01</span> Tu evento empieza acá</p>
        <h1>Lo lindo se ve.<br /><em>Todo lo demás</em><br />queda organizado.</h1>
        <p className="concept-lead">Creá la invitación, gestioná invitados y compartí cada detalle sin vivir entre planillas y mensajes.</p>
        <div className="concept-actions"><a href="#empezar">Crear mi evento <span>→</span></a><a href="#organizadores">Organizo eventos</a></div>
        <p className="concept-proof"><b>Una sola plataforma</b><span>Invitación · Comunicados · RSVP · Mesas · Proveedores</span></p>
      </div>

      <div className="concept-worktable" aria-label="Invitación y herramientas de gestión conectadas">
        <div className="concept-paper-note"><span>TODO EN ORDEN</span><b>258</b><small>personas confirmadas</small></div>
        <div className="concept-phone">
          <div className="concept-phone-notch" />
          <img src="/previews/rosewood.png" alt="Vista de una invitación digital" />
        </div>
        <div className="concept-rsvp-slip"><span>RSVP</span><strong>Valentina confirmó</strong><small>2 personas · Menú clásico</small><i>✓</i></div>
        <div className="concept-seating-card"><span>PLANO DEL EVENTO</span><strong>Mesas & Living</strong><div><i>M1</i><i>M2</i><i className="living">Living<br /><small>sin límite</small></i></div></div>
        <div className="concept-vendor-tag"><span>ACCESO COMPARTIDO</span><strong>Catering</strong><small>Lista y restricciones actualizadas</small></div>
        <span className="concept-thread thread-one" /><span className="concept-thread thread-two" />
      </div>
      <div className="concept-scroll">DESLIZÁ PARA DESCUBRIR <span>↓</span></div>
    </section>

    <section className="concept-less" aria-label="Beneficios principales">
      <p>Menos <s>planillas</s>.</p><p>Menos <s>mensajes perdidos</s>.</p><p>Menos <s>errores</s>.</p>
      <strong>Más tiempo para vivir el evento.</strong>
    </section>

    <section className="concept-flow" id="como-funciona">
      <div className="concept-section-heading"><p><span>02</span> Todo conectado</p><h2>La información se carga una vez.<br /><em>Después, trabaja para vos.</em></h2></div>
      <div className="concept-flow-line">
        <article><b>01</b><span>✦</span><h3>Creá</h3><p>Tu evento y una invitación que se sienta propia.</p></article>
        <article><b>02</b><span>↗</span><h3>Comunicá</h3><p>Horarios, regalos, novedades y recordatorios.</p></article>
        <article><b>03</b><span>♡</span><h3>Recibí</h3><p>Confirmaciones, acompañantes y restricciones.</p></article>
        <article><b>04</b><span>▦</span><h3>Organizá</h3><p>Mesas, Living, equipo y proveedores.</p></article>
      </div>
    </section>

    <section className="concept-audiences" id="para-quien">
      <article className="concept-host">
        <div className="concept-audience-photo"><img src="/siena/images/foto-portada.png" alt="Celebración en un campo de flores" /><span>PARA NOVIOS, QUINCEAÑERAS Y ANFITRIONES</span></div>
        <div className="concept-audience-copy"><p>Organizo mi propio evento</p><h2>Disfrutá más.<br />Coordiná menos.</h2><ul><li>Invitación y comunicados</li><li>Confirmaciones y acompañantes</li><li>Regalos, canciones y detalles</li><li>Mesas y zonas Living</li></ul><a href="#empezar">Quiero crear mi evento →</a></div>
      </article>
      <article className="concept-pro" id="organizadores">
        <div className="concept-pro-board"><span className="board-label">EVENTOS ACTIVOS</span><strong>Todo lo importante,<br />a la vista.</strong><div className="event-row"><i className="coral" /><b>Sofía & Mateo</b><span>15 pendientes</span></div><div className="event-row"><i className="mint" /><b>Quince de Juanita</b><span>Mesas listas</span></div><div className="event-row"><i className="gold" /><b>Evento corporativo</b><span>3 proveedores</span></div></div>
        <div className="concept-audience-copy"><p>Organizo eventos profesionalmente</p><h2>Más eventos.<br />Menos tareas repetidas.</h2><ul><li>Varios eventos en una cuenta</li><li>Invitados, mesas y pendientes</li><li>Accesos para equipo y proveedores</li><li>Información siempre actualizada</li></ul><a href="#empezar">Gestionar mis eventos →</a></div>
      </article>
    </section>

    <section className="concept-invitations" id="invitaciones">
      <div className="concept-invite-copy"><p><span>03</span> La chuchería</p><h2>La primera impresión<br />también cuenta.</h2><p>Empezá por una invitación que entusiasme. Personalizá colores, textos, fotos y cada detalle de la experiencia.</p><a href="/?builder=aurora">Explorar invitaciones →</a></div>
      <div className="concept-invite-stack">{invitationPreviews.map(([src, label], index) => <figure key={src} style={{ '--card-index': index } as React.CSSProperties}><img src={src} alt={`Invitación ${label}`} /><figcaption>{label}</figcaption></figure>)}</div>
    </section>

    <section className="concept-collaboration">
      <div><p><span>04</span> Colaboración sin ruido</p><h2>Cada persona ve<br /><em>sólo lo que necesita.</em></h2></div>
      <div className="concept-permission-list"><article><b>ANFITRIÓN</b><span>Control completo del evento</span><i>Todo el evento</i></article><article><b>ORGANIZADOR</b><span>Gestión y coordinación</span><i>Invitados · Mesas · Equipo</i></article><article><b>PROVEEDOR INVITADO</b><span>Acceso específico</span><i>Su tarea · Su información</i></article></div>
    </section>

    <section className="concept-final" id="empezar"><span>Save the date. Save your time.</span><h2>Tu evento puede ser hermoso<br /><em>y fácil de organizar.</em></h2><div><a href="/?builder=aurora">Crear mi evento</a><a href="mailto:hola@saveyourdate.site?subject=Quiero gestionar eventos">Hablar con el equipo</a></div></section>
    <footer className="concept-footer"><img src="/logo.svg" alt="Save Your Date" /><p>Invitaciones que emocionan. Gestión que simplifica.</p><span>Concepto de portada · 2026</span></footer>
  </main>;
}
