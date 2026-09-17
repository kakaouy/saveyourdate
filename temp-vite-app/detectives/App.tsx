'use client';

import Briefing from './Briefing';
import { levels, unlockMessages, microChecks } from './case';
import type { GameState } from './game-state';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type Screen = 'home' | 'briefing' | 'library' | 'game';



const statements = [
  { name: 'Bruno Vidal', role: 'Fotógrafo', location: 'Terraza del museo', summary: 'Afirma que intentaba fotografiar un relámpago. Su cámara automática podría respaldar su ubicación.', image: '/los-archivos-f/images/bruno-portrait.jpg', audio: '/los-archivos-f/audio/interrogatorio-bruno.wav', text: 'Cuando se cortó la luz estaba en la terraza intentando fotografiar el relámpago. Una de mis cámaras toma imágenes automáticamente cada dos minutos.' },
  { name: 'Vera Salas', role: 'Seguridad', location: 'Sala del generador', summary: 'Afirma que estuvo en el generador y que utilizó su tarjeta al entrar y salir.', image: '/los-archivos-f/images/vera-portrait.jpg', audio: '/los-archivos-f/audio/interrogatorio-vera.wav', text: 'Yo estaba en la sala del generador. Usé mi tarjeta para entrar y salir. Conocía la prueba eléctrica, pero pensé que había sido cancelada.' },
  { name: 'León Costa', role: 'Historiador', location: 'Estudio de entrevistas', summary: 'Afirma que dio una entrevista grabada y que no abandonó el estudio.', image: '/los-archivos-f/images/leon-portrait.jpg', audio: '/los-archivos-f/audio/interrogatorio-leon.wav', text: 'Estaba dando una entrevista sobre la historia del rubí. La periodista grabó todo. Discutí con el director, pero no salí del estudio.' },
  { name: 'Martina Ríos', role: 'Restauradora', location: 'Cafetería', summary: 'Afirma que permaneció en la cafetería durante todo el apagón y niega haber vuelto al taller.', image: '/los-archivos-f/images/martina-portrait.jpg', audio: '/los-archivos-f/audio/interrogatorio-martina.wav', text: 'Permanecí en la cafetería durante todo el apagón. No volví al taller ni me acerqué a la sala del rubí.' },
];

const levelVisuals = ['/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-security-room.png', '/los-archivos-f/images/bg-hidden-corridor.png', '/los-archivos-f/images/bg-restoration-workshop.png', '/los-archivos-f/images/bg-restoration-workshop.png', '/los-archivos-f/images/bg-hidden-corridor.png'];
const successVisuals = ['/los-archivos-f/images/bruno-storm.jpg', '/los-archivos-f/images/suspects-group.jpg', '/los-archivos-f/images/control-room.jpg', '/los-archivos-f/images/corridor-spoiler-418.jpg', '/los-archivos-f/images/martina-dark.jpg', '/los-archivos-f/images/lens-workshop.jpg', '/los-archivos-f/images/evidence-spread-spoiler.jpg'];



