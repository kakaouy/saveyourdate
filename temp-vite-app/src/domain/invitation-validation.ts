import type { InvitationBuilderDocument } from './invitation-builder.ts';

export type InvitationValidationIssue = { field: string; message: string };

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export const validateInvitationForReview = (document: InvitationBuilderDocument): InvitationValidationIssue[] => {
  const enabled = new Set(document.sections.filter((section) => section.enabled).map((section) => section.id));
  const content = document.content;
  const event = (content.event || {}) as Record<string, unknown>;
  const links = (content.links || {}) as Record<string, unknown>;
  const assets = (content.assets || {}) as Record<string, unknown>;
  const gifts = (content.gifts || {}) as Record<string, unknown>;
  const qrPass = (content.qrPass || {}) as Record<string, unknown>;
  const schedule = (content.schedule || []) as Array<Record<string, unknown>>;
  const gallery = (content.gallery || []) as Array<Record<string, unknown>>;
  const hotels = (content.hotels || []) as Array<Record<string, unknown>>;
  const issues: InvitationValidationIssue[] = [];
  const requireText = (field: string, value: unknown, message: string) => {
    if (!text(value)) issues.push({ field, message });
  };

  requireText('event-name', event.name, 'Ingresá el nombre del evento o de la persona homenajeada.');
  requireText('event-date', event.dateTime, 'Ingresá la fecha y hora del evento.');
  requireText('event-venue', event.venue, 'Ingresá el lugar del evento.');
  requireText('event-address', event.address, 'Ingresá la dirección del evento.');
  requireText('hero-image', assets.hero, 'Elegí una imagen de portada.');
  if (enabled.has('parallax')) requireText('parallax-image', assets.parallax, 'Elegí la foto destacada o desactivá esa sección.');
  if (enabled.has('schedule') && !schedule.some((item) => text(item.time))) issues.push({ field: 'schedule', message: 'Agregá al menos un momento con horario al cronograma.' });
  if (enabled.has('gallery') && !gallery.some((item) => text(item.src))) issues.push({ field: 'gallery', message: 'Agregá al menos una foto o desactivá la galería.' });
  if (enabled.has('hotels') && !hotels.some((item) => text(item.name))) issues.push({ field: 'hotels', message: 'Agregá al menos un alojamiento o desactivá esa sección.' });
  if (enabled.has('photoUpload')) requireText('photo-upload', links.photoUpload, 'Configurá el enlace del álbum colaborativo o desactivá esa sección.');
  if (enabled.has('social')) requireText('instagram', links.instagram, 'Configurá el enlace de Instagram o desactivá esa sección.');
  if (enabled.has('qrPass')) requireText('qr-pass', qrPass.value, 'Ingresá el contenido del pase QR o desactivá esa sección.');
  if (enabled.has('gifts')) {
    requireText('gift-holder', gifts.holder, 'Ingresá el titular para regalos o desactivá esa sección.');
    requireText('gift-account', gifts.account, 'Ingresá la cuenta para regalos o desactivá esa sección.');
  }
  return issues;
};
