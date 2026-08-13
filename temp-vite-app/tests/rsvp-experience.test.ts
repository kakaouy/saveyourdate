import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = readFileSync(path.join(appRoot, 'src', 'components', 'GuestRsvpPage.tsx'), 'utf8');
const styles = readFileSync(path.join(appRoot, 'src', 'admin-prototype.css'), 'utf8');

test('RSVP explica enlaces incompletos sin consultar la API', () => {
  assert.match(page, /if \(!token\)/);
  assert.match(page, /Este enlace de confirmación está incompleto/);
});

test('RSVP oculta errores técnicos de respuestas no JSON', () => {
  assert.match(page, /const readRsvpResponse = async/);
  assert.match(page, /El servicio de confirmaciones no está disponible/);
  assert.match(page, /readRsvpResponse<RsvpData/);
});

test('RSVP distingue confirmación, rechazo y errores', () => {
  assert.match(page, /Tu asistencia quedó confirmada/);
  assert.match(page, /Gracias por avisarnos/);
  assert.match(page, /messageType === 'error'/);
  assert.match(styles, /\.rsvp-message\.is-error/);
  assert.match(styles, /\.rsvp-message\.is-success/);
});
