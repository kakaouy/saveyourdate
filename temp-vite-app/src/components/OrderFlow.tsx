import { useEffect, useMemo, useState } from 'react';
import type { InvitationModel } from '../data/models';
import { PAYMENT_LINKS, PLAN_PRICES, type CommercialPlan } from '../config/plans';
import { buildOrderSelectionFields } from '../utils/orderSelection';

type Plan = CommercialPlan;
type FlowTab = 'new' | 'pay-first';
type EventCategory = InvitationModel['category'];
type Language = 'es' | 'en' | 'pt';

const SECTION_OPTIONS = [
  { id: 'countdown', title: 'Cuenta regresiva', description: 'Contador dinámico hasta el día del evento.' },
  { id: 'quote', title: 'Frase', description: 'Frase o texto destacado dentro de la invitación.' },
  { id: 'featuredPhoto', title: 'Foto destacada', description: 'Imagen importante con efecto parallax.' },
  { id: 'agenda', title: 'Agenda o itinerario', description: 'Horarios y momentos importantes del evento.' },
  { id: 'location', title: 'Ubicación y mapa', description: 'Dirección, Google Maps o Waze.' },
  { id: 'rsvp', title: 'Confirmación de asistencia', description: 'Incluye panel personalizado, enlaces individuales y restricciones alimentarias.' },
  { id: 'gallery', title: 'Galería de fotos', description: 'Hasta 5 fotos en Básico y hasta 8 en Premium.' },
  { id: 'gifts', title: 'Regalos', description: 'Alias, cuenta bancaria o lista de regalos.' },
  { id: 'dresscode', title: 'Código de vestimenta', description: 'Dress code y recomendaciones para los invitados.' },
  { id: 'playlist', title: 'Playlist', description: 'Sugerencias de canciones de los invitados.' },
  { id: 'instagram', title: 'Instagram y hashtag', description: 'Usuario, hashtag o álbum compartido.' },
  { id: 'messages', title: 'Muro de saludos', description: 'Mensajes y buenos deseos para los anfitriones.' }
];

