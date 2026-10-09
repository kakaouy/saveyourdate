import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
test('pistas: avanzan en orden o registran todas al pedir la solución directa', async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
 try{
  const {applyAction,hashCode}=await server.ssrLoadModule('/api/_lib/detectives/game.ts');
  let state={agent:'Prueba',highestLevel:1,hints:{},checkProgress:{},completedAt:null};
  // Un índice enviado por un cliente no permite saltar a la última ayuda.
  state=applyAction(state,{action:'hint',level:1,index:2});assert.equal(state.hints[1],1);
  state=JSON.parse(JSON.stringify(state));
  applyAction(state,{action:'hint',level:1});assert.equal(state.hints[1],2);
  applyAction(state,{action:'hint',level:1});assert.equal(state.hints[1],3);
  applyAction(state,{action:'hint',level:1});assert.equal(state.hints[1],4);
  applyAction(state,{action:'hint',level:1});assert.equal(state.hints[1],4);
  const legacy={agent:'Prueba',highestLevel:1,hints:{1:1},checkProgress:{},completedAt:null};
  applyAction(legacy,{action:'hint',level:1});assert.equal(legacy.hints[1],2);
  applyAction(legacy,{action:'hint',level:1,direct:true});assert.equal(legacy.hints[1],4);
  const codes=JSON.parse(readFileSync(new URL('../api/_lib/detectives/access-codes.json',import.meta.url),'utf8'));
  for(const code of ['F01-D1-09B422','F01-D2-5AC2E6','F01-D3-EF2831','F01-D4-156647','F01-D5-9F02D6','F01-D6-F89950','F01-D7-40A208','F01-D8-513F49','F01-D9-1EDD66','F01-D10-0181BD']) assert.ok(codes.includes(await hashCode(` ${code.toLowerCase()} `)));
  assert.ok(!codes.includes(await hashCode('F01-D11-INVALID')));
 }finally{await server.close();}
});

test('cada nivel ofrece una solución directa únicamente como última pista',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
 try{
  const {levels}=await server.ssrLoadModule('/detectives/case.ts');
  const expected=['1937','1888','TALLER','937','Banderas','FAROL','11820'];
  levels.forEach((level:{hints:string[]},index:number)=>{
   assert.ok(level.hints.length>=4);
   assert.match(level.hints.at(-1),/^SOLUCIÓN DIRECTA/);
   assert.ok(level.hints.at(-1).toLocaleUpperCase('es').includes(expected[index].toLocaleUpperCase('es')));
   assert.ok(level.hints.slice(0,-1).every(hint=>!hint.startsWith('SOLUCIÓN DIRECTA')));
  });
 }finally{await server.close();}
});

test('el podio prioriza menos pistas antes que el tiempo',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
 try{
  const {compareLeaderboardEntries}=await server.ssrLoadModule('/api/_lib/detectives/game.ts');
  const entries=[
   {completed:true,hintsUsed:2,elapsedSeconds:300},
   {completed:true,hintsUsed:0,elapsedSeconds:7200},
   {completed:true,hintsUsed:1,elapsedSeconds:900},
   {completed:false,hintsUsed:0,elapsedSeconds:100},
  ].sort(compareLeaderboardEntries);
  assert.deepEqual(entries.map(entry=>[entry.completed,entry.hintsUsed,entry.elapsedSeconds]),[
   [true,0,7200],[true,1,900],[true,2,300],[false,0,100],
  ]);
 }finally{await server.close();}
});
