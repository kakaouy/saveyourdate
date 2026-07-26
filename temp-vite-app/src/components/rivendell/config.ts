export type RivendellLocale = 'es' | 'pt' | 'en';
export type RivendellPalette = 'rosa' | 'verde-agua' | 'verde-azulado';
export type RivendellTone = 'light' | 'alternate' | 'accent' | 'accentDark';

export interface RivendellPaletteTokens {
  fondo: string;
  alterno: string;
  titulos: string;
  secundario: string;
  acento: string;
  acentoOscuro: string;
  texto: string;
  botones: string;
  bordes: string;
  ornamentos: string;
  claro: string;
  foco: string;
}

export const RIVENDELL_PALETTES: Record<RivendellPalette, RivendellPaletteTokens> = {
  rosa: {
    fondo: '#fff8fa', alterno: '#ead1d9', titulos: '#b9798f', secundario: '#f8e7ed',
    acento: '#d9a9b8', acentoOscuro: '#9f6478', texto: '#76535f', botones: '#b98395',
    bordes: '#e8c8d2', ornamentos: '#c88da2', claro: '#ffffff', foco: '#a96d82'
  },
  'verde-agua': {
    fondo: '#ffffff', alterno: '#53d0c4', titulos: '#a2d1cc', secundario: '#ffffff',
    acento: '#7cd0c8', acentoOscuro: '#05838e', texto: '#2d5f67', botones: '#05838e',
    bordes: '#ffffff', ornamentos: '#14ab9c', claro: '#ffffff', foco: '#05838e'
  },
  'verde-azulado': {
    fondo: '#f7fbfa', alterno: '#a9d5ce', titulos: '#4d8790', secundario: '#ffffff',
    acento: '#72b8b1', acentoOscuro: '#315f68', texto: '#365c63', botones: '#4f8f91',
    bordes: '#c8e3df', ornamentos: '#487783', claro: '#ffffff', foco: '#315f68'
  }
};

