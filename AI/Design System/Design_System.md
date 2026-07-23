# Design System – Save Your Date

**Versión:** 1.0 (Documento vivo)
**Estado:** En construcción

---

# Objetivo

Este documento define las reglas de diseño, experiencia de usuario, arquitectura visual y criterios de implementación utilizados en todas las invitaciones digitales de Save Your Date.

Su propósito es mantener coherencia entre modelos, facilitar la reutilización de componentes y reducir el retrabajo.

Este documento es la fuente de verdad para el diseño de las invitaciones.

---

# Filosofía de diseño

Las invitaciones de Save Your Date deben transmitir una experiencia premium desde el primer segundo.

Cada modelo debe tener personalidad propia, pero todos deben compartir los mismos principios.

## Principios

* Mobile First.
* Elegancia antes que complejidad.
* La fotografía es la protagonista.
* El contenido debe ser fácil de leer.
* El usuario nunca debe sentirse perdido.
* Las animaciones acompañan, nunca distraen.
* La experiencia debe sentirse fluida.
* Menos elementos, mejor jerarquía.
* Cada detalle debe tener un propósito.
* Priorizar reutilización sobre soluciones específicas.

---

# Identidad de Save Your Date

Todas las invitaciones deben respetar la identidad de la marca.

## Reglas generales

* Utilizar siempre el footer corporativo.
* Mantener la identidad visual de Save Your Date.
* Conservar una experiencia consistente entre modelos.
* Las diferencias entre modelos deben surgir del concepto visual, no del funcionamiento.

---

# Arquitectura de una invitación

## Componentes obligatorios

* Portada (Hero)
* Cuenta regresiva
* Información principal
* Ubicación
* Confirmación de asistencia
* Footer corporativo

## Componentes opcionales

* Galería
* Playlist
* Dress Code
* Regalos
* Agenda
* Mensajes
* Hoteles
* Transporte
* Preguntas frecuentes
* Historia de la pareja
* Cronograma
* Videos
* QR

Cada modelo podrá incorporar nuevos componentes siempre que sean reutilizables.

---

# Sistema visual

## Jerarquía

La información más importante debe destacarse claramente.

Cada pantalla debe responder rápidamente:

* ¿Quién?
* ¿Qué?
* ¿Cuándo?
* ¿Dónde?

## Fotografía

La fotografía principal debe ser el elemento dominante de la portada.

Los elementos decorativos deben acompañarla sin competir visualmente.

## Ornamentos

Los ornamentos deben:

* reforzar el concepto;
* generar profundidad;
* acompañar el recorrido;
* nunca dificultar la lectura.

---

# Tipografía

Las tipografías deben:

* mantener excelente legibilidad;
* adaptarse correctamente a móvil;
* escalar mediante `clamp()` cuando corresponda;
* respetar una jerarquía consistente.

---

# Colores

Cada modelo puede definir su propia paleta.

La paleta debe contemplar:

* color principal;
* color secundario;
* color de acento;
* color para fondos;
* color para botones;
* color para textos;
* color para iconografía.

Siempre debe verificarse el contraste.

---

# Animaciones

Las animaciones forman parte de la identidad del producto.

## Principios

* Sutiles.
* Elegantes.
* Fluidas.
* Consistentes.
* No invasivas.

## Tipos recomendados

* Fade
* Fade Up
* Fade Left
* Fade Right
* Zoom suave
* Blur Reveal
* Draw SVG
* Pulse leve
* Float suave
* Parallax ligero

## Reglas

* Las animaciones deben mejorar la experiencia.
* No deben impedir la lectura.
* Deben respetar `prefers-reduced-motion`.
* Evitar repeticiones innecesarias.
* Mantener tiempos coherentes entre secciones.

---

# Responsive

Todas las invitaciones se diseñan Mobile First.

## Reglas generales

* Sin scroll horizontal.
* Nombres preparados para textos largos.
* Uso de `clamp()` cuando corresponda.
* Uso de `aspect-ratio`.
* Uso de `object-fit`.
* Uso de `object-position`.
* Márgenes seguros.
* Botones fácilmente presionables.
* Modales completamente utilizables en móvil.

---

# Componentes reutilizables

Siempre que sea posible reutilizar:

* Footer
* Botones
* Modales
* Countdown
* Confirmación
* Agenda
* Galería
* Playlist
* Regalos
* Ubicación
* Selector de idioma
* Selector de paleta

Los componentes deben poder evolucionar sin afectar los modelos existentes.

---

# Parametrización

Cada modelo debe permitir configurar, cuando corresponda:

* nombres;
* fecha;
* horarios;
* ubicación;
* fotografías;
* textos;
* colores;
* tipografías;
* iconografía;
* música;
* idiomas;
* fondos;
* enlaces;
* componentes opcionales.

---

# Accesibilidad

Siempre considerar:

* contraste adecuado;
* tamaños de texto legibles;
* navegación clara;
* animaciones reducidas cuando el usuario lo solicite;
* botones accesibles.

---

# Implementación

Antes de implementar un modelo nuevo debe existir una definición clara de:

* concepto visual;
* arquitectura;
* componentes;
* responsive;
* animaciones;
* parametrización.

Los cambios deben ser incrementales.

No deben romper funcionalidades previamente aprobadas.

---

# Checklist de calidad

Antes de aprobar una invitación verificar:

## Diseño

* Composición.
* Espaciado.
* Tipografía.
* Colores.
* Ornamentos.

## Responsive

* Mobile.
* Tablet.
* Desktop.

## Funcionalidad

* Botones.
* Modales.
* Formularios.
* Confirmación.
* Agenda.
* Mapa.

## Animaciones

* Funcionan correctamente.
* No generan distracciones.
* Son consistentes.

## Accesibilidad

* Contraste.
* Tamaños.
* Navegación.
* Reduced Motion.

---

# Evolución del Design System

Este documento es evolutivo.

Cada vez que una solución demuestre ser útil para más de un modelo, deberá incorporarse aquí.

No agregar reglas específicas de una invitación. Esas pertenecen a la especificación del modelo correspondiente.

Este documento debe contener únicamente reglas generales aplicables a todo Save Your Date.
