import {useState, type CSSProperties} from 'react';
import {playEffect,playRadarConfirm,playRadioStatic,playSignalBlip} from './sounds';

type Signal = {id:string;name:string;symbol:string;pattern:string;letter:string};
const signals: Signal[] = [
  {id:'anchor',name:'Ancla',symbol:'⚓',pattern:'o — o',letter:'R'},
  {id:'wave-a',name:'Ola A',symbol:'≋',pattern:'— o —',letter:'L'},
  {id:'compass',name:'Brújula',symbol:'✥',pattern:'—',letter:'T'},
  {id:'key',name:'Llave',symbol:'⚿',pattern:'o o —',letter:'E'},
  {id:'lantern',name:'Farol',symbol:'⌑',pattern:'o —',letter:'A'},
  {id:'wave-b',name:'Ola B',symbol:'≋',pattern:'— o —',letter:'L'},
];

function SignalPattern({pattern}:{pattern:string}) {
  const pulses=pattern.split(' ').filter(Boolean);
  return <span className="light-pattern" aria-label={`Destellos ${pattern}`}>{pulses.map((pulse,index)=><i key={`${pulse}-${index}`} className={pulse==='—'?'long':'short'} style={{'--pulse-index':index} as CSSProperties}/>)}</span>;
}

export default function LightSignal({onSolved}: {onSolved:(solved:boolean)=>void|Promise<void>}) {
  const [stage,setStage]=useState<1|2>(1);
  const [interpreted,setInterpreted]=useState<string[]>([]);
  const [available,setAvailable]=useState(signals);
  const [ordered,setOrdered]=useState<Signal[]>([]);
  const [feedback,setFeedback]=useState('');
  const [dragged,setDragged]=useState<string|null>(null);
  const [solved,setSolved]=useState(false);

  function interpret(signal:Signal){if(interpreted.includes(signal.id))return;playSignalBlip();const next=[...interpreted,signal.id];setInterpreted(next);if(next.length===signals.length){playRadarConfirm();setFeedback('Las seis señales están interpretadas. Ahora reconstruí el orden del mensaje.');window.setTimeout(()=>setStage(2),550);}}
  function add(signal:Signal){if(solved)return;playSignalBlip();setAvailable(items=>items.filter(item=>item.id!==signal.id));setOrdered(items=>[...items,signal]);setFeedback('');void onSolved(false);}
  function remove(signal:Signal){if(solved)return;playEffect('paper');setOrdered(items=>items.filter(item=>item.id!==signal.id));setAvailable(items=>[...items,signal]);setFeedback('');void onSolved(false);}
  function dropAt(index:number){if(!dragged||solved)return;const sourceIndex=ordered.findIndex(item=>item.id===dragged);if(sourceIndex>=0){playEffect('rotate');setOrdered(items=>{const next=[...items];const [item]=next.splice(sourceIndex,1);next.splice(Math.min(index,next.length),0,item);return next;});}else{const signal=available.find(item=>item.id===dragged);if(signal){playSignalBlip();setAvailable(items=>items.filter(item=>item.id!==signal.id));setOrdered(items=>{const next=[...items];next.splice(Math.min(index,next.length),0,signal);return next;});}}setDragged(null);setFeedback('');void onSolved(false);}
  function reset(){playEffect('paper');setAvailable(signals);setOrdered([]);setSolved(false);setFeedback('Secuencia reiniciada. Las interpretaciones quedan conservadas.');void onSolved(false);}
  function analyze(){if(ordered.length<signals.length)return;playRadioStatic();const ids=ordered.map(item=>item.id);const correct=ids[0]==='compass'&&ids[1]==='lantern'&&ids.slice(2,4).every(id=>id.startsWith('wave-'))&&ids[4]==='key'&&ids[5]==='anchor';if(!correct){playEffect('error');setFeedback('El orden todavía no forma un mensaje. Las seis tarjetas quedan en su lugar para que puedas corregirlas.');void onSolved(false);return;}playRadarConfirm();setSolved(true);setFeedback('Mensaje reconstruido: TALLER. El destino señala una sección faltante del plano público.');window.setTimeout(()=>{void onSolved(true);},1200);}

  return <section className={`signal-workbench signal-stage-${stage} ${dragged?'is-dragging':''} ${solved?'is-solved':''}`} aria-label="Receptor de seis señales desordenadas">
    <header><span className="signal-lamp is-lit" aria-hidden="true"/><div><b>SEIS REGISTROS RECUPERADOS</b><small>Guardados fuera de secuencia</small></div></header>
    <div className="signal-stepper" aria-label="Pasos del receptor"><button type="button" className={stage===1?'active':'done'} onClick={()=>setStage(1)}><span>1</span><b>INTERPRETAR</b><small>{interpreted.length}/6 señales</small></button><i aria-hidden="true"/><button type="button" className={stage===2?'active':''} disabled={interpreted.length<signals.length} onClick={()=>setStage(2)}><span>2</span><b>ORDENAR</b><small>{ordered.length}/6 ubicadas</small></button></div>
    {stage===1?<><p className="signal-instruction">Observá cada patrón y tocá la tarjeta para traducirlo con la guía de señales.</p><div className="signal-interpret-grid">{signals.map((signal,index)=>{const revealed=interpreted.includes(signal.id);return <button type="button" key={signal.id} className={`signal-card ${revealed?'interpreted':''}`} onClick={()=>interpret(signal)}><small>S-{String(index+1).padStart(2,'0')}</small><strong aria-hidden="true">{signal.symbol}</strong><span>{signal.name}</span><SignalPattern pattern={signal.pattern}/><em>{revealed?signal.letter:'INTERPRETAR'}</em></button>})}</div>{interpreted.length===signals.length&&<button className="unlock-button signal-next-step" type="button" onClick={()=>setStage(2)}>ORDENAR LAS SEIS SEÑALES <span>→</span></button>}</>:<><p className="signal-instruction">Seleccioná o arrastrá las tarjetas. Mientras movés una, los seis espacios posibles se iluminan.</p><div className="signal-pool" aria-label="Señales sin ordenar">{available.map(signal=><button draggable={!solved} key={signal.id} onDragStart={()=>setDragged(signal.id)} onDragEnd={()=>setDragged(null)} onClick={()=>add(signal)} className="signal-card"><small>LETRA {signal.letter}</small><strong aria-hidden="true">{signal.symbol}</strong><span>{signal.name}</span><SignalPattern pattern={signal.pattern}/></button>)}</div><div className="signal-placement-progress"><span style={{width:`${ordered.length/signals.length*100}%`}}/><b>{ordered.length} DE 6 SEÑALES UBICADAS</b></div><div className="signal-sequence" onDragOver={event=>event.preventDefault()} aria-label="Secuencia reconstruida">{Array.from({length:6},(_,index)=>{const signal=ordered[index];return <div className={`signal-slot ${signal?'filled':''} ${dragged?'can-drop':''}`} onDragOver={event=>event.preventDefault()} onDrop={()=>dropAt(index)} key={signal?.id||index}>{signal?<button draggable={!solved} onDragStart={()=>setDragged(signal.id)} onDragEnd={()=>setDragged(null)} className="signal-card" onClick={()=>remove(signal)} aria-label={`Quitar ${signal.name} de la posición ${index+1}`}><small>POSICIÓN {index+1}</small><strong aria-hidden="true">{signal.symbol}</strong><span>{signal.name}</span><em>{signal.letter}</em></button>:<span>{index+1}</span>}</div>})}</div><div className="signal-actions"><button type="button" className="reading-choice" onClick={reset} disabled={!ordered.length||solved}>REINICIAR</button><div><small>{ordered.length<signals.length?`Faltan ${signals.length-ordered.length} señales para poder verificar.`:'Las seis están ubicadas. Ya podés verificar el orden.'}</small><button type="button" className="unlock-button" onClick={analyze} disabled={ordered.length<signals.length||solved}>VERIFICAR RESPUESTA</button></div></div></>}
    {solved&&<div className="signal-word-reveal" aria-label="TALLER">{[...'TALLER'].map((letter,index)=><span key={`${letter}-${index}`} style={{'--letter-index':index} as CSSProperties}>{letter}</span>)}</div>}
    {feedback&&<p className={solved||feedback.startsWith('Las seis')?'signal-success':'signal-feedback'} role="status">{feedback}</p>}
  </section>;
}
