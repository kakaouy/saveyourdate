import TerminalLevel from './TerminalLevel';
import FinalStatement from './FinalStatement';
import LightSignal from './LightSignal';
import HintLenses from './HintLenses';
import Typewriter from './Typewriter';
import MissionMap from './MissionMap';
'use client';

import Briefing from './Briefing';
import { levels, unlockMessages, microChecks } from './case';
import type { GameState } from './game-state';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type Screen = 'home' | 'briefing' | 'library' | 'game';



const statements = [
  { name: 'Bruno Vidal', code:'BV-3049', role: 'Fotógrafo e inventarista', location: 'Sala de inventario', summary: 'Trabajaba con el registro fotográfico de las piezas antes y después del corte.', image: '/los-archivos-f/images/bruno-ficha-v2.png', audio: '/los-archivos-f/audio/nivel-2-bruno.wav', text: 'Estuve tomando fotos para el inventario antes y después del corte. La cámara guarda la hora de cada toma.' },
  { name: 'Vera Salas', code:'VS-8124', role: 'Encargada del archivo', location: 'Archivo Histórico', summary: 'Había entrado al archivo y afirma que salió cuando regresó la luz.', image: '/los-archivos-f/images/vera-ficha-v2.png', audio: '/los-archivos-f/audio/nivel-2-vera.wav', text: 'Entré al Archivo Histórico antes del apagón y salí cuando volvió la luz. Mi tarjeta registró los dos movimientos.' },
  { name: 'León Costa', code:'LC-1888', role: 'Prensa y entrevistas', location: 'Sala de entrevistas y cafetería', summary: 'Participaba en entrevistas y recuerda una pausa breve en la cafetería.', image: '/los-archivos-f/images/leon-ficha-v2.png', audio: '/los-archivos-f/audio/nivel-2-leon.wav', text: 'Estaba con las entrevistas. Hicimos una pausa corta en la cafetería y después seguimos. Vi unas señales extrañas y las anoté en una servilleta.' },
  { name: 'Martina Ríos', code:'MR-5092', role: 'Restauradora', location: 'Taller de restauración', summary: 'Ordenaba materiales del taller y cerró el lote al terminar el apagón.', image: '/los-archivos-f/images/martina-ficha-v2.png', audio: '/los-archivos-f/audio/nivel-2-martina.wav', text: 'Estuve trabajando en restauración. Ordené los materiales antes del apagón y cerré el lote después. La terminal del taller registra los movimientos.' },
];

const levelVisuals = ['/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-hidden-corridor.png', '/los-archivos-f/images/bg-restoration-workshop.png', '/los-archivos-f/images/bg-restoration-workshop.png', '/los-archivos-f/images/bg-hidden-corridor.png'];
const successVisuals = ['/los-archivos-f/images/bruno-storm.jpg', '/los-archivos-f/images/suspects-group.jpg', '/los-archivos-f/images/control-room.jpg', '/los-archivos-f/images/corridor-spoiler-418.jpg', '/los-archivos-f/images/martina-dark.jpg', '/los-archivos-f/images/lens-workshop.jpg', '/los-archivos-f/images/evidence-spread-spoiler.jpg'];



