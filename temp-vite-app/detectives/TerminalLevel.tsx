import FedericaPortrait from './FedericaPortrait';
import TransmissionPlayer from './TransmissionPlayer';
import LevelSideTabs from './LevelSideTabs';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {terminalIntro,terminalSuccess} from './terminal-script';
import {playEffect,playKeyboardKey,playLampBuzz,playPowerSurge,playTerminalConfirm,playTerminalDigital} from './sounds';

function FedeTransmission({success,onClose}:{success:boolean;onClose:()=>void}) {
 const audio=useRef<HTMLAudioElement>(null);
 const [blocked,setBlocked]=useState(false);
 useEffect(()=>{
  const player=audio.current;
  void player?.play().catch(()=>setBlocked(true));
  return ()=>{player?.pause();};
 },[]);
 return <section className={`terminal-dialog story-page-view terminal-dialog-${success?'success':'intro'}`} aria-labelledby="terminal-fede-title">
  <div className="terminal-dialog-layout">
   <div className="terminal-dialog-visual">
    <FedericaPortrait audioRef={audio} kind={success?'success':'intro'}/>
   </div>
   <div className="terminal-dialog-copy"><p className="terminal-dialog-kicker">AGENCIA F · TRANSMISIÓN RECUPERADA</p><div className="terminal-dialog-title-row"><h2 id="terminal-fede-title">{success?'Acceso recuperado.':'Agente, necesito tu ayuda.'}</h2></div>
   <TransmissionPlayer audioRef={audio} source={`/los-archivos-f/audio/fede-terminal-${success?'exito':'inicio'}-v1.wav`} title="Mensaje de Federica" footnote={false} onEnded={()=>{}} onPlaying={()=>{}} onError={()=>setBlocked(true)}/>
   <p className="terminal-dialog-message">{success?terminalSuccess:terminalIntro}</p>
   {success&&<div className="terminal-time-sources" aria-label="Comparación de las referencias horarias"><span><small>CAPTURAS DE CÁMARA</small><b>Antes y después del corte</b></span><i aria-hidden="true">→</i><span className="confirmed"><small>RELOJ DETENIDO</small><b>19:37 · hora exacta</b></span></div>}
   {blocked&&<small>Tocá reproducir para escuchar el mensaje. También podés leerlo.</small>}
   </div>
   <button className="primary-button terminal-dialog-action story-visual-action story-page-action" onClick={onClose} autoFocus>{success?'CONTINUAR AL NIVEL 2':'COMENZAR LA MISIÓN'} →</button>
  </div>
 </section>;
}
export default function TerminalLevel({unlocked,busy,message,deferSuccess,onUnlock,onContinue}:{unlocked:boolean;busy:boolean;message:string;deferSuccess:boolean;onUnlock:(answer:string)=>Promise<boolean>;onContinue:()=>void}) {
 const [intro,setIntro]=useState(!unlocked);
 const [powered,setPowered]=useState(false);
 const [lightOn,setLightOn]=useState(false);
 const [answer,setAnswer]=useState('');
 const [lighting,setLighting]=useState(false);
 const [success,setSuccess]=useState(false);
 const [validating,setValidating]=useState(0);
 const [powerSurge,setPowerSurge]=useState(false);
 const [invalidAnswer,setInvalidAnswer]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const submitted=useRef(false);
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 async function submit(event:FormEvent){
  event.preventDefault();if(busy||submitted.current||answer.trim().length!==4)return;
  submitted.current=true;
  if(answer==='1937'){
   playTerminalDigital();
   for(let digit=1;digit<=4;digit+=1){setValidating(digit);playKeyboardKey();await new Promise(resolve=>window.setTimeout(resolve,500));}
  }
  if(await onUnlock(answer)){
   playTerminalConfirm();
   setLighting(true);
   timer.current=setTimeout(()=>{setLighting(false);setSuccess(true);},window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:900);
  }else{submitted.current=false;setValidating(0);setInvalidAnswer(true);input.current?.focus();}
 }
 if(intro)return <FedeTransmission success={false} onClose={()=>{setIntro(false);requestAnimationFrame(()=>input.current?.focus());}}/>;
 if(success&&!deferSuccess)return <FedeTransmission success onClose={()=>{setSuccess(false);onContinue();}}/>;
 return <section className="terminal-level">
  <div className="terminal-heading"><p className="eyebrow">NIVEL 1 · ARCHIVO F-01</p></div>
  <div className="level-objective">
   <span>OBJETIVO</span>
   <p>Revisá los registros de las cámaras y recuperá el instante exacto de la interrupción.</p>
  </div>
  <aside className="physical-clue physical-clue-envelope" aria-label="Recurso impreso vinculado con la terminal"><img src="/los-archivos-f/images/material-nivel1-sobre-fotos.png" alt="Sobre de información confidencial con fotografías de cámaras"/></aside>
  <div className={`terminal-scene ${powered?'terminal-powered':'terminal-off'} ${lighting?'terminal-illuminated':''} ${powerSurge?'terminal-current-surge':''}`}>
   <img src={!lightOn?'/los-archivos-f/images/terminal-lampara-apagada-v1.png':powered?'/los-archivos-f/images/terminal-encendida-v1.png':'/los-archivos-f/images/terminal-recuperacion-v1.png'} alt={`Computadora antigua del archivo ${powered?'encendida':'apagada'} y lámpara ${lightOn?'encendida':'apagada'}`}/>
   {lightOn&&<span className="terminal-lamp-pulse" aria-hidden="true"/>}<span className="terminal-scanlines" aria-hidden="true"/>
   {powered&&<form className="terminal-screen" onSubmit={submit}>
    <h1>{unlocked?'ACCESO RECUPERADO':'RECUPERACIÓN DE ACCESO'}</h1>
    {!unlocked?<><label htmlFor="terminal-answer">Instante de interrupción</label><input ref={input} className={invalidAnswer?'terminal-answer-error':''} id="terminal-answer" inputMode="numeric" value={answer} onChange={event=>{const next=event.target.value.replace(/\D/g,'').slice(0,4);setInvalidAnswer(false);if(next.length>answer.length)playKeyboardKey();if(next.length===4&&answer.length<4)playEffect('piece');setAnswer(next);}} placeholder="____" maxLength={4} autoComplete="off" disabled={validating>0}/>{answer.length===4&&!invalidAnswer&&validating===0&&<small className="terminal-ready-state">MECANISMO PREPARADO · verificá la hora</small>}{validating>0&&<span className="terminal-digit-validation" role="status" aria-live="polite">{answer.split('').map((digit,index)=><i className={index<validating?'confirmed':''} key={`${digit}-${index}`}>{digit}{index<validating&&<b>✓</b>}</i>)}</span>}<button type="submit" disabled={busy||validating>0||answer.length!==4}>{validating>0?`VALIDANDO ${validating}/4…`:busy?'VERIFICANDO…':'VERIFICAR RESPUESTA'}</button></>:<p className="terminal-confirmed-result">CORTE CONFIRMADO · 19:37</p>}
    <span className="terminal-command-cursor" aria-hidden="true">▌</span>
   </form>}
   <button type="button" className="terminal-power-button" aria-label={powered?'Apagar computadora':'Encender computadora'} aria-pressed={powered} onClick={()=>{playEffect('panel');setPowered(current=>{const next=!current;setLightOn(next);if(next){playPowerSurge();playLampBuzz();setPowerSurge(true);window.setTimeout(()=>setPowerSurge(false),650);requestAnimationFrame(()=>input.current?.focus());}return next;});}}><span className="sr-only">{powered?'Apagar':'Encender'}</span></button>
  </div>
  {message&&!unlocked&&<p className="terminal-error" role="status">{message}</p>}
  {unlocked&&!lighting&&<button className="primary-button" onClick={onContinue}>CONTINUAR AL NIVEL 2 →</button>}
  <LevelSideTabs level={1} prompt="" placeholder="" answer={answer} busy={busy||lighting} unlocked={unlocked} canUnlock={false} message={message} missionMessageOpen={intro||success} onAnswer={setAnswer} onReplay={()=>setIntro(true)} onUnlock={submit} showUnlock={false}/>
 </section>;
}
