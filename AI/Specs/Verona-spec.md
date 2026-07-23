# SPEC — Modelo Verona

## 1. Identificación

**Nombre interno:** Verona  
**Categoría:** Invitación digital para fiesta de 15 años  
**Estado:** Referencia visual y funcional lista para implementación productiva  
**Versión:** 2.1  
**Responsable de diseño:** Save Your Date  
**Referencia aprobada:** `AI/Referencias/Verona/index.html`

Verona es un modelo juvenil, alegre, femenino y contemporáneo. Combina fotografía protagonista, fondos cálidos, bloques de color intenso, tipografía manuscrita, ornamentos orgánicos y movimiento sutil.

La implementación productiva debe reconstruir esta referencia dentro de la arquitectura reutilizable de Save Your Date. No debe copiarse como una invitación individual rígida ni alterarse su identidad visual.

---

## 2. Fuentes de verdad

Consultar en este orden:

1. `AI/Design System/Design_System.md`
2. `AI/Specs/Verona-spec.md`
3. `AI/Referencias/Verona/index.html`
4. `AI/Referencias/Verona/images/`

El Design System define las reglas generales. Este documento define las decisiones de Verona. El HTML es la referencia visual y de interacción aprobada.

---

## 3. Decisiones definitivas

- Verona no incluye música, reproducción sonora ni selección de experiencia de entrada.
- No requiere archivos sonoros.
- La arquitectura global puede soportar funcionalidades opcionales de otros modelos, pero Verona no debe activarlas, cargarlas ni renderizarlas.
- No debe mostrarse una pantalla de decisión antes de ingresar.
- El loader abre directamente la invitación.
- El selector de paletas pertenece al modal de demo del sitio y nunca a la invitación.
- Desde el catálogo, Verona se presenta dentro del modal estándar de demo; no abre directamente a pantalla completa.
- No se agregan nuevas secciones ni se modifica la composición aprobada sin aprobación de diseño.

---

## 4. Objetivos de experiencia

Verona debe transmitir:

- alegría;
- calidez;
- frescura;
- celebración;
- movimiento;
- personalidad juvenil;
- cuidado visual;
- una experiencia premium, sin rigidez formal.

La experiencia debe ser mobile first, fácil de comprender y consistente con el resto de Save Your Date.

---

## 5. Arquitectura de secciones

Orden aprobado:

1. Loader.
2. Portada.
3. Cuenta regresiva.
4. Cuándo y dónde.
5. Frase destacada.
6. Código de vestimenta.
7. Cronograma.
8. Fotografía parallax.
9. Galería.
10. Alojamiento.
11. Mesa de regalos.
12. Compartir fotografías.
13. Instagram y redes.
14. Pase QR.
15. Confirmación de asistencia.
16. Footer corporativo.
17. Modales correspondientes.

Cada sección, salvo el footer corporativo, debe poder activarse o desactivarse mediante configuración. Los ornamentos asociados deben ocultarse o reubicarse de forma coherente cuando cambia la composición.

No utilizar `nth-of-type` para decidir el tono visual. Cada sección debe declarar explícitamente:

```js
tone: "light" | "alternate" | "accent"
```

---

## 6. Sistema visual

### 6.1. Presets cromáticos aprobados

Verona dispone de cinco presets completos. Todos preservan la identidad del modelo y deben mantener contraste WCAG AA.

#### Preset `coral`

Es el preset predeterminado y más cercano a la referencia original.

| Función | Valor |
|---|---|
| Fondo principal | `#fff9f6` |
| Fondo alternativo | `#f3e4d9` |
| Títulos | `#a9364b` |
| Textos | `#653b3b` |
| Botones | `#a9364b` |
| Acento | `#9b3f2f` |
| Bordes | `#8d5a54` |
| Ornamentos | `#c66b55` |
| Texto sobre botón/acento | `#ffffff` |
| Foco accesible | `#702238` |

#### Preset `botanica`

Toma los verdes azulados de las hojas y conserva el coral como detalle ornamental.

| Función | Valor |
|---|---|
| Fondo principal | `#f7fbf8` |
| Fondo alternativo | `#dfece6` |
| Títulos | `#1f5f63` |
| Textos | `#274843` |
| Botones | `#176268` |
| Acento | `#285d52` |
| Bordes | `#568074` |
| Ornamentos | `#d86f5c` |
| Texto sobre botón/acento | `#ffffff` |
| Foco accesible | `#123f43` |

#### Preset `blush`

Se inspira en los pétalos rosados y centros borgoña de los adornos.

