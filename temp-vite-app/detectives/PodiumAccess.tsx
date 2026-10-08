import {useEffect,useRef,useState} from 'react';
import {playEffect} from './sounds';

type RankingEntry={agent:string;elapsedSeconds:number;hintsUsed:number;completed:boolean;highestLevel:number};
const formatTime=(seconds:number)=>`${Math.floor(seconds/3600).toString().padStart(2,'0')}:${Math.floor(seconds%3600/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;

export default function PodiumAccess(){
  const [open,setOpen]=useState(false),[ranking,setRanking]=useState<RankingEntry[]>([]),[status,setStatus]=useState('');
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(!open)return;dialog.current?.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{dialog.current?.close();document.body.style.overflow=overflow;};},[open]);
  async function show(){playEffect('panel');setOpen(true);setStatus('Recuperando posiciones…');try{const response=await fetch('/los-archivos-f/api/game?view=leaderboard');if(!response.ok)throw new Error();setRanking(await response.json() as RankingEntry[]);setStatus('');}catch{setStatus('No pudimos recuperar las posiciones. Volvé a intentar.');}}
  return <section className="resolution-podium">
    <img src="/los-archivos-f/images/copa-ranking.png" alt=""/>
    <div><p className="eyebrow">CLASIFICACIÓN DE LA AGENCIA F</p><h2>¿En qué puesto quedó tu equipo?</h2><p>Menos pistas tiene prioridad. Si hay empate, gana el mejor tiempo.</p><button className="primary-button" type="button" onClick={()=>void show()}>VER PODIO <span>→</span></button></div>
    {open&&<dialog ref={dialog} className="ranking-dialog" aria-labelledby="resolved-ranking-title" onCancel={()=>setOpen(false)} onClick={event=>{if(event.target===event.currentTarget)setOpen(false);}}><div className="ranking-paper"><button className="ranking-close" type="button" onClick={()=>setOpen(false)} aria-label="Cerrar tabla de posiciones">×</button><img className="ranking-logo" src="/los-archivos-f/images/logo-ranking-archivos-f.png" alt="Los Archivos F · Misterios que dejan huella"/><img className="ranking-cup" src="/los-archivos-f/images/copa-ranking.png" alt=""/><p className="eyebrow">AGENCIA F · CLASIFICACIÓN</p><h2 id="resolved-ranking-title">Podio de detectives</h2><p className="ranking-subtitle">Primero se ordena por menos pistas; ante un empate, por mejor tiempo.</p>{status?<p className="ranking-status">{status}</p>:ranking.length?<div className="ranking-table" role="table" aria-label="Posiciones de detectives"><div className="ranking-row heading" role="row"><span>POS.</span><span>JUGADOR</span><span>TIEMPO</span><span>PISTAS</span></div>{ranking.map((entry,index)=><div className={`ranking-row ${index<3?'place-'+(index+1):''}`} role="row" key={`${entry.agent}-${index}`}><strong>{index+1}</strong><span>{entry.agent}<small>{entry.completed?'CASO CERRADO':`NIVEL ${Math.min(entry.highestLevel,7)}`}</small></span><b>{formatTime(entry.elapsedSeconds)}</b><b>{entry.hintsUsed}</b></div>)}</div>:<p className="ranking-status">Todavía no hay partidas registradas.</p>}<p className="ranking-footer">Resolver sin pistas siempre conserva la ventaja.</p></div></dialog>}
  </section>;
}
