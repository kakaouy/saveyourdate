import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

test('detectives keeps its routes and assets under a separate directory', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  for (const action of ['game', 'diploma']) {
    assert.ok(config.rewrites.some((r: {source:string;destination:string}) => r.source === `/los-archivos-f/api/${action}` && r.destination === `/api/admin/${action}`));
  }
  for (const file of ['detectives/App.tsx', 'detectives/case.ts', 'detectives/style.css']) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /["'`]\/(?:images|audio|api)\//);
  }
});

test('all static detective images and audio resolve to public assets', () => {
  const referenced = new Set<string>();
  for (const file of readdirSync('detectives').filter(name => /\.(?:css|tsx?)$/.test(name))) {
    const source = readFileSync(`detectives/${file}`, 'utf8');
    for (const match of source.matchAll(/["'`](\/los-archivos-f\/(?:images|audio)\/[^"'`)]+)["'`]/g)) {
      if (!match[1].includes('${')) referenced.add(match[1].split('?')[0]);
    }
  }

  for (const asset of referenced) {
    assert.ok(existsSync(`public${asset}`), `missing detective asset: ${asset}`);
  }

  for (const asset of [
    'audio/fede-terminal-inicio-v1.wav',
    'audio/fede-terminal-exito-v1.wav',
    'audio/federica-ayuda-bruno.wav',
    'audio/federica-ayuda-leon.wav',
    'audio/federica-ayuda-vera.wav',
    'images/nivel-3-tormenta-2.png',
    'images/nivel-3-tormenta-3.png',
    'images/nivel-3-tormenta-4.png',
  ]) {
    assert.ok(existsSync(`public/los-archivos-f/${asset}`), `missing dynamic detective asset: ${asset}`);
  }
});

test('la navegación móvil conserva juntas las solapas de Fede y Tiempo', () => {
  const styles = readFileSync('detectives/style.css', 'utf8');
  const finalResponsiveBlock = styles.slice(styles.lastIndexOf('/* Ajuste final de precedencia'));

  assert.match(finalResponsiveBlock, /\.game-page \.level-side-tabs\.compact-side-tabs\s*\{[^}]*left:0!important[^}]*top:clamp\(112px,14dvh,150px\)/s);
  assert.match(finalResponsiveBlock, /\.game-page \.side-time-button\s*\{[^}]*left:0!important[^}]*top:calc\(clamp\(112px,14dvh,150px\) \+ 72px\)/s);
  assert.match(finalResponsiveBlock, /\.level-side-tab-trigger\{min-height:64px!important;height:64px!important/);
  assert.match(finalResponsiveBlock, /border-left:0!important[^}]*border-radius:0 14px 14px 0!important/s);
});

test('Pistas conserva su campanilla y la investigación mezcla misterio con tormenta', () => {
  const missionMap = readFileSync('detectives/MissionMap.tsx', 'utf8');
  const app = readFileSync('detectives/App.tsx', 'utf8');
  const sounds = readFileSync('detectives/sounds.ts', 'utf8');

  assert.match(missionMap, /className="toolbar-hint-lens"[\s\S]*?onMouseEnter=\{playHintChime\}[\s\S]*?onClick=\{\(\)=>\{playHintChime\(\);setHintsOpen\(true\);\}\}/);
  assert.match(sounds, /hint-chime\.mp3/);
  assert.match(app, /function activateStormSoundscape\(\)\{[^}]*startStormAmbience\(\);startOpeningMusic\(\);/);
  assert.match(app, /if\(soundscapeRef\.current==='storm'\)startStormAmbience\(\);\s*startOpeningMusic\(\);/);
  assert.match(sounds, /new Audio\('\/los-archivos-f\/audio\/storm-loop\.mp3'\)/);
  assert.match(sounds, /stormLoop\.loop=true;stormLoop\.preload='auto';stormLoop\.volume=\.42/);
  assert.match(sounds, /stormWatchdog=window\.setInterval/);
  assert.match(sounds, /if\(stormLoop\.ended\|\|stormLoop\.currentTime>=Math\.max\(0,stormLoop\.duration-\.12\)\)stormLoop\.currentTime=0/);
  assert.match(sounds, /first \? 3500 \+ Math\.random\(\) \* 4500 : 14000 \+ Math\.random\(\) \* 14000/);
  assert.doesNotMatch(sounds, /makeRainBuffer|createBufferSource|stormGain/);
  assert.doesNotMatch(sounds, /thunder-clap\.mp3|thunder-rumble\.mp3/);
  assert.doesNotMatch(app, /lluvia y truenos|Lluvia y truenos/);
  assert.match(app, /soundscape==='opening'\?'música de inicio':'tormenta'/);
  assert.match(app, /soundscape==='opening'\?'♫':'🌧'/);
});

test('la acusación sucede antes de autorizar la apertura del sobre', () => {
  const app = readFileSync('detectives/App.tsx', 'utf8');
  const caseFile = readFileSync('detectives/case.ts', 'utf8');
  const missionMap = readFileSync('detectives/MissionMap.tsx', 'utf8');

  assert.match(caseFile, /Mantengan cerrado el sobre: primero presenten la acusación final/);
  assert.match(app, /if \(await gameAction\(\{action:'final',\.\.\.finalAnswers\}\)\) setEnvelopeOpening\(true\)/);
  assert.match(app, /envelopeOpening&&<EnvelopeOpening onContinue=\{\(\)=>\{setEnvelopeOpening\(false\);setLevel\(9\)/);
  assert.match(app, /PRESENTAR LA ACUSACIÓN/);
  assert.match(app, /ACUSACIÓN CONFIRMADA · AGENCIA F/);
  assert.match(missionMap, /El expediente está completo\. Presenten la acusación antes de abrir el sobre\./);
  assert.doesNotMatch(app, /ABRIR EL SOBRE Y PREPARAR LA ACUSACIÓN|SOBRE ABIERTO · PREPARAR LA ACUSACIÓN/);
  assert.doesNotMatch(app, /sticker|comunicado final/i);
});

test('cerrar la transmisión apaga la pantalla hacia una línea horizontal', () => {
  const app = readFileSync('detectives/App.tsx', 'utf8');
  const styles = readFileSync('detectives/style.css', 'utf8');

  assert.match(app, /setClosingCase\(true\);playTvShutdown\(\)/);
  assert.match(app, /\},1450\);/);
  assert.match(app, /signal-shutdown-screen[\s\S]*<i\/><b\/><em\/>/);
  assert.match(styles, /@keyframes signal-panel-top[\s\S]*translateY\(0\)/);
  assert.match(styles, /@keyframes signal-panel-bottom[\s\S]*translateY\(0\)/);
  assert.match(styles, /@keyframes signal-line-close[\s\S]*scaleX\(\.008\)/);
  assert.match(styles, /\.signal-shutdown-screen em[^}]*height:3px[^}]*background:#f2ffff/);
});
