import type { ComponentType } from 'react';
import { INVITATION_MODELS } from '../../data/models';
import type { InvitationModel } from '../../data/models';
import { AuroraInvitation } from '../aurora/AuroraInvitation';
import { DEFAULT_AURORA_CONFIG } from '../aurora/config';
import type { AuroraConfig, AuroraLocale, AuroraPaletteTokens } from '../aurora/config';
import { NoirInvitation } from '../noir/NoirInvitation';
import { PaperFloralInvitation } from '../paper-floral/PaperFloralInvitation';
import { SienaInvitation } from '../siena/SienaInvitation';
import { AmalfiInvitation } from '../amalfi/AmalfiInvitation';
import './catalog-invitation.css';

type CatalogPreviewProps = {
  locale: AuroraLocale;
  palette: never;
  embedded?: boolean;
  config?: Partial<AuroraConfig>;
  sectionOrder?: string[];
};

const fallbackPreview: Record<InvitationModel['category'], string> = {
  wedding: '/previews/minimalista-eucalipto.webp',
  '15years': '/previews/aurora.png',
  other: '/previews/brindis-papel.webp'
};

const dateForCategory: Record<InvitationModel['category'], string> = {
  wedding: '2027-11-14T20:30:00-03:00',
  '15years': '2027-11-15T21:00:00-03:00',
  other: '2027-12-18T20:00:00-03:00'
};

const mapSections = (model: InvitationModel): AuroraConfig['sections'] => {
  if (model.id === 'boda-pleno') return {
    hero: true, dateStack: false, countdown: true, location: true, quote: true,
    dressCode: true, schedule: true, parallax: false, gallery: false, hotels: false,
    gifts: true, photoUpload: true, social: false, songSuggestions: false, qrPass: false, rsvp: true
  };
  if (model.id === 'boda-eucalipto') return {
    hero: true, dateStack: true, countdown: false, location: true, quote: false,
    dressCode: true, schedule: true, parallax: true, gallery: false, hotels: false,
    gifts: false, photoUpload: false, social: false, songSuggestions: false, qrPass: false, rsvp: true
  };
  const source = new Set((model.includedSections || model.features).map((item) => item.toLowerCase()));
  const has = (...needles: string[]) => [...source].some((item) => needles.some((needle) => item.includes(needle)));
  return {
    hero: true,
    dateStack: model.id === 'boda-boho' || has('date', 'fecha'),
    countdown: has('countdown', 'cuenta regresiva'),
    location: has('location', 'ubicación', 'google maps'),
    quote: has('quote', 'frase', 'firmas'),
    dressCode: has('dresscode', 'dress code', 'vestimenta'),
    schedule: has('agenda', 'schedule', 'cronograma'),
    parallax: has('featuredphoto', 'featured photo', 'foto destacada'),
    gallery: has('gallery', 'galería'),
    hotels: has('hotels', 'alojamiento'),
    gifts: has('gifts', 'regalos', 'pago'),
    photoUpload: has('photoupload', 'photo upload', 'álbum colaborativo'),
    social: has('instagram', 'social'),
    songSuggestions: has('music', 'música', 'playlist', 'cancion'),
    qrPass: has('qr'),
    rsvp: true
  };
};

