import TerminalLevel from './TerminalLevel';
import FinalStatement from './FinalStatement';
import LightSignal from './LightSignal';
import LevelFourPlan from './LevelFourPlan';
import HintLenses from './HintLenses';
import Typewriter from './Typewriter';
import MissionMap from './MissionMap';
import LevelSideTabs from './LevelSideTabs';
'use client';

import Briefing from './Briefing';
import { levels, microChecks } from './case';
import type { GameState } from './game-state';

import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

type Screen = 'home' | 'briefing' | 'library' | 'game';



const statements = [
  { name: 'Bruno Vidal', code:'BV-3049', role: 'Fotógrafo e inventarista', location: 'Sala de inventario', image: '/los-archivos-f/images/bruno-ficha-v3.png', text: 'Yo estaba sacando fotos para el inventario. Empecé antes del corte y seguí después. Mi cámara guarda todos los horarios.', records:['Foto · 19:24','Foto · 19:27','Foto · 19:28','Foto · 19:44','Foto · 19:46'] },
  { name: 'Vera Salas', code:'VS-8124', role: 'Responsable de archivo', location: 'Archivo Histórico', image: '/los-archivos-f/images/vera-ficha-v3.png', text: 'Entré al Archivo Histórico antes del apagón y salí cuando volvió la luz. Mi tarjeta registró las dos veces.', records:['Entrada · 19:26','Salida · 19:48'] },
  { name: 'León Costa', code:'LC-1888', role: 'Prensa y entrevistas', location: 'Sala de entrevistas y cafetería', image: '/los-archivos-f/images/leon-ficha-v3.png', text: 'Estaba con un periodista haciendo una entrevista. Hicimos una pausa corta para ir a la cafetería y después seguimos. Mientras estábamos allí vi unas señales extrañas y las anoté en una servilleta.', records:['Entrevista A · 19:20–19:36','Cafetería · 19:35–19:42','Entrevista B · 19:41–19:50'] },
  { name: 'Martina Ríos', code:'MR-5092', role: 'Restauradora', location: 'Taller de restauración', image: '/los-archivos-f/images/martina-ficha-v3.png', text: 'Estuve trabajando en restauración. Preparé materiales antes del apagón y cerré el lote cuando volvió la luz. El terminal del taller registra mis movimientos.', records:['Actividad · 19:22','Cierre de lote · 19:49'] },
];

const levelVisuals = ['/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-hidden-corridor.png', '/los-archivos-f/images/bg-restoration-workshop.png', '/los-archivos-f/images/nivel-6-sala-banderas-v1.png', '/los-archivos-f/images/lens-workshop.jpg'];
const successVisuals = ['/los-archivos-f/images/bruno-storm.jpg', '/los-archivos-f/images/suspects-group.jpg', '/los-archivos-f/images/control-room.jpg', '/los-archivos-f/images/corridor-spoiler-418.jpg', '/los-archivos-f/images/martina-dark.jpg', '/los-archivos-f/images/lens-workshop.jpg', '/los-archivos-f/images/evidence-spread-spoiler.jpg'];

function SimulatedPlayer({label,onPlaying}:{label:string;onPlaying?:(value:boolean)=>void}){
  const [playing,setPlaying]=useState(false);
  const toggle=()=>{const next=!playing;setPlaying(next);onPlaying?.(next);};
  return <div className={`simulated-player ${playing?'is-playing':''}`} role="group" aria-label={`${label}. Audio pendiente de producción`}><button type="button" onClick={toggle} aria-label={playing?'Pausar simulación':'Reproducir simulación'}>{playing?'Ⅱ':'▶'}</button><span>{playing?'REPRODUCIENDO MENSAJE…':'AUDIO EN PREPARACIÓN'}</span><i><b/></i><small>--:-- / --:--</small></div>;
}

function FedeArtwork({src,alt,playing,variant,children}:{src:string;alt:string;playing:boolean;variant:string;children?:ReactNode}){
  return <div className={`fede-artwork ${variant}`}><img src={src} alt={alt}/><span className={`fede-mouth ${playing?'talking':''}`} aria-hidden="true"/><span className="fede-hair" aria-hidden="true"/>{children}</div>;
}

function LevelTwoSuccessDialog({onContinue}:{onContinue:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);const [playing,setPlaying]=useState(false);
  useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
  return <dialog ref={ref} className="level-two-success-dialog" aria-labelledby="level-two-success-title" onCancel={event=>event.preventDefault()}><div className="level-two-success-visual"><FedeArtwork src="/los-archivos-f/images/federica-nivel-2-exito-v1.png" alt="Federica junto al reloj del museo" playing={playing} variant="level-2-success"><span className="unlock-beacon" aria-hidden="true"/></FedeArtwork></div><div className="level-two-success-copy"><p className="story-dialog-kicker">AGENCIA F · NIVEL DESBLOQUEADO</p><div className="story-dialog-title-row"><h2 id="level-two-success-title">Coartada verificada.</h2></div><SimulatedPlayer label="Mensaje final de Fede" onPlaying={setPlaying}/><p>Las fuentes coinciden y cubren todo el intervalo. León queda descartado. Durante la pausa en la cafetería anotó algo extraño en una servilleta. Esa puede ser nuestra siguiente pista.</p><button className="primary-button" onClick={onContinue}>CONTINUAR AL NIVEL 3 <span>→</span></button></div></dialog>;
}

