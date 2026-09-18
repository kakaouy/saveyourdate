import {useState} from 'react';

type Signal = {id:string; name:string; symbol:string; pattern:string};
const signals: Signal[] = [
  {id:'anchor',name:'Ancla',symbol:'⚓',pattern:'o — o'},
  {id:'wave-a',name:'Ola A',symbol:'≋',pattern:'— o —'},
  {id:'compass',name:'Brújula',symbol:'✥',pattern:'—'},
  {id:'key',name:'Llave',symbol:'⚿',pattern:'o o —'},
  {id:'lantern',name:'Farol',symbol:'⌑',pattern:'o —'},
  {id:'wave-b',name:'Ola B',symbol:'≋',pattern:'— o —'},
];

export default function LightSignal({onSolved}: {onSolved:(solved:boolean)=>void}) {
  const [available,setAvailable]=useState(signals);
  const [ordered,setOrdered]=useState<Signal[]>([]);
  const [feedback,setFeedback]=useState('');
  const [dragged,setDragged]=useState<string|null>(null);
  function add(signal:Signal){setAvailable(items=>items.filter(item=>item.id!==signal.id));setOrdered(items=>[...items,signal]);setFeedback('');onSolved(false);}
  function remove(signal:Signal){setOrdered(items=>items.filter(item=>item.id!==signal.id));setAvailable(items=>[...items,signal]);setFeedback('');onSolved(false);}
  function move(index:number,direction:-1|1){const target=index+direction;if(target<0||target>=ordered.length)return;setOrdered(items=>{const next=[...items];[next[index],next[target]]=[next[target],next[index]];return next;});setFeedback('');onSolved(false);}
  function analyze(){
    if(ordered.length<signals.length){setFeedback('Ubicá las seis señales antes de analizar la secuencia.');return;}
    const ids=ordered.map(item=>item.id);
    const correct=ids[0]==='compass'&&ids[1]==='lantern'&&ids.slice(2,4).every(id=>id.startsWith('wave-'))&&ids[4]==='key'&&ids[5]==='anchor';
    if(!correct){setFeedback('Las señales pueden estar bien interpretadas y aun así formar un mensaje incorrecto. Revisá las anotaciones de la cafetería.');onSolved(false);return;}
    setFeedback('Secuencia reconstruida. Ya podés ingresar el lugar señalado.');onSolved(true);
  }
  return <section className="signal-workbench" aria-label="Receptor de seis señales desordenadas">
    <header><span className="signal-lamp is-lit" aria-hidden="true"/><div><b>SEIS REGISTROS RECUPERADOS</b><small>Guardados fuera de secuencia</small></div></header>
    <p className="signal-instruction">Seleccioná una tarjeta para llevarla a la bandeja. También podés arrastrarla y ajustar su posición con las flechas.</p>
    <div className="signal-pool" aria-label="Señales sin ordenar">{available.map((signal,index)=><button draggable key={signal.id} onDragStart={()=>setDragged(signal.id)} onClick={()=>add(signal)} className="signal-card"><small>S-{String(index+1).padStart(2,'0')}</small><strong aria-hidden="true">{signal.symbol}</strong><span>{signal.name}</span><code>{signal.pattern}</code></button>)}</div>
    <div className="signal-sequence" onDragOver={event=>event.preventDefault()} onDrop={()=>{const signal=available.find(item=>item.id===dragged);if(signal)add(signal);setDragged(null);}} aria-label="Secuencia reconstruida">
      {Array.from({length:6},(_,index)=>{const signal=ordered[index];return <div className={`signal-slot ${signal?'filled':''}`} key={signal?.id||index}>{signal?<><button className="signal-card" onClick={()=>remove(signal)} aria-label={`Quitar ${signal.name} de la posición ${index+1}`}><small>POSICIÓN {index+1}</small><strong aria-hidden="true">{signal.symbol}</strong><span>{signal.name}</span><code>{signal.pattern}</code></button><span className="signal-movers"><button onClick={()=>move(index,-1)} disabled={index===0} aria-label={`Mover ${signal.name} a la izquierda`}>←</button><button onClick={()=>move(index,1)} disabled={index===ordered.length-1} aria-label={`Mover ${signal.name} a la derecha`}>→</button></span></>:<span>{index+1}</span>}</div>})}
    </div>
    <button type="button" className="unlock-button" onClick={analyze}>ANALIZAR SECUENCIA</button>
    {feedback&&<p className={feedback.startsWith('Secuencia')?'signal-success':'signal-feedback'} role="status">{feedback}</p>}
  </section>;
}
