import TerminalLevel from './TerminalLevel';
import FinalStatement from './FinalStatement';
import LightSignal from './LightSignal';
import LevelFourPlan from './LevelFourPlan';
import HintLenses from './HintLenses';
import Typewriter from './Typewriter';
import MissionMap from './MissionMap';
import LevelSideTabs from './LevelSideTabs';
import {playAchievement,playButtonClick,playCameraShutter,playDossierOpen,playEffect,playEvidenceSlide,playFedeRadioBeep,playHintReveal,playLevelComplete,playLevelTransition,playPageTurn,playPenMark,playSecretCollect,setEffectsEnabled,setStormDucked,startStormAmbience,stopStormAmbience} from './sounds';
import FinalCaseAudio from './FinalCaseAudio';
import PodiumAccess from './PodiumAccess';
'use client';

import Briefing from './Briefing';
import { levels, microChecks, unlockMessages } from './case';
import type { GameState } from './game-state';

import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

type Screen = 'home' | 'briefing' | 'library' | 'game';



const statements = [
  { name: 'Bruno Vidal', code:'BV-3049', role: 'Fotógrafo e inventarista', location: 'Sala de inventario', image: '/los-archivos-f/images/bruno-ficha-v3.png', text: 'Yo estaba sacando fotos para el inventario. Empecé antes del corte y seguí después. Mi cámara guarda todos los horarios.', records:['Foto · 19:24','Foto · 19:27','Foto · 19:28','Foto · 19:44','Foto · 19:46'] },
  { name: 'Vera Salas', code:'VS-8124', role: 'Responsable de archivo', location: 'Archivo Histórico', image: '/los-archivos-f/images/vera-ficha-v3.png', text: 'Entré al Archivo Histórico antes del apagón y salí cuando volvió la luz. Mi tarjeta registró las dos veces.', records:['Entrada · 19:26','Salida · 19:48'] },
  { name: 'León Costa', code:'LC-1888', role: 'Prensa y entrevistas', location: 'Sala de entrevistas y cafetería', image: '/los-archivos-f/images/leon-ficha-v3.png', text: 'Estaba con un periodista haciendo una entrevista. Hicimos una pausa corta para ir a la cafetería y después seguimos. Mientras estábamos allí vi unas señales extrañas y las anoté en una servilleta.', records:['Entrevista A · 19:20–19:36','Cafetería · 19:35–19:42','Entrevista B · 19:41–19:50'] },
  { name: 'Martina Ríos', code:'MR-5092', role: 'Restauradora', location: 'Taller de restauración', image: '/los-archivos-f/images/martina-ficha-v3.png', text: 'Estuve trabajando en restauración. Preparé materiales antes del apagón y cerré el lote cuando volvió la luz. El terminal del taller registra mis movimientos.', records:['Actividad · 19:22','Cierre de lote · 19:49'] },
];

const levelVisuals = ['/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-hidden-corridor.png', '/los-archivos-f/images/bg-restoration-workshop.png', '/los-archivos-f/images/nivel-6-sala-banderas-v3.png', '/los-archivos-f/images/lens-workshop.jpg'];
const successVisuals = ['/los-archivos-f/images/bruno-storm.jpg', '/los-archivos-f/images/suspects-group.jpg', '/los-archivos-f/images/control-room.jpg', '/los-archivos-f/images/corridor-spoiler-418.jpg', '/los-archivos-f/images/martina-dark.jpg', '/los-archivos-f/images/lens-workshop.jpg', '/los-archivos-f/images/evidence-spread-spoiler.jpg'];
const levelFourFinalFrames = ['/los-archivos-f/images/federica-nivel-4-final-loop.webp','/los-archivos-f/images/federica-nivel-4-final-frame-1.webp'];
const levelSevenIntroFrames = ['/los-archivos-f/images/federica-nivel-7-inicio-loop.webp?v=20261008b','/los-archivos-f/images/federica-nivel-7-inicio-frame-1.webp?v=20261008b'];
const levelSevenFinalFrames = ['/los-archivos-f/images/federica-nivel-7-final-loop.webp','/los-archivos-f/images/federica-nivel-7-final-frame-1.webp'];
const levelSixIntroFrames = ['/los-archivos-f/images/federica-nivel-6-inicio-loop.webp','/los-archivos-f/images/federica-nivel-6-inicio-frame-1.webp'];
const levelSixFinalFrames = ['/los-archivos-f/images/federica-nivel-6-final-loop.webp','/los-archivos-f/images/federica-nivel-6-final-frame-1.webp'];
const finalCaseLoop = '/los-archivos-f/images/federica-caso-cerrado-loop.webp';
const finalCaseStill = '/los-archivos-f/images/federica-caso-cerrado-frame-1.webp';

function SimulatedPlayer({label,onPlaying}:{label:string;onPlaying?:(value:boolean)=>void}){
  useEffect(()=>{onPlaying?.(false);if(/Fede|nivel|Presentación/i.test(label))playFedeRadioBeep();},[label,onPlaying]);
  return <div className="written-transmission" role="note" aria-label={`${label}. Transcripción disponible`}><span aria-hidden="true">⌁</span><b>TRANSMISIÓN ESCRITA</b><small>Mensaje recuperado · lectura disponible debajo</small></div>;
}

function MechanicalCodeBuilder({onCode}:{onCode:(code:string)=>void}){
  const [odd,setOdd]=useState('');const [even,setEven]=useState('');
  useEffect(()=>{onCode(odd.length===3&&even.length===2?`${odd}${even}`:'');},[odd,even,onCode]);
  const digits=(value:string,max:number)=>value.replace(/\D/g,'').slice(0,max);
  return <section className="mechanical-code-builder" aria-labelledby="mechanical-builder-title"><span>CALIBRACIÓN DEL MECANISMO</span><h3 id="mechanical-builder-title">Armá la combinación</h3><p>Sumá cada recorrido por separado. El mecanismo unirá los dos resultados.</p><div><label>IMPARES<input inputMode="numeric" value={odd} onChange={event=>setOdd(digits(event.target.value,3))} maxLength={3} placeholder="___" aria-label="Resultado de los impares"/></label><i aria-hidden="true">+</i><label>PARES<input inputMode="numeric" value={even} onChange={event=>setEven(digits(event.target.value,2))} maxLength={2} placeholder="__" aria-label="Resultado de los pares"/></label><output aria-live="polite">{odd.padEnd(3,'·')}{even.padEnd(2,'·')}</output></div><small>{odd.length===3&&even.length===2?'Combinación formada. Abrí el candado lateral para verificarla.':'Primero IMPARES; después PARES.'}</small></section>;
}

function FedeArtwork({src,alt,playing,variant,children,staticSrc,frames}:{src:string;alt:string;playing:boolean;variant:string;children?:ReactNode;staticSrc?:string;frames?:string[];frameDuration?:number}){
  const isSequence=Boolean(staticSrc||frames?.length);
  const loopSrc=frames?.[0]??src;
  const stillSrc=frames?.[1]??staticSrc;
  return <div className={`fede-artwork ${variant}`}>{isSequence?<picture className="fede-artwork-loop">{stillSrc&&<source media="(prefers-reduced-motion: reduce)" srcSet={stillSrc}/>}<img src={loopSrc} alt={alt}/></picture>:<img src={src} alt={alt}/>} {!isSequence&&<><span className={`fede-mouth ${playing?'talking':''}`} aria-hidden="true"/><span className="fede-hair" aria-hidden="true"/></>}{children}</div>;
}

function LevelTwoSuccessDialog({onContinue}:{onContinue:()=>void}){
  const [playing,setPlaying]=useState(false);
  return <section className="level-two-success-dialog story-page-view" aria-labelledby="level-two-success-title"><div className="level-two-success-visual"><FedeArtwork src="/los-archivos-f/images/federica-nivel-2-final-loop.webp" staticSrc="/los-archivos-f/images/federica-nivel-2-final-frame-1.webp" alt="Federica presenta el resultado de las coartadas frente al tablero de sospechosos" playing={playing} variant="level-2-success"/></div><div className="level-two-success-copy"><p className="story-dialog-kicker">AGENCIA F · NIVEL COMPLETADO</p><div className="story-dialog-title-row"><h2 id="level-two-success-title">Coartada verificada.</h2></div><SimulatedPlayer label="Mensaje final de Fede" onPlaying={setPlaying}/><p>{unlockMessages[1].text}</p><button className="primary-button story-page-action" onClick={onContinue}>CONTINUAR AL NIVEL 3 <span>→</span></button></div></section>;
}

