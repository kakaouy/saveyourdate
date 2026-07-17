import { useEffect, useMemo, useState } from 'react';
import type { InvitationModel } from '../data/models';

type Plan = 'basic' | 'premium';
type FlowTab = 'new' | 'payment';

const PAYMENT_LINKS: Record<Plan, string> = {
  basic: '',
  premium: ''
};

const SECTION_OPTIONS = [
  { id: 'countdown', title: 'Cuenta regresiva', description: 'Contador dinámico hasta el día del evento.' },
  { id: 'agenda', title: 'Agenda o itinerario', description: 'Horarios y momentos importantes del evento.' },
  { id: 'location', title: 'Ubicación y mapa', description: 'Dirección, Google Maps o Waze.' },
  { id: 'rsvp', title: 'Confirmación de asistencia', description: 'Incluye Google Sheets, link de envío, restricciones alimentarias y cédula para control de ingreso.' },
  { id: 'gallery', title: 'Galería de fotos', description: 'Hasta 5 fotos en Básico y hasta 8 en Premium.' },
  { id: 'gifts', title: 'Regalos', description: 'Alias, cuenta bancaria o lista de regalos.' },
  { id: 'dresscode', title: 'Código de vestimenta', description: 'Dress code y recomendaciones para los invitados.' },
  { id: 'playlist', title: 'Playlist', description: 'Sugerencias de canciones de los invitados.' },
  { id: 'instagram', title: 'Instagram y hashtag', description: 'Usuario, hashtag o álbum compartido.' },
  { id: 'messages', title: 'Muro de saludos', description: 'Mensajes y buenos deseos para los anfitriones.' }
];

const createOrderNumber = () => `SYD-${Date.now().toString().slice(-6)}`;

interface OrderFlowProps {
  models: InvitationModel[];
  initialModelId: string;
}

