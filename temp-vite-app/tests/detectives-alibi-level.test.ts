import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('Coartadas: respuestas alternativas conservan el progreso y permiten reintentar', async () => {
  const server = await createServer({configFile:false, server:{middlewareMode:true}, appType:'custom'});
  try {
    const {applyAction} = await server.ssrLoadModule('/api/_lib/detectives/game.ts');
    const state = {agent:'Prueba', highestLevel:2, hints:{2:1}, checkProgress:{}, completedAt:null};
    assert.throws(() => applyAction(state,{action:'unlock',level:2,answer:'Martina Ríos'}));
    applyAction(state,{action:'deduction',level:2,index:0,selection:1});
    applyAction(state,{action:'deduction',level:2,index:1,selection:0});
    const before = structuredClone(state);
    for (const answer of ['Bruno Vidal','Vera Salas','León Costa']) {
      assert.throws(() => applyAction(state,{action:'unlock',level:2,answer}), {code:'WRONG_ANSWER'});
      assert.deepEqual(state,before);
    }
    assert.equal(applyAction(state,{action:'unlock',level:2,answer:'Martina Ríos'}).highestLevel,3);
    assert.equal(state.hints[2],1);
  } finally { await server.close(); }
});
