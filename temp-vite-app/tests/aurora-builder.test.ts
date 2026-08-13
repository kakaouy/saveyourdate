import assert from 'node:assert/strict';
import test from 'node:test';
import { auroraConfigFromBuilder, createAuroraBuilderDocument, createBuilderDocument } from '../src/components/aurora/builder.ts';
import { AURORA_PALETTES } from '../src/components/aurora/config.ts';
import { DEFAULT_ASTRAEA_CONFIG } from '../src/components/astraea/config.ts';
import { DEFAULT_CORUSCANT_CONFIG } from '../src/components/coruscant/config.ts';
import { DEFAULT_ROSEWOOD_CONFIG } from '../src/components/rosewood/config.ts';
import { DEFAULT_RIVENDELL_CONFIG } from '../src/components/rivendell/config.ts';
import { DEFAULT_CONFIG as DEFAULT_VERONA_CONFIG } from '../src/components/verona/config.ts';
import { DEFAULT_CONFIG as DEFAULT_VAREZZIA_CONFIG } from '../src/components/varezzia/config.ts';

test('Aurora se puede representar con el documento modular común', () => {
  const document = createAuroraBuilderDocument();
  const config = auroraConfigFromBuilder(document);
  assert.equal(document.templateId, 'aurora');
  assert.ok(document.paletteId in AURORA_PALETTES);
  assert.equal(config.sections?.hero, true);
  assert.equal(config.sections?.gallery, false);
  assert.equal(config.sections?.rsvp, true);
});

test('Aurora recalcula tonos cuando se quita una sección intermedia', () => {
  const document = createAuroraBuilderDocument();
  document.sections = document.sections.map((section) =>
    section.id === 'countdown' ? { ...section, enabled: false } : section
  );
  const config = auroraConfigFromBuilder(document);
  assert.equal(config.tones?.location, 'light');
  assert.equal(config.tones?.quote, 'accent');
  assert.equal(config.tones?.parallax, 'light');
  assert.equal(config.tones?.social, 'accentDark');
});

test('Astraea y Coruscant adoptan el mismo documento sin perder sus valores iniciales', () => {
  const astraea = createBuilderDocument('astraea', 'lavanda-ciruela', DEFAULT_ASTRAEA_CONFIG);
  const coruscant = createBuilderDocument('coruscant', 'rosa-salvia', DEFAULT_CORUSCANT_CONFIG);
  assert.equal((astraea.content.event as { name: string }).name, 'Romina');
  assert.equal(astraea.sections.find(({ id }) => id === 'hotels')?.enabled, false);
  assert.equal((coruscant.content.event as { name: string }).name, 'Paz');
  assert.equal(coruscant.sections.find(({ id }) => id === 'hotels')?.enabled, true);
});

test('Rosewood y Rivendell adoptan el documento común con sus secciones propias', () => {
  const rosewood = createBuilderDocument('rosewood', 'petroleo-champagne', DEFAULT_ROSEWOOD_CONFIG as never);
  const rivendell = createBuilderDocument('rivendell', 'rosa', DEFAULT_RIVENDELL_CONFIG as never);
  assert.equal((rosewood.content.event as { name: string }).name, 'Valentina');
  assert.equal(rosewood.sections.find(({ id }) => id === 'countdown')?.enabled, false);
  assert.equal((rivendell.content.event as { name: string }).name, 'Milena');
  assert.equal(rivendell.sections.find(({ id }) => id === 'gallery')?.enabled, true);
});

test('Verona y Varezzia adoptan el documento común y conservan su contenido', () => {
  const verona = createBuilderDocument('verona', 'bordo-calida', DEFAULT_VERONA_CONFIG as never);
  const varezzia = createBuilderDocument('varezzia', 'bordo-calida', DEFAULT_VAREZZIA_CONFIG as never);
  assert.equal((verona.content.event as { name: string }).name, 'Leticia');
  assert.equal(verona.sections.find(({ id }) => id === 'songSuggestions')?.enabled, false);
  assert.equal((varezzia.content.event as { name: string }).name, 'Martina');
  assert.equal(varezzia.sections.find(({ id }) => id === 'songSuggestions')?.enabled, true);
});
