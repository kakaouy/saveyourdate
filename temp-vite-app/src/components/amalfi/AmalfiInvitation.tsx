import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { DEFAULT_AURORA_CONFIG, type AuroraConfig, type AuroraLocale, type AuroraPaletteTokens } from '../aurora/config';
import './amalfi.css';

type Props={locale:AuroraLocale;embedded?:boolean;config?:Partial<AuroraConfig>;paletteTokens:AuroraPaletteTokens};
const A='/amalfi/images/';
const modules=[
 ['location','light','icon-map.png','¿Cuándo y dónde?','Sábado, 13 de noviembre, 21:00\nSalón Eventos Premium · Av. Principal 1234, Montevideo','Cómo llegar'],
 ['quote','dark','icon-corazon.png','Una noche inolvidable','“Los momentos más felices se vuelven maravillosos cuando los compartimos con quienes queremos.”',''],
 ['dressCode','accent','icon-dress.png','Código de vestimenta','Elegante formal','Ver detalles'],
 ['schedule','light','icon-music.png','Cronograma','21:00 Recepción · 22:00 Cena · 00:00 Fiesta','Ver cronograma'],
] as const;

export function AmalfiInvitation({embedded=false,config,paletteTokens}:Props){
 const root=useRef<HTMLDivElement>(null); const parallax=useRef<HTMLElement>(null); const music=useRef<HTMLButtonElement>(null); const [modal,setModal]=useState(''); const [slide,setSlide]=useState(0); const [sent,setSent]=useState(false);
 const data=useMemo<AuroraConfig>(()=>({...DEFAULT_AURORA_CONFIG,...config,event:{...DEFAULT_AURORA_CONFIG.event,...config?.event},sections:{...DEFAULT_AURORA_CONFIG.sections,...config?.sections}}),[config]);
 const [clock,setClock]=useState([0,0,0,0]); const photos=[1,2,4,5,6].map(n=>`${A}foto-0${n}.png`);
 useEffect(()=>{const tick=()=>{const d=Math.max(0,new Date(data.event.dateTime).getTime()-Date.now());setClock([Math.floor(d/86400000),Math.floor(d/3600000)%24,Math.floor(d/60000)%60,Math.floor(d/1000)%60])};tick();const id=setInterval(tick,1000);return()=>clearInterval(id)},[data.event.dateTime]);
 useEffect(()=>{const id=setInterval(()=>setSlide(v=>(v+1)%photos.length),4300);return()=>clearInterval(id)},[photos.length]);
 useEffect(()=>{const host=root.current,section=parallax.current;if(!host||!section)return;let frame=0;const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const hostBox=host.getBoundingClientRect(),box=section.getBoundingClientRect();const progress=(hostBox.bottom-box.top)/(hostBox.height+box.height);const shift=(Math.max(0,Math.min(1,progress))-.5)*110;section.style.setProperty('--am-parallax-y',`${shift}px`)})};host.addEventListener('scroll',update,{passive:true});update();return()=>{host.removeEventListener('scroll',update);cancelAnimationFrame(frame)}},[]);
 useEffect(()=>{const host=root.current,button=music.current;if(!embedded||!host||!button)return;let frame=0;const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{button.style.top=`${host.scrollTop+host.clientHeight-button.offsetHeight-14}px`})};host.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);update();return()=>{host.removeEventListener('scroll',update);window.removeEventListener('resize',update);cancelAnimationFrame(frame)}},[embedded]);
 const enabled=(key:keyof AuroraConfig['sections'])=>data.sections[key]!==false;
 const open=(name:string)=>setModal(name); const submit=(e:FormEvent)=>{e.preventDefault();setSent(true)};
 const style={'--am-dark':paletteTokens.acentoOscuro,'--am-accent':paletteTokens.acento,'--am-light':paletteTokens.fondo,'--am-alternate':paletteTokens.alterno} as CSSProperties;
 return <div ref={root} className={`amalfi ${embedded?'am-embedded':''}`} style={style}>
  <main>
   <section className="am-hero"><img className="am-top" src={`${A}ornament--top.png`} alt=""/><div><h1>{data.event.name}</h1><div className="am-date"><span>SÁBADO</span><strong><small>NOVIEMBRE</small>13<small>2027</small></strong><span>21:00 HRS</span></div><p>MIS QUINCE</p></div><img className="am-bottom" src={`${A}ornament-bottom.png`} alt=""/><small>DESLIZÁ PARA DESCUBRIR ↓</small></section>
   {enabled('countdown')&&<section className="am-section am-accent"><p className="am-eye">FALTA MUY POCO</p><h2>Cuenta regresiva</h2><div className="am-count">{clock.map((n,i)=><div key={i}><strong>{String(n).padStart(2,'0')}</strong><span>{['Días','Horas','Minutos','Segundos'][i]}</span></div>)}</div></section>}
   {modules.map(([key,tone,icon,title,text,button],i)=>enabled(key)&&<div className="am-module" key={key}><Orn side={i%2===0?'right':'left'} src={i%2===0?'lado_der.png':'orna--izq.png'}/><section className={`am-section am-${tone}`}><TintIcon src={icon}/><h2>{title}</h2><p>{text}</p>{key==='location'?<div className="am-actions"><button onClick={()=>open(key)}>{button}</button><button>Agendar evento</button></div>:button&&<button onClick={()=>open(key)}>{button}</button>}</section></div>)}
   {enabled('parallax')&&<section ref={parallax} className="am-parallax"><img src={`${A}foto-03.png`} alt=""/><h2>¡Te espero para celebrar!</h2></section>}
   {enabled('gallery')&&<section className="am-section am-dark am-gallery"><TintIcon src="icon-galeria.png"/><h2>Galería de fotos</h2><p>Un recorrido por momentos inolvidables.</p><div className="am-gallery-stage"><button onClick={()=>setSlide((slide-1+photos.length)%photos.length)}>‹</button><div className="am-gallery-strip">{[-1,0,1].map(offset=>{const index=(slide+offset+photos.length)%photos.length;return <img key={`${slide}-${offset}`} src={photos[index]} alt={`Galería de Micaela ${index+1}`}/>})}</div><button onClick={()=>setSlide((slide+1)%photos.length)}>›</button></div><div className="am-gallery-dots">{photos.map((_,i)=><button key={i} className={i===slide?'active':''} onClick={()=>setSlide(i)} aria-label={`Ver foto ${i+1}`}/>)}</div></section>}
   <Orn side="right" src="lado_der.png"/>
   {enabled('gifts')&&<Card tone="light" icon="icon-gift.png" title="Mesa de regalos" text="Tu presencia es nuestro mejor regalo." button="Ver cuenta o lista" onClick={()=>open('gifts')}/>} 
   {enabled('photoUpload')&&<Card tone="dark" icon="icon-photo.png" title="Compartí tus fotos" text="Subí tus fotos al álbum colaborativo." button="Subir fotos"/>}
   <Orn side="left" src="orna--izq.png"/>
   {enabled('social')&&<Card tone="accent" icon="icon-insta.png" title="Instagram y redes" text="Etiquetanos usando #Micaela15" button="Ver Instagram"/>}
   {enabled('songSuggestions')&&<Card tone="light" icon="icon-music.png" title="Spotify" text="¿Qué canción no puede faltar?" button="Sugerí música" onClick={()=>open('music')}/>} 
   <Orn side="right" src="lado_der.png"/>
   {enabled('qrPass')&&<Card tone="dark" icon="icon-qr.png" title="Tu pase" text="Presentá tu código QR en la entrada." button="Ver pase QR" onClick={()=>open('qr')}/>} 
   {enabled('rsvp')&&<Card tone="accent" icon="icon-rsvp.png" title="Confirmación de asistencia" text="Respondé antes del 1 de noviembre." button="Confirmar asistencia" onClick={()=>open('rsvp')}/>} 
  </main><footer className="am-footer"><strong>Save Your Date</strong><p>Invitaciones digitales para momentos inolvidables</p><hr/><small>© 2026 Save Your Date · Todos los derechos reservados</small></footer>
  <button ref={music} className="am-music" aria-label="Música" type="button">♪</button>
  {modal&&<div className="am-modal"><div><button className="am-close" type="button" aria-label="Cerrar" onClick={()=>setModal('')}>×</button>{modal==='rsvp'?(sent?<><h2>¡Gracias!</h2><p>Tu respuesta fue registrada.</p></>:<><h2>Confirmar asistencia</h2><form onSubmit={submit}><input required placeholder="Nombre completo"/><select required defaultValue=""><option value="" disabled>¿Vas a asistir?</option><option>Sí, voy a asistir</option><option>No voy a poder asistir</option></select><select><option>Sin restricciones alimentarias</option><option>Vegetariano/a</option><option>Vegano/a</option></select><textarea placeholder="Mensaje para la anfitriona"/><button>Confirmar</button></form></>):<><h2>{modal==='gifts'?'Mesa de regalos':modal==='music'?'Sugerí una canción':modal==='qr'?'Tu pase digital':'Más información'}</h2><p>Contenido de demostración de la invitación.</p>{modal==='music'&&<form><input placeholder="Canción y artista"/><button>Enviar</button></form>}</>}</div></div>}
 </div>
}

function TintIcon({src}:{src:string}){return <span className="am-icon" style={{maskImage:`url(${A}${src})`,WebkitMaskImage:`url(${A}${src})`}}/>}
function Orn({side,src}:{side:'left'|'right';src:string}){return <div className={`am-orn am-orn-${side}`}><img src={`${A}${src}`} alt=""/></div>}
function Card({tone,icon,title,text,button,onClick}:{tone:'light'|'accent'|'dark';icon:string;title:string;text:string;button:string;onClick?:()=>void}){return <section className={`am-section am-${tone}`}><TintIcon src={icon}/><h2>{title}</h2><p>{text}</p><button onClick={onClick}>{button}</button></section>}
