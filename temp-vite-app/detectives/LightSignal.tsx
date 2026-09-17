import {useEffect, useRef, useState} from 'react';

export default function LightSignal({sequence}: {sequence:string}) {
  const receiver = useRef<HTMLElement>(null);
  const groups = sequence.split('/').map(group => group.trim().split(/\s+/));
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState({group:-1, symbol:-1, lit:false});
  useEffect(() => {
    const envelope = receiver.current?.closest('details');
    const close = () => { if (!envelope?.open) { setPlaying(false); setPosition({group:-1,symbol:-1,lit:false}); } };
    envelope?.addEventListener('toggle',close);
    return () => envelope?.removeEventListener('toggle',close);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const frames: Array<{group:number; symbol:number; lit:boolean; duration:number}> = [];
    groups.forEach((symbols, group) => symbols.forEach((symbol, index) => {
      frames.push({group,symbol:index,lit:true,duration:symbol === 'o' ? 450 : 1350});
      frames.push({group,symbol:index,lit:false,duration:index === symbols.length - 1 ? 1800 : 450});
    }));
    let index = 0;
    function step() {
      if (cancelled) return;
      const frame = frames[index++];
      if (!frame) { setPlaying(false); setPosition({group:-1,symbol:-1,lit:false}); return; }
      setPosition(frame);
      timer = setTimeout(step, frame.duration);
    }
    step();
    return () => { cancelled = true; clearTimeout(timer); };
    // Sequence is fixed for the current receiver; restarting always begins at group one.
  }, [playing, sequence]);
  const stop = () => { setPlaying(false); setPosition({group:-1,symbol:-1,lit:false}); };
  return <section ref={receiver} className="light-signal" aria-label="Receptor de señales luminosas">
    <div className="light-signal-head"><span className={`signal-lamp ${position.lit ? 'is-lit' : ''}`} aria-hidden="true"/><div><b>SEÑAL INTERCEPTADA</b><small>{playing ? `Recibiendo grupo ${position.group + 1} de ${groups.length}` : 'Receptor listo · seis grupos'}</small></div></div>
    <div className="signal-groups" aria-label={`Secuencia: ${sequence}`}>
      {groups.map((symbols, group) => <span key={group} className={position.group === group ? 'receiving' : ''} aria-hidden="true">{symbols.map((symbol,index) => <i key={index} className={position.lit && position.group === group && position.symbol === index ? 'lit-symbol' : ''}>{symbol}</i>)}</span>)}
    </div>
    <button type="button" className="unlock-button" onClick={() => playing ? stop() : setPlaying(true)}>{playing ? 'DETENER SEÑAL' : 'REPRODUCIR SEÑAL'}</button>
    <p>Podés repetirla o leer los símbolos sin reproducir. Buscá su significado en la guía G-01.</p>
  </section>;
}
