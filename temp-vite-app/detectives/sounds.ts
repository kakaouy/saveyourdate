type Effect = 'type' | 'unlock' | 'panel' | 'paper' | 'piece' | 'rotate' | 'signal' | 'error';

let context: AudioContext | null = null;
let lastTypeAt = 0;
let effectsEnabled = true;
let stormEnabled = false;
let stormSource: AudioBufferSourceNode | null = null;
let stormGain: GainNode | null = null;
let thunderTimer: number | null = null;
let openingMusic: HTMLAudioElement | null = null;
let lastHintChime = 0;
let lastButtonClick = 0;
let lastTimeBurn = 0;
let lastMapPaper = 0;
let lastEvidenceCard = 0;

export function setEffectsEnabled(enabled: boolean) { effectsEnabled = enabled; }

function playAudioClip(source:string,volume:number,duration?:number,startAt=0) {
  if (!effectsEnabled || typeof Audio === 'undefined') return;
  const audio=new Audio(source);audio.volume=volume;audio.preload='auto';
  try{audio.currentTime=startAt;}catch{/* Metadata can arrive after playback starts. */}
  void audio.play().catch(()=>{});
  if(duration){
    const totalMs=duration*1000;
    // Todos los recortes terminan con una cola breve para evitar cortes digitales secos.
    fadeAndStop(audio,totalMs,Math.min(360,Math.max(70,totalMs*.32)));
  }
}

export function playKeyboardKey(){playAudioClip('/los-archivos-f/audio/terminal-keyboard.mp3',.42,.16,Math.random()*.9);}
export function playPowerSurge(){playAudioClip('/los-archivos-f/audio/terminal-crt-startup.mp3',.5,3.2);playAudioClip('/los-archivos-f/audio/level1-electric-zap.mp3',.5,.75);window.setTimeout(()=>playAudioClip('/los-archivos-f/audio/terminal-power.mp3',.34,.7),180);}
export function playHintChime(){const now=performance.now();if(now-lastHintChime<1400)return;lastHintChime=now;playAudioClip('/los-archivos-f/audio/hint-chime.mp3',.34);}
export function playButtonClick(){const now=performance.now();if(now-lastButtonClick<70)return;lastButtonClick=now;playAudioClip('/los-archivos-f/audio/ui-button-press.mp3',.18,.22);}
export function playMapUnfold(){const now=performance.now();if(now-lastMapPaper<1100)return;lastMapPaper=now;playAudioClip('/los-archivos-f/audio/mission-map-unfold.mp3',.32,1.45);}
export function playMapFold(){playAudioClip('/los-archivos-f/audio/mission-map-fold.mp3',.3,1.15,.15);}
export function playAchievement(){playAudioClip('/los-archivos-f/audio/achievement-warm.mp3',.32,1.75,.05);}
export function playSecretCollect(){playAudioClip('/los-archivos-f/audio/secret-mark-collect.mp3',.42,.86);}
export function playHintReveal(){playAudioClip('/los-archivos-f/audio/hint-reveal.mp3',.24,1.2,.12);}
export function playPlanPiece(){playAudioClip('/los-archivos-f/audio/level4-piece-place.mp3',.38,.44);}
export function playPlanComplete(){playAudioClip('/los-archivos-f/audio/level4-plan-complete.mp3',.42,1.4);}
export function playChoiceCorrect(){playAudioClip('/los-archivos-f/audio/level1-access-confirm.mp3',.34,.72,.05);}
export function playTvShutdown(){playAudioClip('/los-archivos-f/audio/tv-signal-shutdown.mp3',.48,1.28);}
export function playLampBuzz(){playAudioClip('/los-archivos-f/audio/terminal-lamp-buzz.mp3',.14,2.4,.2);}
export function playCorridorDoor(){playAudioClip('/los-archivos-f/audio/corridor-door.mp3',.3,2.25,.08);}
export function playTerminalDigital(){playAudioClip('/los-archivos-f/audio/level1-digital-interface.mp3',.38,1.45);}
export function playTerminalConfirm(){playAudioClip('/los-archivos-f/audio/level1-access-confirm.mp3',.46,1.05);}
export function playDossierOpen(){playAudioClip('/los-archivos-f/audio/level2-file-slide.mp3',.38,.68);}
export function playPenMark(){playAudioClip('/los-archivos-f/audio/level2-pen-write.mp3',.28,.75,1.2);}
export function playCameraShutter(){playAudioClip('/los-archivos-f/audio/level2-camera-shutter.mp3',.4,.65);}
export function playPageTurn(){playAudioClip('/los-archivos-f/audio/level2-page-turn.mp3',.28,1.05);}
export function playSignalBlip(){playAudioClip('/los-archivos-f/audio/level3-signal-blip.mp3',.3,.3);}
export function playRadioStatic(){playAudioClip('/los-archivos-f/audio/level3-radio-static.mp3',.2,.7,Math.random()*3.5);}
export function playRadarConfirm(){playAudioClip('/los-archivos-f/audio/level3-radar-confirm.mp3',.38,1.8);}
export function playLevelTransition(){playAudioClip('/los-archivos-f/audio/cross-level-transition.mp3',.34,1.2);}
export function playFedeRadioBeep(){playAudioClip('/los-archivos-f/audio/fede-radio-beep.mp3',.3,.52);}
export function playEvidenceSlide(){playAudioClip('/los-archivos-f/audio/evidence-paper-slide.mp3',.38,.84);}
export function playEvidenceCardHover(){const now=performance.now();if(now-lastEvidenceCard<240)return;lastEvidenceCard=now;playAudioClip('/los-archivos-f/audio/evidence-card-hover.mp3',.22,.58,.04);}
export function playTimeBurn(){const now=performance.now();if(now-lastTimeBurn<5000)return;lastTimeBurn=now;playAudioClip('/los-archivos-f/audio/time-burning-bubbles.mp3',.24,1.65,1.1);}

