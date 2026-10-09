type Effect = 'type' | 'unlock' | 'panel' | 'paper' | 'piece' | 'rotate' | 'signal' | 'error';

let context: AudioContext | null = null;
let lastTypeAt = 0;
let effectsEnabled = true;
let stormEnabled = false;
let stormSource: AudioBufferSourceNode | null = null;
let stormGain: GainNode | null = null;
let thunderTimer: number | null = null;

export function setEffectsEnabled(enabled: boolean) { effectsEnabled = enabled; }

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

function playThunder(ctx: AudioContext) {
  if (!stormEnabled || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  const strength = Math.pow(Math.random(), 0.78);
  const intensity = 0.28 + strength * 0.72;
  const side = Math.random()<.5?'left':'right';
  const pan = (side==='left'?-1:1) * (0.35 + Math.random() * 0.55);
  const duration = 2.8 + strength * 3.4 + Math.random() * 0.8;
  const attack = 0.045 + (1 - strength) * 0.24;
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let rumble = 0;
  for (let index = 0; index < data.length; index += 1) {
    rumble = rumble * (0.982 + strength * 0.009) + (Math.random() * 2 - 1) * (0.018 - strength * 0.007);
    const roll = 0.72 + Math.sin(index / ctx.sampleRate * (8 + strength * 7)) * 0.2;
    data[index] = rumble * roll;
  }
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 115 + strength * 150;
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner();
  panner.pan.value=pan;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18 + strength * 0.42, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.035 + strength * 0.075, now + 0.7 + strength * 0.55);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  noise.connect(filter).connect(gain).connect(panner).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + duration);
  tone(ctx, 34 + strength * 16, now, 1.9 + strength * 2.2, 0.04 + strength * 0.1, 'sine');
  tone(ctx, 49 + Math.random() * 22, now + 0.12 + Math.random() * 0.22, 1.4 + strength * 1.8, 0.025 + strength * 0.07, 'triangle');
  if (strength > 0.68) {
    tone(ctx, 76 + Math.random() * 34, now, 0.11 + strength * 0.12, 0.055 + strength * 0.075, 'sawtooth');
    tone(ctx, 46, now + 0.08, 0.5, 0.065 + strength * 0.055, 'triangle');
  }
  window.dispatchEvent(new CustomEvent('archivos-f-thunder', {detail:{intensity,side}}));
}

function scheduleThunder(ctx: AudioContext, first = false) {
  if (thunderTimer !== null) window.clearTimeout(thunderTimer);
  if (!stormEnabled) return;
  thunderTimer = window.setTimeout(() => {
    playThunder(ctx);
    scheduleThunder(ctx);
  }, first ? 3500 + Math.random() * 7500 : 7000 + Math.random() * 21000);
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
    gain.gain.value = 0.16;
    source.connect(high).connect(low).connect(gain).connect(ctx.destination);
    source.start();
    stormSource = source;
    stormGain = gain;
  }
  if (stormGain) stormGain.gain.setTargetAtTime(0.16, ctx.currentTime, 0.35);
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
  stormGain.gain.setTargetAtTime(ducked ? 0.045 : 0.16, context.currentTime, 0.3);
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
      tone(ctx, 210, now, 0.045, 0.025, 'triangle');
      tone(ctx, 310, now + 0.035, 0.055, 0.018, 'sine');
    } else if (effect === 'paper') {
      tone(ctx, 680, now, 0.018, 0.006, 'triangle');
      tone(ctx, 520, now + 0.025, 0.024, 0.005, 'sine');
    } else if (effect === 'piece') {
      tone(ctx, 125, now, 0.045, 0.018, 'triangle');
      tone(ctx, 82, now + 0.018, 0.06, 0.014, 'sine');
    } else if (effect === 'rotate') {
      tone(ctx, 260, now, 0.025, 0.012, 'triangle');
      tone(ctx, 210, now + 0.028, 0.035, 0.01, 'triangle');
    } else if (effect === 'signal') {
      tone(ctx, 740, now, 0.045, 0.012, 'sine');
    } else if (effect === 'error') {
      tone(ctx, 145, now, 0.07, 0.02, 'sawtooth');
      tone(ctx, 112, now + 0.055, 0.08, 0.016, 'triangle');
    } else {
      tone(ctx, 196, now, 0.12, 0.035, 'triangle');
      tone(ctx, 294, now + 0.09, 0.14, 0.04, 'triangle');
      tone(ctx, 392, now + 0.19, 0.28, 0.045, 'sine');
    }
  } catch {
    // Audio effects are decorative and must never interrupt the game.
  }
}
