export default function FinalStatement({highestLevel}: {highestLevel:number}) {
  if (highestLevel < 8) return null;
  return <section className="martina-final-audio" aria-labelledby="martina-audio-title">
    <img src="/los-archivos-f/images/martina-portrait.jpg" alt="Martina Ríos"/>
    <div><p className="eyebrow">REGISTRO DE AUDIO · MARTINA RÍOS</p><h2 id="martina-audio-title">Escuchá a Martina antes de acusar.</h2><audio controls preload="metadata" src="/los-archivos-f/audio/interrogatorio-martina.wav">Tu navegador no puede reproducir este audio.</audio></div>
  </section>;
}
