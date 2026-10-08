import {useRef,useState} from 'react';
import TransmissionPlayer from './TransmissionPlayer';

export default function FinalStatement({highestLevel}: {highestLevel:number}) {
  const audio=useRef<HTMLAudioElement>(null);
  const [audioError,setAudioError]=useState(false);
  if (highestLevel < 8) return null;
  return <section className="martina-final-audio" aria-labelledby="martina-audio-title">
    <img src="/los-archivos-f/images/martina-portrait.jpg" alt="Martina Ríos"/>
    <div><p className="eyebrow">REGISTRO DE AUDIO · MARTINA RÍOS</p><h2 id="martina-audio-title">Escuchá a Martina antes de acusar.</h2><TransmissionPlayer audioRef={audio} source="/los-archivos-f/audio/interrogatorio-martina.wav" title="DECLARACIÓN RECUPERADA · MARTINA RÍOS" speaker="Martina" footnote={false} onEnded={()=>{}} onPlaying={()=>{}} onError={()=>setAudioError(true)}/>{audioError&&<p className="audio-error" role="alert">No se pudo reproducir el registro. Volvé a intentarlo.</p>}</div>
  </section>;
}
