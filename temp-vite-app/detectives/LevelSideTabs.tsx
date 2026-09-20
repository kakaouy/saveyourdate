import {type FormEvent, useState} from 'react';

export default function LevelSideTabs({
  level,
  prompt,
  placeholder,
  answer,
  busy,
  unlocked,
  canUnlock,
  message,
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
  onAnswer:(value:string)=>void;
  onReplay:()=>void;
  onUnlock:(event:FormEvent)=>void;
}){
  const [open,setOpen]=useState<'mission'|'unlock'|null>(null);
  return <aside className="level-side-tabs" aria-label={`Acciones del nivel ${level}`} onMouseLeave={()=>setOpen(null)}>
    <section className={`level-side-tab mission-tab ${open==='mission'?'is-open':''}`}>
      <button type="button" className="level-side-tab-trigger" aria-expanded={open==='mission'} onMouseEnter={()=>setOpen('mission')} onFocus={()=>setOpen('mission')} onClick={()=>{setOpen('mission');onReplay();}}>
        <img src="/los-archivos-f/images/fede-mission-tab.png" alt=""/>
        <span><b>MISIÓN NIVEL {level}</b><small>Escuchar mensaje de Fede</small></span>
      </button>
    </section>
    <section className={`level-side-tab unlock-tab ${open==='unlock'?'is-open':''}`}>
      <button type="button" className="level-side-tab-trigger" aria-expanded={open==='unlock'} onMouseEnter={()=>setOpen('unlock')} onFocus={()=>setOpen('unlock')} onClick={()=>setOpen(open==='unlock'?null:'unlock')}>
        <img src="/los-archivos-f/images/unlock-level-tab.png" alt=""/>
        <span><b>{unlocked?'NIVEL RESUELTO':'DESBLOQUEAR'}</b><small>{unlocked?'Investigación registrada':'Ingresar resultado'}</small></span>
      </button>
      {!unlocked&&<form className="level-side-unlock-form" onSubmit={onUnlock}>
        <label htmlFor={`side-level-answer-${level}`}>{canUnlock?prompt:'Completá la investigación del nivel para habilitar el candado.'}</label>
        <input id={`side-level-answer-${level}`} value={answer} onChange={event=>onAnswer(event.target.value)} placeholder={placeholder} autoComplete="off" disabled={!canUnlock||busy}/>
        <button type="submit" disabled={!canUnlock||busy||!answer.trim()}>{busy?'VERIFICANDO…':'DESBLOQUEAR NIVEL'}</button>
        {message&&<p role="status">{message}</p>}
      </form>}
    </section>
  </aside>;
}
