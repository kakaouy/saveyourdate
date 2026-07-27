import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeWhatsAppPhone } from '../api/_lib/whatsapp.ts';

test('normaliza teléfonos internacionales para WhatsApp', () => {
  assert.equal(normalizeWhatsAppPhone('+598 99 123 456'), '59899123456');
  assert.equal(normalizeWhatsAppPhone('0059899123456'), '59899123456');
  assert.equal(normalizeWhatsAppPhone('+598 099 123 456'), '59899123456');
});

