import TerminalLevel from './TerminalLevel';
import FinalStatement from './FinalStatement';
import LightSignal from './LightSignal';
import LevelFourPlan from './LevelFourPlan';
import HintLenses from './HintLenses';
import Typewriter from './Typewriter';
import MissionMap from './MissionMap';
import LevelSideTabs from './LevelSideTabs';
import {playAchievement,playButtonClick,playCameraShutter,playChoiceCorrect,playDossierOpen,playEffect,playEvidenceSlide,playFedeRadioBeep,playHintReveal,playKeyboardKey,playLevelComplete,playLevelTransition,playPageTurn,playPenMark,playSecretCollect,playTvShutdown,setEffectsEnabled,startOpeningMusic,startStormAmbience,stopOpeningMusic,stopStormAmbience} from './sounds';
import FinalCaseAudio from './FinalCaseAudio';
import PodiumAccess from './PodiumAccess';

import Briefing from './Briefing';
import { levels, microChecks, unlockMessages } from './case';
import type { GameState } from './game-state';

import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

type Screen = 'home' | 'briefing' | 'library' | 'game';
const formatTime=(seconds:number)=>`${Math.floor(seconds/3600).toString().padStart(2,'0')}:${Math.floor(seconds%3600/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;



const statements = [
  { name: 'Bruno Vidal', code:'BV-3049', role: 'Fotógrafo e inventarista', location: 'Sala de inventario', image: '/los-archivos-f/images/bruno-ficha-v3.png', text: 'Yo estaba sacando fotos para el inventario. Empecé antes del corte y seguí después. Mi cámara guarda todos los horarios.', records:['Foto · 19:24','Foto · 19:27','Foto · 19:28','Foto · 19:44','Foto · 19:46'] },
  { name: 'Vera Salas', code:'VS-8124', role: 'Responsable de archivo', location: 'Archivo Histórico', image: '/los-archivos-f/images/vera-ficha-v3.png', text: 'Entré al Archivo Histórico antes del apagón y salí cuando volvió la luz. Mi tarjeta registró las dos veces.', records:['Entrada · 19:26','Salida · 19:48'] },
  { name: 'León Costa', code:'LC-1888', role: 'Prensa y entrevistas', location: 'Sala de entrevistas y cafetería', image: '/los-archivos-f/images/leon-ficha-v3.png', text: 'Estaba con un periodista haciendo una entrevista. Hicimos una pausa corta para ir a la cafetería y después seguimos. Mientras estábamos allí vi unas señales extrañas y las anoté en una servilleta.', records:['Entrevista A · 19:20–19:36','Cafetería · 19:35–19:42','Entrevista B · 19:41–19:50'] },
  { name: 'Martina Ríos', code:'MR-5092', role: 'Restauradora', location: 'Taller de restauración', image: '/los-archivos-f/images/martina-ficha-v3.png', text: 'Estuve trabajando en restauración. Preparé materiales antes del apagón y cerré el lote cuando volvió la luz. El terminal del taller registra mis movimientos.', records:['Actividad · 19:22','Cierre de lote · 19:49'] },
];
const dossierMaterials=['Placas fotográficas y revelador','Paño de algodón y pigmento mineral','Fichas de archivo y tinta ferrogálica','Resina R-17 y herramientas de restauración'];

const alibiSegments = [
  [{label:'Fotos',start:0,end:0},{label:'Fotos',start:70,end:80}],
  [{label:'Archivo',start:0,end:90}],
  [{label:'Entrevista A',start:0,end:30},{label:'Cafetería',start:25,end:60},{label:'Entrevista B',start:55,end:100}],
  [{label:'Actividad',start:0,end:0},{label:'Cierre',start:95,end:95}],
];

const levelVisuals = ['/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-hidden-corridor.png', '/los-archivos-f/images/bg-restoration-workshop.png', '/los-archivos-f/images/nivel-6-sala-banderas-v3.png', '/los-archivos-f/images/lens-workshop.jpg'];
const successVisuals = ['/los-archivos-f/images/bruno-storm.jpg', '/los-archivos-f/images/suspects-group.jpg', '/los-archivos-f/images/control-room.jpg', '/los-archivos-f/images/corridor-spoiler-418.jpg', '/los-archivos-f/images/martina-dark.jpg', '/los-archivos-f/images/lens-workshop.jpg', '/los-archivos-f/images/evidence-spread-spoiler.jpg'];
const levelFourFinalFrames = ['/los-archivos-f/images/federica-nivel-4-final-loop.webp','/los-archivos-f/images/federica-nivel-4-final-frame-1.webp'];
const levelSevenIntroFrames = ['/los-archivos-f/images/federica-nivel-7-inicio-loop.webp?v=20261008b','/los-archivos-f/images/federica-nivel-7-inicio-frame-1.webp?v=20261008b'];
const levelSevenFinalFrames = ['/los-archivos-f/images/federica-nivel-7-final-loop.webp','/los-archivos-f/images/federica-nivel-7-final-frame-1.webp'];
const levelSixIntroFrames = ['/los-archivos-f/images/federica-nivel-6-inicio-loop.webp','/los-archivos-f/images/federica-nivel-6-inicio-frame-1.webp'];
const levelSixFinalFrames = ['/los-archivos-f/images/federica-nivel-6-final-loop.webp','/los-archivos-f/images/federica-nivel-6-final-frame-1.webp'];
const levelFiveFinalLoop = ['/los-archivos-f/images/federica-nivel-5-final-r17-loop.gif?v=20261009d'];
const finalCaseLoop = '/los-archivos-f/images/federica-caso-cerrado-loop.webp';
const finalCaseStill = '/los-archivos-f/images/federica-caso-cerrado-frame-1.webp';

function SimulatedPlayer({label,onPlaying}:{label:string;onPlaying?:(value:boolean)=>void}){
  useEffect(()=>{onPlaying?.(false);if(/Fede|nivel|Presentación/i.test(label))playFedeRadioBeep();},[label,onPlaying]);
  return <div className="written-transmission" role="note" aria-label={`${label}. Transcripción disponible`}><span aria-hidden="true">⌁</span><b>TRANSMISIÓN RECUPERADA</b><small>Lectura disponible debajo</small></div>;
}

function MechanicalCodeBuilder({onCode}:{onCode:(code:string)=>void}){
  const [odd,setOdd]=useState('');const [even,setEven]=useState('');
  useEffect(()=>{onCode(odd.length===3&&even.length===2?`${odd}${even}`:'');},[odd,even,onCode]);
  const digits=(value:string,max:number)=>value.replace(/\D/g,'').slice(0,max);
  const oddComplete=odd.length===3,evenComplete=even.length===2,oddCorrect=odd==='118',evenCorrect=even==='20',ready=oddCorrect&&evenCorrect;
  return <section className={`mechanical-code-builder ${ready?'mechanism-ready':''}`} aria-labelledby="mechanical-builder-title"><span>CALIBRACIÓN DEL MECANISMO</span><h3 id="mechanical-builder-title">Armá la combinación</h3><p>Sumá cada recorrido por separado. El mecanismo unirá los dos resultados.</p><div><label className={oddComplete?(oddCorrect?'path-correct':'path-error'):''}>IMPARES<input inputMode="numeric" value={odd} onChange={event=>{const next=digits(event.target.value,3);if(next.length>odd.length)playKeyboardKey();setOdd(next);}} maxLength={3} placeholder="___" aria-label="Resultado de los impares"/></label><i aria-hidden="true">+</i><label className={evenComplete?(evenCorrect?'path-correct':'path-error'):''}>PARES<input inputMode="numeric" value={even} onChange={event=>{const next=digits(event.target.value,2);if(next.length>even.length)playKeyboardKey();setEven(next);}} maxLength={2} placeholder="__" aria-label="Resultado de los pares"/></label><output aria-live="polite"><span>{odd.padEnd(3,'·')}</span><i>+</i><span>{even.padEnd(2,'·')}</span><b>→</b><strong>{ready?'11820':'·····'}</strong></output></div><small>{ready?'Mecanismo preparado. Verificá la combinación.':oddComplete&&!oddCorrect?'Revisá solamente el recorrido IMPARES.':evenComplete&&!evenCorrect?'Revisá solamente el recorrido PARES.':'Primero IMPARES; después PARES.'}</small></section>;
}

function FedeArtwork({src,alt,playing,variant,children,staticSrc,frames,sequence,frameDuration=.14}:{src:string;alt:string;playing:boolean;variant:string;children?:ReactNode;staticSrc?:string;frames?:string[];sequence?:string[];frameDuration?:number}){
  const [sequenceIndex,setSequenceIndex]=useState(0);
  useEffect(()=>{
    setSequenceIndex(0);
    sequence?.forEach(source=>{const image=new Image();image.src=source;});
    if(!sequence?.length)return;
    const timer=window.setInterval(()=>setSequenceIndex(current=>(current+1)%sequence.length),Math.max(80,frameDuration*1000));
    return()=>window.clearInterval(timer);
  },[sequence,frameDuration]);
  const isSequence=Boolean(staticSrc||frames?.length||sequence?.length);
  const loopSrc=sequence?.[sequenceIndex]??frames?.[0]??src;
  const stillSrc=sequence?.length?undefined:(frames?.[1]??staticSrc);
  return <div className={`fede-artwork ${variant}`}>{isSequence?<picture className="fede-artwork-loop">{stillSrc&&<source media="(prefers-reduced-motion: reduce)" srcSet={stillSrc}/>}<img src={loopSrc} alt={alt}/></picture>:<img src={src} alt={alt}/>} {!isSequence&&<><span className={`fede-mouth ${playing?'talking':''}`} aria-hidden="true"/><span className="fede-hair" aria-hidden="true"/></>}{children}</div>;
}

function SignalDiscMechanism(){
  return <figure className="signal-disc-mechanism" aria-label="Mecanismo de señales con el círculo del pulpo sobre el disco de letras">
    <div className="signal-disc-stack" aria-hidden="true">
      <img className="signal-disc-base" src="/los-archivos-f/images/nivel6-disco-letras.webp" alt=""/>
      <img className="signal-disc-octopus" src="/los-archivos-f/images/nivel6-disco-pulpo.webp" alt=""/>
      <i className="signal-disc-pin"/>
    </div>
  </figure>;
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
    <div className={`late-story-visual ${level===5&&!success?'level-five-intro-artwork':''} ${level===6&&!success?'level-six-intro-artwork':''} ${level===6&&success?'level-six-final-artwork':''} ${level===7&&!success?'level-seven-intro-artwork':''} ${level===7&&success?'level-seven-final-artwork':''}`} style={{backgroundImage:level===6?'none':`linear-gradient(#03101955,#03101988),url(${level===5&&!success?story.introArtwork:story.background})`}}>{level===6&&!success?<FedeArtwork src={levelSixIntroFrames[0]} frames={levelSixIntroFrames} frameDuration={0.28} alt="Fede presenta la sala de banderas mientras la tormenta continúa tras las ventanas" playing={playing} variant="level-6-intro"/>:level===6&&success?<FedeArtwork src={levelSixFinalFrames[0]} frames={levelSixFinalFrames} frameDuration={0.28} alt="Fede concluye el caso de las banderas en la sala del faro" playing={playing} variant="level-6-success"/>:level===7&&!success?<FedeArtwork src={levelSevenIntroFrames[0]} frames={levelSevenIntroFrames} frameDuration={0.28} alt="Fede señala el tablero y presenta el último código" playing={playing} variant="level-7-intro"/>:level===7&&success?<FedeArtwork src={levelSevenFinalFrames[0]} frames={levelSevenFinalFrames} frameDuration={0.28} alt="Fede abre el compartimento secreto y celebra el hallazgo del rubí" playing={playing} variant="level-7-success"/>:level===5&&success?<FedeArtwork src={levelFiveFinalLoop[0]} frames={levelFiveFinalLoop} alt="Federica muestra el frasco de Resina R-17 en el taller" playing={playing} variant="level-5-final"/>:level===5?<picture className="level-five-intro-sequence"><source media="(prefers-reduced-motion: reduce)" srcSet="/los-archivos-f/images/federica-nivel-5-inicio-frame-1.webp"/><img src="/los-archivos-f/images/federica-nivel-5-inicio-loop.webp" alt="Federica presenta la entrada al pasillo oculto"/></picture>:<div className={`late-fede-character ${playing?'is-speaking':''}`}><img src="/los-archivos-f/images/federica-presentadora-v1.png" alt={`Federica presenta el ${success?'resultado':'objetivo'} del nivel ${level}`}/><span className="late-fede-mouth" aria-hidden="true"/></div>}{level===5&&!success&&<span className={`level-five-image-mouth ${playing?'talking':''}`} aria-hidden="true"/>}{level===6&&success&&<span className="story-beam" aria-hidden="true"/>}{level===7&&!success&&<div className="level-seven-board-copy" aria-label="Objetivo del mecanismo"><span>OBJETIVO</span><b>Descubrir el código de acceso al compartimento.</b><strong>Calculá <em>IMPARES</em> y <em>PARES</em> para formar la combinación.</strong></div>}<span className="story-light" aria-hidden="true"/><span className="story-dust" aria-hidden="true"/></div>
    <div className="level-three-story-copy"><p className="story-dialog-kicker">AGENCIA F · {success?'NIVEL COMPLETADO':`INICIO DEL NIVEL ${level}`}</p><div className="story-dialog-title-row"><h2 id="late-story-title">{success?story.successTitle:story.introTitle}</h2></div><SimulatedPlayer label={`${success?'Mensaje final':'Bienvenida'} de Fede · Nivel ${level}`} onPlaying={setPlaying}/><p>{success?story.successText:story.introText}</p>{(level!==7||success)&&<button className="primary-button story-page-action" type="button" onClick={onContinue}>{success?(level===7?'PRESENTAR LA ACUSACIÓN':`CONTINUAR AL NIVEL ${level+1}`):'COMENZAR LA MISIÓN'} <span>→</span></button>}</div>
    {level===7&&!success&&<button className="primary-button story-page-action level-seven-start-action" type="button" onClick={onContinue}>COMENZAR LA MISIÓN <span>→</span></button>}
  </section>;
}

