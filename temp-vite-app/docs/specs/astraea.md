# Astraea — especificación productiva

## Aprobado

- Invitación de 15 años cálida, orgánica y luminosa.
- Paleta principal marrón, arena y dorado.
- Fecha demo: 2 de abril de 2027, 21:00, `America/Montevideo`.
- Sección de fecha vertical exclusiva: `02 / 04 / 27`.
- Sin cronograma ni alojamiento.
- Galería propia e independiente de otros modelos.
- Footer corporativo compartido de Save Your Date.

## Arquitectura y parametrización

- Fuente única de verdad: `event.dateTime` y `event.endDateTime` en ISO 8601.
- Día de semana, día, mes, año, hora, cuenta regresiva y archivo de calendario se derivan de `event.dateTime`.
- Parametrizables: nombre, fechas, zona horaria, lugar, dirección, textos, enlaces, regalos, QR, galería, paleta y secciones opcionales.
- Idiomas: español, portugués e inglés.

## Orden de secciones

Hero, fecha vertical, countdown, ubicación, frase, dress code, foto destacada, galería, regalos, álbum colaborativo, Instagram, canciones, QR, RSVP y footer.

## Animaciones

- Loader: fade, 450 ms, una vez.
- Hero y fecha vertical: fade-up, 750 ms, una vez al entrar al viewport.
- Secciones, títulos, textos y botones: fade-up, 750 ms, una vez al entrar al viewport.
- Foto destacada: parallax leve durante scroll.
- Ornamentos: float suave; sin repetición cuando `prefers-reduced-motion` está activo.
- Navegación: pulse leve; desactivado con movimiento reducido.

## Validación

- Mobile first, sin scroll horizontal, controles de 44 px o más.
- Contraste y legibilidad sobre fondos claros.
- Galería de Astraea sólo usa `/astraea/images/`.
- No renderizar cronograma ni alojamiento.