function InterrogationDialog({ index, onClose }: { index: number; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [speaking, setSpeaking] = useState(false);
  const person = statements[index];
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  return <dialog ref={dialogRef} className="interrogation-dialog" aria-labelledby="interrogation-name" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="interrogation-layout">
      <button className="interrogation-close" onClick={onClose} autoFocus aria-label="Cerrar interrogatorio">Cerrar <span aria-hidden="true">×</span></button>
      <figure className={`interrogation-portrait ${speaking ? 'is-speaking' : ''}`}><img src={person.image} alt={person.name} /><span className="voice-ripple" aria-hidden="true"/><figcaption>ARCHIVO F-01 / SUJETO 0{index + 1}</figcaption></figure>
      <div className="interrogation-content">
        <p className="eyebrow">REGISTRO DE INTERROGATORIO · 0{index + 1}</p>
        <h2 id="interrogation-name">{person.name}</h2>
        <dl className="suspect-details"><div><dt>Ocupación</dt><dd>{person.role}</dd></div><div><dt>Credencial</dt><dd>{person.code}</dd></div><div><dt>Ubicación declarada</dt><dd>{person.location}</dd></div></dl>
        <section><h3>Resumen de la declaración</h3><p>{person.summary}</p></section>
        <section className={`interrogation-recording ${speaking ? 'is-speaking' : ''}`}><h3>{speaking ? `${person.name} está hablando…` : 'Escuchá el interrogatorio'}</h3><audio controls preload="metadata" src={person.audio} aria-label={`Interrogatorio de ${person.name}`} onPlay={()=>setSpeaking(true)} onPause={()=>setSpeaking(false)} onEnded={()=>setSpeaking(false)} /><p className="recording-note">DECLARACIÓN 0{index + 1} DE 04</p></section>
        <details className="interrogation-transcript"><summary>Leer declaración</summary><blockquote>“{person.text}”</blockquote></details>
        <p className="interrogation-instruction">Una declaración orienta la investigación, pero los registros deciden qué puede demostrarse.</p>
      </div>
    </div>
  </dialog>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('home');
  const [showAccess, setShowAccess] = useState(false);
  const [code, setCode] = useState('');
  const [agent, setAgent] = useState('');
  const [level, setLevel] = useState(0);
  const [highestLevel, setHighestLevel] = useState(0);
  const [busy, setBusy] = useState(false);
  const [activeSession, setActiveSession] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState('');
  const legacyRef = useRef<(Partial<GameState> & { code?: string }) | null>(null);
  const unlocked = level >= 1 && level <= 7 && highestLevel > level;
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [hints, setHints] = useState<Record<number, number>>({});
  const [selectedStatement, setSelectedStatement] = useState<number | null>(null);
  const [finalAnswers, setFinalAnswers] = useState({ who: '', how: '', where: '' });
  const [musicOn, setMusicOn] = useState(true);
  const musicEnabled = useRef(true);
  const musicRef = useRef<HTMLAudioElement>(null);
  const [checkProgress, setCheckProgress] = useState<Record<number, number>>({});
  const [checkSelection, setCheckSelection] = useState<number | null>(null);
  const [checkFeedback, setCheckFeedback] = useState('');
  const [checkPassed, setCheckPassed] = useState(false);

  function receiveState(state: GameState) {
    setAgent(state.agent); setHighestLevel(state.highestLevel); setHints(state.hints); setCheckProgress(state.checkProgress); setCompletedAt(state.completedAt); setActiveSession(true);
  }

  useEffect(() => {
    const queryCode = new URLSearchParams(window.location.search).get('codigo');
    try {
      const legacy = JSON.parse(localStorage.getItem('archivos-f-demo') || 'null');
      if (legacy) {
        legacyRef.current = {...legacy, highestLevel: legacy.highestLevel ?? legacy.level ?? 0};
        if (!queryCode) { setAgent(legacy.agent || ''); setCode(legacy.code || ''); }
      }
    } catch { /* A new family session does not require local storage. */ }
    if (queryCode) { setCode(queryCode.toUpperCase()); history.replaceState(null, '', window.location.pathname); return; }
    setBusy(true);
    fetch('/los-archivos-f/api/game').then(async response => {
      if (response.ok) { const state = await response.json() as GameState; receiveState(state); setLevel(state.highestLevel); setSaveStatus('Partida recuperada'); }
      else if (response.status !== 401) setSaveStatus('No pudimos recuperar la partida. Volvé a ingresar con tu código.');
    }).catch(() => setSaveStatus('No hay conexión. Volvé a ingresar cuando se restablezca.')).finally(() => setBusy(false));
  }, []);

  async function gameAction(body: Record<string, unknown>) {
    setBusy(true); setMessage(''); setSaveStatus('Guardando…');
    try {
      const response = await fetch('/los-archivos-f/api/game', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data = await response.json() as GameState & {error?:string;code?:string};
      if (!response.ok) throw new Error(data.error || 'No pudimos guardar. Volvé a intentar.');
      receiveState(data); setSaveStatus('Progreso guardado'); return data as GameState;
    } catch(error) {
      const text = error instanceof Error ? error.message : 'No hay conexión. Volvé a intentar.';
      setMessage(text); setSaveStatus('No se guardó el último cambio. Volvé a intentar.'); return null;
    } finally { setBusy(false); }
  }

  useEffect(() => {
    const player = musicRef.current;
    if (!player) return;
    // Keep one ambient player mounted across access, briefing and case screens.
    const syncVolume = () => {
      const speaking = Array.from(document.querySelectorAll('audio')).some(audio => audio !== player && !audio.paused && !audio.ended);
      player.volume = speaking ? 0.04 : 0.22;
    };
    const start = () => {
      if (!musicEnabled.current || !player.paused) return;
      syncVolume();
      void player.play().then(() => { if (!musicEnabled.current) player.pause(); }).catch(() => {
        // Autoplay may be blocked; a subsequent gesture retries without resetting time.
      });
    };
    const gesture = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('.music-button')) return;
      start();
    };
    document.addEventListener('pointerdown', gesture, true);
    document.addEventListener('keydown', gesture, true);
    for (const type of ['play', 'pause', 'ended', 'emptied']) document.addEventListener(type, syncVolume, true);
    const observer = new MutationObserver(syncVolume);
    observer.observe(document.body, {childList:true,subtree:true});
    start();
    return () => {
      document.removeEventListener('pointerdown', gesture, true);
      document.removeEventListener('keydown', gesture, true);
      for (const type of ['play', 'pause', 'ended', 'emptied']) document.removeEventListener(type, syncVolume, true);
      observer.disconnect();
      player.pause();
    };
  }, []);

  function visitLevel(destination: number) {
    if (destination < 0 || destination > highestLevel) return;
    setLevel(destination); setAnswer(''); setMessage(''); setCheckSelection(null); setCheckFeedback(''); setCheckPassed(false); setSelectedStatement(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const hintsUsed = useMemo(() => Object.values(hints).reduce((a, b) => a + b, 0), [hints]);

  async function access(event: FormEvent) {
    event.preventDefault();
    if (!agent.trim()) { setMessage('Escribí tu nombre o alias de agente.'); return; }
    const state = await gameAction({action:'activate',code,agent,legacy:legacyRef.current?.code === code ? legacyRef.current : undefined});
    if (!state) return;
    setLevel(state.highestLevel); setAnswer(''); setSelectedStatement(null); setShowAccess(false); setScreen('library'); window.scrollTo(0,0);
    setCheckSelection(null); setCheckPassed(false); setCheckFeedback(''); setFinalAnswers({who:'',how:'',where:''});
  }

  async function startInvestigation() {
    if (await gameAction({action:'start'})) setLevel(1);
  }

  async function submitLevel(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!answer.trim()) { setMessage('Elegí una respuesta antes de verificar.'); return; }
    if (await gameAction({action:'unlock',level,answer})) { setMessage(`Desbloqueaste: ${levels[level-1].unlock}.`); setAnswer(''); }
  }

  function continueInvestigation() {
    visitLevel(level + 1);
  }

  function verifyMicroCheck(correct: number) {
    if (checkSelection === null) { setCheckFeedback('Elegí una opción antes de verificar.'); return; }
    if (checkSelection !== correct) { setCheckFeedback('Esa deducción no coincide con las pruebas. Revisá el material y probá otra opción.'); setCheckPassed(false); return; }
    setCheckFeedback('Deducción correcta.'); setCheckPassed(true);
  }

  async function continueMicroCheck() {
    if (!await gameAction({action:'deduction',level,index:checkProgress[level]||0,selection:checkSelection})) return;
    setCheckSelection(null); setCheckFeedback(''); setCheckPassed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function requestHint() { return Boolean(await gameAction({action:'hint',level})); }

  async function submitFinal(event: FormEvent) {
    event.preventDefault();
    if (await gameAction({action:'final',...finalAnswers})) setLevel(9);
  }

  async function downloadDiploma() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/los-archivos-f/api/diploma');
      if(!response.ok) throw new Error('No pudimos preparar el diploma. Volvé a intentar.');
      const url=URL.createObjectURL(await response.blob());
      const link=document.createElement('a'); link.href=url; link.download='Diploma-Agencia-F.pdf'; link.click();
      setTimeout(()=>URL.revokeObjectURL(url),10000);
    } catch(error) { setMessage(error instanceof Error ? error.message : 'No se pudo descargar el diploma.'); }
    finally { setBusy(false); }
  }

  async function toggleMusic() {
    const player = musicRef.current;
    if (!player) return;
    const enabled = !musicEnabled.current;
    musicEnabled.current = enabled;
    setMusicOn(enabled);
    if (!enabled) { player.pause(); return; }
    try { await player.play(); if (!musicEnabled.current) player.pause(); }
    catch { /* Retry on the next user gesture if the browser blocks playback. */ }
  }

  return (
    <main className="site-shell" aria-busy={busy}><fieldset className="app-controls" disabled={busy}>
      <nav className="topbar" aria-label="Navegación principal">
        <button className="brand brand-button" onClick={() => setScreen('home')}><img className="brand-logo" src="/los-archivos-f/images/logo-archivos-f.png" alt=""/><span>LOS ARCHIVOS F</span></button>
        <div className="nav-meta"><span>10 OCT</span><span className="nav-dot" /><span>FEDE · 11 AÑOS</span></div>
        <div className="nav-tools"><button className={`music-button ${musicOn ? 'on' : ''}`} onClick={toggleMusic} aria-pressed={musicOn}>{musicOn ? '♫ AMBIENTE ON' : '♪ ACTIVAR MISTERIO'}</button>{activeSession && screen !== 'home' && screen !== 'briefing' && <button className="agent-chip" onClick={() => setScreen('library')}>AGENTE {agent.toUpperCase()}</button>}</div>
        <audio ref={musicRef} src="/los-archivos-f/audio/ambiente-faro.wav" loop preload="auto" />
      </nav>

      {screen === 'home' && <section className="welcome-page">
        <div className="welcome-heading"><p className="eyebrow">AGENCIA F · ACCESO CONFIDENCIAL</p><h1 className="welcome-title">Bienvenido a Los Archivos F</h1><img className="welcome-logo" src="/los-archivos-f/images/logo-archivos-f.png" alt="Los Archivos F · Escape room digital"/><p>Una misión especial por los <strong>11 años de Fede.</strong></p><span className="welcome-seal">TU AVENTURA COMIENZA ACÁ</span></div>
        <form className="access-card welcome-access" onSubmit={access}><p className="eyebrow dark">IDENTIFICATE, AGENTE</p><h2>¿Listo para el misterio?</h2><p><Typewriter text="Ingresá tu nombre y el código de acceso de tu carpeta."/></p><label htmlFor="welcome-name">Tu nombre o alias</label><input id="welcome-name" value={agent} onChange={e=>setAgent(e.target.value)} placeholder="¿Cómo te llamás, agente?" required maxLength={48} autoComplete="nickname"/><label htmlFor="welcome-code">Código de acceso</label><input id="welcome-code" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="F01-XXXX-XXXX-XXXX-XXXX" required autoComplete="off" autoCapitalize="characters" spellCheck={false}/>{message && <p className="form-error" role="alert">{message}</p>}<button className="primary-button full" type="submit">ENTRAR A LA CÁMARA DE EXPEDIENTES <span>→</span></button><small>Encontrá tu código debajo del QR. No necesitás una cuenta. Podés usar un alias y volver con el mismo código para recuperar tu partida.</small>{activeSession && <button type="button" className="resume-welcome" onClick={()=>{setScreen('library');window.scrollTo(0,0);}}>Continuar con mi partida guardada →</button>}</form>
      </section>}

      {screen === 'briefing' && <Briefing agent={agent} alreadyAccepted={highestLevel>0} onComplete={async()=>{if(highestLevel===0)await startInvestigation();setScreen('game');window.scrollTo(0,0);}}/>}

      {screen === 'library' && <section className="library-page">
        <p className="save-status" role="status">{saveStatus}</p><div className="page-heading"><p className="eyebrow dark">BIENVENIDO, AGENTE {agent.toUpperCase()}</p><img className="library-emblem" src="/los-archivos-f/images/emblema-archivos-f.png" alt="Sello de Los Archivos F"/><h1>La cámara de los expedientes</h1><p><Typewriter text="Un archivo te está esperando. Examiná su portada y abrilo para seguir el rastro. Tu avance queda guardado con el código de tu carpeta."/></p></div>
        <button className="switch-code" onClick={() => {setCode(''); setMessage(''); setShowAccess(true);}}>Ingresar otro código de carpeta</button><div className="case-grid">
          <article className="case-card active"><div className="case-visual"><img src="/los-archivos-f/images/hero-archivos-f.png" alt="El rubí rojo sobre un mapa y el faro iluminado junto al mar" /><span>F-01</span></div><div className="case-copy"><small>CASO DISPONIBLE · DIFICULTAD MEDIA</small><h2>El robo del Rubí del Faro</h2><p>Un rubí robado, cuatro sospechosos y un apagón que investigar.</p><ul><li>7 niveles</li><li>16 desafíos</li><li>60–90 min</li><li>Físico + digital</li></ul><button className="primary-button" onClick={() => { if(highestLevel===0){setScreen('briefing');}else{setLevel(Math.max(1,level));setScreen('game');} window.scrollTo(0,0); }}>ABRIR EXPEDIENTE <span>→</span></button></div></article>
          {[2,3].map((n) => <article className="case-card locked" key={n}><div className="locked-mark">F-0{n}</div><small>EXPEDIENTE CLASIFICADO</small><h2>Próximamente</h2><p>Tu autorización para este caso todavía no fue emitida.</p></article>)}
        </div>
      </section>}

      {screen === 'game' && <section className="game-page">
        <MissionMap level={level} highestLevel={highestLevel} hintsUsed={hintsUsed} hintPanel={level >= 1 && level <= 7 ? <HintLenses key={level} hints={levels[level-1].hints} used={hints[level] || 0} busy={busy} canRequest={!unlocked} onRequest={requestHint}/> : <p className="no-stage-hints">Entrá a un nivel de la investigación para consultar sus pistas.</p>} saveStatus={saveStatus} visitLevel={visitLevel} onMission={()=>{setScreen('briefing');window.scrollTo(0,0);}} onLibrary={()=>{setScreen('library');window.scrollTo(0,0);}}/>

        <div className="investigation-panel">
          {level !== 1 && level !== 2 && level <= 7 && <figure className={`scene-frame ${level === 0 ? 'storm-layer' : level === 4 || level === 7 ? 'beam-layer' : 'lamp-layer'}`}><img src={level === 0 ? '/los-archivos-f/images/control-room.jpg' : unlocked ? successVisuals[level - 1] : levelVisuals[level - 1]} alt="Escena del Museo del Faro vinculada con la investigación" /><span>{unlocked ? 'EVIDENCIA VISUAL DESBLOQUEADA' : 'REGISTRO VISUAL · ARCHIVO F-01'}</span></figure>}
          
          {level === 0 && <section className="mission-intro"><p className="eyebrow dark">ARCHIVO F-01 · MISIÓN ACEPTADA</p><h1>El robo del Rubí del Faro</h1><p><Typewriter text="Robaron el Rubí del Faro. El archivo de las personas presentes quedó bloqueado después del apagón. Recuperá el acceso para comenzar a reconstruir lo que pasó."/></p><p>No abras el sobre negro hasta recibir la autorización de Fede.</p><button className="primary-button" onClick={startInvestigation}>COMENZAR NIVEL 1 <span>→</span></button><button className="reading-choice" onClick={()=>setScreen('briefing')}>Volver a escuchar a Federica</button></section>}

          {level === 1 && <TerminalLevel unlocked={unlocked} busy={busy} message={message} onUnlock={async value=>Boolean(await gameAction({action:"unlock",level:1,answer:value}))} onContinue={continueInvestigation}/>}
          {level >= 2 && level <= 7 && (() => {
            const current = levels[level - 1];
            const unlockedMessage = unlockMessages[level - 1];
            const checkIndex = unlocked ? microChecks[level - 1].length : checkProgress[level] || 0;
            const currentCheck = microChecks[level - 1][checkIndex];
            const completedChecks = microChecks[level - 1].length;
            return <section className="level-card">
              <p className="eyebrow dark">{current.kicker}</p><h1>{current.title}</h1>
              {level === 2 && <div className={`level-two-fede ${unlocked ? 'success' : ''}`}><img src={unlocked ? '/los-archivos-f/images/federica-nivel-2-exito-v1.png' : '/los-archivos-f/images/federica-nivel-2-inicio-v1.png'} alt="Federica en la sala de entrevistas del museo"/><div><p className="eyebrow">MENSAJE DE FEDE</p><h2>{unlocked ? 'Una coartada quedó verificada.' : 'No alcanza con recordar: hay que demostrar.'}</h2><p>{unlocked ? 'Los registros se superponen y cubren todo el intervalo. Esa persona queda descartada de esta parte de la investigación.' : 'Escuchá las cuatro declaraciones y compará sus recorridos. Buscá quién puede demostrar dónde estuvo durante todo el intervalo crítico.'}</p></div></div>}
              {level === 2 && !unlocked && <div className="level-mission"><span>MISIÓN DEL NIVEL</span><p>Descartar exactamente a una persona comprobando su recorrido completo entre las 19:30 y las 19:50.</p></div>}
              {level !== 2 && <div className="challenge-counter"><span>DEDUCCIONES {Math.min(checkIndex, completedChecks)}/{completedChecks}</span><span>CANDADO FINAL {unlocked ? 'RESUELTO' : currentCheck ? 'BLOQUEADO' : 'DISPONIBLE'}</span></div>}
              <details key={`digital-${level}`} className="clue-envelope digital-envelope"><summary><span>◉</span><b>Interceptar archivo digital<small>Una señal de Federica · tocar para revelar</small></b><span>+</span></summary><div className="digital-brief">{level === 3 ? <LightSignal sequence={current.digital}/> : <p><Typewriter text={current.digital}/></p>}</div></details>
              {level === 2 && <section className="suspect-board" aria-label="Panel de sospechosos"><div className="suspect-board-heading"><h2>Cuatro versiones. El mismo intervalo.</h2><p>Abrí cada ficha, observá la escena completa y escuchá a cada persona.</p></div><div className="suspect-grid">{statements.map((person, index) => <button className="suspect-file" key={person.name} onClick={() => setSelectedStatement(index)} aria-label={`Abrir interrogatorio de ${person.name}`}><div className="suspect-file-photo"><span className="suspect-file-id">{person.code}</span><img src={person.image} alt="" /></div><div className="suspect-file-caption"><span>{person.role}</span><h3>{person.name}</h3><p>Escuchar declaración <span aria-hidden="true">↗</span></p></div></button>)}</div></section>}

              {level !== 2 && <details key={`physical-${level}`} className="clue-envelope physical-envelope"><summary><span>⌕</span><b>Examinar documentos físicos<small>Descubrí qué pruebas necesitás en esta etapa</small></b><span>+</span></summary><div className="physical-brief">{current.evidence.map((item) => <b key={item}>{item}</b>)}</div></details>}
              {!unlocked && currentCheck && <div className="micro-challenge"><p className="eyebrow dark">DEDUCCIÓN {checkIndex + 1} DE {completedChecks}</p><h2><Typewriter text={currentCheck.question}/></h2><div className="micro-options">{currentCheck.options.map((option, index) => <button key={option} className={checkSelection === index ? 'selected' : ''} onClick={() => { if (!checkPassed) { setCheckSelection(index); setCheckFeedback(''); } }}>{option}</button>)}</div>{checkFeedback && <p className={checkPassed ? 'micro-success' : 'micro-error'}>{checkPassed ? currentCheck.success : checkFeedback}</p>}{checkPassed ? <button className="primary-button" onClick={continueMicroCheck}>REGISTRAR DEDUCCIÓN <span>→</span></button> : <button className="unlock-button" onClick={() => verifyMicroCheck(currentCheck.correct)}>VERIFICAR DEDUCCIÓN</button>}</div>}
              {!unlocked && !currentCheck && <form className={`lock-panel lock-${current.lock}`} onSubmit={submitLevel}><div className="lock-ready">✓ INVESTIGACIÓN COMPLETA · CANDADO HABILITADO</div><label htmlFor="level-answer"><Typewriter text={current.prompt}/></label><input id="level-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={current.placeholder} autoComplete="off" /><button className="unlock-button" type="submit">DESBLOQUEAR NIVEL</button></form>}
              {message && <p className={message.startsWith('Desbloqueaste') ? 'success-message' : 'error-message'}>{message}</p>}
              {unlocked && <details className="completed-deductions"><summary>Consultar deducciones resueltas</summary>{microChecks[level - 1].map((check) => <div key={check.question}><h3>{check.question}</h3><p>✓ {check.success}</p></div>)}</details>}
              {unlocked && <div className="unlock-reveal"><div className="unlock-icon">✓</div><p className="eyebrow dark">MENSAJE DE FEDE DESBLOQUEADO</p><h2>{current.unlock}</h2><audio key={unlockedMessage.audio} className="unlock-audio" controls src={unlockedMessage.audio}>Tu navegador no puede reproducir este audio.</audio><p>“{unlockedMessage.text}”</p><button className="primary-button" onClick={continueInvestigation}>CONTINUAR <span>→</span></button></div>}
            </section>;
          })()}

          {level === 8 && <section className="level-card final-card"><p className="eyebrow dark">ACUSACIÓN FINAL</p><h1>Reconstruí los hechos.</h1><p className="final-intro"><Typewriter text="Una acusación completa debe explicar quién retiró el rubí, cómo lo hizo y dónde escondió el original."/></p><FinalStatement highestLevel={highestLevel}/><details className="completed-deductions"><summary>Preparar la reconstrucción · hoja K-01</summary><p>Antes de enviar, anotá en K-01 qué evidencia sostiene cada respuesta. Podés volver a los niveles resueltos desde Misión.</p><ul><li>Persona: contrastá la nueva declaración D-05 con las fichas D-01 a D-04 y el registro E-01. Separá lo que reconoce Martina de las pruebas que lo corroboran.</li><li>Método: reuní la hora del apagón, el recorrido del plano y lo descubierto en F-01 y H-01.</li><li>Escondite: relacioná I-01, G-02 y el compartimento LF-04.</li></ul><p>Una contradicción por sí sola no demuestra el robo. Buscá una explicación que conecte todas las pruebas.</p></details><form className="final-form" onSubmit={submitFinal}><label>¿Quién retiró el rubí?<select required value={finalAnswers.who} onChange={(e) => setFinalAnswers({...finalAnswers,who:e.target.value})}><option value="">Elegí una persona</option><option value="bruno">Bruno Vidal</option><option value="vera">Vera Salas</option><option value="leon">León Costa</option><option value="martina">Martina Ríos</option></select></label><label>¿Cómo realizó el cambio?<select required value={finalAnswers.how} onChange={(e) => setFinalAnswers({...finalAnswers,how:e.target.value})}><option value="">Elegí una reconstrucción</option><option value="cafeteria">Entró antes y lo escondió en la cafetería</option><option value="corredor">Usó el apagón, el corredor y dejó una réplica</option><option value="terraza">Salió por la terraza con ayuda de seguridad</option></select></label><label>¿Dónde escondió el original?<select required value={finalAnswers.where} onChange={(e) => setFinalAnswers({...finalAnswers,where:e.target.value})}><option value="">Elegí un lugar</option><option value="bolso">En el bolso de trabajo</option><option value="generador">En la sala del generador</option><option value="lente">En la base de la lente de Fresnel</option></select></label><button className="primary-button" type="submit" disabled={busy}>PRESENTAR ACUSACIÓN <span>→</span></button></form>{message && <p className="error-message">{message}</p>}</section>}

          {level === 9 && <section className="resolution-card"><div className="resolved-seal">CASO<br /><strong>CERRADO</strong></div><p className="eyebrow">ARCHIVO F-01 RESUELTO</p><h1>Excelente trabajo,<br />agente {agent}.</h1><p>Martina Ríos fabricó una réplica, utilizó el corredor durante el apagón y escondió el rubí original en la base de la lente de Fresnel.</p><p>Quería forzar una investigación sobre la procedencia de la gema. Eso explica su motivo, pero no justifica el robo. El museo deberá aclarar el origen del rubí.</p><p><Typewriter text="Fede está a salvo: fue al faro antiguo a comprobar una teoría y la tormenta la dejó sin señal. Ya podés abrir el paquete de la gema de recuerdo."/></p><audio className="final-audio" controls autoPlay src="/los-archivos-f/audio/fede-caso-cerrado.wav">Tu navegador no puede reproducir este audio.</audio><blockquote>“Un buen detective no solo descubre quién hizo algo. También se pregunta cómo pudo hacerlo, qué pruebas lo demuestran y por qué tomó esa decisión.” <b>— Fede</b></blockquote><div className="result-stats"><span><b>{hintsUsed}</b>Pistas utilizadas</span><span><b>{hintsUsed <= 1 ? 'Detective del Faro' : hintsUsed <= 3 ? 'Especialista en Evidencias' : 'Agente de Investigación'}</b>Rango obtenido</span></div><FinalStatement highestLevel={highestLevel}/><div className="diploma-preview"><span className="diploma-ink-seal" aria-hidden="true">CASO<br/>★<br/>CERRADO</span><p>LOS ARCHIVOS F · AGENCIA F</p><p className="diploma-preview-title">Diploma de reconocimiento</p><h2>{agent}</h2><p>Resolvió El robo del Rubí del Faro</p><strong>{hintsUsed <= 1 ? 'Detective del Faro' : hintsUsed <= 3 ? 'Especialista en Evidencias' : 'Agente de Investigación'}</strong><p>{completedAt ? new Date(completedAt).toLocaleDateString('es-UY',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'America/Montevideo'}) : ''}</p></div><p className="diploma-download-note">Tu diploma lleva el nombre de esta partida y la fecha en que cerraste el caso. Podés volver a descargarlo.</p><button className="primary-button" disabled={busy} onClick={downloadDiploma}>{busy ? 'PREPARANDO DIPLOMA…' : 'DESCARGAR DIPLOMA PDF'} <span>↓</span></button>{message && <p className="error-message" role="alert">{message}</p>}</section>}
        </div>
      </section>}

      {selectedStatement !== null && <InterrogationDialog index={selectedStatement} onClose={() => setSelectedStatement(null)} />}

      {showAccess && <div className="modal-backdrop" onMouseDown={() => {setShowAccess(false); setMessage('');}}><form className="access-card" onSubmit={access} onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" type="button" onClick={() => setShowAccess(false)}>×</button><p className="eyebrow dark">ACCESO RESTRINGIDO</p><h2>Identificate, agente.</h2><p>Ingresá el código impreso debajo del QR de tu carpeta.</p><label htmlFor="agent-code">Código del expediente</label><input id="agent-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="F01-XXXX-XXXX-XXXX-XXXX" autoComplete="off" /><label htmlFor="agent-name">Nombre o alias</label><input id="agent-name" value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="Tu nombre o alias de agente" maxLength={48} autoComplete="off" />{message && <p className="form-error">{message}</p>}<button className="primary-button full" type="submit">ACTIVAR INVESTIGACIÓN <span>→</span></button><small>No necesitás cuenta de ChatGPT. Cada código abre una partida compartida por tu familia. Usá un alias; no hace falta dar el nombre completo. Guardá tu tarjeta para recuperar el avance.</small></form></div>}
    {busy && <div className="connection-status" role="status">Conectando con la Agencia F…</div>}
    </fieldset></main>
  );
}
