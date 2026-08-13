import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuroraBuilderDocument, createBuilderDocument } from '../src/components/aurora/builder.ts';
import { DEFAULT_CONFIG as DEFAULT_VERONA_CONFIG } from '../src/components/verona/config.ts';
import { switchInvitationTemplate } from '../src/domain/invitation-template-switch.ts';

test('cambiar de modelo conserva los datos del evento y adopta la identidad visual nueva', () => {
  const current = createAuroraBuilderDocument();
  (current.content.event as { name: string }).name = 'Mi evento';
  current.locale = 'pt';
  current.sections = current.sections.map((section) => section.id === 'gallery' ? { ...section, enabled: true } : section);
  const next = createBuilderDocument('verona', 'bordo-calida', DEFAULT_VERONA_CONFIG as never);
  const result = switchInvitationTemplate(current, next);
  assert.equal((result.content.event as { name: string }).name, 'Mi evento');
  assert.equal(result.locale, 'pt');
  assert.equal(result.paletteId, 'bordo-calida');
  assert.equal((result.content.assets as { hero: string }).hero, DEFAULT_VERONA_CONFIG.assets.hero);
  assert.equal(result.sections.find(({ id }) => id === 'gallery')?.enabled, true);
  assert.equal(result.sections.some(({ id }) => id === 'songSuggestions'), false);
  assert.equal(result.status, 'draft');
});