export function startOpeningMusic(){
  if(typeof Audio==='undefined')return;
  openingMusic||=new Audio('/los-archivos-f/audio/opening-cinematic-drone.mp3');
  openingMusic.loop=true;openingMusic.volume=.22;
  void openingMusic.play().catch(()=>{});
}
export function stopOpeningMusic(){if(!openingMusic)return;openingMusic.pause();openingMusic.currentTime=0;}

function audioContext() {
  if (typeof window === 'undefined') return null;
  context ||= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

function makeRainBuffer(ctx: AudioContext) {
  const seconds = 7;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    let previous = 0;
    for (let index = 0; index < data.length; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.82 + white * 0.18;
      const drop = Math.random() < 0.0007 ? (Math.random() * 2 - 1) * 0.55 : 0;
      data[index] = previous * 0.44 + white * 0.09 + drop;
    }
  }
  return buffer;
}

function fadeAndStop(audio:HTMLAudioElement,totalMs:number,fadeMs:number) {
  const initialVolume=audio.volume;
  const fadeStart=window.setTimeout(()=>{
    const started=performance.now();
    const fade=window.setInterval(()=>{
      const progress=Math.min(1,(performance.now()-started)/fadeMs);
      // La curva cuadrática conserva el cuerpo del trueno y suaviza especialmente la cola.
      audio.volume=initialVolume*Math.pow(1-progress,2);
      if(progress>=1){window.clearInterval(fade);audio.pause();audio.currentTime=0;audio.volume=initialVolume;}
    },40);
  },Math.max(0,totalMs-fadeMs));
  audio.addEventListener('ended',()=>window.clearTimeout(fadeStart),{once:true});
}

function playThunder(ctx: AudioContext) {
  if (!stormEnabled || ctx.state !== 'running') return;
  const strength = Math.pow(Math.random(), 0.72);
  const intensity = 0.28 + strength * 0.72;
  const side = Math.random()<.5?'left':'right';
  const close=strength>.58;
  const thunder=new Audio(close?'/los-archivos-f/audio/thunder-clap.mp3':'/los-archivos-f/audio/thunder-rumble.mp3');
  thunder.preload='auto';
  thunder.volume=close?Math.min(1,.76+strength*.22):Math.min(1,.62+strength*.28);
  thunder.playbackRate=.94+Math.random()*.1;
  void thunder.play().catch(()=>{});
  fadeAndStop(thunder,close?2300:3600,close?850:1400);
  window.dispatchEvent(new CustomEvent('archivos-f-thunder', {detail:{intensity,side}}));
}

function scheduleThunder(ctx: AudioContext, first = false) {
  if (thunderTimer !== null) window.clearTimeout(thunderTimer);
  if (!stormEnabled) return;
  thunderTimer = window.setTimeout(() => {
    playThunder(ctx);
    scheduleThunder(ctx);
  }, first ? 7000 + Math.random() * 9000 : 18000 + Math.random() * 27000);
}

