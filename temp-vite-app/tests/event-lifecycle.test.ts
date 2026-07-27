import assert from 'node:assert/strict';
import test from 'node:test';
import {
  daysBeforeRetentionDeadline,
  eventAccessExpired,
  retentionDeadline
} from '../api/_lib/event-lifecycle.ts';

test('conserva el evento durante 30 días completos', () => {
  const payload = { eventDate: '2026-07-01' };
  assert.equal(retentionDeadline(payload.eventDate)?.toISOString(), '2026-08-01T00:00:00.000Z');
  assert.equal(eventAccessExpired(payload, new Date('2026-07-31T23:59:59.999Z')), false);
  assert.equal(eventAccessExpired(payload, new Date('2026-08-01T00:00:00.000Z')), true);
});

test('no vence automáticamente si la fecha es inválida o falta', () => {
  assert.equal(eventAccessExpired({}, new Date('2030-01-01T00:00:00Z')), false);
  assert.equal(retentionDeadline('fecha-inválida'), null);
});

test('calcula los avisos respecto al vencimiento', () => {
  const payload = { eventDate: '2026-07-01' };
  assert.equal(daysBeforeRetentionDeadline(payload, new Date('2026-07-02T00:00:00Z')), 30);
  assert.equal(daysBeforeRetentionDeadline(payload, new Date('2026-07-25T00:00:00Z')), 7);
});

