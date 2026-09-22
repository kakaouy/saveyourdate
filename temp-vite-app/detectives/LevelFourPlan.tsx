import {useState} from 'react';

type FragmentOption={id:string;corridor:string;wall:string;pipe:string;cable:string;mark:string};

const fragments:FragmentOption[]=[
  {id:'A',corridor:'M0 35C24 35 24 65 50 65S76 35 100 35',wall:'M35 0C35 28 65 28 65 50S35 72 35 100',pipe:'M0 70C25 70 27 45 50 45S75 70 100 70',cable:'M82 0C82 25 18 76 18 100',mark:'doble curva'},
  {id:'B',corridor:'M0 35H28V62H72V35H100',wall:'M35 0V30H65V70H35V100',pipe:'M0 70C30 70 30 48 50 48S70 70 100 70',cable:'M82 0C58 20 42 80 18 100',mark:'paso escalonado'},
  {id:'C',corridor:'M0 35C25 35 30 65 50 65S76 65 100 65',wall:'M35 0C35 30 65 30 65 50V100',pipe:'M0 70C25 70 32 45 50 45S76 55 100 55',cable:'M82 0C70 28 95 62 100 82',mark:'trazo mixto'},
  {id:'D',corridor:'M0 35H38L62 65H100',wall:'M35 0L65 32V68L35 100',pipe:'M0 70C20 50 38 50 50 70S80 88 100 70',cable:'M82 0C40 18 60 82 18 100',mark:'cruce diagonal'},
];

const initialRotations:Record<string,number>={A:90,B:180,C:270,D:90};

function Fragment({fragment,showNumber=false}:{fragment:FragmentOption;showNumber?:boolean}){
  return <svg viewBox="0 0 100 100" aria-hidden="true"><rect className="fragment-paper" x="2" y="2" width="96" height="96"/><path className="fragment-grid" d="M8 18H92M8 82H92M18 8V92M82 8V92"/><path className="fragment-corridor" d={fragment.corridor}/><path className="fragment-wall" d={fragment.wall}/><path className="fragment-pipe" d={fragment.pipe}/><path className="fragment-cable" d={fragment.cable}/>{showNumber&&<g className="fragment-number-seal"><circle cx="76" cy="22" r="16"/><text x="76" y="31" textAnchor="middle">3</text></g>}</svg>;
}

