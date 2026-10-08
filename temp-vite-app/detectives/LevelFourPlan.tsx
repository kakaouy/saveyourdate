import {useState} from 'react';
import {playEffect} from './sounds';

const pieces=[
  {id:'A1',slot:0,start:180},{id:'A3',slot:2,start:270},{id:'B3',slot:4,start:180},
  {id:'C1',slot:6,start:270},{id:'C3',slot:8,start:90},{id:'D2',slot:10,start:270},
] as const;

const fixedPlacement:Record<number,string>={1:'A2',3:'B1',5:'B2',7:'C2',9:'D1',11:'D3'};

export default function LevelFourPlan({solved,busy,onSolved}:{solved:boolean;busy:boolean;onSolved:()=>Promise<void>}){
  const solvedPlacement={...fixedPlacement,...Object.fromEntries(pieces.map(piece=>[piece.slot,piece.id]))};
  const [active,setActive]=useState<string|null>(null);
  const [rotation,setRotation]=useState(0);
  const [flipped,setFlipped]=useState(false);
  const [placed,setPlaced]=useState<Record<number,string>>(solved?solvedPlacement:fixedPlacement);
  const [wrongSlot,setWrongSlot]=useState<number|null>(null);
  const [route,setRoute]=useState<number[]>(solved?[9,3,7]:[]);
  const [feedback,setFeedback]=useState(solved?'Ruta 937 confirmada. El corredor oculto quedó reconstruido.':'Elegí un fragmento, orientalo y buscá dónde continúan sus líneas.');
  const aligned=Object.keys(placed).length===12;
  const activePiece=pieces.find(piece=>piece.id===active);

  function choose(id:string){
    const selected=pieces.find(piece=>piece.id===id);
    if(!selected||Object.values(placed).includes(id)||solved)return;
    playEffect('piece');setActive(id);setRotation(selected.start);setFlipped(false);setWrongSlot(null);
    setFeedback('Fragmento seleccionado. Giralo y probalo sobre el plano.');
  }

  function place(slot:number){
    if(solved)return;
    if(!activePiece){setFeedback('Primero elegí una pieza de la bandeja.');return;}
    if(placed[slot]){setFeedback('Ese sector ya está reconstruido. Probá en otro lugar.');return;}
    if(activePiece.slot!==slot||rotation%360!==0||flipped){
      playEffect('error');setWrongSlot(slot);
      setFeedback(activePiece.slot===slot?'La posición coincide, pero la orientación no. Girá o invertí la pieza.':'Una pared o una marca queda cortada. Probá otro sector.');
      window.setTimeout(()=>setWrongSlot(null),650);return;
    }
    playEffect('piece');const next={...placed,[slot]:activePiece.id};setPlaced(next);setActive(null);setWrongSlot(null);
    setFeedback(Object.keys(next).length===12?'Plano completo. Ahora seguí el recorrido desde INICIO.':`Fragmento confirmado. Faltan ${12-Object.keys(next).length} piezas.`);
  }

  async function visit(value:number){
    if(!aligned||solved||busy)return;
    const expected=[9,3,7];
    if(value!==expected[route.length]){setRoute([]);setFeedback('Ese recorrido termina en una zona pública. Volvé al punto de inicio.');return;}
    const next=[...route,value];setRoute(next);
    if(next.length===3){setFeedback('Ruta 937 confirmada. El corredor oculto quedó reconstruido.');await onSolved();}
    else setFeedback(next.length===1?'Primer tramo confirmado. Seguí la conexión técnica.':'El recorrido continúa detrás del muro.');
  }

  return <section className={`level-four-workbench ${aligned?'is-aligned':''} ${solved?'is-solved':''}`} aria-labelledby="level-four-map-title">
    <header className="level-four-map-heading"><div><p className="eyebrow">ESTACIÓN CARTOGRÁFICA · PLANO 1898</p><h2 id="level-four-map-title">Reconstruí el plano intervenido</h2></div><p>{aligned?'El plano está completo. Seguí las habitaciones en el orden del recorrido.':'Se desprendieron seis fragmentos del plano. Compará paredes, manchas y anotaciones.'}</p></header>
    <div className="level-four-map-layout">
      <div className="level-four-map-stage"><div className="level-four-antique-map" aria-label="Plano histórico del sector de mantenimiento">
        <img src="/los-archivos-f/images/plano-museo-antiguo-nivel4.png" alt="Plano arquitectónico antiguo del faro, dividido en doce sectores"/>
        <div className="level-four-grid">{Array.from({length:12},(_,slot)=><button type="button" key={slot} className={`${placed[slot]?'filled':''} ${wrongSlot===slot?'wrong':''}`} onClick={()=>place(slot)} aria-label={`Sector ${slot+1}${placed[slot]?', reconstruido':', vacío'}`} style={placed[slot]?{'--piece-x':`${(slot%4)*33.333}%`,'--piece-y':`${Math.floor(slot/4)*50}%`} as React.CSSProperties:undefined}>{placed[slot]?<span>{placed[slot]}</span>:<><i>{String(slot+1).padStart(2,'0')}</i><b>SECTOR PERDIDO</b></>}</button>)}</div>
        <span className="level-four-start">INICIO</span>
        <button type="button" className={`level-four-room room-9 ${route.includes(9)?'visited':''}`} disabled={!aligned||solved} onClick={()=>visit(9)}>9<span>Depósito</span></button>
        <button type="button" className={`level-four-room room-3 ${route.includes(3)?'visited':''}`} disabled={!aligned||solved} onClick={()=>visit(3)}>3<span>Generador</span></button>
        <button type="button" className={`level-four-room room-7 ${route.includes(7)?'visited':''}`} disabled={!aligned||solved} onClick={()=>visit(7)}>7<span>Escalera</span></button>
        <svg className={`level-four-route route-${route.length}`} viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true"><path d="M185 555 C310 510 365 430 500 390 S690 285 815 190"/></svg>
      </div></div>
      <aside className="level-four-tray"><div><span>FRAGMENTOS</span><b>{12-Object.keys(placed).length} PENDIENTES</b></div><div className={`level-four-active-preview ${activePiece?'has-piece':''}`}>{activePiece?<><span className="level-four-active-image" style={{'--piece-x':`${(activePiece.slot%4)*33.333}%`,'--piece-y':`${Math.floor(activePiece.slot/4)*50}%`,transform:`rotate(${rotation}deg) scaleX(${flipped?-1:1})`} as React.CSSProperties}/><b>FRAGMENTO {activePiece.id}</b><small>{rotation}° {flipped?'· INVERTIDO':''}</small></>:<p>Seleccioná una pieza para verla ampliada.</p>}</div><div className="level-four-mobile-controls"><button type="button" onClick={()=>{playEffect('rotate');setRotation((rotation+90)%360);}} disabled={!active||solved||busy}>↻ Girar 90°</button><button type="button" onClick={()=>{playEffect('rotate');setFlipped(!flipped);}} disabled={!active||solved||busy}>⇆ Dar vuelta</button><output aria-live="polite">{active?`${active} · ${rotation}°${flipped?' · INVERTIDO':''}`:'Elegí una pieza'}</output></div><div className="level-four-pieces">{pieces.map(piece=><button type="button" key={piece.id} className={`${active===piece.id?'selected':''} ${Object.values(placed).includes(piece.id)?'used':''}`} disabled={solved||Object.values(placed).includes(piece.id)} onClick={()=>choose(piece.id)} aria-label={`Elegir fragmento ${piece.id}`}><span style={{'--piece-x':`${(piece.slot%4)*33.333}%`,'--piece-y':`${Math.floor(piece.slot/4)*50}%`,transform:`rotate(${piece.start}deg)`} as React.CSSProperties}/><b>{piece.id}</b></button>)}</div><p>Trabajá con una pieza por vez. Girala en la vista grande y comparala con las líneas visibles del plano.</p></aside>
    </div>
    <div className="level-four-controls"><button type="button" onClick={()=>{playEffect('rotate');setRotation((rotation+90)%360);}} disabled={!active||solved||busy}>↻ Girar 90°</button><button type="button" onClick={()=>{playEffect('rotate');setFlipped(!flipped);}} disabled={!active||solved||busy}>⇆ Dar vuelta</button><div>{active?<>FRAGMENTO ACTIVO <b>{active}</b> · {rotation}° {flipped?'· INVERTIDO':''}</>:'SELECCIONÁ UN FRAGMENTO'}</div><output aria-live="polite">{feedback}</output></div>
    <div className="level-four-ledger"><span className={aligned?'ok':''}>◇ Norte</span><span className={aligned?'ok':''}>◉ Marca I</span><span className={aligned?'ok':''}>◉ Marca II</span><span className={aligned?'ok':''}>◉ Marca III</span><b>{solved?'RUTA 937 · CONFIRMADA':aligned?`RECORRIDO ${route.join(' → ')||'POR TRAZAR'}`:`PIEZAS COLOCADAS ${Object.keys(placed).length-6}/6`}</b></div>
  </section>;
}
