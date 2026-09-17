export const levels = [
  {
    title: 'La hora verdadera',
    kicker: 'NIVEL 1 · CANDADO DE CÁMARA',
    prompt: '¿A qué hora comenzó realmente el apagón?',
    evidence: ['Evidencia A · Fotografía de la sala', 'Evidencia B · Registro eléctrico'],
    digital: 'Fede detectó que la cámara principal no estaba sincronizada. Compará sus dos registros de hora.',
    placeholder: '4 cifras', answer: ['1937'], lock: 'numeric',
    hints: ['En la fotografía aparecen dos indicaciones de hora.', 'Observá el reloj reflejado en la vitrina.', 'El reloj reflejado marca 19:37.'],
    unlock: 'Declaraciones de los cuatro sospechosos',
  },
  {
    title: 'Las coartadas',
    kicker: 'NIVEL 2 · PANEL DE SOSPECHOSOS',
    prompt: '¿Qué declaración contradice directamente el registro?',
    evidence: ['Evidencia D · Fichas de sospechosos', 'Evidencia E · Registro de actividad'],
    digital: 'Escuchá las declaraciones y contrastalas con el registro físico. Una persona asegura no haber pasado por un lugar que su tarjeta sí abrió.',
    options: ['Bruno Vidal', 'Vera Salas', 'León Costa', 'Martina Ríos'], answer: ['martina rios'], lock: 'choice',
    hints: ['Compará cada declaración con las horas del registro.', 'Buscá quién niega haber entrado a un lugar registrado.', 'La tarjeta de Martina abrió el corredor del taller a las 19:39.'],
    unlock: 'Fotograma recuperado del corredor',
  },
  {
    title: 'La señal del faro',
    kicker: 'NIVEL 3 · RECEPTOR LUMINOSO',
    prompt: '¿Qué lugar señala el mensaje de luces?',
    evidence: ['Evidencia G · Código de señales marítimas'],
    digital: '—  /  o —  /  — o —  /  — o —  /  o o —  /  o — o',
    placeholder: '6 letras', answer: ['taller', 'el taller', 'taller de restauracion'], lock: 'letters',
    hints: ['La secuencia está formada por seis grupos.', 'Traducí cada grupo por separado con la evidencia G.', 'Las tres primeras letras son T-A-L.'],
    unlock: 'Audio de Fede sobre un corredor oculto',
  },
  {
    title: 'El corredor oculto',
    kicker: 'NIVEL 4 · CAJA FUERTE',
    prompt: '¿Qué número aparece al alinear correctamente las marcas?',
    evidence: ['Evidencia C · Plano del museo', 'Acetato transparente'],
    digital: 'Alineá primero el norte y después las tres boyas. El camino correcto conecta el taller con la sala del rubí.',
    placeholder: '3 cifras', answer: ['418'], lock: 'safe',
    hints: ['Empezá por la rosa de los vientos.', 'Las tres boyas deben coincidir al mismo tiempo.', 'La línea correcta revela tres números en orden de recorrido.'],
    unlock: 'Recorrido del pasadizo confirmado',
  },
  {
    title: 'La pieza imposible',
    kicker: 'NIVEL 5 · LABORATORIO',
    prompt: '¿Qué fue fabricado en el taller?',
    evidence: ['Evidencia F · Inventario', 'Evidencia H · Informe', 'Filtro rojo', 'Muestra M-12'],
    digital: 'El informe contiene información superpuesta. Usá el filtro y relacioná la anotación con el código R-17.',
    placeholder: 'Nombre del objeto', answer: ['replica', 'una replica', 'copia', 'replica del rubi', 'copia del rubi'], lock: 'label',
    hints: ['Mirá la evidencia H a través del filtro rojo.', 'La anotación menciona una copia que pesa 12 g menos.', 'En el taller fabricaron una réplica del rubí.'],
    unlock: 'Confirmación de sustitución de la gema',
  },
  {
    title: 'El escondite',
    kicker: 'NIVEL 6 · TABLERO DE BANDERAS',
    prompt: '¿Qué palabra forman las cinco banderas?',
    evidence: ['Evidencia I · Fotografía LF-04', 'Clave de banderas de la evidencia G'],
    digital: 'Leé las banderas desde la que tiene una pequeña flecha blanca y seguí el sentido horario.',
    placeholder: '5 letras', answer: ['lente', 'la lente', 'lente de fresnel'], lock: 'flags',
    hints: ['Usá la clave de banderas de la evidencia G.', 'Seguí las flechas en sentido horario.', 'Las dos primeras letras son L-E.'],
    unlock: 'Autorización para abrir el sobre negro',
  },
  {
    title: 'El compartimento',
    kicker: 'NIVEL 7 · CERRADURA MECÁNICA',
    prompt: '¿Cuál es el código del compartimento?',
    evidence: ['Sobre negro · Mecanismo plegable'],
    digital: 'AUTORIZACIÓN CONCEDIDA. Abrí el sobre negro, doblá únicamente las líneas punteadas y alineá el borde de la solapa con la base. Leé las tres ventanas de izquierda a derecha.',
    placeholder: '3 cifras', answer: ['704'], lock: 'mechanical',
    hints: ['Las líneas continuas se recortan; las punteadas se doblan.', 'Dobla la solapa hacia arriba, sobre la base numerada. Las ventanas deben dejar ver tres cifras.', 'Con la solapa plegada, las ventanas muestran 7-0-4 de izquierda a derecha.'],
    unlock: 'Acceso a la acusación final',
  },
];

