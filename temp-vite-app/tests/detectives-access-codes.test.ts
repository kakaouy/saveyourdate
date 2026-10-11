import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const childCodes = Array.from({length:50},(_,index)=>`F${String(index+1).padStart(3,'0')}`);

test('los 50 códigos infantiles pasan la validación y los anteriores quedan revocados', async () => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
  try {
    const [{ hashCode }, { default: validHashes }] = await Promise.all([
      server.ssrLoadModule('/api/_lib/detectives/game.ts'),
      server.ssrLoadModule('/api/_lib/detectives/access-codes.json'),
    ]);
    assert.equal(validHashes.length,50);
    for (const code of childCodes) assert.ok(validHashes.includes(await hashCode(code)), `${code} debe estar habilitado desde nivel cero`);
    for (const code of ['FEDE1','Q7A2L9','F01-D1-09B422','F01-FEDE-11']) assert.ok(!validHashes.includes(await hashCode(code)), `${code} debe estar deshabilitado`);
  } finally {
    await server.close();
  }
});
