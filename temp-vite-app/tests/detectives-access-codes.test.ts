import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const testCodes = ['F01-D1-09B422','F01-D2-5AC2E6','F01-D3-EF2831','F01-D4-156647','F01-D5-9F02D6','F01-D6-F89950','F01-D7-40A208','F01-D8-513F49','F01-D9-1EDD66','F01-D10-0181BD','F01-D11-7C4A91','F01-D12-B83E26','F01-D13-4F91CD','F01-D14-A62B70','F01-D15-3DE845','F01-D16-91C7AF','F01-D17-5B20E4','F01-D18-C74639','F01-D19-28AFD5','F01-D20-E9047B','F01-D21-A75B9D','F01-D22-A9A9E7','F01-D23-EAF444','F01-D24-17FBCA','F01-D25-63070D','F01-D26-32F144','F01-D27-31AAB3','F01-D28-15556B','F01-D29-053BE0','F01-D30-70C50A'];
const easyTestCodes = ['FEDE1','FEDE2','FEDE3','FEDE4','FEDE5'];
const sixCharacterCodes = ['N4F7Q2','R8M3K6','T2V9C4','P6X1H8','L3Z7B5','G9W2D6','K5R8N1','C7Y4F9','V1P6T3','B4M9X2'];

test('D1–D30 pasan la validación usada al activar partidas', async () => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
  try {
    const [{ hashCode }, { default: validHashes }] = await Promise.all([
      server.ssrLoadModule('/api/_lib/detectives/game.ts'),
      server.ssrLoadModule('/api/_lib/detectives/access-codes.json'),
    ]);
    for (const code of testCodes) assert.ok(validHashes.includes(await hashCode(code)), `${code} debe estar habilitado`);
    for (const code of easyTestCodes) assert.ok(validHashes.includes(await hashCode(code)), `${code} debe estar habilitado desde nivel cero`);
    for (const code of sixCharacterCodes) assert.ok(validHashes.includes(await hashCode(code)), `${code} debe estar habilitado desde nivel cero`);
    for (const code of ['C1', 'PRUEBA', 'F01-FEDE-11']) assert.ok(!validHashes.includes(await hashCode(code)), `${code} debe estar deshabilitado`);
  } finally {
    await server.close();
  }
});
