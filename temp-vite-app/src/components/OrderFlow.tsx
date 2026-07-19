import { useEffect, useMemo, useState } from 'react';
import type { InvitationModel } from '../data/models';

type Plan = 'basic' | 'premium';
type FlowTab = 'new' | 'pay-first' | 'payment';
type EventCategory = InvitationModel['category'];
type Language = 'es' | 'en' | 'pt';

const PAYMENT_LINKS: Record<Plan, string> = {
  basic: 'https://mpago.la/1gRs45Z',
  premium: 'https://mpago.la/1de2PiW'
};

const PLAN_PRICES: Record<Plan, string> = {
  basic: '$ 2.000 UYU',
  premium: '$ 3.000 UYU'
};

const SECTION_OPTIONS = [
  { id: 'countdown', title: 'Cuenta regresiva', description: 'Contador dinámico hasta el día del evento.' },
  { id: 'quote', title: 'Frase', description: 'Frase o texto destacado dentro de la invitación.' },
  { id: 'featuredPhoto', title: 'Foto destacada', description: 'Imagen importante con efecto parallax.' },
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
  initialPaletteColor?: string;
  lang: Language;
}

export default function OrderFlow({ models, initialModelId, initialPaletteColor, lang }: OrderFlowProps) {
  const l = (es: string, en: string, pt: string) => lang === 'es' ? es : lang === 'en' ? en : pt;
  const [started, setStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<FlowTab>('new');
  const [plan, setPlan] = useState<Plan>('basic');
  const [modelId, setModelId] = useState(initialModelId);
  const [eventCategory, setEventCategory] = useState<EventCategory>(() => models.find((model) => model.id === initialModelId)?.category || 'wedding');
  const [sections, setSections] = useState<string[]>([]);
  const [hasMusic, setHasMusic] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [photoError, setPhotoError] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState('');
  const [paymentUpdated, setPaymentUpdated] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [prepayment, setPrepayment] = useState({ name: '', email: '', whatsapp: '', operation: '' });
  const [selectedColor, setSelectedColor] = useState('#ff6f91');

  const sectionLimit = plan === 'basic' ? 5 : 8;
  const photoLimit = plan === 'basic' ? 5 : 8;
  const selectedModel = useMemo(() => models.find((model) => model.id === modelId), [models, modelId]);
  const defaultSections = selectedModel?.includedSections || [];
  const activeSections = useMemo(
    () => new Set(sections),
    [sections]
  );
  const galleryIncludedWithDesign =
    defaultSections.includes('gallery');
  const countedSections = useMemo(
    () => sections.filter(
      (sectionId) =>
        sectionId !== 'music' &&
        !(
          sectionId === 'gallery' &&
          galleryIncludedWithDesign
        )
    ),
    [sections, galleryIncludedWithDesign]
  );
  const usedSectionCount = countedSections.length;
  const gallerySelected = activeSections.has('gallery');
  const rsvpSelected = activeSections.has('rsvp');
  const sectionOptions = useMemo(() => SECTION_OPTIONS.map((section) => {
    const translations: Record<string, [string, string, string, string, string, string]> = {
      quote: ['Frase', 'Quote', 'Frase', 'Frase o texto destacado dentro de la invitación.', 'Highlighted quote or text inside the invitation.', 'Frase ou texto destacado dentro do convite.'],
      featuredPhoto: ['Foto destacada', 'Featured photo', 'Foto destacada', 'Imagen importante con efecto parallax.', 'Important image with a parallax effect.', 'Imagem importante com efeito parallax.'],
      countdown: ['Cuenta regresiva', 'Countdown', 'Contagem regressiva', 'Contador dinámico hasta el día del evento.', 'Dynamic countdown to the event date.', 'Contador dinâmico até o dia do evento.'],
      agenda: ['Agenda o itinerario', 'Schedule or itinerary', 'Agenda ou itinerário', 'Horarios y momentos importantes del evento.', 'Times and important moments of the event.', 'Horários e momentos importantes do evento.'],
      location: ['Ubicación y mapa', 'Location and map', 'Localização e mapa', 'Dirección, Google Maps o Waze.', 'Address, Google Maps or Waze.', 'Endereço, Google Maps ou Waze.'],
      rsvp: ['Confirmación de asistencia', 'RSVP', 'Confirmação de presença', 'Incluye Google Sheets, link de envío, restricciones alimentarias y cédula para control de ingreso.', 'Includes Google Sheets, sending link, dietary restrictions and ID for access control.', 'Inclui Google Sheets, link de envio, restrições alimentares e documento para controle de entrada.'],
      gallery: ['Galería de fotos', 'Photo gallery', 'Galeria de fotos', 'Hasta 5 fotos en Básico y hasta 8 en Premium.', 'Up to 5 photos in Basic and 8 in Premium.', 'Até 5 fotos no Básico e 8 no Premium.'],
      gifts: ['Regalos', 'Gifts', 'Presentes', 'Alias, cuenta bancaria o lista de regalos.', 'Bank details, registry or gift list.', 'Dados bancários, lista ou sugestões de presentes.'],
      dresscode: ['Código de vestimenta', 'Dress code', 'Código de vestimenta', 'Dress code y recomendaciones para los invitados.', 'Dress code and recommendations for guests.', 'Código de vestimenta e recomendações para os convidados.'],
      playlist: ['Playlist', 'Playlist', 'Playlist', 'Sugerencias de canciones de los invitados.', 'Song suggestions from guests.', 'Sugestões de músicas dos convidados.'],
      instagram: ['Instagram y hashtag', 'Instagram and hashtag', 'Instagram e hashtag', 'Usuario, hashtag o álbum compartido.', 'Username, hashtag or shared album.', 'Usuário, hashtag ou álbum compartilhado.'],
      messages: ['Muro de saludos', 'Message wall', 'Mural de mensagens', 'Mensajes y buenos deseos para los anfitriones.', 'Messages and wishes for the hosts.', 'Mensagens e votos para os anfitriões.']
    };
    const copy = translations[section.id];
    return { ...section, title: l(copy[0], copy[1], copy[2]), description: l(copy[3], copy[4], copy[5]) };
  }), [lang]);

  useEffect(() => {
    setModelId(initialModelId);
    const initialModel = models.find((model) => model.id === initialModelId);
    if (initialModel) setEventCategory(initialModel.category);
  }, [initialModelId, models]);

  useEffect(() => {
    const startOrder = (event: Event) => {
      const requestedPlan = (event as CustomEvent<{ plan?: Plan }>).detail?.plan;
      if (requestedPlan) setPlan(requestedPlan);
      setStarted(true);
      setActiveTab('new');
    };
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

  const filteredModels = useMemo(() => models.filter((model) => model.category === eventCategory), [models, eventCategory]);
  const availableColors = useMemo(
    () => selectedModel?.palettes?.length
      ? selectedModel.palettes
      : [
          { id: 'rosa', name: 'Rosa', color: '#ff6f91' },
          { id: 'coral', name: 'Coral', color: '#ff9671' },
          { id: 'amarillo', name: 'Amarillo', color: '#ffc75f' },
          { id: 'verde', name: 'Verde', color: '#73c6b6' },
          { id: 'azul-noche', name: 'Azul noche', color: '#1e2733' },
          { id: 'arena', name: 'Arena', color: '#b9a38f' }
        ],
    [selectedModel]
  );

  const paletteName = (option: { id: string; name: string }) => {
    const names: Record<string, [string, string, string]> = {
      eucalipto: ['Eucalipto y dorado', 'Eucalyptus & gold', 'Eucalipto e dourado'],
      oliva: ['Oliva y champagne', 'Olive & champagne', 'Oliva e champanhe'],
      petroleo: ['Petróleo y arena', 'Petrol blue & sand', 'Azul petróleo e areia']
    };
    const translated = names[option.id];
    return translated ? l(translated[0], translated[1], translated[2]) : option.name;
  };

  useEffect(() => {
    const defaults =
      (selectedModel?.includedSections || [])
        .filter((sectionId) => sectionId !== 'music');

    setSections(defaults);
    setHasMusic(
      selectedModel?.includedSections?.includes('music') ||
      false
    );

    const countedDefaults =
      defaults.filter(
        (sectionId) =>
          !(
            sectionId === 'gallery' &&
            selectedModel?.includedSections?.includes('gallery')
          )
      );

    setPlan(
      countedDefaults.length > 5
        ? 'premium'
        : 'basic'
    );
  }, [modelId, selectedModel]);

  useEffect(() => {
    if (availableColors.length) {
      const requestedColor = availableColors.find((option) => option.color === initialPaletteColor)?.color;
      setSelectedColor(requestedColor || availableColors[0].color);
    }
  }, [modelId, availableColors, initialPaletteColor]);

  const selectEventCategory = (category: EventCategory) => {
    setEventCategory(category);
    const firstModel = models.find((model) => model.category === category);
    if (firstModel) setModelId(firstModel.id);
  };

  const toggleSection = (sectionId: string) => {
    setSections((current) => {
      if (current.includes(sectionId)) return current.filter((id) => id !== sectionId);
      const isFreeGallery =
        sectionId === 'gallery' &&
        galleryIncludedWithDesign;

      if (
        !isFreeGallery &&
        usedSectionCount >= sectionLimit
      ) {
        return current;
      }

      return [...current, sectionId];
    });
  };

  const handlePhotos = (files: FileList | null) => {
    const count = files?.length || 0;
    setPhotoCount(count);
    setPhotoError(count > photoLimit ? `Podés seleccionar hasta ${photoLimit} fotos en el Plan ${plan === 'basic' ? 'Básico' : 'Premium'}.` : '');
  };

  const sendFormData = async (form: FormData) => {
    const response = await fetch('https://formsubmit.co/ajax/saveyourdate.invite@gmail.com', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: form
    });
    const result = await response.json().catch(() => null) as { success?: boolean | string; message?: string } | null;
    if (!response.ok || !result || (result.success !== true && result.success !== 'true')) {
      throw new Error(result?.message || 'No se pudo enviar el formulario.');
    }
  };

  const sendForm = async (payload: Record<string, string>) => {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => form.append(key, value));
    form.append('_template', 'table');
    form.append('_captcha', 'false');
    if (payload.Email) form.append('_replyto', payload.Email);
    await sendFormData(form);
  };

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (photoCount > photoLimit) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const fileFieldNames = ['attachment', 'attachment2', 'attachment3'];
    const attachments = fileFieldNames.flatMap((fieldName) =>
      form.getAll(fieldName).filter((value): value is File => value instanceof File && value.size > 0)
    );
    const attachmentSize = attachments.reduce((total, file) => total + file.size, 0);
    const paymentOperation = String(form.get('paymentOperation') || prepayment.operation || '');
    const orderNumber = createOrderNumber();
    setSubmitError('');
    setSending(true);
    try {
      if (attachmentSize > 10 * 1024 * 1024) {
        throw new Error(l('Las imágenes superan el máximo total de 10 MB.', 'The images exceed the 10 MB total limit.', 'As imagens excedem o limite total de 10 MB.'));
      }
      formElement.querySelectorAll('[data-order-generated="true"]').forEach((field) => field.remove());
      const generatedFields: Record<string, string> = {
        _subject: `Nuevo pedido ${orderNumber} - Save Your Date`,
        _template: 'table',
        _captcha: 'false',
        _replyto: String(form.get('email') || ''),
        'Número de pedido': orderNumber,
        'Idioma de la invitación': lang === 'es' ? 'Español' : lang === 'en' ? 'English' : 'Português',
        'Código de idioma': lang,
        Plan: plan === 'basic' ? 'Básico' : 'Premium',
        'Tipo de evento': eventCategory === 'wedding' ? 'Boda' : eventCategory === '15years' ? '15 Años' : 'Otros eventos',
        Modelo: selectedModel?.title || modelId,
        'Color elegido': selectedColor,
        'Paleta elegida': paletteName(availableColors.find((option) => option.color === selectedColor) || { id: '', name: selectedColor }),
        Secciones: Array.from(activeSections).map((id) => sectionOptions.find((item) => item.id === id)?.title || id).filter(Boolean).join(', '),
        'Música de fondo': hasMusic ? String(form.get('music') || 'Sí, a definir') : 'No',
        'Estado del pago': paymentOperation ? 'Pago informado - pendiente de validación' : 'Pago pendiente',
        'Archivos adjuntos': attachments.length ? attachments.map((file) => file.name).join(', ') : 'Sin archivos'
      };
      Object.entries(generatedFields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        input.dataset.orderGenerated = 'true';
        formElement.appendChild(input);
      });
      formElement.action = 'https://formsubmit.co/saveyourdate.invite@gmail.com';
      formElement.method = 'POST';
      formElement.target = 'order-submit-frame';
      formElement.enctype = 'multipart/form-data';
      HTMLFormElement.prototype.submit.call(formElement);
      window.setTimeout(() => {
        setSubmittedOrder(orderNumber);
        setSending(false);
      }, 1200);
    } catch (error) {
      const detail = error instanceof Error ? error.message : '';
      setSubmitError(`${l('No pudimos enviar el pedido. Revisá el tamaño de las imágenes e intentá nuevamente.', 'We could not send the order. Check the image sizes and try again.', 'Não foi possível enviar o pedido. Verifique o tamanho das imagens e tente novamente.')} ${detail}`.trim());
      setSending(false);
    }
  };

  const submitPrepayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const details = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      whatsapp: String(form.get('whatsapp') || ''),
      operation: String(form.get('paymentOperation') || '')
    };
    setSubmitError('');
    setSending(true);
    try {
      await sendForm({
        _subject: `Pago previo informado - ${details.name}`,
        Nombre: details.name,
        Email: details.email,
        WhatsApp: details.whatsapp,
        Plan: plan === 'basic' ? `Básico - ${PLAN_PRICES.basic}` : `Premium - ${PLAN_PRICES.premium}`,
        'Número de operación Mercado Pago': details.operation,
        Estado: 'Pago informado antes de completar el pedido - pendiente de validación'
      });
      setPrepayment(details);
      setActiveTab('new');
    } catch {
      setSubmitError(l('No pudimos registrar el pago. Revisá tu conexión e intentá nuevamente.', 'We could not register the payment. Check your connection and try again.', 'Não foi possível registrar o pagamento. Verifique sua conexão e tente novamente.'));
    } finally {
      setSending(false);
    }
  };

  const submitPaymentUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitError('');
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
    } catch {
      setSubmitError(l('No pudimos informar el pago. Revisá tu conexión e intentá nuevamente.', 'We could not report the payment. Check your connection and try again.', 'Não foi possível informar o pagamento. Verifique sua conexão e tente novamente.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="crear" className="order-flow-section">
      <iframe name="order-submit-frame" title="Envío del pedido" style={{ display: 'none' }} />
      <div className="container">
        <div className="section-header order-flow-heading">
          <span className="section-subtitle">{l('Tu invitación, a tu manera', 'Your invitation, your way', 'Seu convite, do seu jeito')}</span>
          <h2 className="section-title">{l('Creá tu invite', 'Create your invite', 'Crie seu convite')}</h2>
          <p className="section-desc">{l('Podés enviar todos los datos ahora y pagar después. La invitación se libera cuando validamos internamente el pago.', 'You can send all the details now and pay later. Your invitation is released after we validate the payment.', 'Você pode enviar todos os dados agora e pagar depois. O convite é liberado após validarmos o pagamento.')}</p>
        </div>

        {!started ? (
          <div className="order-start-card">
            <h3>{l('¿Qué querés hacer?', 'What would you like to do?', 'O que você quer fazer?')}</h3>
            <p>{l('El formulario aparece únicamente cuando iniciás un pedido o necesitás informar el pago de uno existente.', 'The form appears only when you start an order or report payment for an existing one.', 'O formulário aparece somente quando você inicia um pedido ou informa o pagamento de um pedido existente.')}</p>
            <div className="order-start-actions">
              <button className="btn-primary" onClick={() => { setStarted(true); setActiveTab('new'); }}>{l('Hacer el pedido y pagar después', 'Order now and pay later', 'Fazer o pedido e pagar depois')}</button>
              <button className="btn-secondary" onClick={() => { setStarted(true); setActiveTab('pay-first'); }}>{l('Pagar primero', 'Pay first', 'Pagar primeiro')}</button>
              <button className="btn-secondary" onClick={() => { setStarted(true); setActiveTab('payment'); }}>{l('Ya hice un pedido', 'I already placed an order', 'Já fiz um pedido')}</button>
            </div>
          </div>
        ) : <>
        <div className="order-flow-tabs" role="tablist">
          <button className={activeTab === 'new' ? 'active' : ''} onClick={() => setActiveTab('new')}>{l('Creá tu invite', 'Create your invite', 'Crie seu convite')}</button>
          <button className={activeTab === 'pay-first' ? 'active' : ''} onClick={() => setActiveTab('pay-first')}>{l('Pagar primero', 'Pay first', 'Pagar primeiro')}</button>
          <button className={activeTab === 'payment' ? 'active' : ''} onClick={() => setActiveTab('payment')}>{l('Ya creaste tu invite', 'Already created yours?', 'Já criou seu convite?')}</button>
        </div>

        {activeTab === 'pay-first' && (
          <form className="order-form payment-update-form" onSubmit={submitPrepayment}>
            <div className="order-form-block">
              <div className="order-block-title"><span>1</span><div><h3>{l('Elegí el plan y pagá', 'Choose a plan and pay', 'Escolha o plano e pague')}</h3><p>{l('Primero dejanos tus datos para poder identificar el pago. Después de informarlo vas a completar el pedido.', 'First leave your details so we can identify the payment. After reporting it, you will complete the order.', 'Primeiro deixe seus dados para identificarmos o pagamento. Depois, você completará o pedido.')}</p></div></div>
              <div className="order-plan-grid">
                {(['basic', 'premium'] as Plan[]).map((item) => <button type="button" key={item} className={`order-plan-card ${plan === item ? 'active' : ''}`} onClick={() => setPlan(item)}><small>{l('PLAN', 'PLAN', 'PLANO')}</small><h4>{item === 'basic' ? l('Básico', 'Basic', 'Básico') : 'Premium'}</h4><strong>{PLAN_PRICES[item]}</strong><p>{item === 'basic' ? l('Hasta 5 secciones.', 'Up to 5 sections.', 'Até 5 seções.') : l('Hasta 8 secciones.', 'Up to 8 sections.', 'Até 8 seções.')}</p></button>)}
              </div>
              <div className="form-row-2col">
                <div className="form-group"><label className="form-label">{l('Nombre y apellido', 'Full name', 'Nome e sobrenome')}</label><input name="name" className="form-input" required /></div>
                <div className="form-group"><label className="form-label">WhatsApp</label><input name="whatsapp" className="form-input" type="tel" required /></div>
              </div>
              <div className="form-group"><label className="form-label">Email</label><input name="email" className="form-input" type="email" required /></div>
              <a href={PAYMENT_LINKS[plan]} target="_blank" rel="noopener noreferrer" className="mercado-pago-link">{l(`Pagar ${PLAN_PRICES[plan]} con Mercado Pago ↗`, `Pay ${PLAN_PRICES[plan]} with Mercado Pago ↗`, `Pagar ${PLAN_PRICES[plan]} com Mercado Pago ↗`)}</a>
              <div className="form-group"><label className="form-label">{l('Después de pagar, ingresá el número de operación', 'After paying, enter the transaction number', 'Depois de pagar, informe o número da operação')}</label><input name="paymentOperation" className="form-input" required /></div>
              {submitError && <p className="order-error" role="alert">{submitError}</p>}
              <button className="btn-form-submit" type="submit" disabled={sending}>{sending ? l('Registrando…', 'Registering…', 'Registrando…') : l('Registrar pago y completar mi pedido', 'Register payment and complete my order', 'Registrar pagamento e completar meu pedido')}</button>
            </div>
          </form>
        )}

        {activeTab === 'new' && (submittedOrder ? (
          <div className="order-success-card">
            <span>✓</span>
            <h3>{l('¡Recibimos tu pedido!', 'We received your order!', 'Recebemos seu pedido!')}</h3>
            <p>{l('Guardá este número para consultar o informar el pago más adelante.', 'Save this number to check or report payment later.', 'Guarde este número para consultar ou informar o pagamento depois.')}</p>
            <strong>{submittedOrder}</strong>
            <p className="order-status-note">{l('Estado inicial: pedido recibido. La publicación final se libera después de validar el pago.', 'Initial status: order received. Final publication is released after payment validation.', 'Estado inicial: pedido recebido. A publicação final é liberada após a validação do pagamento.')}</p>
            <button className="btn-secondary" onClick={() => { setActiveTab('payment'); setPaymentUpdated(false); }}>{l('Informar un pago', 'Report a payment', 'Informar um pagamento')}</button>
          </div>
        ) : (
          <form className="order-form" onSubmit={submitOrder} encType="multipart/form-data">
            <div className="order-form-block">
              <div className="order-block-title"><span>1</span><div><h3>{l('Elegí tu plan', 'Choose your plan', 'Escolha seu plano')}</h3><p>{l('La portada está incluida y no cuenta como sección.', 'The cover is included and does not count as a section.', 'A capa está incluída e não conta como seção.')}</p></div></div>
              <div className="order-plan-grid">
                <button type="button" className={`order-plan-card ${plan === 'basic' ? 'active' : ''}`} onClick={() => setPlan('basic')}>
                  <small>{l('PLAN', 'PLAN', 'PLANO')}</small><h4>{l('Básico', 'Basic', 'Básico')}</h4><strong>{PLAN_PRICES.basic}</strong><p>{l('Hasta 5 secciones. Galería de hasta 5 fotos cuando el diseño la incluye.', 'Up to 5 sections. Gallery with up to 5 photos when included in the design.', 'Até 5 seções. Galeria de até 5 fotos quando incluída no design.')}</p>
                </button>
                <button type="button" className={`order-plan-card ${plan === 'premium' ? 'active' : ''}`} onClick={() => setPlan('premium')}>
                  <small>{l('PLAN', 'PLAN', 'PLANO')}</small><h4>Premium</h4><strong>{PLAN_PRICES.premium}</strong><p>{l('Hasta 8 secciones. Galería de hasta 8 fotos si la elegís.', 'Up to 8 sections. Gallery with up to 8 photos if selected.', 'Até 8 seções. Galeria de até 8 fotos, se escolhida.')}</p>
                </button>
              </div>
            </div>

            <div className="order-form-block">
              <div className="order-block-title"><span>2</span><div><h3>{l('Elegí el modelo y las secciones', 'Choose the model and sections', 'Escolha o modelo e as seções')}</h3><p>{usedSectionCount} {l('de', 'of', 'de')} {sectionLimit} {l('secciones contabilizadas.', 'counted sections.', 'seções contabilizadas.')} {galleryIncludedWithDesign && l('La galería y la portada están incluidas sin consumir lugares.', 'Gallery and cover are included without using slots.', 'Galeria e capa estão incluídas sem consumir vagas.')}</p></div></div>
              <span className="form-label">{l('Primero, elegí el tipo de evento', 'First, choose the event type', 'Primeiro, escolha o tipo de evento')}</span>
              <div className="order-event-categories" role="group" aria-label="Tipo de evento">
                {([
                  ['wedding', l('Boda', 'Wedding', 'Casamento')],
                  ['15years', l('15 Años', 'Quinceañera', '15 Anos')],
                  ['other', l('Otros eventos', 'Other events', 'Outros eventos')]
                ] as [EventCategory, string][]).map(([category, label]) => (
                  <button
                    type="button"
                    key={category}
                    className={eventCategory === category ? 'active' : ''}
                    aria-pressed={eventCategory === category}
                    onClick={() => selectEventCategory(category)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="form-label" htmlFor="order-model">{l('Modelo de invitación', 'Invitation model', 'Modelo de convite')}</label>
              <select id="order-model" className="form-select" value={modelId} onChange={(event) => setModelId(event.target.value)}>
                {filteredModels.map((model) => <option key={model.id} value={model.id}>{model.title}</option>)}
              </select>
              <div className="order-color-field">
                <span className="form-label">{l('Color principal de la invitación', 'Main invitation color', 'Cor principal do convite')}</span>
                <p>{l('Elegilo cuando el modelo admita cambio de paleta. Lo confirmaremos al revisar el pedido.', 'Choose it when the model supports palette changes. We will confirm it when reviewing the order.', 'Escolha quando o modelo permitir mudança de paleta. Confirmaremos ao revisar o pedido.')}</p>
                <div className="order-color-options">
                  {availableColors.map((option) => (
                    <button type="button" key={option.id} className={selectedColor === option.color ? 'active' : ''} onClick={() => setSelectedColor(option.color)} aria-label={l(`Elegir ${paletteName(option)}`, `Choose ${paletteName(option)}`, `Escolher ${paletteName(option)}`)}>
                      <span style={{ background: option.color }}></span>{paletteName(option)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="order-sections-grid">
                {sectionOptions.map((section) => {
                  const includedByDefault = defaultSections.includes(section.id);
                  const selected = sections.includes(section.id);
                  const isFreeGallery =
                    section.id === 'gallery' &&
                    galleryIncludedWithDesign;
                  const disabled =
                    !selected &&
                    !isFreeGallery &&
                    usedSectionCount >= sectionLimit;
                  return (
                    <button type="button" key={section.id} disabled={disabled} className={`order-section-option ${selected ? 'active' : ''} ${includedByDefault ? 'included' : ''}`} onClick={() => toggleSection(section.id)}>
                      <span className="order-section-check">{selected ? '✓' : '+'}</span>
                      <span><strong>{section.title}</strong><small>{includedByDefault ? l('Incluida por defecto; podés cambiarla · ', 'Included by default; you can change it · ', 'Incluída por padrão; você pode alterá-la · ') : ''}{section.description}</small></span>
                    </button>
                  );
                })}
              </div>
              {rsvpSelected && <div className="rsvp-included-note"><strong>{l('RSVP completo incluido', 'Complete RSVP included', 'RSVP completo incluído')}</strong><span>{l('Google Sheets · link de envío · restricciones alimentarias para catering · cédula para control de ingreso.', 'Google Sheets · sending link · dietary restrictions for catering · ID for access control.', 'Google Sheets · link de envio · restrições alimentares para catering · documento para controle de entrada.')}</span></div>}
            </div>

            <div className="order-form-block">
              <div className="order-block-title"><span>3</span><div><h3>{l('Completá todos los datos', 'Complete all the details', 'Preencha todos os dados')}</h3><p>{l('Los campos cambian según las secciones que elegiste.', 'Fields change according to the sections you selected.', 'Os campos mudam conforme as seções escolhidas.')}</p></div></div>
              <div className="form-row-2col">
                <div className="form-group"><label className="form-label">{l('Nombre y apellido', 'Full name', 'Nome e sobrenome')}</label><input name="name" className="form-input" required defaultValue={prepayment.name} /></div>
                <div className="form-group"><label className="form-label">WhatsApp</label><input name="whatsapp" className="form-input" type="tel" required defaultValue={prepayment.whatsapp} /></div>
              </div>
              <div className="form-row-2col">
                <div className="form-group"><label className="form-label">Email</label><input name="email" className="form-input" type="email" required defaultValue={prepayment.email} /></div>
                <div className="form-group"><label className="form-label">{l('Título o protagonistas', 'Title or hosts', 'Título ou protagonistas')}</label><input name="eventTitle" className="form-input" required placeholder={l('Ej. Ana & Juan', 'E.g. Ana & Juan', 'Ex. Ana & Juan')} /></div>
              </div>
              <div className="form-row-2col">
                <div className="form-group"><label className="form-label">{l('Fecha principal del evento', 'Main event date', 'Data principal do evento')}</label><input name="eventDate" className="form-input" type="date" required /></div>
                <div className="form-group"><label className="form-label">{l('Hora principal', 'Main time', 'Horário principal')}</label><input name="eventTime" className="form-input" type="time" required /></div>
              </div>
              <div className="form-group"><label className="form-label">{l('Foto principal o imagen de portada', 'Main photo or cover image', 'Foto principal ou imagem de capa')}</label><input name="attachment" className="form-input" type="file" accept="image/*" /><small>{l('Podés subirla ahora o dejarla pendiente si el modelo no lleva fotografía.', 'You can upload it now or leave it pending if the model has no photo.', 'Você pode enviar agora ou deixar pendente se o modelo não usar foto.')}</small></div>

              {activeSections.has('quote') && <div className="dynamic-section-fields"><h4>{l('Frase destacada', 'Highlighted quote', 'Frase destacada')}</h4><div className="form-group"><label className="form-label">{l('Texto de la frase', 'Quote text', 'Texto da frase')}</label><textarea name="quoteText" className="form-textarea" required /></div><div className="form-group"><label className="form-label">{l('Autor (opcional)', 'Author (optional)', 'Autor (opcional)')}</label><input name="quoteAuthor" className="form-input" /></div></div>}
              {activeSections.has('featuredPhoto') && <div className="dynamic-section-fields"><h4>{l('Foto destacada con efecto parallax', 'Featured parallax photo', 'Foto destacada com efeito parallax')}</h4><div className="form-group"><label className="form-label">{l('Imagen destacada', 'Featured image', 'Imagem destacada')}</label><input name="attachment2" className="form-input" type="file" accept="image/*" required /></div><div className="form-group"><label className="form-label">{l('Encuadre o indicaciones', 'Framing or instructions', 'Enquadramento ou instruções')}</label><input name="featuredPhotoNotes" className="form-input" /></div></div>}
              {activeSections.has('countdown') && <div className="dynamic-section-fields"><h4>{l('Cuenta regresiva', 'Countdown', 'Contagem regressiva')}</h4><div className="form-row-2col"><div className="form-group"><label className="form-label">{l('Fecha objetivo', 'Target date', 'Data de destino')}</label><input name="countdownDate" className="form-input" type="date" required /></div><div className="form-group"><label className="form-label">{l('Hora objetivo', 'Target time', 'Horário de destino')}</label><input name="countdownTime" className="form-input" type="time" required /></div></div><div className="form-group"><label className="form-label">{l('Título del contador', 'Countdown title', 'Título do contador')}</label><input name="countdownTitle" className="form-input" required placeholder={l('Ej. Falta muy poco', 'E.g. Almost there', 'Ex. Falta muito pouco')} /></div></div>}

              {activeSections.has('agenda') && <div className="dynamic-section-fields"><h4>{l('Agenda o itinerario', 'Schedule or itinerary', 'Agenda ou itinerário')}</h4><p>{l('Indicá cada momento con hora, título, lugar y una breve descripción.', 'Add each moment with its time, title and venue.', 'Informe cada momento com horário, título e local.')}</p>{[1, 2, 3].map((item) => <div className="agenda-row" key={item}><input name={`agenda${item}Time`} className="form-input" type="time" required={item === 1} /><input name={`agenda${item}Title`} className="form-input" required={item === 1} placeholder={`${l('Momento', 'Moment', 'Momento')} ${item}${item > 1 ? ` (${l('opcional', 'optional', 'opcional')})` : ''}`} /><input name={`agenda${item}Place`} className="form-input" required={item === 1} placeholder={l('Lugar', 'Venue', 'Local')} /></div>)}</div>}

              {activeSections.has('location') && <div className="dynamic-section-fields"><h4>{l('Ubicación y mapa', 'Location and map', 'Localização e mapa')}</h4><div className="form-group"><label className="form-label">{l('Nombre del lugar', 'Venue name', 'Nome do local')}</label><input name="locationName" className="form-input" required /></div><div className="form-group"><label className="form-label">{l('Dirección completa', 'Full address', 'Endereço completo')}</label><input name="locationAddress" className="form-input" required /></div><div className="form-group"><label className="form-label">Google Maps / Waze</label><input name="locationMap" className="form-input" type="url" required placeholder="https://..." /></div></div>}

              {activeSections.has('rsvp') && <div className="dynamic-section-fields"><h4>RSVP</h4><div className="form-row-2col"><div className="form-group"><label className="form-label">{l('Fecha límite para confirmar', 'RSVP deadline', 'Prazo para confirmação')}</label><input name="rsvpDeadline" className="form-input" type="date" required /></div><div className="form-group"><label className="form-label">{l('Cantidad máxima por invitación', 'Maximum guests per invitation', 'Máximo de convidados por convite')}</label><input name="rsvpMaxGuests" className="form-input" type="number" min="1" required /></div></div><div className="form-group"><label className="form-label">{l('Texto o indicaciones para confirmar', 'RSVP instructions', 'Instruções para confirmação')}</label><textarea name="rsvpInstructions" className="form-textarea" required /></div><p className="dynamic-help">{l('La planilla incluirá nombre, asistencia, acompañantes, restricciones alimentarias y cédula de identidad.', 'The spreadsheet will include name, attendance, guests, dietary restrictions and ID.', 'A planilha incluirá nome, presença, acompanhantes, restrições alimentares e documento.')}</p></div>}

              {activeSections.has('gifts') && <div className="dynamic-section-fields"><h4>Regalos</h4><p>Podés agregar hasta 3 cuentas bancarias, listas o lugares de compra.</p>{[1, 2, 3].map((item) => <div className="gift-row" key={item}><select name={`gift${item}Type`} className="form-select" required={item === 1}><option value="">Tipo {item}</option><option>Cuenta bancaria</option><option>Link de compra</option><option>Lista de regalos</option><option>Otro</option></select><input name={`gift${item}Label`} className="form-input" required={item === 1} placeholder={`Banco, tienda o título${item > 1 ? ' (opcional)' : ''}`} /><input name={`gift${item}Detail`} className="form-input" required={item === 1} placeholder="Alias, número de cuenta o link" /></div>)}</div>}

              {activeSections.has('dresscode') && <div className="dynamic-section-fields"><h4>{l('Código de vestimenta', 'Dress code', 'Código de vestimenta')}</h4><div className="form-group"><label className="form-label">{l('Tipo de vestimenta', 'Attire', 'Tipo de traje')}</label><input name="dressCode" className="form-input" required /></div><div className="form-group"><label className="form-label">{l('Aclaraciones', 'Additional details', 'Observações')}</label><textarea name="dressCodeDetails" className="form-textarea" required /></div></div>}

              {activeSections.has('playlist') && <div className="dynamic-section-fields"><h4>Playlist</h4><div className="form-group"><label className="form-label">{l('Link de Spotify o plataforma', 'Spotify or platform link', 'Link do Spotify ou plataforma')}</label><input name="playlistLink" className="form-input" type="url" required /></div><div className="form-group"><label className="form-label">{l('Texto para pedir canciones', 'Song request text', 'Texto para pedir músicas')}</label><input name="playlistPrompt" className="form-input" required /></div></div>}

              {activeSections.has('instagram') && <div className="dynamic-section-fields"><h4>{l('Instagram y hashtag', 'Instagram and hashtag', 'Instagram e hashtag')}</h4><div className="form-row-2col"><div className="form-group"><label className="form-label">Instagram</label><input name="instagramUser" className="form-input" required placeholder="@user" /></div><div className="form-group"><label className="form-label">Hashtag</label><input name="instagramHashtag" className="form-input" required placeholder="#OurEvent" /></div></div></div>}

              {activeSections.has('messages') && <div className="dynamic-section-fields"><h4>{l('Muro de saludos', 'Message wall', 'Mural de mensagens')}</h4><div className="form-group"><label className="form-label">{l('Título de la sección', 'Section title', 'Título da seção')}</label><input name="messagesTitle" className="form-input" required /></div><div className="form-group"><label className="form-label">{l('Consigna para los invitados', 'Prompt for guests', 'Instrução para os convidados')}</label><textarea name="messagesPrompt" className="form-textarea" required /></div></div>}

              <label className="order-toggle-row">
                <input type="checkbox" checked={hasMusic} onChange={(event) => setHasMusic(event.target.checked)} />
                <span><strong>{l('Música de fondo', 'Background music', 'Música de fundo')}</strong><small>{l('Está disponible en ambos planes y no cuenta como sección.', 'Available in both plans and does not count as a section.', 'Disponível nos dois planos e não conta como seção.')}</small></span>
              </label>
              {hasMusic && <div className="form-group order-reveal"><label className="form-label">{l('Canción o enlace', 'Song or link', 'Música ou link')}</label><input name="music" className="form-input" required placeholder={l('Spotify, YouTube o nombre de la canción', 'Spotify, YouTube or song name', 'Spotify, YouTube ou nome da música')} /></div>}

              {gallerySelected && <div className="form-group order-reveal"><label className="form-label">{l('Fotos para la galería', 'Gallery photos', 'Fotos para a galeria')} ({l('máximo', 'maximum', 'máximo')} {photoLimit})</label><input name="attachment3" className="form-input" type="file" multiple accept="image/*" required onChange={(event) => handlePhotos(event.target.files)} /><small>{photoCount} {l('foto(s) seleccionada(s).', 'photo(s) selected.', 'foto(s) selecionada(s).')}</small>{photoError && <p className="order-error">{photoError}</p>}</div>}
            </div>

            <div className="order-form-block order-payment-choice">
              <div className="order-block-title"><span>4</span><div><h3>{l('Pago, ahora o después', 'Payment, now or later', 'Pagamento, agora ou depois')}</h3><p>{l('No necesitás pagar para enviar el pedido.', 'You do not need to pay to submit the order.', 'Você não precisa pagar para enviar o pedido.')}</p></div></div>
              <div className="order-payment-actions">
                <a href={PAYMENT_LINKS[plan]} target="_blank" rel="noopener noreferrer" className="mercado-pago-link">Pagar Plan {plan === 'basic' ? 'Básico' : 'Premium'} ({PLAN_PRICES[plan]}) con Mercado Pago ↗</a>
                <div className="form-group"><label className="form-label">{l('Si ya pagaste, pegá el número de operación', 'If you already paid, enter the transaction number', 'Se já pagou, informe o número da operação')}</label><input name="paymentOperation" className="form-input" defaultValue={prepayment.operation} placeholder={l('Ej. 12345678901 (opcional)', 'E.g. 12345678901 (optional)', 'Ex. 12345678901 (opcional)')} /></div>
              </div>
            </div>

            {submitError && <p className="order-error" role="alert">{submitError}</p>}
            <button className="btn-form-submit order-submit" type="submit" disabled={sending || activeSections.size === 0 || usedSectionCount > sectionLimit || !!photoError}>{sending ? l('Enviando pedido…', 'Sending order…', 'Enviando pedido…') : l('Enviar mi pedido', 'Send my order', 'Enviar meu pedido')}</button>
          </form>
        ))}

        {activeTab === 'payment' && (paymentUpdated ? (
          <div className="order-success-card"><span>✓</span><h3>{l('Pago informado', 'Payment reported', 'Pagamento informado')}</h3><p>{l('Recibimos el número de operación. Lo verificaremos internamente y actualizaremos el estado de tu pedido.', 'We received the transaction number. We will verify it and update your order status.', 'Recebemos o número da operação. Vamos verificá-lo e atualizar o status do seu pedido.')}</p><strong>{l('Pendiente de validación', 'Pending validation', 'Pendente de validação')}</strong></div>
        ) : (
          <form className="order-form payment-update-form" onSubmit={submitPaymentUpdate}>
            <div className="order-form-block">
              <div className="order-block-title"><span>✓</span><div><h3>{l('Informá el pago de un pedido existente', 'Report payment for an existing order', 'Informe o pagamento de um pedido existente')}</h3><p>{l('No necesitás volver a cargar los datos de tu invitación.', 'You do not need to enter your invitation details again.', 'Você não precisa preencher novamente os dados do convite.')}</p></div></div>
              <div className="form-group"><label className="form-label">{l('Número de pedido', 'Order number', 'Número do pedido')}</label><input name="orderNumber" className="form-input" required placeholder="SYD-123456" pattern="SYD-[0-9]{6}" /></div>
              <div className="form-group"><label className="form-label">{l('Número de operación de Mercado Pago', 'Mercado Pago transaction number', 'Número da operação do Mercado Pago')}</label><input name="paymentOperation" className="form-input" required /></div>
              <div className="form-group"><label className="form-label">{l('Email o WhatsApp usado en el pedido', 'Email or WhatsApp used for the order', 'E-mail ou WhatsApp usado no pedido')}</label><input name="contact" className="form-input" required /></div>
              {submitError && <p className="order-error" role="alert">{submitError}</p>}
              <button className="btn-form-submit" type="submit" disabled={sending}>{sending ? l('Enviando…', 'Sending…', 'Enviando…') : l('Enviar número de operación', 'Send transaction number', 'Enviar número da operação')}</button>
            </div>
          </form>
        ))}
        </>}
      </div>
    </section>
  );
}