function LevelTwoIntroDialog({onContinue}:{onContinue:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);const [playing,setPlaying]=useState(false);
  useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
  return <dialog ref={ref} className="level-two-success-dialog level-two-intro-dialog" aria-labelledby="level-two-intro-title" onCancel={event=>event.preventDefault()}><div className="level-two-success-visual"><FedeArtwork src="/los-archivos-f/images/federica-nivel-2-inicio-v1.png" alt="Federica presenta la investigación desde la sala de entrevistas" playing={playing} variant="level-2-intro"/></div><div className="level-two-success-copy"><p className="story-dialog-kicker">AGENCIA F · INICIO DEL NIVEL 2</p><div className="story-dialog-title-row"><h2 id="level-two-intro-title">Una declaración no alcanza.</h2></div><SimulatedPlayer label="Presentación del nivel 2" onPlaying={setPlaying}/><p>Tenemos cuatro declaraciones, pero una declaración no alcanza para descartar a nadie. Compará lo que dicen con los registros disponibles y averiguá quién puede demostrar dónde estuvo durante todo el intervalo del apagón.</p><div className="story-mission-objective"><span>MISIÓN DEL NIVEL</span><p>Descartar exactamente a una persona comprobando su recorrido completo entre las 19:30 y las 19:50.</p></div><button className="primary-button" type="button" onClick={onContinue}>COMENZAR LA MISIÓN <span>→</span></button></div></dialog>;
}

function LevelThreeStoryDialog({kind,onContinue}:{kind:'intro'|'success';onContinue:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);const [playing,setPlaying]=useState(false);
  const success=kind==='success';
  useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
  return <dialog ref={ref} className={`level-three-story-dialog ${success?'is-success':'is-intro'}`} aria-labelledby="level-three-story-title" onCancel={event=>event.preventDefault()}>
    <div className="level-three-story-visual"><FedeArtwork src={success?'/los-archivos-f/images/federica-nivel-3-exito-v1.png':'/los-archivos-f/images/federica-nivel-3-inicio-v1.png'} alt={success?'Federica junto al receptor de señales encendido':'Federica en la cafetería sosteniendo una servilleta blanca'} playing={playing} variant={success?'level-3-success':'level-3-intro'}><span className="story-rain" aria-hidden="true"/><span className="story-beam" aria-hidden="true"/>{success&&<span className="signal-confirmation" aria-hidden="true"/>}</FedeArtwork></div>
    <div className="level-three-story-copy"><p className="story-dialog-kicker">{success?'AGENCIA F · NIVEL DESBLOQUEADO':'AGENCIA F · INICIO DEL NIVEL 3'}</p><div className="story-dialog-title-row"><h2 id="level-three-story-title">{success?'¡Excelente trabajo, agente!':'La tormenta dejó un mensaje.'}</h2></div><SimulatedPlayer label={success?'Mensaje final de Fede · Nivel 3':'Bienvenida de Fede · Nivel 3'} onPlaying={setPlaying}/><p>{success?'Reconstruiste la secuencia: las seis señales marcan el TALLER. No era un mensaje al azar. Alguien que conocía el sistema pudo dejar allí otra parte del recorrido. Vamos a comprobarlo.':'León dejó esta servilleta en la cafetería y el receptor recuperó seis señales durante el apagón. Tu misión es interpretar cada señal y reconstruir su orden para descubrir qué lugar del faro están señalando.'}</p><button className="primary-button" type="button" onClick={onContinue}>{success?'CONTINUAR AL NIVEL 4':'COMENZAR LA MISIÓN'} <span>→</span></button></div>
  </dialog>;
}

function LevelFourStoryDialog({kind,onContinue}:{kind:'intro'|'success';onContinue:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);const [playing,setPlaying]=useState(false);const success=kind==='success';
  useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
  return <dialog ref={ref} className={`level-three-story-dialog level-four-story-dialog ${success?'is-success':'is-intro'}`} aria-labelledby="level-four-story-title" onCancel={event=>event.preventDefault()}><div className="level-three-story-visual"><FedeArtwork src={success?'/los-archivos-f/images/federica-nivel-4-exito-v1.png':'/los-archivos-f/images/federica-nivel-4-inicio-v1.png'} alt={success?'Federica señala la entrada al corredor oculto':'Federica presenta un plano incompleto en la sala de mapas'} playing={playing} variant={success?'level-4-success':'level-4-intro'}><span className="story-rain" aria-hidden="true"/><span className="story-beam" aria-hidden="true"/>{success&&<span className="corridor-lights" aria-hidden="true"/>}</FedeArtwork></div><div className="level-three-story-copy"><p className="story-dialog-kicker">{success?'AGENCIA F · NIVEL DESBLOQUEADO':'AGENCIA F · INICIO DEL NIVEL 4'}</p><div className="story-dialog-title-row"><h2 id="level-four-story-title">{success?'¡Lo tenemos!':'Falta una parte del plano.'}</h2></div><SimulatedPlayer label={success?'Mensaje final de Fede · Nivel 4':'Bienvenida de Fede · Nivel 4'} onPlaying={setPlaying}/><p>{success?'La ruta oculta atraviesa 9, 3 y 7. El código abrió el conducto de mantenimiento y reveló un pasaje que no aparece en el plano público. Excelente trabajo: sigamos el corredor.':'Encontramos un plano incompleto. Alguien arrancó justo una parte del sector de mantenimiento. Hay varias reconstrucciones posibles, pero solo una respeta la estructura del edificio. Mirá las conexiones, no solamente la forma del fragmento.'}</p><button className="primary-button" type="button" onClick={onContinue}>{success?'CONTINUAR AL NIVEL 5':'COMENZAR LA MISIÓN'} <span>→</span></button></div></dialog>;
}

