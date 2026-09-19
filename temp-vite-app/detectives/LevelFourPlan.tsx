import {useState} from 'react';

type FragmentOption={id:string;corridor:string;wall:string;pipe:string;cable:string;number:number;star:[number,number];eye:[number,number];mark:string};

const fragments:FragmentOption[]=[
  {id:'A',corridor:'M0 35C24 35 24 65 50 65S76 35 100 35',wall:'M35 0C35 28 65 28 65 50S35 72 35 100',pipe:'M0 70C25 70 27 45 50 45S75 70 100 70',cable:'M82 0C82 25 18 76 18 100',number:8,star:[72,72],eye:[28,24],mark:'doble curva'},
  {id:'B',corridor:'M0 35H28V62H72V35H100',wall:'M35 0V30H65V70H35V100',pipe:'M0 70C30 70 30 48 50 48S70 70 100 70',cable:'M82 0C58 20 42 80 18 100',number:5,star:[25,30],eye:[70,70],mark:'paso escalonado'},
  {id:'C',corridor:'M0 35C25 35 30 62 50 62S76 35 100 35',wall:'M35 0C35 30 65 30 65 50S35 70 35 100',pipe:'M0 70C25 70 32 45 50 45S76 70 100 70',cable:'M82 0C70 28 30 72 18 100',number:3,star:[72,23],eye:[72,65],mark:'curva de faro'},
  {id:'D',corridor:'M0 35H38L62 65H100',wall:'M35 0L65 32V68L35 100',pipe:'M0 70C20 50 38 50 50 70S80 88 100 70',cable:'M82 0C40 18 60 82 18 100',number:1,star:[30,68],eye:[70,28],mark:'cruce diagonal'},
];

function Fragment({fragment}:{fragment:FragmentOption}){
  return <svg viewBox="0 0 100 100" aria-hidden="true"><rect className="fragment-paper" x="2" y="2" width="96" height="96"/><path className="fragment-grid" d="M8 18H92M8 82H92M18 8V92M82 8V92"/><path className="fragment-corridor" d={fragment.corridor}/><path className="fragment-wall" d={fragment.wall}/><path className="fragment-pipe" d={fragment.pipe}/><path className="fragment-cable" d={fragment.cable}/></svg>;
}

export default function LevelFourPlan({solved,busy,onSolved}:{solved:boolean;busy:boolean;onSolved:()=>Promise<void>}){
  const [selected,setSelected]=useState<string|null>(null);const [feedback,setFeedback]=useState('');
  async function verify(){
    if(!selected){setFeedback('Elegí un fragmento antes de probar la reconstrucción.');return;}
    if(selected!=='C'){setFeedback('La reconstrucción genera una discontinuidad. Revisá si el pasillo, la pared y el conducto continúan sin atravesar ninguna estructura.');return;}
    setFeedback('Reconstrucción compatible.');await onSolved();
  }
  return <section className={`plan-reconstruction ${solved?'is-complete':''}`} aria-labelledby="plan-reconstruction-title">
    <header><p className="eyebrow">PARTE A · RECONSTRUCCIÓN</p><h2 id="plan-reconstruction-title">Encontrá el fragmento que respeta la estructura.</h2><p>Los cuatro parecen entrar por su forma. Seguí el pasillo, la pared y el conducto hasta los bordes: una reconstrucción válida no interrumpe líneas ni crea cruces imposibles.</p></header>
    <div className="incomplete-plan complex-plan" aria-label="Plano incompleto del sector de mantenimiento con cuatro conexiones interrumpidas"><span className="plan-north">N ↑</span><span className="plan-room room-one">ARCHIVO<br/><b>12</b></span><span className="plan-room room-two">TALLER<br/><b>6</b></span><span className="plan-room room-three">DEPÓSITO<br/><b>9</b></span><span className="plan-room room-four">GENERADOR<br/><b>3</b></span><span className="plan-room room-five">ESCALERA<br/><b>7</b></span><svg className="plan-network" viewBox="0 0 1000 460" preserveAspectRatio="none" aria-hidden="true"><path className="fragment-grid" d="M40 75H960M40 385H960M150 30V430M850 30V430"/><path className="fragment-corridor" d="M40 194H360M640 266H960"/><path className="fragment-wall" d="M458 25V110M542 350V440"/><path className="fragment-pipe" d="M30 330C180 330 245 278 360 278M640 242C760 242 815 218 970 218"/><path className="fragment-cable" d="M590 25C590 72 580 94 590 110M640 306C720 306 800 340 970 340"/></svg><span className="plan-hole"><b>SECTOR RETIRADO</b><small>4 redes interrumpidas</small></span><span className="plan-legend"><i className="legend-corridor"/>PASILLO <i className="legend-wall"/>MURO <i className="legend-pipe"/>CONDUCTO <i className="legend-cable"/>CABLE</span></div>
    {!solved?<><div className="plan-fragments" role="group" aria-label="Cuatro fragmentos posibles con redes diferentes">{fragments.map(fragment=><button type="button" key={fragment.id} className={selected===fragment.id?'selected':''} aria-pressed={selected===fragment.id} onClick={()=>{setSelected(fragment.id);setFeedback('');}}><Fragment fragment={fragment}/><b>FRAGMENTO {fragment.id}</b><small>{fragment.mark}</small></button>)}</div><button type="button" className="unlock-button" disabled={busy} onClick={verify}>PROBAR RECONSTRUCCIÓN</button>{feedback&&<p className={feedback.startsWith('Reconstrucción compatible')?'plan-success':'plan-feedback'} role="status">{feedback}</p>}</>:<div className="plan-compatible" role="status"><span>✓</span><div><b>RECONSTRUCCIÓN COMPATIBLE</b><p>El plano vuelve a estar completo. Ahora examiná los materiales disponibles y averiguá qué elemento fue diseñado para trabajar sobre esta versión.</p></div></div>}
  </section>;
}
