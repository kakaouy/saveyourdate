export const levels = [
  {
    title: 'Acceso restringido',
    kicker: 'NIVEL 1 · TERMINAL DE ARCHIVO',
    prompt: 'Clave de emergencia: instante de interrupción',
    evidence: ['Lote A · Cinco capturas de seguridad (A-01 a A-05)', 'Evidencia B-01 · Registro del corte eléctrico'],
    digital: 'El archivo de las personas presentes quedó bloqueado después del apagón. Recuperá el acceso para continuar la investigación.',
    placeholder: '4 caracteres', answer: ['1937'], lock: 'numeric',
    hints: ['Buscá en las capturas una forma de leer la hora que no dependa del rótulo de la cámara.', 'El informe B-01 explica que el reloj de pared de la Sala del Rubí se detuvo al cortarse la energía. Buscalo en A-01.', 'El minutero apunta a la segunda marca después del 7 y la aguja corta está entre el 7 y el 8: son las 19:37. Ingresá 1937.'],
    unlock: 'Declaraciones de los cuatro sospechosos',
  },
  {
    title: 'Las coartadas',
    kicker: 'NIVEL 2 · PANEL DE SOSPECHOSOS',
    prompt: '¿Qué declaración contradice directamente el registro?',
    evidence: ['Evidencias D-01 a D-04 · Fichas de sospechosos', 'Evidencia E-01 · Registro de accesos y actividad'],
    digital: 'Escuchá las cuatro declaraciones y contrastalas con los horarios y lugares del registro E-01. Buscá qué afirmación necesita una explicación. Detectar una contradicción es un paso de la investigación: todavía no demuestra quién robó el rubí.',
    options: ['Bruno Vidal', 'Vera Salas', 'León Costa', 'Martina Ríos'], answer: ['martina rios'], lock: 'choice',
    hints: ['Compará cada declaración con las horas del registro.', 'Buscá quién niega haber entrado a un lugar registrado.', 'La tarjeta de Martina abrió el corredor del taller a las 19:39.'],
    unlock: 'Fotograma recuperado del corredor',
  },
  {
    title: 'La señal del faro',
    kicker: 'NIVEL 3 · RECEPTOR LUMINOSO',
    prompt: '¿Qué lugar señala el mensaje de luces?',
    evidence: ['Evidencia G-01 · Guía de señales luminosas del museo', 'S-01 · Nota encontrada en la cafetería'],
    digital: '—  /  o —  /  — o —  /  — o —  /  o o —  /  o — o',
    placeholder: '6 letras', answer: ['taller', 'el taller', 'taller de restauracion'], lock: 'letters',
    hints: ['La secuencia está formada por seis grupos.', 'Traducí cada grupo con G-01: es el código luminoso propio del museo. La nota S-01 te ayuda a interpretar las pausas.', 'Las tres primeras letras son T-A-L.'],
    unlock: 'Audio de Fede sobre un corredor oculto',
  },
  {
    title: 'El corredor oculto',
    kicker: 'NIVEL 4 · CAJA FUERTE',
    prompt: '¿Qué código de tres cifras revela el recorrido desde INICIO?',
    evidence: ['C-01 · Plano público incompleto', 'C-02 · Fragmento recuperado', 'C-03 · Trazado en acetato transparente'],
    digital: 'Al plano público le falta una parte. Completalo con el fragmento recuperado y después superponé el acetato. Usá las marcas de referencia para reconstruir el recorrido oculto; seguí sus flechas desde INICIO.',
    placeholder: '3 cifras', answer: ['418'], lock: 'safe',
    hints: ['Primero encajá C-02 en el espacio faltante de C-01: sus paredes y líneas deben continuar las del plano.', 'Colocá C-03 encima. La marca del norte y las tres boyas deben coincidir al mismo tiempo; una boya está en el fragmento.', 'Desde INICIO, seguí las flechas y anotá solo los números dentro de los tres círculos, en ese orden. No leas el recorrido desde FIN.'],
    unlock: 'Recorrido del pasadizo confirmado',
  },
  {
    title: 'La pieza imposible',
    kicker: 'NIVEL 5 · LABORATORIO',
    prompt: '¿Qué fue fabricado en el taller?',
    evidence: ['F-01 · Movimientos de material', 'H-01 · Informe de conservación', 'Visor con filtro rojo', 'M-12 · Muestra sellada del taller'],
    digital: 'El taller guarda un inventario y un informe con anotaciones superpuestas. Deslizá el visor rojo sobre el registro de trabajo de H-01 y buscá en F-01 el código que logres leer. Observá también la muestra M-12 sin abrirla: no necesitás pesarla ni hacer cálculos con las cantidades del inventario.',
    placeholder: 'Nombre del objeto', answer: ['replica', 'una replica', 'copia', 'replica del rubi', 'copia del rubi'], lock: 'label',
    hints: ['Deslizá el filtro rojo por todo el bloque de H-01. Buscá el código de la prueba y qué dice de la pieza fabricada.', 'El código R-17 corresponde al molde de F-01. El informe habla de una copia que pesa 12 g menos que el original; no del peso de la bolsita M-12.', 'El molde, la resina y el pigmento se usaron para fabricar una réplica del rubí. Esa es la pieza que tenés que nombrar.'],
    unlock: 'Confirmación de sustitución de la gema',
  },
  {
    title: 'El escondite',
    kicker: 'NIVEL 6 · TABLERO DE BANDERAS',
    prompt: '¿Qué palabra forman las cinco banderas?',
    evidence: ['I-01 · Registro fotográfico del objeto LF-04', 'G-02 · Guía de banderas del museo'],
    digital: 'Buscá I-01 y la guía de banderas G-02. Empezá por la bandera superior, debajo de la flecha blanca de INICIO, y seguí el recorrido en sentido horario. Anotá una letra por bandera, incluso si se repite. Conservá cerrado el sobre negro hasta recibir la autorización.',
    placeholder: '5 letras', answer: ['lente', 'la lente', 'lente de fresnel'], lock: 'flags',
    hints: ['Usá G-02, la guía de banderas, no G-01, la de destellos. Compará el fondo, la figura y su posición.', 'Empezá arriba y seguí las flechas hacia la derecha. Hay cinco posiciones: las banderas iguales conservan la misma letra.', 'Las dos primeras letras son L-E. La última bandera es igual a la segunda; repetí esa letra para completar la palabra.'],
    unlock: 'Autorización para abrir el sobre negro',
  },
  {
    title: 'El compartimento',
    kicker: 'NIVEL 7 · CERRADURA MECÁNICA',
    prompt: '¿Cuál es el código del compartimento?',
    evidence: ['J-00 · Sobre negro autorizado', 'J-01 · Mecanismo plegable del compartimento LF-04, ya recortado'],
    digital: 'AUTORIZACIÓN CONCEDIDA. Abrí el sobre negro y sacá J-01, la pieza ya recortada. Con los números hacia vos, doblá la mitad inferior hacia arriba por la única línea punteada. Hacé coincidir los laterales y el borde de la solapa con el borde superior de la base. Quedará visible la cara blanca con tres ventanas: leelas de izquierda a derecha, aunque estén a distintas alturas.',
    placeholder: '3 cifras', answer: ['704'], lock: 'mechanical',
    hints: ['La pieza ya viene recortada. Plegá solo por la línea punteada del medio; no por los bordes de las ventanas.', 'Subí la solapa sobre los números hasta hacer coincidir los bordes. Mirá las ventanas desde la cara blanca y leé de izquierda a derecha, no de arriba hacia abajo.', 'Con la solapa bien plegada, las ventanas muestran 7-0-4 de izquierda a derecha. Ingresá 704.'],
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
  [],
  [
    { question: '¿Qué entrada de E-01 coincide con el equipo que Bruno dice haber instalado en la terraza?', options: ['Una compra en la cafetería', 'Una fotografía automática a las 19:38', 'La tarjeta del generador'], correct: 1, success: 'E-01 registra una fotografía automática en la terraza a las 19:38. Confirma actividad del equipo; por sí sola, esa entrada no demuestra que Bruno permaneciera allí durante todo el apagón.' },
    { question: '¿Quién registra una entrada y una salida de la sala del generador?', options: ['Vera Salas', 'León Costa', 'Martina Ríos'], correct: 0, success: 'Los dos registros de Vera son compatibles con su declaración.' },
  ],
  [
    { question: 'Antes de traducir la señal, ¿cómo debe dividirse?', options: ['En seis grupos separados por pausas largas', 'En pares de colores', 'En tres números'], correct: 0, success: 'Cada grupo corresponde a una letra del código físico.' },
  ],
  [
    { question: '¿Qué referencias deben coincidir para que el acetato esté bien colocado?', options: ['Solamente la flecha norte', 'Norte y las tres boyas', 'Las paredes de la cafetería'], correct: 1, success: 'Cuatro referencias evitan obtener una posición falsa.' },
  ],
  [
    { question: 'Leé H-01 con el visor rojo. ¿Qué material de F-01 corresponde al código de la prueba terminada?', options: ['La base acrílica de exhibición', 'El molde de conservación temporal', 'El adhesivo reversible'], correct: 1, success: 'H-01 menciona la prueba R-17, el mismo código del molde en F-01. Ahora relacioná la anotación recuperada con los materiales utilizados.' },
  ],
  [
    { question: '¿En qué orden deben leerse las banderas?', options: ['Alfabéticamente', 'Desde la flecha blanca y en sentido horario', 'De mayor a menor tamaño'], correct: 1, success: 'La flecha y el sentido horario fijan un único orden.' },
  ],
  [
    { question: '¿Qué líneas se doblan en el mecanismo del sobre negro?', options: ['Las líneas continuas', 'Las líneas punteadas', 'Todas las líneas rojas'], correct: 1, success: 'Las líneas punteadas son pliegues; las continuas delimitan la pieza.' },
  ],
];