export const RIVENDELL_COPY = {
  es: {
    region: 'es-UY', skip: 'Saltar al contenido', loading: 'CARGANDO EXPERIENCIA...', eventType: 'Mis 15 Años',
    countdownEyebrow: 'Falta muy poco', countdownTitle: 'Cuenta regresiva', units: ['Días', 'Horas', 'Minutos', 'Segundos'], countdownDone: '¡Llegó el gran día!',
    locationTitle: '¿Cuándo y dónde?', map: 'Cómo llegar', calendar: 'Agendar evento',
    quote: '“Hay momentos en la vida que son especiales por sí solos, pero compartirlos con vos los hace inolvidables.”',
    dressTitle: 'Código de vestimenta', dressSummary: 'Elegante formal', dressButton: 'Ver detalles', dressDetails: 'Elegante formal. Traje o vestido largo.',
    scheduleTitle: 'Cronograma', schedule: [['Recepción', 'Bienvenida y cóctel de inicio.'], ['Cena principal', 'Cena y momentos especiales.'], ['Apertura de pista', '¡Comienza el baile!'], ['Cotillón y cierre', 'Fiesta, trasnoche y cierre.']],
    parallax: '¡Te espero para celebrar!', galleryTitle: 'Galería de fotos', galleryCopy: 'Un recorrido por momentos inolvidables',
    hotelsTitle: 'Alojamiento cercano', hotelsCopy: 'Opciones recomendadas para quienes vienen de lejos.', hotelsButton: 'Ver hoteles',
    giftsTitle: 'Mesa de regalos', giftsCopy: 'Tu presencia es nuestro mejor regalo. Si deseás hacer un presente, podés consultar los datos.', giftsButton: 'Ver cuenta o lista',
    photosTitle: 'Compartí tus fotos', photosCopy: 'Subí tus fotos del evento a nuestra carpeta compartida.', photosButton: 'Subir fotos',
    socialTitle: 'Instagram y redes', socialCopy: 'Etiquetanos usando nuestro hashtag:', socialButton: 'Ver Instagram',
    songsTitle: 'Sugerí una canción', songsCopy: 'Ayudanos a crear la playlist de la fiesta.', songsButton: 'Enviar canción',
    qrTitle: 'Tu pase', qrCopy: 'Presentá tu código QR en la entrada del salón.', qrButton: 'Ver mi pase QR',
    rsvpTitle: 'Confirmación de asistencia', rsvpDeadline: 'Por favor confirmá tu asistencia antes del 1 de noviembre.', rsvpButton: 'Confirmar asistencia',
    name: 'Nombre completo', attendance: '¿Vas a asistir?', attendanceOptions: ['Seleccioná una opción', 'Sí, voy a asistir', 'No voy a poder asistir'],
    food: 'Restricción alimentaria', foodOptions: ['Ninguna', 'Celíaco/a', 'Vegetariano/a', 'Vegano/a', 'Otra'], otherFood: 'Contanos cuál',
    message: 'Mensaje para los anfitriones', song: 'Canción y artista', submit: 'Confirmar', send: 'Enviar',
    success: '¡Gracias! Tu respuesta fue registrada.', songSuccess: '¡Gracias! Sumamos tu sugerencia.', error: 'No pudimos guardar tu respuesta.', retry: 'Reintentar',
    close: 'Cerrar', copy: 'Copiar alias', copied: 'Alias copiado.', missingLink: 'Esta integración todavía no fue configurada.',
    footer: 'Invitaciones digitales para momentos inolvidables', rights: 'Todos los derechos reservados', navigate: 'Ir a la siguiente sección'
  },
  pt: {
    region: 'pt-BR', skip: 'Ir para o conteúdo', loading: 'CARREGANDO EXPERIÊNCIA...', eventType: 'Meus 15 Anos',
    countdownEyebrow: 'Falta muito pouco', countdownTitle: 'Contagem regressiva', units: ['Dias', 'Horas', 'Minutos', 'Segundos'], countdownDone: 'O grande dia chegou!',
    locationTitle: 'Quando e onde?', map: 'Como chegar', calendar: 'Adicionar à agenda',
    quote: '“Há momentos especiais por si só, mas compartilhá-los com você os torna inesquecíveis.”',
    dressTitle: 'Código de vestimenta', dressSummary: 'Social completo', dressButton: 'Ver detalhes', dressDetails: 'Social completo. Terno ou vestido longo.',
    scheduleTitle: 'Programação', schedule: [['Recepção', 'Boas-vindas e coquetel.'], ['Jantar', 'Jantar e momentos especiais.'], ['Abertura da pista', 'A festa começa!'], ['Festa e encerramento', 'Festa e encerramento.']],
    parallax: 'Espero você para comemorar!', galleryTitle: 'Galeria de fotos', galleryCopy: 'Um passeio por momentos inesquecíveis',
    hotelsTitle: 'Hospedagem próxima', hotelsCopy: 'Opções para quem vem de longe.', hotelsButton: 'Ver hotéis',
    giftsTitle: 'Lista de presentes', giftsCopy: 'Sua presença é o nosso melhor presente. Consulte os dados se desejar presentear.', giftsButton: 'Ver dados',
    photosTitle: 'Compartilhe suas fotos', photosCopy: 'Envie as fotos para a nossa pasta.', photosButton: 'Enviar fotos',
    socialTitle: 'Instagram e redes', socialCopy: 'Marque a gente usando:', socialButton: 'Ver Instagram',
    songsTitle: 'Sugira uma música', songsCopy: 'Ajude a criar a playlist da festa.', songsButton: 'Enviar música',
    qrTitle: 'Seu convite', qrCopy: 'Apresente o QR code na entrada.', qrButton: 'Ver QR code',
    rsvpTitle: 'Confirmação de presença', rsvpDeadline: 'Confirme sua presença até 1º de novembro.', rsvpButton: 'Confirmar presença',
    name: 'Nome completo', attendance: 'Você vai comparecer?', attendanceOptions: ['Selecione', 'Sim, vou comparecer', 'Não poderei comparecer'],
    food: 'Restrição alimentar', foodOptions: ['Nenhuma', 'Celíaco/a', 'Vegetariano/a', 'Vegano/a', 'Outra'], otherFood: 'Conte qual é',
    message: 'Mensagem para os anfitriões', song: 'Música e artista', submit: 'Confirmar', send: 'Enviar',
    success: 'Obrigado! Sua resposta foi registrada.', songSuccess: 'Obrigado! Adicionamos sua sugestão.', error: 'Não foi possível salvar.', retry: 'Tentar novamente',
    close: 'Fechar', copy: 'Copiar alias', copied: 'Alias copiado.', missingLink: 'Esta integração ainda não foi configurada.',
    footer: 'Convites digitais para momentos inesquecíveis', rights: 'Todos os direitos reservados', navigate: 'Ir para a próxima seção'
  },
  en: {
    region: 'en-US', skip: 'Skip to content', loading: 'LOADING EXPERIENCE...', eventType: 'My 15th Birthday',
    countdownEyebrow: 'Almost time', countdownTitle: 'Countdown', units: ['Days', 'Hours', 'Minutes', 'Seconds'], countdownDone: 'The big day is here!',
    locationTitle: 'When and where?', map: 'Get directions', calendar: 'Add to calendar',
    quote: '“Some moments are special on their own, but sharing them with you makes them unforgettable.”',
    dressTitle: 'Dress code', dressSummary: 'Formal attire', dressButton: 'View details', dressDetails: 'Formal attire. Suit or floor-length dress.',
    scheduleTitle: 'Schedule', schedule: [['Welcome', 'Welcome drinks and reception.'], ['Dinner', 'Dinner and special moments.'], ['Dance floor', 'Let the celebration begin!'], ['Party and farewell', 'Party and event closing.']],
    parallax: 'I can’t wait to celebrate with you!', galleryTitle: 'Photo gallery', galleryCopy: 'A collection of unforgettable moments',
    hotelsTitle: 'Nearby accommodation', hotelsCopy: 'Options for out-of-town guests.', hotelsButton: 'View hotels',
    giftsTitle: 'Gift registry', giftsCopy: 'Your presence is the greatest gift. View the details if you wish to give something.', giftsButton: 'View details',
    photosTitle: 'Share your photos', photosCopy: 'Upload event photos to our shared folder.', photosButton: 'Upload photos',
    socialTitle: 'Instagram and social', socialCopy: 'Tag us using:', socialButton: 'View Instagram',
    songsTitle: 'Suggest a song', songsCopy: 'Help us build the party playlist.', songsButton: 'Send song',
    qrTitle: 'Your pass', qrCopy: 'Show your QR code at the entrance.', qrButton: 'View QR pass',
    rsvpTitle: 'RSVP', rsvpDeadline: 'Please reply by November 1.', rsvpButton: 'Respond',
    name: 'Full name', attendance: 'Will you attend?', attendanceOptions: ['Select an option', 'Yes, I’ll attend', 'I won’t be able to attend'],
    food: 'Dietary requirements', foodOptions: ['None', 'Gluten-free', 'Vegetarian', 'Vegan', 'Other'], otherFood: 'Tell us more',
    message: 'Message for the hosts', song: 'Song and artist', submit: 'Submit', send: 'Send',
    success: 'Thank you! Your response was recorded.', songSuccess: 'Thank you! We added your suggestion.', error: 'We couldn’t save your response.', retry: 'Try again',
    close: 'Close', copy: 'Copy alias', copied: 'Alias copied.', missingLink: 'This integration has not been configured yet.',
    footer: 'Digital invitations for unforgettable moments', rights: 'All rights reserved', navigate: 'Go to the next section'
  }
} as const;

