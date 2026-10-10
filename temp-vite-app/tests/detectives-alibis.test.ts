import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('Las coartadas: el código verificado avanza sin alterar el progreso', async () => {
  const server = await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
  try {
    const { applyAction } = await server.ssrLoadModule('/api/_lib/detectives/game.ts');
    const state = {agent:'Prueba local',highestLevel:2,hints:{1:1},checkProgress:{1:0,2:0},completedAt:null};
    const before = structuredClone(state);
    for (const code of ['3049','8124','5092']) {
      assert.throws(() => applyAction(state,{action:'unlock',level:2,answer:code}), error => error.code === 'WRONG_ANSWER' && error.status === 400);
      assert.deepEqual(state,before,`${code}: debe conservar pistas y nivel`);
    }
    for (const code of ['LC-1888','lc1888','1888','LC 1888','lc 1888']) {
      const variantState=structuredClone(before);
      assert.equal(applyAction(variantState,{action:'unlock',level:2,answer:code}).highestLevel,3,code);
      assert.deepEqual(variantState.hints,before.hints);
      assert.deepEqual(variantState.checkProgress,before.checkProgress);
    }
    assert.throws(() => applyAction({...before,highestLevel:1},{action:'unlock',level:2,answer:'Martina Ríos'}));
  } finally { await server.close(); }
});