function LevelFiveMovements({busy,onComplete}:{busy:boolean;onComplete:()=>Promise<void>}){
  const [record,setRecord]=useState('');const [recordReady,setRecordReady]=useState(false);const [reportOpen,setReportOpen]=useState(false);const [recordFound,setRecordFound]=useState(false);const [suspect,setSuspect]=useState('');const [feedback,setFeedback]=useState('');const [suspectResult,setSuspectResult]=useState<'correct'|'error'|''>('');const [openDossier,setOpenDossier]=useState<number|null>(null);
  const visualSuspects=[statements[1],statements[3],statements[0],statements[2]];
  const movements=[
    {code:'P-12',material:'Barniz de retoque',operator:'T-03',destination:'Depósito norte'},
    {code:'Q-08',material:'Pigmento mineral',operator:'T-11',destination:'Archivo técnico'},
    {code:'R-11',material:'Cera microcristalina',operator:'T-08',destination:'Galería oeste'},
    {code:'R-17',material:'Resina R-17',operator:'T-04',destination:'Sala de Banderas'},
    {code:'R-71',material:'Solvente neutro',operator:'T-14',destination:'Taller de marcos'},
    {code:'L-03',material:'Paño de algodón',operator:'T-09',destination:'Sala de conservación'},
    {code:'S-17',material:'Adhesivo reversible',operator:'T-06',destination:'Laboratorio auxiliar'},
  ];
  function verifyRecord(){setSuspectResult('');if(!/^R[\s-]?17$/i.test(record.trim())){playEffect('error');setFeedback('Ese código no coincide con la impresión recuperada. Revisá sus letras y números: el intento queda guardado.');return;}playChoiceCorrect();setRecord('R-17');setRecordReady(true);setFeedback('Código recuperado. Hay un informe de movimientos que puede contener la conexión.');}
  function findRecord(code:string){if(code!=='R-17'){playEffect('error');setFeedback('Esa fila corresponde a otro movimiento. Buscá el código que acabás de recuperar.');return;}playChoiceCorrect();setRecordFound(true);setFeedback('Registro encontrado. Seguí la fila: material, responsable y destino están conectados.');}
  function selectSuspect(value:string){setSuspect(value);if(value==='martina'){playChoiceCorrect();setSuspectResult('correct');setFeedback('La ficha de Martina coincide con la Resina R-17. La conexión es importante, pero todavía no demuestra quién robó el rubí.');}else{playEffect('error');setSuspectResult('error');setFeedback('El material de esa ficha no coincide con la Resina R-17. Conservamos tu elección para que puedas compararla.');}}
  async function verifySuspect(){if(suspect!=='martina'){setFeedback('Esa ficha no muestra el mismo material. Volvé al panel de sospechosos y compará los objetos de trabajo.');return;}await onComplete();}
  const step=recordFound?3:recordReady?2:1;
  return <section className="movement-register" aria-labelledby="movement-title"><p className="eyebrow">NIVEL 5 · REGISTRO INTERRUMPIDO</p><h2 id="movement-title">Seguí el movimiento oculto.</h2><ol className="movement-steps" aria-label="Progreso de la investigación"><li className={step===1?'current':step>1?'done':''}><span>1</span><b>Recuperar código</b></li><li className={step===2?'current':step>2?'done':''}><span>2</span><b>Encontrar registro</b></li><li className={step===3?'current':''}><span>3</span><b>Asociar persona</b></li></ol>
  {!recordReady?<div className="movement-check"><label htmlFor="movement-record">¿Qué código oculta la impresión encriptada?</label><p className="movement-filter-clue">El informe rojizo no revela todo a simple vista. Tal vez el filtro que recuperaste permita leer lo que la tinta esconde.</p><input id="movement-record" aria-label="Código oculto en la impresión encriptada" value={record} onChange={event=>setRecord(event.target.value)} placeholder="Código del registro" autoComplete="off"/><button type="button" className="unlock-button" onClick={verifyRecord}>VERIFICAR RESPUESTA</button></div>:<div className="movement-record-workspace"><aside className="movement-pinned-note"><div className="movement-pinned-note-copy"><small>IMPRESIÓN RECUPERADA</small><strong>{record}</strong><span>Fragmento del puesto de conservación</span></div></aside>{!reportOpen?<button type="button" className="movement-report-cover" onClick={()=>{playEffect('paper');setReportOpen(true);setFeedback('');}}><span>AGENCIA F · CONSERVACIÓN</span><strong>INFORME DE MOVIMIENTOS</strong><small>REGISTRO INTERNO · TURNO NOCHE</small><b>ABRIR INFORME →</b></button>:<div className="movement-table-wrap"><table className={recordFound?'show-connections':'find-code'}><thead><tr><th>CÓDIGO</th><th>MATERIAL</th><th>OPERADOR</th><th>DESTINO</th></tr></thead><tbody>{movements.map(item=><tr key={item.code} className={recordFound&&item.code==='R-17'?'matched':''}><td><button type="button" onClick={()=>findRecord(item.code)} disabled={recordFound}>{item.code}</button></td><td>{item.material}</td><td>{item.operator}</td><td>{item.destination}</td></tr>)}</tbody></table></div>}</div>}
  {recordReady&&reportOpen&&!recordFound&&<p className="movement-instruction">Cotejá la ficha con el informe y abrí el movimiento que corresponda.</p>}
  {recordFound&&<div className="movement-check movement-person-step"><b>El material está marcado como <em>Resina R-17</em>. Revisá los expedientes y decidí dónde viste esa misma marca.</b><div className="movement-suspect-grid">{visualSuspects.map(person=>{const value=person.name.split(' ')[0].toLowerCase();const discarded=value==='león';const selected=suspect===value;const dossierIndex=statements.findIndex(item=>item.name===person.name);return <article className={`${selected?'selected':''} ${selected&&suspectResult==='correct'?'choice-correct':''} ${selected&&suspectResult==='error'?'choice-error':''} ${discarded?'discarded':''}`} key={person.name}><button type="button" className="movement-dossier-open" onClick={()=>setOpenDossier(dossierIndex)} aria-label={`Abrir expediente de ${person.name}`}><span className="movement-suspect-photo"><img src={person.image} alt=""/>{discarded&&<i aria-hidden="true">DESCARTADO</i>}</span><strong>{person.name}</strong><small>ABRIR EXPEDIENTE</small></button><button type="button" className="movement-dossier-select" onClick={()=>!discarded&&selectSuspect(value)} disabled={discarded}>{discarded?'COARTADA VERIFICADA':selected&&suspectResult==='correct'?'MATERIAL CONFIRMADO':selected&&suspectResult==='error'?'NO COINCIDE':'ELEGIR PERSONA'}</button></article>})}</div><button type="button" className="unlock-button" disabled={busy||suspect!=='martina'} onClick={verifySuspect}>REGISTRAR CONEXIÓN</button></div>}{feedback&&<p className={`movement-feedback ${suspectResult==='correct'?'is-correct':suspectResult==='error'?'is-error':''}`} role="status">{feedback}</p>}{openDossier!==null&&<InterrogationDialog index={openDossier} onClose={()=>setOpenDossier(null)} onReviewed={()=>{}}/>}</section>;
}