export interface RivendellConfig {
  event: { name: string; dateTime: string; endDateTime: string; timezone: string; venue: string; address: string; calendarTitle: string };
  links: { maps?: string; photoUpload?: string; instagram?: string; rsvpEndpoint?: string; songSuggestionsEndpoint?: string };
  content: { quote?: string; hashtag: string; dressSummary?: string; dressDetails?: string; parallaxTitle?: string; rsvpDeadline?: string };
  gifts: { bank: string; holder: string; currency: string; account: string; alias: string; link?: string; visible: boolean };
  schedule: Array<{ time: string; title?: string; description?: string }>;
  gallery: Array<{ src: string; alt?: string }>;
  hotels: Array<{ name: string; address?: string; distance?: string; phone?: string; bookingUrl?: string; discount?: string; notes?: string }>;
  qrPass: { value: string };
  assets: { hero: string; heroPositionMobile: string; heroPositionDesktop: string; heroOverlay: number; parallax: string; ornamentTop: string; ornamentBottom: string; ornamentLeft: string; ornamentRight: string; navigationIcon: string };
  sections: Record<'hero' | 'countdown' | 'location' | 'quote' | 'dressCode' | 'schedule' | 'parallax' | 'gallery' | 'hotels' | 'gifts' | 'photoUpload' | 'social' | 'songSuggestions' | 'qrPass' | 'rsvp', boolean>;
  tones: Partial<Record<Exclude<keyof RivendellConfig['sections'], 'hero'>, RivendellTone>>;
  metadata: { title?: string; description?: string; private: boolean };
}

