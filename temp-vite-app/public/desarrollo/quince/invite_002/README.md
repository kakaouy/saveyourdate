# Modelo Jardín Floral

La definición comercial del modelo (`15-jardin-floral`, nombre, ruta, paletas y funciones) vive únicamente en `src/data/models.ts`.

## Crear otra invitación

1. Copiar esta carpeta a la ruta del nuevo evento o reutilizarla con una configuración distinta.
2. Editar `config.js`; no es necesario modificar `index.html`, `styles.css` ni `app.js`.
3. Sustituir las imágenes dentro de `assets/` y actualizar sus rutas y textos alternativos en `media`.
4. Elegir `locale.default` y `theme.defaultPalette`.
5. Activar u ocultar módulos en `sections`.

La demo admite `?lang=es|pt|en` y `?palette=original|night|soft`.

## Datos configurables

`config.js` concentra homenajeada, fecha, horarios, lugar, dirección, Google Maps, Waze, dress code, introducción localizada, fecha límite RSVP, banco, galería, ornamentos, música, secciones e idioma/paleta iniciales.

## Integraciones externas

Configurar `integrations.playlistEndpoint` y `integrations.rsvpEndpoint` con endpoints que acepten JSON por `POST`. Cada envío incluye `formId`, `eventId`, `language` y los campos del formulario. Si quedan vacíos, la demo simula una respuesta correcta sin transmitir información.
