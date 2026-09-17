import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('Escondite: el sobre negro queda bloqueado hasta completar banderas', async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
 try {
  const {applyAction}=await server.ssrLoadModule('/api/_lib/detectives/game.ts');
  const state={agent:'Prueba',highestLevel:6,hints:{6:1},checkProgress:{},completedAt:null};
  assert.throws(()=>applyAction(state,{action:'deduction',level:7,index:0,selection:1}));
  assert.throws(()=>applyAction(state,{action:'unlock',level:6,answer:'lente'}));
  assert.throws(()=>applyAction(state,{action:'deduction',level:6,index:0,selection:0}));
  applyAction(state,{action:'deduction',level:6,index:0,selection:1});
  const before=structuredClone(state);
  for(const answer of ['lent','letne','704']) {
   assert.throws(()=>applyAction(state,{action:'unlock',level:6,answer}));
   assert.deepEqual(state,before);
  }
  for(const answer of ['LENTE','la lente','lente de Fresnel'])
   assert.equal(applyAction(structuredClone(state),{action:'unlock',level:6,answer}).highestLevel,7);
 } finally {await server.close();}
});