const lateStories={
  5:{introTitle:'Un registro quedó oculto.',introText:'El corredor conserva una señal incompleta. Observá el entorno, recuperá el dato que falta y averiguá adónde conduce.',successTitle:'R-17 deja un nuevo rastro.',successText:'R-17 termina en la Sala de Banderas. El movimiento figura a nombre de T-04 y transporta Resina RX-4, el mismo material que vimos con Martina. Es una conexión importante, pero todavía no alcanza para acusarla.',background:'/los-archivos-f/images/bg-hidden-corridor.png',introArtwork:'/los-archivos-f/images/federica-nivel-5-inicio-v1.png'},
  6:{introTitle:'Cinco señales. Ningún orden visible.',introText:'Hay cinco señales izadas en el mástil, pero no sabemos qué mensaje forman. Observá con atención la sala, descubrí el orden y reconstruí el mensaje.',successTitle:'Las señales indican una ubicación.',successText:'FAROL no parece una contraseña. Es una ubicación. Las señales estaban indicando la linterna superior del faro. Vamos.',background:'/los-archivos-f/images/nivel-6-sala-banderas-v1.png',introArtwork:'/los-archivos-f/images/nivel-6-sala-banderas-v1.png'},
  7:{introTitle:'El mecanismo no revela su clave.',introText:'Llegamos al mecanismo del farol. La plantilla LF-04 ya está preparada, pero a simple vista no revela la combinación. Observá cómo está construida y probá cómo encajan sus partes.',successTitle:'Compartimento desbloqueado.',successText:'La calibración funcionó. El mecanismo se abrió y ya tenés autorización para abrir el Sobre Negro. Conservá todas las evidencias: todavía falta reconstruir quién utilizó el corredor.',background:'/los-archivos-f/images/lens-workshop.jpg',introArtwork:'/los-archivos-f/images/lens-workshop.jpg'},
} as const;

function LateLevelStoryDialog({level,kind,onContinue}:{level:5|6|7;kind:'intro'|'success';onContinue:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);const [playing,setPlaying]=useState(false);const story=lateStories[level];const success=kind==='success';
  useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
  return <dialog ref={ref} className="level-three-story-dialog late-level-story-dialog" aria-labelledby="late-story-title" onCancel={event=>event.preventDefault()}>
    <div className={`late-story-visual ${level===5&&!success?'level-five-intro-artwork':''}`} style={{backgroundImage:`linear-gradient(#03101955,#03101988),url(${level===5&&!success?story.introArtwork:story.background})`}}>{(level!==5||success)&&<div className={`late-fede-character ${playing?'is-speaking':''}`}><img src="/los-archivos-f/images/federica-presentadora-v1.png" alt={`Federica presenta el ${success?'resultado':'objetivo'} del nivel ${level}`}/><span className="late-fede-mouth" aria-hidden="true"/></div>}{level===5&&!success&&<span className={`level-five-image-mouth ${playing?'talking':''}`} aria-hidden="true"/>}{level===6&&<span className="story-beam" aria-hidden="true"/>}<span className="story-light" aria-hidden="true"/><span className="story-dust" aria-hidden="true"/></div>
    <div className="level-three-story-copy"><p className="story-dialog-kicker">AGENCIA F · {success?'NIVEL DESBLOQUEADO':`INICIO DEL NIVEL ${level}`}</p><div className="story-dialog-title-row"><h2 id="late-story-title">{success?story.successTitle:story.introTitle}</h2></div><SimulatedPlayer label={`${success?'Mensaje final':'Bienvenida'} de Fede · Nivel ${level}`} onPlaying={setPlaying}/><p>{success?story.successText:story.introText}</p><button className="primary-button" type="button" onClick={onContinue}>{success?(level===7?'IR A LA ACUSACIÓN FINAL':`CONTINUAR AL NIVEL ${level+1}`):'COMENZAR LA MISIÓN'} <span>→</span></button></div>
  </dialog>;
}

