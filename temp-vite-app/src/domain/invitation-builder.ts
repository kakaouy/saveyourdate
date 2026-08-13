export type InvitationTone = 'light' | 'alternate' | 'accent' | 'accentDark';

export interface InvitationSectionDefinition {
  id: string;
  label: string;
  required?: boolean;
  locked?: 'first' | 'last';
  available?: boolean;
  tone?: InvitationTone;
}

export interface InvitationSectionState {
  id: string;
  enabled: boolean;
}

export interface ComposedInvitationSection extends InvitationSectionState {
  tone: InvitationTone;
  ornamentAfter: boolean;
}

export interface InvitationBuilderDocument {
  version: 1;
  templateId: string;
  paletteId: string;
  locale: 'es' | 'en' | 'pt';
  sections: InvitationSectionState[];
  content: Record<string, unknown>;
  status: 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'published';
}

const PHOTO_SECTION_IDS = new Set(['featuredPhoto', 'parallax']);
const GALLERY_SECTION_IDS = new Set(['gallery']);
const TONE_SEQUENCE: InvitationTone[] = ['light', 'accent', 'alternate', 'accentDark'];

const isPhotoGalleryPair = (current: string, next: string) =>
  (PHOTO_SECTION_IDS.has(current) && GALLERY_SECTION_IDS.has(next)) ||
  (GALLERY_SECTION_IDS.has(current) && PHOTO_SECTION_IDS.has(next));

export const normalizeSectionOrder = (
  definitions: InvitationSectionDefinition[],
  sections: InvitationSectionState[]
) => {
  const definitionById = new Map(definitions.map((definition) => [definition.id, definition]));
  const seen = new Set<string>();
  const normalized = sections.filter((section) => {
    const definition = definitionById.get(section.id);
    if (!definition || definition.available === false || seen.has(section.id)) return false;
    seen.add(section.id);
    return true;
  }).map((section) => ({
    ...section,
    enabled: definitionById.get(section.id)?.required ? true : section.enabled
  }));

  definitions.forEach((definition) => {
    if (definition.available !== false && !seen.has(definition.id)) {
      normalized.push({ id: definition.id, enabled: Boolean(definition.required) });
    }
  });

  const first = normalized.filter(({ id }) => definitionById.get(id)?.locked === 'first');
  const middle = normalized.filter(({ id }) => !definitionById.get(id)?.locked);
  const last = normalized.filter(({ id }) => definitionById.get(id)?.locked === 'last');
  return [...first, ...middle, ...last];
};

export const composeInvitationSections = (
  definitions: InvitationSectionDefinition[],
  sections: InvitationSectionState[]
): ComposedInvitationSection[] => {
  const definitionById = new Map(definitions.map((definition) => [definition.id, definition]));
  const visible = normalizeSectionOrder(definitions, sections).filter(({ enabled }) => enabled);

  return visible.map((section, index) => {
    const next = visible[index + 1];
    const fixedTone = definitionById.get(section.id)?.tone;
    return {
      ...section,
      tone: fixedTone ?? TONE_SEQUENCE[index % TONE_SEQUENCE.length],
      ornamentAfter: Boolean(next) && !isPhotoGalleryPair(section.id, next.id)
    };
  });
};

export const moveInvitationSection = (
  definitions: InvitationSectionDefinition[],
  sections: InvitationSectionState[],
  sectionId: string,
  direction: -1 | 1
) => {
  const normalized = normalizeSectionOrder(definitions, sections);
  const definitionById = new Map(definitions.map((definition) => [definition.id, definition]));
  const currentIndex = normalized.findIndex(({ id }) => id === sectionId);
  if (currentIndex < 0 || definitionById.get(sectionId)?.locked) return normalized;

  const targetIndex = currentIndex + direction;
  const target = normalized[targetIndex];
  if (!target || definitionById.get(target.id)?.locked) return normalized;

  const result = [...normalized];
  [result[currentIndex], result[targetIndex]] = [result[targetIndex], result[currentIndex]];
  return result;
};
