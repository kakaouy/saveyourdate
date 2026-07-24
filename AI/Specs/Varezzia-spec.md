# SPEC — Modelo Varezzia

## 1. Identificación

**Nombre interno:** Varezzia  
**Categoría:** Invitación digital para fiesta de 15 años  
**Estado:** Referencia visual y funcional lista para implementación productiva  
**Versión:** 1.0  
**Responsable de diseño:** Save Your Date  
**Referencia aprobada:** `temp-vite-app/public/varezzia/index.html`  
**Recursos aprobados:** `temp-vite-app/public/varezzia/images/`

Varezzia es un modelo de invitación para 15 años de estilo romántico, editorial y elegante.

Combina:

- fotografía protagonista;
- fondos claros y suaves;
- títulos con tipografía serif;
- nombre principal manuscrito;
- ornamentos florales;
- bloques de color intenso;
- cronograma vertical;
- movimiento sutil;
- experiencia mobile first.

La implementación productiva debe reconstruir la referencia dentro de la arquitectura reutilizable de Save Your Date.

El archivo HTML funciona como referencia visual y funcional. No debe copiarse como una invitación rígida ni mantenerse como la única implementación productiva.

---

## 2. Fuentes de verdad

Consultar en este orden:

1. `AI/Design System/Design_System.md`
2. `AI/Specs/Varezzia-spec.md`
3. `temp-vite-app/public/varezzia/index.html`
4. `temp-vite-app/public/varezzia/images/`
5. Arquitectura actual de los modelos ya integrados, especialmente Verona.

El Design System define las reglas generales.

Este documento define las decisiones particulares de Varezzia.

El HTML define la composición visual y las interacciones aprobadas.

La arquitectura existente define cómo deben organizarse componentes, configuración, previews, demos y pedidos.

En caso de contradicción:

- el Design System prevalece para reglas globales;
- este spec prevalece para decisiones particulares del modelo;
- el HTML aprobado prevalece para la apariencia visual;
- antes de alterar una decisión visual importante, Codex debe reportar la inconsistencia.

---

## 3. Decisiones definitivas

- Varezzia no incluye música de fondo.
- No debe cargar archivos de audio.
- No debe mostrar modal de ingreso con música.
- No debe mostrar botón flotante de reproducción.
- Sí incluye una sección para sugerir canciones.
- La sugerencia de canciones es una funcionalidad independiente del audio de fondo.
- El selector de paletas pertenece al modal de demo y al flujo de pedido.
- No debe existir selector de paletas dentro de la invitación.
- Desde el catálogo, Varezzia abre dentro del modal estándar de demo.
- No debe abrir directamente a pantalla completa desde la tarjeta.
- El botón “Creá tu invite” debe llevar al flujo de pedido existente con el modelo y la paleta seleccionados.
- La invitación debe soportar español, portugués e inglés desde la configuración externa.
- No se agregan nuevas secciones ni se modifica la identidad visual sin aprobación.

---

## 4. Objetivos de experiencia

Varezzia debe transmitir:

- romanticismo;
- elegancia;
- calidez;
- celebración;
- personalidad juvenil;
- delicadeza;
- experiencia premium;
- claridad y facilidad de uso.

La experiencia debe ser:

- mobile first;
- visualmente cuidada;
- simple de recorrer;
- interactiva;
- accesible;
- consistente con Save Your Date.

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
14. Sugerencia de canciones.
15. Pase QR.
16. Confirmación de asistencia.
17. Footer corporativo.
18. Modales correspondientes.

Cada sección, excepto el footer corporativo, debe poder activarse o desactivarse mediante configuración.

Los ornamentos ubicados entre secciones deben ocultarse o reubicarse cuando alguna de las secciones adyacentes esté desactivada.

No utilizar `nth-of-type` para determinar colores o tonos.

Cada sección debe declarar explícitamente su tono:

```ts
tone: "light" | "alternate" | "accent"
6. Sistema visual
6.1. Paletas aprobadas

Varezzia dispone únicamente de dos paletas.

No deben agregarse Coral, Botánica, Blush ni otros presets.

Preset bordo-calida

Es la paleta predeterminada.

--color-fondo: #fff9f6;
--color-fondo-alterno: #f3e4d9;
--color-titulos: #a72039;
--color-secundario: #fff1dc;
--color-acento: #d1475c;
--color-texto: #653b3b;
--color-botones: #a9364b;
--color-bordes: #8d5a54;
--color-ornamentos: #ffa287;
--color-texto-claro: #ffffff;
--color-foco: #8d0000;
--color-principal: var(--color-titulos);
Preset verde-agua
--color-fondo: #dadfd9;
--color-fondo-alterno: #c5d3d0;
--color-titulos: #69949b;
--color-secundario: #ebf3e9;
--color-acento: #79a7b0;
--color-texto: #2d5f67;
--color-botones: #285b64;
--color-bordes: #98babe;
--color-ornamentos: #bbccca;
--color-texto-claro: #ffffff;
--color-foco: #3d7078;
--color-principal: var(--color-titulos);
Contrato de tokens

La implementación debe usar:

--color-fondo
--color-fondo-alterno
--color-titulos
--color-secundario
--color-acento
--color-texto
--color-botones
--color-bordes
--color-ornamentos
--color-texto-claro
--color-foco

--color-principal puede mantenerse temporalmente como alias de --color-titulos, pero los componentes productivos deben usar el token semántico correspondiente.

No deben existir colores directos dentro de componentes, excepto:

sombras neutras;
overlays neutros;
colores técnicos necesarios para representar un QR;
casos expresamente documentados.

La paleta debe recibirse desde la configuración general:

theme: {
  palettePreset: "bordo-calida"
}

Valores permitidos:

"bordo-calida" | "verde-agua"
6.2. Tipografías
--font-title: "Baskervville", serif;
--font-body: "Montserrat", sans-serif;
--font-signature: "Beth Ellen", cursive;

Uso:

títulos de sección: var(--font-title);
cronograma: var(--font-title) para títulos;
nombre protagonista: var(--font-signature);
cuerpo, botones y formularios: var(--font-body);
footer: componentes compartidos definidos por el sistema.

No repetir nombres de fuentes dentro de componentes.

No cargar fuentes o pesos que no se utilicen.

6.3. Imágenes

Las fotografías deben conservar sus colores originales.

No aplicar:

filter
mix-blend-mode
background-blend-mode

para recolorear fotografías u ornamentos.

Se admite únicamente un overlay negro o neutro muy sutil cuando sea necesario para la legibilidad.

La portada debe permitir configurar:

imagen;
posición focal mobile;
posición focal desktop;
intensidad del overlay.

La imagen de portada no debe utilizar lazy loading.

Las imágenes no críticas deben usar lazy loading.

7. Recursos visuales

Los recursos finales deben quedar organizados dentro de:

temp-vite-app/public/varezzia/images/

Recursos visuales actualmente contemplados:

foto-01.png
foto-01.jpg
foto-02.jpg
foto-03.jpg
foto-04.jpg
foto-05.jpg
esq-sup-izq.png
esquina-superior-derecha.png
esquina-superior-izquierda.png
esquina-inferior-izquierda.png
separador_derecha.png
separador_izquierda.png
orna-derecha.png
ornamento_naranja_izq.png
fondo_papel.png

Antes de producción, Codex debe:

detectar recursos duplicados;
determinar cuáles utiliza realmente la referencia;
conservar una sola copia;
actualizar las rutas;
eliminar únicamente archivos confirmados como no utilizados.

No deben quedar rutas absolutas como:

/Users/cecilia.paciel/Documents/...

Todas las rutas deben ser válidas en:

desarrollo local;
build;
Vercel;
modal de demo;
preview embebida.
8. Responsive
Mobile first
Sin ancho mínimo forzado en body.
Sin scroll horizontal.
Portada con min-height: 100svh.
Contenido adaptado a 320 px.
Botones táctiles con altura mínima de 44 px; objetivo 48 px.
Nombre preparado para textos largos.
Cuenta regresiva completa dentro del ancho.
Cronograma legible sin cortes.
Modales con scroll interno.
Ornamentos contenidos dentro del documento embebido.
La invitación debe funcionar dentro del teléfono del modal.
No utilizar 100vw cuando implique tomar el ancho completo del navegador y no el contenedor de la preview.
Tablet
Mantener anchos máximos.
Evitar líneas de texto excesivamente largas.
Escalar ornamentos proporcionalmente.
Desktop
Mantener el contenido centrado.
La portada no debe crecer indefinidamente.
La galería debe conservar una composición equilibrada.
El parallax debe funcionar con movimiento real y controlado.

Viewports mínimos de prueba:

320 px;
390 × 844 px;
430 px;
768 × 1024 px;
1440 × 900 px.
9. Componentes y comportamiento
9.1. Loader
Ocupa la pantalla completa.
Muestra spinner y mensaje de carga.
Desaparece con transición suave.
Tiene salida de seguridad.
No puede bloquear indefinidamente la invitación.
Después del loader se abre directamente la invitación.
9.2. Portada

Incluye:

nombre;
fecha;
texto “Mis 15 años”.

Características:

fotografía protagonista;
ornamentos florales en esquinas;
contenido centrado;
nombre manuscrito;
fecha en mayúsculas;
título secundario;
buen contraste.

Los valores Martina, fecha e imagen son datos de demostración y deben parametrizarse.

9.3. Cuenta regresiva
Días, horas, minutos y segundos.
Fecha técnica única en ISO 8601.
Zona horaria configurable.
No muestra valores negativos.
Al finalizar muestra un mensaje configurable.
Debe caber correctamente en 320 px.
9.4. Cuándo y dónde

Debe incluir:

fecha;
hora;
lugar;
dirección;
botón de mapa;
botón de calendario.

El mapa debe recibir una URL desde configuración.

El calendario debe utilizar la integración compartida del proyecto.

9.5. Frase destacada
Texto configurable.
Tipografía editorial.
Ancho máximo.
Centrada.
Buena separación vertical.
9.6. Código de vestimenta
Resumen breve.
Modal de detalles.
Contenido configurable.
Puede admitir recomendaciones, colores reservados e imágenes.
9.7. Cronograma

Lista de longitud variable.

Cada actividad contiene:

{
  time: string;
  title: string;
  description?: string;
}

Debe conservar:

horario a la izquierda;
círculo central;
línea vertical;
título y descripción a la derecha.

La hora y el círculo deben alinearse visualmente con el título de cada actividad.

La línea debe conectar correctamente los círculos y no presentar cortes.

La última actividad no debe extender la línea vertical.

No asumir cuatro actividades obligatorias.

9.8. Fotografía parallax
Usa una ventana con overflow: hidden.
La imagen vive en una capa interna absoluta y sobredimensionada.
La capa se desplaza verticalmente mediante transform: translate3d.
La actualización utiliza requestAnimationFrame.
El cálculo se ejecuta únicamente cerca del viewport.
No usar solamente background-attachment: fixed.
No modificar la altura durante el scroll.
No revelar bordes vacíos.
No provocar saltos de layout.
En táctiles puede utilizarse fallback estático.
Con prefers-reduced-motion, la imagen queda estática.
El texto permanece en una capa independiente.
9.9. Galería y lightbox
Cantidad variable de imágenes.
Imágenes cuadradas con object-fit: cover.
Botones semánticos.
Alt descriptivos.
Lightbox navegable con teclado.
Cierre con botón, fondo y Escape.
Bloqueo de scroll.
Devolución del foco.
9.10. Alojamiento

Sección opcional.

Puede incluir:

nombre;
dirección;
distancia;
teléfono;
link de reserva;
código de descuento;
observaciones.
9.11. Mesa de regalos

Los datos sólo deben mostrarse dentro del modal.

Configurables:

banco;
titular;
moneda;
cuenta;
alias;
link;
etiqueta copiable;
valor copiable.

Debe manejar:

copiado exitoso;
error de clipboard;
alternativa manual.
9.12. Compartir fotografías
URL configurable.
Puede apuntar a Drive, Photos u otro proveedor.
Debe abrirse de forma segura.
Si no existe URL, la preview puede mostrar un mensaje de integración pendiente.
9.13. Instagram y redes
Hashtag configurable.
URL configurable.
Sección desactivable.
Los enlaces externos deben abrirse de forma segura.
9.14. Sugerencia de canciones

Funcionalidad activa de Varezzia.

No debe denominarse internamente spoty.

Nombre técnico recomendado:

songSuggestions

o:

playlist

Debe incluir:

título;
pregunta o texto breve;
botón;
modal o formulario.

Campos mínimos:

canción o link;
artista, cuando corresponda;
nombre del invitado, cuando corresponda.

Debe contemplar:

validación;
cargando;
éxito;
error;
reintento.

Debe conectarse con la integración real del proyecto.

No debe confundirse con música de fondo.

9.15. Pase QR
La preview puede mostrar un marcador visual.
Producción debe utilizar un QR seguro.
Debe generarse desde token, invitado, grupo o URL validable.
No utilizar identificadores personales fijos.
Reutilizar el sistema QR existente.
9.16. RSVP

Debe soportar:

nombre;
asiste;
no asiste;
restricción alimentaria;
opción “Otra”;
mensaje;
validación;
invitados individuales o grupos;
confirmación por persona;
fecha límite;
estados completos;
persistencia mediante backend.

No utilizar alert() como comportamiento productivo.

9.17. Footer

Footer corporativo obligatorio.

Debe incluir:

Save Your Date;
descripción institucional;
derechos reservados;
año automático.
10. Botones

Debe utilizarse el componente compartido.

Principal
fondo --color-botones;
borde --color-botones;
texto --color-texto-claro.
Outline sobre fondo claro
fondo transparente;
borde --color-botones;
texto --color-botones.
Outline sobre fondo de acento
fondo transparente;
borde blanco;
texto blanco;
hover blanco con texto de acento.

Todos los botones equivalentes deben compartir:

altura;
padding;
radio;
tipografía;
foco;
hover;
estados deshabilitados.

No corregir botones mediante estilos inline.

11. Modales

Todos los modales deben reutilizar el componente compartido.

Deben incluir:

overlay;
contenido centrado;
altura máxima;
scroll interno;
cierre con botón;
cierre con Escape;
cierre al tocar el fondo cuando corresponda;
bloqueo de scroll;
foco inicial;
focus trap;
devolución del foco;
role="dialog";
aria-modal="true";
título asociado;
reduced motion.
12. Animaciones

Animaciones aprobadas:

Elemento	Animación
Loader	Giro suave
Secciones	Fade up al ingresar al viewport
Parallax	Desplazamiento de capa fotográfica
Ornamentos	Movimiento flotante mínimo
Botones	Cambio de color y elevación
Modales	Fade y desplazamiento mínimo
Galería	Zoom mínimo

Reglas:

El contenido debe ser visible sin JavaScript.
La clase .js puede activar estados iniciales.
Si falla IntersectionObserver, todo queda visible.
Cada sección deja de observarse después de aparecer.
Respetar prefers-reduced-motion.
Las animaciones deben funcionar con el scroll interno de la preview del teléfono.
13. Accesibilidad
No bloquear zoom.
Contraste WCAG AA.
Jerarquía correcta de encabezados.
Alt descriptivos.
Ornamentos con alt="" y aria-hidden="true".
Foco visible.
Navegación por teclado.
Labels asociados.
Mensajes con aria-live.
Targets táctiles suficientes.
Modales accesibles.
Skip link.
Reduced motion.
14. Idiomas

Idiomas soportados:

"es" | "pt" | "en"

Locales recomendados:

es → es-UY;
pt → pt-BR;
en → en-US.

No debe existir selector de idioma dentro de Varezzia.

El idioma debe recibirse desde el sitio.

Todo texto de interfaz debe ser traducible:

loader;
títulos;
botones;
unidades del countdown;
cronograma;
modales;
formularios;
estados;
mensajes accesibles;
footer;
metadatos.

Los nombres propios, lugares, hashtags y datos bancarios son datos del evento, no traducciones.

Las fechas deben formatearse desde un valor ISO usando Intl.DateTimeFormat o la utilidad compartida.

15. Presentación en el catálogo

Agregar Varezzia al catálogo con:

ID estable: varezzia;
nombre: Varezzia;
categoría: 15 años;
imagen de preview;
dos paletas;
características activas;
ruta de preview;
datos del formulario de pedido.

Al seleccionar la tarjeta:

abrir modal estándar;
no navegar directamente;
no abrir full screen;
mantener la página de catálogo.
16. Modal de demo

El modal estándar debe mostrar:

nombre Varezzia;
categoría 15 años;
preview dentro del teléfono;
lista de características;
selector de paletas;
botón “Creá tu invite”;
botón “Ver más modelos”;
cierre.

La invitación debe quedar completamente contenida dentro de la máscara del teléfono.

Debe tener:

scroll interno;
overflow: hidden en la máscara;
sin scroll horizontal;
ancho basado en el contenedor;
animaciones activadas por el scroll interno.

El selector debe mostrar únicamente:

Bordó cálida;
Verde agua.

Bordó cálida debe estar seleccionada por defecto.

El selector no debe aparecer dentro de la invitación.

17. Características del modal

La lista debe derivarse de las secciones activas.

Puede incluir:

Cuenta regresiva.
Ubicación y mapa.
Agendar evento.
Código de vestimenta.
Cronograma.
Fotografía parallax.
Galería.
Alojamiento.
Mesa de regalos.
Compartir fotos.
Instagram y hashtag.
Sugerencia de canciones.
Pase QR.
Confirmación de asistencia.
Dos paletas.
Multiidioma.

No escribir la lista directamente dentro del modal.

18. Flujo de pedido

El botón “Creá tu invite” debe llevar al formulario existente.

Debe transferir:

{
  modelId: "varezzia",
  category: "quince",
  palettePreset: "bordo-calida" | "verde-agua",
  locale: "es" | "pt" | "en"
}

El formulario debe:

mostrar Varezzia como modelo seleccionado;
conservar la paleta elegida;
permitir cambiar la paleta cuando el flujo actual lo soporte;
enviar un identificador estable;
no depender únicamente del nombre visible.

Debe reutilizar el mismo patrón que Verona y los otros modelos.

19. Parametrización obligatoria
Evento
nombre;
tipo;
fecha y hora inicial;
fecha y hora final;
zona horaria;
lugar;
dirección;
mapa;
título de calendario.
Contenido
frase;
código de vestimenta;
cronograma;
hashtag;
textos;
fecha límite;
textos de modales.
Recursos
imagen hero;
posición focal;
overlay;
ornamentos;
imagen parallax;
galería;
alt.
Tema
preset;
fuentes;
tonos de secciones.
Funcionalidades
mapa;
calendario;
hoteles;
regalos;
carga de fotos;
Instagram;
sugerencia de canciones;
QR;
RSVP.
Secciones
activación;
orden cuando la arquitectura lo soporte;
tono;
comportamiento de ornamentos.
Metadatos
título;
descripción;
Open Graph;
imagen social;
theme color;
idioma;
privacidad;
indexación.
20. Configuración conceptual
const varezziaConfig = {
  model: "varezzia",
  locale: "es",
  palettePreset: "bordo-calida",

  event: {
    name: "",
    dateTime: "",
    endDateTime: "",
    timezone: "America/Montevideo",
    venue: "",
    address: "",
    mapsUrl: "",
    calendarTitle: ""
  },

  hero: {
    image: "",
    positionMobile: "center",
    positionDesktop: "center",
    overlayOpacity: 0.2,
    ornamentTop: "",
    ornamentBottom: ""
  },

  quote: "",

  dressCode: {
    summary: "",
    details: ""
  },

  schedule: [],

  parallax: {
    image: "",
    position: "center",
    title: ""
  },

  gallery: [],

  hotels: [],

  gifts: {},

  social: {
    hashtag: "",
    instagramUrl: ""
  },

  songSuggestions: {
    enabled: true,
    endpoint: "",
    title: "",
    description: ""
  },

  photoUpload: {
    url: ""
  },

  qrPass: {},

  rsvp: {
    enabled: true,
    deadline: "",
    endpoint: ""
  },

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
    songSuggestions: true,
    qrPass: true,
    rsvp: true
  }
};

La forma final debe adaptarse a la arquitectura existente.

Este ejemplo define responsabilidades, no una API obligatoria.

21. Estados de interfaz

Las integraciones deben contemplar:

inicial;
cargando;
éxito;
error;
reintento;
sin datos;
deshabilitado.

Aplica especialmente a:

RSVP;
sugerencia de canciones;
QR;
regalos;
carga de fotos;
calendario;
enlaces externos.
22. Rendimiento, SEO y privacidad
Rendimiento
Optimizar imágenes.
Evaluar WebP o AVIF.
Lazy loading para recursos no críticos.
Evitar librerías pesadas.
Reducir JS duplicado.
No cargar secciones desactivadas.
Cargar únicamente las fuentes necesarias.
SEO
Metadatos configurables.
Open Graph.
Imagen social.
Idioma.
No indexar invitaciones privadas.
Privacidad

Definir por evento:

acceso público o privado;
identificación por invitado o grupo;
protección de datos bancarios;
seguridad QR;
protección de RSVP;
conservación de datos.

No exponer información sensible innecesaria en el cliente.

23. Pruebas mínimas
Viewports
320 px.
390 × 844 px.
430 px.
768 × 1024 px.
1440 × 900 px.
Navegadores
Chrome mobile.
Safari iPhone.
Chrome desktop.
Safari desktop.
Casos
Dos paletas × tres idiomas.
Nombre largo.
Fecha vencida.
Cronograma con 2 y 8 actividades.
Galería con 1 y muchas imágenes.
Secciones desactivadas.
Sin hoteles.
Sin Instagram.
Sin QR.
Error de backend.
Sugerencia de canciones exitosa y con error.
RSVP con opción “Otra”.
Teclado.
Reduced motion.
Zoom 200 %.
Imágenes que no cargan.
JavaScript parcial.
Preview dentro del teléfono.
24. Criterios de aceptación
Visuales
Se reconoce claramente como Varezzia.
Mantiene las tipografías aprobadas.
Mantiene fotografía y ornamentos.
Solo existen Bordó cálida y Verde agua.
La fotografía conserva sus colores.
No hay scroll horizontal.
Cronograma alineado y con líneas continuas.
Parallax fluido.
Galería equilibrada.
Footer presente.
Funcionales
Loader desaparece.
Cuenta regresiva funciona.
Mapa y calendario usan configuración.
Modales funcionan.
Lightbox funciona.
Copiar regalos funciona.
Sugerencia de canciones funciona.
RSVP funciona.
Secciones pueden desactivarse.
No hay errores en consola.
Integración
Varezzia aparece en el catálogo.
Abre el modal estándar.
Preview contenida en el teléfono.
Selector externo con dos paletas.
Bordó cálida predeterminada.
“Creá tu invite” transfiere modelo y paleta.
El formulario de pedido reconoce Varezzia.
No altera otros modelos.
25. No modificar
Identidad visual.
Composición de portada.
Tipografías.
Dos paletas aprobadas.
Orden general de secciones.
Ornamentos.
Cronograma.
Animaciones sutiles.
Footer corporativo.

No:

duplicar Varezzia por cliente;
crear un CSS por evento;
fijar datos personales;
agregar música de fondo;
agregar selector interno;
modificar otros modelos innecesariamente;
hacer merge o deploy sin aprobación.
Instrucciones para Codex
Leer Design System, este spec y la referencia.
Inspeccionar Verona y los modelos existentes.
No crear una arquitectura paralela.
Modularizar Varezzia.
Separar datos, recursos, estilos y comportamiento.
Reutilizar componentes compartidos.
Parametrizar todo lo indicado.
Implementar únicamente bordo-calida y verde-agua.
Mantener el selector exclusivamente en el modal.
Integrar Varezzia al catálogo.
Integrar el modal estándar.
Integrar “Creá tu invite”.
Transferir modelo, paleta e idioma al pedido.
Implementar sugerencia de canciones.
Integrar RSVP, QR, regalos, mapa y calendario.
Corregir rutas absolutas.
Eliminar recursos duplicados sólo después de verificar su uso.
Mantener el parallax aprobado.
Mantener las animaciones dentro de la preview.
Ejecutar build, lint y git diff --check.
Validar que los demás modelos sigan funcionando.
No hacer merge ni deploy.
Implementado en la referencia
Composición visual.
Dos paletas.
Tres idiomas.
Loader.
Cuenta regresiva.
Cronograma generado desde datos.
Parallax.
Galería.
Modales.
RSVP de demostración.
Sugerencia de canciones de referencia.
Animaciones.
Footer.
Responsive base.
Pendiente para producción
Modularización.
Integración con React y arquitectura real.
Catálogo.
Modal estándar.
Selector externo.
Flujo de pedido.
Backends.
RSVP persistente.
Sugerencias de canciones persistentes.
QR seguro.
Optimización de recursos.
Pruebas automatizadas y visuales.