import TransmissionPlayer from './TransmissionPlayer';
import {useRef,useState} from 'react';

export default function Briefing({agent,alreadyAccepted,onComplete}:{agent:string;alreadyAccepted:boolean;onComplete:()=>void}) {
 const [radioOpen,setRadioOpen]=useState(false);
 const [audioFailed,setAudioFailed]=useState(false);
 const audio=useRef<HTMLAudioElement>(null);
 function toggleRadio(){
  if(radioOpen){audio.current?.pause();setRadioOpen(false);return;}
  setRadioOpen(true);setAudioFailed(false);
  requestAnimationFrame(()=>void audio.current?.play().catch(()=>setAudioFailed(true)));
 }
 return <section className="briefing-page discovery-briefing briefing-compact">
  <div className="briefing-left">
   <figure className="federica-scene"><div className="federica-scene-visual transmitter-story-frames"><picture><source media="(prefers-reduced-motion: reduce)" srcSet="/los-archivos-f/images/federica-transmisor-frame-1.png"/><img className="transmitter-story-loop" src="/los-archivos-f/images/federica-transmisor-loop.webp" alt="Federica espera en el archivo del faro con una radio"/></picture><button className="scene-hotspot radio-hotspot" onClick={toggleRadio} aria-expanded={radioOpen} aria-controls="federica-transmission"><span>◉</span> {radioOpen?'Cerrar mensaje':'Reproducir mensaje'}</button></div><figcaption><span className="signal-dot"/> TRANSMISIÓN RECUPERADA <b>FEDERICA · AGENCIA F</b></figcaption></figure>
  </div>
  <div className="briefing-copy briefing-compact-copy">
   <p className="eyebrow">ARCHIVO F-01 · TRANSMISIÓN RECUPERADA</p>
   <h1>Agente {agent},<br/>robaron el Rubí del Faro.</h1>
   <p className="briefing-deck">Seguí las pruebas y descubrí quién cambió la gema. Fede salió hacia el faro antiguo para comprobar una teoría; la tormenta interrumpió su señal, pero dejó instrucciones para guiarte.</p>
   <div className={`transmission-receiver ${radioOpen?'is-playing':''}`}>
    <button className="transmission-trigger" onClick={toggleRadio} aria-expanded={radioOpen} aria-controls="federica-transmission"><span className="transmitter-icon"><img src="/los-archivos-f/images/transmisor-federica.png" alt=""/><i/><i/></span><span>MENSAJE DE FEDERICA<small>{radioOpen?'Ocultar transmisión':'Audio opcional · tocar para escuchar'}</small></span><b>{radioOpen?'−':'+'}</b></button>
    <div id="federica-transmission" hidden={!radioOpen} className="briefing-player"><TransmissionPlayer audioRef={audio} onEnded={()=>{}} onPlaying={()=>{}} onError={()=>setAudioFailed(true)}/></div>
   </div>
   {audioFailed&&<p role="status">El audio no está disponible. Podés comenzar igualmente.</p>}
   <section className="mission-acceptance dossier-folio briefing-fast-start"><h2>{alreadyAccepted?'Continuá la investigación.':'¿Aceptás la misión?'}</h2><p>Tené cerca los sobres. Te avisaremos cuándo usarlos.</p><button className="primary-button" onClick={()=>{audio.current?.pause();onComplete();}}>{alreadyAccepted?'CONTINUAR':'ACEPTAR Y COMENZAR'} <span>→</span></button></section>
  </div>
 </section>;
}