| Función | Valor |
|---|---|
| Fondo principal | `#fff8fa` |
| Fondo alternativo | `#f4e0e7` |
| Títulos | `#8a3053` |
| Textos | `#573743` |
| Botones | `#8a3053` |
| Acento | `#6f3650` |
| Bordes | `#9f6c7d` |
| Ornamentos | `#d46f7d` |
| Texto sobre botón/acento | `#ffffff` |
| Foco accesible | `#552039` |

#### Preset `bordo-calida`

| Función | Valor |
|---|---|
| Fondo principal | `#fff9f6` |
| Fondo alternativo | `#f3e4d9` |
| Títulos | `#a72039` |
| Superficie secundaria | `#fff1dc` |
| Textos | `#653b3b` |
| Botones | `#a9364b` |
| Acento | `#d1475c` |
| Bordes | `#8d5a54` |
| Ornamentos | `#ffa287` |
| Texto sobre botón/acento | `#ffffff` |
| Foco accesible | `#8d0000` |

#### Preset `verde-agua`

| Función | Valor |
|---|---|
| Fondo principal | `#dadfd9` |
| Fondo alternativo | `#c5d3d0` |
| Títulos | `#69949b` |
| Superficie secundaria | `#ebf3e9` |
| Textos | `#2d5f67` |
| Botones | `#285b64` |
| Acento | `#79a7b0` |
| Bordes | `#98babe` |
| Ornamentos | `#bbccca` |
| Texto sobre botón/acento | `#ffffff` |
| Foco accesible | `#3d7078` |

#### Contrato de tokens

```css
--color-fondo
--color-fondo-alterno
--color-titulos
--color-secundario
--color-texto
--color-botones
--color-acento
--color-bordes
--color-ornamentos
--color-texto-claro
--color-foco
```

`--color-principal` puede mantenerse temporalmente como alias de `--color-titulos` en la referencia. La implementación productiva debe usar el token semántico correspondiente.

Los presets se reciben desde la configuración general del sitio. No se agrega un selector dentro de la invitación.

```js
theme: {
  palettePreset: "coral"
  // "coral" | "botanica" | "blush" | "bordo-calida" | "verde-agua"
}
```

La referencia permite previsualizarlos mediante `?palette=coral`, `?palette=botanica`, `?palette=blush`, `?palette=bordo-calida` y `?palette=verde-agua`. Para facilitar la revisión visual, el HTML de Work abierto sin parámetros muestra `verde-agua`; el preset productivo predeterminado continúa siendo `coral`. Este parámetro es sólo para revisión; producción debe usar la configuración del sitio.

No deben existir colores de componentes fuera del tema, excepto sombras u overlays derivados y colores técnicos del QR de demostración.

### 6.2. Tipografías

- Títulos y nombre: `var(--font-title)`.
- Cuerpo, botones, formularios y cronograma: `var(--font-body)`.
- El hashtag social utiliza `var(--font-body)` con peso semibold; no utiliza la tipografía manuscrita.
- El título de evento `Mis 15 Años` conserva la tipografía de títulos en una escala secundaria, claramente menor que el nombre protagonista.
- Firma: `var(--font-signature)`.

Los nombres de fuentes no deben repetirse dentro de componentes.

### 6.3. Fotografía

- La portada usa `images/foto-01.png` en la referencia.
- La fotografía ocupa toda la portada con `background-size: cover`.
- El punto focal debe ser configurable para mobile y desktop.
- La capa de contraste debe ser configurable sin comprometer la lectura.
- La imagen de portada no usa lazy loading.
- Las imágenes posteriores deben usar lazy loading cuando corresponda.

### 6.4. Ornamentos

Recursos aprobados:

- `images/esquina-superior-derecha.png`
- `images/esquina-inferior-izquierda.png`
- `images/ornamento_naranja_izq.png`
- `images/orna-derecha.png`

Reglas:

- decorativos, con `alt=""` y `aria-hidden="true"`;
- `pointer-events: none`;
- no alteran el flujo vertical;
- no generan scroll horizontal;
- salen desde los márgenes;
- se escalan con `clamp()`;
- acompañan el límite entre secciones;
- flotación de 5 a 7 segundos, con desplazamiento y rotación mínimos.

`images/ornamento_hojas_bottom.png` queda disponible como recurso no utilizado. Codex no debe incorporarlo sin una decisión visual aprobada.

---

## 7. Responsive

### Mobile first

