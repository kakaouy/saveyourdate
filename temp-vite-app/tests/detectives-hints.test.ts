import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
test('pistas: siempre secuenciales, conservan progreso y respetan el máximo', async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
 try{
  const {applyAction,hashCode}=await server.ssrLoadModule('/api/_lib/detectives/game.ts');
  let state={agent:'Prueba',highestLevel:1,hints:{},checkProgress:{},completedAt:null};
  // Un índice enviado por un cliente no permite saltar a la última ayuda.
  state=applyAction(state,{action:'hint',level:1,index:2});assert.equal(state.hints[1],1);
  state=JSON.parse(JSON.stringify(state));
  applyAction(state,{action:'hint',level:1});assert.equal(state.hints[1],2);
  applyAction(state,{action:'hint',level:1});assert.equal(state.hints[1],3);
  applyAction(state,{action:'hint',level:1});assert.equal(state.hints[1],3);
  const legacy={agent:'Prueba',highestLevel:1,hints:{1:1},checkProgress:{},completedAt:null};
  applyAction(legacy,{action:'hint',level:1});assert.equal(legacy.hints[1],2);
  const codes=JSON.parse(readFileSync(new URL('../api/_lib/detectives/access-codes.json',import.meta.url),'utf8'));
  for(const code of ['PRUEBA',...Array.from({length:20},(_,i)=>`PRUEBA${i+1}`)]) assert.ok(codes.includes(await hashCode(` ${code.toLowerCase()} `)));
  assert.ok(!codes.includes(await hashCode('PRUEBA21')));
 }finally{await server.close();}
});
