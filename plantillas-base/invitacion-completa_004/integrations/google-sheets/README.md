# Integración con Google Sheets

Esta guía explica cómo conectar una invitación de **Save Your Date** con Google Sheets mediante Google Apps Script.

La integración permite actualmente:

- Cargar invitados según el grupo indicado en la URL.
- Confirmar asistencia individual.
- Guardar restricciones alimentarias.
- Guardar comentarios.
- Registrar fecha de confirmación.
- Guardar canciones sugeridas en la Playlist.

---

# Estructura de la integración

```text
Invitación web
        ↓
config.js
        ↓
rsvp.js / playlist.js
        ↓
Google Apps Script
        ↓
Google Sheets
```

La carpeta de integración contiene:

```text
integrations/
└── google-sheets/
    ├── apps-script.gs
    ├── sheet-structure.md
    └── README.md
```

---

# 1. Crear un Google Sheet

Crear una nueva hoja de cálculo en Google Sheets.

Ejemplo de nombre:

```text
Save Your Date - Evento Demo
```

Se recomienda crear un Google Sheet independiente para cada evento.

Ejemplos:

```text
Save Your Date - Juanita 15
Save Your Date - Boda María y Pedro
Save Your Date - Bautismo Mateo
```

---

# 2. Crear la pestaña `Invitados`

Renombrar la primera pestaña como:

```text
Invitados
```

La fila 1 debe contener exactamente estos encabezados:

| Columna | Encabezado |
|---|---|
| A | `event_id` |
| B | `grupo` |
| C | `invitado_id` |
| D | `nombre` |
| E | `estado` |
| F | `restriccion` |
| G | `detalle_restriccion` |
| H | `comentario` |
| I | `fecha_confirmacion` |

Ejemplo:

| event_id | grupo | invitado_id | nombre | estado | restriccion | detalle_restriccion | comentario | fecha_confirmacion |
|---|---|---:|---|---|---|---|---|---|
| evento-001 | familia-prueba | 1 | Cecilia |  | none |  |  |  |
| evento-001 | familia-prueba | 2 | Federica |  | none |  |  |  |

---

# 3. Crear la pestaña `Playlist`

Crear una segunda pestaña y llamarla:

```text
Playlist
```

La fila 1 debe contener:

| Columna | Encabezado |
|---|---|
| A | `fecha` |
| B | `event_id` |
| C | `grupo` |
| D | `nombre` |
| E | `cancion` |
| F | `link` |

---

# 4. Abrir Google Apps Script

Desde el Google Sheet:

```text
Extensiones
→ Apps Script
```

Se abrirá el editor de Google Apps Script.

Normalmente aparecerá un archivo llamado:

```text
Code.gs
```

Borrar el contenido inicial.

Ejemplo:

```js
function myFunction() {

}
```

---

# 5. Copiar el backend

Abrir el archivo local:

```text
integrations/google-sheets/apps-script.gs
```

Copiar todo su contenido y pegarlo dentro de:

```text
Code.gs
```

El archivo local `apps-script.gs` funciona como plantilla maestra del backend.

Google Apps Script ejecuta la copia que se pega dentro de `Code.gs`.

---

# 6. Obtener el ID del Google Sheet

La URL del Google Sheet tiene una estructura similar a:

```text
https://docs.google.com/spreadsheets/d/1ABCDEF123456789XYZ/edit
```

El ID es la parte ubicada entre:

```text
/d/
```

y:

```text
/edit
```

En este ejemplo:

```text
1ABCDEF123456789XYZ
```

---

# 7. Configurar el ID en Apps Script

En `Code.gs`, buscar:

```js
const CONFIG = {
  spreadsheetId: "PEGAR_AQUI_ID_GOOGLE_SHEET",
```

Reemplazarlo por el ID real.

Ejemplo:

```js
const CONFIG = {
  spreadsheetId: "1ABCDEF123456789XYZ",

  sheets: {
    guests: "Invitados",
    playlist: "Playlist"
  }
};
```

