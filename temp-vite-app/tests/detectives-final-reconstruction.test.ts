import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('Acusación: exige quién, cómo y dónde; preserva intentos y fecha original de cierre',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
 try{
  const {applyAction}=await server.ssrLoadModule('/api/_lib/detectives/game.ts');
  const state={agent:'Prueba',highestLevel:8,hints:{2:2},checkProgress:{},completedAt:null};
  const correct={action:'final',who:'martina',how:'corredor',where:'lente'};
  for(const answer of [{...correct,who:''},{...correct,how:''},{...correct,where:''},{...correct,who:'bruno'},{...correct,how:'terraza'},{...correct,where:'bolso'}]){
   const before=structuredClone(state);
   assert.throws(()=>applyAction(state,answer));
   assert.deepEqual(state,before);
  }
  applyAction(state,correct);
  assert.equal(state.highestLevel,9);
  assert.ok(state.completedAt);
  assert.equal(state.hints[2],2);
  const date=state.completedAt;
  applyAction(state,correct);
  assert.equal(state.completedAt,date);
 }finally{await server.close();}
});