export default function LevelFourPlan({solved,busy,onSolved}:{solved:boolean;busy:boolean;onSolved:()=>Promise<void>}){
  const [selected,setSelected]=useState<string|null>(null);
  const [rotations,setRotations]=useState<Record<string,number>>(initialRotations);
  const [feedback,setFeedback]=useState('');
  const activeId=solved?'C':selected;
  const activeFragment=fragments.find(fragment=>fragment.id===activeId);
  const activeRotation=solved?0:activeId?rotations[activeId]:0;

  function select(id:string){
    if(solved)return;
    setSelected(id);
    setFeedback('');
  }

  function rotate(id:string){
    if(solved||busy)return;
    setSelected(id);
    setRotations(current=>({...current,[id]:(current[id]+90)%360}));
    setFeedback('');
  }

  async function verify(){
    if(!selected){setFeedback('Elegí un fragmento y giralo hasta alinear las redes con los bordes del plano.');return;}
    if(selected!=='C'){setFeedback('La reconstrucción genera una discontinuidad. Revisá si el pasillo, la pared y el conducto continúan sin atravesar ninguna estructura.');return;}
    if(rotations[selected]!==0){setFeedback('En esta orientación las líneas no coinciden con el plano. Probá girar el fragmento.');return;}
    setFeedback('');
    await onSolved();
  }

  return <section className={`plan-reconstruction ${solved?'is-complete':''}`} aria-labelledby="plan-reconstruction-title">
    <header><p className="eyebrow">PARTE A · RECONSTRUCCIÓN</p><h2 id="plan-reconstruction-title">Encontrá el fragmento que respeta la estructura.</h2><p>Las piezas están giradas. Elegí una, rotala de a 90° y probá cómo continúan el pasillo, la pared, el conducto y el cable a través del hueco.</p></header>
    {solved&&<div className="plan-reconstruction-reveal" role="status"><span className="plan-reconstruction-check" aria-hidden="true">✓</span><div><span className="plan-reconstruction-kicker">PIEZA C · ORIENTACIÓN CORRECTA</span><h3>RECONSTRUCCIÓN COMPATIBLE</h3><p>El plano vuelve a estar completo. Ahora examiná los materiales disponibles y averiguá qué elemento fue diseñado para trabajar sobre esta versión.</p></div></div>}
    <div className={`incomplete-plan complex-plan ${activeFragment?'has-fragment':''} ${solved?'is-reconstructed':''}`} aria-label={solved?'Plano reconstruido con el fragmento C en su orientación correcta y el número 3 visible':'Plano incompleto del sector de mantenimiento con cuatro conexiones interrumpidas'}><span className="plan-north">N ↑</span><span className="plan-room room-one">ARCHIVO<br/><b>12</b></span><span className="plan-room room-two">TALLER<br/><b>6</b></span><span className="plan-room room-three">DEPÓSITO<br/><b>9</b></span><span className="plan-room room-four">GENERADOR<br/><b>3</b></span><span className="plan-room room-five">ESCALERA<br/><b>7</b></span><svg className="plan-network" viewBox="0 0 1000 460" preserveAspectRatio="none" aria-hidden="true"><path className="fragment-grid" d="M40 75H960M40 385H960M150 30V430M850 30V430"/><path className="fragment-corridor" d="M40 194H360M640 266H960"/><path className="fragment-wall" d="M458 25V110M542 350V440"/><path className="fragment-pipe" d="M30 330C180 330 245 278 360 278M640 242C760 242 815 218 970 218"/><path className="fragment-cable" d="M590 25C590 72 580 94 590 110M640 306C720 306 800 340 970 340"/></svg><span className={`plan-hole ${activeFragment?'has-preview':''} ${solved?'is-placed':''}`}>{activeFragment?<span className="plan-hole-piece" style={{transform:`rotate(${activeRotation}deg)`}}><Fragment fragment={activeFragment} showNumber={solved}/></span>:<><b>SECTOR RETIRADO</b><small>4 redes interrumpidas</small></>}</span>{activeFragment&&<span className={`plan-piece-label ${solved?'is-confirmed':''}`}>{solved?'FRAGMENTO C · 0° · NÚMERO REVELADO':`PROBANDO FRAGMENTO ${activeId} · ${activeRotation}°`}</span>}<span className="plan-legend"><i className="legend-corridor"/>PASILLO <i className="legend-wall"/>MURO <i className="legend-pipe"/>CONDUCTO <i className="legend-cable"/>CABLE</span></div>
    <div className="plan-fragments" role="group" aria-label={solved?'Fragmento C elegido y encajado en la orientación correcta':'Cuatro fragmentos posibles; cada uno se puede seleccionar y girar'}>{fragments.map(fragment=>{const isSelected=activeId===fragment.id;const isSolved=solved&&fragment.id==='C';return <div className={`plan-fragment-card ${isSelected?'is-selected':''} ${isSolved?'is-solved':''} ${solved&&!isSolved?'is-dismissed':''}`} key={fragment.id}><button type="button" className="plan-fragment-select" aria-pressed={isSelected} aria-disabled={solved} aria-label={`Seleccionar fragmento ${fragment.id}, orientación ${isSolved?0:rotations[fragment.id]} grados`} onClick={()=>select(fragment.id)}><span className="plan-fragment-visual" style={{transform:`rotate(${isSolved?0:rotations[fragment.id]}deg)`}}><Fragment fragment={fragment} showNumber={isSolved}/></span><b>FRAGMENTO {fragment.id}</b><small>{fragment.mark}</small>{isSelected&&<span className="plan-fragment-selected-tag">{isSolved?'PIEZA ENCAJADA':'EN EL PLANO'}</span>}</button><button type="button" className="plan-fragment-turn" disabled={solved||busy} onClick={()=>rotate(fragment.id)} aria-label={`Girar fragmento ${fragment.id} 90 grados en sentido horario`}><span aria-hidden="true">↻</span> GIRAR 90°</button></div>;})}</div>
    {!solved&&<><button type="button" className="unlock-button" disabled={busy} onClick={verify}>PROBAR RECONSTRUCCIÓN</button>{feedback&&<p className="plan-feedback" role="status">{feedback}</p>}</>}
  </section>;
}