export const createCatalogConfig = (model: InvitationModel): AuroraConfig => {
  const dateTime = model.id === 'boda-marfil' ? '2026-08-22T18:00:00-03:00' : model.id === 'boda-pleno' ? '2026-12-12T19:30:00-03:00' : model.id === 'boda-boho' ? '2026-11-14T17:30:00-03:00' : model.id === 'boda-eucalipto' ? '2026-11-14T18:30:00-03:00' : model.id === 'boda-vinculo-noir' ? '2026-10-10T18:30:00-03:00' : model.id === 'boda-flores-papel' ? '2027-03-20T17:00:00-03:00' : model.id === '15-sweet-jane' ? '2026-08-22T20:30:00-03:00' : model.id === '15-jardin-floral' ? '2027-06-15T21:00:00-03:00' : dateForCategory[model.category];
  const eventType = model.category === 'wedding' ? 'Nuestra boda' : model.category === '15years' ? 'Mis 15 años' : 'Celebración especial';
  const marfilImages = [1, 2, 3, 4].map((number) => ({
    src: `/demos/boda-elegante-minimalista/assets/images/galeria/foto-0${number}.jpg`,
    alt: model.demoName1
  }));
  const votoSchedule = [
    { time: '19:30', title: 'Ceremonia', description: 'El comienzo de nuestra historia.' },
    { time: '21:00', title: 'Cena', description: 'Una mesa para encontrarnos y brindar.' },
    { time: '23:30', title: 'Fiesta', description: 'Música, baile y celebración.' },
    { time: '02:00', title: 'Trasnoche', description: 'Seguimos compartiendo la noche.' }
  ];
  const marfilSchedule = [
    { time: '18:00', title: 'Ceremonia', description: 'Parroquia del Prado · Av. Joaquín Suárez 3480' },
    { time: '20:00', title: 'Recepción', description: 'Salón del Lago · Camino de los Aromos 2150' },
    { time: '21:00', title: 'Cena', description: 'Una mesa compartida, brindis y momentos para recordar.' },
    { time: '23:30', title: 'Fiesta', description: 'Que empiece la música y una noche para bailar sin mirar el reloj.' }
  ];
  const oliviaSchedule = [
    { time: '17:00', title: 'Bienvenida', description: 'Recibimos a nuestros invitados y compartimos el primer brindis.' },
    { time: '17:30', title: 'Ceremonia', description: 'El momento de decir sí y comenzar esta nueva historia.' },
    { time: '19:00', title: 'Cóctel', description: 'Sabores, música y encuentros antes de la gran celebración.' },
    { time: '20:30', title: 'Cena', description: 'Una mesa compartida para brindar con quienes más queremos.' },
    { time: '22:30', title: 'Fiesta', description: 'Música, baile y celebración.' },
    { time: '02:00', title: 'Fin del evento', description: 'Nos despedimos con el corazón lleno de recuerdos.' }
  ];
  const oliviaGallery = [1, 2, 3, 4, 5].map((number) => ({
    src: `/catalog/boda-boho/gallery-${number}.jpg`,
    alt: `Antonio y Ester · fotografía ${number}`
  }));
  const sweetJaneGallery = [1, 2, 3, 4, 5, 6, 7, 8].map((number) => ({
    src: `/desarrollo/quince/invite_001/assets/juanita-galeria-0${number}.jpg`,
    alt: `Emma · fotografía ${number}`
  }));
  const gardenGallery = ['tree', 'grass', 'city', 'mural'].map((name, index) => ({
    src: `/desarrollo/quince/invite_002/assets/maite-portrait-${name}.jpg`,
    alt: `Maite · fotografía ${index + 1}`
  }));
  return {
    ...DEFAULT_AURORA_CONFIG,
    event: {
      ...DEFAULT_AURORA_CONFIG.event,
      name: model.id === 'boda-eucalipto' ? 'Martín & Sofía' : model.id === 'boda-vinculo-noir' ? 'Renata & Nicolás' : model.id === 'boda-flores-papel' ? 'Marina & Rafael' : model.demoName1,
      dateTime,
      endDateTime: dateTime.replace('20:30', '05:30').replace('21:00', '05:00').replace('20:00', '01:00'),
      venue: model.location?.split(',')[0] || 'Espacio de celebración',
      address: model.id === 'boda-pleno' ? 'Camino de los Aromos 2150' : model.id === 'boda-boho' ? 'San Martín 1035, Ciudad de Buenos Aires' : model.location || 'Montevideo, Uruguay',
      calendarTitle: `${eventType} · ${model.demoName1}`
    },
    content: {
      ...DEFAULT_AURORA_CONFIG.content,
      heroQuote: model.id === '15-jardin-floral' ? 'Quiero invitarte a una noche épica, llena de magia y alegría.' : model.description || 'Una fecha especial, una celebración inolvidable.',
      quote: model.id === 'boda-marfil' ? 'La mejor parte de nuestra historia todavía está por escribirse.' : model.description || 'Compartir este momento con vos lo hace todavía más especial.',
      heroKicker: model.category === 'wedding' ? 'NOS CASAMOS' : model.category === '15years' ? 'MIS QUINCE' : 'CELEBREMOS',
      eventType,
      hashtag: `#${model.demoName1.replace(/[^a-zA-ZÀ-ÿ0-9]/g, '')}`,
      dressSummary: model.id === '15-sweet-jane' ? 'Elegante. Reservamos el blanco para la cumpleañera.' : DEFAULT_AURORA_CONFIG.content.dressSummary,
      dressDetails: model.id === '15-sweet-jane' ? 'Orientación para tu vestuario: elegante. Reservamos el blanco para la cumpleañera.' : DEFAULT_AURORA_CONFIG.content.dressDetails,
      parallaxTitle: model.id === 'boda-marfil' ? 'Ana & Juan' : `Celebremos ${model.demoName1}`
    },
    assets: {
      ...DEFAULT_AURORA_CONFIG.assets,
      hero: model.id === 'boda-boho' ? '/catalog/boda-boho/hero.jpg' : model.id === '15-sweet-jane' ? '/desarrollo/quince/invite_001/assets/juanita-portada.png' : model.id === '15-jardin-floral' ? '/desarrollo/quince/invite_002/assets/maite-portrait-mural.jpg' : model.id === 'boda-eucalipto' ? '/desarrollo/boda/invite_004/assets/portada-esquina.png' : model.id === 'boda-vinculo-noir' ? '/desarrollo/boda/invite_005/assets/photo-01.jpg' : model.previewImage || fallbackPreview[model.category],
      ornamentTop: model.id === '15-jardin-floral' ? '/desarrollo/quince/invite_002/assets/floral-top.png' : DEFAULT_AURORA_CONFIG.assets.ornamentTop,
      ornamentBottom: model.id === '15-jardin-floral' ? '/desarrollo/quince/invite_002/assets/floral-bottom.png' : DEFAULT_AURORA_CONFIG.assets.ornamentBottom,
      parallax: model.id === 'boda-marfil' ? '/demos/boda-elegante-minimalista/assets/images/galeria/foto-06.jpg' : model.id === 'boda-eucalipto' ? '/desarrollo/boda/invite_004/assets/pareja.jpg' : model.id === 'boda-vinculo-noir' ? '/desarrollo/boda/invite_005/assets/photo-02.jpg' : model.previewImage || fallbackPreview[model.category],
      ornamentLeft: ['boda-boho', '15-sweet-jane'].includes(model.id) ? '/catalog/boda-boho/ornament-left.png' : model.id === '15-jardin-floral' ? '/desarrollo/quince/invite_002/assets/floral-top.png' : model.id === 'boda-eucalipto' ? '/desarrollo/boda/invite_004/assets/ornamento-izquierda.png' : model.id === 'boda-vinculo-noir' ? '/desarrollo/boda/invite_005/assets/branch-white.png' : DEFAULT_AURORA_CONFIG.assets.ornamentLeft,
      ornamentRight: ['boda-boho', '15-sweet-jane'].includes(model.id) ? '/catalog/boda-boho/ornament-right.png' : model.id === '15-jardin-floral' ? '/desarrollo/quince/invite_002/assets/floral-bottom.png' : model.id === 'boda-eucalipto' ? '/desarrollo/boda/invite_004/assets/ornamento-izquierda.png' : model.id === 'boda-vinculo-noir' ? '/desarrollo/boda/invite_005/assets/branch-white.png' : DEFAULT_AURORA_CONFIG.assets.ornamentRight,
      heroPositionMobile: 'center top',
      heroPositionDesktop: 'center top',
      heroOverlay: model.id.includes('neon') || model.id.includes('noir') ? 0.35 : 0.12
    },
    gallery: model.id === 'boda-marfil' ? marfilImages : model.id === 'boda-boho' ? oliviaGallery : model.id === '15-sweet-jane' ? sweetJaneGallery : model.id === '15-jardin-floral' ? gardenGallery : model.id === 'boda-vinculo-noir' ? [1, 3, 4].map((number) => ({ src: `/desarrollo/boda/invite_005/assets/photo-0${number}.jpg`, alt: 'Renata y Nicolás' })) : DEFAULT_AURORA_CONFIG.gallery,
    schedule: model.id === 'boda-marfil' ? marfilSchedule : model.id === 'boda-pleno' ? votoSchedule : model.id === 'boda-boho' ? oliviaSchedule : DEFAULT_AURORA_CONFIG.schedule,
    sections: mapSections(model),
    tones: model.id === 'boda-eucalipto' ? {
      ...DEFAULT_AURORA_CONFIG.tones,
      dateStack: 'alternate', location: 'light', dressCode: 'accent', schedule: 'alternate',
      parallax: 'light', gifts: 'accent', songSuggestions: 'alternate', rsvp: 'light'
    } : model.id === '15-jardin-floral' ? {
      ...DEFAULT_AURORA_CONFIG.tones,
      countdown: 'accent', location: 'alternate', dressCode: 'light', gallery: 'accent',
      gifts: 'alternate', songSuggestions: 'light', rsvp: 'accent'
    } : model.id === 'boda-boho' ? {
      ...DEFAULT_AURORA_CONFIG.tones,
      dateStack: 'accent', countdown: 'light', location: 'accent', quote: 'light',
      dressCode: 'accent', schedule: 'light', gallery: 'accent', gifts: 'light',
      photoUpload: 'accent', rsvp: 'light'
    } : DEFAULT_AURORA_CONFIG.tones,
    metadata: {
      private: true,
      title: `${model.title} · ${model.demoName1}`,
      description: model.description
    }
  };
};

