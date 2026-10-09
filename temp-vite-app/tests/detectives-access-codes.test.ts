import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const testCodes = ['F01-D1-09B422','F01-D2-5AC2E6','F01-D3-EF2831','F01-D4-156647','F01-D5-9F02D6','F01-D6-F89950','F01-D7-40A208','F01-D8-513F49','F01-D9-1EDD66','F01-D10-0181BD'];

test('Sólo D1–D10 pasan la validación usada al activar partidas', async () => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
  try {
    const [{ hashCode }, { default: validHashes }] = await Promise.all([
      server.ssrLoadModule('/api/_lib/detectives/game.ts'),
      server.ssrLoadModule('/api/_lib/detectives/access-codes.json'),
    ]);
    for (const code of testCodes) assert.ok(validHashes.includes(await hashCode(code)), `${code} debe estar habilitado`);
    for (const code of ['C1', 'PRUEBA', 'F01-FEDE-11']) assert.ok(!validHashes.includes(await hashCode(code)), `${code} debe estar deshabilitado`);
  } finally {
    await server.close();
  }
});
