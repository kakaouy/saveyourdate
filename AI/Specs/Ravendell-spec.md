SPEC — Modelo Rivendell

1. Identificación

Nombre interno: RivendellCategoría: Invitación digital para fiesta de 15 añosEstado: Referencia visual y funcional lista para implementación productivaVersión: 1.0Responsable de diseño: Save Your DateReferencia aprobada: temp-vite-app/public/rivendell/index.htmlRecursos aprobados: temp-vite-app/public/rivendell/images/ y temp-vite-app/public/rivendell/font/

Rivendell es un modelo romántico, etéreo, botánico y delicado. Combina fotografía protagonista, nombre manuscrito, ornamentos florales, bloques de color, destellos, pétalos, navegación animada desde la portada, cronograma vertical, galería y fotografía parallax.

La implementación productiva debe reconstruir la referencia dentro de la arquitectura reutilizable de Save Your Date. El HTML es referencia visual y funcional; no debe quedar como una tarjeta rígida ni duplicarse por cliente.

2. Fuentes de verdad

Consultar en este orden:

AI/Design System/Design_System.md

AI/Specs/Rivendell-spec.md

temp-vite-app/public/rivendell/index.html

temp-vite-app/public/rivendell/images/

temp-vite-app/public/rivendell/font/

Arquitectura actual de modelos, catálogo, demo y pedidos.

En caso de contradicción:

el Design System prevalece para reglas globales;

este spec prevalece para decisiones particulares;

el HTML aprobado prevalece para composición y apariencia;

antes de alterar una decisión importante, Codex debe reportar la inconsistencia.

3. Decisiones definitivas

No incluye música de fondo.

No carga archivos de audio.

No muestra modal de ingreso con música.

No muestra botón flotante de reproducción.

Sí incluye sugerencia de canciones.

El selector de paletas vive únicamente en el modal de demo y en el flujo de pedido.

No debe existir selector de paletas dentro de la invitación.

Desde el catálogo abre dentro del modal estándar.

“Creá tu invite” transfiere modelo, paleta e idioma.

Soporta español, portugués e inglés desde configuración externa.

La fuente Handflair.ttf forma parte del modelo.

Los destellos, pétalos y el botón inferior son parte de la identidad de portada.

No agregar secciones ni modificar la identidad visual sin aprobación.

No modificar otros modelos innecesariamente.

4. Objetivos de experiencia

Debe transmitir:

romanticismo;

delicadeza;

naturaleza;

frescura;

elegancia;

personalidad juvenil;

experiencia premium;

claridad.

Debe ser:

mobile first;

accesible;

fluida;

simple de recorrer;

consistente con Save Your Date;

funcional dentro de la preview del teléfono.

5. Orden de secciones

Loader.

Portada.

Cuenta regresiva.

Cuándo y dónde.

Frase destacada.

Código de vestimenta.

Cronograma.

Fotografía parallax.

Galería.

Alojamiento.

Mesa de regalos.

Compartir fotografías.

Instagram y redes.

Sugerencia de canciones.

Pase QR.

Confirmación de asistencia.

Footer corporativo.

Modales.

Cada sección, excepto el footer, debe poder activarse o desactivarse.

Los ornamentos entre secciones deben ocultarse o reubicarse cuando una sección adyacente esté desactivada.

No usar nth-of-type para asignar colores. Cada sección debe declarar su tono:

tone: "light" | "alternate" | "accent" | "accentDark"

light: fondo principal.

alternate: fondo alternativo.

accent: acento claro o medio.

accentDark: acento oscuro, especialmente para Alojamiento, Instagram y footer.

6. Sistema de colores

6.1. Tokens obligatorios

--color-fondo
--color-fondo-alterno
--color-titulos
--color-secundario
--color-acento
--color-acento-oscuro
--color-texto
--color-botones
--color-bordes
--color-ornamentos
--color-texto-claro
--color-foco

--color-principal puede mantenerse como alias temporal de --color-titulos.

No deben existir colores directos en componentes, salvo sombras neutras, overlays neutros, QR, destellos blancos y pétalos translúcidos.

Alojamiento, Instagram y footer deben usar:

background-color: var(--color-acento-oscuro);