function LevelTwoIntroDialog({onContinue}:{onContinue:()=>void}){
  const [playing,setPlaying]=useState(false);
  return <section className="level-two-success-dialog level-two-intro-dialog story-page-view" aria-labelledby="level-two-intro-title"><div className="level-two-success-visual"><FedeArtwork src="/los-archivos-f/images/federica-nivel-2-inicio-loop.webp" staticSrc="/los-archivos-f/images/federica-nivel-2-inicio-frame-1.png" alt="Federica presenta las cuatro coartadas en la sala de entrevistas" playing={playing} variant="level-2-intro"/></div><div className="level-two-success-copy"><p className="story-dialog-kicker">AGENCIA F · INICIO DEL NIVEL 2</p><div className="story-dialog-title-row"><h2 id="level-two-intro-title">Compará las coartadas.</h2></div><SimulatedPlayer label="Presentación del nivel 2" onPlaying={setPlaying}/><p>Descubrí quién puede demostrar dónde estuvo durante todo el apagón.</p><div className="story-mission-objective"><span>MISIÓN</span><p>Descartá a una persona cubriendo de 19:30 a 19:50.</p></div><button className="primary-button story-page-action" type="button" onClick={onContinue}>COMENZAR <span>→</span></button></div></section>;
}

function LevelThreeStoryDialog({kind,onContinue}:{kind:'intro'|'success';onContinue:()=>void}){
  const success=kind==='success';
  const [playing,setPlaying]=useState(false);
  return <section className={`level-three-story-dialog story-page-view ${success?'is-success':'is-intro'}`} aria-labelledby="level-three-story-title">
    <div className="level-three-story-visual">{success?<FedeArtwork src="/los-archivos-f/images/federica-nivel-3-final-loop.webp" staticSrc="/los-archivos-f/images/federica-nivel-3-final-frame-1.webp" alt="Federica escucha las señales del receptor y anota el mensaje mientras observa el faro" playing={playing} variant="level-3-success"/>:<FedeArtwork src="/los-archivos-f/images/federica-nivel-3-inicio-loop.webp" staticSrc="/los-archivos-f/images/federica-nivel-3-inicio-frame-1.webp" alt="Federica sostiene una servilleta en la cafetería frente a la tormenta y el faro" playing={playing} variant="level-3-intro"><span className="servilleta-interior-lights" aria-hidden="true"/><span className="servilleta-lighthouse-beam" aria-hidden="true"/><span className="servilleta-lighthouse-lamp" aria-hidden="true"/></FedeArtwork>}</div>
    <div className="level-three-story-copy"><p className="story-dialog-kicker">{success?'AGENCIA F · NIVEL COMPLETADO':'AGENCIA F · INICIO DEL NIVEL 3'}</p><div className="story-dialog-title-row"><h2 id="level-three-story-title">{success?'Señal resuelta.':'La tormenta dejó un mensaje.'}</h2></div><SimulatedPlayer label={success?'Mensaje final de Fede · Nivel 3':'Bienvenida de Fede · Nivel 3'} onPlaying={setPlaying}/><p>{success?unlockMessages[2].text:'Interpretá las seis señales y ordenalas para descubrir un lugar.'}</p><button className="primary-button story-page-action" type="button" onClick={onContinue}>{success?'CONTINUAR AL NIVEL 4':'COMENZAR'} <span>→</span></button></div>
  </section>;
}

function LevelFourStoryDialog({kind,onContinue}:{kind:'intro'|'success';onContinue:()=>void}){
  const [playing,setPlaying]=useState(false);const success=kind==='success';
  return <section className={`level-three-story-dialog level-four-story-dialog story-page-view ${success?'is-success':'is-intro'}`} aria-labelledby="level-four-story-title"><div className="level-three-story-visual"><FedeArtwork src={success?levelFourFinalFrames[0]:'/los-archivos-f/images/federica-nivel-4-inicio-loop.webp'} staticSrc={success?undefined:'/los-archivos-f/images/federica-nivel-4-inicio-frame-1.webp'} frames={success?levelFourFinalFrames:undefined} alt={success?'Federica señala la ruta reconstruida en el plano del faro':'Federica presenta un plano incompleto en la sala de mapas'} playing={playing} variant={success?'level-4-success':'level-4-intro'}>{success&&<><span className="story-rain" aria-hidden="true"/><span className="story-beam" aria-hidden="true"/><span className="corridor-lights" aria-hidden="true"/></>}</FedeArtwork></div><div className="level-three-story-copy"><p className="story-dialog-kicker">{success?'AGENCIA F · NIVEL COMPLETADO':'AGENCIA F · INICIO DEL NIVEL 4'}</p><div className="story-dialog-title-row"><h2 id="level-four-story-title">{success?'Ruta confirmada.':'Completá el plano.'}</h2></div><SimulatedPlayer label={success?'Mensaje final de Fede · Nivel 4':'Bienvenida de Fede · Nivel 4'} onPlaying={setPlaying}/><p>{success?unlockMessages[3].text:'Girá las seis piezas faltantes hasta que todas las conexiones coincidan.'}</p><button className="primary-button story-page-action" type="button" onClick={onContinue}>{success?'CONTINUAR AL NIVEL 5':'COMENZAR'} <span>→</span></button></div></section>;
}

const lateStories={
  5:{introTitle:'Recuperá el registro.',introText:'El corredor desemboca en un puesto de conservación. Recuperá el dato oculto del informe y seguí su movimiento en la tabla.',successTitle:'R-17 deja un rastro.',successText:unlockMessages[4].text,background:'/los-archivos-f/images/bg-hidden-corridor.png',introArtwork:'/los-archivos-f/images/federica-nivel-5-inicio-v1.png'},
  6:{introTitle:'Cinco señales.',introText:'La Sala de Banderas conserva una indicación sobre el recorrido de la luz. Descubrí el orden y traducí las cinco señales.',successTitle:'Ubicación encontrada.',successText:unlockMessages[5].text,background:'/los-archivos-f/images/nivel-6-sala-banderas-v3.png',introArtwork:'/los-archivos-f/images/nivel-6-sala-banderas-v3.png'},
  7:{introTitle:'Descubrí la clave.',introText:'La linterna superior oculta un compartimento. Seguí los recorridos IMPARES y PARES para abrirlo, pero mantené cerrado el sobre.',successTitle:'Compartimento abierto.',successText:unlockMessages[6].text,background:'/los-archivos-f/images/lens-workshop.jpg',introArtwork:'/los-archivos-f/images/lens-workshop.jpg'},
} as const;

