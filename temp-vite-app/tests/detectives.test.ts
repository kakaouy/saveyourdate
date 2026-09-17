import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('detectives keeps its routes and assets under a separate directory', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  for (const action of ['game', 'diploma']) {
    assert.ok(config.rewrites.some((r: {source:string;destination:string}) => r.source === `/los-archivos-f/api/${action}` && r.destination === `/api/admin/${action}`));
  }
  for (const file of ['detectives/App.tsx', 'detectives/case.ts', 'detectives/style.css']) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /["'`]\/(?:images|audio|api)\//);
  }
});
