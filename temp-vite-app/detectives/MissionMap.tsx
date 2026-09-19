import { useEffect, useRef, useState, type ReactNode } from 'react';
import { levels } from './case';

export function MissionIcon({stage}: {stage:number}) {
 const art = [
  <g><path d="M8 22V14h16l5 6h25v30H8Z"/><path d="m8 29 7-6h40l-6 27H8"/><circle cx="34" cy="36" r="13"/><path className="compass-needle" d="m40 29-3 10-10 5 4-11Z"/></g>,
  <g><rect x="6" y="10" width="52" height="36" rx="4"/><path d="M12 16h40v23H12ZM25 46v7m14-7v7M18 55h28M19 23l5 5-5 5m11 0h10"/></g>,
  <g><path d="m7 15 16-5 18 6 16-5v39l-16 5-18-6-16 5ZM23 10v39M41 16v39"/><ellipse cx="29" cy="27" rx="4" ry="7" transform="rotate(-25 29 27)"/><ellipse cx="38" cy="41" rx="4" ry="7" transform="rotate(25 38 41)"/><path d="m25 17-2-3m16 17 2-3"/></g>,
  <g><path d="m22 53 5-32h10l5 32M25 21v-9h14v9ZM23 12l9-7 9 7M17 55h30M29 47v-7h6v7M28 29h8"/><path className="lighthouse-rays" d="m18 16-12-5m12 10-12 4m40-9 12-5m-12 10 12 4"/></g>,
  <g><path d="M9 52V10h31v13M15 47V16h19M15 16l10 6v24l-10 1"/><circle cx="40" cy="36" r="12"/><path d="m49 45 10 12M35 36h10m-5-5v10"/></g>,
  <g><path d="m10 23 10-12h24l10 12-22 31ZM10 23h44M20 11l12 43 12-43M20 11l12 12 12-12"/><path className="icon-spark" d="M53 6v8m-4-4h8M7 40v8m-4-4h8"/></g>,
  <g><rect x="10" y="10" width="44" height="44" rx="4"/><circle cx="32" cy="32" r="18"/><circle cx="32" cy="32" r="13"/><circle cx="32" cy="32" r="8"/><path d="M27 8h10M27 56h10"/></g>,
  <g><rect x="9" y="12" width="46" height="42" rx="4"/><path d="M15 18h34v29H15ZM27 12V8h10v4"/><circle cx="32" cy="33" r="9"/><path className="compass-needle" d="M32 24v18M23 33h18"/><path d="M18 51h5m18 0h5"/></g>,
  <g><path d="M10 18h17l5 6h23v29H10ZM16 18V9h31v15M23 16h17M19 35h12m-12 7h9"/><circle cx="42" cy="39" r="9"/><path d="m38 39 3 3 5-6"/></g>,
  <g><path d="m6 24 13-14h26l13 14-26 33ZM6 24h52M19 10l13 47 13-47M19 10l13 14 13-14"/><path className="icon-spark" d="M32 2v4M6 8l4 4M58 8l-4 4"/></g>
 ];
 return <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{art[stage]}</svg>;
}

