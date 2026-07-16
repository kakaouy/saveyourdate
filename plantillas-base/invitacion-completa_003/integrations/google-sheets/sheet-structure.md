# Estructura de Google Sheets

Este documento define la estructura esperada de las hojas de cálculo utilizadas por la plantilla técnica base de **Save Your Date**.

Actualmente la integración utiliza dos pestañas:

- `Invitados`
- `Playlist`

La estructura de estas hojas debe mantenerse para que `apps-script.gs`, `rsvp.js` y `playlist.js` funcionen correctamente.

---

# Hoja `Invitados`

La pestaña debe llamarse exactamente:

```text
Invitados
```

## Encabezados

La fila 1 debe contener estas columnas, en este orden:

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

---

## Ejemplo

| event_id | grupo | invitado_id | nombre | estado | restriccion | detalle_restriccion | comentario | fecha_confirmacion |
|---|---|---:|---|---|---|---|---|---|
| evento-001 | familia-perez | 1 | María Pérez |  | none |  |  |  |
| evento-001 | familia-perez | 2 | Juan Pérez |  | none |  |  |  |
| evento-001 | amigos-trabajo | 3 | Sofía Gómez |  | none |  |  |  |

---

# Descripción de columnas

## `event_id`

Identificador único del evento.

Debe coincidir con:

```js
EVENT_CONFIG.event.id
```

Ejemplo:

```js
event: {
  id: "evento-001"
}
```

Entonces en Google Sheets debe figurar:

```text
evento-001
```

Este campo permite identificar a qué evento pertenece cada invitado.

---

## `grupo`

Identificador del grupo de invitados.

Ejemplos:

```text
familia-perez
familia-gomez
amigos-trabajo
mesa-01
```

La URL de la invitación utiliza este valor:

```text
?grupo=familia-perez
```

Ejemplo:

```text
https://misitio.com/?grupo=familia-perez
```

Todos los invitados con ese mismo valor en la columna `grupo` se mostrarán juntos.

---

## `invitado_id`

Identificador único del invitado dentro del evento.

Ejemplo:

```text
1
2
3
4
```

También puede ser alfanumérico:

```text
INV-001
INV-002
```

Debe ser único dentro del evento.

---

## `nombre`

Nombre visible del invitado.

Ejemplo:

```text
María Pérez
Juan Pérez
Sofía Gómez
```

Este nombre se muestra en el modal de confirmación de asistencia.

---

## `estado`

Guarda la respuesta de asistencia.

Valores actuales:

```text
attending
not_attending
```

Significado:

| Valor | Significado |
|---|---|
| `attending` | Asiste |
| `not_attending` | No asiste |

Antes de que el invitado responda, la celda puede quedar vacía.

---

## `restriccion`

Guarda la restricción alimentaria seleccionada.

Valores actuales:

```text
none
vegetarian
celiac
other
```

Significado:

| Valor | Significado |
|---|---|
| `none` | Sin restricciones |
| `vegetarian` | Vegano / Vegetariano |
| `celiac` | Celíaco / Sin TACC |
| `other` | Otra restricción |

---

## `detalle_restriccion`

Se utiliza cuando:

```text
restriccion = other
```

Ejemplos:

```text
Alergia a los frutos secos
Intolerancia a la lactosa
Sin mariscos
```

Puede quedar vacío para las demás opciones.

---

## `comentario`

Comentario general enviado durante la confirmación.

Ejemplos:

```text
Llegaremos un poco más tarde.
Muchas gracias por la invitación.
```

Actualmente el mismo comentario puede guardarse en todas las filas del grupo confirmado.

---

## `fecha_confirmacion`

Fecha y hora en que se guardó la confirmación.

La completa automáticamente Google Apps Script.

Ejemplo:

```text
13/07/2026 14:35:20
```

No es necesario completar esta columna manualmente.

---

# Cómo funcionan los grupos

Ejemplo:

| event_id | grupo | invitado_id | nombre |
|---|---|---:|---|
| evento-001 | familia-perez | 1 | María Pérez |
| evento-001 | familia-perez | 2 | Juan Pérez |
| evento-001 | familia-perez | 3 | Sofía Pérez |

La URL:

```text
https://misitio.com/?grupo=familia-perez
```

mostrará:

```text
María Pérez
Juan Pérez
Sofía Pérez
```

Cada invitado podrá confirmar su asistencia individualmente.

---

# Hoja `Playlist`

La pestaña debe llamarse exactamente:

```text
Playlist
```

## Encabezados

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

## Ejemplo

