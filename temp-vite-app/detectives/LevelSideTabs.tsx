import {type FormEvent, useEffect, useRef, useState} from 'react';

type RankingEntry={agent:string;elapsedSeconds:number;hintsUsed:number;completed:boolean;highestLevel:number};
const formatTime=(seconds:number)=>`${Math.floor(seconds/3600).toString().padStart(2,'0')}:${Math.floor(seconds%3600/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;

export default function LevelSideTabs({
  level,
  prompt,
  placeholder,
  answer,
  busy,
  unlocked,
  canUnlock,
  message,
  missionMessageOpen=false,
  onAnswer,
  onReplay,
  onUnlock,
}:{
  level:number;
  prompt:string;
  placeholder:string;
  answer:string;
  busy:boolean;
  unlocked:boolean;
  canUnlock:boolean;
  message:string;
  missionMessageOpen?:boolean;
  onAnswer:(value:string)=>void;
  onReplay:()=>void;
  onUnlock:(event:FormEvent)=>void;
}){
  const [open,setOpen]=useState<'mission'|'unlock'|'ranking'|null>(null);
  const [rankingOpen,setRankingOpen]=useState(false);
  const [ranking,setRanking]=useState<RankingEntry[]>([]);
  const [rankingStatus,setRankingStatus]=useState('');
  const [missionHoverSuppressed,setMissionHoverSuppressed]=useState(false);
  const tabsRef=useRef<HTMLElement>(null);
  const previousMissionMessageOpen=useRef(missionMessageOpen);
  const rankingDialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(!rankingOpen)return;rankingDialog.current?.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{rankingDialog.current?.close();document.body.style.overflow=overflow;};},[rankingOpen]);
  useEffect(()=>{const close=(event:PointerEvent)=>{if(open&&!tabsRef.current?.contains(event.target as Node))setOpen(null);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[open]);
  useEffect(()=>{
    if(previousMissionMessageOpen.current&&!missionMessageOpen){setOpen(null);setMissionHoverSuppressed(true);}
    previousMissionMessageOpen.current=missionMessageOpen;
  },[missionMessageOpen]);
  async function showRanking(){setOpen(null);setRankingOpen(true);setRankingStatus('Recuperando posiciones…');try{const response=await fetch('/los-archivos-f/api/game?view=leaderboard');if(!response.ok)throw new Error();setRanking(await response.json() as RankingEntry[]);setRankingStatus('');}catch{setRankingStatus('No pudimos recuperar las posiciones. Volvé a intentar.');}}
  return <aside ref={tabsRef} className="level-side-tabs" aria-label={`Acciones del nivel ${level}`}>
    <section className={`level-side-tab mission-tab ${open==='mission'?'is-open':''} ${missionHoverSuppressed?'suppress-hover':''}`} onPointerLeave={()=>setMissionHoverSuppressed(false)}>
      <button type="button" className="level-side-tab-trigger" aria-expanded={open==='mission'} onClick={()=>{setOpen(null);onReplay();}}>
        <img src="/los-archivos-f/images/fede-mission-tab.png" alt=""/>
        <span><b>MISIÓN NIVEL {level}</b><small>Escuchar mensaje de Fede</small></span>
      </button>
    </section>
    <section className={`level-side-tab unlock-tab ${open==='unlock'?'is-open':''}`}>
      <button type="button" className="level-side-tab-trigger" aria-expanded={open==='unlock'} onClick={()=>setOpen('unlock')}>
        <img src="/los-archivos-f/images/unlock-level-tab.png" alt=""/>
        <span><b>{unlocked?'NIVEL RESUELTO':'DESBLOQUEAR'}</b><small>{unlocked?'Investigación registrada':'Ingresar resultado'}</small></span>
      </button>
      {!unlocked&&open==='unlock'&&<form className="level-side-unlock-form" onSubmit={onUnlock}>
        <label htmlFor={`side-level-answer-${level}`}>{canUnlock?prompt:'Completá la investigación del nivel para habilitar el candado.'}</label>
        <input id={`side-level-answer-${level}`} value={answer} onChange={event=>onAnswer(event.target.value)} placeholder={placeholder} autoComplete="off" disabled={!canUnlock||busy}/>
        <button type="submit" disabled={!canUnlock||busy||!answer.trim()}>{busy?'VERIFICANDO…':'DESBLOQUEAR NIVEL'}</button>
        {message&&<p role="status">{message}</p>}
      </form>}
    </section>
    <section className={`level-side-tab ranking-tab ${open==='ranking'?'is-open':''}`}>
      <button type="button" className="level-side-tab-trigger" aria-expanded={open==='ranking'} onClick={showRanking}>
        <img src="/los-archivos-f/images/copa-ranking.png" alt=""/>
        <span><b>PODIO</b><small>Ver tiempos y pistas</small></span>
      </button>
    </section>
    {rankingOpen&&<dialog ref={rankingDialog} className="ranking-dialog" aria-labelledby="ranking-title" onCancel={()=>setRankingOpen(false)} onClick={event=>{if(event.target===event.currentTarget)setRankingOpen(false);}}><div className="ranking-paper"><button className="ranking-close" type="button" onClick={()=>setRankingOpen(false)} aria-label="Cerrar tabla de posiciones">×</button><img className="ranking-logo" src="/los-archivos-f/images/logo-ranking-archivos-f.png" alt="Los Archivos F · Misterios que dejan huella"/><img className="ranking-cup" src="/los-archivos-f/images/copa-ranking.png" alt=""/><p className="eyebrow">AGENCIA F · CLASIFICACIÓN</p><h2 id="ranking-title">Podio de detectives</h2><p className="ranking-subtitle">Mejores tiempos y pistas utilizadas</p>{rankingStatus?<p className="ranking-status">{rankingStatus}</p>:ranking.length?<div className="ranking-table" role="table" aria-label="Posiciones de detectives"><div className="ranking-row heading" role="row"><span>POS.</span><span>JUGADOR</span><span>TIEMPO</span><span>PISTAS</span></div>{ranking.map((entry,index)=><div className={`ranking-row ${index<3?'place-'+(index+1):''}`} role="row" key={`${entry.agent}-${index}`}><strong>{index+1}</strong><span>{entry.agent}<small>{entry.completed?'CASO CERRADO':`NIVEL ${Math.min(entry.highestLevel,7)}`}</small></span><b>{formatTime(entry.elapsedSeconds)}</b><b>{entry.hintsUsed}</b></div>)}</div>:<p className="ranking-status">Todavía no hay partidas registradas.</p>}<p className="ranking-footer">¿Podrás superar el récord?</p></div></dialog>}
  </aside>;
}
