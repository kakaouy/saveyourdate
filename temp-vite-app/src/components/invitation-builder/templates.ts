import type { ComponentType } from 'react';
import type { InvitationBuilderDocument } from '../../domain/invitation-builder';
import type { InvitationSectionDefinition } from '../../domain/invitation-builder';
import type { AuroraConfig, AuroraLocale } from '../aurora/config';
import { AuroraInvitation } from '../aurora/AuroraInvitation';
import { AURORA_BUILDER_SECTIONS, createAuroraBuilderDocument, createBuilderDocument } from '../aurora/builder';
import { AstraeaInvitation } from '../astraea/AstraeaInvitation';
import { ASTRAEA_PALETTES, DEFAULT_ASTRAEA_CONFIG } from '../astraea/config';
import { CoruscantInvitation } from '../coruscant/CoruscantInvitation';
import { CORUSCANT_PALETTES, DEFAULT_CORUSCANT_CONFIG } from '../coruscant/config';
import { RosewoodInvitation } from '../rosewood/RosewoodInvitation';
import { DEFAULT_ROSEWOOD_CONFIG, ROSEWOOD_PALETTES } from '../rosewood/config';
import { RivendellInvitation } from '../rivendell/RivendellInvitation';
import { DEFAULT_RIVENDELL_CONFIG, RIVENDELL_PALETTES } from '../rivendell/config';
import { VeronaInvitation } from '../verona/VeronaInvitation';
import { DEFAULT_CONFIG as DEFAULT_VERONA_CONFIG, PALETTES as VERONA_PALETTES } from '../verona/config';
import { VarezziaInvitation } from '../varezzia/VarezziaInvitation';
import { DEFAULT_CONFIG as DEFAULT_VAREZZIA_CONFIG, PALETTES as VAREZZIA_PALETTES } from '../varezzia/config';
import { INVITATION_MODELS } from '../../data/models';
import { createCatalogConfig, createCatalogPreview } from '../catalog-template/CatalogInvitation';

type PreviewProps = { locale: AuroraLocale; palette: never; embedded?: boolean; config?: Partial<AuroraConfig>; sectionOrder?: string[] };
export interface BuilderTemplate {
  id: string;
  label: string;
  palettes: Array<{ id: string; label: string }>;
  createDocument: () => InvitationBuilderDocument;
  Preview: ComponentType<PreviewProps>;
}

const labels = (ids: string[]) => ids.map((id) => ({ id, label: id.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ') }));

const ORIGINAL_TEMPLATES: BuilderTemplate[] = [
  {
    id: 'aurora', label: 'Aurora', Preview: AuroraInvitation as ComponentType<PreviewProps>, createDocument: createAuroraBuilderDocument,
    palettes: labels(['verde-dorado', 'rosa-champagne', 'azul-plata', 'lavanda-dorado'])
  },
  {
    id: 'astraea', label: 'Astraea', Preview: AstraeaInvitation as ComponentType<PreviewProps>,
    createDocument: () => createBuilderDocument('astraea', 'lavanda-ciruela', DEFAULT_ASTRAEA_CONFIG),
    palettes: labels(Object.keys(ASTRAEA_PALETTES))
  },
  {
    id: 'coruscant', label: 'Coruscant', Preview: CoruscantInvitation as ComponentType<PreviewProps>,
    createDocument: () => createBuilderDocument('coruscant', 'rosa-salvia', DEFAULT_CORUSCANT_CONFIG),
    palettes: labels(Object.keys(CORUSCANT_PALETTES))
  },
  {
    id: 'rosewood', label: 'Rosewood', Preview: RosewoodInvitation as ComponentType<PreviewProps>,
    createDocument: () => createBuilderDocument('rosewood', 'petroleo-champagne', DEFAULT_ROSEWOOD_CONFIG as unknown as AuroraConfig),
    palettes: labels(Object.keys(ROSEWOOD_PALETTES))
  },
  {
    id: 'rivendell', label: 'Rivendell', Preview: RivendellInvitation as ComponentType<PreviewProps>,
    createDocument: () => createBuilderDocument('rivendell', 'rosa', DEFAULT_RIVENDELL_CONFIG as unknown as AuroraConfig),
    palettes: labels(Object.keys(RIVENDELL_PALETTES))
  },
  {
    id: 'verona', label: 'Verona', Preview: VeronaInvitation as ComponentType<PreviewProps>,
    createDocument: () => createBuilderDocument('verona', 'bordo-calida', DEFAULT_VERONA_CONFIG as unknown as AuroraConfig),
    palettes: labels(Object.keys(VERONA_PALETTES))
  },
  {
    id: 'varezzia', label: 'Varezzia', Preview: VarezziaInvitation as ComponentType<PreviewProps>,
    createDocument: () => createBuilderDocument('varezzia', 'bordo-calida', DEFAULT_VAREZZIA_CONFIG as unknown as AuroraConfig),
    palettes: labels(Object.keys(VAREZZIA_PALETTES))
  }
];

const originalIds = new Set(ORIGINAL_TEMPLATES.map(({ id }) => id));
const GENERATED_TEMPLATES: BuilderTemplate[] = INVITATION_MODELS
  .filter(({ id }) => !originalIds.has(id))
  .map((model) => {
    const palettes = model.palettes?.length
      ? model.palettes.map(({ id, name }) => ({ id, label: name }))
      : [{ id: 'original', label: 'Original' }];
    return {
      id: model.id,
      label: model.title,
      Preview: createCatalogPreview(model.id) as ComponentType<PreviewProps>,
      createDocument: () => createBuilderDocument(model.id, palettes[0].id, createCatalogConfig(model)),
      palettes
    };
  });

export const BUILDER_TEMPLATES: BuilderTemplate[] = [...ORIGINAL_TEMPLATES, ...GENERATED_TEMPLATES];

export const builderTemplate = (id: string) => BUILDER_TEMPLATES.find((template) => template.id === id) || BUILDER_TEMPLATES[0];

export const builderSectionDefinitions = (
  templateId: string,
  sectionIds?: string[]
): InvitationSectionDefinition[] => {
  const supported = new Set(sectionIds || builderTemplate(templateId).createDocument().sections.map(({ id }) => id));
  return AURORA_BUILDER_SECTIONS.filter(({ id }) => supported.has(id));
};
