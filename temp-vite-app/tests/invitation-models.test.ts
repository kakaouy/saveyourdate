import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_ASTRAEA_CONFIG } from '../src/components/astraea/config.ts';
import { DEFAULT_CORUSCANT_CONFIG } from '../src/components/coruscant/config.ts';
import { buildOrderSelectionFields } from '../src/utils/orderSelection.ts';

test('Astraea usa una fecha única y conserva sus secciones aprobadas', () => {
  assert.equal(DEFAULT_ASTRAEA_CONFIG.event.dateTime, '2027-04-02T21:00:00-03:00');
  assert.equal(DEFAULT_ASTRAEA_CONFIG.sections.dateStack, true);
  assert.equal(DEFAULT_ASTRAEA_CONFIG.sections.schedule, false);
  assert.equal(DEFAULT_ASTRAEA_CONFIG.sections.hotels, false);
  assert.ok(DEFAULT_ASTRAEA_CONFIG.gallery.every(({ src }) => src.startsWith('/astraea/images/')));
});

test('Coruscant usa una fecha única, sin cronograma y con alojamiento', () => {
  assert.equal(DEFAULT_CORUSCANT_CONFIG.event.dateTime, '2027-06-12T21:00:00-03:00');
  assert.equal(DEFAULT_CORUSCANT_CONFIG.sections.dateStack, false);
  assert.equal(DEFAULT_CORUSCANT_CONFIG.sections.schedule, false);
  assert.equal(DEFAULT_CORUSCANT_CONFIG.sections.hotels, true);
  assert.ok(DEFAULT_CORUSCANT_CONFIG.gallery.every(({ src }) => src.startsWith('/coruscant/images/')));
});

test('el formulario conserva modelo, paleta e idioma de Astraea', () => {
  assert.deepEqual(buildOrderSelectionFields({language:'en',modelId:'astraea',modelName:'Astraea',paletteId:'lavanda-ciruela',paletteName:'Lavender & plum',paletteColor:'#674c6d'}), {
    'Idioma de la invitación':'English','Código de idioma':'en','ID del modelo':'astraea',Modelo:'Astraea','ID de paleta':'lavanda-ciruela','Paleta elegida':'Lavender & plum','Color elegido':'#674c6d'
  });
});

test('el formulario conserva modelo, paleta e idioma de Coruscant', () => {
  assert.deepEqual(buildOrderSelectionFields({language:'pt',modelId:'coruscant',modelName:'Coruscant',paletteId:'rosa-salvia',paletteName:'Rosa e sálvia',paletteColor:'#9f6f7b'}), {
    'Idioma de la invitación':'Português','Código de idioma':'pt','ID del modelo':'coruscant',Modelo:'Coruscant','ID de paleta':'rosa-salvia','Paleta elegida':'Rosa e sálvia','Color elegido':'#9f6f7b'
  });
});
