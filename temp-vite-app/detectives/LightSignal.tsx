import {useState, type CSSProperties} from 'react';
import {playEffect} from './sounds';

type Signal = {id:string; name:string; symbol:string; pattern:string};
const signals: Signal[] = [
  {id:'anchor',name:'Ancla',symbol:'⚓',pattern:'o — o'},
  {id:'wave-a',name:'Ola A',symbol:'≋',pattern:'— o —'},
  {id:'compass',name:'Brújula',symbol:'✥',pattern:'—'},
  {id:'key',name:'Llave',symbol:'⚿',pattern:'o o —'},
  {id:'lantern',name:'Farol',symbol:'⌑',pattern:'o —'},
  {id:'wave-b',name:'Ola B',symbol:'≋',pattern:'— o —'},
];

function SignalPattern({pattern}:{pattern:string}) {
  const pulses=pattern.split(' ').filter(Boolean);
  return <span className="light-pattern" aria-label={`Destellos ${pattern}`}>
    {pulses.map((pulse,index)=><i key={`${pulse}-${index}`} className={pulse==='—'?'long':'short'} style={{'--pulse-index':index} as CSSProperties}/>) }
  </span>;
}

export default function LightSignal({onSolved}: {onSolved:(solved:boolean)=>void}) {
  const [available,setAvailable]=useState(signals);
  const [ordered,setOrdered]=useState<Signal[]>([]);
  const [feedback,setFeedback]=useState('');
  const [dragged,setDragged]=useState<string|null>(null);
  function add(signal:Signal){playEffect('signal');setAvailable(items=>items.filter(item=>item.id!==signal.id));setOrdered(items=>[...items,signal]);setFeedback('');onSolved(false);}
  function remove(signal:Signal){playEffect('paper');setOrdered(items=>items.filter(item=>item.id!==signal.id));setAvailable(items=>[...items,signal]);setFeedback('');onSolved(false);}
  function dropAt(index:number){
    if(!dragged)return;
    const sourceIndex=ordered.findIndex(item=>item.id===dragged);
    if(sourceIndex>=0){playEffect('rotate');setOrdered(items=>{const next=[...items];const [item]=next.splice(sourceIndex,1);next.splice(Math.min(index,next.length),0,item);return next;});}
    else {const signal=available.find(item=>item.id===dragged);if(signal){playEffect('signal');setAvailable(items=>items.filter(item=>item.id!==signal.id));setOrdered(items=>{const next=[...items];next.splice(Math.min(index,next.length),0,signal);return next;});}}
    setDragged(null);setFeedback('');onSolved(false);
  }
  function reset(){playEffect('paper');setAvailable(signals);setOrdered([]);setFeedback('Secuencia reiniciada.');onSolved(false);}
  function analyze(){
    if(ordered.length<signals.length){playEffect('error');setFeedback('Ubicá las seis señales antes de analizar la secuencia.');return;}
    const ids=ordered.map(item=>item.id);
    const correct=ids[0]==='compass'&&ids[1]==='lantern'&&ids.slice(2,4).every(id=>id.startsWith('wave-'))&&ids[4]==='key'&&ids[5]==='anchor';
    if(!correct){playEffect('error');setFeedback('Las señales pueden estar bien interpretadas y aun así formar un mensaje incorrecto. Revisá las anotaciones de la cafetería.');onSolved(false);return;}
    setFeedback('Secuencia reconstruida. Ya podés ingresar el lugar señalado.');onSolved(true);
  }
  return <section className="signal-workbench" aria-label="Receptor de seis señales desordenadas">
    <header><span className="signal-lamp is-lit" aria-hidden="true"/><div><b>SEIS REGISTROS RECUPERADOS</b><small>Guardados fuera de secuencia</small></div></header>
    <p className="signal-instruction">Seleccioná o arrastrá las tarjetas para reconstruir la secuencia.</p>
    <div className="signal-pool" aria-label="Señales sin ordenar">{available.map((signal,index)=><button draggable key={signal.id} onDragStart={()=>setDragged(signal.id)} onClick={()=>add(signal)} className="signal-card"><small>S-{String(index+1).padStart(2,'0')}</small><strong aria-hidden="true">{signal.symbol}</strong><span>{signal.name}</span><SignalPattern pattern={signal.pattern}/></button>)}</div>
    <div className="signal-sequence" onDragOver={event=>event.preventDefault()} aria-label="Secuencia reconstruida">
      {Array.from({length:6},(_,index)=>{const signal=ordered[index];return <div className={`signal-slot ${signal?'filled':''}`} onDragOver={event=>event.preventDefault()} onDrop={()=>dropAt(index)} key={signal?.id||index}>{signal?<button draggable onDragStart={()=>setDragged(signal.id)} className="signal-card" onClick={()=>remove(signal)} aria-label={`Quitar ${signal.name} de la posición ${index+1}`}><small>POSICIÓN {index+1}</small><strong aria-hidden="true">{signal.symbol}</strong><span>{signal.name}</span><SignalPattern pattern={signal.pattern}/></button>:<span>{index+1}</span>}</div>})}
    </div>
    <div className="signal-actions"><button type="button" className="reading-choice" onClick={reset} disabled={!ordered.length}>REINICIAR</button><button type="button" className="unlock-button" onClick={analyze}>ANALIZAR SECUENCIA</button></div>
    {feedback&&<p className={feedback.startsWith('Secuencia')?'signal-success':'signal-feedback'} role="status">{feedback}</p>}
  </section>;
}
