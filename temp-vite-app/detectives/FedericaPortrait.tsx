import type {RefObject} from 'react';

export default function FedericaPortrait({audioRef,kind}:{audioRef:RefObject<HTMLAudioElement|null>;kind:'intro'|'success'}) {
 const intro=kind==='intro';
 return <figure className={`federica-story-scene federica-story-${kind}`} role="img" aria-label={kind==='success'?'Federica señala un reloj cuyo segundero completa una vuelta y sostiene la carpeta de evidencias':'Federica sostiene la carpeta de evidencias en el archivo secreto'}>
  <div className={`fede-artwork level-1-${kind}`}><picture className="level-one-story-loop"><source media="(prefers-reduced-motion: reduce)" srcSet={intro?'/los-archivos-f/images/federica-nivel-1-inicio-frame-1.png':'/los-archivos-f/images/federica-nivel-1-final-frame-1.webp'}/><img src={intro?'/los-archivos-f/images/federica-nivel-1-inicio-loop.webp':'/los-archivos-f/images/federica-nivel-1-final-loop.webp'} alt=""/></picture></div>
  <button className="story-audio-focus" type="button" tabIndex={-1} aria-hidden="true" onClick={()=>void audioRef.current?.play()}/>
 </figure>;
}
