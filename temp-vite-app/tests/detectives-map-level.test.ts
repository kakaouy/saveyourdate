import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('Corredor: alinear referencias es obligatorio y leer al revés no abre el candado', async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
 try {
  const {applyAction}=await server.ssrLoadModule('/api/_lib/detectives/game.ts');
  const state={agent:'Prueba',highestLevel:4,hints:{4:1},checkProgress:{},completedAt:null};
  assert.throws(()=>applyAction(state,{action:'unlock',level:4,answer:'937'}));
  assert.throws(()=>applyAction(state,{action:'deduction',level:4,index:0,selection:0}));
  applyAction(state,{action:'deduction',level:4,index:0,selection:2});
  assert.throws(()=>applyAction(state,{action:'deduction',level:4,index:1,selection:0}));
  applyAction(state,{action:'deduction',level:4,index:1,selection:1});
  const before=structuredClone(state);
  assert.throws(()=>applyAction(state,{action:'unlock',level:4,answer:'739'}));
  assert.deepEqual(state,before);
  assert.equal(applyAction(state,{action:'unlock',level:4,answer:'937'}).highestLevel,5);
 } finally {await server.close();}
});
