import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('Laboratorio: relacionar R-17 con Martina antes de identificar el destino',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
 try{
  const {applyAction}=await server.ssrLoadModule('/api/_lib/detectives/game.ts');
  const state={agent:'Prueba',highestLevel:5,hints:{5:1},checkProgress:{},completedAt:null};
  assert.throws(()=>applyAction(state,{action:'unlock',level:5,answer:'banderas'}));
  assert.throws(()=>applyAction(state,{action:'deduction',level:5,index:0,selection:0}));
  applyAction(state,{action:'deduction',level:5,index:0,selection:1});
  const before=structuredClone(state);
  for(const answer of ['taller','molde','resina']){
   assert.throws(()=>applyAction(state,{action:'unlock',level:5,answer}));
   assert.deepEqual(state,before);
  }
  for(const answer of ['BANDERAS','sala de banderas','la sala de banderas'])
   assert.equal(applyAction(structuredClone(state),{action:'unlock',level:5,answer}).highestLevel,6);
 }finally{await server.close();}
});
