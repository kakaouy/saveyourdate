import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

test('el audio final de Martina aparece después del compartimento y no cierra la partida',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
 try{
  const {default:Statement}=await server.ssrLoadModule('/detectives/FinalStatement.tsx');
  const {applyAction}=await server.ssrLoadModule('/api/_lib/detectives/game.ts');
  const state={agent:'Prueba',highestLevel:7,hints:{},checkProgress:{7:1},completedAt:null};
  assert.equal(renderToStaticMarkup(createElement(Statement,{highestLevel:state.highestLevel})), '');
  applyAction(state,{action:'unlock',level:7,answer:'11820'});
  const before=structuredClone(state);
  const markup=renderToStaticMarkup(createElement(Statement,{highestLevel:state.highestLevel}));
  for(const phrase of ['REGISTRO DE AUDIO','Martina Ríos','interrogatorio-martina.wav']) assert.ok(markup.includes(phrase));
  for(const phrase of ['Nueva declaración','K-01','Preparar la reconstrucción']) assert.ok(!markup.includes(phrase));
  assert.deepEqual(state,before);
  assert.equal(state.completedAt,null);
  assert.ok(markup.includes('<audio'));
 }finally{await server.close();}
});