export default function OrderFlow({ models, initialModelId }: OrderFlowProps) {
  const [started, setStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<FlowTab>('new');
  const [plan, setPlan] = useState<Plan>('basic');
  const [modelId, setModelId] = useState(initialModelId);
  const [sections, setSections] = useState<string[]>([]);
  const [hasMusic, setHasMusic] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [photoError, setPhotoError] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState('');
  const [paymentUpdated, setPaymentUpdated] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#ff6f91');

  const sectionLimit = plan === 'basic' ? 5 : 8;
  const photoLimit = plan === 'basic' ? 5 : 8;
  const gallerySelected = sections.includes('gallery');
  const rsvpSelected = sections.includes('rsvp');

  useEffect(() => {
    setModelId(initialModelId);
  }, [initialModelId]);

  useEffect(() => {
    const startOrder = () => { setStarted(true); setActiveTab('new'); };
    window.addEventListener('start-saveyourdate-order', startOrder);
    return () => window.removeEventListener('start-saveyourdate-order', startOrder);
  }, []);

  useEffect(() => {
    if (sections.length > sectionLimit) setSections((current) => current.slice(0, sectionLimit));
    if (photoCount > photoLimit) {
      setPhotoCount(0);
      setPhotoError(`Este plan admite hasta ${photoLimit} fotos.`);
    }
  }, [plan, sectionLimit, photoCount, photoLimit, sections.length]);

  const selectedModel = useMemo(() => models.find((model) => model.id === modelId), [models, modelId]);

  const toggleSection = (sectionId: string) => {
    setSections((current) => {
      if (current.includes(sectionId)) return current.filter((id) => id !== sectionId);
      if (current.length >= sectionLimit) return current;
      return [...current, sectionId];
    });
  };

  const handlePhotos = (files: FileList | null) => {
    const count = files?.length || 0;
    setPhotoCount(count);
    setPhotoError(count > photoLimit ? `Podés seleccionar hasta ${photoLimit} fotos en el Plan ${plan === 'basic' ? 'Básico' : 'Premium'}.` : '');
  };

  const sendForm = async (payload: Record<string, string>) => {
    await fetch('https://formsubmit.co/ajax/saveyourdate.invite@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
  };

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (photoCount > photoLimit) return;
    const form = new FormData(event.currentTarget);
    const orderNumber = createOrderNumber();
    form.append('_subject', `Nuevo pedido ${orderNumber} - Save Your Date`);
    form.append('Número de pedido', orderNumber);
    form.append('Plan', plan === 'basic' ? 'Básico' : 'Premium');
    form.append('Modelo', selectedModel?.title || modelId);
    form.append('Color elegido', selectedColor);
    form.append('Secciones', sections.map((id) => SECTION_OPTIONS.find((item) => item.id === id)?.title).filter(Boolean).join(', '));
    form.append('Música de fondo', hasMusic ? String(form.get('music') || 'Sí, a definir') : 'No');
    form.append('Estado del pago', form.get('paymentOperation') ? 'Pago informado' : 'Pago pendiente');
    setSending(true);
    try {
      await fetch('https://formsubmit.co/ajax/saveyourdate.invite@gmail.com', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: form
      });
      setSubmittedOrder(orderNumber);
    } finally {
      setSending(false);
    }
  };

  const submitPaymentUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSending(true);
    try {
      await sendForm({
        _subject: `Pago informado para ${String(form.get('orderNumber') || '')}`,
        'Número de pedido': String(form.get('orderNumber') || ''),
        'Número de operación Mercado Pago': String(form.get('paymentOperation') || ''),
        'Email o WhatsApp del pedido': String(form.get('contact') || ''),
        Estado: 'Pago informado - pendiente de validación interna'
      });
      setPaymentUpdated(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="crear" className="order-flow-section">
      <div className="container">
        <div className="section-header order-flow-heading">
          <span className="section-subtitle">Tu invitación, a tu manera</span>
          <h2 className="section-title">Creá tu invite</h2>
          <p className="section-desc">Podés enviar todos los datos ahora y pagar después. La invitación se libera cuando validamos internamente el pago.</p>
        </div>

        {!started ? (
          <div className="order-start-card">
            <h3>¿Qué querés hacer?</h3>
            <p>El formulario aparece únicamente cuando iniciás un pedido o necesitás informar el pago de uno existente.</p>
            <div className="order-start-actions">
              <button className="btn-primary" onClick={() => { setStarted(true); setActiveTab('new'); }}>Iniciar mi pedido</button>
              <button className="btn-secondary" onClick={() => { setStarted(true); setActiveTab('payment'); }}>Ya creé mi invite</button>
            </div>
          </div>
        ) : <>
        <div className="order-flow-tabs" role="tablist">
          <button className={activeTab === 'new' ? 'active' : ''} onClick={() => setActiveTab('new')}>Creá tu invite</button>
          <button className={activeTab === 'payment' ? 'active' : ''} onClick={() => setActiveTab('payment')}>Ya creaste tu invite</button>
        </div>

        {activeTab === 'new' && (submittedOrder ? (
          <div className="order-success-card">
            <span>✓</span>
            <h3>¡Recibimos tu pedido!</h3>
            <p>Guardá este número para consultar o informar el pago más adelante.</p>
            <strong>{submittedOrder}</strong>
            <p className="order-status-note">Estado inicial: pedido recibido. La publicación final se libera después de validar el pago.</p>
            <button className="btn-secondary" onClick={() => { setActiveTab('payment'); setPaymentUpdated(false); }}>Informar un pago</button>
          </div>
        ) : (
          <form className="order-form" onSubmit={submitOrder}>
            <div className="order-form-block">
              <div className="order-block-title"><span>1</span><div><h3>Elegí tu plan</h3><p>La portada está incluida y no cuenta como sección.</p></div></div>
              <div className="order-plan-grid">
                <button type="button" className={`order-plan-card ${plan === 'basic' ? 'active' : ''}`} onClick={() => setPlan('basic')}>
                  <small>PLAN</small><h4>Básico</h4><strong>Hasta 5 secciones</strong><p>Galería de hasta 5 fotos si la elegís.</p>
                </button>
                <button type="button" className={`order-plan-card ${plan === 'premium' ? 'active' : ''}`} onClick={() => setPlan('premium')}>
                  <small>PLAN</small><h4>Premium</h4><strong>Hasta 8 secciones</strong><p>Galería de hasta 8 fotos si la elegís.</p>
                </button>
              </div>
            </div>

            <div className="order-form-block">
              <div className="order-block-title"><span>2</span><div><h3>Elegí el modelo y las secciones</h3><p>{sections.length} de {sectionLimit} secciones seleccionadas.</p></div></div>
              <label className="form-label" htmlFor="order-model">Modelo de invitación</label>
              <select id="order-model" className="form-select" value={modelId} onChange={(event) => setModelId(event.target.value)}>
                {models.map((model) => <option key={model.id} value={model.id}>{model.title}</option>)}
              </select>
              <div className="order-color-field">
                <span className="form-label">Color principal de la invitación</span>
                <p>Elegilo cuando el modelo admita cambio de paleta. Lo confirmaremos al revisar el pedido.</p>
                <div className="order-color-options">
                  {[
                    ['#ff6f91', 'Rosa'], ['#ff9671', 'Coral'], ['#ffc75f', 'Amarillo'],
                    ['#73c6b6', 'Verde'], ['#1e2733', 'Azul noche'], ['#b9a38f', 'Arena']
                  ].map(([color, label]) => (
                    <button type="button" key={color} className={selectedColor === color ? 'active' : ''} onClick={() => setSelectedColor(color)} aria-label={`Elegir ${label}`}>
                      <span style={{ background: color }}></span>{label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="order-sections-grid">
                {SECTION_OPTIONS.map((section) => {
                  const selected = sections.includes(section.id);
                  const disabled = !selected && sections.length >= sectionLimit;
                  return (
                    <button type="button" key={section.id} disabled={disabled} className={`order-section-option ${selected ? 'active' : ''}`} onClick={() => toggleSection(section.id)}>
                      <span className="order-section-check">{selected ? '✓' : '+'}</span>
                      <span><strong>{section.title}</strong><small>{section.description}</small></span>
                    </button>
                  );
                })}
              </div>
              {rsvpSelected && <div className="rsvp-included-note"><strong>RSVP completo incluido</strong><span>Google Sheets · link de envío · restricciones alimentarias para catering · cédula para control de ingreso.</span></div>}
            </div>

            <div className="order-form-block">
              <div className="order-block-title"><span>3</span><div><h3>Completá todos los datos</h3><p>Los campos cambian según las secciones que elegiste.</p></div></div>
              <div className="form-row-2col">
                <div className="form-group"><label className="form-label">Nombre y apellido</label><input name="name" className="form-input" required /></div>
                <div className="form-group"><label className="form-label">WhatsApp</label><input name="whatsapp" className="form-input" type="tel" required /></div>
              </div>
              <div className="form-row-2col">
                <div className="form-group"><label className="form-label">Email</label><input name="email" className="form-input" type="email" required /></div>
                <div className="form-group"><label className="form-label">Título o protagonistas</label><input name="eventTitle" className="form-input" required placeholder="Ej. Ana & Juan" /></div>
              </div>
              <div className="form-row-2col">
                <div className="form-group"><label className="form-label">Fecha principal del evento</label><input name="eventDate" className="form-input" type="date" required /></div>
                <div className="form-group"><label className="form-label">Hora principal</label><input name="eventTime" className="form-input" type="time" required /></div>
              </div>
              <div className="form-group"><label className="form-label">Foto principal o imagen de portada</label><input name="coverImage" className="form-input" type="file" accept="image/*" /><small>Podés subirla ahora o dejarla pendiente si el modelo no lleva fotografía.</small></div>

              {sections.includes('countdown') && <div className="dynamic-section-fields"><h4>Cuenta regresiva</h4><div className="form-row-2col"><div className="form-group"><label className="form-label">Fecha objetivo</label><input name="countdownDate" className="form-input" type="date" required /></div><div className="form-group"><label className="form-label">Hora objetivo</label><input name="countdownTime" className="form-input" type="time" required /></div></div><div className="form-group"><label className="form-label">Título del contador</label><input name="countdownTitle" className="form-input" required placeholder="Ej. Falta muy poco" /></div></div>}

              {sections.includes('agenda') && <div className="dynamic-section-fields"><h4>Agenda o itinerario</h4><p>Indicá cada momento con hora, título, lugar y una breve descripción.</p>{[1, 2, 3].map((item) => <div className="agenda-row" key={item}><input name={`agenda${item}Time`} className="form-input" type="time" required={item === 1} /><input name={`agenda${item}Title`} className="form-input" required={item === 1} placeholder={`Momento ${item}${item > 1 ? ' (opcional)' : ''}`} /><input name={`agenda${item}Place`} className="form-input" required={item === 1} placeholder="Lugar" /></div>)}</div>}

              {sections.includes('location') && <div className="dynamic-section-fields"><h4>Ubicación y mapa</h4><div className="form-group"><label className="form-label">Nombre del lugar</label><input name="locationName" className="form-input" required /></div><div className="form-group"><label className="form-label">Dirección completa</label><input name="locationAddress" className="form-input" required /></div><div className="form-group"><label className="form-label">Link de Google Maps o Waze</label><input name="locationMap" className="form-input" type="url" required placeholder="https://..." /></div></div>}

              {sections.includes('rsvp') && <div className="dynamic-section-fields"><h4>Confirmación de asistencia</h4><div className="form-row-2col"><div className="form-group"><label className="form-label">Fecha límite para confirmar</label><input name="rsvpDeadline" className="form-input" type="date" required /></div><div className="form-group"><label className="form-label">Cantidad máxima por invitación</label><input name="rsvpMaxGuests" className="form-input" type="number" min="1" required /></div></div><div className="form-group"><label className="form-label">Texto o indicaciones para confirmar</label><textarea name="rsvpInstructions" className="form-textarea" required placeholder="Ej. Confirmar antes del 10 de octubre." /></div><p className="dynamic-help">La planilla incluirá nombre, asistencia, acompañantes, restricciones alimentarias y cédula de identidad.</p></div>}

              {sections.includes('gifts') && <div className="dynamic-section-fields"><h4>Regalos</h4><p>Podés agregar hasta 3 cuentas bancarias, listas o lugares de compra.</p>{[1, 2, 3].map((item) => <div className="gift-row" key={item}><select name={`gift${item}Type`} className="form-select" required={item === 1}><option value="">Tipo {item}</option><option>Cuenta bancaria</option><option>Link de compra</option><option>Lista de regalos</option><option>Otro</option></select><input name={`gift${item}Label`} className="form-input" required={item === 1} placeholder={`Banco, tienda o título${item > 1 ? ' (opcional)' : ''}`} /><input name={`gift${item}Detail`} className="form-input" required={item === 1} placeholder="Alias, número de cuenta o link" /></div>)}</div>}

              {sections.includes('dresscode') && <div className="dynamic-section-fields"><h4>Código de vestimenta</h4><div className="form-group"><label className="form-label">Tipo de vestimenta</label><input name="dressCode" className="form-input" required placeholder="Ej. Elegante sport" /></div><div className="form-group"><label className="form-label">Aclaraciones</label><textarea name="dressCodeDetails" className="form-textarea" required placeholder="Colores, calzado, prendas que se deben evitar, etc." /></div></div>}

              {sections.includes('playlist') && <div className="dynamic-section-fields"><h4>Playlist</h4><div className="form-group"><label className="form-label">Link de Spotify o plataforma</label><input name="playlistLink" className="form-input" type="url" required /></div><div className="form-group"><label className="form-label">Texto para pedir canciones</label><input name="playlistPrompt" className="form-input" required placeholder="Ej. Ayudanos a armar la música de la fiesta" /></div></div>}

              {sections.includes('instagram') && <div className="dynamic-section-fields"><h4>Instagram y hashtag</h4><div className="form-row-2col"><div className="form-group"><label className="form-label">Usuario de Instagram</label><input name="instagramUser" className="form-input" required placeholder="@usuario" /></div><div className="form-group"><label className="form-label">Hashtag</label><input name="instagramHashtag" className="form-input" required placeholder="#NuestroEvento" /></div></div></div>}

              {sections.includes('messages') && <div className="dynamic-section-fields"><h4>Muro de saludos</h4><div className="form-group"><label className="form-label">Título de la sección</label><input name="messagesTitle" className="form-input" required placeholder="Ej. Dejanos un mensaje" /></div><div className="form-group"><label className="form-label">Consigna para los invitados</label><textarea name="messagesPrompt" className="form-textarea" required /></div></div>}

              <label className="order-toggle-row">
                <input type="checkbox" checked={hasMusic} onChange={(event) => setHasMusic(event.target.checked)} />
                <span><strong>Música de fondo</strong><small>Está disponible en ambos planes y no cuenta como sección.</small></span>
              </label>
              {hasMusic && <div className="form-group order-reveal"><label className="form-label">Canción o enlace</label><input name="music" className="form-input" required placeholder="Spotify, YouTube o nombre de la canción" /></div>}

              {gallerySelected && <div className="form-group order-reveal"><label className="form-label">Fotos para la galería (máximo {photoLimit})</label><input name="galleryPhotos" className="form-input" type="file" multiple accept="image/*" required onChange={(event) => handlePhotos(event.target.files)} /><small>{photoCount} foto(s) seleccionada(s).</small>{photoError && <p className="order-error">{photoError}</p>}</div>}
            </div>

            <div className="order-form-block order-payment-choice">
              <div className="order-block-title"><span>4</span><div><h3>Pago, ahora o después</h3><p>No necesitás pagar para enviar el pedido.</p></div></div>
              <div className="order-payment-actions">
                {PAYMENT_LINKS[plan] ? (
                  <a href={PAYMENT_LINKS[plan]} target="_blank" rel="noopener noreferrer" className="mercado-pago-link">Pagar Plan {plan === 'basic' ? 'Básico' : 'Premium'} con Mercado Pago ↗</a>
                ) : (
                  <div className="mercado-pago-link payment-link-pending">Link de pago del Plan {plan === 'basic' ? 'Básico' : 'Premium'} pendiente de configurar</div>
                )}
                <div className="form-group"><label className="form-label">Si ya pagaste, pegá el número de operación</label><input name="paymentOperation" className="form-input" placeholder="Ej. 12345678901 (opcional)" /></div>
              </div>
            </div>

            <button className="btn-form-submit order-submit" type="submit" disabled={sending || sections.length === 0 || !!photoError}>{sending ? 'Enviando pedido…' : 'Enviar mi pedido'}</button>
          </form>
        ))}

        {activeTab === 'payment' && (paymentUpdated ? (
          <div className="order-success-card"><span>✓</span><h3>Pago informado</h3><p>Recibimos el número de operación. Lo verificaremos internamente y actualizaremos el estado de tu pedido.</p><strong>Pendiente de validación</strong></div>
        ) : (
          <form className="order-form payment-update-form" onSubmit={submitPaymentUpdate}>
            <div className="order-form-block">
              <div className="order-block-title"><span>✓</span><div><h3>Informá el pago de un pedido existente</h3><p>No necesitás volver a cargar los datos de tu invitación.</p></div></div>
              <div className="form-group"><label className="form-label">Número de pedido</label><input name="orderNumber" className="form-input" required placeholder="SYD-123456" pattern="SYD-[0-9]{6}" /></div>
              <div className="form-group"><label className="form-label">Número de operación de Mercado Pago</label><input name="paymentOperation" className="form-input" required /></div>
              <div className="form-group"><label className="form-label">Email o WhatsApp usado en el pedido</label><input name="contact" className="form-input" required /></div>
              <button className="btn-form-submit" type="submit" disabled={sending}>{sending ? 'Enviando…' : 'Enviar número de operación'}</button>
            </div>
          </form>
        ))}
        </>}
      </div>
    </section>
  );
}
