import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('Las coartadas: errores sin penalización, requisitos y avance correcto', async () => {
  const server = await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
  try {
    const { applyAction } = await server.ssrLoadModule('/api/_lib/detectives/game.ts');
    const { alibiFeedback } = await server.ssrLoadModule('/detectives/alibi-feedback.ts');
    const state = {agent:'Prueba local',highestLevel:2,hints:{1:1},checkProgress:{1:2,2:2},completedAt:null};
    const before = structuredClone(state);
    for (const name of ['Bruno Vidal','Vera Salas','León Costa']) {
      assert.throws(() => applyAction(state,{action:'unlock',level:2,answer:name}), error => error.code === 'WRONG_ANSWER' && error.status === 400);
      assert.deepEqual(state,before,`${name}: debe conservar todas las deducciones, pistas y nivel`);
      assert.ok(alibiFeedback[name]?.text);
    }
    const incomplete = {...structuredClone(state),checkProgress:{2:1}};
    assert.throws(() => applyAction(incomplete,{action:'unlock',level:2,answer:'Martina Ríos'}));
    assert.equal(incomplete.highestLevel,2);
    assert.equal(applyAction(state,{action:'unlock',level:2,answer:'Martina Ríos'}).highestLevel,3);
    assert.deepEqual(state.hints,before.hints);
    assert.deepEqual(state.checkProgress,before.checkProgress);
    assert.throws(() => applyAction({...before,highestLevel:1},{action:'unlock',level:2,answer:'Martina Ríos'}));
  } finally { await server.close(); }
});
