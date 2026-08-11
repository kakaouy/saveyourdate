# Amalfi — especificación productiva

## Aprobado

- Invitación de 15 años floral, luminosa y contemporánea.
- Paleta principal menta, ciruela, coral y amarillo floral.
- Fecha demo: 13 de noviembre de 2027, 21:00, `America/Montevideo`; finalización al día siguiente a las 05:00.
- Hero tipográfico con composición floral y fecha editorial.
- Sin cronograma; incluye alojamiento.
- Galería propia e independiente de otros modelos.
- Footer corporativo compartido de Save Your Date.

## Arquitectura y parametrización

- Configuración externa mediante `window.AMALFI_SITE_CONFIG`.
- Fuente única de verdad: `event.dateTime` y `event.endDateTime` en ISO 8601.
- Día, mes, año, hora, cuenta regresiva y archivo de calendario se derivan de `event.dateTime`.
- Parametrizables: nombre, fechas, zona horaria, lugar, dirección, textos, enlaces, regalos, horarios, paleta y secciones opcionales.
- Paleta demo: `menta-ciruela`.
- Idiomas: español, portugués e inglés mediante `?lang=es|pt|en` o configuración externa.

## Orden de secciones

Hero, countdown, ubicación, frase, dress code, foto destacada, galería, alojamiento, regalos, álbum colaborativo, Instagram, canciones, QR, RSVP y footer.

## Animaciones

- Loader con salida automática y respaldo temporal.
- Secciones con fade-up al entrar al viewport.
- Foto destacada con parallax leve durante scroll.
- Galería navegable con controles, teclado y gesto horizontal.
- Pétalos decorativos animados; ocultos cuando se solicita movimiento reducido.

## Validación

- Mobile first, sin scroll horizontal y con controles principales de 44 px o más.
- La fecha editorial debe permanecer legible en móvil y desktop.
- Galería y foto destacada sólo usan `/amalfi/images/`.
- No renderizar cronograma; alojamiento visible y parametrizable.
- Todos los assets locales deben resolver sin errores.

