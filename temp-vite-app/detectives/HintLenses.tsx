import { useRef, useState, type CSSProperties } from 'react';

export default function HintLenses({hints, used, busy, canRequest, onRequest}: {
  hints: string[]; used: number; busy: boolean; canRequest: boolean; onRequest: () => Promise<boolean>;
}) {
  const [active, setActive] = useState<number | null>(null);
  const pending = useRef(false);
  async function reveal(index: number) {
    if (index < used) { setActive(index); return; }
    if (pending.current || busy || !canRequest || index !== used) return;
    pending.current = true;
    try { if (await onRequest()) setActive(index); }
    finally { pending.current = false; }
  }
  return <section className="hint-lenses" aria-label="Pistas de la investigación" onMouseLeave={()=>setActive(null)} onKeyDown={e=>{if(e.key==='Escape')setActive(null);}}>
    <div className="hint-lenses-heading"><div><h2>Una mirada más cerca</h2><p>Tocá una lupa para descubrir una pista.</p></div><span>{used} / {hints.length} utilizadas</span></div>
    <div className="hint-lenses-row">{hints.map((_, index) => {
      const revealed = index < used;
      const next = index === used && canRequest;
      return <button key={index} className={`hint-lens ${revealed?'used':next?'available':'sealed'}`}
        disabled={!revealed && (!next || busy)} aria-label={`${revealed?'Volver a ver':'Pedir'} pista ${index+1}${!revealed&&!next?' · bloqueada':''}`}
        aria-expanded={revealed && active === index} aria-controls={revealed?'hint-parchment':undefined}
        onClick={()=>void reveal(index)} onMouseEnter={()=>{if(revealed)setActive(index);}}
        onFocus={()=>{if(revealed)setActive(index);}} onBlur={()=>setActive(null)}>
        <img src="/los-archivos-f/images/lupa-pista.png" alt=""/><b>{String(index+1).padStart(2,'0')}</b>
        <span>{revealed?'Consultada':next?'Descubrir':'Sellada'}</span>
      </button>;
    })}
    <div className="hint-popover" style={{'--hint-index':active ?? 0} as CSSProperties} aria-live="polite" aria-atomic="true">{active !== null && active < used && <aside id="hint-parchment" className="hint-parchment"><span>AGENCIA F · PISTA {active+1}</span><p>{hints[active]}</p><button aria-label="Cerrar pista" onClick={()=>setActive(null)}>×</button></aside>}</div></div>
    <p className="hint-lenses-help">Pasá el cursor o tocá una lupa usada para releer.</p>
  </section>;
}
