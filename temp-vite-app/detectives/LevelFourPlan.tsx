import {useState} from 'react';

type FragmentOption={id:string;corridor:string;wall:string;pipe:string;cable:string};

const fragments:FragmentOption[]=[
  {id:'A',corridor:'M0 35H35V65H100',wall:'M35 0V48H65V100',pipe:'M0 70C30 70 32 45 58 45S78 68 100 68',cable:'M82 0C82 25 74 42 100 82'},
  {id:'B',corridor:'M0 35H35V65H100',wall:'M35 0V48H58V100',pipe:'M0 70C30 70 32 45 58 45S78 55 100 55',cable:'M82 0C82 25 74 42 100 82'},
  {id:'C',corridor:'M0 35H35V65H100',wall:'M35 0V48H65V100',pipe:'M0 70C30 70 32 45 58 45S78 55 100 55',cable:'M82 0C82 25 74 42 100 82'},
  {id:'D',corridor:'M0 35H35V52H100',wall:'M35 0V48H65V100',pipe:'M0 70C30 70 32 45 58 45S78 55 100 55',cable:'M82 0C82 25 74 42 100 82'},
];

function Fragment({fragment}:{fragment:FragmentOption}){
  return <svg viewBox="0 0 100 100" aria-hidden="true"><rect className="fragment-paper" x="2" y="2" width="96" height="96"/><path className="fragment-grid" d="M8 18H92M8 82H92M18 8V92M82 8V92"/><path className="fragment-corridor" d={fragment.corridor}/><path className="fragment-wall" d={fragment.wall}/><path className="fragment-pipe" d={fragment.pipe}/><path className="fragment-cable" d={fragment.cable}/><circle className="fragment-mark" cx="74" cy="25" r="4"/></svg>;
}

export default function LevelFourPlan({solved,busy,onSolved}:{solved:boolean;busy:boolean;onSolved:()=>Promise<void>}){
  const [selected,setSelected]=useState<string|null>(null);const [feedback,setFeedback]=useState('');
  async function verify(){
    if(!selected){setFeedback('Elegí un fragmento antes de probar la reconstrucción.');return;}
    if(selected!=='C'){setFeedback('La silueta entra, pero al menos una conexión cambia de altura o termina antes del borde. Compará los cuatro sistemas.');return;}
    setFeedback('Reconstrucción compatible.');await onSolved();
  }
  return <section className={`plan-reconstruction ${solved?'is-complete':''}`} aria-labelledby="plan-reconstruction-title">
    <header><p className="eyebrow">PARTE A · RECONSTRUCCIÓN</p><h2 id="plan-reconstruction-title">Encontrá el único fragmento que conserva las cuatro redes.</h2><p>Los cuatro tienen la misma silueta. Seguí por separado el pasillo, el muro doble, el conducto rojo y el cable azul hasta comprobar cómo entran y salen del hueco.</p></header>
    <div className="incomplete-plan complex-plan" aria-label="Plano incompleto del sector de mantenimiento con cuatro conexiones interrumpidas"><span className="plan-north">N ↑</span><span className="plan-room room-one">ARCHIVO<br/><b>12</b></span><span className="plan-room room-two">TALLER<br/><b>6</b></span><span className="plan-room room-three">DEPÓSITO<br/><b>9</b></span><span className="plan-room room-four">GENERADOR<br/><b>3</b></span><span className="plan-room room-five">ESCALERA<br/><b>7</b></span><svg className="plan-network" viewBox="0 0 1000 460" preserveAspectRatio="none" aria-hidden="true"><path className="fragment-grid" d="M40 75H960M40 385H960M150 30V430M850 30V430"/><path className="fragment-corridor" d="M40 194H360M640 266H960"/><path className="fragment-wall" d="M458 25V110M542 350V440"/><path className="fragment-pipe" d="M30 330C180 330 245 278 360 278M640 242C760 242 815 218 970 218"/><path className="fragment-cable" d="M590 25C590 72 580 94 590 110M640 306C720 306 800 340 970 340"/></svg><span className="plan-hole"><b>SECTOR RETIRADO</b><small>4 redes interrumpidas</small></span><span className="plan-legend"><i className="legend-corridor"/>PASILLO <i className="legend-wall"/>MURO <i className="legend-pipe"/>CONDUCTO <i className="legend-cable"/>CABLE</span></div>
    {!solved?<><div className="plan-fragments" role="group" aria-label="Cuatro fragmentos posibles con la misma forma">{fragments.map(fragment=><button type="button" key={fragment.id} className={selected===fragment.id?'selected':''} aria-pressed={selected===fragment.id} onClick={()=>{setSelected(fragment.id);setFeedback('');}}><Fragment fragment={fragment}/><b>FRAGMENTO {fragment.id}</b><small>Comparar cuatro bordes</small></button>)}</div><button type="button" className="unlock-button" disabled={busy} onClick={verify}>PROBAR RECONSTRUCCIÓN</button>{feedback&&<p className={feedback.startsWith('Reconstrucción')?'plan-success':'plan-feedback'} role="status">{feedback}</p>}</>:<div className="plan-compatible" role="status"><span>✓</span><div><b>RECONSTRUCCIÓN COMPATIBLE</b><p>El plano vuelve a estar completo. Ahora examiná la lámina transparente y averiguá cómo fue diseñada para trabajar con esta versión.</p></div></div>}
  </section>;
}
