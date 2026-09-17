import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';

test('La señal coincide con la clave de impresión y solo abre el taller tras la deducción', async () => {
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
 try {
  const {levels}=await server.ssrLoadModule('/detectives/case.ts');
  const {applyAction}=await server.ssrLoadModule('/api/_lib/detectives/game.ts');
  const source=readFileSync(new URL('../../docs/los-archivos-f/fuentes/generar_senales_y_plano.py',import.meta.url),'utf8');
  const definition=source.match(/codes=\{([^}]+)\}/)![1];
  const key=Object.fromEntries([...definition.matchAll(/'([A-Z])':'([o-]+)'/g)].map(m=>[m[2],m[1]]));
  assert.equal(Object.keys(key).length,12);
  const groups=levels[2].digital.split('/').map((s:string)=>s.replace(/\s/g,'').replaceAll('—','-'));
  assert.equal(groups.length,6);
  assert.equal(groups.map((s:string)=>key[s]).join(''),'TALLER');
  const state={agent:'Prueba',highestLevel:3,hints:{},checkProgress:{},completedAt:null};
  assert.throws(()=>applyAction(state,{action:'unlock',level:3,answer:'taller'}));
  applyAction(state,{action:'deduction',level:3,index:0,selection:0});
  assert.throws(()=>applyAction(state,{action:'unlock',level:3,answer:'terraza'}));
  assert.equal(state.highestLevel,3);
  assert.equal(applyAction(state,{action:'unlock',level:3,answer:' TALLER '}).highestLevel,4);
 } finally { await server.close(); }
});