function InterrogationDialog({ index, onClose, onReviewed }: { index: number; onClose: () => void; onReviewed: (index:number) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [speaking,setSpeaking]=useState(false);
  const [viewerIndex,setViewerIndex]=useState<number|null>(null);
  const person = statements[index];
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    onReviewed(index);
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [index]);
  return <dialog ref={dialogRef} className="interrogation-dialog" aria-labelledby="interrogation-name" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="interrogation-layout">
      <button className="interrogation-close" onClick={onClose} autoFocus aria-label="Cerrar interrogatorio">Cerrar <span aria-hidden="true">×</span></button>
      <figure className={`interrogation-portrait portrait-alive ${speaking?'is-speaking':''}`}><div className="suspect-artwork"><img src={person.image} alt={person.name} /><span className={`suspect-mouth suspect-mouth-${index+1}`} aria-hidden="true"/><button className="suspect-magnifier" type="button" onClick={()=>{playCameraShutter();setViewerIndex(index);}} aria-label={`Ampliar fotografía de ${person.name}`}><span aria-hidden="true">⌕</span> AMPLIAR</button></div><figcaption>ARCHIVO F-01 / SUJETO 0{index + 1}</figcaption></figure>
      <div className="interrogation-content">
        <p className="eyebrow">REGISTRO DE INTERROGATORIO · 0{index + 1}</p>
        <h2 id="interrogation-name">{person.name}</h2>
        <dl className="suspect-details"><div><dt>Ocupación</dt><dd>{person.role}</dd></div><div><dt>Ubicación declarada</dt><dd>{person.location}</dd></div><div><dt>Material observado</dt><dd>{dossierMaterials[index]}</dd></div></dl>
        <section className="statement-text"><h3>Declaración</h3><blockquote>“{person.text}”</blockquote></section>
        <section className="statement-simulation"><h3>Declaración registrada</h3><SimulatedPlayer label={`Declaración de ${person.name}`} onPlaying={setSpeaking}/></section>
        <section className="timeline-records" aria-label={`Registros horarios de ${person.name}`}><h3>Registros comprobables</h3><div>{person.records.map(record=><span key={record}>{record}</span>)}</div><small>INTERVALO CRÍTICO · 19:30–19:50</small><div className="dialog-alibi-line" aria-hidden="true"><i/><b>19:30</b><b>19:40</b><b>19:50</b>{alibiSegments[index].map((segment,segmentIndex)=><em key={`${segment.label}-${segmentIndex}`} style={{left:`${segment.start}%`,width:`${Math.max(segment.end-segment.start,2)}%`}} title={segment.label}/>)}</div></section>
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
 {type:'FICHA DE LABORATORIO',title:'REGISTRO · R-17',meaning:'La Resina R-17 conecta el movimiento con Martina y la Sala de Banderas.'},
 {type:'TARJETA DE SEÑALES',title:'UBICACIÓN · FAROL',meaning:'Las banderas no forman una contraseña: señalan la linterna superior.'},
 {type:'FOTOGRAFÍA DEL MECANISMO',title:'COMPARTIMENTO · ABIERTO',meaning:'La última evidencia completa el expediente. El sobre sigue cerrado hasta confirmar la acusación.'},
];
const achievementNames=['OJO DE FARO','COARTADA PERFECTA','RADIOOPERADOR','CARTÓGRAFO','RASTREADOR','SEÑALERO','MENTE MECÁNICA'];
const persistentAchievementNames=new Set([...achievementNames,'EQUIPO IMPARABLE','SIN DEJAR HUELLAS','GUARDIÁN DE LAS SIETE LUCES',...Array.from({length:7},(_,index)=>`MARCA SECRETA ${index+1}/7`)]);
function normalizeAchievements(value:unknown){return Array.isArray(value)?[...new Set(value.filter((item):item is string=>typeof item==='string'&&persistentAchievementNames.has(item)))]:[];}
const accusationLabels={
 who:{bruno:'Bruno',vera:'Vera',leon:'León',martina:'Martina'},
 how:{cafeteria:'alteró el registro durante la restauración',corredor:'usó el apagón, cruzó el corredor y dejó una réplica',terraza:'manipuló las fotografías y salió por la terraza'},
 where:{bolso:'un lote de materiales del taller',generador:'el conducto de la sala del generador',lente:'la base de la lente de Fresnel'},
} as const;
function LevelClearOverlay({level,achievement,onClose}:{level:number;achievement?:string;onClose:()=>void}){
 const evidence=evidenceRewards[level-1];
 useEffect(()=>{const evidenceTimer=window.setTimeout(playEvidenceSlide,360);const achievementTimer=achievement?window.setTimeout(playAchievement,1050):0;return()=>{window.clearTimeout(evidenceTimer);if(achievementTimer)window.clearTimeout(achievementTimer);};},[achievement]);
 const viewBoard=()=>{onClose();window.dispatchEvent(new Event('archivos-f-open-evidence-board'));};
 return <div className="level-clear-overlay" role="dialog" aria-modal="true" aria-label={`Evidencia ${level} verificada`}><div className="level-clear-flash"/><section className={`evidence-unlock-drawer evidence-unlock-${level}`}><div className="evidence-stamp-stage"><img className="level-clear-stamp-image" src="/los-archivos-f/images/stamp-evidence-confirmed-v1.png" alt="Agencia F · Evidencia verificada"/></div>{level===6&&<div className="farol-letter-reveal" aria-label="FAROL">{'FAROL'.split('').map((letter,index)=><span key={letter} style={{'--farol-index':index} as React.CSSProperties}>{letter}</span>)}</div>}{level===7&&<div className="envelope-authorization" aria-label="Expediente completo, sobre todavía cerrado"><i aria-hidden="true">✉</i><span>EXPEDIENTE COMPLETO</span><b>PRESENTEN SU ACUSACIÓN.</b></div>}<div className="level-clear-evidence"><i aria-hidden="true">◆</i><span>{evidence.type}</span><b>{evidence.title}</b><p>{evidence.meaning}</p><small>EVIDENCIA {level}/7 · incorporada al tablero</small>{achievement&&<small>LOGRO OBTENIDO · {achievement}</small>}</div><div className="evidence-unlock-actions"><button className="reading-choice" type="button" onClick={viewBoard}>VER EN EL TABLERO</button><button className="primary-button" type="button" onClick={onClose}>VER MENSAJE DE FEDE <span>→</span></button></div></section></div>;
}

