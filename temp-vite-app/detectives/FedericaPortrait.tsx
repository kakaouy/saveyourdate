import {useEffect,useState,type RefObject} from 'react';

const scenes={
 intro:'/los-archivos-f/images/federica-nivel-1-inicio-v4.png',
 success:'/los-archivos-f/images/federica-nivel-1-exito-v2.png',
};

export default function FedericaPortrait({audioRef,kind}:{audioRef:RefObject<HTMLAudioElement|null>;kind:'intro'|'success'}) {
 const [speaking,setSpeaking]=useState(false);
 useEffect(()=>{const audio=audioRef.current;if(!audio)return;const play=()=>setSpeaking(true),stop=()=>setSpeaking(false);audio.addEventListener('play',play);audio.addEventListener('pause',stop);audio.addEventListener('ended',stop);return()=>{audio.removeEventListener('play',play);audio.removeEventListener('pause',stop);audio.removeEventListener('ended',stop);};},[audioRef]);
 return <figure className={`federica-story-scene federica-story-${kind}`} role="img" aria-label={kind==='success'?'Federica señala el reloj detenido y sostiene la carpeta de evidencias':'Federica sostiene la carpeta de evidencias en el archivo secreto'}>
  <div className={`fede-artwork level-1-${kind}`}>{kind==='intro'?<picture className="level-one-intro-loop"><source media="(prefers-reduced-motion: reduce)" srcSet="/los-archivos-f/images/federica-nivel-1-inicio-frame-1.png"/><img src="/los-archivos-f/images/federica-nivel-1-inicio-loop.webp" alt=""/></picture>:<><img src={scenes.success} alt=""/><span className="story-light" aria-hidden="true"/><span className="story-dust" aria-hidden="true"/><span className={`fede-mouth ${speaking?'talking':''}`} aria-hidden="true"/><span className="fede-hair" aria-hidden="true"/></>}</div>
  <button className="story-audio-focus" type="button" tabIndex={-1} aria-hidden="true" onClick={()=>void audioRef.current?.play()}/>
 </figure>;
}
