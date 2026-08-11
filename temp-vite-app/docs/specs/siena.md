# Siena — especificación productiva

## Aprobado

- Invitación de 15 años editorial y orgánica, inspirada en papel texturado y sello de lacre.
- Paleta principal rosa viejo, borgoña, arena y marrón.
- Fecha demo: 13 de noviembre de 2027, 21:00, `America/Montevideo`; finalización al día siguiente a las 05:00.
- Apertura inmersiva mediante sobre y sello antes de mostrar la invitación.
- Hero fotográfico a pantalla completa.
- Sin cronograma; incluye alojamiento.
- Galería propia e independiente de otros modelos.
- Footer corporativo compartido de Save Your Date.

## Arquitectura y parametrización

- Configuración externa mediante `window.SIENA_SITE_CONFIG`.
- Fuente única de verdad: `event.dateTime` y `event.endDateTime` en ISO 8601.
- Día, mes, año, hora, cuenta regresiva y archivo de calendario se derivan de `event.dateTime`.
- Parametrizables: nombre, fechas, zona horaria, lugar, dirección, textos, enlaces, regalos, horarios, paleta y secciones opcionales.
- Paleta demo: `rosa-viejo-borgona`.
- Idiomas: español, portugués e inglés mediante `?lang=es|pt|en` o configuración externa.

## Orden de secciones

Apertura, hero, countdown, ubicación, frase, dress code, foto destacada, galería, alojamiento, regalos, álbum colaborativo, Instagram, canciones, QR, RSVP y footer.

## Animaciones

- Loader con salida automática y respaldo temporal.
- Apertura del sobre activada por botón y teclado.
- Secciones con fade-up al entrar al viewport.
- Foto destacada con parallax leve durante scroll.
- Galería navegable con controles, teclado y gesto horizontal.
- Movimiento reducido respetado mediante `prefers-reduced-motion`.

## Validación

- Mobile first, sin scroll horizontal y con controles principales de 44 px o más.
- La apertura bloquea el scroll hasta que se activa la invitación.
- Galería y foto destacada sólo usan `/siena/images/`.
- No renderizar cronograma; alojamiento visible y parametrizable.
- Todos los assets locales deben resolver sin errores.