function EnvelopeOpening({onContinue}:{onContinue:()=>void}){
 useEffect(()=>{const timer=window.setTimeout(playEvidenceSlide,240);return()=>window.clearTimeout(timer);},[]);
 return <section className="envelope-opening-page story-page-view" aria-labelledby="envelope-opening-title"><div className="envelope-opening-stage" aria-hidden="true"><div className="case-envelope"><span className="case-envelope-back"/><span className="case-envelope-flap"/><span className="case-envelope-letter"><small>ARCHIVO F-01</small><b>CASO CERRADO</b><i>SOLO PARA EL AGENTE</i></span><span className="case-envelope-front"><span className="airmail-postmark"><i>MONTEVIDEO</i><b>39</b></span><span className="classified-stamp stamp-one">CLASIFICADO<small>ACCESO RESTRINGIDO</small></span><span className="classified-stamp stamp-two">CONFIDENCIAL<small>NIVEL OMEGA</small></span><span className="classified-stamp stamp-three">ALTA CONFIDENCIA</span><span className="airmail-address">Sr/a. AGENTE SECRETO<br/><b>CUMPLE DE FEDE</b><br/>MONTEVIDEO, URUGUAY</span><span className="airmail-label">VÍA AIR MAIL</span><span className="secret-label">SECRET</span></span></div></div><div className="envelope-opening-copy"><p className="story-dialog-kicker">ACUSACIÓN CONFIRMADA · AGENCIA F</p><h1 id="envelope-opening-title">Ahora sí:<br/>abran el sobre.</h1><p>La acusación fue confirmada y la investigación quedó cerrada. Ya pueden descubrir la última sorpresa de la Agencia F.</p><aside><span>ANTES DE CONTINUAR</span><b>Abran el sobre dirigido al agente y tómense un momento para revisar lo que encuentren.</b></aside><button className="primary-button" type="button" onClick={onContinue}>SOBRE ABIERTO · VER CIERRE DEL CASO <span>→</span></button></div></section>;
}

const resolutionFindings=[
 {label:'01 · QUIÉN',title:'Martina Ríos',text:'Preparó la réplica y retiró el rubí durante el apagón.',proof:'Resina R-17 · registro T-04 · ficha del taller'},
 {label:'02 · CÓMO',title:'Corredor oculto',text:'Aprovechó la oscuridad, atravesó la ruta de mantenimiento y dejó la copia.',proof:'19:37 · plano 9 → 3 → 7'},
 {label:'03 · DÓNDE',title:'Base de la lente de Fresnel',text:'El rubí original quedó oculto en el compartimento señalado por FAROL.',proof:'Sala de Banderas · FAROL · mecanismo 11820'},
 {label:'04 · MOTIVO',title:'Forzar una investigación',text:'Quería que el museo revisara la procedencia de la gema. Lo explica, pero no justifica el robo.',proof:'Declaración final · documentación del museo'},
];

