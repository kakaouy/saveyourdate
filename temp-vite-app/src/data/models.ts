export interface InvitationModel {
  id: string;
  title: string;
  category: 'wedding' | '15years' | 'other';
  description: string;
  badge?: string;
  demoName1: string;
  demoName2?: string;
  date: string;
  previewImage?: string;
  demoPath?: string;
  active?: boolean;
  order?: number;
  features: string[];
  themeClass: string;
  illustrationType: 'rings' | 'crown' | 'balloon';
  musicTitle?: string;
  musicArtist?: string;
  location?: string;
  includedSections?: string[];
  palettes?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export const INVITATION_MODELS: InvitationModel[] = [
  {
    id: 'boda-marfil',
    title: 'Editorial Marfil',
    category: 'wedding',
    description: '',
    badge: 'Más Elegido',
    demoName1: 'Matias & Sofía',
    date: '14 de Noviembre, 2026',
    features: [
      'Galería de fotos',
      'Música',
      'Frase',
      'Cronograma',
      'Ubicación',
      'Regalos',
      'Foto destacada con efecto parallax',
      'Confirmación RSVP'
    ],
    themeClass: 'mock-theme-wedding',
    illustrationType: 'rings',
    musicTitle: 'Perfect',
    musicArtist: 'Ed Sheeran',
    location: 'Estancia La Linda, Pilar, Buenos Aires',
    includedSections: [
      'gallery',
      'music',
      'quote',
      'agenda',
      'location',
      'gifts',
      'featuredPhoto',
      'rsvp'
    ],
    palettes: [
      { id: 'marfil', name: 'Marfil', color: '#d9cdbd' },
      { id: 'rosa', name: 'Rosa', color: '#d8b7bd' },
      { id: 'eucalipto', name: 'Eucalipto', color: '#859a87' },
      { id: 'azul', name: 'Azul', color: '#819ead' }
    ]
  },
  {
    id: 'boda-pleno',
    title: 'Voto Editorial',
    category: 'wedding',
    description: '',
    badge: 'Nuevo',
    demoName1: 'Clara & Tomás',
    date: '12 de Diciembre, 2026',
    features: [
      'Música',
      'Cuenta Regresiva',
      'Código de Vestimenta',
      'Regalos',
      'Confirmación RSVP'
    ],
    themeClass: 'mock-theme-wedding',
    illustrationType: 'rings',
    location: 'Casa del Lago, Montevideo',
    includedSections: [
      'music',
      'countdown',
      'dresscode',
      'gifts',
      'rsvp'
    ],
    palettes: [
      { id: 'negro', name: 'Negro', color: '#10100f' },
      { id: 'rosa', name: 'Rosa empolvado', color: '#c492a7' },
      { id: 'frambuesa', name: 'Frambuesa', color: '#a15a77' },
      { id: 'cielo', name: 'Celeste grisáceo', color: '#85acb0' },
      { id: 'petroleo', name: 'Azul petróleo', color: '#556e80' },
      { id: 'tinta', name: 'Azul tinta', color: '#3a3957' }
    ]
  },
  {
    id: 'boda-boho',
    title: 'Olivia Silvestre',
    category: 'wedding',
    description: 'Una propuesta orgánica y elegante, con ramas ilustradas, movimiento suave y una estética natural que acompaña cada sección.',
    badge: 'Tendencia',
    demoName1: 'Antonio & Ester',
    date: '18 de Octubre, 2026',
    features: [
      'Música',
      'Cuenta Regresiva',
      'Agenda',
      'Ubicación',
      'Confirmación RSVP',
      'Regalos / CBU',
      'Código de Vestimenta',
      'Cronograma',
      'Galería de fotos',
      'Álbum colaborativo'
    ],
    themeClass: 'mock-theme-wedding',
    illustrationType: 'rings',
    location: 'Ceremonia y recepción',
    palettes: [
      { id: 'olive', name: 'Oliva', color: '#A6AA78' },
      { id: 'terracotta', name: 'Terracota', color: '#B86F52' },
      { id: 'blue', name: 'Azul niebla', color: '#718A96' },
      { id: 'mauve', name: 'Malva', color: '#9A7889' }
    ]
  },
  {
    id: '15-glamour',
    title: 'Glamour Rosa',
    category: '15years',
    description: 'Brillos delicados, destellos rosa pastel y detalles dorados. Diseñado para una noche de ensueño donde tú eres la estrella.',
    badge: 'Popular',
    demoName1: 'Martina',
    date: '24 de Octubre, 2026',
    features: ['Cuenta Regresiva', 'Playlist Spotify', 'Confirmación RSVP', 'Dress Code'],
    themeClass: 'mock-theme-15years',
    illustrationType: 'crown',
    musicTitle: 'Don’t Start Now',
    musicArtist: 'Dua Lipa',
    location: 'Palacio Cristal, San Isidro'
  },
  {
    id: '15-sweet-jane',
    title: 'Sweet Jane',
    category: '15years',
    description: 'Una invitación fresca y romántica, con fotografía protagonista, tonos suaves y detalles pensados para celebrar los 15 con un estilo único.',
    badge: 'Nuevo',
    demoName1: 'Emma',
    date: '12 de Diciembre, 2026',
    previewImage: '/previews/sweet-jane.jpg',
    features: [
      'Música',
      'Cuenta Regresiva',
      'Galería de fotos',
      'Ubicación',
      'Código de Vestimenta',
      'Instagram',
      'Playlist Spotify',
      'Regalos / CBU',
      'Confirmación RSVP'
    ],
    themeClass: 'mock-theme-15years',
    illustrationType: 'crown',
    musicTitle: 'Rockstar',
    musicArtist: 'Duki',
    location: 'Salón Magnolia, Montevideo',
    includedSections: [
      'music',
      'countdown',
      'gallery',
      'location',
      'dresscode',
      'instagram',
      'playlist',
      'gifts',
      'rsvp'
    ],
    palettes: [
      { id: 'rose', name: 'Rosa antiguo', color: '#b9989a' },
      { id: 'blue', name: 'Azul bruma', color: '#8295ad' },
      { id: 'sage', name: 'Verde salvia', color: '#91a087' }
    ]
  },
  {
    id: '15-jardin-floral',
    title: 'Jardín Floral',
    category: '15years',
    description: 'Flores ilustradas, tonos frescos y una composición juvenil que combina información, galería y detalles del evento con aire artesanal.',
    badge: 'Nuevo',
    demoName1: 'Maite',
    date: '15 de Junio, 2027',
    previewImage: '/previews/jardin-floral.png',
    demoPath: '/desarrollo/quince/invite_002/index.html',
    active: true,
    order: 22,
    features: [
      'Cuenta Regresiva',
      'Ubicación',
      'Agregar al calendario',
      'Código de Vestimenta',
      'Regalos / CBU',
      'Playlist Spotify',
      'Galería de fotos',
      'Confirmación RSVP'
    ],
    themeClass: 'mock-theme-15years',
    illustrationType: 'crown',
    location: 'Casa Azul, Avenida Suarez 5445',
    includedSections: [
      'countdown',
      'location',
      'dresscode',
      'gifts',
      'playlist',
      'gallery',
      'rsvp'
    ],
    palettes: [
      { id: 'original', name: 'Original floral', color: '#9ed1aa' },
      { id: 'night', name: 'Noche coral', color: '#183b59' },
      { id: 'soft', name: 'Rosa suave', color: '#b9d4b4' }
    ]
  },
  {
    id: '15-estrellas',
    title: 'Noche de Estrellas',
    category: '15years',
    description: 'Un fondo azul profundo con constelaciones doradas sutiles. Para una quinceañera moderna que quiere brillar con luz propia.',
    demoName1: 'Valentina',
    date: '18 de Septiembre, 2026',
    features: ['Cuenta Regresiva', 'Libro de Firmas', 'Confirmación RSVP', 'Google Maps'],
    themeClass: 'mock-theme-15years',
    illustrationType: 'crown',
    musicTitle: 'Sky Full of Stars',
    musicArtist: 'Coldplay',
    location: 'Salón Terrazas, Palermo, CABA'
  },
  {
    id: '15-verona',
    title: 'Verona',
    category: '15years',
    description: 'Fotografía protagonista, flores en acuarela y una experiencia cálida y contemporánea para celebrar tus 15 años.',
    badge: 'Nuevo',
    demoName1: 'Leticia',
    date: '15 de Noviembre, 2031',
    previewImage: '/previews/verona.png',
    active: true,
    order: 23,
    features: ['Cuenta Regresiva', 'Galería de fotos', 'Cronograma', 'Ubicación', 'Código de Vestimenta', 'Regalos / CBU', 'Confirmación RSVP'],
    themeClass: 'mock-theme-verona',
    illustrationType: 'crown',
    location: 'Salón Eventos Premium, Montevideo',
    includedSections: ['countdown', 'gallery', 'schedule', 'location', 'dresscode', 'gifts', 'rsvp'],
    palettes: [
      { id: 'bordo-calida', name: 'Bordó cálida', color: '#a72039' },
      { id: 'verde-agua', name: 'Verde agua', color: '#69949b' }
    ]
  },
  {
    id: 'varezzia',
    title: 'Varezzia',
    category: '15years',
    description: 'Una propuesta romántica y editorial, con fotografía protagonista, ornamentos florales y detalles elegantes para celebrar tus 15 años.',
    badge: 'Nuevo',
    demoName1: 'Martina',
    date: '15 de Noviembre, 2031',
    previewImage: '/varezzia/images/foto-01.png',
    active: true,
    order: 24,
    features: [
      'Cuenta Regresiva',
      'Ubicación',
      'Agregar al calendario',
      'Código de Vestimenta',
      'Cronograma',
      'Foto destacada con efecto parallax',
      'Galería de fotos',
      'Alojamiento',
      'Regalos / CBU',
      'Álbum colaborativo',
      'Instagram',
      'Sugerencia de canciones',
      'Pase QR',
      'Confirmación RSVP',
      'Multiidioma'
    ],
    themeClass: 'mock-theme-varezzia',
    illustrationType: 'crown',
    location: 'Salón Eventos Premium, Montevideo',
    includedSections: [
      'countdown',
      'location',
      'dresscode',
      'schedule',
      'featuredPhoto',
      'gallery',
      'hotels',
      'gifts',
      'photoUpload',
      'instagram',
      'songSuggestions',
      'qr',
      'rsvp'
    ],
    palettes: [
      { id: 'bordo-calida', name: 'Bordó cálida', color: '#bc3771' },
      { id: 'verde-agua', name: 'Verde agua', color: '#05838e' }
    ]
  },
  {
    id: 'otros-baby',
    title: 'Baby Shower Especial',
    category: 'other',
    description: 'Diseño ultra tierno con animales de acuarela ilustrados, nubes de algodón y globos aerostáticos. Perfecto para celebrar la dulce espera.',
    badge: 'Nuevo',
    demoName1: 'Baby Benjamín',
    date: '08 de Agosto, 2026',
    features: ['Sugerencias de Regalo', 'Confirmación RSVP', 'Ubicación', 'Organizador'],
    themeClass: 'mock-theme-other',
    illustrationType: 'balloon',
    musicTitle: 'Lullaby',
    musicArtist: 'Brahms Sweet Music',
    location: 'Casa de Té - Las Lilas, Nordelta'
  },
  {
    id: 'otros-aniversario',
    title: 'Aniversario de Oro',
    category: 'other',
    description: 'Una celebración de amor inquebrantable. Tipografías en oro mate combinadas con fondos blancos limpios y marcos elegantes.',
    demoName1: 'Elena & Roberto',
    demoName2: '50 Años de Amor',
    date: '31 de Octubre, 2026',
    features: ['Línea de Tiempo', 'Galería de Fotos', 'Confirmación RSVP', 'Google Maps'],
    themeClass: 'mock-theme-other',
    illustrationType: 'rings',
    musicTitle: 'Fly Me to the Moon',
    musicArtist: 'Frank Sinatra',
    location: 'Salón De las Américas, Recoleta, CABA'
  },
  {
    id: 'boda-eucalipto',
    previewImage: '/previews/minimalista-eucalipto.webp',
    title: 'Minimalista Eucalipto',
    category: 'wedding',
    description: 'Menos es más. Tipografías modernas sans-serif combinadas con sutiles ramas de eucalipto sobre fondos blancos y limpios. Ideal para bodas contemporáneas e íntimas.',
    badge: 'Nuevo',
    demoName1: 'Tomás & Sofía',
    date: '16 de Enero, 2027',
    features: [
      'Música',
      'Cuenta Regresiva',
      'Agenda',
      'Ubicación',
      'Foto destacada con efecto parallax',
      'Código de Vestimenta',
      'Regalos / CBU',
      'Confirmación RSVP'
    ],
    themeClass: 'mock-theme-wedding',
    illustrationType: 'rings',
    musicTitle: 'L-O-V-E',
    musicArtist: 'Nat King Cole',
    location: 'Salón Quinta de Olivos, Buenos Aires',
    includedSections: [
      'music',
      'countdown',
      'agenda',
      'location',
      'featuredPhoto',
      'dresscode',
      'gifts',
      'rsvp'
    ],
    palettes: [
      { id: 'eucalipto', name: 'Eucalipto y dorado', color: '#496257' },
      { id: 'oliva', name: 'Oliva y champagne', color: '#66704c' },
      { id: 'petroleo', name: 'Petróleo y arena', color: '#365d63' }
    ]
  },
  {
    id: 'boda-vinculo-noir',
    previewImage: '/previews/vinculo-noir.webp',
    title: 'Vínculo Noir',
    category: 'wedding',
    description: 'Fotografía en blanco y negro, composición editorial y acentos profundos para una boda moderna y sofisticada.',
    badge: 'Nuevo',
    demoName1: 'Renata & Nicolás',
    date: '10 de Octubre, 2026',
    features: [
      'Música',
      'Cuenta Regresiva',
      'Agenda',
      'Ubicación',
      'Foto destacada con efecto parallax',
      'Código de Vestimenta',
      'Regalos / CBU',
      'Galería de fotos',
      'Confirmación RSVP'
    ],
    themeClass: 'mock-theme-wedding',
    illustrationType: 'rings',
    musicTitle: 'The Look of Love',
    musicArtist: 'Diana Krall',
    location: 'Palacio Sans Souci, Buenos Aires',
    includedSections: ['music','countdown','agenda','location','featuredPhoto','dresscode','gifts','gallery','rsvp'],
    palettes: [
      { id: 'oro', name: 'Oro antiguo', color: '#ae8b52' },
      { id: 'rosa', name: 'Rosa empolvado', color: '#b7838f' },
      { id: 'verde', name: 'Verde inglés', color: '#6f8b75' }
    ]
  },
  {
    id: 'boda-flores-papel',
    previewImage: '/previews/flores-papel.webp',
    title: 'Flores de Papel',
    category: 'wedding',
    description: 'Textura de papel, flores de acuarela y una estética delicada que alterna ornamentos entre cada sección.',
    badge: 'Nuevo',
    demoName1: 'Marina & Rafael',
    date: '20 de Marzo, 2027',
    features: [
      'Música',
      'Cuenta Regresiva',
      'Agenda',
      'Ubicación',
      'Foto destacada con efecto parallax',
      'Código de Vestimenta',
      'Regalos / CBU',
      'Menú',
      'Confirmación RSVP'
    ],
    themeClass: 'mock-theme-wedding',
    illustrationType: 'rings',
    musicTitle: 'Trevo',
    musicArtist: 'ANAVITÓRIA',
    location: 'Casa Petra, São Paulo',
    includedSections: ['music','countdown','agenda','location','featuredPhoto','dresscode','gifts','menu','rsvp'],
    palettes: [
      { id: 'azul-hielo', name: 'Azul hielo', color: '#536f88' },
      { id: 'rosa-antiguo', name: 'Rosa antiguo', color: '#936779' },
      { id: 'salvia', name: 'Verde salvia', color: '#64796d' },
      { id: 'lavanda', name: 'Lavanda', color: '#716985' }
    ]
  },
  {
    id: 'boda-brindis-papel',
    previewImage: '/previews/brindis-papel.webp',
    title: 'Brindis de Papel',
    category: 'wedding',
    description: 'Trazos de manos alzadas, textura de papel y bloques de color para una boda alegre, artística y contemporánea.',
    badge: 'Nuevo',
    demoName1: 'Valentina & Matías',
    date: '14 de Febrero, 2027',
    features: [
      'Música',
      'Cuenta Regresiva',
      'Ceremonia y celebración en una ubicación',
      'Foto destacada con efecto parallax',
      'Código de Vestimenta',
      'Regalos / CBU',
      'Mensajes',
      'Menú',
      'Confirmación RSVP'
    ],
    themeClass: 'mock-theme-wedding',
    illustrationType: 'rings',
    musicTitle: 'Brillas',
    musicArtist: 'León Larregui',
    location: 'Estancia Villa María, Buenos Aires',
    includedSections: ['music','countdown','agenda','location','featuredPhoto','dresscode','gifts','messages','menu','rsvp'],
    palettes: [
      { id: 'azul', name: 'Azul vivo', color: '#2f7cf4' },
      { id: 'coral', name: 'Coral terracota', color: '#df735f' },
      { id: 'verde', name: 'Verde jardín', color: '#5f8f6d' }
    ]
  },
  {
    id: '15-neon',
    title: 'Neon Party',
    category: '15years',
    description: 'Estilo vibrante y moderno con luces de neón rosa, azul y morado sobre fondo oscuro. Diseñado para una fiesta llena de ritmo, baile y diversión.',
    badge: 'Tendencia',
    demoName1: 'Sofía',
    date: '07 de Noviembre, 2026',
    features: ['Cuenta Regresiva', 'Playlist Spotify', 'Confirmación RSVP', 'Dress Code'],
    themeClass: 'mock-theme-15years',
    illustrationType: 'crown',
    musicTitle: 'Levitating',
    musicArtist: 'Dua Lipa',
    location: 'Espacio Black, San Isidro'
  },
  {
    id: 'otros-graduacion',
    title: 'Graduación Elegante',
    category: 'other',
    description: 'Celebrá el fin de una gran etapa con un diseño en negro y dorado brillante. Marcos elegantes y detalles de confeti para destacar tus logros.',
    badge: 'Popular',
    demoName1: 'Graduación de Lucía',
    demoName2: 'Ingeniera Civil',
    date: '18 de Diciembre, 2026',
    features: ['Confirmación RSVP', 'Ubicación', 'Sugerencia de Regalos'],
    themeClass: 'mock-theme-other',
    illustrationType: 'balloon',
    musicTitle: 'Celebration',
    musicArtist: 'Kool & The Gang',
    location: 'Salón del Sol, Recoleta'
  }
];