function InterrogationDialog({ index, onClose }: { index: number; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
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
      <figure className="interrogation-portrait"><img src={person.image} alt={person.name} /><figcaption>ARCHIVO F-01 / SUJETO 0{index + 1}</figcaption></figure>
      <div className="interrogation-content">
        <p className="eyebrow">REGISTRO DE INTERROGATORIO · 0{index + 1}</p>
        <h2 id="interrogation-name">{person.name}</h2>
        <dl className="suspect-details"><div><dt>Ocupación</dt><dd>{person.role}</dd></div><div><dt>Ubicación declarada durante el apagón</dt><dd>{person.location}</dd></div></dl>
        <section><h3>Resumen de la declaración</h3><p>{person.summary}</p></section>
        <section className="interrogation-recording"><h3>Escuchá el interrogatorio</h3><audio controls preload="metadata" src={person.audio} aria-label={`Interrogatorio de ${person.name}`} /><p className="recording-note">Voz provisoria · Declaración 0{index + 1} de 04</p></section>
        <details className="interrogation-transcript"><summary>Leer declaración</summary><blockquote>“{person.text}”</blockquote></details>
        <p className="interrogation-instruction">Contrastá esta versión con la Evidencia E de tu carpeta. Una declaración todavía no es una prueba.</p>
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
  const [musicOn, setMusicOn] = useState(false);
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
      const data = await response.json() as GameState & {error?:string};
      if (!response.ok) throw new Error(data.error || 'No pudimos guardar. Volvé a intentar.');
      receiveState(data); setSaveStatus('Progreso guardado'); return data as GameState;
    } catch(error) {
      const text = error instanceof Error ? error.message : 'No hay conexión. Volvé a intentar.';
      setMessage(text); setSaveStatus('No se guardó el último cambio. Volvé a intentar.'); return null;
    } finally { setBusy(false); }
  }

  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = selectedStatement === null ? 0.22 : 0.04;
  }, [selectedStatement]);

  useEffect(() => {
    if(screen === 'briefing') { musicRef.current?.pause(); setMusicOn(false); }
    const pause = () => { musicRef.current?.pause(); setMusicOn(false); };
    window.addEventListener('briefing-play', pause);
    return () => window.removeEventListener('briefing-play', pause);
  }, [screen]);

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
    setLevel(state.highestLevel); setAnswer(''); setSelectedStatement(null); setShowAccess(false); setScreen('briefing'); window.scrollTo(0,0);
    setCheckSelection(null); setCheckPassed(false); setCheckFeedback(''); setFinalAnswers({who:'',how:'',where:''});
  }

  async function startInvestigation() {
    if (await gameAction({action:'start'})) setLevel(1);
  }

  async function submitLevel(event: FormEvent) {
    event.preventDefault();
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

  async function requestHint() { await gameAction({action:'hint',level}); }

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
    if (musicOn) { player.pause(); setMusicOn(false); return; }
    player.volume = 0.22;
    try { await player.play(); setMusicOn(true); } catch { setMusicOn(false); }
  }

  return (
    <main className="site-shell" aria-busy={busy}><fieldset className="app-controls" disabled={busy}>
      <nav className="topbar" aria-label="Navegación principal">
        <button className="brand brand-button" onClick={() => setScreen('home')}><span className="brand-mark">F</span><span>LOS ARCHIVOS F</span></button>
        <div className="nav-meta"><span>10 OCT</span><span className="nav-dot" /><span>FEDE · 11 AÑOS</span></div>
        <div className="nav-tools"><button className={`music-button ${musicOn ? 'on' : ''}`} onClick={toggleMusic} aria-pressed={musicOn}>{musicOn ? '♫ AMBIENTE ON' : '♪ ACTIVAR MISTERIO'}</button>{activeSession && screen !== 'home' && screen !== 'briefing' && <button className="agent-chip" onClick={() => setScreen('library')}>AGENTE {agent.toUpperCase()}</button>}</div>
        <audio ref={musicRef} src="/los-archivos-f/audio/ambiente-faro.wav" loop preload="metadata" />
      </nav>

      {screen === 'home' && <section className="welcome-page">
        <div className="welcome-heading"><p className="eyebrow">AGENCIA F · ACCESO CONFIDENCIAL</p><h1>Bienvenido a<br/><em>Los Archivos F</em></h1><p>Una misión especial por los <strong>11 años de Fede.</strong></p><span className="welcome-seal">TU AVENTURA COMIENZA ACÁ</span></div>
        <form className="access-card welcome-access" onSubmit={access}><p className="eyebrow dark">IDENTIFICATE, AGENTE</p><h2>¿Listo para el misterio?</h2><p>Ingresá tu nombre y el código de acceso de tu carpeta.</p><label htmlFor="welcome-name">Tu nombre o alias</label><input id="welcome-name" value={agent} onChange={e=>setAgent(e.target.value)} placeholder="¿Cómo te llamás, agente?" required maxLength={48} autoComplete="nickname"/><label htmlFor="welcome-code">Código de acceso</label><input id="welcome-code" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="F01-XXXX-XXXX-XXXX-XXXX" required autoComplete="off" autoCapitalize="characters" spellCheck={false}/>{message && <p className="form-error" role="alert">{message}</p>}<button className="primary-button full" type="submit">RECIBIR MI MISIÓN <span>→</span></button><small>Encontrá tu código debajo del QR. No necesitás una cuenta. Podés usar un alias y volver con el mismo código para recuperar tu partida.</small>{activeSession && <button type="button" className="resume-welcome" onClick={()=>{setScreen('briefing');window.scrollTo(0,0);}}>Continuar con mi partida guardada →</button>}</form>
      </section>}

      {screen === 'briefing' && <Briefing agent={agent} onComplete={()=>{setScreen('library');window.scrollTo(0,0);}}/>}

      {screen === 'library' && <section className="library-page">
        <p className="save-status" role="status">{saveStatus}</p><div className="page-heading"><p className="eyebrow dark">BIENVENIDO, AGENTE {agent.toUpperCase()}</p><h1>Biblioteca de casos</h1><p>Tu expediente está guardado. Podés continuar en otro dispositivo usando el mismo código de tu tarjeta.</p></div>
        <button className="switch-code" onClick={() => {setCode(''); setMessage(''); setShowAccess(true);}}>Ingresar otro código de carpeta</button><div className="case-grid">
          <article className="case-card active"><div className="case-visual"><img src="/los-archivos-f/images/hero-archivos-f.png" alt="El rubí rojo sobre un mapa y el faro iluminado junto al mar" /><span>F-01</span></div><div className="case-copy"><small>CASO DISPONIBLE · DIFICULTAD MEDIA</small><h2>El robo del Rubí del Faro</h2><p>Una gema sustituida, cuatro sospechosos y siete minutos sin cámaras.</p><ul><li>7 niveles</li><li>16 desafíos</li><li>60–90 min</li><li>Físico + digital</li></ul><button className="primary-button" onClick={() => { setLevel(level || 0); setScreen('game'); }}>ABRIR EXPEDIENTE <span>→</span></button></div></article>
          {[2,3].map((n) => <article className="case-card locked" key={n}><div className="locked-mark">F-0{n}</div><small>EXPEDIENTE CLASIFICADO</small><h2>Próximamente</h2><p>Tu autorización para este caso todavía no fue emitida.</p></article>)}
        </div>
      </section>}

      {screen === 'game' && <section className="game-page">
        <aside className="case-sidebar"><button className="back-link" onClick={() => setScreen('library')}>← Biblioteca</button><p className="eyebrow">ARCHIVO F-01</p><h2>El robo del <br />Rubí del Faro</h2><div className="progress-track"><span style={{width:`${Math.min(highestLevel,8)/8*100}%`}} /></div><p className="progress-label">{highestLevel === 9 ? 'Caso cerrado' : `${Math.max(0, Math.min(highestLevel - 1, 7))} de 7 niveles resueltos`} · {hintsUsed} pistas usadas</p><nav className="level-navigation" aria-label="Niveles del caso">
          <button onClick={() => visitLevel(0)} aria-current={level === 0 ? 'step' : undefined}><span className="level-number">F</span><span>La misión<small>Mensaje de Fede</small></span></button>
          {levels.map((item, index) => {
            const number = index + 1;
            const available = number <= highestLevel;
            const completed = number < highestLevel;
            return <button key={item.title} disabled={!available} onClick={() => visitLevel(number)} aria-current={level === number ? 'step' : undefined} aria-label={`Nivel ${number}: ${item.title}. ${completed ? 'Resuelto' : available ? 'Disponible' : 'Bloqueado'}`}><span className="level-number">{completed ? '✓' : number}</span><span>{item.title}<small>{completed ? 'Resuelto · volver a consultar' : available ? 'En investigación' : 'Bloqueado'}</small></span>{!available && <svg className="level-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>}</button>;
          })}
          <button disabled={highestLevel < 8} onClick={() => visitLevel(8)} aria-current={level === 8 ? 'step' : undefined}><span className="level-number">F</span><span>Acusación final<small>{highestLevel < 8 ? 'Bloqueada' : highestLevel === 9 ? 'Resuelta' : 'Disponible'}</small></span></button>
          {highestLevel === 9 && <button onClick={() => visitLevel(9)} aria-current={level === 9 ? 'step' : undefined}><span className="level-number">✓</span><span>Resolución<small>Caso cerrado</small></span></button>}
        </nav><div className="evidence-reminder"><b>Recordatorio</b><p>{highestLevel >= 7 ? 'Ya tenés autorización para abrir el sobre negro.' : 'No abras el sobre negro hasta recibir autorización.'}</p></div><p className="save-status" role="status">{saveStatus}</p><button className="save-button" onClick={() => setScreen('library')}>Volver a la biblioteca</button></aside>

        <div className="investigation-panel">
          {level <= 7 && <figure className={`scene-frame ${level === 0 ? 'storm-layer' : level === 4 || level === 7 ? 'beam-layer' : 'lamp-layer'}`}><img src={level === 0 ? '/los-archivos-f/images/control-room.jpg' : unlocked ? successVisuals[level - 1] : levelVisuals[level - 1]} alt="Escena del Museo del Faro vinculada con la investigación" /><span>{unlocked ? 'EVIDENCIA VISUAL DESBLOQUEADA' : 'REGISTRO VISUAL · ARCHIVO F-01'}</span></figure>}
          
          {level === 0 && <section className="mission-intro"><p className="eyebrow dark">ARCHIVO F-01 · MISIÓN ACEPTADA</p><h1>El robo del Rubí del Faro</h1><p>Tu primera misión: descubrir a qué hora comenzó realmente el apagón. Buscá la fotografía de la sala y el registro eléctrico en tus archivos confidenciales.</p><div className="prep-list"><b>Antes de comenzar</b><span>✓ Carpeta y evidencias A–I</span><span>✓ Acetato y filtro rojo</span><span>✓ Papel y lápiz</span><span>✓ Sobre negro cerrado</span></div><button className="primary-button" onClick={startInvestigation}>COMENZAR NIVEL 1 <span>→</span></button><button className="reading-choice" onClick={()=>setScreen('briefing')}>Volver a escuchar a Federica</button></section>}

          {level >= 1 && level <= 7 && (() => {
            const current = levels[level - 1];
            const shown = hints[level] || 0;
            const unlockedMessage = unlockMessages[level - 1];
            const checkIndex = unlocked ? microChecks[level - 1].length : checkProgress[level] || 0;
            const currentCheck = microChecks[level - 1][checkIndex];
            const completedChecks = microChecks[level - 1].length;
            return <section className="level-card">
              <p className="eyebrow dark">{current.kicker}</p><h1>{current.title}</h1>
              <div className="challenge-counter"><span>DEDUCCIONES {Math.min(checkIndex, completedChecks)}/{completedChecks}</span><span>CANDADO FINAL {unlocked ? 'RESUELTO' : currentCheck ? 'BLOQUEADO' : 'DISPONIBLE'}</span></div>
              <div className="digital-brief"><span>ARCHIVO DIGITAL</span><p>{current.digital}</p></div>
              {level === 2 && <section className="suspect-board" aria-label="Panel de sospechosos"><div className="suspect-board-heading"><h2>Cuatro versiones. Una investigación.</h2><p>Abrí cada ficha para escuchar su coartada.</p></div><div className="suspect-grid">{statements.map((person, index) => <button className="suspect-file" key={person.name} onClick={() => setSelectedStatement(index)} aria-label={`Abrir interrogatorio de ${person.name}`}><div className="suspect-file-photo"><span className="suspect-file-id">SUJETO 0{index + 1}</span><img src={person.image.replace('-portrait.jpg', '-cutout.png')} alt="" /></div><div className="suspect-file-caption"><span>{person.role}</span><h3>{person.name}</h3><p>Ver ficha e interrogatorio <span aria-hidden="true">↗</span></p></div></button>)}</div></section>}

              <div className="physical-brief"><span>BUSCÁ EN TU CARPETA</span>{current.evidence.map((item) => <b key={item}>{item}</b>)}</div>
              {!unlocked && currentCheck && <div className="micro-challenge"><p className="eyebrow dark">DEDUCCIÓN {checkIndex + 1} DE {completedChecks}</p><h2>{currentCheck.question}</h2><div className="micro-options">{currentCheck.options.map((option, index) => <button key={option} className={checkSelection === index ? 'selected' : ''} onClick={() => { if (!checkPassed) { setCheckSelection(index); setCheckFeedback(''); } }}>{option}</button>)}</div>{checkFeedback && <p className={checkPassed ? 'micro-success' : 'micro-error'}>{checkPassed ? currentCheck.success : checkFeedback}</p>}{checkPassed ? <button className="primary-button" onClick={continueMicroCheck}>REGISTRAR DEDUCCIÓN <span>→</span></button> : <button className="unlock-button" onClick={() => verifyMicroCheck(currentCheck.correct)}>VERIFICAR DEDUCCIÓN</button>}</div>}
              {!unlocked && !currentCheck && <form className={`lock-panel lock-${current.lock}`} onSubmit={submitLevel}><div className="lock-ready">✓ DEDUCCIONES COMPLETADAS · CANDADO HABILITADO</div><label htmlFor="level-answer">{current.prompt}</label>{current.options ? <div className="suspect-options">{current.options.map((option) => <button type="button" className={answer === option ? 'selected' : ''} onClick={() => setAnswer(option)} key={option}>{option}</button>)}</div> : <input id="level-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={current.placeholder} autoComplete="off" />}<button className="unlock-button" type="submit">DESBLOQUEAR NIVEL</button></form>}
              {message && <p className={message.startsWith('Desbloqueaste') ? 'success-message' : 'error-message'}>{message}</p>}
              {unlocked && level === 2 && <div className="physical-brief"><span>ACLARACIÓN DE MARTINA</span><p>“Sí, pasé mi tarjeta. Había dejado la medicina en mi bolso, en el taller. El registro demuestra que abrí una puerta, no que robé el rubí.”</p><p>La contradicción es un indicio. Todavía falta probar el método y encontrar el original.</p></div>}
              {unlocked && <details className="completed-deductions"><summary>Consultar deducciones resueltas</summary>{microChecks[level - 1].map((check) => <div key={check.question}><h3>{check.question}</h3><p>✓ {check.success}</p></div>)}</details>}
              {unlocked && <div className="unlock-reveal"><div className="unlock-icon">✓</div><p className="eyebrow dark">MENSAJE DE FEDE DESBLOQUEADO</p><h2>{current.unlock}</h2><audio key={unlockedMessage.audio} className="unlock-audio" controls src={unlockedMessage.audio}>Tu navegador no puede reproducir este audio.</audio><p>“{unlockedMessage.text}”</p><button className="primary-button" onClick={continueInvestigation}>CONTINUAR <span>→</span></button></div>}
              {!unlocked && <div className="hint-box"><div><b>¿Necesitás una pista?</b><span>Podés pedir hasta tres ayudas en este nivel.</span></div><button onClick={requestHint} disabled={shown >= 3}>PEDIR PISTA {Math.min(shown + 1,3)}/3</button>{shown > 0 && <ol>{current.hints.slice(0, shown).map((hint, i) => <li key={hint}><b>PISTA {i + 1}</b>{hint}</li>)}</ol>}</div>}
            </section>;
          })()}

          {level === 8 && <section className="level-card final-card"><p className="eyebrow dark">ACUSACIÓN FINAL</p><h1>Reconstruí los hechos.</h1><p className="final-intro">Una acusación completa debe explicar quién retiró el rubí, cómo lo hizo y dónde escondió el original.</p><form className="final-form" onSubmit={submitFinal}><label>¿Quién retiró el rubí?<select value={finalAnswers.who} onChange={(e) => setFinalAnswers({...finalAnswers,who:e.target.value})}><option value="">Elegí una persona</option><option value="bruno">Bruno Vidal</option><option value="vera">Vera Salas</option><option value="leon">León Costa</option><option value="martina">Martina Ríos</option></select></label><label>¿Cómo realizó el cambio?<select value={finalAnswers.how} onChange={(e) => setFinalAnswers({...finalAnswers,how:e.target.value})}><option value="">Elegí una reconstrucción</option><option value="cafeteria">Entró antes y lo escondió en la cafetería</option><option value="corredor">Usó el apagón, el corredor y dejó una réplica</option><option value="terraza">Salió por la terraza con ayuda de seguridad</option></select></label><label>¿Dónde escondió el original?<select value={finalAnswers.where} onChange={(e) => setFinalAnswers({...finalAnswers,where:e.target.value})}><option value="">Elegí un lugar</option><option value="bolso">En el bolso de trabajo</option><option value="generador">En la sala del generador</option><option value="lente">En la base de la lente de Fresnel</option></select></label><button className="primary-button" type="submit">PRESENTAR ACUSACIÓN <span>→</span></button></form>{message && <p className="error-message">{message}</p>}</section>}

          {level === 9 && <section className="resolution-card"><div className="resolved-seal">CASO<br /><strong>CERRADO</strong></div><p className="eyebrow">ARCHIVO F-01 RESUELTO</p><h1>Excelente trabajo,<br />agente {agent}.</h1><p>Martina Ríos fabricó una réplica, utilizó el corredor durante el apagón y escondió el rubí original en la base de la lente de Fresnel.</p><p>Quería forzar una investigación sobre la procedencia de la gema. Eso explica su motivo, pero no justifica el robo. El museo deberá aclarar el origen del rubí.</p><p>Fede está a salvo: fue al faro antiguo a comprobar una teoría y la tormenta la dejó sin señal. Ya podés abrir el paquete de la gema de recuerdo.</p><audio className="final-audio" controls autoPlay src="/los-archivos-f/audio/fede-caso-cerrado.wav">Tu navegador no puede reproducir este audio.</audio><blockquote>“Un buen detective no solo descubre quién hizo algo. También se pregunta cómo pudo hacerlo, qué pruebas lo demuestran y por qué tomó esa decisión.” <b>— Fede</b></blockquote><div className="result-stats"><span><b>{hintsUsed}</b>Pistas utilizadas</span><span><b>{hintsUsed <= 1 ? 'Detective del Faro' : hintsUsed <= 3 ? 'Especialista en Evidencias' : 'Agente de Investigación'}</b>Rango obtenido</span></div><div className="diploma-preview"><p>AGENCIA F · CERTIFICADO DE INVESTIGACIÓN</p><h2>{agent}</h2><p>Completó el Archivo F-01</p><strong>{hintsUsed <= 1 ? 'Detective del Faro' : hintsUsed <= 3 ? 'Especialista en Evidencias' : 'Agente de Investigación'}</strong><p>{completedAt ? new Date(completedAt).toLocaleDateString('es-UY') : ''}</p></div><button className="primary-button" onClick={downloadDiploma}>DESCARGAR DIPLOMA PDF <span>↓</span></button>{message && <p className="error-message" role="alert">{message}</p>}</section>}
        </div>
      </section>}

      {selectedStatement !== null && <InterrogationDialog index={selectedStatement} onClose={() => setSelectedStatement(null)} />}

      {showAccess && <div className="modal-backdrop" onMouseDown={() => {setShowAccess(false); setMessage('');}}><form className="access-card" onSubmit={access} onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" type="button" onClick={() => setShowAccess(false)}>×</button><p className="eyebrow dark">ACCESO RESTRINGIDO</p><h2>Identificate, agente.</h2><p>Ingresá el código impreso debajo del QR de tu carpeta.</p><label htmlFor="agent-code">Código del expediente</label><input id="agent-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="F01-XXXX-XXXX-XXXX-XXXX" autoComplete="off" /><label htmlFor="agent-name">Nombre o alias</label><input id="agent-name" value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="Tu nombre o alias de agente" maxLength={48} autoComplete="off" />{message && <p className="form-error">{message}</p>}<button className="primary-button full" type="submit">ACTIVAR INVESTIGACIÓN <span>→</span></button><small>No necesitás cuenta de ChatGPT. Cada código abre una partida compartida por tu familia. Usá un alias; no hace falta dar el nombre completo. Guardá tu tarjeta para recuperar el avance.</small></form></div>}
    {busy && <div className="connection-status" role="status">Conectando con la Agencia F…</div>}
    </fieldset></main>
  );
}
