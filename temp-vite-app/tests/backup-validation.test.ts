import assert from 'node:assert/strict';
import test from 'node:test';
import { validateBackup } from '../api/_lib/backup-validation.ts';

const validBackup = {
  format: 'save-your-date-admin-backup',
  version: 1,
  event: { orderNumber: 'SYD-ABCD-EFGH' },
  tables: [{ id: '11111111-1111-4111-8111-111111111111', name: 'Mesa 1', capacity: 8 }],
  guests: [{
    id: '22222222-2222-4222-8222-222222222222',
    invite_token: '33333333-3333-4333-8333-333333333333',
    name: 'Ana',
    seats: 2,
    confirmed: 2,
    table_id: '11111111-1111-4111-8111-111111111111'
  }],
  collaborators: [{ email: 'editor@example.com', role: 'editor' }]
};

test('acepta un respaldo del mismo pedido', () => {
  const result = validateBackup(validBackup, 'SYD-ABCD-EFGH');
  assert.equal('error' in result, false);
});

test('rechaza respaldos de otro pedido', () => {
  const result = validateBackup(validBackup, 'SYD-OTRO-0000');
  assert.equal('error' in result, true);
});

test('rechaza referencias a mesas inexistentes', () => {
  const backup = structuredClone(validBackup);
  backup.guests[0].table_id = '44444444-4444-4444-8444-444444444444';
  const result = validateBackup(backup, 'SYD-ABCD-EFGH');
  assert.equal('error' in result, true);
});

