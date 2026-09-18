# Revisión de bienvenida y nivel 1 — 18/09/2026

Cecilia autorizó expresamente «Sí, implementar y actualizar audios» después de la fase de planificación. Alcance: conservar presentación, tarjetas, reproductor y navegación; actualizar textos sin anticipar la solución; huella aportada; computadora; nueva Fede; mensajes inicial y final. No se implementan los cambios de los niveles 2–8 ni se regeneran evidencias físicas.

- Bienvenida: robo del rubí, copia y objetivo de reconstruir hechos. Sin anunciar materiales específicos ni hora.
- Audio completo v3 con marcas temporales medidas por párrafo. Las tarjetas siguen la narración; la lectura manual pausa el audio y avanza en secuencia.
- Nivel 1: Acceso restringido, cuatro caracteres alfanuméricos. Sin título La hora verdadera ni candado, ni deducciones previas. API conserva comprobación de respuesta y bloqueo del resto de niveles.
- Popup inicial y final con audio, texto, retrato y botón. Éxito explica desfase sin confundirlo con duración del apagón.
- JPEG de huella original conservado; presentación por filtro CSS/mezcla para suprimir visualmente cuadriculado, sin alterar fuente.
- Narraciones locales: Paulina, 172 palabras/minuto. Guiones en mission-script.ts y terminal-script.ts. Audios anteriores conservados.

## Imágenes — herramienta integrada image_gen

Salidas en public/los-archivos-f/images/:
- federica-terminal-v1.png
- terminal-recuperacion-v1.png
- huella-referencia-v1.jpeg (imagen de Cecilia, no generada)

Prompt Fede:
Use case: identity-preserve. Create a new portrait illustration for a detective game dialogue popup. Keep exactly Federica's face, age 11, dark bob haircut, brown eyes, small earrings and navy hooded coat from reference. Waist-up portrait, she holds her brass radio near her shoulder and looks at the viewer with a calm encouraging slight smile. Background dim teal archive office, softly blurred, warm amber side lighting. Same detailed illustrated adventure style. No text, no letters, no watermark. Vertical composition with entire hood and shoulders visible. Save output image.

Prompt computadora:
Edit target: this detective computer desk. Keep entire composition, monitor exact location and proportions, lamp, rain, palette and framing unchanged. Change ONLY monitor display to blank very dark teal-black glass with subtle amber edge, no text, no cursor, no symbols; remove handwritten words on foreground notebook leaving blank paper. Remove drinking glass. This is a game background with real HTML controls to be overlaid. No new objects or lettering.

La extracción generativa de huella falló; no se incorporó ninguna salida de ese intento. Se utiliza la referencia original mediante CSS.

La primera revisión se publicó en `main` con el commit `ff07f91`.

Validación inicial: compilación correcta, 184 pruebas unitarias correctas. Navegación automatizada local con API simulada (sin modificar partidas reales): lectura secuencial, popup inicial, clave incorrecta y reintento, desbloqueo directo, popup final y acceso al nivel 2. Comprobación móvil 390 px sin desbordamiento horizontal. Audio cargado con duración real, salto al párrafo sincroniza tarjeta y lectura manual pausa voz. Corregido colapso de terminal al redimensionar eliminando contención CSS.

## Segunda revisión visual

- Flujo reorganizado: acceso, Cámara de los expedientes, selección de El robo del Rubí del Faro, misión de Fede y Nivel 1.
- Biblioteca vuelve a la Cámara; Misión vuelve a la explicación completa y a cómo jugar.
- Los cuatro documentos confidenciales conservan la narración corrida y suman un audio individual por documento. Para aceptar alcanza con abrir los cuatro; no es obligatorio escuchar cada audio completo.
- Pistas del Nivel 1 reescritas para orientar sin revelar el reloj, la lectura exacta ni la clave.
- Apertura del Nivel 1: nueva escena de Fede con fondo de archivo y carpeta de evidencias, movimiento ambiental, destellos, partículas y parpadeo sutil.
- Cierre del Nivel 1: Fede cambia de lado y aparece junto al reloj detenido, con la carpeta; la escena tiene movimiento ambiental independiente.
- Ambos mensajes se cierran con una cruz, Escape o clic fuera del cuadro.
- Terminal reforzada con lluvia, pulso de luz, barrido de pantalla y señal animada.
- Validación local: 184 pruebas correctas, compilación correcta, lint sin errores y recorrido visual simulado completo.