export const DEFAULT_RIVENDELL_CONFIG: RivendellConfig = {
  event: { name: 'Milena', dateTime: '2031-11-15T21:00:00-03:00', endDateTime: '2031-11-16T05:00:00-03:00', timezone: 'America/Montevideo', venue: 'Salón Eventos Premium', address: 'Av. Principal 1234, Montevideo', calendarTitle: 'Mis 15 años de Milena' },
  links: { maps: 'https://maps.google.com/?q=Montevideo', photoUpload: 'https://drive.google.com/', instagram: 'https://instagram.com/' },
  content: { hashtag: '#Milena15Años' },
  gifts: { bank: 'Banco de demostración', holder: 'Familia de Milena', currency: 'UYU', account: '0000000000', alias: 'MILENA.QUINCE', visible: true },
  schedule: [{ time: '21:00' }, { time: '22:30' }, { time: '00:00' }, { time: '03:30' }],
  gallery: [1, 2, 3, 4, 5].map((number) => ({ src: `/rivendell/images/foto-0${number}.jpg` })),
  hotels: [{ name: 'Hotel Central Plaza', address: 'Centro, Montevideo', distance: 'A 10 minutos del salón' }],
  qrPass: { value: 'RIVENDELL-DEMO-GUEST' },
  assets: {
    hero: '/rivendell/images/foto-01.png', heroPositionMobile: '68% center', heroPositionDesktop: '70% 24%', heroOverlay: 0.16,
    parallax: '/rivendell/images/foto-02.jpg', ornamentTop: '/rivendell/images/esq-sup-izq.png', ornamentBottom: '/rivendell/images/esq-sup-izq.png',
    ornamentLeft: '/rivendell/images/separador_izquierda.png', ornamentRight: '/rivendell/images/separador_derecha.png', navigationIcon: '/rivendell/images/navegar.png'
  },
  sections: { hero: true, countdown: true, location: true, quote: true, dressCode: true, schedule: true, parallax: true, gallery: true, hotels: true, gifts: true, photoUpload: true, social: true, songSuggestions: true, qrPass: true, rsvp: true },
  tones: { countdown: 'light', location: 'alternate', quote: 'light', dressCode: 'accent', schedule: 'light', gallery: 'alternate', hotels: 'accentDark', gifts: 'light', photoUpload: 'alternate', social: 'accentDark', songSuggestions: 'light', qrPass: 'alternate', rsvp: 'light' },
  metadata: { private: true }
};
