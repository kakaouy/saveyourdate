import { readGame, sessionHash, GameError } from './game.js';
import { makeDiploma } from './diploma.mjs';

export async function GET(request:Request) {
  try {
    const {state}=await readGame(await sessionHash(request));
    if(state.highestLevel!==9) throw new GameError('El diploma se habilita al cerrar el caso.',403);
    const bytes=await makeDiploma(state);
    return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="Diploma-Agencia-F.pdf"','Cache-Control':'no-store'}});
  }catch(error){return Response.json({error:error instanceof GameError ? error.message : 'No se pudo generar el diploma.'},{status:error instanceof GameError?error.status:503,headers:{'Cache-Control':'no-store'}});}
}

export default { fetch: async (request: Request) => request.method === 'GET' ? GET(request) : new Response(null,{status:405}) };
