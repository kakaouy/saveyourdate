import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('Coartadas: códigos alternativos conservan el progreso y permiten reintentar', async () => {
  const server = await createServer({configFile:false, server:{middlewareMode:true}, appType:'custom'});
  try {
    const {applyAction} = await server.ssrLoadModule('/api/_lib/detectives/game.ts');
    const state = {agent:'Prueba', highestLevel:2, hints:{2:1}, checkProgress:{}, completedAt:null};
    const before = structuredClone(state);
    for (const answer of ['3049','8124','5092']) {
      assert.throws(() => applyAction(state,{action:'unlock',level:2,answer}), {code:'WRONG_ANSWER'});
      assert.deepEqual(state,before);
    }
    assert.equal(applyAction(state,{action:'unlock',level:2,answer:'LC-1888'}).highestLevel,3);
    assert.equal(state.hints[2],1);
  } finally { await server.close(); }
});
