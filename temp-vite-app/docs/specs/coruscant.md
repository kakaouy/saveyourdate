# Coruscant — especificación productiva

## Aprobado

- Invitación de 15 años romántica contemporánea.
- Paleta principal rosa empolvado, salvia y dorado.
- Fecha demo: 12 de junio de 2027, 21:00, `America/Montevideo`.
- Sin sección de fecha vertical y sin cronograma.
- Incluye alojamiento.
- Galería propia e independiente de otros modelos.
- Footer corporativo compartido de Save Your Date.

## Arquitectura y parametrización

- Fuente única de verdad: `event.dateTime` y `event.endDateTime` en ISO 8601.
- Día de semana, día, mes, año, hora, cuenta regresiva y archivo de calendario se derivan de `event.dateTime`.
- Parametrizables: nombre, fechas, zona horaria, lugar, dirección, textos, enlaces, regalos, QR, hoteles, galería, paleta y secciones opcionales.
- Idiomas: español, portugués e inglés.

## Orden de secciones

Hero, countdown, ubicación, frase, dress code, foto destacada, galería, alojamiento, regalos, álbum colaborativo, Instagram, canciones, QR, RSVP y footer.

## Animaciones

- Loader: fade, 450 ms, una vez.
- Hero: fade-up y zoom suave de ornamentos, 750–900 ms, una vez.
- Secciones, títulos, textos, imágenes, íconos y botones: fade-up, 750 ms, una vez al entrar al viewport.
- Foto destacada: parallax leve durante scroll.
- Ornamentos: float suave; sin repetición cuando `prefers-reduced-motion` está activo.
- Navegación: pulse leve; desactivado con movimiento reducido.

## Validación

- Mobile first, sin scroll horizontal, controles de 44 px o más.
- Countdown completo dentro del viewport en desktop.
- Galería de Coruscant sólo usa `/coruscant/images/`.
- No renderizar cronograma; alojamiento visible y parametrizable.