- Sin ancho mínimo forzado en `body`.
- Sin scroll horizontal.
- Portada con `min-height: 100svh`.
- Nombre preparado para textos largos mediante `clamp()`, ancho máximo y saltos seguros.
- Cuenta regresiva completa dentro de 320 px.
- Botones dobles apilados en pantallas angostas.
- Áreas táctiles mínimas de 44 × 44 px; objetivo de Verona: 48 px de alto.
- Modales con unidades dinámicas, scroll interno y safe areas.
- Parallax desactivado en dispositivos táctiles o sin soporte adecuado.

### Tablet

- Controlar ancho máximo del contenido.
- Mantener escala proporcionada de fotografías y ornamentos.
- Evitar líneas excesivamente largas.

### Desktop

- El hero no debe crecer indefinidamente.
- El punto focal puede diferir del usado en mobile.
- La galería debe mantener una composición equilibrada.
- El contenido debe permanecer centrado y legible.

Breakpoints de referencia del HTML:

- base: 320 px en adelante;
- ajuste mobile: hasta 560 px;
- tablet: desde 768 px;
- desktop ancho: desde 1100 px.

---

## 8. Componentes y comportamiento

### 8.1. Loader

- Ocupa la pantalla completa.
- Muestra spinner y “CARGANDO EXPERIENCIA...”.
- Desaparece con transición suave.
- Tiene salida de seguridad aunque fallen recursos o parte del JavaScript.
- No bloquea indefinidamente el acceso.

### 8.2. Portada

Incluye, en este orden visual:

1. Nombre.
2. Fecha visible.
3. Tipo de celebración.

La referencia utiliza “Sábado 15 de noviembre”. El año y la fecha técnica deben venir de configuración y ser coherentes con el día de la semana.

### 8.3. Cuenta regresiva

- Días, horas, minutos y segundos.
- Dos dígitos como mínimo.
- Fecha objetivo única, con zona horaria.
- Nunca muestra valores negativos.
- Al finalizar muestra un mensaje configurable.

### 8.4. Cuándo y dónde

Incluye fecha, hora, lugar, dirección, mapa y calendario.

- El mapa recibe una URL configurada.
- El HTML de referencia puede mostrar un mensaje de integración pendiente cuando no hay URL.
- La preview genera un archivo `.ics` local.
- Codex debe integrar los destinos de calendario definidos por la arquitectura productiva.

### 8.5. Frase destacada

- Texto completamente configurable.
- Ancho de lectura limitado.
- Tipografía de título.
- Centrada y con espaciado generoso.

### 8.6. Código de vestimenta

- Resumen breve y modal de detalles.
- Puede incluir recomendaciones, colores reservados e imágenes mediante configuración.

### 8.7. Cronograma

- Lista de longitud variable.
- Cada elemento contiene hora, título y descripción.
- La última actividad no extiende la línea vertical.
- Debe tolerar horarios y textos de distintas longitudes.

### 8.8. Fotografía parallax

- Usa `images/foto-05.jpg` en la referencia.
- La sección funciona como una ventana con `overflow: hidden`; su altura forma parte del flujo normal y no cambia durante el scroll.
- La fotografía vive en una capa absoluta interna, sobredimensionada respecto de la ventana para que el desplazamiento no revele bordes.
- Mientras la sección atraviesa el viewport, la capa fotográfica se desplaza verticalmente a una velocidad menor que el documento. El progreso se calcula desde la posición de la sección y se aplica con `transform: translate3d(...)` dentro de `requestAnimationFrame`.
- El desplazamiento debe ser suave, acotado y proporcional al viewport. No debe mover el contenedor, modificar su altura ni provocar saltos de layout.
- La actualización sólo se mantiene activa cuando la sección está próxima o dentro del viewport. Debe limpiarse al desmontar el componente.
- `background-attachment: fixed` no constituye por sí solo una implementación válida del efecto.
- En dispositivos táctiles o de puntero grueso puede usarse una imagen estática bien encuadrada como fallback. Si la arquitectura y las pruebas reales demuestran rendimiento estable, puede conservarse un desplazamiento de amplitud reducida.
- Con `prefers-reduced-motion: reduce`, sin JavaScript o ante un error de inicialización, la fotografía permanece estática y visible.
- El texto se ubica en una capa independiente sobre la fotografía.
- Sólo se admite un overlay negro o neutro, muy sutil y uniforme, cuando sea necesario para la legibilidad. No debe teñir la imagen con colores del preset.
- La fotografía debe conservar sus colores originales: sin `filter`, `mix-blend-mode`, `background-blend-mode` ni opacidad aplicada para recolorearla.

### 8.9. Galería y lightbox

