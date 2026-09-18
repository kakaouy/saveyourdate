import {useState} from 'react';

const fragments=[
  {id:'A',paths:['M5 38H44V66H95','M22 5V38','M5 78H55V96']},
  {id:'B',paths:['M5 38H55V18H95','M22 5V72H95','M5 78H44V96']},
  {id:'C',paths:['M5 38H55V66H95','M22 5V78H95','M5 78H55V96']},
  {id:'D',paths:['M5 38H78V5','M22 5V55H95','M5 78H78V96']},
];

function Fragment({paths}:{paths:string[]}){
  return <svg viewBox="0 0 100 100" aria-hidden="true"><rect x="2" y="2" width="96" height="96"/><g>{paths.map(path=><path key={path} d={path}/>)}</g><path className="plan-pipe" d="M2 62C28 62 28 48 52 48S76 62 98 62"/></svg>;
}

export default function LevelFourPlan({solved,busy,onSolved}:{solved:boolean;busy:boolean;onSolved:()=>Promise<void>}){
  const [selected,setSelected]=useState<string|null>(null);const [feedback,setFeedback]=useState('');
  async function verify(){
    if(!selected){setFeedback('Elegí un fragmento antes de probar la reconstrucción.');return;}
    if(selected!=='C'){setFeedback('Una de las conexiones queda interrumpida. Revisá los bordes del fragmento.');return;}
    setFeedback('Reconstrucción compatible.');await onSolved();
  }
  return <section className={`plan-reconstruction ${solved?'is-complete':''}`} aria-labelledby="plan-reconstruction-title">
    <header><p className="eyebrow">PARTE A · RECONSTRUCCIÓN</p><h2 id="plan-reconstruction-title">Completá el plano sin cortar las conexiones.</h2><p>Compará cómo continúan el pasillo, la pared y el conducto en los cuatro bordes del hueco.</p></header>
    <div className="incomplete-plan" aria-label="Plano incompleto del sector de mantenimiento"><span className="plan-north">N ↑</span><span className="plan-room room-one">ARCHIVO<br/><b>12</b></span><span className="plan-room room-two">TALLER<br/><b>6</b></span><span className="plan-room room-three">DEPÓSITO<br/><b>9</b></span><span className="plan-hole">SECTOR<br/>FALTANTE</span><i className="plan-pipe-line"/><i className="plan-wall-line"/><i className="plan-corridor-line"/></div>
    {!solved?<><div className="plan-fragments" role="group" aria-label="Fragmentos posibles">{fragments.map(fragment=><button type="button" key={fragment.id} className={selected===fragment.id?'selected':''} aria-pressed={selected===fragment.id} onClick={()=>{setSelected(fragment.id);setFeedback('');}}><Fragment paths={fragment.paths}/><b>FRAGMENTO {fragment.id}</b></button>)}</div><button type="button" className="unlock-button" disabled={busy} onClick={verify}>PROBAR RECONSTRUCCIÓN</button>{feedback&&<p className={feedback.startsWith('Reconstrucción')?'plan-success':'plan-feedback'} role="status">{feedback}</p>}</>:<div className="plan-compatible" role="status"><span>✓</span><div><b>RECONSTRUCCIÓN COMPATIBLE</b><p>El plano vuelve a estar completo. Ahora examiná la lámina transparente y averiguá cómo fue diseñada para trabajar con esta versión.</p></div></div>}
  </section>;
}