No volver a fijar esos fondos con un hexadecimal.

6.2. Paletas aprobadas

Valores permitidos:

"rosa" | "verde-agua" | "verde-hojas"

Rosa — predeterminada

--color-fondo: #fff8fa;
--color-fondo-alterno: #ead1d9;
--color-titulos: #b9798f;
--color-secundario: #f8e7ed;
--color-acento: #d9a9b8;
--color-acento-oscuro: #9f6478;
--color-texto: #76535f;
--color-botones: #b98395;
--color-bordes: #e8c8d2;
--color-ornamentos: #c88da2;
--color-texto-claro: #ffffff;
--color-foco: #a96d82;

Debe verse rosa empolvada, sin verde azulado. Los botones también deben ser rosa empolvado.

Verde agua

--color-fondo: #ffffff;
--color-fondo-alterno: #53d0c4;
--color-titulos: #a2d1cc;
--color-secundario: #ffffff;
--color-acento: #7cd0c8;
--color-acento-oscuro: #05838e;
--color-texto: #2d5f67;
--color-botones: #05838e;
--color-bordes: #ffffff;
--color-ornamentos: #14ab9c;
--color-texto-claro: #ffffff;
--color-foco: #05838e;

Debe respetar claramente el verde claro y el verde oscuro en las distintas secciones.

Verde hojas

Inspirada en los verdes azulados de las hojas del PNG de referencia.

--color-fondo: #f7fbfa;
--color-fondo-alterno: #a9d5ce;
--color-titulos: #4d8790;
--color-secundario: #ffffff;
--color-acento: #72b8b1;
--color-acento-oscuro: #315f68;
--color-texto: #365c63;
--color-botones: #4f8f91;
--color-bordes: #c8e3df;
--color-ornamentos: #487783;
--color-texto-claro: #ffffff;
--color-foco: #315f68;

Debe diferenciarse visualmente de Verde agua: más apagada, botánica y azulada.

La paleta se recibe desde configuración:

theme: {
  palettePreset: "rosa"
}

7. Tipografías

--font-title: "Baskervville", serif;
--font-body: "Montserrat", sans-serif;
--font-signature: "Handflair", cursive;

Uso:

nombre protagonista: Handflair;

títulos: Baskervville;

cuerpo, botones y formularios: Montserrat;

cronograma: Baskervville para títulos.

Declaración local obligatoria:

