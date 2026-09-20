import FedericaPortrait from './FedericaPortrait';
import TransmissionPlayer from './TransmissionPlayer';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {terminalIntro,terminalSuccess} from './terminal-script';

function FedeTransmission({success,onClose}:{success:boolean;onClose:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const audio=useRef<HTMLAudioElement>(null);
 const [blocked,setBlocked]=useState(false);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  const element=dialog.current; const player=audio.current;
  element?.showModal();
  void player?.play().catch(()=>setBlocked(true));
  return ()=>{player?.pause();element?.close();previous?.focus();};
 },[]);
 return <dialog ref={dialog} className={`terminal-dialog terminal-dialog-${success?'success':'intro'}`} aria-labelledby="terminal-fede-title" onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <div className="terminal-dialog-layout">
   <div className="terminal-dialog-visual">
    <FedericaPortrait audioRef={audio} kind={success?'success':'intro'}/>
    <p className="terminal-dialog-kicker">AGENCIA F · TRANSMISIÓN RECUPERADA</p>
    <button className="terminal-dialog-close" type="button" aria-label="Cerrar mensaje de Federica" onClick={onClose}>×</button>
   </div>
   <div className="terminal-dialog-copy"><div className="terminal-dialog-title-row"><h2 id="terminal-fede-title">{success?'Acceso recuperado.':'Agente, necesito tu ayuda.'}</h2>
   <button className="primary-button terminal-dialog-action" onClick={onClose} autoFocus>{success?'CONTINUAR':'INVESTIGAR'} →</button></div>
   <p className="terminal-dialog-message">{success?terminalSuccess:terminalIntro}</p>
   <TransmissionPlayer audioRef={audio} source={`/los-archivos-f/audio/fede-terminal-${success?'exito':'inicio'}-v1.wav`} title="Mensaje de Federica" footnote={false} onEnded={()=>{}} onPlaying={()=>{}} onError={()=>setBlocked(true)}/>
   {blocked&&<small>Tocá reproducir para escuchar el mensaje. También podés leerlo.</small>}
   </div>
  </div>
 </dialog>;
}
export default function TerminalLevel({unlocked,busy,message,onUnlock,onContinue}:{unlocked:boolean;busy:boolean;message:string;onUnlock:(answer:string)=>Promise<boolean>;onContinue:()=>void}) {
 const [intro,setIntro]=useState(!unlocked);
 const [answer,setAnswer]=useState('');
 const [lighting,setLighting]=useState(false);
 const [success,setSuccess]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const submitted=useRef(false);
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 async function submit(event:FormEvent){
  event.preventDefault();if(busy||submitted.current||answer.trim().length!==4)return;
  submitted.current=true;
  if(await onUnlock(answer)){
   setLighting(true);
   timer.current=setTimeout(()=>{setLighting(false);setSuccess(true);},window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:900);
  }else{submitted.current=false;input.current?.focus();}
 }
 return <section className="terminal-level">
  <div className="terminal-heading"><p className="eyebrow">NIVEL 1 · ARCHIVO F-01</p><button className="reading-choice" onClick={()=>setIntro(true)}>◉ Escuchar a Fede</button></div>
  <div className={`terminal-scene ${lighting?'terminal-illuminated':''}`}>
   <img src="/los-archivos-f/images/terminal-recuperacion-v1.png" alt="Computadora antigua del archivo, junto a una lámpara y una ventana lluviosa"/>
   <span className="terminal-rain" aria-hidden="true"/><span className="terminal-lamp-pulse" aria-hidden="true"/><span className="terminal-scanlines" aria-hidden="true"/>
   <form className="terminal-screen" onSubmit={submit}>
    <h1>{unlocked?'ACCESO RECUPERADO':'RECUPERACIÓN DE ACCESO'}</h1>
    {!unlocked?<><label htmlFor="terminal-password">Clave de emergencia:<br/>instante de interrupción</label><div className="terminal-entry"><input ref={input} id="terminal-password" aria-label="Código de acceso de cuatro caracteres" maxLength={4} minLength={4} required autoComplete="off" spellCheck={false} value={answer} placeholder="_ _ _ _" onChange={e=>setAnswer(e.target.value)} disabled={busy||lighting}/><span aria-hidden="true" className="terminal-cursor">▍</span></div><button type="submit" disabled={busy||lighting||answer.trim().length!==4}>{busy?'VERIFICANDO…':'ACCEDER'}</button></>:<><p>ARCHIVO DE PERSONAL HABILITADO</p><button type="button" onClick={()=>setSuccess(true)}>ESCUCHAR INFORME</button></>}
   </form>
  </div>
  {message&&!unlocked&&<p className="terminal-error" role="status">{message}</p>}
  {unlocked&&!lighting&&<button className="primary-button" onClick={onContinue}>CONTINUAR LA INVESTIGACIÓN →</button>}
  {intro&&<FedeTransmission success={false} onClose={()=>{setIntro(false);requestAnimationFrame(()=>input.current?.focus());}}/>}
  {success&&<FedeTransmission success onClose={()=>{setSuccess(false);onContinue();}}/>}
 </section>;
}
