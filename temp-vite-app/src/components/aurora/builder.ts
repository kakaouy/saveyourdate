import type { InvitationSectionDefinition, InvitationBuilderDocument } from '../../domain/invitation-builder.ts';
import { composeInvitationSections } from '../../domain/invitation-builder.ts';
import type { AuroraConfig, AuroraTone } from './config.ts';
import { DEFAULT_AURORA_CONFIG } from './config.ts';

export const AURORA_BUILDER_SECTIONS: InvitationSectionDefinition[] = [
  { id: 'hero', label: 'Portada', required: true, locked: 'first', tone: 'light' },
  { id: 'dateStack', label: 'Fecha destacada' },
  { id: 'countdown', label: 'Cuenta regresiva' },
  { id: 'location', label: 'Ubicación y mapa' },
  { id: 'quote', label: 'Frase' },
  { id: 'dressCode', label: 'Código de vestimenta' },
  { id: 'schedule', label: 'Cronograma' },
  { id: 'parallax', label: 'Foto destacada', tone: 'light' },
  { id: 'gallery', label: 'Galería', tone: 'alternate' },
  { id: 'hotels', label: 'Alojamiento' },
  { id: 'gifts', label: 'Regalos' },
  { id: 'photoUpload', label: 'Álbum colaborativo' },
  { id: 'social', label: 'Instagram y hashtag', tone: 'accentDark' },
  { id: 'songSuggestions', label: 'Sugerencias de canciones' },
  { id: 'qrPass', label: 'Pase QR' },
  { id: 'rsvp', label: 'Confirmación de asistencia', locked: 'last' }
];

export const createAuroraBuilderDocument = (): InvitationBuilderDocument => ({
  version: 1,
  templateId: 'aurora',
  paletteId: 'lavanda-dorado',
  locale: 'es',
  sections: AURORA_BUILDER_SECTIONS.map(({ id }) => ({
    id,
    enabled: DEFAULT_AURORA_CONFIG.sections[id as keyof AuroraConfig['sections']]
  })),
  content: {
    event: DEFAULT_AURORA_CONFIG.event,
    links: DEFAULT_AURORA_CONFIG.links,
    content: DEFAULT_AURORA_CONFIG.content,
    gifts: DEFAULT_AURORA_CONFIG.gifts,
    schedule: DEFAULT_AURORA_CONFIG.schedule,
    gallery: DEFAULT_AURORA_CONFIG.gallery,
    hotels: DEFAULT_AURORA_CONFIG.hotels,
    qrPass: DEFAULT_AURORA_CONFIG.qrPass,
    assets: DEFAULT_AURORA_CONFIG.assets,
    metadata: DEFAULT_AURORA_CONFIG.metadata
  },
  status: 'draft'
});

export const createBuilderDocument = (
  templateId: string,
  paletteId: string,
  config: AuroraConfig
): InvitationBuilderDocument => ({
  version: 1,
  templateId,
  paletteId,
  locale: 'es',
  sections: AURORA_BUILDER_SECTIONS
    .filter(({ id }) => Object.prototype.hasOwnProperty.call(config.sections, id))
    .map(({ id }) => ({
      id,
      enabled: Boolean(config.sections[id as keyof AuroraConfig['sections']])
    })),
  content: {
    event: config.event, links: config.links, content: config.content, gifts: config.gifts,
    schedule: config.schedule, gallery: config.gallery, hotels: config.hotels,
    qrPass: config.qrPass, assets: config.assets, metadata: config.metadata
  },
  status: 'draft'
});

export const auroraConfigFromBuilder = (document: InvitationBuilderDocument): Partial<AuroraConfig> => {
  const gardenFloral = document.templateId === '15-jardin-floral';
  const eucalipto = document.templateId === 'boda-eucalipto';
  const sectionDefinitions = gardenFloral || eucalipto
    ? AURORA_BUILDER_SECTIONS.map((definition) => definition.id === 'hero'
      ? { ...definition, tone: 'light' as const }
      : { ...definition, tone: undefined })
    : AURORA_BUILDER_SECTIONS;
  const composed = composeInvitationSections(
    sectionDefinitions,
    document.sections,
    gardenFloral ? ['accent', 'alternate', 'light'] : eucalipto ? ['alternate', 'light', 'accent'] : ['light', 'accent']
  );
  const visible = new Set(composed.map(({ id }) => id));
  const sections = Object.fromEntries(
    AURORA_BUILDER_SECTIONS.map(({ id }) => [id, visible.has(id)])
  ) as AuroraConfig['sections'];
  const tones = Object.fromEntries(
    composed.filter(({ id }) => id !== 'hero').map(({ id, tone }) => [id, tone as AuroraTone])
  ) as AuroraConfig['tones'];

  return {
    ...(document.content as Partial<AuroraConfig>),
    sections,
    tones
  };
};
