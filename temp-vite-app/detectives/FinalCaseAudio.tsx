import {useRef, useState} from 'react';
import TransmissionPlayer from './TransmissionPlayer';

export default function FinalCaseAudio() {
  const audioRef=useRef<HTMLAudioElement>(null);
  const [failed,setFailed]=useState(false);
  return <section className="final-case-audio" aria-label="Mensaje final de Fede">
    <span className="final-case-audio-light" aria-hidden="true"/>
    <div><small>TRANSMISIÓN FINAL · AGENCIA F</small><TransmissionPlayer audioRef={audioRef} source="/los-archivos-f/audio/fede-caso-cerrado.wav" title="Mensaje de caso cerrado" footnote={false} onEnded={()=>{}} onPlaying={()=>{}} onError={()=>setFailed(true)}/>{failed&&<p role="status">No pudimos reproducir el mensaje. Podés volver a intentarlo.</p>}</div>
  </section>;
}