- Cantidad variable de imágenes.
- Botones semánticos, operables con teclado.
- Fotografías cuadradas con `object-fit: cover`.
- Lightbox limitado al viewport.
- Cierra con botón, fondo y Escape.
- Bloquea scroll y devuelve el foco.
- Cada fotografía tiene alt descriptivo.

### 8.10. Alojamiento

Sección opcional con lista configurable de alojamientos. Puede incluir nombre, dirección, distancia, teléfono, reserva, descuento y observaciones.

### 8.11. Regalos

- Los datos sólo aparecen al abrir el modal.
- Banco, titular, moneda, cuenta, alias y enlaces son configurables.
- Copiar muestra confirmación o alternativa manual.
- La preview utiliza datos ficticios.
- Codex debe aplicar la política de privacidad definida para el evento.

### 8.12. Compartir fotografías

- URL configurable.
- Si no existe URL, la preview informa que la integración está pendiente.
- Codex conecta el proveedor elegido para el evento.

### 8.13. Redes

- Hashtag y enlaces configurables.
- Sección desactivable cuando no se utilizan redes.
- Los enlaces externos de producción deben abrirse de manera segura.

### 8.14. Pase QR

- La preview muestra un marcador visual, no un QR real.
- Codex debe generar el QR desde un token, invitado, grupo o URL validable.
- No depender obligatoriamente de un servicio público externo.
- No usar identificadores personales fijos en el código cliente.

### 8.15. RSVP

La preview permite probar:

- nombre;
- asiste/no asiste;
- restricción alimentaria;
- opción “Otra” con campo adicional;
- mensaje;
- validación nativa;
- confirmación visual simulada.

Codex debe implementar posteriormente:

- invitados individuales y grupos;
- confirmación por persona;
- integración con backend;
- estados cargando, éxito, error y reintento;
- persistencia y protección de datos;
- fecha límite real;
- campos adicionales definidos por el producto.

### 8.16. Footer

El footer corporativo es obligatorio y compartido. Debe incluir:

- firma Save Your Date;
- descripción institucional;
- derechos reservados;
- año automático.

No puede eliminarse ni reemplazarse sin indicación explícita.

---

## 9. Botones

- Componente compartido para principal y outline.
- Altura, padding, radio, tipografía, hover y foco coherentes.
- Botón principal: fondo principal y texto claro.
- Outline claro: borde y texto principal.
- Outline sobre fondo de acento: borde y texto blancos; hover blanco con texto de acento.
- Sin correcciones inline.
- Texto visible y comprensible.

---

## 10. Modales

Todos los modales usan un componente común con:

- overlay;
- contenido centrado;
- altura máxima y scroll interno;
- botón de cierre semántico;
- `role="dialog"`;
- `aria-modal="true"`;
- título asociado;
- cierre con Escape y fondo;
- bloqueo de scroll;
- foco inicial;
- trampa de foco;
- devolución del foco al disparador;
- animación breve y compatible con reduced motion.

---

## 11. Animaciones

Las animaciones aprobadas son:

| Elemento | Animación | Activación | Duración | Repetición |
|---|---|---|---:|---|
| Loader | Giro suave | Al cargar | 1 s | Hasta ocultarse |
| Secciones `.reveal` | Fade up | Al ingresar al viewport | 0,75 s | Una vez |
| Fotografía parallax | Desplazamiento vertical acotado de la capa interna | Durante el scroll, sólo cerca del viewport | Vinculada al scroll mediante `requestAnimationFrame` | Mientras está visible |
| Ornamentos entre secciones | Float mínimo | Al cargar | 6 s | Continua y sutil |
| Botones | Elevación/color | Hover o foco | 0,25 s | Por interacción |
| Modales | Fade + desplazamiento mínimo | Al abrir | 0,28 s | Cada apertura |
| Galería | Zoom mínimo | Hover | 0,3 s | Por interacción |

Reglas:

- El contenido es visible por defecto sin JavaScript.
- La clase `.js` activa progresivamente el estado inicial oculto.
- Si `IntersectionObserver` no existe, todo queda visible.
- Al revelarse, cada elemento deja de observarse.
- `prefers-reduced-motion: reduce` desactiva o reduce las animaciones.
- El fallback táctil o estático del parallax no se considera una pérdida funcional.

---

## 12. Accesibilidad

- No bloquear zoom.
- Contraste WCAG AA como mínimo.
- Jerarquía correcta de encabezados.
- `alt` descriptivo en fotografías.
- Ornamentos con `alt=""` y `aria-hidden="true"`.
- Foco visible.
- Navegación completa por teclado.
- Formularios con `label`, `for` e `id`.
- Mensajes de estado mediante regiones vivas cuando corresponda.
- Targets táctiles suficientes.
- Modales accesibles.
- Reduced motion.
- Skip link al contenido.

