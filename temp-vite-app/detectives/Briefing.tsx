import { useState, useRef } from 'react';
import { briefing } from './mission-script';
export default function Briefing({agent, onComplete}: {agent:string; onComplete:()=>void}) {
 const [ready,setReady]=useState(false);
 const [reading,setReading]=useState(false);
 const [audioFailed,setAudioFailed]=useState(false);
 const audio=useRef<HTMLAudioElement>(null);
 return <section className="briefing-page">
  <figure className="federica-scene"><img src="/los-archivos-f/images/federica-referencia.jpeg" alt="La agente Federica de incógnito en el archivo del faro, con una carpeta confidencial y una radio"/><figcaption><span className="signal-dot"/> TRANSMISIÓN CONFIDENCIAL <b>AGENTE FEDERICA · AGENCIA F</b></figcaption></figure>
  <div className="briefing-copy"><p className="eyebrow">SOLO PARA AGENTES AUTORIZADOS</p><h1>Agente {agent},<br/>necesito tu ayuda.</h1><p className="briefing-deck">Un rubí desaparecido. Cuatro sospechosos.<br/>La próxima pista está en tus manos.</p>
   <div className="briefing-player"><label htmlFor="federica-audio">Escuchá el mensaje de Federica</label><audio id="federica-audio" ref={audio} controls preload="metadata" src="/los-archivos-f/audio/federica-bienvenida.wav" onEnded={()=>setReady(true)} onPlay={()=>window.dispatchEvent(new Event('briefing-play'))} onError={()=>{setAudioFailed(true);setReading(true);}}/><small>Narración con voz sintética · texto completo disponible abajo.</small></div>
   {!reading && <button className="reading-choice" onClick={()=>{audio.current?.pause();setReading(true);}}>Prefiero leer la misión</button>}
   {audioFailed && <p role="status">El audio no pudo cargarse. Podés leer el mensaje completo y continuar.</p>}
   <div className="briefing-transcript" aria-label="Mensaje completo de Federica">{briefing.map((text,index)=><p key={index}>{text}</p>)}</div>
   {reading && <label className="briefing-confirm"><input type="checkbox" checked={ready} onChange={e=>setReady(e.target.checked)}/>Leí el mensaje completo y entendí la misión.</label>}
   <div className="briefing-unlock"><p role="status">{ready ? 'Autorización concedida. Ya podés acceder al caso.' : 'Completá el audio o elegí leer la misión para habilitar el expediente.'}</p><button className="primary-button" disabled={!ready} onClick={()=>{audio.current?.pause();onComplete();}}>ACEPTAR MISIÓN Y ACCEDER AL CASO <span>→</span></button></div>
  </div>
 </section>;
}
