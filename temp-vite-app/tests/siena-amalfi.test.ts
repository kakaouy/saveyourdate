import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { INVITATION_MODELS } from '../src/data/models.ts';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const models = [
  { id: 'siena', configName: 'SIENA_SITE_CONFIG', palette: 'rosa-viejo-borgona' },
  { id: 'amalfi', configName: 'AMALFI_SITE_CONFIG', palette: 'menta-ciruela' },
] as const;

function readModel(id: string) {
  return readFileSync(path.join(appRoot, 'public', id, 'index.html'), 'utf8');
}

function localAssetReferences(html: string) {
  const references = new Set<string>();
  const patterns = [/(?:src|href)=["']([^"']+)["']/g, /url\(["']?([^"')]+)["']?\)/g];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const reference = match[1];
      if (/^(?:images|font)\//.test(reference)) references.add(reference);
    }
  }

  return [...references];
}

for (const model of models) {
  test(`${model.id} sólo referencia assets locales existentes`, () => {
    const html = readModel(model.id);
    const missing = localAssetReferences(html).filter(
      (reference) => !existsSync(path.join(appRoot, 'public', model.id, reference)),
    );

    assert.deepEqual(missing, []);
  });

  test(`${model.id} expone configuración, idiomas y secciones productivas`, () => {
    const html = readModel(model.id);

    assert.match(html, new RegExp(`window\\.${model.configName}`));
    assert.match(html, new RegExp(`palettePreset:\\s*Object\\.hasOwn.*"${model.palette}"`, 's'));
    assert.match(html, /const TRANSLATIONS\s*=\s*\{[\s\S]*?es:\s*\{[\s\S]*?pt:\s*\{[\s\S]*?en:\s*\{/);
    assert.match(html, /schedule:\s*false/);
    assert.match(html, /hotels:\s*true/);
    assert.match(html, /gallery:\s*true/);
    assert.match(html, /spoty:\s*true/);
    assert.match(html, /spotyTitle:\s*"Spotify"/);
    assert.match(html, /countdownAria:/);
    assert.match(html, /galleryPrevious:/);
    assert.match(html, /galleryNext:/);
    assert.doesNotMatch(html, /(?:Portrait|Retrato) of Paz|Retrato de Paz|Paz sorrindo|Paz smiling/);
  });

  test(`${model.id} configura un evento con rango cronológico válido`, () => {
    const html = readModel(model.id);
    const start = html.match(/dateTime:\s*"([^"]+)"/)?.[1];
    const end = html.match(/endDateTime:\s*"([^"]+)"/)?.[1];

    assert.ok(start, 'Falta event.dateTime');
    assert.ok(end, 'Falta event.endDateTime');
    assert.ok(Number.isFinite(Date.parse(start)), 'event.dateTime no es una fecha ISO válida');
    assert.ok(Number.isFinite(Date.parse(end)), 'event.endDateTime no es una fecha ISO válida');
    assert.ok(Date.parse(end) > Date.parse(start), 'event.endDateTime debe ser posterior a event.dateTime');
  });

  test(`${model.id} cuenta con especificación productiva`, () => {
    const specPath = path.join(appRoot, 'docs', 'specs', `${model.id}.md`);
    assert.ok(existsSync(specPath));
    const spec = readFileSync(specPath, 'utf8');

    assert.match(spec, /## Arquitectura y parametrización/);
    assert.match(spec, /## Orden de secciones/);
    assert.match(spec, /## Animaciones/);
    assert.match(spec, /## Validación/);
  });
}

test('Siena y Amalfi están disponibles y detalladas en catálogo y pedidos', () => {
  for (const expected of models) {
    const model = INVITATION_MODELS.find(({ id }) => id === expected.id);
    assert.ok(model, `Falta ${expected.id} en INVITATION_MODELS`);
    assert.equal(model.active, true);
    assert.equal(model.category, '15years');
    assert.equal(model.demoPath, `/${expected.id}/index.html`);
    assert.ok(model.description.length > 40);
    assert.ok(model.descriptions?.en);
    assert.ok(model.descriptions?.pt);
    assert.ok(model.features.length >= 10);
    assert.ok(model.includedSections?.includes('gallery'));
    assert.ok(model.includedSections?.includes('playlist'));
    assert.ok(model.palettes?.some(({ id }) => id === expected.palette));
  }
});
