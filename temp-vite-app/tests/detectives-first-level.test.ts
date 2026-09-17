import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
test('La hora verdadera: deducciones, hora de cámara incorrecta y apertura 19:37',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
 try{
  const {applyAction}=await server.ssrLoadModule('/api/_lib/detectives/game.ts');
  const state={agent:'Prueba',highestLevel:1,hints:{},checkProgress:{},completedAt:null};
  assert.throws(()=>applyAction(state,{action:'unlock',level:1,answer:'1937'}));
  applyAction(state,{action:'deduction',level:1,index:0,selection:1});
  assert.throws(()=>applyAction(state,{action:'unlock',level:1,answer:'1937'}));
  applyAction(state,{action:'deduction',level:1,index:1,selection:1});
  assert.throws(()=>applyAction(state,{action:'unlock',level:1,answer:'19:30'}));
  assert.equal(state.highestLevel,1);
  assert.equal(applyAction(structuredClone(state),{action:'unlock',level:1,answer:'1937'}).highestLevel,2);
  assert.equal(applyAction(state,{action:'unlock',level:1,answer:'19:37'}).highestLevel,2);
 }finally{await server.close();}
});
