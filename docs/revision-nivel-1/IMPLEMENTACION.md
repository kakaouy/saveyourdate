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

Cambios locales pendientes de revisión; no publicados ni mezclados con main.

Validación: compilación correcta, 184 pruebas unitarias correctas. Navegación automatizada local con API simulada (sin modificar partidas reales): lectura secuencial, popup inicial, clave incorrecta y reintento, desbloqueo directo, popup final y acceso al nivel 2. Comprobación móvil 390 px sin desbordamiento horizontal. Audio cargado con duración real, salto al párrafo sincroniza tarjeta y lectura manual pausa voz. Corregido colapso de terminal al redimensionar eliminando contención CSS. No se verificó despliegue porque no se publicó.
