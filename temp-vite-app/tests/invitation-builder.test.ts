import assert from 'node:assert/strict';
import test from 'node:test';
import { composeInvitationSections, moveInvitationSection, normalizeSectionOrder } from '../src/domain/invitation-builder.ts';

const definitions = [
  { id: 'hero', label: 'Portada', required: true, locked: 'first' as const },
  { id: 'countdown', label: 'Cuenta regresiva' },
  { id: 'parallax', label: 'Foto destacada' },
  { id: 'gallery', label: 'Galería' },
  { id: 'gifts', label: 'Regalos' },
  { id: 'rsvp', label: 'RSVP', locked: 'last' as const }
];

test('normaliza portada y RSVP aunque el usuario intente sacarlas de posición', () => {
  const result = normalizeSectionOrder(definitions, [
    { id: 'rsvp', enabled: true },
    { id: 'gallery', enabled: true },
    { id: 'hero', enabled: false }
  ]);
  assert.equal(result[0].id, 'hero');
  assert.equal(result[0].enabled, true);
  assert.equal(result.at(-1)?.id, 'rsvp');
});

test('recalcula tonos según las secciones visibles y omite ornamento entre foto y galería', () => {
  const result = composeInvitationSections(definitions, [
    { id: 'hero', enabled: true },
    { id: 'countdown', enabled: false },
    { id: 'parallax', enabled: true },
    { id: 'gallery', enabled: true },
    { id: 'gifts', enabled: true },
    { id: 'rsvp', enabled: true }
  ]);
  assert.deepEqual(result.map(({ id, tone }) => [id, tone]), [
    ['hero', 'light'], ['parallax', 'accent'], ['gallery', 'alternate'], ['gifts', 'accentDark'], ['rsvp', 'light']
  ]);
  assert.equal(result.find(({ id }) => id === 'parallax')?.ornamentAfter, false);
  assert.equal(result.find(({ id }) => id === 'gallery')?.ornamentAfter, true);
});

test('mueve bloques comunes pero respeta las posiciones bloqueadas', () => {
  const sections = definitions.map(({ id }) => ({ id, enabled: true }));
  assert.equal(moveInvitationSection(definitions, sections, 'countdown', -1)[1].id, 'countdown');
  assert.equal(moveInvitationSection(definitions, sections, 'gallery', -1)[2].id, 'gallery');
});