function LateLevelStoryDialog({level,kind,onContinue}:{level:5|6|7;kind:'intro'|'success';onContinue:()=>void}){
  const [playing,setPlaying]=useState(false);const story=lateStories[level];const success=kind==='success';
  return <section className={`level-three-story-dialog late-level-story-dialog late-level-${level} story-page-view`} aria-labelledby="late-story-title">
    <div className={`late-story-visual ${level===5&&!success?'level-five-intro-artwork':''} ${level===6&&!success?'level-six-intro-artwork':''} ${level===6&&success?'level-six-final-artwork':''} ${level===7&&!success?'level-seven-intro-artwork':''} ${level===7&&success?'level-seven-final-artwork':''}`} style={{backgroundImage:level===6?'none':`linear-gradient(#03101955,#03101988),url(${level===5&&!success?story.introArtwork:story.background})`}}>{level===6&&!success?<FedeArtwork src={levelSixIntroFrames[0]} frames={levelSixIntroFrames} frameDuration={0.28} alt="Fede presenta la sala de banderas mientras la tormenta continúa tras las ventanas" playing={playing} variant="level-6-intro"/>:level===6&&success?<FedeArtwork src={levelSixFinalFrames[0]} frames={levelSixFinalFrames} frameDuration={0.28} alt="Fede concluye el caso de las banderas en la sala del faro" playing={playing} variant="level-6-success"/>:level===7&&!success?<FedeArtwork src={levelSevenIntroFrames[0]} frames={levelSevenIntroFrames} frameDuration={0.28} alt="Fede señala el tablero y presenta el último código" playing={playing} variant="level-7-intro"/>:level===7&&success?<FedeArtwork src={levelSevenFinalFrames[0]} frames={levelSevenFinalFrames} frameDuration={0.28} alt="Fede abre el compartimento secreto y celebra el hallazgo del diamante" playing={playing} variant="level-7-success"/>:level===5&&success?<FedeArtwork src="/los-archivos-f/images/federica-nivel-5-final-loop.webp" staticSrc="/los-archivos-f/images/federica-nivel-5-final-frame-1.webp" alt="Federica muestra el frasco de resina RX-4 en el taller" playing={playing} variant="level-5-final"/>:level===5?<picture className="level-five-intro-sequence"><source media="(prefers-reduced-motion: reduce)" srcSet="/los-archivos-f/images/federica-nivel-5-inicio-frame-1.webp"/><img src="/los-archivos-f/images/federica-nivel-5-inicio-loop.webp" alt="Federica presenta la entrada al pasillo oculto"/></picture>:<div className={`late-fede-character ${playing?'is-speaking':''}`}><img src="/los-archivos-f/images/federica-presentadora-v1.png" alt={`Federica presenta el ${success?'resultado':'objetivo'} del nivel ${level}`}/><span className="late-fede-mouth" aria-hidden="true"/></div>}{level===5&&!success&&<span className={`level-five-image-mouth ${playing?'talking':''}`} aria-hidden="true"/>}{level===6&&success&&<span className="story-beam" aria-hidden="true"/>}{level===7&&!success&&<div className="level-seven-board-copy" aria-label="Objetivo del mecanismo"><span>OBJETIVO</span><b>Descubrir el código de acceso al compartimento.</b><strong>Calculá <em>IMPARES</em> y <em>PARES</em> para formar la combinación.</strong></div>}<span className="story-light" aria-hidden="true"/><span className="story-dust" aria-hidden="true"/></div>
    <div className="level-three-story-copy"><p className="story-dialog-kicker">AGENCIA F · {success?'NIVEL COMPLETADO':`INICIO DEL NIVEL ${level}`}</p><div className="story-dialog-title-row"><h2 id="late-story-title">{success?story.successTitle:story.introTitle}</h2></div><SimulatedPlayer label={`${success?'Mensaje final':'Bienvenida'} de Fede · Nivel ${level}`} onPlaying={setPlaying}/><p>{success?story.successText:story.introText}</p>{(level!==7||success)&&<button className="primary-button story-page-action" type="button" onClick={onContinue}>{success?(level===7?'ABRIR EL SOBRE Y PREPARAR LA ACUSACIÓN':`CONTINUAR AL NIVEL ${level+1}`):'COMENZAR LA MISIÓN'} <span>→</span></button>}</div>
    {level===7&&!success&&<button className="primary-button story-page-action level-seven-start-action" type="button" onClick={onContinue}>COMENZAR LA MISIÓN <span>→</span></button>}
  </section>;
}

function LevelFiveMovements({busy,onComplete}:{busy:boolean;onComplete:()=>Promise<void>}){
  const [record,setRecord]=useState('');const [recordReady,setRecordReady]=useState(false);const [suspect,setSuspect]=useState('');const [feedback,setFeedback]=useState('');
  const visualSuspects=[statements[1],statements[3],statements[0],statements[2]];
  function verifyRecord(){if(!/^R[\s-]?17$/i.test(record.trim())){setFeedback('Ese registro no coincide con la señal recuperada. Volvé a observar la evidencia.');return;}setRecordReady(true);setFeedback('Registro confirmado. Ahora conectalo con una de las fichas.');}
  async function verifySuspect(){if(suspect!=='martina'){setFeedback('Esa ficha no muestra el mismo material. Volvé al panel de sospechosos y compará los objetos de trabajo.');return;}await onComplete();}
  return <section className="movement-register" aria-labelledby="movement-title"><p className="eyebrow">NIVEL 5 · REGISTRO INTERRUMPIDO</p><h2 id="movement-title">Conectá el registro.</h2>{!recordReady?<div className="movement-check"><label htmlFor="movement-record">¿Qué código recuperaste?</label><input id="movement-record" value={record} onChange={event=>setRecord(event.target.value)} placeholder="Código del registro" autoComplete="off"/><button type="button" className="unlock-button" onClick={verifyRecord}>REGISTRAR CÓDIGO</button></div>:<div className="movement-check"><b>En R-17 aparecen T-04 y Resina RX-4. ¿Qué sospechosa viste trabajando con ese material?</b><div className="movement-suspect-grid">{visualSuspects.map(person=>{const value=person.name.split(' ')[0].toLowerCase();const discarded=value==='león';return <button type="button" className={`${suspect===value?'selected':''} ${discarded?'discarded':''}`} onClick={()=>!discarded&&setSuspect(value)} disabled={discarded} aria-label={discarded?`${person.name}, descartado en el nivel anterior`:`Seleccionar a ${person.name}`} key={person.name}><span className="movement-suspect-photo"><img src={person.image} alt=""/>{discarded&&<i aria-hidden="true">DESCARTADO</i>}</span><strong>{person.name}</strong><small>{discarded?'COARTADA VERIFICADA':'SELECCIONAR EXPEDIENTE'}</small></button>})}</div><button type="button" className="unlock-button" disabled={busy||!suspect} onClick={verifySuspect}>REGISTRAR CONEXIÓN</button></div>}{feedback&&<p className="movement-feedback" role="status">{feedback}</p>}</section>;
}