export function startStormAmbience() {
  const ctx = audioContext();
  if (!ctx) return;
  const wasEnabled = stormEnabled;
  stormEnabled = true;
  if (!stormSource) {
    const source = ctx.createBufferSource();
    source.buffer = makeRainBuffer(ctx);
    source.loop = true;
    const high = ctx.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = 420;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 7200;
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    source.connect(high).connect(low).connect(gain).connect(ctx.destination);
    source.start();
    stormSource = source;
    stormGain = gain;
  }
  if (stormGain) stormGain.gain.setTargetAtTime(0.12, ctx.currentTime, 0.35);
  if (!wasEnabled || thunderTimer === null) scheduleThunder(ctx, true);
}

export function stopStormAmbience() {
  stormEnabled = false;
  if (thunderTimer !== null) window.clearTimeout(thunderTimer);
  thunderTimer = null;
  const ctx = context;
  if (ctx && stormGain) stormGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
}

export function setStormDucked(ducked: boolean) {
  if (!context || !stormGain || !stormEnabled) return;
  stormGain.gain.setTargetAtTime(ducked ? 0.035 : 0.12, context.currentTime, 0.3);
}

function tone(ctx: AudioContext, frequency: number, start: number, duration: number, volume: number, kind: OscillatorType = 'sine') {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = kind;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playEffect(effect: Effect) {
  try {
    if (!effectsEnabled) return;
    const ctx = audioContext();
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (effect === 'type') {
      if (performance.now() - lastTypeAt < 78) return;
      lastTypeAt = performance.now();
      tone(ctx, 920 + Math.random() * 180, now, 0.014, 0.007, 'sine');
      tone(ctx, 1320 + Math.random() * 120, now + 0.004, 0.009, 0.004, 'triangle');
    } else if (effect === 'panel') {
      playAudioClip('/los-archivos-f/audio/ui-mouse-click.mp3',.23,.24);
    } else if (effect === 'paper') {
      playAudioClip('/los-archivos-f/audio/ui-mouse-click.mp3',.18,.18);
    } else if (effect === 'piece') {
      playAudioClip('/los-archivos-f/audio/mechanism-lock-insert.mp3',.34,.48);
    } else if (effect === 'rotate') {
      playAudioClip('/los-archivos-f/audio/ui-interface-click.mp3',.35);
    } else if (effect === 'signal') {
      tone(ctx, 740, now, 0.045, 0.012, 'sine');
    } else if (effect === 'error') {
      playAudioClip('/los-archivos-f/audio/error-notification.mp3',.4,1.02);
    } else {
      playAudioClip('/los-archivos-f/audio/cross-door-lock.mp3',.34,1.7);
      playAudioClip('/los-archivos-f/audio/feedback-metal-unlock.mp3',.36,.85);
      tone(ctx, 196, now, 0.12, 0.035, 'triangle');
      tone(ctx, 294, now + 0.09, 0.14, 0.04, 'triangle');
      tone(ctx, 392, now + 0.19, 0.28, 0.045, 'sine');
    }
  } catch {
    // Audio effects are decorative and must never interrupt the game.
  }
}

export function playLevelComplete(level: number) {
  try {
    if (!effectsEnabled) return;
    const ctx = audioContext();
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    playAudioClip(Math.random()<.5?'/los-archivos-f/audio/evidence-stamp.mp3':'/los-archivos-f/audio/evidence-stamp-alt.mp3',.58,.62);
    if (level === 1 || level === 5) {
      [0, .075, .15].forEach((delay, index) => tone(ctx, 520 + index * 170, now + delay, .055, .024, 'square'));
    } else if (level === 3 || level === 6) {
      [0, .11, .22].forEach((delay, index) => tone(ctx, [690, 910, 780][index], now + delay, .09, .025, 'sine'));
    } else {
      [0, .08, .17].forEach((delay, index) => tone(ctx, [118, 164, 238][index], now + delay, .1 + index * .025, .035, 'triangle'));
    }
    // Papel y golpe de sello: separa la recompensa narrativa del simple acierto.
    tone(ctx, 92, now + .24, .08, .045, 'triangle');
    tone(ctx, 58, now + .27, .16, .035, 'sine');
    tone(ctx, 392, now + .3, .32, .04, 'sine');
  } catch {
    // The reward sound is decorative and must never block progression.
  }
}
