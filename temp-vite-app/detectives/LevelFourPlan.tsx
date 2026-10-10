import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {playCorridorDoor,playEffect,playPlanComplete,playPlanPiece} from './sounds';

const pieces=[
  {id:'A1',slot:0,start:180},{id:'A3',slot:2,start:270},{id:'B3',slot:4,start:180},
  {id:'C1',slot:6,start:270},{id:'C3',slot:8,start:90},{id:'D2',slot:10,start:270},
] as const;

const fixedPlacement:Record<number,string>={1:'A2',3:'B1',5:'B2',7:'C2',9:'D1',11:'D3'};
const shuffledPieces=['C3','A1','D2','B3','A3','C1'].map(id=>pieces.find(piece=>piece.id===id)!);

export default function LevelFourPlan({solved,busy,onSolved}:{solved:boolean;busy:boolean;onSolved:()=>Promise<void>}){
  const solvedPlacement={...fixedPlacement,...Object.fromEntries(pieces.map(piece=>[piece.slot,piece.id]))};
  const [active,setActive]=useState<string|null>(null);
  const [rotation,setRotation]=useState(0);
  const [placed,setPlaced]=useState<Record<number,string>>(solved?solvedPlacement:fixedPlacement);
  const [wrongSlot,setWrongSlot]=useState<number|null>(null);
  const [wrongKind,setWrongKind]=useState<'slot'|'orientation'|null>(null);
  const [targetSlot,setTargetSlot]=useState<number|null>(null);
  const [route,setRoute]=useState<number[]>(solved?[9,3,7]:[]);
  const [showRouteGuide,setShowRouteGuide]=useState(false);
  const [showDemo,setShowDemo]=useState(!solved);
  const [startSpot,setStartSpot]=useState({left:0,top:0,width:0,height:0});
  const startRef=useRef<HTMLSpanElement>(null);
  const [feedback,setFeedback]=useState(solved?'Ruta 937 confirmada. El corredor oculto quedó reconstruido.':'Elegí un fragmento, orientalo y buscá dónde continúan sus líneas.');
  const aligned=Object.keys(placed).length===12;
  const activePiece=pieces.find(piece=>piece.id===active);
  const placedCount=Object.keys(placed).length-Object.keys(fixedPlacement).length;

  useEffect(()=>{
    if(!showRouteGuide)return;
    const locate=()=>{
      const rect=startRef.current?.getBoundingClientRect();
      if(rect)setStartSpot({left:rect.left-12,top:rect.top-12,width:rect.width+24,height:rect.height+24});
    };
    const frame=requestAnimationFrame(locate);
    window.addEventListener('resize',locate);
    window.addEventListener('scroll',locate,true);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',locate);window.removeEventListener('scroll',locate,true);};
  },[showRouteGuide]);

  function choose(id:string){
    const selected=pieces.find(piece=>piece.id===id);
    if(!selected||Object.values(placed).includes(id)||solved)return;
    playEffect('piece');setActive(id);setRotation(selected.start);setWrongSlot(null);setWrongKind(null);setTargetSlot(null);
    setFeedback('Fragmento seleccionado. Giralo y probalo sobre el plano.');
  }

  function place(slot:number){
    if(solved)return;
    if(!activePiece){setFeedback('Primero elegí una pieza de la bandeja.');return;}
    if(placed[slot]){setFeedback('Ese sector ya está reconstruido. Probá en otro lugar.');return;}
    setTargetSlot(slot);
    if(activePiece.slot!==slot||rotation%360!==0){
      const kind=activePiece.slot===slot?'orientation':'slot';
      playEffect('error');setWrongSlot(slot);setWrongKind(kind);
      setFeedback(kind==='orientation'?'La casilla es correcta. Solo falta girar la pieza.':'Las líneas no continúan en esta casilla. Probá otro sector.');
      window.setTimeout(()=>{setWrongSlot(null);setWrongKind(null);},650);return;
    }
    const next={...placed,[slot]:activePiece.id};
    if(Object.keys(next).length===12){playPlanComplete();setShowRouteGuide(true);}else playPlanPiece();
    setPlaced(next);setActive(null);setWrongSlot(null);setWrongKind(null);setTargetSlot(null);
    const remaining=12-Object.keys(next).length;
    setFeedback(Object.keys(next).length===12?'Plano completo. Ahora seguí el recorrido desde INICIO.':remaining===1?'Fragmento confirmado. Falta 1 pieza.':`Fragmento confirmado. Faltan ${remaining} piezas.`);
  }

  async function visit(value:number){
    if(!aligned||solved||busy)return;
    const expected=[9,3,7];
    if(value!==expected[route.length]){setRoute([]);setFeedback('Ese recorrido termina en una zona pública. Volvé al punto de inicio.');return;}
    const next=[...route,value];setRoute(next);
    if(next.length===3){playCorridorDoor();setFeedback('Ruta 937 confirmada. El corredor oculto quedó reconstruido.');await onSolved();}
    else setFeedback(next.length===1?'Primer tramo confirmado. Seguí la conexión técnica.':'El recorrido continúa detrás del muro.');
  }

  return <section className={`level-four-workbench ${aligned?'is-aligned':''} ${solved?'is-solved':''}`} aria-labelledby="level-four-map-title">
    {showDemo&&createPortal(<div className="level-four-demo" role="dialog" aria-modal="true" aria-labelledby="plan-demo-title"><div><span>PRÁCTICA RÁPIDA · NO CUENTA COMO PIEZA</span><h2 id="plan-demo-title">Orientá antes de colocar.</h2><div className="level-four-demo-stage" aria-hidden="true"><i className="level-four-demo-slot"/><i className="level-four-demo-piece"/></div><p>Elegí un fragmento, giralo hasta que sus líneas continúen y recién entonces probalo en una casilla.</p><button type="button" className="primary-button" onClick={()=>setShowDemo(false)}>EMPEZAR A RECONSTRUIR <b>→</b></button></div></div>,document.body)}
    {showRouteGuide&&createPortal(<div className="level-four-route-guide" role="dialog" aria-modal="true" aria-labelledby="route-guide-title"><span className="level-four-route-guide-spotlight" style={{left:startSpot.left,top:startSpot.top,width:startSpot.width,height:startSpot.height}}/><div><span>PLANO COMPLETO</span><h2 id="route-guide-title">Empezá por INICIO.</h2><p>Seguí la conexión y marcá todos los números del recorrido para desbloquear la ruta.</p><button type="button" className="primary-button" onClick={()=>setShowRouteGuide(false)}>MARCAR EL RECORRIDO <b>→</b></button></div></div>,document.body)}
    <header className="level-four-map-heading"><div><p className="eyebrow">ESTACIÓN CARTOGRÁFICA · PLANO 1898</p><h2 id="level-four-map-title">Reconstruí el plano intervenido</h2></div><p>{aligned?'El plano está completo. Seguí las habitaciones en el orden del recorrido.':'Se desprendieron seis fragmentos del plano. Compará paredes, manchas y anotaciones.'}</p></header>
    <div className="level-four-map-layout">
      <div className="level-four-map-stage"><div className="level-four-antique-map" aria-label="Plano histórico del sector de mantenimiento">
        <img src="/los-archivos-f/images/plano-museo-antiguo-nivel4.png" alt="Plano arquitectónico antiguo del faro, dividido en doce sectores"/>
        <div className="level-four-grid">{Array.from({length:12},(_,slot)=><button type="button" key={slot} className={`${placed[slot]?'filled':''} ${targetSlot===slot&&!placed[slot]?'targeted':''} ${wrongSlot===slot?`wrong wrong-${wrongKind}`:''}`} onPointerEnter={()=>activePiece&&!placed[slot]&&setTargetSlot(slot)} onPointerLeave={()=>setTargetSlot(current=>current===slot?null:current)} onFocus={()=>activePiece&&!placed[slot]&&setTargetSlot(slot)} onClick={()=>place(slot)} aria-label={`Sector ${slot+1}${placed[slot]?', reconstruido':', vacío'}`} style={placed[slot]?{'--piece-x':`${(slot%4)*33.333}%`,'--piece-y':`${Math.floor(slot/4)*50}%`} as React.CSSProperties:undefined}>{placed[slot]?<span aria-hidden="true">✓</span>:<><i>{String(slot+1).padStart(2,'0')}</i><b>{targetSlot===slot?'CASILLA OBJETIVO':'SECTOR PERDIDO'}</b></>}</button>)}</div>
        <span ref={startRef} className="level-four-start">INICIO</span>
        <button type="button" className={`level-four-room room-9 ${route.includes(9)?'visited':''}`} disabled={!aligned||solved} onClick={()=>visit(9)}>9<span>Depósito</span></button>
        <button type="button" className={`level-four-room room-3 ${route.includes(3)?'visited':''}`} disabled={!aligned||solved} onClick={()=>visit(3)}>3<span>Generador</span></button>
        <button type="button" className={`level-four-room room-7 ${route.includes(7)?'visited':''}`} disabled={!aligned||solved} onClick={()=>visit(7)}>7<span>Escalera</span></button>
        <svg className={`level-four-route route-${route.length}`} viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true"><path d="M185 555 C310 510 365 430 500 390 S690 285 815 190"/></svg>
      </div></div>
      <aside className="level-four-tray"><div><span>FRAGMENTOS</span><b>{placedCount}/6 COLOCADAS</b></div><div className="level-four-piece-progress" aria-label={`${placedCount} de 6 piezas colocadas`}><i style={{width:`${placedCount/6*100}%`}}/></div><div className={`level-four-active-preview ${activePiece?'has-piece':''}`}>{activePiece?<><span className="level-four-active-image" style={{'--piece-x':`${(activePiece.slot%4)*33.333}%`,'--piece-y':`${Math.floor(activePiece.slot/4)*50}%`,transform:`rotate(${rotation}deg)`} as React.CSSProperties}/><b>FRAGMENTO ACTIVO</b><small>{rotation}°</small></>:<p>Seleccioná una pieza para verla ampliada.</p>}</div><div className="level-four-mobile-controls"><button type="button" onClick={()=>{playEffect('rotate');setRotation((rotation+90)%360);}} disabled={!active||solved||busy}>↻ Girar 90°</button><output aria-live="polite">{active?`FRAGMENTO ACTIVO · ${rotation}°${targetSlot!==null?` · CASILLA ${String(targetSlot+1).padStart(2,'0')}`:''}`:'Elegí una pieza'}</output></div><div className="level-four-pieces">{shuffledPieces.map((piece,index)=><button type="button" key={piece.id} className={`${active===piece.id?'selected':''} ${Object.values(placed).includes(piece.id)?'used':''}`} disabled={solved||Object.values(placed).includes(piece.id)} onClick={()=>choose(piece.id)} aria-label={`Elegir fragmento de plano, posición ${index+1} en la bandeja`}><span style={{'--piece-x':`${(piece.slot%4)*33.333}%`,'--piece-y':`${Math.floor(piece.slot/4)*50}%`,transform:`rotate(${piece.start}deg)`} as React.CSSProperties}/></button>)}</div><p>Trabajá con una pieza por vez. Girala y comparala con las líneas visibles del plano.</p></aside>
    </div>
    <div className="level-four-controls"><button type="button" onClick={()=>{playEffect('rotate');setRotation((rotation+90)%360);}} disabled={!active||solved||busy}>↻ Girar 90°</button><div>{active?<>FRAGMENTO ACTIVO · {rotation}°</>:'SELECCIONÁ UN FRAGMENTO'}</div><output aria-live="polite">{feedback}</output></div>
    <div className="level-four-ledger"><span className={aligned?'ok':''}>◇ Norte</span><span className={route.length>0?'ok':''}>◉ Marca I</span><span className={route.length>1?'ok':''}>◉ Marca II</span><span className={route.length>2?'ok':''}>◉ Marca III</span><b>{solved?'RUTA 937 · CONFIRMADA':aligned?`RECORRIDO · ${route.length}/3 NÚMEROS`:`PIEZAS COLOCADAS ${placedCount}/6`}</b></div>
  </section>;
}
