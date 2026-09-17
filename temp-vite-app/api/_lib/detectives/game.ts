import { supabaseRequest } from '../orders.js';
import { levels, microChecks } from '../../../detectives/case.js';
import type { GameState } from '../../../detectives/game-state.js';
import validHashes from './access-codes.json' with { type: 'json' };
export class GameError extends Error { constructor(message: string, public status = 400) { super(message); } }
export const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ');
export async function hashCode(code: string) {
  const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code.trim().toUpperCase()));
  return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function sessionHash(request: Request) {
  const cookie = request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('archivo_f='))?.slice(10);
  if (!cookie) throw new GameError('Ingresá el código de tu tarjeta para continuar.',401);
  const hash = await hashCode(decodeURIComponent(cookie));
  if (!validHashes.includes(hash)) throw new GameError('El código no está habilitado.',401);
  return hash;
}
export async function readGame(hash: string) {
  const response = await supabaseRequest(`detective_games?code_hash=eq.${encodeURIComponent(hash)}&select=state,version&limit=1`);
  const [row] = await response.json() as Array<{state:GameState;version:number}>;
  if (!row) throw new GameError('Activá primero tu expediente.',401);
  return { state:row.state, version:row.version };
}
export async function activate(code: string, agent: string, legacy?: Partial<GameState>) {
  const hash = await hashCode(code);
  if (!validHashes.includes(hash)) throw new GameError('No encontramos ese código. Revisá la tarjeta de tu carpeta.');
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 ._\-]{1,48}$/.test(agent.trim())) throw new GameError('Usá un alias de hasta 48 letras o números, sin símbolos especiales.');
  const state: GameState = {agent:agent.trim(),highestLevel:0,hints:{},checkProgress:{},completedAt:null};
  // Preserve only the organiser’s earlier prototype; family codes always begin empty.
  if (code.trim().toUpperCase()==='F01-FEDE-11' && legacy) {
    state.highestLevel=Math.max(0,Math.min(9,Math.floor(Number(legacy.highestLevel)||0)));
    for(let n=1;n<=7;n++) {
      state.hints[n]=Math.max(0,Math.min(3,Math.floor(Number(legacy.hints?.[n])||0)));
      state.checkProgress[n]=n<state.highestLevel ? microChecks[n-1].length : Math.max(0,Math.min(microChecks[n-1].length,Math.floor(Number(legacy.checkProgress?.[n])||0)));
    }
    if(state.highestLevel===9) state.completedAt=new Date().toISOString();
  }
  await supabaseRequest('detective_games?on_conflict=code_hash', {method:'POST', headers:{Prefer:'resolution=ignore-duplicates'}, body:JSON.stringify({code_hash:hash,state,version:0,updated_at:new Date().toISOString()})});
  return (await readGame(hash)).state;
}
export function applyAction(state: GameState, body: Record<string, unknown>) {
  const level=Number(body.level);
  if(body.action==='start') { state.highestLevel=Math.max(1,state.highestLevel); return state; }
  if(body.action==='final') {
    if(state.highestLevel<8) throw new GameError('Primero resolvé los siete niveles.',403);
    if(body.who!=='martina'||body.how!=='corredor'||body.where!=='lente') throw new GameError('La reconstrucción contiene al menos un error. Revisá quién, cómo y dónde.');
    state.highestLevel=9;state.completedAt ||= new Date().toISOString();return state;
  }
  if(!Number.isInteger(level)||level<1||level>7||level>state.highestLevel) throw new GameError('Este nivel todavía está bloqueado.',403);
  if(level<state.highestLevel) return state;
  if(body.action==='hint') { state.hints[level]=Math.min(3,(state.hints[level]||0)+1);return state; }
  if(body.action==='deduction') {
    const index=Number(body.index), expected=state.checkProgress[level]||0;
    if(index<expected) return state;
    if(index!==expected||microChecks[level-1][index]?.correct!==body.selection) throw new GameError('La deducción no coincide con las pruebas.');
    state.checkProgress[level]=expected+1;return state;
  }
  if(body.action==='unlock') {
    if((state.checkProgress[level]||0)<microChecks[level-1].length) throw new GameError('Completá las deducciones antes de abrir el candado.');
    const answer=normalize(String(body.answer||''));
    const numeric=['numeric','safe','mechanical'].includes(levels[level-1].lock);
    const cleaned=numeric ? answer.replace(/[\s:\-]/g,'') : answer;
    if(!levels[level-1].answer.some(a=>normalize(a)===cleaned)) throw new GameError('Ese código no abre el candado. Revisá las pruebas o pedí una pista.');
    state.highestLevel=level+1;return state;
  }
  throw new GameError('Acción no válida.');
}
export async function updateGame(hash: string, body: Record<string, unknown>) {
  for(let attempt=0;attempt<3;attempt++) {
    const current=await readGame(hash);
    const state=applyAction(current.state,body);
    const response=await supabaseRequest(`detective_games?code_hash=eq.${encodeURIComponent(hash)}&version=eq.${current.version}`, {method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({state,version:current.version+1,updated_at:new Date().toISOString()})});
    if ((await response.json() as unknown[]).length) return state;
  }
  throw new GameError('Otra pantalla acaba de guardar. Volvé a intentar.',409);
}
