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
}

export const INVITATION_MODELS: InvitationModel[] = [
  {
    id: 'boda-marfil',
    title: 'Clásico Marfil',
    category: 'wedding',
    description: 'Elegancia pura con texturas florales sutiles y tipografía serif sofisticada. Ideal para bodas tradicionales y distinguidas.',
    badge: 'Más Elegido',
    demoName1: 'Matias & Sofía',
    date: '14 de Noviembre, 2026',
    features: ['Cuenta Regresiva', 'Música', 'Confirmación RSVP', 'Google Maps'],
    themeClass: 'mock-theme-wedding',
    illustrationType: 'rings',
    musicTitle: 'Perfect',
    musicArtist: 'Ed Sheeran',
    location: 'Estancia La Linda, Pilar, Buenos Aires'
  },
  {
    id: 'boda-boho',
    title: 'Rústico Boho',
    category: 'wedding',
    description: 'Tonos tierra cálidos, detalles de hojas de eucalipto secas y un estilo relajado pero refinado para parejas amantes de la naturaleza.',
    badge: 'Tendencia',
    demoName1: 'Facundo & Camila',
    date: '05 de Diciembre, 2026',
    features: ['Cuenta Regresiva', 'Regalos / CBU', 'Confirmación RSVP', 'Google Maps'],
    themeClass: 'mock-theme-wedding',
    illustrationType: 'rings',
    musicTitle: 'A Thousand Years',
    musicArtist: 'Christina Perri',
    location: 'Salón El Bosque, Tigre, Buenos Aires'
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
  }
];