---

## 13. Idiomas e internacionalización

### 13.1. Idiomas soportados

Verona debe recibir el idioma desde la configuración general del sitio:

```js
locale: "es" // "es" | "pt" | "en"
```

Mapeo recomendado para formato regional:

- `es` → `es-UY`;
- `pt` → `pt-BR`;
- `en` → `en-US`.

No se incorpora un selector de idioma dentro de la invitación. La referencia permite revisar traducciones con `?lang=es`, `?lang=pt` y `?lang=en`; producción debe recibir el valor desde la configuración del sitio.

### 13.2. Textos traducibles

Todo texto visible o accesible debe provenir del diccionario del idioma:

- título de documento, descripción y Open Graph;
- skip link;
- loader;
- tipo de evento;
- eyebrow y título de cuenta regresiva;
- días, horas, minutos y segundos;
- mensaje de fecha cumplida;
- títulos y textos de todas las secciones;
- frase destacada;
- código de vestimenta y detalles;
- cronograma completo;
- texto sobre fotografía parallax;
- título, descripción y alt de galería;
- alojamiento;
- regalos;
- carga de fotografías;
- redes y hashtag cuando corresponda;
- pase QR;
- RSVP y fecha límite;
- footer y derechos;
- botones;
- títulos, contenido y cierres de modales;
- labels, opciones y ayudas de formularios;
- estados de carga, éxito, error, vacío y reintento;
- confirmaciones de copiado;
- mensajes de integraciones pendientes;
- nombres accesibles y `aria-label`.

Los nombres propios, lugares, direcciones, hashtags, datos bancarios y contenido específico del evento se reciben como datos, no como traducciones de interfaz.

### 13.3. Textos de interfaz mínimos

El contrato de traducción debe contemplar, como mínimo:

```text
loading
skipToContent
eventType
countdown.eyebrow
countdown.title
countdown.days
countdown.hours
countdown.minutes
countdown.seconds
countdown.finished
sections.*.title
sections.*.description
buttons.*
modals.*.title
modals.*.body
forms.*.labels
forms.*.options
states.loading
states.success
states.error
states.retry
states.empty
accessibility.close
accessibility.enlargePhoto
footer.description
footer.rights
```

### 13.4. Fechas y horarios

- Guardar fechas en formato ISO 8601 con zona horaria.
- No guardar el texto visible de fecha como fuente de verdad.
- Formatear con `Intl.DateTimeFormat` o equivalente usando el locale configurado.
- Español de referencia: `Sábado 15 de noviembre · 21:00 h`.
- Portugués de referencia: `Sábado, 15 de novembro · 21:00`.
- Inglés de referencia: `Saturday, November 15 · 9:00 PM`.
- Mantener la hora del cronograma según la convención del locale o una preferencia explícita del evento.
- El `.ics` debe usar la fecha técnica, no el texto traducido.

### 13.5. Expansión de contenido

- No fijar alturas en títulos, botones, tarjetas, cronograma o formularios.
- Permitir botones multilínea conservando un mínimo táctil de 48 px.
- Usar `overflow-wrap: anywhere` sólo para datos largos como hashtags o nombres; no cortar palabras normales sin necesidad.
- Apilar grupos de botones en 320 px.
- Mantener `clamp()` y anchos máximos para títulos.
- Permitir que cronograma y modales crezcan verticalmente.
- Mantener scroll interno en modales mediante `max-height` dinámico.
- No reducir el cuerpo por debajo del tamaño legible para acomodar traducciones.
- Probar especialmente inglés en botones y portugués en títulos y mensajes de formulario.

### 13.6. Recepción desde el sitio

Contrato conceptual:

```js
window.VERONA_SITE_CONFIG = {
  locale: "pt",
  palettePreset: "botanica",
  event: {},
  content: {},
  links: {},
  gifts: {},
  sections: {}
};
```

La configuración debe existir antes de inicializar Verona. Codex debe adaptarla al mecanismo real del sistema —props, contexto, JSON del servidor o configuración de plantilla— sin crear controles internos duplicados.

### 13.7. Presentación en el modal de demo

La integración productiva debe reutilizar el patrón estándar de los demás modelos:

