# Save Your Date - Plantilla Técnica Base

Plantilla base reutilizable para crear invitaciones web interactivas de eventos.

Esta plantilla fue diseñada para servir como punto de partida para distintos tipos de invitaciones:

- Bodas
- 15 años
- Cumpleaños
- Eventos infantiles
- Bautismos
- Comuniones
- Primer año
- Graduaciones
- Otros eventos

La estructura separa:

- Contenido
- Diseño
- Funcionalidad
- Recursos multimedia
- Integraciones externas

La mayor parte de la personalización de una invitación se realiza desde `config.js` y desde la carpeta `assets/`.

---
# Inicio rápido

Esta plantilla está preparada para crear una nueva invitación sin modificar la lógica técnica principal.

En la mayoría de los casos, para crear una nueva invitación solo es necesario:

1. Duplicar la carpeta de la plantilla.
2. Renombrar la nueva carpeta.
3. Editar `config.js`.
4. Cambiar colores y tipografías en `css/variables.css`.
5. Reemplazar imágenes, iconos y música dentro de `assets/`.
6. Crear y conectar el Google Sheet del evento.
7. Probar la invitación.
8. Publicarla.

Ejemplo: `plantillas-base/invitacion-completa`

---
# Estructura del proyecto



invitacion-completa/
│
├── index.html
├── config.js
├── README.md
│
├── css/
│   ├── variables.css
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── animations.css
│   └── responsive.css
│
├── js/
│   ├── utils.js
│   ├── render-config.js
│   ├── main.js
│   ├── modals.js
│   ├── countdown.js
│   ├── music.js
│   ├── gallery.js
│   ├── playlist.js
│   └── rsvp.js
│
├── assets/
│   ├── images/
│   │   ├── portada/
│   │   ├── galeria/
│   │   ├── fondos/
│   │   └── placeholders/
│   │
│   ├── icons/
│   ├── decorations/
│   ├── audio/
│   └── fonts/
│
└── integrations/
    └── google-sheets/
        ├── apps-script.gs
        ├── sheet-structure.md
        └── README.md


# Archivos principales

## `index.html`

Contiene la estructura general de la invitación.

Incluye:

- Pantalla de bienvenida
- Portada
- Cuenta regresiva
- Información del evento
- Ubicación
- Dress code
- Galería
- Regalos
- Playlist
- Confirmación de asistencia
- Mensaje final
- Footer
- Modales
- Lightbox
- Audio

En general, no debería ser necesario modificar este archivo para cada invitación.

---

## `config.js`

Es el archivo principal de configuración.

Aquí se modifican:

- Nombre del evento
- Tipo de evento
- Fecha y hora
- Textos
- Dirección
- Ubicación
- Imágenes
- Música
- Dress code
- Regalos
- Playlist
- RSVP
- Secciones visibles
- Integraciones

Ejemplo:

```js
const EVENT_CONFIG = {
  event: {
    id: "evento-001",
    type: "quince",
    name: "Juanita",
    date: "2026-08-22T21:00:00"
  }
};
```

---

# Cómo usar esta plantilla

1. Duplicar la plantilla base

Nunca trabajar directamente sobre: `plantillas-base/invitacion-completa`

Crear una copia dentro de la categoría correspondiente.

Ejemplo:

modelos/
└── quince/
    └── quince-001-elegante/


La carpeta duplicada será el nuevo modelo.

2. Renombrar el evento

Abrir: `config.js`

Modificar:

```event: {
  id: "evento-001",
  type: "quince",
  name: "Juanita",
  date: "2026-08-22T21:00:00",
  endDate: "2026-08-23T05:00:00",
  timezone: "America/Montevideo"
}
```

Ejemplo para una boda:

```event: {
  id: "boda-maria-pedro",
  type: "boda",
  name: "María & Pedro",
  date: "2027-03-20T19:30:00",
  endDate: "2027-03-21T04:00:00",
  timezone: "America/Montevideo"
}
```

El campo: `event.id` debe ser único para cada evento.

3. Cambiar el contenido

Toda la información principal se modifica desde:

`config.js`

Aquí se configuran:

- Nombre del evento
- Fecha
- Textos
- Portada
- Lugar
- Dirección
- Dress code
- Galería
- Regalos
- Playlist
- RSVP
- Música
- Mensaje final
- Footer

Ejemplo:

```
hero: {
  pretitle: "Nos casamos",
  title: "María & Pedro",
  subtitle: "Queremos compartir este momento contigo",
  dateText: "20 de marzo de 2027",
  backgroundImage: "assets/images/portada/portada.jpg"
}
```
No es necesario modificar el HTML para cambiar estos textos.

4. Activar o desactivar secciones

Desde:
```
sections: {
  welcome: true,
  hero: true,
  countdown: true,
  event: true,
  location: true,
  dressCode: true,
  gallery: true,
  gifts: true,
  playlist: true,
  rsvp: true,
  closing: true,
  footer: true
}
```
Para ocultar una sección, cambiar: `true`