export const unlockMessages = [
  { audio: '/los-archivos-f/audio/fede-nivel-1.wav', text: 'Siete minutos pueden parecer poco, pero alcanzan para cruzar la sala y utilizar el corredor. Ahora compará las declaraciones.' },
  { audio: '/los-archivos-f/audio/fede-nivel-2.wav', text: 'Martina se contradijo, aunque todavía no demuestra el robo. Recuperé una señal luminosa del corredor.' },
  { audio: '/los-archivos-f/audio/fede-nivel-3.wav', text: 'El mensaje señala el taller. Buscá el plano y el acetato para encontrar la salida que no figura en el plano público.' },
  { audio: '/los-archivos-f/audio/fede-nivel-4.wav', text: 'La ruta 418 conecta el taller con la sala del rubí. Ahora debemos demostrar qué ocurrió dentro de la vitrina.' },
  { audio: '/los-archivos-f/audio/fede-nivel-5.wav', text: 'En el taller fabricaron una réplica. Falta encontrar dónde ocultaron el rubí original.' },
  { audio: '/los-archivos-f/audio/fede-nivel-6.wav', text: 'Llegaste al mismo punto que yo. Tenés autorización para abrir el sobre negro.' },
  { audio: '/los-archivos-f/audio/fede-nivel-7.wav', text: 'El rubí estaba en la base de la lente. Ya podés presentar una acusación completa.' },
];

export const microChecks = [
  [
    { question: 'La cámara marca 19:30, pero el reloj del sistema marca 19:37. ¿Qué fuente es más confiable?', options: ['La cámara de Bruno', 'El sistema eléctrico sincronizado', 'La hora que recuerda Martina'], correct: 1, success: 'El sistema eléctrico estaba sincronizado; la cámara no.' },
    { question: '¿Cuántos minutos de diferencia hay entre ambos registros?', options: ['5 minutos', '7 minutos', '14 minutos'], correct: 1, success: 'La cámara estaba atrasada exactamente siete minutos.' },
  ],
  [
    { question: '¿Qué registro respalda que Bruno estaba en la terraza?', options: ['Una compra en la cafetería', 'Una fotografía automática a las 19:38', 'La tarjeta del generador'], correct: 1, success: 'La cámara automática respalda parte de la coartada de Bruno.' },
    { question: '¿Quién registra una entrada y una salida de la sala del generador?', options: ['Vera Salas', 'León Costa', 'Martina Ríos'], correct: 0, success: 'Los dos registros de Vera son compatibles con su declaración.' },
  ],
  [
    { question: 'Antes de traducir la señal, ¿cómo debe dividirse?', options: ['En seis grupos separados por pausas largas', 'En pares de colores', 'En tres números'], correct: 0, success: 'Cada grupo corresponde a una letra del código físico.' },
  ],
  [
    { question: '¿Qué referencias deben coincidir para que el acetato esté bien colocado?', options: ['Solamente la flecha norte', 'Norte y las tres boyas', 'Las paredes de la cafetería'], correct: 1, success: 'Cuatro referencias evitan obtener una posición falsa.' },
  ],
  [
    { question: '¿Qué objeto permite separar las dos capas de escritura del informe?', options: ['El acetato del plano', 'El filtro rojo', 'La gema de recuerdo'], correct: 1, success: 'El filtro elimina el ruido visual y deja leer la anotación escondida.' },
  ],
  [
    { question: '¿En qué orden deben leerse las banderas?', options: ['Alfabéticamente', 'Desde la flecha blanca y en sentido horario', 'De mayor a menor tamaño'], correct: 1, success: 'La flecha y el sentido horario fijan un único orden.' },
  ],
  [
    { question: '¿Qué líneas se doblan en el mecanismo del sobre negro?', options: ['Las líneas continuas', 'Las líneas punteadas', 'Todas las líneas rojas'], correct: 1, success: 'Las líneas punteadas son pliegues; las continuas delimitan la pieza.' },
  ],
];