type Props={hintPanel:ReactNode;level:number;highestLevel:number;hintsUsed:number;saveStatus:string;visitLevel:(n:number)=>void;onMission:()=>void;onLibrary:()=>void};
export default function MissionMap({hintPanel,level,highestLevel,hintsUsed,saveStatus,visitLevel,onMission,onLibrary}:Props) {
 const [open,setOpen]=useState(false);
 const [hintsOpen,setHintsOpen]=useState(false);
 const hintsDialog=useRef<HTMLDialogElement>(null);
 const hintsTrigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!hintsOpen)return;hintsDialog.current?.showModal();const before=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{hintsDialog.current?.close();document.body.style.overflow=before;hintsTrigger.current?.focus();};},[hintsOpen]);
 const dialog=useRef<HTMLDialogElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 const done=Math.max(0,Math.min(highestLevel-1,7));
 useEffect(()=>{
  if(!open)return;
  dialog.current?.showModal();
  const before=document.body.style.overflow;document.body.style.overflow='hidden';
  return ()=>{dialog.current?.close();document.body.style.overflow=before;trigger.current?.focus();};
 },[open]);
 const nodes=[{title:'La misión',number:0},...levels.map((l,i)=>({title:l.title,number:i+1})),{title:'Acusación final',number:8},{title:'Resolución',number:9}];
 return <>
  <div className="mission-toolbar"><button ref={trigger} className={`mission-toggle ${open?'is-open':''}`} aria-expanded={open} aria-controls="mission-map" aria-haspopup="dialog" onClick={()=>setOpen(!open)}><span className="mission-toggle-icon"><MissionIcon stage={0}/></span><span><b>MISIÓN</b><small key={done} className="mission-count" aria-live="polite">{done}/7 niveles resueltos</small></span><span className="mission-chevron">⌄</span></button><div className="mission-current"><small>ARCHIVO F-01 · {highestLevel===9?'CASO CERRADO':'EN INVESTIGACIÓN'}</small><span>{nodes[level]?.title}</span></div><div className="mission-toolbar-actions"><button className="library-icon-button" aria-label="Biblioteca: abrir catálogo de juegos" onClick={onLibrary}><img src="/los-archivos-f/images/biblioteca-libros.png" alt=""/><span>BIBLIOTECA</span></button><button ref={hintsTrigger} className="toolbar-hint-lens" aria-label="Abrir pistas" aria-haspopup="dialog" aria-expanded={hintsOpen} onClick={()=>setHintsOpen(true)}><img src="/los-archivos-f/images/lupa-pista.png" alt=""/><span>PISTAS</span></button></div></div>
  {open && <dialog ref={dialog} id="mission-map" className="mission-map" aria-labelledby="mission-map-title" onCancel={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
   <div className="mission-map-paper"><header className="mission-map-heading"><div><p className="eyebrow">AGENCIA F · MAPA DE LA INVESTIGACIÓN</p><h2 id="mission-map-title">El robo del Rubí del Faro</h2></div><button className="mission-close" onClick={()=>setOpen(false)} aria-label="Cerrar menú Misión">×</button></header>
   <div className="mission-progress" role="progressbar" aria-label="Niveles resueltos" aria-valuemin={0} aria-valuemax={7} aria-valuenow={done}><span style={{width:`${done/7*100}%`}}/></div><p className="mission-summary">{highestLevel===9?'Caso cerrado':`${done} de 7 niveles resueltos`} · {hintsUsed} pistas usadas</p>
   <nav className="mission-path" aria-label="Niveles del caso">{nodes.map(({number,title})=>{
    const available=number<=highestLevel,completed=number>0&&(number<highestLevel||number===9&&highestLevel===9);
    const status=!available?'Bloqueado':number===0?'Mensaje de Fede':number===9?'Caso cerrado':completed?'Resuelto · volver a consultar':'Disponible · investigar';
    return <button key={number} disabled={!available} className={`mission-node ${completed?'solved':''} ${number===level?'selected':''} ${number===9?'ruby-node':''}`} aria-current={number===level?'step':undefined} aria-label={`${title}. ${status}`} onClick={()=>{setOpen(false);if(number===0)onMission();else visitLevel(number);}}><span className="mission-orb"><MissionIcon stage={number}/><span className="mission-badge">{!available?'⌑':completed?'✓':number||'F'}</span></span><span className="mission-node-copy"><small>{number>0&&number<8?`ETAPA 0${number}`:number===0?'CÓMO JUGAR':'ARCHIVO F-01'}</small><strong>{title}</strong><span>{number===0?'Volver a escuchar y revisar cómo jugar':status}</span></span>{!available&&<svg className="mission-padlock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>}</button>;
   })}</nav>
   <div className="mission-hints"><h3>Pistas · {nodes[level]?.title}</h3>{hintPanel}</div>
   <footer className="mission-map-footer"><button className="library-icon-button" aria-label="Biblioteca: abrir catálogo de juegos" onClick={()=>{setOpen(false);onLibrary();}}><img src="/los-archivos-f/images/biblioteca-libros.png" alt=""/><span>BIBLIOTECA</span></button><p><span className="signal-dot"/>{saveStatus||'Tu avance se guarda al resolver cada desafío.'}</p><p>{highestLevel>=7?'Tenés autorización para abrir el sobre negro.':'El sobre negro permanece cerrado hasta recibir autorización.'}</p></footer></div>
  </dialog>}
 {hintsOpen&&<dialog ref={hintsDialog} className="hints-dialog" aria-labelledby="hints-dialog-title" onCancel={()=>setHintsOpen(false)} onClick={e=>{if(e.target===e.currentTarget)setHintsOpen(false);}}><div className="hints-dialog-paper"><header><h2 id="hints-dialog-title">Pistas · {nodes[level]?.title}</h2><button aria-label="Cerrar pistas" onClick={()=>setHintsOpen(false)}>×</button></header>{hintPanel}</div></dialog>}
 </>;
}
