import assert from 'node:assert/strict';
import test from 'node:test';
import { canAssignGuest, occupiedSeats } from '../api/_lib/admin/capacity.ts';

const occupants = [{ id: 'a', confirmed: 4 }, { id: 'b', confirmed: 2 }];

test('suma personas confirmadas y permite excluir el grupo movido', () => {
  assert.equal(occupiedSeats(occupants), 6);
  assert.equal(occupiedSeats(occupants, 'a'), 2);
});

test('permite ocupar exactamente la capacidad disponible', () => {
  assert.equal(canAssignGuest(8, occupants, 'nuevo', 2), true);
});

test('bloquea sobrecupos y permite conservar el grupo ya asignado', () => {
  assert.equal(canAssignGuest(7, occupants, 'nuevo', 2), false);
  assert.equal(canAssignGuest(6, occupants, 'a', 4), true);
});