function LevelFiveMovements({busy,onComplete}:{busy:boolean;onComplete:()=>Promise<void>}){
  const [record,setRecord]=useState('');const [recordReady,setRecordReady]=useState(false);const [destination,setDestination]=useState('');const [destinationReady,setDestinationReady]=useState(false);const [suspect,setSuspect]=useState('');const [feedback,setFeedback]=useState('');
  const visualSuspects=[statements[1],statements[3],statements[0],statements[2]];
  function verifyRecord(){if(!/^R[\s-]?17$/i.test(record.trim())){setFeedback('Ese registro no coincide con la señal recuperada. Volvé a observar la evidencia.');return;}setRecordReady(true);setFeedback('Registro confirmado. Ahora seguí su recorrido.');}
  function verifyDestination(){if(!/^(la )?(sala de )?banderas$/i.test(destination.trim())){setFeedback('Ese destino no coincide con R-17. Revisá la fila completa.');return;}setDestinationReady(true);setFeedback('Destino confirmado. Ahora cruzá el material y el operador con las fichas anteriores.');}
  async function verifySuspect(){if(suspect!=='martina'){setFeedback('Esa ficha no muestra el mismo material. Volvé al panel de sospechosos y compará los objetos de trabajo.');return;}await onComplete();}
  return <section className="movement-register" aria-labelledby="movement-title"><p className="eyebrow">NIVEL 5 · REGISTRO INTERRUMPIDO</p><h2 id="movement-title">Reconstruí el recorrido.</h2>{!recordReady?<div className="movement-check"><label htmlFor="movement-record">¿Qué código recuperaste?</label><input id="movement-record" value={record} onChange={event=>setRecord(event.target.value)} placeholder="Código del registro" autoComplete="off"/><button type="button" className="unlock-button" onClick={verifyRecord}>REGISTRAR CÓDIGO</button></div>:!destinationReady?<div className="movement-check"><label htmlFor="movement-destination">¿A qué destino conduce {record.toUpperCase()}?</label><input id="movement-destination" value={destination} onChange={event=>setDestination(event.target.value)} placeholder="Destino" autoComplete="off"/><button type="button" className="unlock-button" onClick={verifyDestination}>REGISTRAR DESTINO</button></div>:<div className="movement-check"><b>En ese movimiento aparecen T-04 y Resina RX-4. ¿Qué sospechosa viste trabajando con ese material?</b><div className="movement-suspect-grid">{visualSuspects.map(person=>{const value=person.name.split(' ')[0].toLowerCase();const discarded=value==='león';return <button type="button" className={`${suspect===value?'selected':''} ${discarded?'discarded':''}`} onClick={()=>!discarded&&setSuspect(value)} disabled={discarded} aria-label={discarded?`${person.name}, descartado en el nivel anterior`:`Seleccionar a ${person.name}`} key={person.name}><span className="movement-suspect-photo"><img src={person.image} alt=""/>{discarded&&<i aria-hidden="true">DESCARTADO</i>}</span><strong>{person.name}</strong><small>{discarded?'COARTADA VERIFICADA':'SELECCIONAR EXPEDIENTE'}</small></button>})}</div><button type="button" className="unlock-button" disabled={busy||!suspect} onClick={verifySuspect}>REGISTRAR CONEXIÓN</button></div>}{feedback&&<p className="movement-feedback" role="status">{feedback}</p>}</section>;
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
      <figure className={`interrogation-portrait portrait-alive ${speaking?'is-speaking':''}`}><div className="suspect-artwork"><img src={person.image} alt={person.name} /><span className={`suspect-mouth suspect-mouth-${index+1}`} aria-hidden="true"/><button className="suspect-magnifier" type="button" onClick={()=>setViewerIndex(index)} aria-label={`Ampliar fotografía de ${person.name}`}><span aria-hidden="true">⌕</span> AMPLIAR</button></div><figcaption>ARCHIVO F-01 / SUJETO 0{index + 1}</figcaption></figure>
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
      <button className="suspect-viewer-arrow previous" type="button" onClick={()=>setIndex(value=>(value+statements.length-1)%statements.length)} aria-label="Sospechoso anterior">‹</button>
      <figure><div className="suspect-lens-stage" onPointerMove={event=>{const box=event.currentTarget.getBoundingClientRect();setLens({x:Math.max(0,Math.min(100,(event.clientX-box.left)/box.width*100)),y:Math.max(0,Math.min(100,(event.clientY-box.top)/box.height*100))});}} onPointerLeave={()=>setLens(null)}><img src={person.image} alt={`${person.name}, fotografía completa`}/>{lens&&<span className="suspect-detail-lens" aria-hidden="true" style={{left:`${lens.x}%`,top:`${lens.y}%`,backgroundImage:`url(${person.image})`,backgroundPosition:`${lens.x}% ${lens.y}%`}}/>}</div><figcaption><small>FOTOGRAFÍA DE EVIDENCIA · {index+1}/{statements.length}</small><b>{person.name}</b></figcaption></figure>
      <button className="suspect-viewer-arrow next" type="button" onClick={()=>setIndex(value=>(value+1)%statements.length)} aria-label="Siguiente sospechoso">›</button>
    </div>
  </dialog>;
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
  const musicEnabled = useRef(true);
  const musicRef = useRef<HTMLAudioElement>(null);
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

  function receiveState(state: GameState) {
    const elapsed=Math.max(elapsedRef.current,Math.floor(Number(state.elapsedSeconds)||0));elapsedRef.current=elapsed;
    setAgent(state.agent); setHighestLevel(state.highestLevel); setHints(state.hints); setCheckProgress(state.checkProgress); setCompletedAt(state.completedAt); setElapsedSeconds(elapsed); setActiveSession(true);
  }

  useEffect(()=>{
    if(!activeSession||highestLevel<1||completedAt)return;
    const timer=window.setInterval(()=>{elapsedRef.current+=1;setElapsedSeconds(elapsedRef.current);},1000);
    const persist=()=>{void fetch('/los-archivos-f/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'timer',elapsedSeconds:elapsedRef.current})});};
    const saver=window.setInterval(persist,30000);
    const visibility=()=>{if(document.visibilityState==='hidden')persist();};
    document.addEventListener('visibilitychange',visibility);
    return()=>{clearInterval(timer);clearInterval(saver);document.removeEventListener('visibilitychange',visibility);persist();};
  },[activeSession,highestLevel,completedAt]);

  useEffect(() => {
    const localPreview = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('preview') : null;
    if (localPreview) {
      const previewLevel=Number(localPreview.match(/^level([1-7])/)?.[1]||2);const previewDone=localPreview.endsWith('-done');
      setAgent('Filo'); setActiveSession(true); setHighestLevel(localPreview === 'briefing' ? 0 : previewLevel+(previewDone?1:0));
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
      receiveState(data); setSaveStatus('Progreso guardado'); return data as GameState;
    } catch(error) {
      const text = error instanceof Error ? error.message : 'No hay conexión. Volvé a intentar.';
      setMessage(text); setSaveStatus('No se guardó el último cambio. Volvé a intentar.'); return null;
    } finally { setBusy(false); }
  }

  useEffect(() => {
    const player = musicRef.current;
    if (!player) return;
    // Keep one ambient player mounted across access, briefing and case screens.
    const syncVolume = () => {
      const speaking = Array.from(document.querySelectorAll('audio')).some(audio => audio !== player && !audio.paused && !audio.ended);
      player.volume = speaking ? 0.04 : 0.22;
    };
    const start = () => {
      if (!musicEnabled.current || !player.paused) return;
      syncVolume();
      void player.play().then(() => { if (!musicEnabled.current) player.pause(); }).catch(() => {
        // Autoplay may be blocked; a subsequent gesture retries without resetting time.
      });
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
    start();
    return () => {
      document.removeEventListener('pointerdown', gesture, true);
      document.removeEventListener('keydown', gesture, true);
      for (const type of ['play', 'pause', 'ended', 'emptied']) document.removeEventListener(type, syncVolume, true);
      observer.disconnect();
      player.pause();
    };
  }, []);

  function visitLevel(destination: number) {
    if (destination < 0 || destination > highestLevel) return;
    setLevel(destination); setAnswer(''); setMessage(''); setCheckSelection(null); setCheckFeedback(''); setCheckPassed(false); setSelectedStatement(null); setLevelThreeReady(false);
    setLevelThreeDialog(destination===3?'intro':null);
    setLevelFourDialog(destination===4?'intro':null);
    setLateLevelDialog(destination>=5&&destination<=7?{level:destination as 5|6|7,kind:'intro'}:null);
    setLevelTwoIntro(destination===2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const hintsUsed = useMemo(() => Object.values(hints).reduce((a, b) => a + b, 0), [hints]);

  async function access(event: FormEvent) {
    event.preventDefault();
    if (!agent.trim()) { setMessage('Escribí tu nombre o alias de agente.'); return; }
    const state = await gameAction({action:'activate',code,agent,legacy:legacyRef.current?.code === code ? legacyRef.current : undefined});
    if (!state) return;
    setLevel(state.highestLevel); setAnswer(''); setSelectedStatement(null); setShowAccess(false); setScreen('library'); window.scrollTo(0,0);
    setCheckSelection(null); setCheckPassed(false); setCheckFeedback(''); setFinalAnswers({who:'',how:'',where:''});
  }

  async function startInvestigation() {
    if (await gameAction({action:'start'})) setLevel(1);
  }

  function openCaseFile() {
    if(highestLevel===0){setScreen('briefing');}
    else{
      const destination=Math.max(1,level);
      setLevel(destination);setLevelTwoIntro(destination===2);setLevelThreeDialog(destination===3?'intro':null);setLevelFourDialog(destination===4?'intro':null);setLateLevelDialog(destination>=5&&destination<=7?{level:destination as 5|6|7,kind:'intro'}:null);setScreen('game');
    }
    window.scrollTo(0,0);
  }

  async function submitLevel(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!answer.trim()) { setMessage('Elegí una respuesta antes de verificar.'); return; }
    if (await gameAction({action:'unlock',level,answer})) { setMessage(`Desbloqueaste: ${levels[level-1].unlock}.`); setAnswer(''); if(level===2)setLevelTwoSuccess(true);if(level===3)setLevelThreeDialog('success');if(level===4)setLevelFourDialog('success');if(level>=5&&level<=7)setLateLevelDialog({level:level as 5|6|7,kind:'success'}); }
  }

  function continueInvestigation() {
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

  async function requestHint() { return Boolean(await gameAction({action:'hint',level})); }

  async function submitFinal(event: FormEvent) {
    event.preventDefault();
    if (await gameAction({action:'final',...finalAnswers})) setLevel(9);
  }

  async function downloadDiploma() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/los-archivos-f/api/diploma');
      if(!response.ok) throw new Error('No pudimos preparar el diploma. Volvé a intentar.');
      const url=URL.createObjectURL(await response.blob());
      const link=document.createElement('a'); link.href=url; link.download='Diploma-Agencia-F.pdf'; link.click();
      setTimeout(()=>URL.revokeObjectURL(url),10000);
    } catch(error) { setMessage(error instanceof Error ? error.message : 'No se pudo descargar el diploma.'); }
    finally { setBusy(false); }
  }

  async function toggleMusic() {
    const player = musicRef.current;
    if (!player) return;
    const enabled = !musicEnabled.current;
    musicEnabled.current = enabled;
    setMusicOn(enabled);
    if (!enabled) { player.pause(); return; }
    try { await player.play(); if (!musicEnabled.current) player.pause(); }
    catch { /* Retry on the next user gesture if the browser blocks playback. */ }
  }

  return (
    <main className="site-shell" aria-busy={busy}><fieldset className="app-controls" disabled={busy}>
      <nav className="topbar" aria-label="Navegación principal">
        <div className="header-identity">
          <button className="brand brand-button" onClick={() => setScreen('home')} aria-label="Ir al inicio"><img className="brand-logo" src="/los-archivos-f/images/logo-ranking-archivos-f.png" alt="Los Archivos F"/></button>
        </div>
        <div className="nav-tools">{(screen==='home'||screen==='library')&&<div className="nav-celebration">10 OCT · FEDE · 11 AÑOS</div>}<button className={`music-button music-icon-only ${musicOn ? 'on' : ''}`} onClick={toggleMusic} aria-pressed={musicOn} aria-label={musicOn?'Desactivar música ambiente':'Activar música ambiente'} title={musicOn?'Ambiente encendido':'Activar ambiente'}>{musicOn ? '♫' : '♪'}</button></div>
        <audio ref={musicRef} src="/los-archivos-f/audio/ambiente-faro.wav" loop preload="auto" />
      </nav>

      {screen === 'home' && <section className="welcome-page">
        <div className="welcome-heading"><p className="eyebrow">AGENCIA F · ACCESO CONFIDENCIAL</p><h1 className="welcome-title">Bienvenido a Los Archivos F</h1><img className="welcome-logo" src="/los-archivos-f/images/logo-archivos-f.png" alt="Los Archivos F · Escape room digital"/><p>Una misión especial por los <strong>11 años de Fede.</strong></p><span className="welcome-seal">TU AVENTURA COMIENZA ACÁ</span></div>
        <form className="access-card welcome-access" onSubmit={access}><p className="eyebrow dark">IDENTIFICATE, AGENTE</p><h2>¿Listo para el misterio?</h2><p><Typewriter text="Ingresá tu nombre y el código de acceso de tu carpeta."/></p><label htmlFor="welcome-name">Tu nombre o alias</label><input id="welcome-name" value={agent} onChange={e=>setAgent(e.target.value)} placeholder="¿Cómo te llamás, agente?" required maxLength={48} autoComplete="nickname"/><label htmlFor="welcome-code">Código de acceso</label><input id="welcome-code" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="F01-XXXX-XXXX-XXXX-XXXX" required autoComplete="off" autoCapitalize="characters" spellCheck={false}/>{message && <p className="form-error" role="alert">{message}</p>}<button className="primary-button full" type="submit">ENTRAR A LA CÁMARA DE EXPEDIENTES <span>→</span></button><small>Encontrá tu código debajo del QR. No necesitás una cuenta. Podés usar un alias y volver con el mismo código para recuperar tu partida.</small>{activeSession && <button type="button" className="resume-welcome" onClick={()=>{setScreen('library');window.scrollTo(0,0);}}>Continuar con mi partida guardada →</button>}</form>
      </section>}

      {screen === 'briefing' && <Briefing agent={agent} alreadyAccepted={highestLevel>0} onComplete={async()=>{if(highestLevel===0)await startInvestigation();setScreen('game');window.scrollTo(0,0);}}/>}

      {screen === 'library' && <section className="library-page">
        <div className="page-heading"><p className="eyebrow dark">BIENVENIDO, AGENTE {agent.toUpperCase()}</p><h1>La cámara de los expedientes</h1><p><Typewriter text="Un archivo te está esperando. Examiná su portada y abrilo para seguir el rastro. Tu avance queda guardado con el código de tu carpeta."/></p></div>
        <button className="switch-code" onClick={() => {setCode(''); setMessage(''); setShowAccess(true);}}>Ingresar otro código de carpeta</button><div className="case-grid">
          <article className="case-card active"><div className="case-visual case-visual-link" role="button" tabIndex={0} aria-label="Abrir expediente El robo del Rubí del Faro" onClick={openCaseFile} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openCaseFile();}}}><img src="/los-archivos-f/images/hero-archivos-f.png" alt="El rubí rojo sobre un mapa y el faro iluminado junto al mar" /><i className="case-lighthouse-beam" aria-hidden="true"/><span>F-01</span></div><div className="case-copy"><small>CASO DISPONIBLE · DIFICULTAD MEDIA</small><h2>El robo del Rubí del Faro</h2><p>Un rubí robado, cuatro sospechosos y un apagón que investigar.</p><ul><li>7 niveles</li><li>16 desafíos</li><li>60–90 min</li><li>Físico + digital</li></ul><button className="primary-button" onClick={openCaseFile}>ABRIR EXPEDIENTE <span>→</span></button></div></article>
          {[2,3].map((n) => <article className="case-card locked" key={n}><div className="locked-mark">F-0{n}</div><small>EXPEDIENTE CLASIFICADO</small><h2>Próximamente</h2><p>Tu autorización para este caso todavía no fue emitida.</p></article>)}
        </div>
      </section>}

      {screen === 'game' && <section className="game-page">
        <MissionMap level={level} highestLevel={highestLevel} hintsUsed={hintsUsed} elapsedSeconds={elapsedSeconds} hintPanel={level >= 1 && level <= 7 ? <HintLenses key={level} hints={levels[level-1].hints} used={hints[level] || 0} busy={busy} canRequest={!unlocked} onRequest={requestHint}/> : <p className="no-stage-hints">Entrá a un nivel de la investigación para consultar sus pistas.</p>} saveStatus={saveStatus} visitLevel={visitLevel} onMission={()=>{setScreen('briefing');window.scrollTo(0,0);}} onLibrary={()=>{setScreen('library');window.scrollTo(0,0);}}/>

        <div className="investigation-panel">
          {level !== 1 && level !== 2 && level <= 7 && <figure className={`scene-frame ${level === 3?'level-three-weather':level === 4?'level-four-maps':level===5?'level-five-red-corridor':level===6?'level-six-flags':level === 0 ? 'storm-layer' : level === 7 ? 'beam-layer' : 'lamp-layer'}`}><img src={level === 0 ? '/los-archivos-f/images/control-room.jpg' : level===3 ? levelVisuals[2] : level===4&&!unlocked ? '/los-archivos-f/images/nivel-4-sala-planos-v1.png' : level===5&&!unlocked?'/los-archivos-f/images/bg-hidden-corridor.png':level===6&&!unlocked?'/los-archivos-f/images/nivel-6-sala-banderas-v1.png':unlocked ? successVisuals[level - 1] : levelVisuals[level - 1]} alt={level===4?'Sala de cartografía del museo con un plano incompleto sobre la mesa':level===5?'Corredor de mantenimiento iluminado por señales rojas':level===6?'Sala del faro con cinco banderas a distintas alturas y el cartel Seguí la luz':'Escena del Museo del Faro vinculada con la investigación'} />{(level===3||level===6)&&<i className="scene-lighthouse-beam" aria-hidden="true"/>}<span>{unlocked ? 'EVIDENCIA VISUAL DESBLOQUEADA' : 'REGISTRO VISUAL · ARCHIVO F-01'}</span></figure>}
          
          {level === 0 && <section className="mission-intro"><p className="eyebrow dark">ARCHIVO F-01 · MISIÓN ACEPTADA</p><h1>El robo del Rubí del Faro</h1><p><Typewriter text="Robaron el Rubí del Faro. El archivo de las personas presentes quedó bloqueado después del apagón. Recuperá el acceso para comenzar a reconstruir lo que pasó."/></p><p>No abras el sobre negro hasta recibir la autorización de Fede.</p><button className="primary-button" onClick={startInvestigation}>COMENZAR NIVEL 1 <span>→</span></button><button className="reading-choice" onClick={()=>setScreen('briefing')}>Volver a escuchar a Federica</button></section>}

          {level === 1 && <TerminalLevel unlocked={unlocked} busy={busy} message={message} onUnlock={async value=>Boolean(await gameAction({action:"unlock",level:1,answer:value}))} onContinue={continueInvestigation}/>}
          {level >= 2 && level <= 7 && (() => {
            const current = levels[level - 1];
            const checkIndex = unlocked ? microChecks[level - 1].length : checkProgress[level] || 0;
            const currentCheck = level===7 ? undefined : microChecks[level - 1][checkIndex];
            const completedChecks = microChecks[level - 1].length;
            const canUnlock=!unlocked&&level!==5&&!currentCheck&&(level!==3||levelThreeReady);
            return <><section className="level-card">
              <p className="eyebrow dark">{current.kicker}</p><h1>{current.title}</h1>
              {level === 2 && <figure className="level-two-group-scene"><img src="/los-archivos-f/images/suspects-group.jpg" alt="Los cuatro sospechosos reunidos en la sala de entrevistas"/><figcaption>{unlocked?'COARTADA VERIFICADA · REGISTRO CONSERVADO':'REGISTRO DE ENTREVISTAS · CUATRO PERSONAS PRESENTES'}</figcaption></figure>}
              {level === 6 && !unlocked && <div className="investigation-question"><span>PREGUNTA DE INVESTIGACIÓN</span><p>¿En qué orden deben leerse las cinco banderas para que formen un mensaje?</p></div>}
              {level===3&&<details key={`digital-${level}`} className="clue-envelope digital-envelope"><summary><span>◉</span><b>Abrir receptor de señales<small>Seis registros recuperados · tocar para examinar</small></b><span>+</span></summary><div className="digital-brief"><LightSignal onSolved={setLevelThreeReady}/></div></details>}
              {level === 2 && <section className="suspect-board" aria-label="Panel de sospechosos"><div className="suspect-board-heading"><h2>Cuatro versiones. El mismo intervalo.</h2><p>Abrí cada ficha, observá la escena completa y escuchá con atención lo que declara cada persona.</p></div><div className="suspect-grid">{statements.map((person, index) => <button className="suspect-file" key={person.name} onClick={() => setSelectedStatement(index)} aria-label={`Abrir ficha de ${person.name}`}><div className="suspect-file-photo"><img src={person.image} alt="" /></div><div className="suspect-file-caption"><span>{person.role}</span><h3>{person.name}</h3><p>Abrir declaración <span aria-hidden="true">↗</span></p></div></button>)}</div></section>}
              {level === 4 && !unlocked && <LevelFourPlan solved={checkIndex>0} busy={busy} onSolved={async()=>{if(await gameAction({action:'deduction',level:4,index:0,selection:2})){setCheckSelection(null);setCheckFeedback('');setCheckPassed(false);}}}/>}
              {level === 5 && !unlocked && <LevelFiveMovements busy={busy} onComplete={async()=>{if(!await gameAction({action:'deduction',level:5,index:0,selection:1}))return;if(await gameAction({action:'unlock',level:5,answer:'banderas'})){setLateLevelDialog({level:5,kind:'success'});}}}/>}

              {!unlocked && currentCheck && level!==5 && !(level===4&&checkIndex===0) && <div className="micro-challenge"><p className="eyebrow dark">COMPROBACIÓN {checkIndex + 1} DE {completedChecks}</p><h2><Typewriter text={currentCheck.question}/></h2><div className="micro-options">{currentCheck.options.map((option, index) => <button key={option} className={checkSelection === index ? 'selected' : ''} onClick={() => { if (!checkPassed) { setCheckSelection(index); setCheckFeedback(''); } }}>{option}</button>)}</div>{checkFeedback && <p className={checkPassed ? 'micro-success' : 'micro-error'}>{checkPassed ? currentCheck.success : checkFeedback}</p>}{checkPassed ? <button className="primary-button" onClick={continueMicroCheck}>REGISTRAR COMPROBACIÓN <span>→</span></button> : <button className="unlock-button" onClick={() => verifyMicroCheck(currentCheck.correct)}>VERIFICAR</button>}</div>}
              {message && level!==3 && level!==4 && <p className={message.startsWith('Desbloqueaste') ? 'success-message' : 'error-message'}>{message}</p>}
              {unlocked && level >=5 && level<=7 && <div className="unlock-reveal compact"><div className="unlock-icon">✓</div><p className="eyebrow dark">MENSAJE DE FEDE DISPONIBLE</p><h2>{current.unlock}</h2><button className="primary-button" onClick={()=>setLateLevelDialog({level:level as 5|6|7,kind:'success'})}>ESCUCHAR A FEDE <span>→</span></button></div>}
            </section><LevelSideTabs level={level} prompt={current.prompt} placeholder={current.placeholder} answer={answer} busy={busy} unlocked={unlocked} canUnlock={canUnlock} message={message} onAnswer={setAnswer} onReplay={replayLevelIntro} onUnlock={submitLevel}/></>;
          })()}

          {level === 8 && <section className="level-card final-card"><p className="eyebrow dark">ACUSACIÓN FINAL</p><h1>Reconstruí los hechos.</h1><p className="final-intro"><Typewriter text="Una acusación completa debe explicar quién retiró el rubí, cómo lo hizo y dónde escondió el original."/></p><FinalStatement highestLevel={highestLevel}/><details className="completed-deductions"><summary>Preparar la reconstrucción · hoja K-01</summary><p>Antes de enviar, anotá en K-01 qué evidencia sostiene cada respuesta. Podés volver a los niveles resueltos desde Misión.</p><ul><li>Persona: contrastá la nueva declaración D-05 con las fichas D-01 a D-04 y el registro E-01. Separá lo que reconoce Martina de las pruebas que lo corroboran.</li><li>Método: reuní la hora del apagón, el recorrido del plano y lo descubierto en F-01 y H-01.</li><li>Escondite: relacioná I-01, G-02 y el compartimento LF-04.</li></ul><p>Una contradicción por sí sola no demuestra el robo. Buscá una explicación que conecte todas las pruebas.</p></details><form className="final-form" onSubmit={submitFinal}><label>¿Quién retiró el rubí?<select required value={finalAnswers.who} onChange={(e) => setFinalAnswers({...finalAnswers,who:e.target.value})}><option value="">Elegí una persona</option><option value="bruno">Bruno Vidal</option><option value="vera">Vera Salas</option><option value="leon">León Costa</option><option value="martina">Martina Ríos</option></select></label><label>¿Cómo realizó el cambio?<select required value={finalAnswers.how} onChange={(e) => setFinalAnswers({...finalAnswers,how:e.target.value})}><option value="">Elegí una reconstrucción</option><option value="cafeteria">Entró antes y lo escondió en la cafetería</option><option value="corredor">Usó el apagón, el corredor y dejó una réplica</option><option value="terraza">Salió por la terraza con ayuda de seguridad</option></select></label><label>¿Dónde escondió el original?<select required value={finalAnswers.where} onChange={(e) => setFinalAnswers({...finalAnswers,where:e.target.value})}><option value="">Elegí un lugar</option><option value="bolso">En el bolso de trabajo</option><option value="generador">En la sala del generador</option><option value="lente">En la base de la lente de Fresnel</option></select></label><button className="primary-button" type="submit" disabled={busy}>PRESENTAR ACUSACIÓN <span>→</span></button></form>{message && <p className="error-message">{message}</p>}</section>}

          {level === 9 && <section className="resolution-card"><figure className="resolution-fede"><img src="/los-archivos-f/images/federica-caso-cerrado-v2.png" alt="Federica sonríe y presenta el sello de Caso cerrado"/><figcaption>MENSAJE FINAL DE FEDERICA · AGENCIA F</figcaption></figure><div className="resolved-seal">CASO<br /><strong>CERRADO</strong></div><p className="eyebrow">ARCHIVO F-01 RESUELTO</p><h1>Excelente trabajo,<br />agente {agent}.</h1><p>Martina Ríos fabricó una réplica, utilizó el corredor durante el apagón y escondió el rubí original en la base de la lente de Fresnel.</p><p>Quería forzar una investigación sobre la procedencia de la gema. Eso explica su motivo, pero no justifica el robo. El museo deberá aclarar el origen del rubí.</p><p><Typewriter text="Fede está a salvo: fue al faro antiguo a comprobar una teoría y la tormenta la dejó sin señal. Ya podés abrir el paquete de la gema de recuerdo."/></p><audio className="final-audio" controls autoPlay src="/los-archivos-f/audio/fede-caso-cerrado.wav">Tu navegador no puede reproducir este audio.</audio><blockquote>“Un buen detective no solo descubre quién hizo algo. También se pregunta cómo pudo hacerlo, qué pruebas lo demuestran y por qué tomó esa decisión.” <b>— Fede</b></blockquote><div className="result-stats"><span><b>{hintsUsed}</b>Pistas utilizadas</span><span><b>{hintsUsed <= 1 ? 'Detective del Faro' : hintsUsed <= 3 ? 'Especialista en Evidencias' : 'Agente de Investigación'}</b>Rango obtenido</span></div><FinalStatement highestLevel={highestLevel}/><div className="diploma-preview"><span className="diploma-ink-seal" aria-hidden="true">CASO<br/>★<br/>CERRADO</span><p>LOS ARCHIVOS F · AGENCIA F</p><p className="diploma-preview-title">Diploma de reconocimiento</p><h2>{agent}</h2><p>Resolvió El robo del Rubí del Faro</p><strong>{hintsUsed <= 1 ? 'Detective del Faro' : hintsUsed <= 3 ? 'Especialista en Evidencias' : 'Agente de Investigación'}</strong><p>{completedAt ? new Date(completedAt).toLocaleDateString('es-UY',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'America/Montevideo'}) : ''}</p></div><p className="diploma-download-note">Tu diploma lleva el nombre de esta partida y la fecha en que cerraste el caso. Podés volver a descargarlo.</p><button className="primary-button" disabled={busy} onClick={downloadDiploma}>{busy ? 'PREPARANDO DIPLOMA…' : 'DESCARGAR DIPLOMA PDF'} <span>↓</span></button>{message && <p className="error-message" role="alert">{message}</p>}</section>}
        </div>
      </section>}

      {selectedStatement !== null && <InterrogationDialog index={selectedStatement} onClose={() => setSelectedStatement(null)} />}
      {levelTwoIntro&&<LevelTwoIntroDialog onContinue={()=>setLevelTwoIntro(false)}/>}
      {levelTwoSuccess&&<LevelTwoSuccessDialog onContinue={()=>{setLevelTwoSuccess(false);continueInvestigation();}}/>}
      {levelThreeDialog&&<LevelThreeStoryDialog kind={levelThreeDialog} onContinue={()=>{if(levelThreeDialog==='success'){setLevelThreeDialog(null);continueInvestigation();}else setLevelThreeDialog(null);}}/>}
      {levelFourDialog&&<LevelFourStoryDialog kind={levelFourDialog} onContinue={()=>{if(levelFourDialog==='success'){setLevelFourDialog(null);continueInvestigation();}else setLevelFourDialog(null);}}/>}
      {lateLevelDialog&&<LateLevelStoryDialog level={lateLevelDialog.level} kind={lateLevelDialog.kind} onContinue={()=>{const success=lateLevelDialog.kind==='success';setLateLevelDialog(null);if(success)continueInvestigation();}}/>}

      {showAccess && <div className="modal-backdrop" onMouseDown={() => {setShowAccess(false); setMessage('');}}><form className="access-card" onSubmit={access} onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" type="button" onClick={() => setShowAccess(false)}>×</button><p className="eyebrow dark">ACCESO RESTRINGIDO</p><h2>Identificate, agente.</h2><p>Ingresá el código impreso debajo del QR de tu carpeta.</p><label htmlFor="agent-code">Código del expediente</label><input id="agent-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="F01-XXXX-XXXX-XXXX-XXXX" autoComplete="off" /><label htmlFor="agent-name">Nombre o alias</label><input id="agent-name" value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="Tu nombre o alias de agente" maxLength={48} autoComplete="off" />{message && <p className="form-error">{message}</p>}<button className="primary-button full" type="submit">ACTIVAR INVESTIGACIÓN <span>→</span></button><small>No necesitás cuenta de ChatGPT. Cada código abre una partida compartida por tu familia. Usá un alias; no hace falta dar el nombre completo. Guardá tu tarjeta para recuperar el avance.</small></form></div>}
    {busy && <div className="connection-status" role="status">Conectando con la Agencia F…</div>}
    </fieldset></main>
  );
}
