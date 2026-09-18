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
    assert.equal(applyAction(state,{action:'unlock',level:2,answer:'LC-1888'}).highestLevel,3);
    assert.deepEqual(state.hints,before.hints);
    assert.deepEqual(state.checkProgress,before.checkProgress);
    assert.throws(() => applyAction({...before,highestLevel:1},{action:'unlock',level:2,answer:'Martina Ríos'}));
  } finally { await server.close(); }
});