const paletteTokens = (model: InvitationModel, paletteId: string): AuroraPaletteTokens => {
  const primary = model.palettes?.find(({ id }) => id === paletteId)?.color || model.palettes?.[0]?.color ||
    (model.category === 'wedding' ? '#8b7565' : model.category === '15years' ? '#9d6f91' : '#678b8a');
  if (model.id === 'boda-pleno') return {
    fondo: '#f4efe5', alterno: '#e6d7bf', titulos: primary, secundario: '#e6d7bf',
    acento: primary, acentoOscuro: primary, texto: primary, botones: primary,
    bordes: primary, ornamentos: primary, claro: '#fffdf8', foco: primary
  };
  if (model.id === 'boda-boho') return {
    fondo: '#f7f4ed', alterno: primary, titulos: '#25281f', secundario: '#e7e8da',
    acento: primary, acentoOscuro: primary, texto: '#25281f', botones: primary,
    bordes: '#cdd0b2', ornamentos: primary, claro: '#ffffff', foco: primary
  };
  if (model.id === '15-sweet-jane') return {
    fondo: '#fbf8f5', alterno: '#f4ece3', titulos: primary, secundario: '#ead7d0',
    acento: primary, acentoOscuro: '#8f6f68', texto: '#5d4a42', botones: '#9a746c',
    bordes: '#ead7d0', ornamentos: '#8fa0b4', claro: '#fffdfb', foco: primary
  };
  if (model.id === '15-jardin-floral') return {
    fondo: '#fdfcf8', alterno: '#f7f1e5', titulos: '#6f877f', secundario: '#f7f1e5',
    acento: primary, acentoOscuro: '#6f8f85', texto: '#526b63', botones: '#6f8f85',
    bordes: '#b9d4c0', ornamentos: '#ff8a73', claro: '#ffffff', foco: '#ffb544'
  };
  if (model.id === 'amalfi') {
    const amalfiPalettes: Record<string, AuroraPaletteTokens> = {
      'menta-ciruela': {
        fondo:'#fffaf2', alterno:'#ddefe6', titulos:'#4d3457', secundario:'#f2cd64',
        acento:'#e8e0f2', acentoOscuro:'#4d3457', texto:'#513f55', botones:'#4d3457',
        bordes:'#c7dbd0', ornamentos:'#9bcbb7', claro:'#fffdf8', foco:'#6e4d78'
      },
      'lavanda-petroleo': {
        fondo:'#fcf9ff', alterno:'#e4ddf2', titulos:'#244f52', secundario:'#f1cf67',
        acento:'#d8eee6', acentoOscuro:'#244f52', texto:'#35585a', botones:'#244f52',
        bordes:'#c8ddd7', ornamentos:'#a8cfbf', claro:'#fffdf8', foco:'#376c70'
      },
      'aqua-borgona': {
        fondo:'#fffaf7', alterno:'#d9efe8', titulos:'#682e50', secundario:'#f0c95f',
        acento:'#f1dce7', acentoOscuro:'#682e50', texto:'#5a4050', botones:'#682e50',
        bordes:'#d8c5cf', ornamentos:'#9acdbd', claro:'#fffdf9', foco:'#874367'
      },
      'azul-polvo-champagne': {
        fondo:'#fbfaf6', alterno:'#dfe8ec', titulos:'#4f6c79', secundario:'#f0e8d7',
        acento:'#b69b68', acentoOscuro:'#3d5967', texto:'#48575d', botones:'#3d5967',
        bordes:'#d7c8aa', ornamentos:'#c0a56f', claro:'#ffffff', foco:'#725b34'
      }
    };
    return amalfiPalettes[paletteId] || amalfiPalettes['menta-ciruela'];
  }
  if (model.id === 'boda-eucalipto') return {
    fondo: '#f7f4ed', alterno: '#dce4dd', titulos: '#496257', secundario: '#eef1ec',
    acento: '#496257', acentoOscuro: '#24302b', texto: '#24302b', botones: '#9a7540',
    bordes: '#b8c7be', ornamentos: '#496257', claro: '#ffffff', foco: '#9a7540'
  };
  if (model.id === 'boda-flores-papel') {
    const paperPalette: Record<string, { dark: string; ice: string }> = {
      'azul-hielo': { dark: '#536f88', ice: '#e9f0f5' },
      'rosa-antiguo': { dark: '#936779', ice: '#f2e9ec' },
      salvia: { dark: '#64796d', ice: '#e9efeb' },
      lavanda: { dark: '#716985', ice: '#eeebf2' }
    };
    const selected = paperPalette[paletteId] || paperPalette['azul-hielo'];
    return { fondo:'#fbfbfa', alterno:selected.ice, titulos:'#263340', secundario:selected.ice,
      acento:primary, acentoOscuro:selected.dark, texto:'#263340', botones:selected.dark,
      bordes:'#c8d1d8', ornamentos:primary, claro:'#ffffff', foco:selected.dark };
  }
  const dark = model.id.includes('neon') || model.id.includes('noir') || (model.id === 'boda-pleno' && paletteId === 'negro');
  return {
    fondo: dark ? '#111217' : '#fbf8f3',
    alterno: dark ? '#20212a' : '#eee7df',
    titulos: dark ? '#f8f2e8' : primary,
    secundario: dark ? '#292a34' : '#f4ece4',
    acento: primary,
    acentoOscuro: dark ? '#07080b' : primary,
    texto: dark ? '#eee9e1' : '#424744',
    botones: primary,
    bordes: dark ? '#555762' : '#d7c9ba',
    ornamentos: primary,
    claro: '#ffffff',
    foco: primary
  };
};

