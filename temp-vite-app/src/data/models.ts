export interface InvitationModel {
  id: string;
  title: string;
  category: 'wedding' | '15years' | 'other';
  description: string;
  badge?: string;
  demoName1: string;
  demoName2?: string;
  date: string;
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
    title: 'Minimalista Eucalipto',
    category: 'wedding',
    description: 'Menos es más. Tipografías modernas sans-serif combinadas con sutiles ramas de eucalipto sobre fondos blancos y limpios. Ideal para bodas contemporáneas e íntimas.',
    badge: 'Nuevo',
    demoName1: 'Tomás & Sofía',
    date: '16 de Enero, 2027',
    features: ['Cuenta Regresiva', 'Música', 'Confirmación RSVP', 'Código de Vestimenta'],
    themeClass: 'mock-theme-wedding',
    illustrationType: 'rings',
    musicTitle: 'L-O-V-E',
    musicArtist: 'Nat King Cole',
    location: 'Salón Quinta de Olivos, Buenos Aires'
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
