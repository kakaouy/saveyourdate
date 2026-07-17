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

  const sectionLimit = plan === 'basic' ? 5 : 8;
  const photoLimit = plan === 'basic' ? 5 : 8;
  const gallerySelected = sections.includes('gallery');
  const rsvpSelected = sections.includes('rsvp');

  useEffect(() => {
    setModelId(initialModelId);
  }, [initialModelId]);

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
    setSending(true);
    try {
      await sendForm({
        _subject: `Nuevo pedido ${orderNumber} - Save Your Date`,
        'Número de pedido': orderNumber,
        Plan: plan === 'basic' ? 'Básico' : 'Premium',
        Modelo: selectedModel?.title || modelId,
        Secciones: sections.map((id) => SECTION_OPTIONS.find((item) => item.id === id)?.title).filter(Boolean).join(', '),
        'Música de fondo': hasMusic ? String(form.get('music') || 'Sí, a definir') : 'No',
        'Número de operación Mercado Pago': String(form.get('paymentOperation') || 'Pago pendiente'),
        Nombre: String(form.get('name') || ''),
        Email: String(form.get('email') || ''),
        WhatsApp: String(form.get('whatsapp') || ''),
        Evento: String(form.get('eventTitle') || ''),
        Fecha: String(form.get('eventDate') || ''),
        Lugar: String(form.get('eventPlace') || ''),
        Detalles: String(form.get('details') || ''),
        Fotos: gallerySelected ? `${photoCount} seleccionadas para la galería` : 'Sin galería'
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
              <div className="order-block-title"><span>3</span><div><h3>Contanos sobre el evento</h3><p>Completá lo que ya tengas definido.</p></div></div>
              <div className="form-row-2col">
                <div className="form-group"><label className="form-label">Nombre y apellido</label><input name="name" className="form-input" required /></div>
                <div className="form-group"><label className="form-label">WhatsApp</label><input name="whatsapp" className="form-input" type="tel" required /></div>
              </div>
              <div className="form-row-2col">
                <div className="form-group"><label className="form-label">Email</label><input name="email" className="form-input" type="email" required /></div>
                <div className="form-group"><label className="form-label">Título o protagonistas</label><input name="eventTitle" className="form-input" required placeholder="Ej. Ana & Juan" /></div>
              </div>
              <div className="form-row-2col">
                <div className="form-group"><label className="form-label">Fecha</label><input name="eventDate" className="form-input" type="date" /></div>
                <div className="form-group"><label className="form-label">Lugar</label><input name="eventPlace" className="form-input" /></div>
              </div>
              <div className="form-group"><label className="form-label">Otros detalles</label><textarea name="details" className="form-textarea" placeholder="Horarios, direcciones, dress code, regalos y cualquier información importante." /></div>

              <label className="order-toggle-row">
                <input type="checkbox" checked={hasMusic} onChange={(event) => setHasMusic(event.target.checked)} />
                <span><strong>Música de fondo</strong><small>Está disponible en ambos planes y no cuenta como sección.</small></span>
              </label>
              {hasMusic && <div className="form-group order-reveal"><label className="form-label">Canción o enlace</label><input name="music" className="form-input" placeholder="Spotify, YouTube o nombre de la canción" /></div>}

              {gallerySelected && <div className="form-group order-reveal"><label className="form-label">Fotos para la galería (máximo {photoLimit})</label><input className="form-input" type="file" multiple accept="image/*" onChange={(event) => handlePhotos(event.target.files)} /><small>{photoCount} foto(s) seleccionada(s).</small>{photoError && <p className="order-error">{photoError}</p>}</div>}
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
      </div>
    </section>
  );
}