function InterrogationDialog({ index, onClose }: { index: number; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [speaking,setSpeaking]=useState(false);
  const [viewerIndex,setViewerIndex]=useState<number|null>(null);
  const person = statements[index];
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  return <dialog ref={dialogRef} className="interrogation-dialog" aria-labelledby="interrogation-name" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="interrogation-layout">
      <button className="interrogation-close" onClick={onClose} autoFocus aria-label="Cerrar interrogatorio">Cerrar <span aria-hidden="true">×</span></button>
      <figure className={`interrogation-portrait portrait-alive ${speaking?'is-speaking':''}`}><div className="suspect-artwork"><img src={person.image} alt={person.name} /><span className={`suspect-mouth suspect-mouth-${index+1}`} aria-hidden="true"/><button className="suspect-magnifier" type="button" onClick={()=>{playCameraShutter();setViewerIndex(index);}} aria-label={`Ampliar fotografía de ${person.name}`}><span aria-hidden="true">⌕</span> AMPLIAR</button></div><figcaption>ARCHIVO F-01 / SUJETO 0{index + 1}</figcaption></figure>
      <div className="interrogation-content">
        <p className="eyebrow">REGISTRO DE INTERROGATORIO · 0{index + 1}</p>
        <h2 id="interrogation-name">{person.name}</h2>
        <dl className="suspect-details"><div><dt>Ocupación</dt><dd>{person.role}</dd></div><div><dt>Ubicación declarada</dt><dd>{person.location}</dd></div></dl>
        <section className="statement-text"><h3>Declaración</h3><blockquote>“{person.text}”</blockquote></section>
        <section className="statement-simulation"><h3>Declaración registrada</h3><SimulatedPlayer label={`Declaración de ${person.name}`} onPlaying={setSpeaking}/></section>
        <p className="interrogation-instruction">Una declaración orienta la investigación, pero los registros deciden qué puede demostrarse.</p>
      </div>
    </div>
    {viewerIndex!==null&&<SuspectImageViewer initialIndex={viewerIndex} onClose={()=>setViewerIndex(null)}/>}
  </dialog>;
}

function SuspectImageViewer({initialIndex,onClose}:{initialIndex:number;onClose:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);
  const [index,setIndex]=useState(initialIndex);
  const [lens,setLens]=useState<{x:number;y:number}|null>(null);
  const person=statements[index];
  useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{if(event.key==='ArrowLeft')setIndex(value=>(value+statements.length-1)%statements.length);if(event.key==='ArrowRight')setIndex(value=>(value+1)%statements.length);};
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[]);
  return <dialog ref={ref} className="suspect-image-viewer" aria-label={`Fotografía ampliada de ${person.name}`} onCancel={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div className="suspect-viewer-shell">
      <button className="suspect-viewer-close" type="button" onClick={onClose} aria-label="Cerrar fotografía ampliada">×</button>
      <button className="suspect-viewer-arrow previous" type="button" onClick={()=>{playPageTurn();setIndex(value=>(value+statements.length-1)%statements.length);}} aria-label="Sospechoso anterior">‹</button>
      <figure><div className="suspect-lens-stage" onPointerMove={event=>{const box=event.currentTarget.getBoundingClientRect();setLens({x:Math.max(0,Math.min(100,(event.clientX-box.left)/box.width*100)),y:Math.max(0,Math.min(100,(event.clientY-box.top)/box.height*100))});}} onPointerLeave={()=>setLens(null)}><img src={person.image} alt={`${person.name}, fotografía completa`}/>{lens&&<span className="suspect-detail-lens" aria-hidden="true" style={{left:`${lens.x}%`,top:`${lens.y}%`,backgroundImage:`url(${person.image})`,backgroundPosition:`${lens.x}% ${lens.y}%`}}/>}</div><figcaption><small>FOTOGRAFÍA DE EVIDENCIA · {index+1}/{statements.length}</small><b>{person.name}</b></figcaption></figure>
      <button className="suspect-viewer-arrow next" type="button" onClick={()=>{playPageTurn();setIndex(value=>(value+1)%statements.length);}} aria-label="Siguiente sospechoso">›</button>
    </div>
  </dialog>;
}

const evidenceRewards=[
 {type:'IMPRESIÓN DE TERMINAL',title:'CORTE · 19:37',meaning:'La hora real del apagón fija el intervalo crítico de la investigación.'},
 {type:'FICHA DE COARTADA',title:'LEÓN · DESCARTADO',meaning:'Sus registros cubren todo el intervalo, sin dejar huecos.'},
 {type:'REGISTRO DE RADIO',title:'DESTINO · TALLER',meaning:'Las seis señales reconstruidas indican el Taller de Mantenimiento.'},
 {type:'FRAGMENTO DE PLANO',title:'RUTA · 9 → 3 → 7',meaning:'El recorrido conduce a un sector ausente del plano público.'},
 {type:'FICHA DE LABORATORIO',title:'REGISTRO · R-17',meaning:'La Resina RX-4 conecta el movimiento con Martina y la Sala de Banderas.'},
 {type:'TARJETA DE SEÑALES',title:'UBICACIÓN · FAROL',meaning:'Las banderas no forman una contraseña: señalan la linterna superior.'},
 {type:'FOTOGRAFÍA DEL MECANISMO',title:'COMPARTIMENTO · ABIERTO',meaning:'La cerradura cede y autoriza la apertura del sobre dirigido al agente.'},
];
const achievementNames=['OJO DE FARO','COARTADA PERFECTA','RADIOOPERADOR','CARTÓGRAFO','RASTREADOR','SEÑALERO','MENTE MECÁNICA'];
function LevelClearOverlay({level,achievement,onClose}:{level:number;achievement?:string;onClose:()=>void}){
 const evidence=evidenceRewards[level-1];
 useEffect(()=>{const evidenceTimer=window.setTimeout(playEvidenceSlide,360);const achievementTimer=achievement?window.setTimeout(playAchievement,1050):0;return()=>{window.clearTimeout(evidenceTimer);if(achievementTimer)window.clearTimeout(achievementTimer);};},[achievement]);
 const viewBoard=()=>{onClose();window.dispatchEvent(new Event('archivos-f-open-mission'));};
 return <div className="level-clear-overlay" role="dialog" aria-modal="true" aria-label={`Evidencia ${level} verificada`}><div className="level-clear-flash"/><section className={`evidence-unlock-drawer evidence-unlock-${level}`}><div className="evidence-stamp-stage"><img className="level-clear-stamp-image" src="/los-archivos-f/images/stamp-evidence-confirmed-v1.png" alt="Agencia F · Evidencia verificada"/></div><div className="level-clear-evidence"><i aria-hidden="true">◆</i><span>{evidence.type}</span><b>{evidence.title}</b><p>{evidence.meaning}</p><small>EVIDENCIA {level}/7 · incorporada al tablero</small>{achievement&&<small>LOGRO OBTENIDO · {achievement}</small>}</div><div className="evidence-unlock-actions"><button className="reading-choice" type="button" onClick={viewBoard}>VER EN EL TABLERO</button><button className="primary-button" type="button" onClick={onClose}>CONTINUAR <span>→</span></button></div></section></div>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('home');
  const [showAccess, setShowAccess] = useState(false);
  const [code, setCode] = useState('');
  const [agent, setAgent] = useState('');
  const [level, setLevel] = useState(0);
  const [highestLevel, setHighestLevel] = useState(0);
  const [busy, setBusy] = useState(false);
  const [activeSession, setActiveSession] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [elapsedSeconds,setElapsedSeconds]=useState(0);
  const elapsedRef=useRef(0);
  const [saveStatus, setSaveStatus] = useState('');
  const legacyRef = useRef<(Partial<GameState> & { code?: string }) | null>(null);
  const unlocked = level >= 1 && level <= 7 && highestLevel > level;
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [hints, setHints] = useState<Record<number, number>>({});
  const [selectedStatement, setSelectedStatement] = useState<number | null>(null);
  const [finalAnswers, setFinalAnswers] = useState({ who: '', how: '', where: '' });
  const [musicOn, setMusicOn] = useState(true);
  const [effectsOn,setEffectsOn]=useState(true);
  const musicEnabled = useRef(true);
  const [stormFlash,setStormFlash]=useState({key:0,side:'right' as 'left'|'right',intensity:.7});
  const [checkProgress, setCheckProgress] = useState<Record<number, number>>({});
  const [checkSelection, setCheckSelection] = useState<number | null>(null);
  const [checkFeedback, setCheckFeedback] = useState('');
  const [checkPassed, setCheckPassed] = useState(false);
  const [levelThreeReady, setLevelThreeReady] = useState(false);
  const [levelTwoIntro,setLevelTwoIntro]=useState(()=>import.meta.env.DEV&&new URLSearchParams(window.location.search).get('preview')==='level2');
  const [levelTwoSuccess,setLevelTwoSuccess]=useState(()=>import.meta.env.DEV&&new URLSearchParams(window.location.search).get('preview')==='level2-unlock');
  const [levelThreeDialog,setLevelThreeDialog]=useState<'intro'|'success'|null>(()=>{if(!import.meta.env.DEV)return null;const preview=new URLSearchParams(window.location.search).get('preview');return preview==='level3'?'intro':preview==='level3-done'?'success':null;});
  const [levelFourDialog,setLevelFourDialog]=useState<'intro'|'success'|null>(()=>{if(!import.meta.env.DEV)return null;const preview=new URLSearchParams(window.location.search).get('preview');return preview==='level4'?'intro':preview==='level4-done'?'success':null;});
  const [lateLevelDialog,setLateLevelDialog]=useState<{level:5|6|7;kind:'intro'|'success'}|null>(()=>{if(!import.meta.env.DEV)return null;const preview=new URLSearchParams(window.location.search).get('preview')||'';const match=preview.match(/^level([567])(-done)?$/);return match?{level:Number(match[1]) as 5|6|7,kind:match[2]?'success':'intro'}:null;});
  const [levelClear,setLevelClear]=useState<number|null>(()=>{if(!import.meta.env.DEV)return null;const match=new URLSearchParams(window.location.search).get('preview')?.match(/^level([1-7])-reward$/);return match?Number(match[1]):null;});
  const [gameFeedback,setGameFeedback]=useState<'success'|'error'|''>('');
  const [achievement,setAchievement]=useState('');
  const [ambientEvent,setAmbientEvent]=useState<'beam'|'shadow'|'radio'|'ruby'|''>('');
  const [marks,setMarks]=useState<number[]>(()=>{try{return JSON.parse(localStorage.getItem('archivos-f-secret-marks')||'[]') as number[];}catch{return [];}});

  function unlockAchievement(name:string,show=true,withSound=true){
    try{const current=JSON.parse(localStorage.getItem('archivos-f-achievements')||'[]') as string[];if(!current.includes(name))localStorage.setItem('archivos-f-achievements',JSON.stringify([...current,name]));}catch{/* Decorative progress must not interrupt the case. */}
    if(show){if(withSound)playAchievement();setAchievement(name);window.setTimeout(()=>setAchievement(''),9500);}
  }

  function receiveState(state: GameState) {
    const elapsed=Math.max(elapsedRef.current,Math.floor(Number(state.elapsedSeconds)||0));elapsedRef.current=elapsed;
    setAgent(state.agent); setHighestLevel(state.highestLevel); setHints(state.hints); setCheckProgress(state.checkProgress); setCompletedAt(state.completedAt); setElapsedSeconds(elapsed); setActiveSession(true);
  }

  useEffect(()=>{
    if(!activeSession||highestLevel<1||completedAt||screen!=='game')return;
    const timer=window.setInterval(()=>{if(document.visibilityState!=='visible')return;elapsedRef.current+=1;setElapsedSeconds(elapsedRef.current);},1000);
    const persist=()=>{void fetch('/los-archivos-f/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'timer',elapsedSeconds:elapsedRef.current})});};
    const saver=window.setInterval(persist,30000);
    const visibility=()=>{if(document.visibilityState==='hidden')persist();};
    document.addEventListener('visibilitychange',visibility);
    return()=>{clearInterval(timer);clearInterval(saver);document.removeEventListener('visibilitychange',visibility);persist();};
  },[activeSession,highestLevel,completedAt,screen]);

  useEffect(() => {
    const localPreview = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('preview') : null;
    if (localPreview) {
      const previewLevel=Number(localPreview.match(/^level([1-7])/)?.[1]||2);const previewDone=localPreview.endsWith('-done')&&localPreview!=='level4-plan-done';
      setAgent('Filo'); setActiveSession(true); setHighestLevel(localPreview === 'briefing' ? 0 : previewLevel+(previewDone?1:0));
      if(localPreview==='level4-plan-done')setCheckProgress({4:1});
      if (localPreview === 'library') setScreen('library');
      else if (localPreview === 'briefing') setScreen('briefing');
      else { setScreen('game'); setLevel(previewLevel); }
      return;
    }
    const queryCode = new URLSearchParams(window.location.search).get('codigo');
    try {
      const legacy = JSON.parse(localStorage.getItem('archivos-f-demo') || 'null');
      if (legacy) {
        legacyRef.current = {...legacy, highestLevel: legacy.highestLevel ?? legacy.level ?? 0};
        if (!queryCode) { setAgent(legacy.agent || ''); setCode(legacy.code || ''); }
      }
    } catch { /* A new family session does not require local storage. */ }
    if (queryCode) { setCode(queryCode.toUpperCase()); history.replaceState(null, '', window.location.pathname); return; }
    setBusy(true);
    fetch('/los-archivos-f/api/game').then(async response => {
      if (response.ok) { const state = await response.json() as GameState; receiveState(state); setLevel(state.highestLevel); setSaveStatus('Partida recuperada'); }
      else if (response.status !== 401) setSaveStatus('No pudimos recuperar la partida. Volvé a ingresar con tu código.');
    }).catch(() => setSaveStatus('No hay conexión. Volvé a ingresar cuando se restablezca.')).finally(() => setBusy(false));
  }, []);

  async function gameAction(body: Record<string, unknown>) {
    setBusy(true); setMessage(''); setSaveStatus('Guardando…');
    try {
      const response = await fetch('/los-archivos-f/api/game', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data = await response.json() as GameState & {error?:string;code?:string};
      if (!response.ok) throw new Error(data.error || 'No pudimos guardar. Volvé a intentar.');
      if(body.action==='unlock') playLevelComplete(Number(body.level));
      else if(body.action==='final') playEffect('unlock');
      if(body.action==='unlock'){
        const solved=Number(body.level);setLevelClear(solved);setGameFeedback('success');
        window.setTimeout(()=>setGameFeedback(''),900);
        const award=achievementNames[solved-1];
        if(award&&(hints[solved]||0)===0)unlockAchievement(award,false);
      }
      if(body.action==='final'){
        unlockAchievement('EQUIPO IMPARABLE');
        if(Object.values(hints).reduce((sum,value)=>sum+value,0)<=2)unlockAchievement('SIN DEJAR HUELLAS',false);
      }
      receiveState(data); setSaveStatus('Progreso guardado'); return data as GameState;
    } catch(error) {
      const text = error instanceof Error ? error.message : 'No hay conexión. Volvé a intentar.';
      setMessage(text); setSaveStatus('No se guardó el último cambio. Volvé a intentar.');
      if((error as {code?:string})?.code==='WRONG_ANSWER'||text.includes('no abre')||text.includes('no recuperamos')){playEffect('error');setGameFeedback('error');window.setTimeout(()=>setGameFeedback(''),700);}
      return null;
    } finally { setBusy(false); }
  }

  useEffect(() => {
    const syncVolume = () => {
      const speaking = Array.from(document.querySelectorAll('audio')).some(audio => !audio.paused && !audio.ended);
      setStormDucked(speaking);
    };
    const start = () => {
      if (!musicEnabled.current) return;
      startStormAmbience();
      syncVolume();
    };
    const gesture = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('.music-button')) return;
      start();
    };
    document.addEventListener('pointerdown', gesture, true);
    document.addEventListener('keydown', gesture, true);
    for (const type of ['play', 'pause', 'ended', 'emptied']) document.addEventListener(type, syncVolume, true);
    const observer = new MutationObserver(syncVolume);
    observer.observe(document.body, {childList:true,subtree:true});
    const thunder=(event:Event)=>{const detail=(event as CustomEvent<{side?:'left'|'right';intensity?:number}>).detail;setStormFlash(value=>({key:value.key+1,side:detail?.side||'right',intensity:detail?.intensity||.7}));};
    window.addEventListener('archivos-f-thunder',thunder);
    start();
    return () => {
      document.removeEventListener('pointerdown', gesture, true);
      document.removeEventListener('keydown', gesture, true);
      for (const type of ['play', 'pause', 'ended', 'emptied']) document.removeEventListener(type, syncVolume, true);
      observer.disconnect();
      window.removeEventListener('archivos-f-thunder',thunder);
      stopStormAmbience();
    };
  }, []);

  useEffect(()=>{
    if(screen!=='game')return;
    let timer=0;
    const schedule=()=>{timer=window.setTimeout(()=>{const options=['beam','shadow','radio','ruby'] as const;const next=options[Math.floor(Math.random()*options.length)];setAmbientEvent(next);if(next==='radio')playEffect('signal');window.setTimeout(()=>setAmbientEvent(''),2200);schedule();},18000+Math.random()*30000);};
    schedule();return()=>window.clearTimeout(timer);
  },[screen]);

  useEffect(()=>{
    const click=(event:MouseEvent)=>{const button=event.target instanceof Element?event.target.closest('button'):null;if(button&&!button.hasAttribute('disabled'))playButtonClick();};
    document.addEventListener('click',click,true);return()=>document.removeEventListener('click',click,true);
  },[]);

  function collectMark(){
    if(level<1||level>7||marks.includes(level))return;
    const next=[...marks,level].sort();setMarks(next);localStorage.setItem('archivos-f-secret-marks',JSON.stringify(next));playSecretCollect();unlockAchievement(next.length===7?'GUARDIÁN DE LAS SIETE LUCES':`MARCA SECRETA ${next.length}/7`,true,false);
  }

  function visitLevel(destination: number) {
    if (destination < 0 || destination > highestLevel) return;
    setLevel(destination); setAnswer(''); setMessage(''); setCheckSelection(null); setCheckFeedback(''); setCheckPassed(false); setSelectedStatement(null); setLevelThreeReady(false);
    setLevelTwoSuccess(false);
    const firstVisit=destination===highestLevel;
    setLevelThreeDialog(firstVisit&&destination===3?'intro':null);
    setLevelFourDialog(firstVisit&&destination===4?'intro':null);
    setLateLevelDialog(firstVisit&&destination>=5&&destination<=7?{level:destination as 5|6|7,kind:'intro'}:null);
    setLevelTwoIntro(firstVisit&&destination===2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const hintsUsed = useMemo(() => Object.values(hints).reduce((a, b) => a + b, 0), [hints]);

  function leaveGame(destination: Exclude<Screen, 'game'>) {
    setLevelTwoIntro(false); setLevelTwoSuccess(false); setLevelThreeDialog(null); setLevelFourDialog(null); setLateLevelDialog(null); setSelectedStatement(null);
    setScreen(destination);
    window.scrollTo(0, 0);
  }

  async function access(event: FormEvent) {
    event.preventDefault();
    if (!agent.trim()) { setMessage('Escribí tu nombre o alias de agente.'); return; }
    const state = await gameAction({action:'activate',code,agent,legacy:legacyRef.current?.code === code ? legacyRef.current : undefined});
    if (!state) return;
    setLevel(state.highestLevel); setAnswer(''); setShowAccess(false); leaveGame('library');
    setCheckSelection(null); setCheckPassed(false); setCheckFeedback(''); setFinalAnswers({who:'',how:'',where:''});
  }

  async function startInvestigation() {
    if (await gameAction({action:'start'})) setLevel(1);
  }

  function openCaseFile() {
    if(highestLevel===0){leaveGame('briefing');}
    else{
      const destination=Math.max(1,level);
      setLevel(destination);setLevelTwoIntro(false);setLevelTwoSuccess(false);setLevelThreeDialog(null);setLevelFourDialog(null);setLateLevelDialog(null);setScreen('game');
    }
    window.scrollTo(0,0);
  }

  async function submitLevel(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!answer.trim()) { setMessage('Elegí una respuesta antes de verificar.'); return; }
    if (await gameAction({action:'unlock',level,answer})) { setMessage(`Nivel completado: ${levels[level-1].unlock}.`); setAnswer(''); if(level===2){playPenMark();setLevelTwoSuccess(true);}if(level===3)setLevelThreeDialog('success');if(level===4)setLevelFourDialog('success');if(level>=5&&level<=7)setLateLevelDialog({level:level as 5|6|7,kind:'success'}); }
  }

  function continueInvestigation() {
    playLevelTransition();
    visitLevel(level + 1);
  }

  function replayLevelIntro() {
    if(level===2)setLevelTwoIntro(true);
    else if(level===3)setLevelThreeDialog('intro');
    else if(level===4)setLevelFourDialog('intro');
    else if(level>=5&&level<=7)setLateLevelDialog({level:level as 5|6|7,kind:'intro'});
  }

  function verifyMicroCheck(correct: number) {
    if (checkSelection === null) { setCheckFeedback('Elegí una opción antes de verificar.'); return; }
    if (checkSelection !== correct) { setCheckFeedback('Esa comprobación no coincide con las pruebas. Revisá el material y probá otra opción.'); setCheckPassed(false); return; }
    setCheckFeedback('Comprobación correcta.'); setCheckPassed(true);
  }

  async function continueMicroCheck() {
    if (!await gameAction({action:'deduction',level,index:checkProgress[level]||0,selection:checkSelection})) return;
    setCheckSelection(null); setCheckFeedback(''); setCheckPassed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function requestHint(direct=false) { const revealed=Boolean(await gameAction({action:'hint',level,direct}));if(revealed)playHintReveal();return revealed; }

  async function submitFinal(event: FormEvent) {
    event.preventDefault();
    if (await gameAction({action:'final',...finalAnswers})) setLevel(9);
  }

  async function toggleMusic() {
    const enabled = !musicEnabled.current;
    musicEnabled.current = enabled;
    setMusicOn(enabled);
    if (!enabled) { stopStormAmbience(); return; }
    startStormAmbience();
  }

  const showLevelTwoSuccess=screen==='game'&&level===2&&levelTwoSuccess;
  const showLevelTwoIntro=screen==='game'&&level===2&&levelTwoIntro&&!showLevelTwoSuccess;
  const showLevelThreeDialog=screen==='game'&&level===3&&Boolean(levelThreeDialog);
  const showLevelFourDialog=screen==='game'&&level===4&&Boolean(levelFourDialog);
  const showLateLevelDialog=screen==='game'&&lateLevelDialog?.level===level;
  const storyPageOpen=showLevelTwoIntro||showLevelTwoSuccess||showLevelThreeDialog||showLevelFourDialog||showLateLevelDialog;

  return (
    <main className={`site-shell ${storyPageOpen?'story-page-active':''} game-feedback-${gameFeedback}`} aria-busy={busy}><span key={stormFlash.key} className={`storm-flash storm-flash-${stormFlash.side} ${stormFlash.key?'is-active':''}`} style={{'--storm-intensity':stormFlash.intensity} as React.CSSProperties} aria-hidden="true"/><span className={`ambient-event ambient-${ambientEvent}`} aria-hidden="true"/><fieldset className="app-controls" disabled={busy}>
      <nav className="topbar" aria-label="Navegación principal">
        <div className="header-identity">
          <button className="brand brand-button" onClick={() => leaveGame('home')} aria-label="Ir al inicio"><img className="brand-logo" src="/los-archivos-f/images/logo-ranking-archivos-f.png" alt="Los Archivos F"/></button>
        </div>
        <div className="nav-tools">{(screen==='home'||screen==='library')&&<div className="nav-celebration">10 OCT · FEDE · 11 AÑOS</div>}<div className="audio-controls"><button className={`music-button sfx-button ${effectsOn?'on':''}`} onClick={()=>{const next=!effectsOn;setEffectsOn(next);setEffectsEnabled(next);if(next)playEffect('panel');}} aria-pressed={effectsOn} aria-label={effectsOn?'Desactivar efectos de sonido':'Activar efectos de sonido'} title={effectsOn?'Efectos encendidos':'Activar efectos'}>SFX</button><button className={`music-button music-icon-only ${musicOn ? 'on' : ''}`} onClick={toggleMusic} aria-pressed={musicOn} aria-label={musicOn?'Desactivar lluvia y truenos':'Activar lluvia y truenos'} title={musicOn?'Lluvia y truenos encendidos':'Activar lluvia y truenos'}>{musicOn ? '🌧' : '☁'}</button></div></div>
      </nav>

      {screen === 'home' && <section className="welcome-page">
        <div className="welcome-heading"><p className="eyebrow">AGENCIA F · ACCESO CONFIDENCIAL</p><h1 className="welcome-title">Bienvenido a Los Archivos F</h1><img className="welcome-logo" src="/los-archivos-f/images/logo-archivos-f.png" alt="Los Archivos F · Escape room digital"/><p>Una misión especial por los <strong>11 años de Fede.</strong></p><span className="welcome-seal">TU AVENTURA COMIENZA ACÁ</span></div>
        <form className="access-card welcome-access" onSubmit={access}><p className="eyebrow dark">IDENTIFICATE, AGENTE</p><h2>¿Listo para el misterio?</h2><p><Typewriter text="Ingresá tu nombre y el código de acceso de tu carpeta."/></p><label htmlFor="welcome-name">Tu nombre o alias</label><input id="welcome-name" value={agent} onChange={e=>setAgent(e.target.value)} placeholder="¿Cómo te llamás, agente?" required maxLength={48} autoComplete="nickname"/><label htmlFor="welcome-code">Código de acceso</label><input id="welcome-code" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="F01-XXXX-XXXX-XXXX-XXXX" required autoComplete="off" autoCapitalize="characters" spellCheck={false}/>{message && <p className="form-error" role="alert">{message}</p>}<button className="primary-button full" type="submit">ENTRAR A LA CÁMARA DE EXPEDIENTES <span>→</span></button><small>Encontrá tu código debajo del QR. No necesitás una cuenta. Podés usar un alias y volver con el mismo código para recuperar tu partida.</small>{activeSession && <button type="button" className="resume-welcome" onClick={()=>leaveGame('library')}>Continuar con mi partida guardada →</button>}</form>
      </section>}

      {screen === 'briefing' && <Briefing agent={agent} alreadyAccepted={highestLevel>0} onComplete={async()=>{if(highestLevel===0)await startInvestigation();setScreen('game');window.scrollTo(0,0);}}/>}

      {screen === 'library' && <section className="library-page">
        <div className="library-intro"><div className="page-heading"><p className="eyebrow dark">BIENVENIDO, AGENTE {agent.toUpperCase()}</p><h1>La cámara de los expedientes</h1><p><Typewriter text="Tu caso está listo. El avance queda guardado con tu código."/></p></div>
        <button className="primary-button library-open-case" onClick={openCaseFile}>ABRIR EXPEDIENTE <span>→</span></button><button className="switch-code" onClick={() => {setCode(''); setMessage(''); setShowAccess(true);}}>Ingresar otro código</button></div><div className="case-grid">
          <article className="case-card active"><div className="case-visual case-visual-link" role="button" tabIndex={0} aria-label="Abrir expediente El robo del Rubí del Faro" onClick={openCaseFile} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openCaseFile();}}}><img src="/los-archivos-f/images/hero-archivos-f.png" alt="El rubí rojo sobre un mapa y el faro iluminado junto al mar" /><i className="case-lighthouse-beam" aria-hidden="true"/><span>F-01</span></div><div className="case-copy"><small>CASO DISPONIBLE · DIFICULTAD MEDIA</small><h2>El robo del Rubí del Faro</h2><p>Un rubí robado, cuatro sospechosos y un apagón que investigar.</p><ul><li>7 niveles</li><li>16 desafíos</li><li>60–90 min</li><li>Físico + digital</li></ul><button className="primary-button" onClick={openCaseFile}>ABRIR EXPEDIENTE <span>→</span></button></div></article>
        </div>
      </section>}

      {screen === 'game' && !storyPageOpen && <section className="game-page">
        <MissionMap level={level} highestLevel={highestLevel} hintsUsed={hintsUsed} elapsedSeconds={elapsedSeconds} hintPanel={level >= 1 && level <= 7 ? <HintLenses key={level} hints={levels[level-1].hints} used={hints[level] || 0} busy={busy} canRequest={!unlocked} onRequest={()=>requestHint(false)} onRequestSolution={()=>requestHint(true)}/> : <p className="no-stage-hints">Entrá a un nivel de la investigación para consultar sus pistas.</p>} saveStatus={saveStatus} visitLevel={visitLevel} onMission={()=>leaveGame('briefing')} onLibrary={()=>leaveGame('library')}/>

        <div className="investigation-panel">
          {level>=1&&level<=7&&!marks.includes(level)&&<button type="button" className={`secret-lighthouse secret-lighthouse-${level}`} onClick={collectMark} aria-label="Descubrir marca secreta del faro"><span>♜</span></button>}
          {level !== 1 && level !== 2 && level <= 7 && <figure className={`scene-frame ${level === 3?'level-three-weather':level === 4?'level-four-maps':level===5?'level-five-red-corridor':level===6?'level-six-flags':level === 0 ? 'storm-layer' : level === 7 ? 'beam-layer' : 'lamp-layer'}`}><img className={level===3?'storm-frame storm-frame-0':undefined} src={level === 0 ? '/los-archivos-f/images/control-room.jpg' : level===3 ? levelVisuals[2] : level===4&&!unlocked ? '/los-archivos-f/images/nivel-4-sala-planos-v1.png' : level===5&&!unlocked?'/los-archivos-f/images/bg-hidden-corridor.png':level===6&&!unlocked?'/los-archivos-f/images/nivel-6-sala-banderas-v3.png':unlocked ? successVisuals[level - 1] : levelVisuals[level - 1]} alt={level===4?'Sala de cartografía del museo con un plano incompleto sobre la mesa':level===5?'Corredor de mantenimiento iluminado por señales rojas':level===6?'Sala del faro con cinco banderas numeradas a distintas alturas y el cartel Seguí la luz':'Escena del Museo del Faro vinculada con la investigación'} />{level===3&&['nivel-3-tormenta-2.png','nivel-3-tormenta-3.png','nivel-3-tormenta-4.png'].map((frame,index)=><img className={`storm-frame storm-frame-${index+1}`} src={`/los-archivos-f/images/${frame}`} alt="" aria-hidden="true" key={frame}/>)}{level===3&&<i className="scene-lightning-flash" aria-hidden="true"/>}{level===3&&<i className="scene-lighthouse-beam" aria-hidden="true"/>}<span>{unlocked ? 'EVIDENCIA VISUAL DESBLOQUEADA' : 'REGISTRO VISUAL · ARCHIVO F-01'}</span></figure>}
          
          {level === 0 && <section className="mission-intro"><p className="eyebrow dark">ARCHIVO F-01 · MISIÓN ACEPTADA</p><h1>El robo del Rubí del Faro</h1><p><Typewriter text="Robaron el Rubí del Faro durante el apagón y dejaron una copia. Cuatro personas quedaron bajo sospecha."/></p><p>Mantené cerrado el sobre dirigido al agente hasta que Fede lo indique.</p><button className="primary-button" onClick={startInvestigation}>COMENZAR NIVEL 1 <span>→</span></button><button className="reading-choice" onClick={()=>leaveGame('briefing')}>Volver a escuchar a Federica</button></section>}

          {level === 1 && <TerminalLevel unlocked={unlocked} busy={busy} message={message} onUnlock={async value=>Boolean(await gameAction({action:"unlock",level:1,answer:value}))} onContinue={continueInvestigation}/>}
          {level >= 2 && level <= 7 && (() => {
            const current = levels[level - 1];
            const checkIndex = unlocked ? microChecks[level - 1].length : checkProgress[level] || 0;
            const currentCheck = level===7 ? undefined : microChecks[level - 1][checkIndex];
            const completedChecks = microChecks[level - 1].length;
            const canUnlock=!unlocked&&level!==5&&!currentCheck&&(level!==3||levelThreeReady);
            return <><section className={`level-card level-card-${level}`}>
              <p className="eyebrow dark">{current.kicker}</p><h1>{current.title}</h1>
              <div className="level-objective"><span>OBJETIVO</span><p>{level===2?'Descartá a una persona cubriendo todo el intervalo crítico.':level===3?'Ordená las seis señales y descubrí el lugar indicado.':level===4?'Completá el plano con las seis piezas faltantes y seguí la ruta desde INICIO.':level===5?'Registrá R-17 y conectalo con la persona asociada al material.':level===6?'Orientá los círculos y traducí las cinco banderas.':'Calculá IMPARES y PARES para formar la combinación.'}</p></div>
              {level === 2 && <figure className="level-two-group-scene"><img src="/los-archivos-f/images/suspects-group.jpg" alt="Los cuatro sospechosos reunidos en la sala de entrevistas"/><figcaption>{unlocked?'COARTADA VERIFICADA · REGISTRO CONSERVADO':'REGISTRO DE ENTREVISTAS · CUATRO PERSONAS PRESENTES'}</figcaption></figure>}
              {level === 6 && !unlocked && <aside className="level-six-physical-prompt" aria-label="Orientación para usar los materiales impresos"><span>MATERIAL IMPRESO</span><h2>Los dos círculos no son decorativos.</h2><p>Buscá el instrumento de señales y la etiqueta que recibiste. Examiná ambos lados, orientá los círculos y después observá las banderas.</p></aside>}
              {level===7&&!unlocked&&<MechanicalCodeBuilder onCode={setAnswer}/>}
              {level===3&&<div className="digital-brief compact-signal-brief"><LightSignal onSolved={setLevelThreeReady}/></div>}
              {level === 2 && <section className="suspect-board" aria-label="Panel de sospechosos"><div className="suspect-board-heading"><h2>Cuatro versiones.</h2><p>Abrí cada ficha y compará su declaración.</p></div><div className="suspect-grid">{statements.map((person, index) => <button className="suspect-file" key={person.name} onClick={() => {playDossierOpen();setSelectedStatement(index);}} aria-label={`Abrir ficha de ${person.name}`}><div className="suspect-file-photo"><img src={person.image} alt="" /></div><div className="suspect-file-caption"><span>{person.role}</span><h3>{person.name}</h3><p>Abrir declaración <span aria-hidden="true">↗</span></p></div></button>)}</div></section>}
              {level === 4 && !unlocked && <LevelFourPlan solved={checkIndex>0} busy={busy} onSolved={async()=>{if(!await gameAction({action:'deduction',level:4,index:0,selection:2}))return;setCheckSelection(null);setCheckFeedback('');setCheckPassed(false);if(await gameAction({action:'unlock',level:4,answer:'937'}))setLevelFourDialog('success');}}/>}
              {level === 5 && !unlocked && <LevelFiveMovements busy={busy} onComplete={async()=>{if(!await gameAction({action:'deduction',level:5,index:0,selection:1}))return;if(await gameAction({action:'unlock',level:5,answer:'banderas'})){setLateLevelDialog({level:5,kind:'success'});}}}/>}

              {!unlocked&&canUnlock&&level!==5&&<form className="inline-unlock" onSubmit={submitLevel}><label htmlFor={`level-answer-${level}`}><span>RESPUESTA DEL NIVEL</span>{current.prompt}</label><div><input id={`level-answer-${level}`} value={answer} onChange={event=>setAnswer(event.target.value)} placeholder={current.placeholder} autoComplete="off"/><button className="unlock-button" type="submit" disabled={busy||!answer.trim()}>{busy?'VERIFICANDO…':level===7?'PROBAR COMBINACIÓN':'VERIFICAR RESPUESTA'}</button></div></form>}

              {!unlocked && currentCheck && level!==5 && !(level===4&&checkIndex===0) && <div className="micro-challenge"><p className="eyebrow dark">COMPROBACIÓN {checkIndex + 1} DE {completedChecks}</p><h2><Typewriter text={currentCheck.question}/></h2><div className="micro-options">{currentCheck.options.map((option, index) => <button key={option} className={checkSelection === index ? 'selected' : ''} onClick={() => { if (!checkPassed) { setCheckSelection(index); setCheckFeedback(''); } }}>{option}</button>)}</div>{checkFeedback && <p className={checkPassed ? 'micro-success' : 'micro-error'}>{checkPassed ? currentCheck.success : checkFeedback}</p>}{checkPassed ? <button className="primary-button" onClick={continueMicroCheck}>REGISTRAR COMPROBACIÓN <span>→</span></button> : <button className="unlock-button" onClick={() => verifyMicroCheck(currentCheck.correct)}>VERIFICAR</button>}</div>}
              {message && level!==3 && level!==4 && <p className={message.startsWith('Nivel completado') ? 'success-message' : 'error-message'}>{message}</p>}
              {unlocked && level >=5 && level<=7 && <div className="unlock-reveal compact"><div className="unlock-icon">✓</div><p className="eyebrow dark">MENSAJE DE FEDE DISPONIBLE</p><h2>{current.unlock}</h2><button className="primary-button" onClick={()=>setLateLevelDialog({level:level as 5|6|7,kind:'success'})}>VER MENSAJE DE FEDE <span>→</span></button></div>}
            </section><LevelSideTabs level={level} prompt={current.prompt} placeholder={current.placeholder} answer={answer} busy={busy} unlocked={unlocked} canUnlock={canUnlock} message={message} missionMessageOpen={level===2?levelTwoIntro||levelTwoSuccess:level===3?Boolean(levelThreeDialog):level===4?Boolean(levelFourDialog):Boolean(lateLevelDialog)} onAnswer={setAnswer} onReplay={replayLevelIntro} onUnlock={submitLevel}/></>;
          })()}

          {level === 8 && <><section className="level-card final-card"><p className="eyebrow dark">ACUSACIÓN FINAL</p><h1>Presentá tu acusación.</h1><p className="final-instruction">Completá las tres tarjetas del expediente. La acusación debe explicar quién actuó, cómo lo hizo y dónde terminó la gema original.</p><FinalStatement highestLevel={highestLevel}/><form className="final-form accusation-builder" onSubmit={submitFinal}><label><span>01 · RESPONSABLE</span>¿Quién retiró el rubí?<select required value={finalAnswers.who} onChange={(e) => setFinalAnswers({...finalAnswers,who:e.target.value})}><option value="">Elegí una persona</option><option value="bruno">Bruno Vidal</option><option value="vera">Vera Salas</option><option value="leon">León Costa</option><option value="martina">Martina Ríos</option></select></label><label><span>02 · MÉTODO</span>¿Cómo realizó el cambio?<select required value={finalAnswers.how} onChange={(e) => setFinalAnswers({...finalAnswers,how:e.target.value})}><option value="">Elegí una reconstrucción</option><option value="cafeteria">Alteró el registro y trasladó la gema durante la restauración</option><option value="corredor">Usó el apagón, atravesó el corredor y dejó una réplica</option><option value="terraza">Manipuló los horarios de las fotografías y salió por la terraza</option></select></label><label><span>03 · ESCONDITE</span>¿Dónde escondió el original?<select required value={finalAnswers.where} onChange={(e) => setFinalAnswers({...finalAnswers,where:e.target.value})}><option value="">Elegí un lugar</option><option value="bolso">Dentro de un lote de materiales del taller</option><option value="generador">En el conducto junto a la sala del generador</option><option value="lente">En la base de la lente de Fresnel</option></select></label><div className="accusation-summary" aria-live="polite"><b>EXPEDIENTE FINAL</b><span>{[finalAnswers.who,finalAnswers.how,finalAnswers.where].filter(Boolean).length}/3 conexiones registradas</span></div><button className="primary-button" type="submit" disabled={busy}>PRESENTAR ACUSACIÓN <span>→</span></button></form>{message && <p className="error-message">{message}</p>}</section><LevelSideTabs level={8} prompt="" placeholder="" answer="" busy={busy} unlocked canUnlock={false} message="" missionTitle="REVISAR EVIDENCIAS" missionSubtitle="Volver al nivel anterior" showUnlock={false} onAnswer={()=>{}} onReplay={()=>visitLevel(7)} onUnlock={event=>event.preventDefault()}/></>}

          {level === 9 && <section className="resolution-card"><figure className="resolution-fede"><picture><source media="(prefers-reduced-motion: reduce)" srcSet={finalCaseStill}/><img src={finalCaseLoop} alt="Federica sonríe y presenta el sello de Caso cerrado"/></picture><figcaption>MENSAJE FINAL DE FEDERICA · AGENCIA F</figcaption></figure><div className="resolved-seal">CASO<br /><strong>CERRADO</strong></div><p className="eyebrow">ARCHIVO F-01 RESUELTO</p><h1>Excelente trabajo,<br />agente {agent}.</h1><p>Martina Ríos fabricó una réplica, utilizó el corredor durante el apagón y escondió el rubí original en la base de la lente de Fresnel.</p><p>Quería forzar una investigación sobre la procedencia de la gema. Eso explica su motivo, pero no justifica el robo. El museo deberá aclarar el origen del rubí.</p><p><Typewriter text="Fede está a salvo: fue al faro antiguo a comprobar una teoría y la tormenta la dejó sin señal."/></p><FinalCaseAudio/><div className="final-envelope-callout"><span aria-hidden="true">✉</span><div><p className="eyebrow">MISIÓN CUMPLIDA</p><h2>Ya pueden abrir el sobre.</h2></div></div><blockquote>“Un buen detective no solo descubre quién hizo algo. También se pregunta cómo pudo hacerlo, qué pruebas lo demuestran y por qué tomó esa decisión.” <b>— Fede</b></blockquote><div className="result-stats"><span><b>{hintsUsed}</b>Pistas utilizadas</span><span><b>{hintsUsed <= 1 ? 'Detective del Faro' : hintsUsed <= 3 ? 'Especialista en Evidencias' : 'Agente de Investigación'}</b>Rango obtenido</span></div><PodiumAccess/>{message && <p className="error-message" role="alert">{message}</p>}</section>}
        </div>
      </section>}

      {screen==='game'&&level===2&&selectedStatement !== null && <InterrogationDialog index={selectedStatement} onClose={() => setSelectedStatement(null)} />}
      {showLevelTwoIntro&&<LevelTwoIntroDialog onContinue={()=>setLevelTwoIntro(false)}/>}
      {showLevelTwoSuccess&&<LevelTwoSuccessDialog onContinue={()=>{setLevelTwoSuccess(false);continueInvestigation();}}/>}
      {showLevelThreeDialog&&levelThreeDialog&&<LevelThreeStoryDialog kind={levelThreeDialog} onContinue={()=>{if(levelThreeDialog==='success'){setLevelThreeDialog(null);continueInvestigation();}else setLevelThreeDialog(null);}}/>}
      {showLevelFourDialog&&levelFourDialog&&<LevelFourStoryDialog kind={levelFourDialog} onContinue={()=>{if(levelFourDialog==='success'){setLevelFourDialog(null);continueInvestigation();}else setLevelFourDialog(null);}}/>}
      {showLateLevelDialog&&lateLevelDialog&&<LateLevelStoryDialog level={lateLevelDialog.level} kind={lateLevelDialog.kind} onContinue={()=>{const success=lateLevelDialog.kind==='success';setLateLevelDialog(null);if(success)continueInvestigation();}}/>}

      {showAccess && <div className="modal-backdrop" onMouseDown={() => {setShowAccess(false); setMessage('');}}><form className="access-card" onSubmit={access} onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" type="button" onClick={() => setShowAccess(false)}>×</button><p className="eyebrow dark">ACCESO RESTRINGIDO</p><h2>Identificate, agente.</h2><p>Ingresá el código impreso debajo del QR de tu carpeta.</p><label htmlFor="agent-code">Código del expediente</label><input id="agent-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="F01-XXXX-XXXX-XXXX-XXXX" autoComplete="off" /><label htmlFor="agent-name">Nombre o alias</label><input id="agent-name" value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="Tu nombre o alias de agente" maxLength={48} autoComplete="off" />{message && <p className="form-error">{message}</p>}<button className="primary-button full" type="submit">ACTIVAR INVESTIGACIÓN <span>→</span></button></form></div>}
    {levelClear&&<LevelClearOverlay level={levelClear} achievement={(hints[levelClear]||0)===0?achievementNames[levelClear-1]:undefined} onClose={()=>setLevelClear(null)}/>} {achievement&&<aside className="achievement-toast" role="status"><img src="/los-archivos-f/images/fede-logro-desbloqueado-v1.png" alt="Fede celebra el nuevo logro"/><div><span>✦ LOGRO OBTENIDO</span><b>{achievement}</b><small>La Agencia F registró esta insignia en tu expediente.</small></div><button type="button" onClick={()=>setAchievement('')} aria-label="Cerrar logro">×</button></aside>}
    {busy && <div className="connection-status" role="status">Conectando con la Agencia F…</div>}
    </fieldset></main>
  );
}