const ORDER_FEATURE_TRANSLATIONS: Record<Language, Record<string, string>> = {
  es: {},
  en: {
    'Apertura con sello de lacre': 'Wax-seal opening',
    'Portada floral editorial': 'Editorial floral cover',
    'Cuenta Regresiva': 'Countdown',
    'Ubicación': 'Location',
    'Agregar al calendario': 'Add to calendar',
    'Frase': 'Quote',
    'Código de Vestimenta': 'Dress code',
    'Foto destacada con efecto parallax': 'Featured photo with parallax effect',
    'Galería de fotos': 'Photo gallery',
    'Alojamiento': 'Accommodation',
    'Regalos / datos de pago': 'Gifts / payment details',
    'Álbum colaborativo': 'Collaborative album',
    'Instagram': 'Instagram',
    'Sugerencia de canciones': 'Song suggestions',
    'Pase QR': 'QR pass',
    'Confirmación RSVP': 'RSVP confirmation',
    'Multiidioma': 'Multilingual'
  },
  pt: {
    'Apertura con sello de lacre': 'Abertura com selo de cera',
    'Portada floral editorial': 'Capa floral editorial',
    'Cuenta Regresiva': 'Contagem regressiva',
    'Ubicación': 'Localização',
    'Agregar al calendario': 'Adicionar ao calendário',
    'Frase': 'Frase',
    'Código de Vestimenta': 'Código de vestimenta',
    'Foto destacada con efecto parallax': 'Foto destacada com efeito parallax',
    'Galería de fotos': 'Galeria de fotos',
    'Alojamiento': 'Hospedagem',
    'Regalos / datos de pago': 'Presentes / dados de pagamento',
    'Álbum colaborativo': 'Álbum colaborativo',
    'Instagram': 'Instagram',
    'Sugerencia de canciones': 'Sugestões de músicas',
    'Pase QR': 'Passe QR',
    'Confirmación RSVP': 'Confirmação de presença',
    'Multiidioma': 'Multilíngue'
  }
};

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
  const [submittedStatusUrl, setSubmittedStatusUrl] = useState('');
  const [submittedWhatsapp, setSubmittedWhatsapp] = useState('');
  const [orderCopied, setOrderCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [prepayment, setPrepayment] = useState({ name: '', email: '', whatsapp: '', operation: '' });
  const [selectedColor, setSelectedColor] = useState('#ff6f91');

  const photoLimit = plan === 'basic' ? 5 : 8;
  const selectedModel = useMemo(() => models.find((model) => model.id === modelId), [models, modelId]);
  const defaultSections = selectedModel?.includedSections || [];
  const activeSections = useMemo(
    () => new Set(sections),
    [sections]
  );
  const addedSections = sections.filter((sectionId) => !defaultSections.includes(sectionId));
  const gallerySelected = activeSections.has('gallery');
  const rsvpSelected = activeSections.has('rsvp');
  const sectionOptions = useMemo(() => SECTION_OPTIONS.map((section) => {
    const translations: Record<string, [string, string, string, string, string, string]> = {
      quote: ['Frase', 'Quote', 'Frase', 'Frase o texto destacado dentro de la invitación.', 'Highlighted quote or text inside the invitation.', 'Frase ou texto destacado dentro do convite.'],
      featuredPhoto: ['Foto destacada', 'Featured photo', 'Foto destacada', 'Imagen importante con efecto parallax.', 'Important image with a parallax effect.', 'Imagem importante com efeito parallax.'],
      countdown: ['Cuenta regresiva', 'Countdown', 'Contagem regressiva', 'Contador dinámico hasta el día del evento.', 'Dynamic countdown to the event date.', 'Contador dinâmico até o dia do evento.'],
      agenda: ['Agenda o itinerario', 'Schedule or itinerary', 'Agenda ou itinerário', 'Horarios y momentos importantes del evento.', 'Times and important moments of the event.', 'Horários e momentos importantes do evento.'],
      location: ['Ubicación y mapa', 'Location and map', 'Localização e mapa', 'Dirección, Google Maps o Waze.', 'Address, Google Maps or Waze.', 'Endereço, Google Maps ou Waze.'],
      rsvp: ['Confirmación de asistencia', 'RSVP', 'Confirmação de presença', 'Incluye panel personalizado, enlaces individuales y restricciones alimentarias.', 'Includes a personalized dashboard, individual links and dietary restrictions.', 'Inclui painel personalizado, links individuais e restrições alimentares.'],
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
    if (photoCount > photoLimit) {
      setPhotoCount(0);
      setPhotoError(`Este plan admite hasta ${photoLimit} fotos.`);
    }
  }, [plan, photoCount, photoLimit]);

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
      petroleo: ['Petróleo y arena', 'Petrol blue & sand', 'Azul petróleo e areia'],
      'marron-arena': ['Marrón y arena', 'Brown & sand', 'Marrom e areia'],
      'lavanda-ciruela': ['Lavanda y ciruela', 'Lavender & plum', 'Lavanda e ameixa'],
      'azul-polvo-champagne': ['Azul polvo y champagne', 'Dusty blue & champagne', 'Azul suave e champanhe'],
      'rosa-viejo-borgona': ['Rosa viejo y borgoña', 'Antique rose & burgundy', 'Rosa antigo e bordô'],
      'rosa-salvia': ['Rosa y salvia', 'Rose & sage', 'Rosa e sálvia'],
      'petroleo-champagne': ['Petróleo y champagne', 'Petrol blue & champagne', 'Azul petróleo e champanhe'],
      'azul-champagne': ['Azul y champagne', 'Blue & champagne', 'Azul e champanhe'],
      'oliva-marfil': ['Oliva y marfil', 'Olive & ivory', 'Oliva e marfim'],
      'borgona-rosa': ['Borgoña y rosa', 'Burgundy & rose', 'Bordô e rosa'],
      'ciruela-lavanda': ['Ciruela y lavanda', 'Plum & lavender', 'Ameixa e lavanda'],
      'verde-dorado': ['Verde y dorado', 'Green & gold', 'Verde e dourado']
      , 'menta-ciruela': ['Menta y ciruela', 'Mint & plum', 'Menta e ameixa']
      , 'lavanda-petroleo': ['Lavanda y petróleo', 'Lavender & petrol blue', 'Lavanda e azul petróleo']
      , 'aqua-borgona': ['Aqua y borgoña', 'Aqua & burgundy', 'Água e bordô']
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

  }, [modelId, selectedModel]);

  useEffect(() => {
    if (plan === 'basic') {
      setSections(defaultSections.filter((sectionId) => sectionId !== 'music'));
    }
  }, [plan, modelId]);

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
      const isNewSection = !defaultSections.includes(sectionId);
      if (plan === 'basic' && isNewSection) return current;
      if (isNewSection && addedSections.length >= 3) {
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
    setSubmitError('');
    setSending(true);
    try {
      if (attachmentSize > 10 * 1024 * 1024) {
        throw new Error(l('Las imágenes superan el máximo total de 10 MB.', 'The images exceed the 10 MB total limit.', 'As imagens excedem o limite total de 10 MB.'));
      }
      formElement.querySelectorAll('[data-order-generated="true"]').forEach((field) => field.remove());
      const selectedPalette = availableColors.find((option) => option.color === selectedColor) || { id: '', name: selectedColor, color: selectedColor };
      const generatedFields: Record<string, string> = {
        _subject: 'Nuevo pedido - Save Your Date',
        _template: 'table',
        _captcha: 'false',
        _replyto: String(form.get('email') || ''),
        ...buildOrderSelectionFields({language:lang,modelId,modelName:selectedModel?.title || modelId,paletteId:selectedPalette.id,paletteName:paletteName(selectedPalette),paletteColor:selectedColor}),
        Plan: plan === 'basic' ? 'Básico' : 'Premium',
        'Tipo de evento': eventCategory === 'wedding' ? 'Boda' : eventCategory === '15years' ? '15 Años' : 'Otros eventos',
        Secciones: Array.from(activeSections).map((id) => sectionOptions.find((item) => item.id === id)?.title || id).filter(Boolean).join(', '),
        'Música de fondo': hasMusic ? String(form.get('music') || 'Sí, a definir') : 'No',
        'Estado del pago': paymentOperation ? 'Pago informado - pendiente de validación' : 'Pago pendiente',
        'Archivos adjuntos': attachments.length ? attachments.map((file) => file.name).join(', ') : 'Sin archivos'
      };
      const textFields = Object.fromEntries(
        Array.from(form.entries())
          .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      );
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...textFields,
          ...generatedFields,
          name: String(form.get('name') || ''),
          email: String(form.get('email') || ''),
          whatsapp: String(form.get('whatsapp') || ''),
          paymentOperation,
          language: lang,
          plan: plan === 'basic' ? 'Básico' : 'Premium',
          modelId,
          modelName: selectedModel?.title || modelId,
          paletteId: selectedPalette.id,
          paletteName: paletteName(selectedPalette),
          paletteColor: selectedColor
        })
      });
      const orderResult = await orderResponse.json() as {
        orderNumber?: string;
        statusUrl?: string;
        error?: string;
      };
      if (!orderResponse.ok || !orderResult.orderNumber) {
        throw new Error(orderResult.error || 'No pudimos registrar el pedido.');
      }
      const orderNumber = orderResult.orderNumber;
      generatedFields._subject = `Nuevo pedido ${orderNumber} - Save Your Date`;
      generatedFields['Número de pedido'] = orderNumber;
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
        setSubmittedStatusUrl(orderResult.statusUrl || '');
        setSubmittedWhatsapp(String(form.get('whatsapp') || '').replace(/\D/g, ''));
        setSending(false);
      }, 1200);
    } catch (error) {
      const detail = error instanceof Error ? error.message : '';
      setSubmitError(`${l('No pudimos enviar el pedido. Revisá el tamaño de las imágenes e intentá nuevamente.', 'We could not send the order. Check the image sizes and try again.', 'Não foi possível enviar o pedido. Verifique o tamanho das imagens e tente novamente.')} ${detail}`.trim());
      setSending(false);
    }
  };

  const copyOrderNumber = async () => {
    await navigator.clipboard.writeText(submittedOrder);
    setOrderCopied(true);
    window.setTimeout(() => setOrderCopied(false), 2000);
  };

  const whatsappReminderUrl = submittedWhatsapp
    ? `https://wa.me/${submittedWhatsapp}?text=${encodeURIComponent(
      l(
        `Mi número de pedido de Save Your Date es ${submittedOrder}. Debo guardarlo para consultar el estado o informar el pago.`,
        `My Save Your Date order number is ${submittedOrder}. I should keep it to check the status or report payment.`,
        `Meu número de pedido da Save Your Date é ${submittedOrder}. Devo guardá-lo para consultar o status ou informar o pagamento.`
      )
    )}`
    : '';

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
            <h3>{l('¿Cómo querés empezar?', 'How would you like to start?', 'Como você quer começar?')}</h3>
            <p>{l('Las dos opciones forman parte del mismo pedido. Elegí la que te resulte más cómoda.', 'Both options are part of the same order. Choose whichever is easier for you.', 'As duas opções fazem parte do mesmo pedido. Escolha a mais conveniente.')}</p>
            <div className="order-start-actions">
              <button className="btn-primary" onClick={() => { setStarted(true); setActiveTab('new'); }}>{l('Hacer el pedido y pagar', 'Order and pay', 'Fazer o pedido e pagar')}</button>
              <button className="btn-secondary" onClick={() => { setStarted(true); setActiveTab('pay-first'); }}>{l('Pagar y hacer el pedido', 'Pay and place the order', 'Pagar e fazer o pedido')}</button>
            </div>
            <a className="order-lookup-link" href="/consultar">{l('¿Ya tenés un pedido? Consultá su estado', 'Already have an order? Check its status', 'Já tem um pedido? Consulte o status')}</a>
          </div>
        ) : <>
        <div className="order-flow-tabs" role="tablist">
          <button className={activeTab === 'new' ? 'active' : ''} onClick={() => setActiveTab('new')}>{l('Pedido → pago', 'Order → payment', 'Pedido → pagamento')}</button>
          <button className={activeTab === 'pay-first' ? 'active' : ''} onClick={() => setActiveTab('pay-first')}>{l('Pago → pedido', 'Payment → order', 'Pagamento → pedido')}</button>
        </div>

        {activeTab === 'pay-first' && (
          <form className="order-form payment-update-form" onSubmit={submitPrepayment}>
            <div className="order-form-block">
              <div className="order-block-title"><span>1</span><div><h3>{l('Elegí el plan y pagá', 'Choose a plan and pay', 'Escolha o plano e pague')}</h3><p>{l('Primero dejanos tus datos para poder identificar el pago. Después de informarlo vas a completar el pedido.', 'First leave your details so we can identify the payment. After reporting it, you will complete the order.', 'Primeiro deixe seus dados para identificarmos o pagamento. Depois, você completará o pedido.')}</p></div></div>
              <div className="order-plan-grid">
                {(['basic', 'premium'] as Plan[]).map((item) => <button type="button" key={item} className={`order-plan-card ${plan === item ? 'active' : ''}`} onClick={() => setPlan(item)}><small>{l('PLAN', 'PLAN', 'PLANO')}</small><h4>{item === 'basic' ? l('Básico', 'Basic', 'Básico') : 'Premium'}</h4><strong>{PLAN_PRICES[item]}</strong><p>{item === 'basic' ? l('Plantilla original y hasta 5 fotos si incluye galería.', 'Original template and up to 5 photos when it includes a gallery.', 'Modelo original e até 5 fotos quando inclui galeria.') : l('Hasta 3 secciones nuevas, podés eliminar existentes y usar hasta 8 fotos.', 'Add up to 3 sections, remove existing ones and use up to 8 photos.', 'Adicione até 3 seções, remova existentes e use até 8 fotos.')}</p></button>)}
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
            <p>{l('También te lo enviamos por email. Guardalo para consultar o informar el pago más adelante.', 'We also sent it to you by email. Save it to check or report payment later.', 'Também enviamos por e-mail. Guarde-o para consultar ou informar o pagamento depois.')}</p>
            <strong>{submittedOrder}</strong>
            <div className="order-success-actions">
              <button className="btn-secondary" type="button" onClick={copyOrderNumber}>
                {orderCopied ? l('Número copiado', 'Number copied', 'Número copiado') : l('Copiar número', 'Copy number', 'Copiar número')}
              </button>
              {whatsappReminderUrl && (
                <a className="btn-secondary" href={whatsappReminderUrl} target="_blank" rel="noopener noreferrer">
                  {l('Guardar en mi WhatsApp', 'Save in my WhatsApp', 'Salvar no meu WhatsApp')}
                </a>
              )}
            </div>
            <p className="order-status-note">{l('Estado inicial: pedido recibido. La publicación final se libera después de validar el pago.', 'Initial status: order received. Final publication is released after payment validation.', 'Estado inicial: pedido recebido. A publicação final é liberada após a validação do pagamento.')}</p>
            {submittedStatusUrl && <a className="btn-secondary" href={submittedStatusUrl}>{l('Consultar estado', 'Check status', 'Consultar status')}</a>}
            <a className="btn-secondary" href="/consultar">{l('Consultar o informar el pago', 'Check or report payment', 'Consultar ou informar o pagamento')}</a>
          </div>
        ) : (
          <form className="order-form" onSubmit={submitOrder} encType="multipart/form-data">
            <div className="order-form-block">
              <div className="order-block-title"><span>1</span><div><h3>{l('Elegí tu plan', 'Choose your plan', 'Escolha seu plano')}</h3><p>{l('La portada está incluida y no cuenta como sección.', 'The cover is included and does not count as a section.', 'A capa está incluída e não conta como seção.')}</p></div></div>
              <div className="order-plan-grid">
                <button type="button" className={`order-plan-card ${plan === 'basic' ? 'active' : ''}`} onClick={() => setPlan('basic')}>
                  <small>{l('PLAN', 'PLAN', 'PLANO')}</small><h4>{l('Básico', 'Basic', 'Básico')}</h4><strong>{PLAN_PRICES.basic}</strong><p>{l('La plantilla conserva sus secciones. Hasta 5 fotos cuando incluye galería.', 'The template keeps its sections. Up to 5 photos when it includes a gallery.', 'O modelo mantém suas seções. Até 5 fotos quando inclui galeria.')}</p>
                </button>
                <button type="button" className={`order-plan-card ${plan === 'premium' ? 'active' : ''}`} onClick={() => setPlan('premium')}>
                  <small>{l('PLAN', 'PLAN', 'PLANO')}</small><h4>Premium</h4><strong>{PLAN_PRICES.premium}</strong><p>{l('Agregá hasta 3 secciones, eliminá las que no necesites y usá hasta 8 fotos.', 'Add up to 3 sections, remove what you do not need and use up to 8 photos.', 'Adicione até 3 seções, remova as desnecessárias e use até 8 fotos.')}</p>
                </button>
              </div>
            </div>

            <div className="order-form-block">
              <div className="order-block-title"><span>2</span><div><h3>{l('Elegí el modelo', 'Choose the template', 'Escolha o modelo')}</h3><p>{plan === 'basic' ? l('Podés deshabilitar cualquiera de las secciones incluidas.', 'You may disable any included section.', 'Você pode desabilitar qualquer seção incluída.') : l(`Podés eliminar secciones y agregar hasta 3 nuevas. Agregaste ${addedSections.length} de 3.`, `You may remove sections and add up to 3 new ones. You added ${addedSections.length} of 3.`, `Você pode remover seções e adicionar até 3 novas. Adicionou ${addedSections.length} de 3.`)}</p></div></div>
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
              {selectedModel && (
                <div className="order-model-summary" data-testid="order-model-summary">
                  <div>
                    <strong>{selectedModel.title}</strong>
                    <p>{selectedModel.descriptions?.[lang] || selectedModel.description}</p>
                  </div>
                  <ul aria-label={l('Contenido incluido', 'Included content', 'Conteúdo incluído')}>
                    {selectedModel.features.map((feature) => <li key={feature}>{ORDER_FEATURE_TRANSLATIONS[lang][feature] || feature}</li>)}
                  </ul>
                </div>
              )}
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
                {sectionOptions.filter((section) => plan === 'premium' || defaultSections.includes(section.id)).map((section) => {
                  const includedByDefault = defaultSections.includes(section.id);
                  const selected = sections.includes(section.id);
                  const disabled = !selected && !includedByDefault && addedSections.length >= 3;
                  return (
                    <button type="button" key={section.id} disabled={disabled} className={`order-section-option ${selected ? 'active' : ''} ${includedByDefault ? 'included' : ''}`} onClick={() => toggleSection(section.id)}>
                      <span className="order-section-check">{selected ? '✓' : (includedByDefault ? '×' : '+')}</span>
                      <span><strong>{section.title}</strong><small>{includedByDefault ? (selected ? l('Incluida; tocá para deshabilitar · ', 'Included; tap to disable · ', 'Incluída; toque para desabilitar · ') : l('Deshabilitada; tocá para incluir · ', 'Disabled; tap to include · ', 'Desabilitada; toque para incluir · ')) : l('Sección nueva · ', 'New section · ', 'Nova seção · ')}{section.description}</small></span>
                    </button>
                  );
                })}
              </div>
              {rsvpSelected && <div className="rsvp-included-note"><strong>{l('RSVP completo incluido', 'Complete RSVP included', 'RSVP completo incluído')}</strong><span>{l('Panel personalizado · enlaces individuales · restricciones alimentarias para catering.', 'Personalized dashboard · individual links · dietary restrictions for catering.', 'Painel personalizado · links individuais · restrições alimentares para catering.')}</span></div>}
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

              {activeSections.has('rsvp') && <div className="dynamic-section-fields"><h4>RSVP</h4><div className="form-row-2col"><div className="form-group"><label className="form-label">{l('Fecha límite para confirmar', 'RSVP deadline', 'Prazo para confirmação')}</label><input name="rsvpDeadline" className="form-input" type="date" required /></div><div className="form-group"><label className="form-label">{l('Cantidad máxima por invitación', 'Maximum guests per invitation', 'Máximo de convidados por convite')}</label><input name="rsvpMaxGuests" className="form-input" type="number" min="1" required /></div></div><div className="form-group"><label className="form-label">{l('Texto o indicaciones para confirmar', 'RSVP instructions', 'Instruções para confirmação')}</label><textarea name="rsvpInstructions" className="form-textarea" required /></div><p className="dynamic-help">{l('El panel organizará nombres, asistencia, acompañantes y restricciones alimentarias.', 'The dashboard organizes names, attendance, companions and dietary restrictions.', 'O painel organiza nomes, presença, acompanhantes e restrições alimentares.')}</p></div>}

              {activeSections.has('gifts') && <div className="dynamic-section-fields"><h4>{l('Regalos', 'Gifts', 'Presentes')}</h4><p>{l('Podés agregar hasta 3 cuentas bancarias, listas o lugares de compra.', 'You may add up to 3 bank accounts, registries or stores.', 'Você pode adicionar até 3 contas bancárias, listas ou lojas.')}</p>{[1, 2, 3].map((item) => <div className="gift-row" key={item}><select name={`gift${item}Type`} className="form-select" required={item === 1}><option value="">{l('Tipo', 'Type', 'Tipo')} {item}</option><option>{l('Cuenta bancaria', 'Bank account', 'Conta bancária')}</option><option>{l('Link de compra', 'Purchase link', 'Link de compra')}</option><option>{l('Lista de regalos', 'Gift registry', 'Lista de presentes')}</option><option>{l('Otro', 'Other', 'Outro')}</option></select><input name={`gift${item}Label`} className="form-input" required={item === 1} placeholder={`${l('Banco, tienda o título', 'Bank, store or title', 'Banco, loja ou título')}${item > 1 ? ` (${l('opcional', 'optional', 'opcional')})` : ''}`} /><input name={`gift${item}Detail`} className="form-input" required={item === 1} placeholder={l('Alias, número de cuenta o link', 'Alias, account number or link', 'Chave, número da conta ou link')} /></div>)}</div>}

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
            <button className="btn-form-submit order-submit" type="submit" disabled={sending || activeSections.size === 0 || addedSections.length > 3 || !!photoError}>{sending ? l('Enviando pedido…', 'Sending order…', 'Enviando pedido…') : l('Enviar mi pedido', 'Send my order', 'Enviar meu pedido')}</button>
          </form>
        ))}

        </>}
      </div>
    </section>
  );
}