- al seleccionar Verona en el catálogo se abre el modal estándar de demo;
- la invitación se muestra embebida en el dispositivo o preview de celular existente;
- no se navega directamente a una versión full screen desde la tarjeta;
- el modal muestra el nombre `Verona`;
- incluye una lista de características derivada de las secciones activas;
- incluye el selector externo de presets cromáticos;
- el preset elegido se transmite a la invitación mediante la configuración general;
- incluye el botón `Creá tu invite`, la acción de cerrar y la opción de ver más modelos;
- idioma y paleta se controlan en el sitio, sin controles duplicados dentro del documento embebido.

La lista de características no es texto fijo: debe construirse a partir de la configuración activa del modelo. Puede contemplar cuenta regresiva, ubicación y mapa, calendario, código de vestimenta, cronograma, galería, alojamiento, regalos, carga de fotos, Instagram y hashtag, pase QR, RSVP y paletas seleccionables.

Verona no incluye música, audio ni playlist. Por lo tanto, `Sugerencia de canciones` no debe mostrarse como característica mientras no exista una nueva decisión de producto que modifique expresamente ese alcance.

---

## 14. Recursos

Recursos vigentes:

```text
AI/Referencias/Verona/
├── index.html
└── images/
    ├── foto-01.png
    ├── foto-01.jpg
    ├── foto-02.jpg
    ├── foto-03.jpg
    ├── foto-04.jpg
    ├── foto-05.jpg
    ├── esquina-superior-derecha.png
    ├── esquina-inferior-izquierda.png
    ├── ornamento_naranja_izq.png
    ├── orna-derecha.png
    └── ornamento_hojas_bottom.png
```

Las rutas finales deben provenir de configuración. No mezclar recursos de otros modelos.

Antes de producción:

- generar WebP o AVIF cuando corresponda;
- conservar fallback si es necesario;
- verificar dimensiones y peso;
- no cargar imágenes ocultas de secciones deshabilitadas;
- precargar únicamente recursos críticos.

---

## 15. Parametrización obligatoria

### Evento

- nombre;
- tipo de evento;
- fecha y hora de inicio;
- fecha y hora de finalización;
- zona horaria;
- fecha visible;
- lugar;
- dirección;
- título del calendario.

### Contenido

- títulos;
- descripciones;
- frase;
- textos de botones;
- textos de modales;
- mensaje de cuenta regresiva finalizada;
- fecha límite y textos de RSVP;
- código de vestimenta;
- hashtag.

### Fotografías y recursos

- hero;
- punto focal mobile y desktop;
- overlay;
- fotografía parallax;
- galería variable;
- alt de fotografías;
- ornamentos.

### Tema

- preset cromático `coral`, `botanica`, `blush`, `bordo-calida` o `verde-agua`;
- tipografía de título;
- tipografía de cuerpo;
- tipografía de firma.

Cada combinación configurada debe conservar contraste AA.

### Idioma

- locale `es`, `pt` o `en`;
- diccionario completo;
- formato regional de fecha y hora;
- metadatos traducidos;
- textos accesibles;
- estados de interfaz.

### Secciones

- activación;
- orden cuando lo soporte la arquitectura;
- tono;
- contenido vacío;
- comportamiento de ornamentos asociados.

### Enlaces

- mapa;
- calendarios;
- carga de fotos;
- Instagram;
- filtro social;
- hoteles;
- lista de regalos;
- endpoints productivos.

### Regalos

- banco;
- titular;
- moneda;
- número de cuenta;
- alias;
- enlace;
- etiqueta y valor copiable;
- privacidad.

### RSVP

- habilitación;
- fecha límite;
- campos;
- opciones alimentarias;
- invitados o grupos;
- endpoint;
- mensajes de estado;
- política de datos.

### Cronograma

- cantidad de actividades;
- hora;
- título;
- descripción;
- orden.

### Metadatos

- idioma;
- título;
- descripción;
- favicon;
- Open Graph;
- imagen social;
- color del navegador;
- indexación y privacidad.

---

## 16. Configuración conceptual

```js
const veronaConfig = {
  model: "verona",
  locale: "es",
  palettePreset: "coral",
  event: {
    name: "",
    typeLabel: "",
    dateTime: "",
    endDateTime: "",
    timezone: "America/Montevideo",
    venue: "",
    address: "",
    mapsUrl: "",
    calendarTitle: ""
  },
  theme: {
    palettePreset: "coral",
    fonts: {
      title: "Great Vibes",
      body: "Montserrat",
      signature: "Great Vibes"
    }
  },
  hero: {
    image: "",
    positionMobile: "center",
    positionDesktop: "center 24%",
    overlayOpacity: 0.38,
    ornamentTopRight: "",
    ornamentBottomLeft: ""
  },
  content: {
    quote: "",
    dressCode: {},
    social: {},
    rsvp: {}
  },
  schedule: [],
  gallery: [],
  hotels: [],
  gifts: {},
  qrPass: {},
  links: {},
  metadata: {},
  sections: {
    hero: true,
    countdown: true,
    location: true,
    quote: true,
    dressCode: true,
    schedule: true,
    parallax: true,
    gallery: true,
    hotels: true,
    gifts: true,
    photoUpload: true,
    social: true,
    qrPass: true,
    rsvp: true
  }
};
```

