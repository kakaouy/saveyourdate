import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const testCodes = [
  'F01-TEST-ALFA-7K2M-1Q9R',
  'F01-TEST-BRAVO-4D8P-2W6X',
  'F01-TEST-CHARLIE-9N3F-6R1V',
  'F01-TEST-DELTA-5H7C-8P2K',
  'F01-TEST-ECHO-3T9B-4M6D',
  'F01-TEST-FOXTROT-8Q1L-5C7W',
  'F01-TEST-GOLF-2V4A-9J3H',
  'F01-TEST-HOTEL-6X8E-1L5N',
  'F01-TEST-INDIA-7P2R-3K9C',
  'F01-TEST-JULIET-4B6M-8T1Q',
];
const previousShortCodes = Array.from({ length: 10 }, (_, index) => `B${index + 1}`);

test('Los códigos de prueba nuevos y B1–B10 pasan la validación usada al activar partidas', async () => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
  try {
    const [{ hashCode }, { default: validHashes }] = await Promise.all([
      server.ssrLoadModule('/api/_lib/detectives/game.ts'),
      server.ssrLoadModule('/api/_lib/detectives/access-codes.json'),
    ]);
    for (const code of [...testCodes, ...previousShortCodes]) assert.ok(validHashes.includes(await hashCode(code)), `${code} debe estar habilitado`);
  } finally {
    await server.close();
  }
});
