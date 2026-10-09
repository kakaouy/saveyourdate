import type {FormEvent} from 'react';
import {playEffect} from './sounds';

export default function LevelSideTabs({level,onReplay,missionTitle,missionSubtitle}:{
 level:number;prompt:string;placeholder:string;answer:string;busy:boolean;unlocked:boolean;canUnlock:boolean;message:string;missionMessageOpen?:boolean;
 onAnswer:(value:string)=>void;onReplay:()=>void;onUnlock:(event:FormEvent)=>void;missionTitle?:string;missionSubtitle?:string;showUnlock?:boolean;
}){
 return <aside className="level-side-tabs compact-side-tabs" aria-label={`Mensaje del nivel ${level}`}>
  <section className="level-side-tab mission-tab">
   <button type="button" className="level-side-tab-trigger" onClick={()=>{playEffect('panel');onReplay();}}>
    <img src="/los-archivos-f/images/fede-mission-tab.png" alt=""/>
    <span><b>{missionTitle||'FEDE'}</b><small>{missionSubtitle||'Repetir mensaje'}</small></span>
   </button>
  </section>
 </aside>;
}