La forma final debe adaptarse a la arquitectura real del repositorio. Este ejemplo define responsabilidades, no una API obligatoria.

---

## 17. Estados de interfaz

Los flujos con datos o integración deben contemplar:

- inicial;
- cargando;
- éxito;
- error;
- reintento;
- sin datos;
- deshabilitado.

Aplica especialmente a RSVP, copiar regalos, QR, galería, links externos, calendario y carga de invitado.

La referencia de Work simula interacciones sin persistir ni transmitir datos.

---

## 18. Rendimiento, SEO y privacidad

### Rendimiento

- Evitar librerías pesadas para animaciones simples.
- Reducir JavaScript innecesario.
- Minimizar saltos de layout.
- Cargar sólo fuentes y pesos usados.
- No aplicar lazy loading a la portada.
- Lazy loading para imágenes no críticas.

### SEO

- Metadatos configurables.
- Open Graph configurable.
- Imagen social propia del evento.
- No indexar cuando la invitación sea privada.

### Privacidad

Definir por evento:

- acceso público o privado;
- acceso por invitado o grupo;
- visibilidad de datos bancarios;
- seguridad del QR;
- protección de respuestas RSVP;
- conservación de datos.

No exponer datos personales innecesarios en el cliente.

---

## 19. Pruebas mínimas

### Viewports

- 320 px.
- Mobile estándar: 390 × 844 px.
- Tablet: 768 × 1024 px.
- Desktop: 1440 × 900 px.

### Navegadores

- Chrome mobile.
- Safari iPhone.
- Chrome desktop.
- Safari desktop.

### Casos

- Matriz completa de 5 presets × 3 idiomas.
- Portada, botones, títulos largos, cronograma, modales y formularios en cada combinación.
- Nombre largo.
- Fecha futura y vencida.
- Cronograma con 2 y 8 actividades.
- Galería con 1 y muchas fotos.
- Secciones desactivadas.
- Sin hoteles, QR o Instagram.
- RSVP con “Otra” restricción.
- Error de backend.
- Navegación completa por teclado.
- Reduced motion.
- Zoom al 200 %.
- Imágenes que no cargan.
- JavaScript parcial o deshabilitado.

---

## 20. Criterios de aceptación

### Visuales

- Se reconoce como Verona.
- Fotografía y ornamentos conservan la composición aprobada.
- La fotografía parallax se desplaza dentro de una ventana estable en desktop y usa un fallback seguro donde corresponda.
- La fotografía parallax conserva sus colores naturales y no recibe tintes del preset.
- Paleta coral cálida con contraste suficiente.
- Great Vibes y Montserrat mantienen la jerarquía.
- No hay scroll horizontal.
- Los ornamentos salen de los márgenes sin tapar contenido.
- Botones y modales son coherentes.
- Cuenta regresiva entra en 320 px.
- Galería y cronograma mantienen la composición.
- Footer corporativo presente.

### Funcionales de la referencia

- Loader desaparece incluso ante carga incompleta.
- Cuenta regresiva usa una fecha configurada.
- `.ics` se descarga desde datos configurados.
- Modales abren, cierran y gestionan foco.
- Lightbox funciona con mouse y teclado.
- Copiar regalos muestra resultado o fallback.
- RSVP permite probar validación y estados visuales sin enviar datos.
- Las secciones se activan o desactivan por configuración.
- El parallax no produce saltos de layout y queda estático con reduced motion o sin JavaScript.
- El contenido permanece visible si falla `IntersectionObserver`.
- No hay errores de JavaScript.

### Productivos

- Datos separados del diseño.
- Componentes compartidos.
- Enlaces e integraciones reales.
- RSVP persistente y seguro.
- QR seguro por invitado o grupo.
- Estados de carga, éxito, error y reintento.
- Metadatos y privacidad configurables.
- Pruebas automatizadas y visuales.
- Verona abre desde el catálogo dentro del modal estándar, embebida en la preview de celular.
- El selector de paletas existe sólo en el modal de demo y transmite el preset a la invitación.
- El modal enumera únicamente funcionalidades correspondientes a secciones activas.

