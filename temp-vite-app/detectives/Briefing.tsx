import TransmissionPlayer from './TransmissionPlayer';
import { briefingCues } from './briefing-cues';
import Typewriter from './Typewriter';
import { useState, useRef, useEffect } from 'react';
import { briefing } from './mission-script';
import { MissionIcon } from './MissionMap';
const dossiers=[
 {title:'La transmisión',subtitle:'¿Quién te necesita?',icon:0,paragraphs:[0]},
 {title:'El incidente',subtitle:'¿Qué pasó en el museo?',icon:5,paragraphs:[1]},
 {title:'Los archivos',subtitle:'¿Dónde buscar las pistas?',icon:2,paragraphs:[2,3]},
 {title:'El juramento',subtitle:'¿Cuál es tu misión?',icon:8,paragraphs:[4,5,6]},
];
export default function Briefing({agent,alreadyAccepted,onComplete}:{agent:string;alreadyAccepted:boolean;onComplete:()=>void}) {
 const [available,setAvailable]=useState(0);
 const [following,setFollowing]=useState(false);
 const [ready,setReady]=useState(false);
 const [reading,setReading]=useState(false);
 const [audioFailed,setAudioFailed]=useState(false);
 const [playing,setPlaying]=useState(false);
 const [radioOpen,setRadioOpen]=useState(false);
 const [selected,setSelected]=useState<number|null>(null);
 const [discovered,setDiscovered]=useState<number[]>([]);
 const audio=useRef<HTMLAudioElement>(null);
 const documentAudio=useRef<HTMLAudioElement>(null);
 const [documentPlaying,setDocumentPlaying]=useState(false);
 const [guideOpen,setGuideOpen]=useState(false);
 const guideTimer=useRef<ReturnType<typeof setTimeout> | null>(null);
 const documents=useRef<HTMLDivElement>(null);
 useEffect(()=>()=>{if(guideTimer.current)clearTimeout(guideTimer.current);},[]);
 function explainDocuments(){
   if(guideTimer.current)clearTimeout(guideTimer.current);
   setGuideOpen(true);
   documents.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
   documents.current?.querySelector<HTMLButtonElement>('.dossier-item:not(.discovered)')?.focus({preventScroll:true});
   guideTimer.current=setTimeout(()=>setGuideOpen(false),4000);
 }

 function revealArea(id:string){requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'}));}
 function toggleRadio(){
   documentAudio.current?.pause();setDocumentPlaying(false);
   if(radioOpen){audio.current?.pause();setRadioOpen(false);return;}
   setRadioOpen(true);setAudioFailed(false);setFollowing(true);
   // Invoke play directly within the tap so mobile browsers allow playback.
   if(audio.current){if(audio.current.ended)audio.current.currentTime=0;void audio.current.play().catch(()=>setAudioFailed(true));}
   revealArea('federica-transmission');
 }
 function discover(index:number){
   audio.current?.pause();setFollowing(false);setSelected(index);setReading(true);setRadioOpen(false);
   setAvailable(previous=>Math.max(previous,Math.min(3,index+1)));
   setDiscovered(previous=>previous.includes(index)?previous:[...previous,index]);
   requestAnimationFrame(()=>{const player=documentAudio.current;if(!player)return;player.src=`/los-archivos-f/audio/federica-documento-${index+1}-v1.wav`;player.currentTime=0;void player.play().catch(()=>setDocumentPlaying(false));});
 }
 const canAccept=alreadyAccepted||ready||discovered.length===4;
 return <section className="briefing-page discovery-briefing">
  <div className="briefing-left"><figure className="federica-scene"><div className="federica-scene-visual"><img src="/los-archivos-f/images/federica-referencia.jpeg" alt="Federica te espera en el archivo del faro con una carpeta confidencial y una radio"/><span className="lighthouse-beam" aria-hidden="true"/><span className="lighthouse-lamp" aria-hidden="true"/><button className="scene-hotspot radio-hotspot" onClick={toggleRadio} aria-expanded={radioOpen} aria-controls="federica-transmission"><span>◉</span> Sintonizar radio</button><button className="scene-hotspot folder-hotspot" onClick={()=>{discover(0);revealArea('dossier-content');}}><span>⌕</span> Examinar archivos</button></div><figcaption><span className="signal-dot"/> CONTACTO ESTABLECIDO <b>AGENTE FEDERICA · AGENCIA F</b></figcaption></figure><section className="mission-acceptance dossier-folio"><h2>¿Aceptás la misión?</h2><p>Revisá los documentos para acceder y abrir el expediente. El Rubí del Faro nos está esperando.</p><div className="briefing-unlock"><p>Podés escuchar la transmisión completa o abrir los cuatro documentos. No hace falta terminar cada audio: con recorrerlos alcanza.</p>{canAccept&&<p role="status">{alreadyAccepted?'La misión sigue disponible para consultarla cuando quieras.':'Autorización concedida. El caso te espera.'}</p>}<button className="primary-button" disabled={!canAccept} onClick={()=>{audio.current?.pause();documentAudio.current?.pause();onComplete();}}>{alreadyAccepted?'VOLVER A LA INVESTIGACIÓN':'ACEPTAR MISIÓN Y COMENZAR NIVEL 1'} <span>→</span></button>{!canAccept&&<button className="reading-choice" onClick={explainDocuments}>Mostrar qué falta</button>}</div></section></div>
  <div className="briefing-copy"><p className="eyebrow">EXPLORÁ EL PUESTO SECRETO</p><h1>Agente {agent},<br/>hay algo que debés descubrir.</h1><p className="briefing-deck"><Typewriter text="Federica dejó una transmisión y cuatro documentos. Escuchá la radio o descubrí los documentos, una parte a la vez, para reunir los detalles de tu misión."/></p>
   <div className={`transmission-receiver ${playing?'is-playing':''}`}>
    <button className="transmission-trigger" onClick={toggleRadio} aria-expanded={radioOpen} aria-controls="federica-transmission">
      <span className="transmitter-icon"><img src="/los-archivos-f/images/transmisor-federica.png" alt=""/><i/><i/></span>
      <span>TRANSMISIÓN DE FEDERICA<small>{radioOpen?'Ocultar receptor':'Señal detectada · tocar para sintonizar'}</small></span><b>{radioOpen?'−':'+'}</b>
    </button>
    <div id="federica-transmission" hidden={!radioOpen} className="briefing-player">
      <TransmissionPlayer audioRef={audio} onEnded={()=>{setReady(true);setAvailable(3);setDiscovered([0,1,2,3]);}} onProgress={time=>{if(!following)return;let part=0;briefingCues.forEach((cue,i)=>{if(time>=cue)part=i;});const doc=dossiers.findIndex(d=>d.paragraphs.includes(part));setSelected(doc);setAvailable(v=>Math.max(v,doc));setDiscovered(v=>v.includes(doc)?v:[...v,doc]);}} onPlaying={value=>{setPlaying(value);if(value)setFollowing(true);}} onError={()=>{setAudioFailed(true);setReading(true);}}/>
    </div>
   </div>
   {!reading&&<button className="reading-choice" onClick={()=>discover(0)}>Prefiero leer y explorar la misión</button>}
   {audioFailed&&<p role="status">No pudimos cargar el audio. Podés explorar los cuatro documentos y continuar por lectura.</p>}
   <div className="discovery-heading"><span>DOCUMENTOS CONFIDENCIALES</span><span aria-live="polite">{discovered.length}/4 descubiertos</span></div>
   {guideOpen&&<div className="document-guide-shade" aria-hidden="true" onClick={()=>setGuideOpen(false)}/>}
   <div ref={documents} className={`dossier-grid ${guideOpen?'documents-highlighted':''}`} onKeyDown={e=>{if(e.key==='Escape')setGuideOpen(false);}}>{guideOpen&&<div className="document-guide-message" role="status"><span>Abrí los cuatro archivos para habilitar la misión.</span><svg viewBox="0 0 80 45" aria-hidden="true"><path d="M4 6Q60-2 56 31M44 23l12 12 13-11"/></svg></div>}{dossiers.map((item,index)=><button key={item.title} className={`dossier-item ${selected===index?'active':''} ${discovered.includes(index)?'discovered':''}`} disabled={index>available} aria-pressed={selected===index} aria-controls="dossier-content" onClick={()=>discover(index)}><MissionIcon stage={item.icon}/><small>{discovered.includes(index)?'✓ DOCUMENTO ABIERTO':`SELLO 0${index+1} · SIN ABRIR`}</small><strong>{item.title}</strong><span>{item.subtitle}</span></button>)}</div>
   <div className="dossier-folio"><i className="folio-rivet rivet-tl" aria-hidden="true"/><i className="folio-rivet rivet-tr" aria-hidden="true"/><i className="folio-rivet rivet-bl" aria-hidden="true"/><i className="folio-rivet rivet-br" aria-hidden="true"/><div id="dossier-content" className="discovered-document" aria-live="polite">{selected===null?<p className="sealed-notice">Cuatro sellos. Cuatro partes de la historia.<br/>Abrí el primer documento para comenzar.</p>:<article key={selected}><div className="folio-heading"><p className="eyebrow">ARCHIVO REVELADO · 0{selected+1}</p><div className={`recovered-stamp ${documentPlaying?'voice-playing':''}`} aria-hidden="true"><b>AUDIO DEL DOCUMENTO</b><span>DE: FEDERICA · AGENCIA F</span><svg className="voice-wave" viewBox="0 0 120 24"><path d="M0 12h120"/>{[8,18,10,22,12,6,20,14,9,24,16,8,21,12,6,17,9,12].map((height,index)=><line key={index} className="voice-wave-bar" x1={8+index*6} x2={8+index*6} y1={12-height/2} y2={12+height/2} style={{animationDelay:`${-index*.13}s`,animationDuration:`${.55+(index%5)*.12}s`}}/>)}</svg></div></div><h2>{dossiers[selected].title}</h2><p>{dossiers[selected].paragraphs.map(index=>briefing[index]).join(' ')}</p><TransmissionPlayer audioRef={documentAudio} source={`/los-archivos-f/audio/federica-documento-${selected+1}-v1.wav`} title={`Documento confidencial 0${selected+1}`} footnote={false} onEnded={()=>setDocumentPlaying(false)} onPlaying={setDocumentPlaying} onError={()=>setDocumentPlaying(false)}/><button className="reading-choice" onClick={()=>{if(selected<3)discover(selected+1);else setReady(true);}}>{selected<3?'Abrir siguiente documento':'Misión revisada'} →</button></article>}<div className="folio-marks" aria-hidden="true"><span className="fingerprint-window"><img className="folio-fingerprint-image" src="/los-archivos-f/images/huella-referencia-v1.jpeg" alt=""/></span><span>VERITAS<br/>IN<br/>SINGULIS</span><div className="confidential-stamp">EXPEDIENTE<MissionIcon stage={0}/><span>CONFIDENCIAL</span></div></div></div>
   </div>
  </div>
 </section>;
}