| fecha | event_id | grupo | nombre | cancion | link |
|---|---|---|---|---|---|
| 13/07/2026 14:40 | evento-001 | familia-perez | María | Dancing Queen |  |
| 13/07/2026 14:42 | evento-001 | amigos-trabajo | Sofía | Viva la Vida | https://... |

---

# Descripción de columnas de `Playlist`

## `fecha`

Fecha y hora en que se envió la sugerencia.

La completa automáticamente Google Apps Script.

---

## `event_id`

Identificador del evento.

Debe coincidir con:

```js
EVENT_CONFIG.event.id
```

---

## `grupo`

Grupo asociado a la URL desde la que se envió la canción.

Ejemplo:

```text
familia-perez
```

Puede quedar vacío si la invitación no utiliza grupos.

---

## `nombre`

Nombre de la persona que sugirió la canción.

Este campo puede configurarse como opcional.

---

## `cancion`

Nombre de la canción sugerida.

Ejemplos:

```text
Dancing Queen
Viva la Vida
I Wanna Dance with Somebody
```

---

## `link`

Enlace opcional.

Puede contener:

- YouTube
- Spotify
- Apple Music
- Otro enlace válido

Ejemplo:

```text
https://open.spotify.com/...
```

---

# Relación con `config.js`

El evento se identifica desde:

```js
event: {
  id: "evento-001"
}
```

La URL de Google Apps Script se configura en:

```js
integrations: {
  googleSheets: {
    enabled: true,
    scriptUrl: "URL_DEL_APPS_SCRIPT"
  }
}
```

El nombre del parámetro de grupo se configura en:

```js
urlParams: {
  guestGroup: "grupo"
}
```

---

# Flujo de RSVP

```text
URL de invitación
        ↓
?grupo=familia-perez
        ↓
rsvp.js
        ↓
Google Apps Script
        ↓
Busca event_id + grupo
        ↓
Devuelve invitados
        ↓
El usuario confirma asistencia
        ↓
Google Apps Script actualiza Google Sheets
```

---

# Flujo de Playlist

```text
Formulario Playlist
        ↓
playlist.js
        ↓
Google Apps Script
        ↓
Nueva fila en la hoja Playlist
```

---

# Reglas importantes

- La pestaña debe llamarse exactamente `Invitados`.
- La pestaña debe llamarse exactamente `Playlist`.
- No cambiar los nombres de los encabezados sin modificar también `apps-script.gs`.
- `event_id` debe coincidir con `EVENT_CONFIG.event.id`.
- `grupo` debe coincidir con el valor utilizado en la URL.
- Cada invitado debe tener un `invitado_id`.
- No eliminar la fila de encabezados.
- No agregar filas vacías entre invitados si no es necesario.

---

# Plantilla mínima de `Invitados`

```text
event_id | grupo | invitado_id | nombre | estado | restriccion | detalle_restriccion | comentario | fecha_confirmacion
```

---

# Plantilla mínima de `Playlist`

```text
fecha | event_id | grupo | nombre | cancion | link
```

---

# Recomendación para cada evento

Se recomienda que cada evento tenga su propio Google Sheet.

Ejemplos:

```text
Save Your Date - Juanita 15
Save Your Date - Boda María y Pedro
Save Your Date - Bautismo Mateo
```

Esto facilita:

- Entregar el panel al cliente.
- Evitar mezclar datos entre eventos.
- Gestionar invitados.
- Gestionar restricciones alimentarias.
- Revisar canciones sugeridas.
- Mantener cada evento independiente.

---

# Resumen visual de la estructura

```text
Google Sheets
│
├── Invitados
│   ├── event_id
│   ├── grupo
│   ├── invitado_id
│   ├── nombre
│   ├── estado
│   ├── restriccion
│   ├── detalle_restriccion
│   ├── comentario
│   └── fecha_confirmacion
│
└── Playlist
    ├── fecha
    ├── event_id
    ├── grupo
    ├── nombre
    ├── cancion
    └── link
```

---

# Estado actual de la integración

Actualmente Google Sheets permite gestionar:

- [x] Lista de invitados
- [x] Grupos de invitados
- [x] Confirmación individual
- [x] Asistencia
- [x] Restricciones alimentarias
- [x] Detalle de restricciones
- [x] Comentarios
- [x] Fecha de confirmación
- [x] Sugerencias de canciones
- [x] Link opcional de canción

## Posibles extensiones futuras

- [ ] Menú elegido
- [ ] Mesa asignada
- [ ] Acompañantes
- [ ] Edad del invitado
- [ ] Tipo de menú infantil
- [ ] Transporte
- [ ] Hospedaje
- [ ] Mensajes para los anfitriones
- [ ] Carga de fotografías
- [ ] Estado de envío de invitación
- [ ] Fecha de apertura de la invitación
- [ ] Panel de métricas