---

## 21. No modificar

- Identidad visual de Verona.
- Composición general de la portada.
- Paleta cálida coral aprobada, salvo ajustes necesarios para conservar contraste.
- Tipografías base.
- Ubicación conceptual de ornamentos.
- Orden visual aprobado, salvo secciones deshabilitadas por configuración.
- Footer corporativo.
- Animaciones sutiles.

No duplicar el modelo por cliente, no crear CSS por evento, no fijar datos personales en componentes y no modificar otros modelos.

---

# Instrucciones para Codex

1. Usar `AI/Referencias/Verona/index.html` como referencia visual y funcional, no como código productivo para copiar sin refactorizar.
2. Integrar Verona en la arquitectura reutilizable existente sin modificar otros modelos.
3. Separar configuración, contenido, recursos, estilos y comportamiento.
4. Reutilizar footer, botones, modales, countdown, galería, ubicación, regalos, QR y RSVP cuando ya existan componentes compatibles.
5. Crear componentes nuevos únicamente cuando la arquitectura actual no cubra una necesidad aprobada de Verona.
6. Implementar todos los parámetros enumerados en la sección 15.
7. Implementar los presets `coral`, `botanica`, `blush`, `bordo-calida` y `verde-agua` mediante tokens semánticos; no crear CSS duplicado por preset.
8. Recibir `locale` y `palettePreset` desde la configuración general del sitio; no agregar selectores dentro de Verona.
9. Implementar los diccionarios completos de español, portugués e inglés, incluidos metadatos, labels, estados y nombres accesibles.
10. Formatear fecha y hora desde el dato ISO y el locale; no persistir textos de fecha como fuente de verdad.
11. Mantener componentes flexibles ante expansión de traducciones: sin alturas fijas, sin truncados y con botones multilínea.
12. No cargar recursos ni ejecutar lógica de funcionalidades no declaradas en la configuración de Verona.
13. Implementar las integraciones reales pendientes:
   - mapas;
   - calendarios según arquitectura;
   - carga de fotos;
   - enlaces sociales;
   - RSVP con backend y estados completos;
   - QR seguro;
   - datos de regalos y privacidad;
   - hoteles y links configurados.
14. Reemplazar los datos demo por datos del evento sin alterar la composición.
15. Optimizar imágenes y fuentes para producción.
16. Validar la matriz de 5 presets × 3 idiomas en 320 px, 390 × 844 px, 768 × 1024 px y 1440 × 900 px.
17. En cada combinación validar portada, botones, títulos largos, cronograma, modales y formularios.
18. Validar Chrome mobile, Safari iPhone, Chrome desktop y Safari desktop.
19. Ejecutar pruebas de teclado, foco, contraste, reduced motion, zoom y fallos de recursos.
20. Confirmar que no haya scroll horizontal, errores de consola ni contenido invisible por fallos de JavaScript.
21. Implementar el parallax con una capa interna transformable y fallback estático; no depender únicamente de `background-attachment: fixed`.
22. Integrar Verona al modal estándar de demo, sin navegación full screen directa desde la tarjeta.
23. Mantener el selector de paletas exclusivamente en el modal del sitio y derivar la lista de características de las secciones activas.
24. Entregar previews de los cinco presets, pruebas ejecutadas y documentación de cualquier decisión técnica que se aparte de este spec.

## Implementado en la referencia de Work

- Composición visual completa.
- Cinco presets cromáticos accesibles.
- Español, portugués e inglés mediante configuración externa.
- Recursos locales.
- Loader con salida de seguridad.
- Cuenta regresiva funcional.
- Descarga `.ics` de demostración.
- Activación de secciones mediante configuración local.
- Cronograma y galería generados desde datos.
- Modales accesibles y lightbox.
- Copiado con fallback.
- RSVP interactivo sin backend.
- Animaciones con fallback y reduced motion.
- Parallax real de referencia con capa interna transformable y fallback estático.
- Footer corporativo y metadatos demo.

## Pendiente para implementación productiva

- Integración con la arquitectura real.
- Integración de Verona en el modal estándar del catálogo y conexión de su selector externo de paletas.
- Generación de la lista de características desde las secciones activas.
- Fuentes de datos por cliente o evento.
- Backends y persistencia.
- Autenticación o identificación de invitados.
- QR seguro.
- Privacidad y protección de información sensible.
- Optimización final de assets.
- Pruebas automatizadas y visuales en navegadores reales.
