import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('Compartimento: 704 habilita la acusación, sin cerrar aún el caso',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
 try{
  const {applyAction}=await server.ssrLoadModule('/api/_lib/detectives/game.ts');
  const state={agent:'Prueba',highestLevel:7,hints:{7:1},checkProgress:{},completedAt:null};
  assert.throws(()=>applyAction(state,{action:'final',who:'martina',how:'corredor',where:'lente'}));
  assert.throws(()=>applyAction(state,{action:'unlock',level:7,answer:'704'}));
  applyAction(state,{action:'deduction',level:7,index:0,selection:1});
  const before=structuredClone(state);
  for(const answer of ['047','407']){
   assert.throws(()=>applyAction(state,{action:'unlock',level:7,answer}));
   assert.deepEqual(state,before);
  }
  assert.equal(applyAction(state,{action:'unlock',level:7,answer:'704'}).highestLevel,8);
  assert.equal(state.completedAt,null);
  assert.equal(state.hints[7],1);
 }finally{await server.close();}
});