function CatalogInvitation({ modelId, palette, ...props }: CatalogPreviewProps & { modelId: string }) {
  const model = INVITATION_MODELS.find(({ id }) => id === modelId) || INVITATION_MODELS[0];
  if (model.id === 'boda-vinculo-noir') return <NoirInvitation
    {...props}
    paletteTokens={paletteTokens(model, String(palette))}
  />;
  if (model.id === 'boda-flores-papel') return <PaperFloralInvitation
    {...props}
    paletteTokens={paletteTokens(model, String(palette))}
  />;
  if (model.id === 'siena') return <SienaInvitation
    {...props}
    config={props.config || createCatalogConfig(model)}
    paletteTokens={paletteTokens(model, String(palette))}
  />;
  if (model.id === 'amalfi') return <AmalfiInvitation
    {...props}
    config={props.config || createCatalogConfig(model)}
    paletteTokens={paletteTokens(model, String(palette))}
  />;
  return <AuroraInvitation
    {...props}
    palette="verde-dorado"
    paletteTokens={paletteTokens(model, String(palette))}
    modelClass={`catalog-generated catalog-${model.category} catalog-${model.id}`}
    editorialHero={model.category === 'wedding'}
    marfilHero={model.id === 'boda-marfil'}
    votoHero={model.id === 'boda-pleno'}
    oliviaHero={model.id === 'boda-boho'}
    sweetJaneHero={model.id === '15-sweet-jane'}
    gardenHero={model.id === '15-jardin-floral'}
    eucaliptoHero={model.id === 'boda-eucalipto'}
    sectionOrder={model.id === 'boda-marfil' ? ['hero','quote','schedule','location','gifts','parallax','rsvp'] : model.id === 'boda-eucalipto' ? ['hero','dateStack','location','parallax','dressCode','schedule','rsvp','closing'] : props.sectionOrder}
    globalPetals={model.category === '15years' && !['15-sweet-jane', '15-jardin-floral'].includes(model.id)}
    carouselGallery={model.id !== 'boda-boho'}
  />;
}

export const createCatalogPreview = (modelId: string): ComponentType<CatalogPreviewProps> => {
  const Preview = (props: CatalogPreviewProps) => <CatalogInvitation {...props} modelId={modelId} />;
  Preview.displayName = `CatalogPreview_${modelId}`;
  return Preview;
};
