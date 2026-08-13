import type { InvitationBuilderDocument } from './invitation-builder.ts';

const PRESERVED_GROUPS = ['event', 'links', 'content', 'gifts', 'schedule', 'gallery', 'hotels', 'qrPass', 'metadata'] as const;

export const switchInvitationTemplate = (
  current: InvitationBuilderDocument,
  next: InvitationBuilderDocument
): InvitationBuilderDocument => {
  const nextIds = new Set(next.sections.map(({ id }) => id));
  const nextById = new Map(next.sections.map((section) => [section.id, section]));
  const common = current.sections
    .filter(({ id }) => nextIds.has(id))
    .map((section) => ({ ...section }));
  const commonIds = new Set(common.map(({ id }) => id));
  const sections = [...common, ...next.sections.filter(({ id }) => !commonIds.has(id))];
  const content = { ...next.content };
  PRESERVED_GROUPS.forEach((group) => {
    if (current.content[group] !== undefined) content[group] = current.content[group];
  });

  return {
    ...next,
    locale: current.locale,
    sections: sections.map((section) => nextById.has(section.id) ? section : nextById.get(section.id)!),
    content,
    status: 'draft'
  };
};
