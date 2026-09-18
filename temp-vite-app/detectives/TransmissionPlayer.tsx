import { useState, useId, type RefObject, type CSSProperties } from 'react';
const format = (value: number) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2,'0')}`;
export default function TransmissionPlayer({ audioRef, onEnded, onError, onPlaying, onProgress, source="/los-archivos-f/audio/federica-bienvenida-v3.wav", title="Escuchá el mensaje completo de Federica", footnote=true }: {
  audioRef: RefObject<HTMLAudioElement | null>; onEnded: () => void; onError: () => void; onPlaying: (playing: boolean) => void; onProgress?: (time:number)=>void; source?:string; title?:string; footnote?:boolean;
}) {
  const id=useId();
  const [playing,setPlaying] = useState(false);
  const [position,setPosition] = useState(0);
  const [duration,setDuration] = useState(0);
  const [muted,setMuted] = useState(false);
  const [expanded,setExpanded] = useState(false);
  const [volume,setVolume] = useState(1);
  const state = (value: boolean) => { setPlaying(value); onPlaying(value); };
  const toggle = () => { const player=audioRef.current; if(!player)return; if(!player.paused)player.pause();else{if(player.ended)player.currentTime=0;void player.play().catch(onError);} };
  return <div className="transmission-console">
    <label className="transmission-label" htmlFor={`${id}-seek`}>{title}</label>
    <audio id={`${id}-audio`} ref={audioRef} preload="metadata" src={source}
      onLoadedMetadata={e=>setDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0)}
      onDurationChange={e=>setDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0)}
      onTimeUpdate={e=>{setPosition(e.currentTarget.currentTime);onProgress?.(e.currentTarget.currentTime);}} onPlay={()=>state(true)} onPause={()=>state(false)}
      onEnded={()=>{state(false);onEnded();}} onError={()=>{state(false);onError();}}/>
    <div className="brass-player" role="group" aria-label="Reproductor de la transmisión de Federica">
      <button className="brass-play" onClick={toggle} aria-label={playing?'Pausar mensaje de Federica':'Reproducir mensaje de Federica'}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{playing?<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>:<path d="M7 3l15 9-15 9z"/>}</svg>
      </button>
      <span className="transmission-time" aria-hidden="true">{format(position)} / {format(duration)}</span>
      <input id={`${id}-seek`} className="brass-seek" type="range" min="0" max={duration || 1} step="0.1" value={position} disabled={!duration}
        aria-label="Posición del mensaje" aria-valuetext={`${format(position)} de ${format(duration)}`}
        style={{'--played':`${duration?position/duration*100:0}%`} as CSSProperties}
        onChange={e=>{const value=Number(e.target.value);if(audioRef.current)audioRef.current.currentTime=value;setPosition(value);}}/>
      <button className="brass-volume" aria-label={muted?'Activar voz de Federica':'Silenciar voz de Federica'} aria-pressed={muted} onClick={()=>{if(audioRef.current){audioRef.current.muted=!muted;setMuted(!muted);}}}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-5v16l-5-5H3z"/>{muted?<path d="m16 8 6 8m0-8-6 8" fill="none" stroke="currentColor" strokeWidth="2"/>:<path d="M16 7q7 5 0 10" fill="none" stroke="currentColor" strokeWidth="2"/>}</svg>
      </button>
      <button className="brass-options" aria-label="Opciones del mensaje" aria-expanded={expanded} aria-controls={`${id}-options`} onClick={()=>setExpanded(!expanded)}>⋮</button>
    </div>
    {expanded&&<div className="transmission-options" id={`${id}-options`}><label>Volumen de voz<input type="range" min="0" max="1" step="0.05" value={volume} onChange={e=>{const value=Number(e.target.value);if(audioRef.current){audioRef.current.volume=value;audioRef.current.muted=false;}setMuted(false);setVolume(value);}}/></label><button onClick={()=>{if(audioRef.current)audioRef.current.currentTime=0;setPosition(0);}}>Volver al inicio</button></div>}
    {footnote&&<small className="transmission-footnote"><span aria-hidden="true">⌕</span> También podés descubrir el mensaje en los cuatro documentos.</small>}
  </div>;
}