Guardar el proyecto.

---

# 8. Asignar un nombre al proyecto

En Apps Script, asignar un nombre identificable.

Ejemplo:

```text
Save Your Date - Evento Demo
```

O:

```text
Save Your Date - Backend Invitación
```

El nombre no afecta el funcionamiento.

Solo ayuda a identificar el proyecto.

---

# 9. Implementar como aplicación web

En Apps Script:

```text
Implementar
→ Nueva implementación
```

En:

```text
Seleccionar tipo
```

elegir:

```text
Aplicación web
```

Configurar:

```text
Descripción:
Save Your Date API
```

```text
Ejecutar como:
Yo
```

```text
Quién tiene acceso:
Cualquier persona
```

Luego seleccionar:

```text
Implementar
```

---

# 10. Autorizar permisos

La primera vez, Google solicitará autorización.

Seleccionar la cuenta correspondiente.

Si aparece una advertencia de aplicación no verificada:

```text
Configuración avanzada
```

y continuar al proyecto.

Aceptar los permisos necesarios.

---

# 11. Copiar la URL de la aplicación web

Al finalizar la implementación, Google Apps Script mostrará una URL similar a:

```text
https://script.google.com/macros/s/XXXXXXXXXXXX/exec
```

La URL debe terminar en:

```text
/exec
```

No utilizar:

```text
/dev
```

No utilizar la URL del editor de Apps Script.

No utilizar la URL de Biblioteca.

Usar únicamente la URL de:

```text
App web
```

---

# 12. Conectar la URL en `config.js`

Abrir:

```text
config.js
```

Configurar:

```js
integrations: {

  googleSheets: {
    enabled: true,
    scriptUrl: "URL_DE_LA_APLICACION_WEB"
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

Ejemplo:

```js
integrations: {

  googleSheets: {
    enabled: true,
    scriptUrl:
      "https://script.google.com/macros/s/XXXXXXXXXXXX/exec"
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

No es necesario repetir la misma URL en:

```js
rsvp.endpoint
```

ni en:

```js
playlist.endpoint
```

Ambos utilizan como respaldo:

```js
googleSheets.scriptUrl
```

---

# 13. Verificar `event.id`

En `config.js`:

```js
event: {
  id: "evento-001"
}
```

En Google Sheets, la columna:

```text
event_id
```

debe contener exactamente:

```text
evento-001
```

Ejemplo:

| event_id | grupo | nombre |
|---|---|---|
| evento-001 | familia-prueba | Cecilia |
| evento-001 | familia-prueba | Federica |

---

# 14. Crear un grupo de prueba

En la columna:

```text
grupo
```

usar un valor como:

```text
familia-prueba
```

Ejemplo:

| event_id | grupo | invitado_id | nombre |
|---|---|---:|---|
| evento-001 | familia-prueba | 1 | Cecilia |
| evento-001 | familia-prueba | 2 | Federica |

---

# 15. Probar la API directamente

Antes de probar la invitación, verificar que Apps Script responda correctamente.

Usar:

```text
URL_DE_APP_WEB?action=guests&eventId=evento-001&group=familia-prueba
```

Ejemplo:

```text
https://script.google.com/macros/s/XXXXXXXXXXXX/exec?action=guests&eventId=evento-001&group=familia-prueba
```

La respuesta esperada es similar a:

```json
{
  "success": true,
  "guests": [
    {
      "row": 2,
      "eventId": "evento-001",
      "group": "familia-prueba",
      "id": 1,
      "name": "Cecilia",
      "status": "",
      "dietaryRestriction": "none",
      "dietaryDetail": ""
    },
    {
      "row": 3,
      "eventId": "evento-001",
      "group": "familia-prueba",
      "id": 2,
      "name": "Federica",
      "status": "",
      "dietaryRestriction": "none",
      "dietaryDetail": ""
    }
  ]
}
```

---

# 16. Probar la invitación localmente

Abrir el proyecto con Live Server.

Ejemplo:

```text
http://127.0.0.1:5500/index.html
```

Agregar el grupo:

```text
?grupo=familia-prueba
```

Ejemplo:

```text
http://127.0.0.1:5500/index.html?grupo=familia-prueba
```

Si la plantilla se encuentra dentro de una subcarpeta:

```text
http://127.0.0.1:5500/plantillas-base/invitacion-completa/index.html?grupo=familia-prueba
```

---

# 17. Probar RSVP

Abrir:

```text
Confirmar asistencia
```

Deberían aparecer los invitados del grupo.

Ejemplo:

```text
Cecilia
Asiste | No asiste

Federica
Asiste | No asiste
```

Seleccionar una respuesta.

Si el invitado asiste, se pueden mostrar las restricciones alimentarias.

Luego seleccionar:

```text
Guardar confirmación
```

---

# 18. Verificar el guardado de RSVP

Después de guardar, revisar la pestaña:

```text
Invitados
```

Las columnas deberían actualizarse.

Ejemplo:

| nombre | estado | restriccion | detalle_restriccion | comentario | fecha_confirmacion |
|---|---|---|---|---|---|
| Cecilia | attending | none |  | Gracias | 13/07/2026 14:35 |
| Federica | not_attending | none |  | Gracias | 13/07/2026 14:35 |

Los valores actuales de `estado` son:

```text
attending
not_attending
```

Los valores actuales de `restriccion` son:

```text
none
vegetarian
celiac
other
```

---

# 19. Probar Playlist

Abrir:

```text
Sugerir canción
```

Completar:

```text
Nombre
Canción
Link opcional
```

Enviar el formulario.

Después revisar la pestaña:

```text
Playlist
```

Debería aparecer una nueva fila.

Ejemplo:

| fecha | event_id | grupo | nombre | cancion | link |
|---|---|---|---|---|---|
| 13/07/2026 14:40 | evento-001 | familia-prueba | Cecilia | Dancing Queen |  |

---

# 20. Actualizar una implementación existente

Cuando se modifica:

```text
Code.gs
```

guardar primero el proyecto.

Luego:

```text
Implementar
→ Administrar implementaciones
```

Seleccionar la implementación existente.

Hacer clic en:

```text
Editar
```

o en el icono:

```text
✏️
```

Seleccionar:

```text
Nueva versión
```

Luego:

```text
Implementar
```

La URL `/exec` normalmente permanece igual.

No es necesario crear una nueva implementación cada vez.

---

# 21. JSON y JSONP

La integración utiliza dos mecanismos distintos.

## Lectura de invitados

Para cargar invitados desde Apps Script se utiliza:

```text
JSONP
```

Esto evita problemas de CORS al cargar datos desde distintos dominios o desde un servidor local.

Flujo:

```text
rsvp.js
        ↓
script dinámico
        ↓
Google Apps Script
        ↓
callback(...)
        ↓
lista de invitados
```

---

## Guardado de datos

Para guardar:

- RSVP
- Playlist

se utiliza:

```text
POST
```

con datos en formato JSON.

Flujo:

```text
Formulario
        ↓
fetch POST
        ↓
Google Apps Script
        ↓
Google Sheets
```

---

# 22. Diagnóstico de problemas

## Problema: `Acción no válida`

Respuesta:

```json
{
  "success": false,
  "message": "Acción no válida."
}
```

Verificar que la URL tenga:

```text
?action=guests
```

Ejemplo:

```text
https://script.google.com/macros/s/XXXXXXXX/exec?action=guests
```

También verificar que la implementación publicada corresponda a la versión actual del código.

---

## Problema: `guests: []`

Respuesta:

```json
{
  "success": true,
  "guests": []
}
```

Significa que Apps Script funciona, pero no encontró invitados.

Revisar:

- `event_id`
- `grupo`
- Nombre de la pestaña `Invitados`
- Encabezados
- Espacios adicionales
- URL utilizada

Ejemplo correcto:

```text
event_id = evento-001
grupo = familia-prueba
```

URL:

```text
?grupo=familia-prueba
```

---

## Problema: la API devuelve invitados pero no aparecen en la invitación

Verificar:

```text
js/rsvp.js
```

Verificar que esté cargado en `index.html`:

```html
<script src="js/rsvp.js"></script>
```

Verificar también:

```html
<div
  id="guest-list"
  class="guest-list"
></div>
```

Abrir la consola del navegador:

```text
Cmd + Option + J
```

en Mac.

O:

```text
F12
```

en otros sistemas.

---

## Problema: se modificó Apps Script pero sigue funcionando la versión anterior

Actualizar la implementación:

```text
Implementar
→ Administrar implementaciones
→ Editar
→ Nueva versión
→ Implementar
```

Guardar el código antes de actualizar.

---

## Problema: los archivos visuales muestran error `404`

Esto normalmente significa que falta algún recurso.

Ejemplos:

```text
calendar.svg
music.svg
portada.jpg
foto-01.jpg
musica.mp3
```

Revisar que el archivo exista exactamente en la ruta configurada.

Ejemplo:

```text
assets/icons/calendar.svg
```

---

# 23. Estructura recomendada por evento

Cada evento debería tener:

```text
Evento
│
├── Invitación web
│
├── Google Sheet
│   ├── Invitados
│   └── Playlist
│
└── Google Apps Script
```

Ejemplo:

```text
Juanita - 15 años
│
├── juanita-15/
│
├── Save Your Date - Juanita 15
│
└── Save Your Date - Backend Juanita
```

---

# 24. Flujo completo

```text
Cliente elige un modelo
        ↓
Se crea una copia de la invitación
        ↓
Se configura config.js
        ↓
Se crea Google Sheet
        ↓
Se cargan invitados
        ↓
Se copia apps-script.gs
        ↓
Se configura spreadsheetId
        ↓
Se publica como aplicación web
        ↓
Se copia la URL /exec
        ↓
Se conecta en config.js
        ↓
Se prueba API
        ↓
Se prueba RSVP
        ↓
Se prueba Playlist
        ↓
Se publica la invitación
```

---

# 25. Checklist final

## Google Sheets

- [ ] Existe la pestaña `Invitados`
- [ ] Existe la pestaña `Playlist`
- [ ] Los encabezados son correctos
- [ ] `event_id` coincide con `config.js`
- [ ] Los grupos están correctamente definidos
- [ ] Cada invitado tiene un `invitado_id`

## Google Apps Script

- [ ] Se copió `apps-script.gs`
- [ ] Se configuró `spreadsheetId`
- [ ] Se guardó el proyecto
- [ ] Se implementó como aplicación web
- [ ] Ejecutar como: `Yo`
- [ ] Acceso: `Cualquier persona`
- [ ] Se copió la URL `/exec`

## Invitación

- [ ] La URL `/exec` está en `config.js`
- [ ] RSVP está habilitado
- [ ] Playlist está habilitada
- [ ] La URL utiliza `?grupo=`
- [ ] Los invitados aparecen correctamente
- [ ] La confirmación se guarda
- [ ] Las restricciones se guardan
- [ ] Los comentarios se guardan
- [ ] La Playlist se guarda

---

# Regla principal

La plantilla:

```text
integrations/google-sheets/apps-script.gs
```

debe mantenerse como versión maestra.

Para cada evento:

1. Crear un nuevo Google Sheet.
2. Copiar el backend.
3. Cambiar únicamente el `spreadsheetId`.
4. Publicar la aplicación web.
5. Conectar la nueva URL en `config.js`.

De esta forma, cada evento mantiene sus datos independientes y su propia integración.