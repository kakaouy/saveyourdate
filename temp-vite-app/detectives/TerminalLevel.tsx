import FedericaPortrait from './FedericaPortrait';
import TransmissionPlayer from './TransmissionPlayer';
import LevelSideTabs from './LevelSideTabs';
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
 return <dialog ref={dialog} className={`terminal-dialog terminal-dialog-${success?'success':'intro'}`} aria-labelledby="terminal-fede-title" onCancel={event=>event.preventDefault()}>
  <div className="terminal-dialog-layout">
   <div className="terminal-dialog-visual">
    <FedericaPortrait audioRef={audio} kind={success?'success':'intro'}/>
   </div>
   <div className="terminal-dialog-copy"><p className="terminal-dialog-kicker">AGENCIA F · TRANSMISIÓN RECUPERADA</p><div className="terminal-dialog-title-row"><h2 id="terminal-fede-title">{success?'Acceso recuperado.':'Agente, necesito tu ayuda.'}</h2></div>
   <TransmissionPlayer audioRef={audio} source={`/los-archivos-f/audio/fede-terminal-${success?'exito':'inicio'}-v1.wav`} title="Mensaje de Federica" footnote={false} onEnded={()=>{}} onPlaying={()=>{}} onError={()=>setBlocked(true)}/>
   <p className="terminal-dialog-message">{success?terminalSuccess:terminalIntro}</p>
   {blocked&&<small>Tocá reproducir para escuchar el mensaje. También podés leerlo.</small>}
   </div>
   <button className="primary-button terminal-dialog-action story-visual-action" onClick={onClose} autoFocus>{success?'CONTINUAR':'COMENZAR LA MISIÓN'} →</button>
  </div>
 </dialog>;
}
export default function TerminalLevel({unlocked,busy,message,onUnlock,onContinue}:{unlocked:boolean;busy:boolean;message:string;onUnlock:(answer:string)=>Promise<boolean>;onContinue:()=>void}) {
 const [intro,setIntro]=useState(!unlocked);
 const [powered,setPowered]=useState(false);
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
  <div className="terminal-heading"><p className="eyebrow">NIVEL 1 · ARCHIVO F-01</p></div>
  <div className={`terminal-scene ${powered?'terminal-powered':'terminal-off'} ${lighting?'terminal-illuminated':''}`}>
   <img src={powered?'/los-archivos-f/images/terminal-encendida-v1.png':'/los-archivos-f/images/terminal-recuperacion-v1.png'} alt={`Computadora antigua del archivo ${powered?'encendida':'apagada'}, junto a una lámpara y una ventana`}/>
   <span className="terminal-lamp-pulse" aria-hidden="true"/><span className="terminal-scanlines" aria-hidden="true"/>
   {powered&&<form className="terminal-screen" onSubmit={submit}>
    <h1>{unlocked?'ACCESO RECUPERADO':'RECUPERACIÓN DE ACCESO'}</h1>
    {!unlocked?<><label>Clave de emergencia:<br/>instante de interrupción</label><p>INGRESO DISPONIBLE EN EL CANDADO LATERAL</p></>:<><p>ARCHIVO DE PERSONAL HABILITADO</p><button type="button" onClick={()=>setSuccess(true)}>ESCUCHAR INFORME</button></>}
    <span className="terminal-command-cursor" aria-hidden="true">▌</span>
   </form>}
   <button type="button" className="terminal-power-button" aria-label={powered?'Apagar computadora':'Encender computadora'} aria-pressed={powered} onClick={()=>setPowered(current=>!current)}><span className="sr-only">{powered?'Apagar':'Encender'}</span></button>
  </div>
  {message&&!unlocked&&<p className="terminal-error" role="status">{message}</p>}
  {unlocked&&!lighting&&<button className="primary-button" onClick={onContinue}>CONTINUAR LA INVESTIGACIÓN →</button>}
  <LevelSideTabs level={1} prompt="Ingresá el código de 4 cifras que permite cerrar esta parte de la investigación." placeholder="Código de 4 cifras" answer={answer} busy={busy||lighting} unlocked={unlocked} canUnlock={!unlocked} message={message} missionMessageOpen={intro||success} onAnswer={setAnswer} onReplay={()=>setIntro(true)} onUnlock={submit}/>
  {intro&&<FedeTransmission success={false} onClose={()=>{setIntro(false);requestAnimationFrame(()=>input.current?.focus());}}/>}
  {success&&<FedeTransmission success onClose={()=>{setSuccess(false);onContinue();}}/>}
 </section>;
}