function FinalResolution({agent,hintsUsed,elapsedSeconds,marksCount,achievements,closingCase,message,onClose}:{agent:string;hintsUsed:number;elapsedSeconds:number;marksCount:number;achievements:string[];closingCase:boolean;message:string;onClose:()=>void}){
 const [visible,setVisible]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches?resolutionFindings.length:1);
 useEffect(()=>{if(visible>=resolutionFindings.length)return;const timer=window.setTimeout(()=>setVisible(value=>value+1),850);return()=>window.clearTimeout(timer);},[visible]);
 const rank=hintsUsed<=1?'Detective del Faro':hintsUsed<=3?'Especialista en Evidencias':'Agente de Investigación';
 return <section className="resolution-card resolution-sequence"><figure className="resolution-fede"><picture><source media="(prefers-reduced-motion: reduce)" srcSet={finalCaseStill}/><source media="(max-width: 700px)" srcSet={finalCaseStill}/><img src={finalCaseLoop} alt="Federica presenta el cierre del caso desde el Museo del Faro"/></picture><figcaption>TRANSMISIÓN FINAL · FEDE ESTÁ A SALVO</figcaption></figure><div className="resolved-seal">CASO<br/><strong>CERRADO</strong></div><p className="eyebrow">ARCHIVO F-01 RESUELTO</p><h1>Excelente trabajo,<br/>agente {agent}.</h1><p className="fede-status-resolution"><b>¿Qué pasó con Fede?</b> Fue al faro antiguo a comprobar una teoría. La tormenta cortó su señal, pero nunca estuvo en peligro.</p><div className="resolution-findings" aria-live="polite">{resolutionFindings.map((finding,index)=><article className={index<visible?'is-visible':''} key={finding.label}><span>{finding.label}</span><h2>{finding.title}</h2><p>{finding.text}</p><small><b>LO DEMUESTRA</b>{finding.proof}</small></article>)}</div>{visible<resolutionFindings.length?<button className="reading-choice resolution-reveal-next" type="button" onClick={()=>setVisible(value=>Math.min(resolutionFindings.length,value+1))}>REVELAR SIGUIENTE CONCLUSIÓN</button>:<><FinalCaseAudio/><blockquote>“Un buen detective no solo descubre quién hizo algo. También pregunta qué pruebas lo demuestran.” <b>— Fede</b></blockquote><div className="result-stats final-stats"><span><b>{formatTime(elapsedSeconds)}</b>Tiempo total</span><span><b>{hintsUsed}</b>Pistas utilizadas</span><span><b>{marksCount}/7</b>Marcas secretas</span><span><b>{rank}</b>Rango</span><span><b>7/7</b>Evidencias encontradas</span></div><section className="final-achievements" aria-labelledby="final-achievements-title"><div><span>EXPEDIENTE DE MÉRITOS</span><h2 id="final-achievements-title">Insignias conseguidas</h2><b>{achievements.length}</b></div>{achievements.length?<ul>{achievements.map((name,index)=><li key={name}><i aria-hidden="true">✦</i><span><small>INSIGNIA {String(index+1).padStart(2,'0')}</small>{name}</span></li>)}</ul>:<p>La investigación quedó resuelta, aunque esta vez no se obtuvieron insignias especiales.</p>}</section><PodiumAccess/><div className="final-resolution-actions"><button className="reading-choice" type="button" onClick={()=>window.dispatchEvent(new Event('archivos-f-open-evidence-board'))}>VER TABLERO FINAL</button><button type="button" className="primary-button" onClick={onClose} disabled={closingCase}>{closingCase?'CERRANDO SEÑAL…':'CERRAR TRANSMISIÓN'} <span>→</span></button></div></>}{message&&<p className="error-message" role="alert">{message}</p>}</section>;
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
  const [reviewedStatements,setReviewedStatements]=useState<number[]>([]);
  const [pinnedStatements,setPinnedStatements]=useState<number[]>([]);
  const [alibiCandidate,setAlibiCandidate]=useState<number|null>(null);
  const [finalAnswers, setFinalAnswers] = useState({ who: '', how: '', where: '' });
  const [finalSelectionErrors,setFinalSelectionErrors]=useState<Array<'who'|'how'|'where'>>([]);
  const [musicOn, setMusicOn] = useState(true);
  const [soundscape,setSoundscape]=useState<'opening'|'storm'>('opening');
  const soundscapeRef=useRef<'opening'|'storm'>('opening');
  const [closingCase,setClosingCase]=useState(false);
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
  const [envelopeOpening,setEnvelopeOpening]=useState(()=>import.meta.env.DEV&&new URLSearchParams(window.location.search).get('preview')==='envelope');
  const [gameFeedback,setGameFeedback]=useState<'success'|'error'|''>('');
  const [achievement,setAchievement]=useState('');
  const [earnedAchievements,setEarnedAchievements]=useState<string[]>(()=>{try{return normalizeAchievements(JSON.parse(localStorage.getItem('archivos-f-achievements')||'[]'));}catch{return [];}});
  const achievementTimerRef=useRef<number|null>(null);
  const [ambientEvent,setAmbientEvent]=useState<'beam'|'shadow'|'radio'|'ruby'|''>('');
  const [marks,setMarks]=useState<number[]>(()=>{try{const saved:unknown=JSON.parse(localStorage.getItem('archivos-f-secret-marks')||'[]');if(!Array.isArray(saved))return [];return [...new Set(saved.filter((value):value is number=>Number.isInteger(value)&&value>=1&&value<=7))].sort((a,b)=>a-b);}catch{return [];}});

  function unlockAchievement(name:string,show=true,withSound=true){
    let current=earnedAchievements;
    try{current=normalizeAchievements(JSON.parse(localStorage.getItem('archivos-f-achievements')||'[]'));}catch{/* Fall back to the in-memory list. */}
    if(current.includes(name))return;
    const next=[...current,name];setEarnedAchievements(next);
    try{localStorage.setItem('archivos-f-achievements',JSON.stringify(next));}catch{/* Decorative progress must not interrupt the case. */}
    if(show){if(withSound)playAchievement();setAchievement(name);if(achievementTimerRef.current!==null)window.clearTimeout(achievementTimerRef.current);achievementTimerRef.current=window.setTimeout(()=>{setAchievement('');achievementTimerRef.current=null;},9500);}
  }

  useEffect(()=>()=>{if(achievementTimerRef.current!==null)window.clearTimeout(achievementTimerRef.current);},[]);

  function receiveState(state: GameState) {
    const elapsed=Math.max(elapsedRef.current,Math.floor(Number(state.elapsedSeconds)||0));elapsedRef.current=elapsed;
    setAgent(state.agent); setHighestLevel(state.highestLevel); setHints(state.hints); setCheckProgress(state.checkProgress); setCompletedAt(state.completedAt); setElapsedSeconds(elapsed); setActiveSession(true);
  }

  function activateStormSoundscape(){soundscapeRef.current='storm';setSoundscape('storm');if(musicEnabled.current){startOpeningMusic();startStormAmbience();}}

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
      if(localPreview!=='library'&&localPreview!=='briefing'){soundscapeRef.current='storm';setSoundscape('storm');}
      if(localPreview==='final'){setAgent('Filo');setActiveSession(true);setHighestLevel(9);setScreen('game');setLevel(9);return;}
      const previewLevel=localPreview==='envelope'?7:Number(localPreview.match(/^level([1-7])/)?.[1]||2);const previewDone=(localPreview.endsWith('-done')&&localPreview!=='level4-plan-done')||localPreview==='envelope';
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
      const localPreview=import.meta.env.DEV&&new URLSearchParams(window.location.search).has('preview');
      if(localPreview&&body.action==='deduction'){
        setSaveStatus('Vista previa · comprobación simulada');
        return {} as GameState;
      }
      if(localPreview&&body.action==='final'){
        setHighestLevel(9);
        unlockAchievement('EQUIPO IMPARABLE',false);
        if(Object.values(hints).reduce((sum,value)=>sum+value,0)<=2)unlockAchievement('SIN DEJAR HUELLAS',false);
        setSaveStatus('Vista previa · acusación confirmada');
        playEffect('unlock');
        return {} as GameState;
      }
      if(localPreview&&body.action==='unlock'){
        const solved=Number(body.level);
        const normalized=String(body.answer||'').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        const accepted=levels[solved-1]?.answer.some(candidate=>candidate.trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'')===normalized);
        if(!accepted){playEffect('error');setGameFeedback('error');window.setTimeout(()=>setGameFeedback(''),700);setMessage('Esa respuesta no coincide con las pruebas. Revisala e intentá otra vez.');return null;}
        playLevelComplete(solved);setHighestLevel(current=>Math.max(current,solved+1));setLevelClear(solved);setGameFeedback('success');window.setTimeout(()=>setGameFeedback(''),900);setSaveStatus('Vista previa · progreso simulado');
        return {} as GameState;
      }
      const response = await fetch('/los-archivos-f/api/game', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const raw=await response.text();
      let data:GameState & {error?:string;code?:string};
      try{data=JSON.parse(raw) as GameState & {error?:string;code?:string};}
      catch{throw new Error(response.ok?'No recibimos una respuesta válida. Volvé a intentar.':'No pudimos conectar con la partida. Volvé a intentar.');}
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
    const start = () => {
      if (!musicEnabled.current) return;
      startOpeningMusic();
      if(soundscapeRef.current==='storm')startStormAmbience();
    };
    const gesture = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('.music-button')) return;
      start();
    };
    document.addEventListener('pointerdown', gesture, true);
    document.addEventListener('keydown', gesture, true);
    const thunder=(event:Event)=>{const detail=(event as CustomEvent<{side?:'left'|'right';intensity?:number}>).detail;setStormFlash(value=>({key:value.key+1,side:detail?.side||'right',intensity:detail?.intensity||.7}));};
    window.addEventListener('archivos-f-thunder',thunder);
    start();
    return () => {
      document.removeEventListener('pointerdown', gesture, true);
      document.removeEventListener('keydown', gesture, true);
      window.removeEventListener('archivos-f-thunder',thunder);
      stopStormAmbience();
      stopOpeningMusic();
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
    document.addEventListener('click',click);return()=>document.removeEventListener('click',click);
  },[]);

  function collectMark(){
    if(level<1||level>7||marks.includes(level))return;
    const next=[...marks,level].sort();setMarks(next);localStorage.setItem('archivos-f-secret-marks',JSON.stringify(next));playSecretCollect();unlockAchievement(next.length===7?'GUARDIÁN DE LAS SIETE LUCES':`MARCA SECRETA ${next.length}/7`,true,false);
  }

  function visitLevel(destination: number) {
    if (destination < 0 || destination > highestLevel) return;
    setLevel(destination); setAnswer(''); setMessage(''); setCheckSelection(null); setCheckFeedback(''); setCheckPassed(false); setSelectedStatement(null); setAlibiCandidate(null); setLevelThreeReady(false);
    setLevelTwoSuccess(false);
    const firstVisit=destination===highestLevel;
    setLevelThreeDialog(firstVisit&&destination===3?'intro':null);
    setLevelFourDialog(firstVisit&&destination===4?'intro':null);
    setLateLevelDialog(firstVisit&&destination>=5&&destination<=7?{level:destination as 5|6|7,kind:'intro'}:null);
    setLevelTwoIntro(firstVisit&&destination===2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const hintsUsed = useMemo(() => Object.values(hints).reduce((a, b) => a + b, 0), [hints]);
  const finalAchievements=useMemo(()=>{
    const earned=earnedAchievements.filter(name=>!name.startsWith('MARCA SECRETA'));
    if(highestLevel>=9){achievementNames.forEach((name,index)=>{if((hints[index+1]||0)===0)earned.push(name);});earned.push('EQUIPO IMPARABLE');if(hintsUsed<=2)earned.push('SIN DEJAR HUELLAS');}
    if(marks.length===7)earned.push('GUARDIÁN DE LAS SIETE LUCES');
    return [...new Set(earned)];
  },[earnedAchievements,highestLevel,hints,hintsUsed,marks.length]);

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
    activateStormSoundscape();
    setLevel(state.highestLevel); setAnswer(''); setShowAccess(false); leaveGame('library');
    setCheckSelection(null); setCheckPassed(false); setCheckFeedback(''); setFinalAnswers({who:'',how:'',where:''});
  }

  async function startInvestigation() {
    if (await gameAction({action:'start'})) {activateStormSoundscape();setLevel(1);}
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
    const expected={who:'martina',how:'corredor',where:'lente'};
    const incorrect=(Object.keys(expected) as Array<keyof typeof expected>).filter(field=>finalAnswers[field]!==expected[field]);
    if(incorrect.length){playEffect('error');setFinalSelectionErrors(incorrect);setMessage('Hay conexiones que no coinciden con el expediente. Revisalas y volvé a presentar la acusación.');window.setTimeout(()=>setFinalSelectionErrors([]),900);return;}
    if (await gameAction({action:'final',...finalAnswers})) setEnvelopeOpening(true);
  }

  function selectFinalAnswer(field:'who'|'how'|'where',value:string){
    playButtonClick();
    setFinalAnswers(current=>({...current,[field]:value}));
    setFinalSelectionErrors(current=>current.filter(item=>item!==field));
    setMessage('');
  }

  async function toggleMusic() {
    const enabled = !musicEnabled.current;
    musicEnabled.current = enabled;
    setMusicOn(enabled);
    if (!enabled) { stopStormAmbience();stopOpeningMusic();return; }
    startOpeningMusic();
    if(soundscape==='storm')startStormAmbience();
  }

  function closeCompletedCase(){
    if(closingCase)return;
    setClosingCase(true);playTvShutdown();stopStormAmbience();soundscapeRef.current='opening';setSoundscape('opening');
    window.setTimeout(()=>{setScreen('home');setClosingCase(false);window.scrollTo(0,0);if(musicEnabled.current)startOpeningMusic();},1450);
  }

  const showLevelTwoSuccess=screen==='game'&&level===2&&levelTwoSuccess&&!levelClear;
  const showLevelTwoIntro=screen==='game'&&level===2&&levelTwoIntro&&!showLevelTwoSuccess;
  const showLevelThreeDialog=screen==='game'&&level===3&&Boolean(levelThreeDialog)&&!levelClear;
  const showLevelFourDialog=screen==='game'&&level===4&&Boolean(levelFourDialog)&&!levelClear;
  const showLateLevelDialog=screen==='game'&&lateLevelDialog?.level===level&&!levelClear;
  const storyPageOpen=showLevelTwoIntro||showLevelTwoSuccess||showLevelThreeDialog||showLevelFourDialog||showLateLevelDialog||envelopeOpening;

  useEffect(()=>{
    const frame=requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}));
    return()=>cancelAnimationFrame(frame);
  },[screen,level,levelClear,levelTwoIntro,levelTwoSuccess,levelThreeDialog,levelFourDialog,lateLevelDialog,envelopeOpening]);

  return (
    <main className={`site-shell ${storyPageOpen?'story-page-active':''} ${closingCase?'signal-shutdown':''} game-feedback-${gameFeedback}`} aria-busy={busy}>{closingCase&&<span className="signal-shutdown-screen" aria-hidden="true"><i/><b/><em/></span>}<span key={stormFlash.key} className={`storm-flash storm-flash-${stormFlash.side} ${stormFlash.key?'is-active':''}`} style={{'--storm-intensity':stormFlash.intensity} as React.CSSProperties} aria-hidden="true"/><span className={`ambient-event ambient-${ambientEvent}`} aria-hidden="true"/><fieldset className="app-controls" disabled={busy}>
      <nav className="topbar" aria-label="Navegación principal">
        <div className="header-identity">
          <button className="brand brand-button" onClick={() => leaveGame('home')} aria-label="Ir al inicio"><img className="brand-logo" src="/los-archivos-f/images/logo-ranking-archivos-f.png" alt="Los Archivos F"/></button>
        </div>
        <div className="nav-tools">{(screen==='home'||screen==='library')&&<div className="nav-celebration">10 OCT · FEDE · 11 AÑOS</div>}<div className="audio-controls"><button className={`music-button sfx-button ${effectsOn?'on':''}`} onClick={()=>{const next=!effectsOn;setEffectsOn(next);setEffectsEnabled(next);if(next)playEffect('panel');}} aria-pressed={effectsOn} aria-label={effectsOn?'Desactivar efectos de sonido':'Activar efectos de sonido'} title={effectsOn?'Efectos encendidos':'Activar efectos'}>SFX</button><button className={`music-button music-icon-only ${musicOn ? 'on' : ''}`} onClick={toggleMusic} aria-pressed={musicOn} aria-label={musicOn?`Desactivar ${soundscape==='opening'?'música de inicio':'tormenta'}`:`Activar ${soundscape==='opening'?'música de inicio':'tormenta'}`} title={musicOn?`${soundscape==='opening'?'Música de inicio':'Tormenta'} encendida`:'Activar sonido ambiente'}>{musicOn ? (soundscape==='opening'?'♫':'🌧') : '☁'}</button></div></div>
      </nav>

      {screen === 'home' && <section className="welcome-page">
        <div className="welcome-heading"><p className="eyebrow">AGENCIA F · ACCESO CONFIDENCIAL</p><h1 className="welcome-title">Bienvenido a Los Archivos F</h1><img className="welcome-logo" src="/los-archivos-f/images/logo-archivos-f.png" alt="Los Archivos F · Escape room digital"/><p>Una misión especial por los <strong>11 años de Fede.</strong></p><span className="welcome-seal">TU AVENTURA COMIENZA ACÁ</span></div>
        <form className="access-card welcome-access" onSubmit={access}><p className="eyebrow dark">IDENTIFICATE, AGENTE</p><h2>¿Listo para el misterio?</h2><p><Typewriter text="Prendé el sonido, ingresá tus datos y disfrutá la experiencia."/></p><div className="welcome-audio-choice" aria-label="Preferencia de sonido"><button type="button" className={musicOn||effectsOn?'selected':''} onClick={()=>{if(!effectsOn){setEffectsOn(true);setEffectsEnabled(true);}if(!musicOn)void toggleMusic();}}>JUGAR CON SONIDO</button><button type="button" className={!musicOn&&!effectsOn?'selected':''} onClick={()=>{setEffectsOn(false);setEffectsEnabled(false);if(musicOn)void toggleMusic();}}>JUGAR EN SILENCIO</button></div><p className="welcome-prep">60–90 minutos · Tené cerca los sobres y materiales impresos.</p><label htmlFor="welcome-name">Tu nombre o alias</label><input id="welcome-name" value={agent} onChange={e=>setAgent(e.target.value)} placeholder="¿Cómo te llamás, agente?" required maxLength={48} autoComplete="nickname"/><label htmlFor="welcome-code">Código de acceso</label><input id="welcome-code" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="F01-XXXX-XXXX-XXXX-XXXX" required autoComplete="off" autoCapitalize="characters" spellCheck={false}/>{message && <p className="form-error" role="alert">{message}</p>}{activeSession?<><button type="button" className="primary-button full" onClick={()=>leaveGame('library')}>CONTINUAR PARTIDA <span>→</span></button><button className="reading-choice full" type="submit">ACTIVAR OTRO CÓDIGO</button></>:<button className="primary-button full" type="submit">ENTRAR A LA CÁMARA DE EXPEDIENTES <span>→</span></button>}<small>Encontrá tu código debajo del QR. No necesitás una cuenta. Podés usar un alias y volver con el mismo código para recuperar tu partida.</small></form>
      </section>}

      {screen === 'briefing' && <Briefing agent={agent} alreadyAccepted={highestLevel>0} onComplete={async()=>{if(highestLevel===0)await startInvestigation();setScreen('game');window.scrollTo(0,0);}}/>}

      {screen === 'library' && <section className="library-page">
        <div className="library-intro"><div className="page-heading"><p className="eyebrow dark">BIENVENIDO, AGENTE {agent.toUpperCase()}</p><h1>La cámara de los expedientes</h1><p><Typewriter text="Tu caso está listo. El avance queda guardado con tu código."/></p></div>
        <button className="primary-button library-open-case" onClick={openCaseFile}>ABRIR EXPEDIENTE <span>→</span></button><button className="switch-code" onClick={() => {setCode(''); setMessage(''); setShowAccess(true);}}>Ingresar otro código</button></div><div className="case-grid">
          <article className="case-card active"><div className="case-visual case-visual-link" role="button" tabIndex={0} aria-label="Abrir expediente El robo del Rubí del Faro" onClick={openCaseFile} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openCaseFile();}}}><img src="/los-archivos-f/images/hero-archivos-f.png" alt="El rubí rojo sobre un mapa y el faro iluminado junto al mar" /><i className="case-lighthouse-beam" aria-hidden="true"/><span>F-01</span></div><div className="case-copy"><small>CASO DISPONIBLE · DIFICULTAD MEDIA</small><h2>El robo del Rubí del Faro</h2><p>Un rubí robado, cuatro sospechosos y un apagón que investigar.</p>{highestLevel>0&&<p className="case-progress-summary">{Math.max(0,Math.min(7,highestLevel-1))}/7 evidencias · {hintsUsed} pistas · {formatTime(elapsedSeconds)}</p>}<ul><li>7 niveles</li><li>16 desafíos</li><li>60–90 min</li><li>Físico + digital</li></ul><button className="primary-button" onClick={openCaseFile}>ABRIR EXPEDIENTE <span>→</span></button></div></article>
        </div>
      </section>}

      {screen === 'game' && !storyPageOpen && <section className="game-page">
        <MissionMap level={level} highestLevel={highestLevel} hintsUsed={hintsUsed} elapsedSeconds={elapsedSeconds} hintPanel={level >= 1 && level <= 7 ? <HintLenses key={level} hints={levels[level-1].hints} used={hints[level] || 0} busy={busy} canRequest={!unlocked} onRequest={()=>requestHint(false)} onRequestSolution={()=>requestHint(true)}/> : <p className="no-stage-hints">Entrá a un nivel de la investigación para consultar sus pistas.</p>} saveStatus={saveStatus} visitLevel={visitLevel} onMission={()=>leaveGame('briefing')} onLibrary={()=>leaveGame('library')}/>

        <div className="investigation-panel">
          {level>=1&&level<=7&&!marks.includes(level)&&<button type="button" className={`secret-lighthouse secret-lighthouse-${level}`} onClick={collectMark} aria-label="Descubrir marca secreta del faro"><span>♜</span></button>}
          {level !== 1 && level !== 2 && level <= 7 && <figure className={`scene-frame ${level === 3?'level-three-weather':level === 4?'level-four-maps':level===5?'level-five-red-corridor':level===6?'level-six-flags':level === 0 ? 'storm-layer' : level === 7 ? 'beam-layer' : 'lamp-layer'}`}><img className={level===3?'storm-frame storm-frame-0':undefined} src={level === 0 ? '/los-archivos-f/images/control-room.jpg' : level===3 ? levelVisuals[2] : level===4&&!unlocked ? '/los-archivos-f/images/nivel-4-sala-planos-v1.png' : level===5&&!unlocked?'/los-archivos-f/images/bg-hidden-corridor.png':level===6&&!unlocked?'/los-archivos-f/images/nivel-6-sala-banderas-v3.png':unlocked ? successVisuals[level - 1] : levelVisuals[level - 1]} alt={level===4?'Sala de cartografía del museo con un plano incompleto sobre la mesa':level===5?'Corredor de mantenimiento iluminado por señales rojas':level===6?'Sala del faro con cinco banderas numeradas a distintas alturas y el cartel Seguí la luz':'Escena del Museo del Faro vinculada con la investigación'} />{level===3&&['nivel-3-tormenta-2.png','nivel-3-tormenta-3.png','nivel-3-tormenta-4.png'].map((frame,index)=><img className={`storm-frame storm-frame-${index+1}`} src={`/los-archivos-f/images/${frame}`} alt="" aria-hidden="true" key={frame}/>)}{level===3&&<i className="scene-lightning-flash" aria-hidden="true"/>}{level===3&&<i className="scene-lighthouse-beam" aria-hidden="true"/>}<span>{unlocked ? 'EVIDENCIA VISUAL DESBLOQUEADA' : 'REGISTRO VISUAL · ARCHIVO F-01'}</span></figure>}
          
          {level === 0 && <section className="mission-intro"><p className="eyebrow dark">ARCHIVO F-01 · MISIÓN ACEPTADA</p><h1>El robo del Rubí del Faro</h1><p><Typewriter text="Durante el apagón reemplazaron el Rubí del Faro por una copia. Cuatro personas quedaron bajo sospecha."/></p><div className="mission-facts"><span><b>OBJETIVO</b>Recuperar el rubí</span><span><b>SOSPECHOSOS</b>Cuatro personas</span><span><b>REGLA</b>No abrir el sobre todavía</span></div><p>La terminal se apagó a mitad del registro. Recuperá la hora exacta para fijar el primer punto de la investigación.</p><button className="primary-button" onClick={startInvestigation}>COMENZAR NIVEL 1 <span>→</span></button><button className="reading-choice" onClick={()=>leaveGame('briefing')}>Volver a escuchar a Fede</button></section>}

          {level === 1 && <TerminalLevel unlocked={unlocked} busy={busy} message={message} deferSuccess={levelClear===1} onUnlock={async value=>Boolean(await gameAction({action:"unlock",level:1,answer:value}))} onContinue={continueInvestigation}/>}
          {level >= 2 && level <= 7 && (() => {
            const current = levels[level - 1];
            const checkIndex = unlocked ? microChecks[level - 1].length : checkProgress[level] || 0;
            const currentCheck = level===7 ? undefined : microChecks[level - 1][checkIndex];
            const completedChecks = microChecks[level - 1].length;
            const canUnlock=!unlocked&&level!==5&&!currentCheck&&(level!==3||levelThreeReady);
            return <><section className={`level-card level-card-${level}`}>
              <p className="eyebrow dark">{current.kicker}</p><h1>{current.title}</h1>
              <div className="level-objective"><span>OBJETIVO</span><p>{level===2?'Descartá a una persona cubriendo todo el intervalo crítico.':level===3?'Ordená las seis señales y descubrí el lugar indicado.':level===4?'Completá el plano con las seis piezas faltantes y seguí la ruta desde INICIO.':level===5?'Recuperá el código oculto y conectalo con la persona asociada al material.':level===6?'Orientá los círculos y traducí las cinco banderas.':'Calculá IMPARES y PARES para formar la combinación.'}</p></div>
              {level === 2 && <figure className="level-two-group-scene"><img src="/los-archivos-f/images/suspects-group.jpg" alt="Los cuatro sospechosos reunidos en la sala de entrevistas"/><figcaption>{unlocked?'COARTADA VERIFICADA · REGISTRO CONSERVADO':'REGISTRO DE ENTREVISTAS · CUATRO PERSONAS PRESENTES'}</figcaption></figure>}
              {level === 6 && !unlocked && <aside className="level-six-physical-prompt" aria-label="Pista para orientar los círculos"><SignalDiscMechanism/><div className="level-six-physical-copy"><span>EL PULPO NOS GUÍA</span><h2>Dos círculos, una sola pista.</h2><p>Dejá que el pulpo encuentre su rumbo. Cuando esté en el lugar indicado, las banderas empezarán a hablar.</p></div></aside>}
              {level===7&&!unlocked&&<MechanicalCodeBuilder onCode={setAnswer}/>}
              {level===3&&<div className="digital-brief compact-signal-brief"><LightSignal onSolved={async solved=>{setLevelThreeReady(solved);if(solved&&await gameAction({action:'unlock',level:3,answer:'taller'}))setLevelThreeDialog('success');}}/></div>}
              {level === 2 && <section className="suspect-board" aria-label="Panel de sospechosos"><div className="suspect-board-heading"><h2>Cuatro versiones.</h2><p>Abrí las fichas, revisá sus registros y fijá hasta dos para compararlas.</p><span>{reviewedStatements.length}/4 FICHAS REVISADAS</span></div><div className="suspect-grid">{statements.map((person, index) => {const reviewed=reviewedStatements.includes(index);const pinned=pinnedStatements.includes(index);const proposed=alibiCandidate===index;return <article className={`suspect-file ${reviewed?'is-reviewed':''} ${pinned?'is-pinned':''} ${proposed?'is-proposed':''}`} key={person.name}><button className="suspect-file-open" type="button" onClick={() => {playDossierOpen();playCameraShutter();setSelectedStatement(index);}} aria-label={`Abrir ficha de ${person.name}`}><div className="suspect-file-photo"><img src={person.image} alt="" />{reviewed&&<i>REVISADA ✓</i>}</div><div className="suspect-file-caption"><span>{person.role}</span><h3>{person.name}</h3>{unlocked&&index===2?<p className="suspect-code-reveal">COARTADA VERIFICADA · <b>LC-1888</b></p>:<p>ABRIR EXPEDIENTE <span aria-hidden="true">↑</span></p>}</div></button><button className="pin-suspect" type="button" aria-pressed={pinned} onClick={()=>{playButtonClick();setPinnedStatements(current=>pinned?current.filter(value=>value!==index):current.length<2?[...current,index]:[current[1],index]);}}>{pinned?'FIJADA':'FIJAR PARA COMPARAR'}</button>{reviewed&&!unlocked&&<button className="propose-alibi" type="button" aria-pressed={proposed} onClick={()=>{playPenMark();setAlibiCandidate(index);setAnswer(person.code.split('-')[1]);setMessage('');}}>{proposed?'COARTADA PROPUESTA':'PROPONER COARTADA'}</button>}</article>})}</div><div className="alibi-master-timeline" aria-label="Línea temporal común de las coartadas"><div><b>INTERVALO CRÍTICO</b><span>19:30</span><span>19:40</span><span>19:50</span></div>{pinnedStatements.length?<section>{pinnedStatements.map(index=><div className="alibi-row" key={statements[index].name}><strong>{statements[index].name}</strong><div><i/>{alibiSegments[index].map((segment,segmentIndex)=><em key={`${segment.label}-${segmentIndex}`} style={{left:`${segment.start}%`,width:`${Math.max(segment.end-segment.start,2)}%`}}><small>{segment.label}</small></em>)}</div></div>)}</section>:<p>Fijá dos fichas para superponer sus registros en esta línea.</p>}</div>{!unlocked&&<form className="alibi-verification-panel" onSubmit={submitLevel}><span>CONCLUSIÓN</span><p>{alibiCandidate===null?'Revisá una ficha y proponé quién puede demostrar todo el intervalo.':`Propuesta: ${statements[alibiCandidate].name}. ¿Sus registros cubren de 19:30 a 19:50 sin huecos?`}</p><button type="submit" className="unlock-button" disabled={busy||alibiCandidate===null}>VERIFICAR RESPUESTA</button></form>}</section>}
              {level === 4 && !unlocked && <LevelFourPlan solved={checkIndex>0} busy={busy} onSolved={async()=>{if(!await gameAction({action:'deduction',level:4,index:0,selection:2}))return;setCheckSelection(null);setCheckFeedback('');setCheckPassed(false);if(await gameAction({action:'unlock',level:4,answer:'937'}))setLevelFourDialog('success');}}/>}
              {level === 5 && !unlocked && <LevelFiveMovements busy={busy} onComplete={async()=>{if(!await gameAction({action:'deduction',level:5,index:0,selection:1}))return;if(await gameAction({action:'unlock',level:5,answer:'banderas'})){setLateLevelDialog({level:5,kind:'success'});}}}/>}

              {!unlocked&&canUnlock&&level!==2&&level!==3&&level!==5&&<form className="inline-unlock" onSubmit={submitLevel}><label htmlFor={`level-answer-${level}`}><span>RESPUESTA DEL NIVEL</span>{current.prompt}</label><div><input id={`level-answer-${level}`} value={answer} onChange={event=>setAnswer(event.target.value)} placeholder={current.placeholder} autoComplete="off"/><button className="unlock-button" type="submit" disabled={busy||!answer.trim()}>{busy?'VERIFICANDO…':'VERIFICAR RESPUESTA'}</button></div></form>}

              {!unlocked && currentCheck && level!==5 && !(level===4&&checkIndex===0) && <div className="micro-challenge"><p className="eyebrow dark">COMPROBACIÓN {checkIndex + 1} DE {completedChecks}</p><h2><Typewriter text={currentCheck.question}/></h2><div className="micro-options">{currentCheck.options.map((option, index) => <button key={option} className={checkSelection === index ? 'selected' : ''} onClick={() => { if (!checkPassed) { setCheckSelection(index); setCheckFeedback(''); } }}>{option}</button>)}</div>{checkFeedback && <p className={checkPassed ? 'micro-success' : 'micro-error'}>{checkPassed ? currentCheck.success : checkFeedback}</p>}{checkPassed ? <button className="primary-button" onClick={continueMicroCheck}>REGISTRAR COMPROBACIÓN <span>→</span></button> : <button className="unlock-button" onClick={() => verifyMicroCheck(currentCheck.correct)}>VERIFICAR RESPUESTA</button>}</div>}
              {message && level!==3 && level!==4 && <p className={message.startsWith('Nivel completado') ? 'success-message' : 'error-message'}>{message}</p>}
              {unlocked && level >=5 && level<=7 && <div className="unlock-reveal compact"><div className="unlock-icon">✓</div><p className="eyebrow dark">MENSAJE DE FEDE DISPONIBLE</p><h2>{current.unlock}</h2><button className="primary-button" onClick={()=>setLateLevelDialog({level:level as 5|6|7,kind:'success'})}>VER MENSAJE DE FEDE <span>→</span></button></div>}
            </section><LevelSideTabs level={level} prompt={current.prompt} placeholder={current.placeholder} answer={answer} busy={busy} unlocked={unlocked} canUnlock={canUnlock} message={message} missionMessageOpen={level===2?levelTwoIntro||levelTwoSuccess:level===3?Boolean(levelThreeDialog):level===4?Boolean(levelFourDialog):Boolean(lateLevelDialog)} onAnswer={setAnswer} onReplay={replayLevelIntro} onUnlock={submitLevel}/></>;
          })()}

          {level === 8 && <><section className="level-card final-card"><p className="eyebrow dark">ACUSACIÓN FINAL</p><h1>Presentá tu acusación.</h1><p className="final-instruction">Completá las tres tarjetas del expediente. La acusación debe explicar quién actuó, cómo lo hizo y dónde terminó la gema original.</p><FinalStatement highestLevel={highestLevel}/><form className="final-form accusation-builder" onSubmit={submitFinal}><label className={finalSelectionErrors.includes('who')?'selection-error':''}><span>01 · RESPONSABLE</span>¿Quién retiró el rubí?<select required value={finalAnswers.who} onChange={e=>selectFinalAnswer('who',e.target.value)}><option value="">Elegí una persona</option><option value="bruno">Bruno Vidal</option><option value="vera">Vera Salas</option><option value="leon">León Costa</option><option value="martina">Martina Ríos</option></select></label><label className={finalSelectionErrors.includes('how')?'selection-error':''}><span>02 · MÉTODO</span>¿Cómo realizó el cambio?<select required value={finalAnswers.how} onChange={e=>selectFinalAnswer('how',e.target.value)}><option value="">Elegí una reconstrucción</option><option value="cafeteria">Alteró el registro y trasladó la gema durante la restauración</option><option value="corredor">Usó el apagón, atravesó el corredor y dejó una réplica</option><option value="terraza">Manipuló los horarios de las fotografías y salió por la terraza</option></select></label><label className={finalSelectionErrors.includes('where')?'selection-error':''}><span>03 · ESCONDITE</span>¿Dónde escondió el original?<select required value={finalAnswers.where} onChange={e=>selectFinalAnswer('where',e.target.value)}><option value="">Elegí un lugar</option><option value="bolso">Dentro de un lote de materiales del taller</option><option value="generador">En el conducto junto a la sala del generador</option><option value="lente">En la base de la lente de Fresnel</option></select></label><div className="accusation-sentence" aria-live="polite">Acusamos a <b>{finalAnswers.who?accusationLabels.who[finalAnswers.who as keyof typeof accusationLabels.who]:'___'}</b> porque <b>{finalAnswers.how?accusationLabels.how[finalAnswers.how as keyof typeof accusationLabels.how]:'___'}</b> y creemos que el rubí está en <b>{finalAnswers.where?accusationLabels.where[finalAnswers.where as keyof typeof accusationLabels.where]:'___'}</b>.</div><div className="accusation-summary" aria-live="polite"><b>EXPEDIENTE FINAL</b><span>{[finalAnswers.who,finalAnswers.how,finalAnswers.where].filter(Boolean).length}/3 conexiones registradas</span></div><button className="primary-button" type="submit" disabled={busy}>PRESENTAR ACUSACIÓN <span>→</span></button></form>{message && <p className="error-message">{message}</p>}</section><LevelSideTabs level={8} prompt="" placeholder="" answer="" busy={busy} unlocked canUnlock={false} message="" missionTitle="REVISAR EVIDENCIAS" missionSubtitle="Volver al nivel anterior" showUnlock={false} onAnswer={()=>{}} onReplay={()=>visitLevel(7)} onUnlock={event=>event.preventDefault()}/></>}

          {level===9&&<FinalResolution agent={agent} hintsUsed={hintsUsed} elapsedSeconds={elapsedSeconds} marksCount={marks.length} achievements={finalAchievements} closingCase={closingCase} message={message} onClose={closeCompletedCase}/>}
        </div>
      </section>}

      {screen==='game'&&level===2&&selectedStatement !== null && <InterrogationDialog index={selectedStatement} onReviewed={index=>setReviewedStatements(current=>current.includes(index)?current:[...current,index])} onClose={() => setSelectedStatement(null)} />}
      {showLevelTwoIntro&&<LevelTwoIntroDialog onContinue={()=>setLevelTwoIntro(false)}/>}
      {showLevelTwoSuccess&&<LevelTwoSuccessDialog onContinue={()=>{setLevelTwoSuccess(false);continueInvestigation();}}/>}
      {showLevelThreeDialog&&levelThreeDialog&&<LevelThreeStoryDialog kind={levelThreeDialog} onContinue={()=>{if(levelThreeDialog==='success'){setLevelThreeDialog(null);continueInvestigation();}else setLevelThreeDialog(null);}}/>}
      {showLevelFourDialog&&levelFourDialog&&<LevelFourStoryDialog kind={levelFourDialog} onContinue={()=>{if(levelFourDialog==='success'){setLevelFourDialog(null);continueInvestigation();}else setLevelFourDialog(null);}}/>}
      {showLateLevelDialog&&lateLevelDialog&&<LateLevelStoryDialog level={lateLevelDialog.level} kind={lateLevelDialog.kind} onContinue={()=>{const success=lateLevelDialog.kind==='success';setLateLevelDialog(null);if(success)continueInvestigation();}}/>}
      {envelopeOpening&&<EnvelopeOpening onContinue={()=>{setEnvelopeOpening(false);setLevel(9);window.scrollTo({top:0,behavior:'auto'});}}/>}

      {showAccess && <div className="modal-backdrop" onMouseDown={() => {setShowAccess(false); setMessage('');}}><form className="access-card" onSubmit={access} onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" type="button" onClick={() => setShowAccess(false)}>×</button><p className="eyebrow dark">ACCESO RESTRINGIDO</p><h2>Identificate, agente.</h2><p>Ingresá el código impreso debajo del QR de tu carpeta.</p><label htmlFor="agent-code">Código del expediente</label><input id="agent-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="F01-XXXX-XXXX-XXXX-XXXX" autoComplete="off" /><label htmlFor="agent-name">Nombre o alias</label><input id="agent-name" value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="Tu nombre o alias de agente" maxLength={48} autoComplete="off" />{message && <p className="form-error">{message}</p>}<button className="primary-button full" type="submit">ACTIVAR INVESTIGACIÓN <span>→</span></button></form></div>}
    {levelClear&&<LevelClearOverlay level={levelClear} achievement={(hints[levelClear]||0)===0?achievementNames[levelClear-1]:undefined} onClose={()=>setLevelClear(null)}/>} {achievement&&<aside className="achievement-toast" role="status"><img src="/los-archivos-f/images/fede-logro-desbloqueado-v1.png" alt="Fede celebra el nuevo logro"/><div><span>✦ LOGRO OBTENIDO</span><b>{achievement}</b><small>La Agencia F registró esta insignia en tu expediente.</small></div><button type="button" onClick={()=>setAchievement('')} aria-label="Cerrar logro">×</button></aside>}
    {busy && <div className="connection-status" role="status">Conectando con la Agencia F…</div>}
    </fieldset></main>
  );
}
