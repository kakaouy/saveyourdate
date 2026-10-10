import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { levels, microChecks } from './detectives/case.js'
import type { GameState } from './detectives/game-state.js'

class LocalGameError extends Error {
  status:number
  code?:string
  constructor(message:string,status=400,code?:string){super(message);this.status=status;this.code=code}
}

const localAccessHashes = new Set<string>(JSON.parse(readFileSync(new URL('./api/_lib/detectives/access-codes.json',import.meta.url),'utf8')) as string[])
const localGames = new Map<string,{state:GameState;version:number}>()
const localHash = (code:string) => createHash('sha256').update(code.trim().toUpperCase()).digest('hex')
const localCookieCode = (request:IncomingMessage) => request.headers.cookie?.split(';').map(value=>value.trim()).find(value=>value.startsWith('archivo_f='))?.slice(10)
const localJson = (response:ServerResponse,data:unknown,status=200,headers:Record<string,string>={}) => {
  response.statusCode=status
  response.setHeader('Content-Type','application/json; charset=utf-8')
  response.setHeader('Cache-Control','no-store')
  for(const [name,value] of Object.entries(headers))response.setHeader(name,value)
  response.end(JSON.stringify(data))
}
const localBody = (request:IncomingMessage) => new Promise<Record<string,unknown>>((resolve,reject)=>{
  let raw=''
  request.on('data',chunk=>{raw+=String(chunk);if(raw.length>8000)reject(new LocalGameError('Solicitud demasiado larga.'))})
  request.on('end',()=>{try{resolve(JSON.parse(raw||'{}') as Record<string,unknown>)}catch{reject(new LocalGameError('Solicitud inválida.'))}})
  request.on('error',reject)
})
const localNormalize = (value:string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ')
function applyLocalAction(state:GameState,body:Record<string,unknown>){
  if(body.action==='timer'){state.elapsedSeconds=Math.max(Math.floor(Number(state.elapsedSeconds)||0),Math.min(86400,Math.floor(Number(body.elapsedSeconds)||0)));return state}
  const level=Number(body.level)
  if(body.action==='start'){state.highestLevel=Math.max(1,state.highestLevel);return state}
  if(body.action==='final'){
    if(state.highestLevel<8)throw new LocalGameError('Primero resolvé los siete niveles.',403)
    if(body.who!=='martina'||body.how!=='corredor'||body.where!=='lente')throw new LocalGameError('La reconstrucción contiene al menos un error. Revisá quién, cómo y dónde.')
    state.highestLevel=9;state.completedAt ||= new Date().toISOString();return state
  }
  if(!Number.isInteger(level)||level<1||level>7||level>state.highestLevel)throw new LocalGameError('Este nivel todavía está bloqueado.',403)
  if(level<state.highestLevel)return state
  if(body.action==='hint'){const maximum=levels[level-1].hints.length;state.hints[level]=body.direct?maximum:Math.min(maximum,(state.hints[level]||0)+1);return state}
  if(body.action==='deduction'){
    const index=Number(body.index),expected=state.checkProgress[level]||0
    if(index<expected)return state
    if(index!==expected||microChecks[level-1][index]?.correct!==body.selection)throw new LocalGameError('La comprobación no coincide con las pruebas.')
    state.checkProgress[level]=expected+1;return state
  }
  if(body.action==='unlock'){
    if(level!==7&&(state.checkProgress[level]||0)<microChecks[level-1].length)throw new LocalGameError('Completá las deducciones antes de abrir el candado.')
    const answer=localNormalize(String(body.answer||'')),numeric=['numeric','safe','mechanical'].includes(levels[level-1].lock),cleaned=numeric?answer.replace(/\D/g,''):answer
    if(!levels[level-1].answer.some(candidate=>localNormalize(candidate)===cleaned))throw new LocalGameError(level===1?'Todavía no recuperamos el acceso. No te rindas: compará los detalles y probá otra combinación.':'Ese código no abre el candado. Revisá las pruebas o pedí una pista.',400,'WRONG_ANSWER')
    state.highestLevel=level+1;return state
  }
  throw new LocalGameError('Acción no válida.')
}

function detectivesLocalApi():Plugin {
  return {name:'detectives-local-api',apply:'serve',configureServer(server){
    server.middlewares.use('/los-archivos-f/api/game',async(request,response)=>{
      try{
        if(request.method==='POST'){
          const body=await localBody(request)
          if(body.action==='activate'){
            const code=String(body.code||'').trim().toUpperCase(),hash=localHash(code),agent=String(body.agent||'').trim()
            if(!localAccessHashes.has(hash))throw new LocalGameError('No encontramos ese código. Revisá la tarjeta de tu carpeta.')
            if(!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 ._\-]{1,48}$/.test(agent))throw new LocalGameError('Usá un alias de hasta 48 letras o números, sin símbolos especiales.')
            if(!localGames.has(hash))localGames.set(hash,{state:{agent,highestLevel:0,hints:{},checkProgress:{},completedAt:null,elapsedSeconds:0},version:0})
            else if(localGames.get(hash)!.state.highestLevel===0)localGames.get(hash)!.state.agent=agent
            return localJson(response,localGames.get(hash)!.state,200,{'Set-Cookie':`archivo_f=${encodeURIComponent(code)}; HttpOnly; SameSite=Lax; Path=/los-archivos-f; Max-Age=31536000`})
          }
          const encoded=localCookieCode(request)
          if(!encoded)throw new LocalGameError('Ingresá el código de tu tarjeta para continuar.',401)
          const hash=localHash(decodeURIComponent(encoded)),current=localGames.get(hash)
          if(!localAccessHashes.has(hash)||!current)throw new LocalGameError('Activá primero tu expediente.',401)
          current.state=applyLocalAction(current.state,body);current.version+=1
          return localJson(response,current.state)
        }
        if(request.method==='GET'){
          const encoded=localCookieCode(request)
          if(!encoded)throw new LocalGameError('Ingresá el código de tu tarjeta para continuar.',401)
          const current=localGames.get(localHash(decodeURIComponent(encoded)))
          if(!current)throw new LocalGameError('Activá primero tu expediente.',401)
          return localJson(response,current.state)
        }
        return localJson(response,{error:'Método no permitido.'},405)
      }catch(error){
        if(error instanceof LocalGameError)return localJson(response,{error:error.message,code:error.code},error.status)
        console.error(error);return localJson(response,{error:'No pudimos guardar en este momento.'},503)
      }
    })
  }}
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),detectivesLocalApi()],
  build: { rollupOptions: { input: { main: 'index.html', detectives: 'los-archivos-f/index.html' } } },
})
