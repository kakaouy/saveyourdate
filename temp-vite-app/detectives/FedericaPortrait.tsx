import type { RefObject } from 'react';

const scenes={
 intro:'/los-archivos-f/images/federica-nivel-1-inicio-v2.png',
 success:'/los-archivos-f/images/federica-nivel-1-exito-v2.png',
};

export default function FedericaPortrait({audioRef,kind}:{audioRef:RefObject<HTMLAudioElement|null>;kind:'intro'|'success'}) {
 return <figure className={`federica-story-scene federica-story-${kind}`} role="img" aria-label={kind==='success'?'Federica señala el reloj detenido y sostiene la carpeta de evidencias':'Federica sostiene la carpeta de evidencias en el archivo secreto'}>
  <img src={scenes[kind]} alt=""/>
  <span className="story-light" aria-hidden="true"/>
  <span className="story-dust" aria-hidden="true"/>
  <span className="story-blink story-blink-left" aria-hidden="true"/>
  <span className="story-blink story-blink-right" aria-hidden="true"/>
  <button className="story-audio-focus" type="button" tabIndex={-1} aria-hidden="true" onClick={()=>void audioRef.current?.play()}/>
 </figure>;
}
