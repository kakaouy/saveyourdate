import { activate, GameError, leaderboard, readGame, sessionHash, updateGame } from './game.js';

function response(data:unknown,status=200,extra:Record<string,string>={}) { return Response.json(data,{status,headers:{'Cache-Control':'no-store',...extra}}); }
function failure(error:unknown) { if(error instanceof GameError) return response({error:error.message,code:error.code},error.status); console.error('Game storage operation failed');return response({error:'No pudimos guardar en este momento. Conservamos tu respuesta; volvé a intentar.'},503); }
export async function GET(request:Request) {try{if(new URL(request.url).searchParams.get('view')==='leaderboard')return response(await leaderboard());return response((await readGame(await sessionHash(request))).state);}catch(error){return failure(error);}}
export async function POST(request:Request) {
  try {
    if(request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin) throw new GameError('Origen no permitido.',403);
    const raw=await request.text();if(raw.length>8000)throw new GameError('Solicitud demasiado larga.');
    const body=JSON.parse(raw);
    if(body.action==='activate') {
      const code=String(body.code||'').trim().toUpperCase();
      const state=await activate(code,String(body.agent||''),body.legacy);
      const secure=new URL(request.url).protocol==='https:' ? '; Secure' : '';
      return response(state,200,{'Set-Cookie':`archivo_f=${encodeURIComponent(code)}; HttpOnly; SameSite=Lax; Path=/los-archivos-f; Max-Age=31536000${secure}`});
    }
    return response(await updateGame(await sessionHash(request),body));
  }catch(error){return failure(error);}
}

export default { fetch: async (request: Request) => request.method === 'GET' ? GET(request) : request.method === 'POST' ? POST(request) : new Response(null,{status:405}) };
