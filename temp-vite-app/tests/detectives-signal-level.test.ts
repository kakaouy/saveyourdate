import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';

test('Las seis señales se reconstruyen antes de abrir el taller', async () => {
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
 try {
  const {levels}=await server.ssrLoadModule('/detectives/case.ts');
  const {applyAction}=await server.ssrLoadModule('/api/_lib/detectives/game.ts');
  const source=readFileSync(new URL('../../docs/los-archivos-f/fuentes/generar_senales_y_plano.py',import.meta.url),'utf8');
  const definition=source.match(/codes=\{([^}]+)\}/)![1];
  const key=Object.fromEntries([...definition.matchAll(/'([A-Z])':'([o-]+)'/g)].map(m=>[m[2],m[1]]));
  assert.equal(Object.keys(key).length,12);
  const component=readFileSync(new URL('../detectives/LightSignal.tsx',import.meta.url),'utf8');
  const patterns=[...component.matchAll(/pattern:'([^']+)'/g)].map(match=>match[1].replace(/\s/g,'').replaceAll('—','-'));
  assert.equal(patterns.length,6);
  assert.deepEqual(patterns.map(pattern=>key[pattern]).sort(),[...'TALLER'].sort());
  assert.match(component,/\['compass','lantern','wave-a','wave-b','key','anchor'\]|ids\[0\]==='compass'/);
  const state={agent:'Prueba',highestLevel:3,hints:{},checkProgress:{},completedAt:null};
  assert.throws(()=>applyAction(state,{action:'unlock',level:3,answer:'terraza'}));
  assert.equal(state.highestLevel,3);
  assert.equal(applyAction(state,{action:'unlock',level:3,answer:' TALLER '}).highestLevel,4);
 } finally { await server.close(); }
});
