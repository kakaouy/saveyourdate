import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(import.meta.dirname, '..');
const landing = readFileSync(path.join(appRoot, 'src', 'components', 'PlatformLandingConcept.tsx'), 'utf8');
const styles = readFileSync(path.join(appRoot, 'src', 'components', 'platform-landing-concept.css'), 'utf8');

test('la portada comunica el recorrido integral sin numerar el inicio', () => {
  assert.match(landing, /Tu evento empieza acá/);
  assert.doesNotMatch(landing, /<span>01<\/span> Tu evento empieza acá/);
  assert.match(landing, /Invitaciones, confirmaciones, invitados, mesas y salón conectados en un solo lugar/);
  assert.match(styles, /--concept-hero-top:22px/);
  assert.match(styles, /\.concept-nav\{padding-top:var\(--concept-hero-top\)\}/);
});

test('la segunda sección combina beneficios con una muestra de organización', () => {
  assert.match(landing, /concept-event-overview/);
  assert.match(landing, /ORGANIZACIÓN DEL EVENTO/);
  assert.match(landing, /Mesa Familia/);
  assert.match(styles, /\.concept-event-overview/);
  assert.match(styles, /background:rgba\(250,248,242,\.42\)/);
  assert.match(styles, /backdrop-filter:blur\(6px\)/);
});

test('los módulos se presentan en tres recorridos con detalle progresivo', () => {
  assert.match(landing, /platformJourneys/);
  assert.match(landing, /Invitá y comunicá/);
  assert.match(landing, /Organizá invitados y mesas/);
  assert.match(landing, /Prepará salón y entregables/);
  assert.match(landing, /Ver todas las funciones/);
  assert.doesNotMatch(landing, /concept-module-grid/);
  assert.match(styles, /\.concept-journey-grid/);
});

test('para quién es separa anfitriones y organizadores sin vender un plan al proveedor', () => {
  assert.match(landing, /concept-audience-switch/);
  assert.match(landing, /Mi evento/);
  assert.match(landing, /Varios eventos/);
  assert.match(landing, /No necesitás contratar un plan/);
  assert.doesNotMatch(landing, /concept-role-compare/);
  assert.match(styles, /\.concept-audience-tabs/);
});

test('cómo funciona se explica mediante tres recorridos conectados', () => {
  assert.doesNotMatch(landing, /concept-integrated-flow/);
  assert.match(landing, /concept-how-intro/);
  assert.match(landing, /Configurá el evento/);
  assert.match(landing, /Organizá invitados y mesas/);
  assert.match(landing, /Prepará salón y entregables/);
  assert.match(landing, /Numeración de mesas/);
  assert.match(landing, /concept-preview-guest-sheet/);
  assert.match(landing, /concept-how-card/);
  assert.match(landing, /Configurá e importá/);
  assert.match(landing, /Revisá y compartí/);
  assert.match(landing, /concept-preview-rsvp-stats/);
  assert.match(landing, />245</);
  assert.match(styles, /dos funcionalidades contiguas, sin solaparse/);
  assert.match(styles, /concept-preview-invite\{grid-template-columns:minmax\(190px/);
  assert.match(styles, /permanece dentro de la ventana y cambia de composición/);
  assert.match(styles, /@media\(max-width:1180px\)/);
  assert.match(styles, /Cómo funciona vive sobre crema/);
  assert.match(landing, /La misma plataforma/);
  assert.match(landing, /Tu evento, claro/);
  assert.match(landing, /Todos tus eventos/);
});

test('mesas muestra el flujo simplificado y los eventos existentes sólo conservan sus accesos', () => {
  assert.match(landing, /concept-preview-seating/);
  assert.match(landing, /INVITADOS Y GRUPOS/);
  assert.match(landing, /Ubicá grupos completos/);
  const seatingPreview = landing.match(/concept-preview-seating[\s\S]*?concept-preview-team/)?.[0] || '';
  assert.doesNotMatch(seatingPreview, />259</);
  assert.match(landing, /concept-return-links/);
  assert.doesNotMatch(landing, /Tu evento sigue donde lo dejaste/);
});