@font-face {
  font-family: "Handflair";
  src: url("font/Handflair.ttf") format("truetype");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

Reglas:

la fuente debe quedar versionada en el repositorio;

debe funcionar en local, build, Vercel y preview embebida;

no reemplazarla por una fuente externa;

no cargar pesos inexistentes;

no repetir nombres de fuentes dentro de componentes.

8. Recursos

Estructura esperada:

temp-vite-app/public/rivendell/
├── index.html
├── font/
│   └── Handflair.ttf
└── images/
    ├── foto-01.png
    ├── foto-01.jpg
    ├── foto-05.jpg
    ├── esq-sup-izq.png
    ├── separador_derecha.png
    ├── separador_izquierda.png
    └── navegar.png

Recursos utilizados por la referencia:

font/Handflair.ttf;

images/foto-01.png;

images/foto-01.jpg;

images/foto-05.jpg;

images/esq-sup-izq.png;

images/separador_derecha.png;

images/separador_izquierda.png;

images/navegar.png.

Codex debe verificar duplicados antes de eliminar archivos. No dejar rutas absolutas.

9. Responsive

Mobile

min-height: 100svh en portada.

Sin scroll horizontal.

Compatible con 320 px.

Nombre preparado para nombres largos.

Cuenta regresiva completa dentro del ancho.

Botones de 44 px como mínimo; objetivo 48 px.

Modales con scroll interno.

Ornamentos y partículas contenidos.

Botón inferior respetando safe-area-inset-bottom.

No usar 100vw cuando tome el ancho del navegador en vez del contenedor de preview.

Tablet y desktop

Mantener anchos máximos.

Contenido centrado.

Escalar ornamentos proporcionalmente.

Galería equilibrada.

Parallax controlado.

Efectos de portada sutiles.

Viewports mínimos:

320 px;

390 × 844 px;

430 px;

768 × 1024 px;

1440 × 900 px.

10. Portada

Incluye:

fotografía protagonista;

nombre;

fecha;

“Mis 15 Años”;

ornamento superior izquierdo;

ornamento inferior derecho espejado;

cinco destellos de referencia;

cuatro pétalos de referencia;

botón inferior de navegación.

Los valores Milena, fecha, imágenes y textos son de demostración y deben parametrizarse.

Capas:

fotografía;

ornamentos;

partículas;

contenido;

botón de navegación.

Los efectos no deben bloquear interacción.

11. Botón de navegación

Debe:

quedar centrado abajo;

usar images/navegar.png;

mostrar el icono en blanco;

tener área táctil de 44 × 44 px;

mostrar un círculo visual de aproximadamente 30 px;

usar negro con 15 % de opacidad;

latir suavemente;

desplazar a la primera sección activa posterior a la portada;

respetar reduced motion.

Si Cuenta regresiva está desactivada, debe llevar a la siguiente sección activa. No debe quedar apuntando a una sección inexistente.

12. Destellos y pétalos

Destellos

blancos;

pequeños;

intermitentes;

con resplandor suave;

sin parpadeo agresivo;

distribuidos en la portada;

no cubrir de forma permanente el rostro ni los textos.

Pétalos

translúcidos;

blancos o rosados muy suaves;

tamaños variables;

caída lenta;

deriva horizontal;

rotación gradual;

sin acumulación;

sin interacción.

Con prefers-reduced-motion, todo el contenedor de partículas debe ocultarse.

No incorporar librerías pesadas ni crear partículas ilimitadas por JavaScript.

13. Componentes funcionales

Loader

pantalla completa;

spinner;

mensaje;

transición de salida;

salida de seguridad.

Cuenta regresiva

días, horas, minutos y segundos;

fecha ISO única;

zona horaria configurable;

sin valores negativos;

mensaje final configurable.

Cuándo y dónde

fecha;

hora;

lugar;

dirección;

mapa;

calendario.

Frase

configurable;

centrada;

ancho máximo;

tipografía editorial.

Código de vestimenta

resumen;

modal;

contenido configurable.

Cronograma

Lista variable:

{
  time: string;
  title: string;
  description?: string;
}

Debe conservar horario, círculo, línea, título y descripción. La última actividad no prolonga la línea.

Parallax

capa interna absoluta;

overflow: hidden;

movimiento mediante translate3d;

actualización con requestAnimationFrame;

fallback estático en táctiles;

estático con reduced motion;

sin saltos ni bordes vacíos.

Galería y lightbox

cantidad variable;

imágenes con object-fit: cover;

alt descriptivos;

cierre con botón, fondo y Escape;

bloqueo y devolución de foco.

Alojamiento

opcional;

usa accentDark;

admite nombre, dirección, distancia, teléfono, reserva, descuento y observaciones.

Regalos

datos sólo dentro del modal;

banco, titular, moneda, cuenta, alias y link configurables;

copiado exitoso, error y alternativa manual.

Compartir fotos

URL configurable;

apertura segura;

mensaje de integración pendiente en preview cuando no exista URL.

Instagram

usa accentDark;

hashtag y URL configurables;

desactivable.

Sugerencia de canciones

No usar internamente el nombre spoty. Nombre técnico recomendado:

songSuggestions

Debe contemplar validación, carga, éxito, error y reintento.

Pase QR

marcador en preview;

QR seguro en producción;

reutilizar sistema existente;

no usar datos personales fijos.

RSVP

Debe soportar nombre, asistencia, no asistencia, restricción alimentaria, “Otra”, mensaje, grupos, fecha límite, validación y persistencia.

Footer

obligatorio;

usa accentDark;

Save Your Date;

descripción;

derechos;

año automático.

14. Botones y modales

Botones

Principal:

background: var(--color-botones);
border-color: var(--color-botones);
color: var(--color-texto-claro);

Outline en fondo claro:

background: transparent;
border-color: var(--color-botones);
color: var(--color-botones);

Outline en acento:

borde y texto blancos;

hover blanco con texto del acento.

No usar estilos inline para corregir botones.

Modales

Reutilizar componente compartido con:

overlay;

altura máxima;

scroll interno;

cierre por botón;

Escape;

focus trap;

devolución de foco;

bloqueo de scroll;

role="dialog";

aria-modal="true";

título asociado;

reduced motion.

15. Animaciones aprobadas

Elemento

Animación

Loader

Giro suave

Secciones

Fade up

Destellos

Aparición intermitente

Pétalos

Caída lenta

Botón inferior

Pulso

Ornamentos de portada

Latido muy lento

Separadores

Movimiento mínimo

Parallax

Desplazamiento interno

Botones

Elevación y color

Modales

Fade y desplazamiento

Galería

Zoom mínimo

El contenido debe seguir visible si JavaScript falla. Respetar prefers-reduced-motion.

16. Accesibilidad

No bloquear zoom.

Contraste WCAG AA.

Foco visible.

Navegación por teclado.

Targets táctiles suficientes.

Skip link.

Labels asociados.

aria-live para estados.

Ornamentos y partículas con aria-hidden="true".

Botón de navegación con etiqueta accesible.

Modales accesibles.

Reduced motion.

17. Idiomas

Soporta:

"es" | "pt" | "en"

Locales:

es-UY;

pt-BR;

en-US.

No debe existir selector de idioma interno. Todo texto de interfaz debe ser traducible. Nombres propios, lugares, hashtags y datos bancarios son datos del evento.

18. Catálogo y modal de demo

Registro del modelo:

{
  id: "rivendell",
  name: "Rivendell",
  category: "quince",
  previewPath: "/rivendell/index.html",
  palettes: ["rosa", "verde-agua", "verde-hojas"]
}

El modal debe mostrar:

nombre;

categoría;

preview en teléfono;

características;

selector de tres paletas;

“Creá tu invite”;

“Ver más modelos”;

cierre.

Rosa es la paleta predeterminada.

La invitación debe tener scroll interno y quedar contenida dentro de la máscara.

19. Flujo de pedido

Debe transferir:

{
  modelId: "rivendell",
  category: "quince",
  palettePreset: "rosa" | "verde-agua" | "verde-hojas",
  locale: "es" | "pt" | "en"
}

El formulario debe conservar el modelo y la paleta seleccionados y usar un ID estable.

20. Parametrización obligatoria

Evento

nombre;

fecha y hora;

fin;

zona horaria;

lugar;

dirección;

mapa;

calendario.

Contenido

frase;

vestimenta;

cronograma;

hashtag;

fecha límite;

textos y modales.

Recursos

hero;

posición focal;

overlay;

ornamentos;

icono de navegación;

parallax;

galería;

alt;

fuente local.

Tema

paleta;

fuentes;

tonos;

acento oscuro.

Funcionalidades

mapa;

calendario;

hoteles;

regalos;

fotos;

Instagram;

canciones;

QR;

RSVP;

navegación de portada.

Secciones

activación;

orden;

tono;

ornamentos;

siguiente sección activa.

Metadatos

título;

descripción;

Open Graph;

imagen social;

theme color;

idioma;

privacidad;

indexación.

21. Configuración conceptual

const rivendellConfig = {
  model: "rivendell",
  locale: "es",
  palettePreset: "rosa",

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
    ornamentBottom: "",
    navigationIcon: "images/navegar.png",
    navigationTarget: "next-active-section",
    particles: {
      enabled: true,
      sparks: true,
      petals: true
    }
  },

  quote: "",
  dressCode: { summary: "", details: "" },
  schedule: [],
  parallax: { image: "", position: "center", title: "" },
  gallery: [],
  hotels: [],
  gifts: {},
  social: { hashtag: "", instagramUrl: "" },
  songSuggestions: { enabled: true, endpoint: "", title: "", description: "" },
  photoUpload: { url: "" },
  qrPass: {},
  rsvp: { enabled: true, deadline: "", endpoint: "" },

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

La API final debe adaptarse a la arquitectura existente.

22. Rendimiento, privacidad y SEO

Rendimiento

optimizar imágenes;

evaluar WebP o AVIF;

lazy loading para imágenes no críticas;

cargar sólo las fuentes necesarias;

no cargar secciones desactivadas;

partículas con CSS o solución liviana;

evitar JavaScript duplicado.

SEO

metadatos configurables;

Open Graph;

imagen social;

idioma;

noindex para invitaciones privadas.

Privacidad

proteger datos bancarios;

proteger RSVP;

QR seguro;

identificación por invitado o grupo;

no exponer información sensible innecesaria.

23. Pruebas mínimas

tres paletas × tres idiomas;

320 px, 390 × 844 px, 430 px, 768 × 1024 px y 1440 × 900 px;

Chrome mobile;

Safari iPhone;

Chrome y Safari desktop;

nombre largo;

fecha vencida;

cronograma de 2 y 8 actividades;

galería de 1 y muchas imágenes;

secciones desactivadas;

countdown desactivado;

sin hoteles;

sin Instagram;

sin QR;

errores de backend;

RSVP con “Otra”;

teclado;

zoom 200 %;

reduced motion;

fuente que no carga;

imágenes que no cargan;

JavaScript parcial;

preview dentro del teléfono;

partículas sin overflow;

acento oscuro correcto en las tres paletas;

ausencia de colores fijos remanentes.

24. Criterios de aceptación

Visuales

Se reconoce como Rivendell.

Handflair se usa en el nombre.

Sólo existen Rosa, Verde agua y Verde hojas.

La fotografía conserva sus colores.

No hay scroll horizontal.

Destellos y pétalos son delicados.

El botón inferior está centrado y late.

Alojamiento, Instagram y footer usan el acento oscuro de cada paleta.

Cronograma, parallax, galería y footer mantienen la referencia.

Funcionales

Loader desaparece.

Countdown funciona.

Botón inferior lleva a la siguiente sección activa.

Mapa y calendario usan configuración.

Modales y lightbox funcionan.

Regalos, canciones y RSVP contemplan estados completos.

Reduced motion desactiva movimiento no esencial.

No hay errores en consola.

Integración

Aparece en catálogo.

Abre el modal estándar.

Preview contenida en teléfono.

Selector externo con tres paletas.

Rosa seleccionada por defecto.

Pedido recibe modelo, paleta e idioma.

Handflair se incluye en build y deploy.

No altera otros modelos.

25. No modificar

identidad visual;

composición de portada;

Handflair;

tres paletas;

relación de acento claro y oscuro;

ornamentos;

destellos y pétalos;

botón de navegación;

orden general;

cronograma;

animaciones sutiles;

footer.

No:

duplicar el modelo por cliente;

crear CSS por evento;

fijar datos personales;

agregar música;

agregar selector interno;

reemplazar Handflair;

volver a colores fijos;

modificar otros modelos;

hacer merge o deploy sin aprobación.

26. Instrucciones para Codex

Leer Design System, spec y HTML.

Inspeccionar la arquitectura existente.

No crear una arquitectura paralela.

Modularizar Rivendell.

Separar datos, recursos, estilos y comportamiento.

Reutilizar componentes compartidos.

Parametrizar todos los colores.

Implementar únicamente las tres paletas aprobadas.

Incorporar --color-acento-oscuro.

Usarlo en Alojamiento, Instagram y footer.

Mantener selector sólo en el modal.

Integrar catálogo, demo y pedido.

Mantener Handflair local.

Verificar que la fuente se publique.

Mantener navegación inferior y resolver la siguiente sección activa.

Mantener pétalos y destellos con reduced motion.

Integrar RSVP, QR, regalos, mapa, calendario y canciones.

Verificar rutas y recursos.

Ejecutar build, lint y git diff --check.

Validar los demás modelos.

No hacer merge ni deploy.

27. Estado

Implementado en la referencia

composición visual;

tres paletas;

acento oscuro parametrizado;

tres idiomas;

Handflair local;

loader;

portada;

destellos;

pétalos;

navegación inferior;

countdown;

cronograma;

parallax;

galería;

modales;

RSVP de demostración;

sugerencia de canciones de referencia;

animaciones;

footer;

responsive base.

Pendiente para producción

modularización;

integración con React;

catálogo;

modal estándar;

selector externo;

flujo de pedido;

backends;

RSVP persistente;

canciones persistentes;

QR seguro;

siguiente sección activa dinámica;

optimización;

pruebas automatizadas y visuales.