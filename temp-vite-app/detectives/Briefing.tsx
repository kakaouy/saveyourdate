import TransmissionPlayer from './TransmissionPlayer';
import Typewriter from './Typewriter';
import { useState, useRef } from 'react';
import { briefing } from './mission-script';
import { MissionIcon } from './MissionMap';
const dossiers=[
 {title:'La transmisión',subtitle:'¿Quién te necesita?',icon:0,paragraphs:[0,6]},
 {title:'El incidente',subtitle:'¿Qué pasó en el museo?',icon:5,paragraphs:[1]},
 {title:'Los archivos',subtitle:'¿Dónde buscar las pistas?',icon:2,paragraphs:[2,3]},
 {title:'El juramento',subtitle:'¿Cuál es tu misión?',icon:8,paragraphs:[4,5]},
];
export default function Briefing({agent,onComplete}:{agent:string;onComplete:()=>void}) {
 const [ready,setReady]=useState(false);
 const [reading,setReading]=useState(false);
 const [audioFailed,setAudioFailed]=useState(false);
 const [playing,setPlaying]=useState(false);
 const [radioOpen,setRadioOpen]=useState(false);
 const [selected,setSelected]=useState<number|null>(null);
 const [discovered,setDiscovered]=useState<number[]>([]);
 const audio=useRef<HTMLAudioElement>(null);
 function revealArea(id:string){requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'}));}
 function toggleRadio(){
   if(radioOpen){audio.current?.pause();setRadioOpen(false);return;}
   setRadioOpen(true);setAudioFailed(false);
   // Invoke play directly within the tap so mobile browsers allow playback.
   if(audio.current){if(audio.current.ended)audio.current.currentTime=0;void audio.current.play().catch(()=>setAudioFailed(true));}
   revealArea('federica-transmission');
 }
 function discover(index:number){setSelected(index);setDiscovered(previous=>previous.includes(index)?previous:[...previous,index]);}
 return <section className="briefing-page discovery-briefing">
  <figure className="federica-scene"><div className="federica-scene-visual"><img src="/los-archivos-f/images/federica-referencia.jpeg" alt="Federica te espera en el archivo del faro con una carpeta confidencial y una radio"/><span className="lighthouse-beam" aria-hidden="true"/><span className="lighthouse-lamp" aria-hidden="true"/><button className="scene-hotspot radio-hotspot" onClick={toggleRadio} aria-expanded={radioOpen} aria-controls="federica-transmission"><span>◉</span> Sintonizar radio</button><button className="scene-hotspot folder-hotspot" onClick={()=>{setReading(true);discover(2);revealArea('dossier-content');}}><span>⌕</span> Examinar archivos</button></div><figcaption><span className="signal-dot"/> CONTACTO ESTABLECIDO <b>AGENTE FEDERICA · AGENCIA F</b></figcaption></figure>
  <div className="briefing-copy"><p className="eyebrow">EXPLORÁ EL PUESTO SECRETO</p><h1>Agente {agent},<br/>hay algo que debés descubrir.</h1><p className="briefing-deck"><Typewriter text="Federica dejó una transmisión y cuatro documentos. Elegí por dónde empezar: tocá la radio, abrí los archivos y reuní los detalles de tu misión."/></p>
   <div className={`transmission-receiver ${playing?'is-playing':''}`}>
    <button className="transmission-trigger" onClick={toggleRadio} aria-expanded={radioOpen} aria-controls="federica-transmission">
      <span className="transmitter-icon"><img src="/los-archivos-f/images/transmisor-federica.png" alt=""/><i/><i/></span>
      <span>TRANSMISIÓN DE FEDERICA<small>{radioOpen?'Ocultar receptor':'Señal detectada · tocar para sintonizar'}</small></span><b>{radioOpen?'−':'+'}</b>
    </button>
    <div id="federica-transmission" hidden={!radioOpen} className="briefing-player">
      <TransmissionPlayer audioRef={audio} onEnded={()=>setReady(true)} onPlaying={setPlaying} onError={()=>{setAudioFailed(true);setReading(true);}}/>
    </div>
   </div>
   {!reading&&<button className="reading-choice" onClick={()=>{audio.current?.pause();setReading(true);}}>Prefiero leer y explorar la misión</button>}
   {audioFailed&&<p role="status">No pudimos cargar el audio. Podés explorar los cuatro documentos y continuar por lectura.</p>}
   <div className="discovery-heading"><span>DOCUMENTOS CONFIDENCIALES</span><span aria-live="polite">{discovered.length}/4 descubiertos</span></div>
   <div className="dossier-grid">{dossiers.map((item,index)=><button key={item.title} className={`dossier-item ${selected===index?'active':''} ${discovered.includes(index)?'discovered':''}`} aria-pressed={selected===index} aria-controls="dossier-content" onClick={()=>{setReading(true);discover(index);}}><MissionIcon stage={item.icon}/><small>{discovered.includes(index)?'✓ DOCUMENTO ABIERTO':`SELLO 0${index+1} · SIN ABRIR`}</small><strong>{item.title}</strong><span>{item.subtitle}</span></button>)}</div>
   <div id="dossier-content" className="discovered-document" aria-live="polite">{selected===null?<p className="sealed-notice">Cuatro sellos. Cuatro partes de la historia.<br/>Abrí cualquier documento para descubrir su contenido.</p>:<article key={selected}><p className="eyebrow">ARCHIVO REVELADO · 0{selected+1}</p><h2>{dossiers[selected].title}</h2>{dossiers[selected].paragraphs.map(index=><p key={index}><Typewriter text={briefing[index]}/></p>)}</article>}</div>
   {reading&&discovered.length===4&&<label className="briefing-confirm"><input type="checkbox" checked={ready} onChange={e=>setReady(e.target.checked)}/>Leí los cuatro documentos y entendí la misión.</label>}
   <div className="briefing-unlock"><p role="status">{ready?'Autorización concedida. El caso te espera.':'Escuchá la transmisión completa o descubrí los cuatro documentos y confirmá tu lectura.'}</p><button className="primary-button" disabled={!ready} onClick={()=>{audio.current?.pause();onComplete();}}>ACEPTAR MISIÓN Y ACCEDER AL CASO <span>→</span></button></div>
  </div>
 </section>;
}