por:`false`

Ejemplo:

```
playlist: false
```

La sección Playlist dejará de mostrarse.

5. Cambiar el diseño general

Abrir:

`css/variables.css`

Modificar principalmente:

```
:root {
  --color-primary: #1e2733;
  --color-secondary: #d8b6ae;
  --color-background: #f8f5f2;

  --font-display: Georgia, serif;
  --font-body: Arial, sans-serif;
}
```

Este archivo controla gran parte de la identidad visual de la invitación.

Para crear un nuevo modelo visual, normalmente se modifican:

- Colores
- Tipografías
- Espaciados
- Bordes
- Sombras
- Tamaños generales

6. Reemplazar la portada

Guardar la imagen principal en: `assets/images/portada/`

Ejemplo:
```
assets/images/portada/portada.jpg
```
Luego configurar:
```
hero: {
  backgroundImage:
    "assets/images/portada/portada.jpg"
}
```
7. Agregar imágenes a la galería

Guardar las imágenes en: `assets/images/galeria/`

Ejemplo:
```
foto-01.jpg
foto-02.jpg
foto-03.jpg
```
Después agregarlas en `config.js`:
```
gallery: {
  images: [
    {
      src: "assets/images/galeria/foto-01.jpg",
      alt: "Descripción de la foto"
    },

    {
      src: "assets/images/galeria/foto-02.jpg",
      alt: "Descripción de la foto"
    }
  ]
}
```
Si una foto necesita una posición especial:
```
{
  src: "assets/images/galeria/foto-01.jpg",
  alt: "Descripción",
  objectPosition: "center top"
}
```
8. Cambiar los iconos

Guardar los iconos en: `assets/icons/`

Ejemplo:

```
calendar.svg
location.svg
dress-code.svg
gift.svg
music.svg
music-off.svg
favicon.png
```

Después configurar la ruta correspondiente desde `config.js`.

Ejemplo:
```
dressCode: {
  icon:
    "assets/icons/dress-code.svg"
}
```
9. Agregar música

Guardar el archivo en:`assets/audio/`

Ejemplo:
```
musica.mp3
```
Configurar:
```
music: {
  enabled: true,
  loop: true,
  volume: 0.45,
  file: "assets/audio/musica.mp3"
}
```
Para desactivar la música:`enabled: false`

10. Configurar Google Sheets

Cada evento puede tener su propio Google Sheet.

Crear dos pestañas:

- Invitados
- Playlist

La pestaña Invitados debe contener:

    - event_id
    - grupo
    - invitado_id
    - nombre
    - estado
    - restriccion
    - detalle_restriccion
    - comentario
    - fecha_confirmacion

La pestaña Playlist debe contener:

    - fecha
    - event_id
    - grupo
    - nombre
    - cancion
    - link

11. Configurar Google Apps Script

Copiar el contenido de: `integrations/google-sheets/apps-script.gs`

en el proyecto de Google Apps Script conectado al Google Sheet.

Después:

Implementar
→ Nueva implementación
→ Aplicación web

Configurar:

Ejecutar como:
Yo

Quién tiene acceso:
Cualquier persona

Copiar la URL que termina en:

/exec

12. Conectar la invitación con Google Sheets

En `config.js`:
```
integrations: {
  googleSheets: {
    enabled: true,
    scriptUrl:
      "URL_DE_GOOGLE_APPS_SCRIPT"
  },

  rsvp: {
    enabled: true,
    endpoint: ""
  },

  playlist: {
    enabled: true,
    endpoint: ""
  }
}
```
No es necesario repetir la URL en rsvp.endpoint o playlist.endpoint si ambos usan el mismo Apps Script.

13. Crear grupos de invitados

Cada grupo de invitados tiene un identificador.

Ejemplo en Google Sheets:

familia-perez
familia-gomez
amigos-facultad
mesa-01

La URL de la invitación se genera utilizando:

?grupo=

Ejemplo:

https://misitio.com/?grupo=familia-perez

El sistema buscará automáticamente los invitados asociados a:

familia-perez

14. Probar localmente

Abrir la carpeta del proyecto en Visual Studio Code.

Usar Live Server para abrir: `index.html`

Ejemplo:

http://127.0.0.1:5500/index.html

Para probar un grupo:

http://127.0.0.1:5500/index.html?grupo=familia-prueba

No se recomienda abrir directamente:

file:///...

porque algunas funciones web pueden no funcionar correctamente.


15. Publicar

Una vez finalizada la invitación:

Subir los cambios al repositorio.
Publicar mediante Vercel, GitHub Pages u otro servicio.
Probar la URL pública.
Probar nuevamente los enlaces personalizados por grupo.

Para cada nuevo modelo:

COPIAR
plantillas-base/invitacion-completa

y trabajar sobre la copia:

modelos/categoria/nombre-del-modelo

Para cada cliente, se recomienda crear una nueva copia del modelo elegido y personalizar únicamente esa versión.
