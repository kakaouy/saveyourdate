export const finalStatement = [
  'Ya encontraron el compartimento. Voy a decir la verdad: fui yo quien retiró el rubí. Usé mi tarjeta para entrar al corredor durante el apagón. Lo de la medicina fue una excusa; no permanecí en la cafetería como había dicho.',
  'Preparé una réplica en el taller con resina, pigmento rojo y el molde R-17. La copia pesaba doce gramos menos que el original. Crucé el corredor, hice el cambio en la vitrina y guardé el rubí auténtico en el compartimento de la base de la lente de Fresnel, el objeto LF-04.',
  'Quería que se investigara la procedencia del rubí. Eso no justifica haberlo robado ni haberles mentido. El inventario, mi anotación del taller y el rubí que recuperaron permiten comprobar lo que ahora les estoy contando.',
];

export default function FinalStatement({highestLevel}: {highestLevel:number}) {
  if (highestLevel < 8) return null;
  return <details className="clue-envelope final-statement">
    <summary><span aria-hidden="true">▤</span><b>Nueva declaración de Martina<small>D-05 · Incorporada después de abrir el compartimento</small></b><span aria-hidden="true">+</span></summary>
    <div className="final-statement-body">
      <div className="final-statement-person"><img src="/los-archivos-f/images/martina-portrait.jpg" alt="Martina Ríos"/><div><p className="eyebrow">AMPLIACIÓN DEL INTERROGATORIO</p><h2>Martina Ríos</h2><p>Restauradora · Responsable del taller</p></div></div>
      <p>Tras recuperar el rubí de LF-04, la Agencia F vuelve a interrogar a Martina y registra esta declaración.</p>
      <blockquote>{finalStatement.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</blockquote>
      <p className="statement-task"><b>Tu última tarea:</b> contrastá esta declaración con las pruebas anteriores. Completá quién, cómo y dónde en K-01 y presentá tu reconstrucción.</p>
    </div>
  </details>;
}
