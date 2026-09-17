import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

test('D-05 no se muestra antes de resolver el compartimento y no cierra la partida',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
 try{
  const {default:Statement}=await server.ssrLoadModule('/detectives/FinalStatement.tsx');
  const {applyAction}=await server.ssrLoadModule('/api/_lib/detectives/game.ts');
  const state={agent:'Prueba',highestLevel:7,hints:{},checkProgress:{7:1},completedAt:null};
  assert.equal(renderToStaticMarkup(createElement(Statement,{highestLevel:state.highestLevel})), '');
  applyAction(state,{action:'unlock',level:7,answer:'704'});
  const before=structuredClone(state);
  const markup=renderToStaticMarkup(createElement(Statement,{highestLevel:state.highestLevel}));
  for(const phrase of ['D-05','R-17','LF-04','medicina','K-01']) assert.ok(markup.includes(phrase));
  assert.deepEqual(state,before);
  assert.equal(state.completedAt,null);
  assert.ok(!markup.includes('<audio'));
 }finally{await server.close();}
});
