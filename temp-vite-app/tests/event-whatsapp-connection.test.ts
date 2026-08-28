import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { decryptEventWhatsAppToken, encryptEventWhatsAppToken } from '../api/_lib/event-whatsapp-crypto.ts';

test('las credenciales de WhatsApp se cifran por evento y pueden recuperarse sólo con su contexto', async () => {
  const previous = process.env.WHATSAPP_CONNECTION_ENCRYPTION_KEY;
  process.env.WHATSAPP_CONNECTION_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64url');
  try {
    const encrypted = await encryptEventWhatsAppToken('token-secreto', 'SYD-TEST-0001');
    assert.notEqual(encrypted, 'token-secreto');
    assert.match(encrypted, /^v1\./);
    assert.equal(await decryptEventWhatsAppToken(encrypted, 'SYD-TEST-0001'), 'token-secreto');
    await assert.rejects(() => decryptEventWhatsAppToken(encrypted, 'SYD-OTRO-0002'));
  } finally {
    if (previous === undefined) delete process.env.WHATSAPP_CONNECTION_ENCRYPTION_KEY;
    else process.env.WHATSAPP_CONNECTION_ENCRYPTION_KEY = previous;
  }
});

test('el estado público de la conexión nunca devuelve credenciales', () => {
  const source = readFileSync(new URL('../api/_lib/admin/whatsapp-connection.ts', import.meta.url), 'utf8');
  const publicBlock = source.slice(source.indexOf('const publicConnection'), source.indexOf('async function handler'));
  assert.doesNotMatch(publicBlock, /access_token|ciphertext/i);
  assert.match(source, /encryptEventWhatsAppToken/);
});

