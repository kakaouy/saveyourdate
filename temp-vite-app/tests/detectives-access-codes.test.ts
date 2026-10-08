import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const testCodes = Array.from({ length: 10 }, (_, index) => `C${index + 1}`);

test('Sólo C1–C10 pasan la validación usada al activar partidas', async () => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
  try {
    const [{ hashCode }, { default: validHashes }] = await Promise.all([
      server.ssrLoadModule('/api/_lib/detectives/game.ts'),
      server.ssrLoadModule('/api/_lib/detectives/access-codes.json'),
    ]);
    for (const code of testCodes) assert.ok(validHashes.includes(await hashCode(code)), `${code} debe estar habilitado`);
    for (const code of ['B1', 'PRUEBA', 'F01-FEDE-11']) assert.ok(!validHashes.includes(await hashCode(code)), `${code} debe estar deshabilitado`);
  } finally {
    await server.close();
  }
});
