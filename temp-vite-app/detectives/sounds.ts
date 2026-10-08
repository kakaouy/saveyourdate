type Effect = 'type' | 'unlock' | 'panel' | 'paper' | 'piece' | 'rotate' | 'signal' | 'error';

let context: AudioContext | null = null;
let lastTypeAt = 0;
let effectsEnabled = true;

export function setEffectsEnabled(enabled: boolean) { effectsEnabled = enabled; }

function audioContext() {
  if (typeof window === 'undefined') return null;
  context ||= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
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
