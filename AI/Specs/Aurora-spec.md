# SPEC — Modelo Aurora

## 1. Identificación

**Nombre interno:** Aurora
**Categoría:** Invitación digital para fiesta de 15 años
**Estado:** Implementado
**Versión:** 1.0
**Referencia:** `temp-vite-app/public/aurora/index.html`

Aurora es un modelo editorial, luminoso y ceremonial. Su identidad combina una portada fotográfica de alto impacto, marco ornamental simétrico, partículas doradas, nombre caligráfico protagonista y una tarjeta de fecha de composición clásica.

La implementación productiva debe reconstruir la referencia como un componente React reutilizable. El HTML de referencia define la composición y el comportamiento visual; no debe incorporarse como `iframe` ni conservar datos rígidos del evento.

---

## 2. Fuentes de verdad

Consultar en este orden:

1. `AI/Design System/Design_System.md`
2. `AI/Specs/Aurora-spec.md`
3. `temp-vite-app/public/aurora/index.html`
4. `temp-vite-app/public/aurora/images/`
5. `temp-vite-app/public/aurora/font/`
6. Componentes productivos Verona, Varezzia y Rivendell.

---

## 3. Concepto y experiencia

Aurora debe transmitir elegancia juvenil, brillo cálido, expectativa y una celebración premium. La fotografía continúa siendo protagonista, mientras los ornamentos enmarcan la experiencia sin competir con el contenido.

### Aprobado

- Portada a pantalla completa con fotografía, ornamentos superior e inferior y partículas sutiles.
- Jerarquía de portada: “Mis quince”, nombre, fecha desglosada y horario.
- Alternancia explícita de secciones claras y de acento.
- Idiomas español, portugués e inglés.
- Cuatro paletas: `rosa-champagne`, `verde-dorado`, `azul-plata` y `lavanda-dorado`.
- Selector de paleta e idioma en el modal general del catálogo, nunca dentro de la invitación.
- Footer corporativo compartido de Save Your Date.

### No modificar

- La composición editorial y simétrica del hero.
- El nombre caligráfico como foco principal.
- La tarjeta de fecha con día de semana, mes, día, año y hora.
- El carácter sutil de partículas y ornamentos.
- El orden aprobado de secciones sin una nueva validación de diseño.

---

## 4. Sistema visual

### 4.1 Tipografías

- **Nombre/firma protagonista:** `Magenta Diamond` con fallback cursivo.
- **Títulos editoriales y fecha:** `LinBiolinum_aS` con fallback serif.
- **Cuerpo, botones, formularios y datos:** `Scaver-Medium` con fallback sans-serif.
- Las fuentes se cargan localmente desde `/aurora/font/` y se declaran una sola vez.
- Escalas fluidas con `clamp()` y protección para nombres largos en los tres idiomas.
- No sustituir las fuentes sin aprobación visual.

### 4.2 Paletas

Tokens semánticos obligatorios:

```css
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
```

Presets aprobados:

| Preset | Fondo | Títulos | Acento | Botón | Ornamentos |
|---|---|---|---|---|---|
| `verde-dorado` (default) | `#f7f7f1` | `#2f5d50` | `#b9964a` | `#b08a3c` | `#c6a85b` |
| `rosa-champagne` | `#fff9f8` | `#9e6670` | `#c99a86` | `#b77c6f` | `#d2a98d` |
| `azul-plata` | `#f7f9fc` | `#334f6b` | `#8fa3b8` | `#587691` | `#9aaabd` |
| `lavanda-dorado` | `#fbf9fd` | `#765d88` | `#b59ac8` | `#9a78ad` | `#c6a56b` |

Todos los estados interactivos deben mantener contraste WCAG AA. Ningún componente debe fijar colores de marca fuera del contrato de tokens, salvo overlays y sombras derivados.

### 4.3 Fotografía, fondos y ornamentos

- Hero: `/aurora/images/foto-01.jpg`, sin lazy loading.
- Fondo de papel: `/aurora/images/fondo_papel.png`, aplicado con opacidad controlada.
- Ornamentos: `ornament_top.png`, `ornament_bottom.png`, `ornament_left.png`, `ornament_right.png`.
- Indicador de scroll: `navegar.png`.
- Fotografías configurables mediante `assets`, incluyendo `object-position`/punto focal por breakpoint y overlay.
- Ornamentos decorativos con `alt=""`, `aria-hidden="true"`, `pointer-events:none` y sin generar scroll horizontal.

---

## 5. Arquitectura de secciones

Orden aprobado:

1. Loader.
2. Hero.
3. Cuándo y dónde.
4. Cuenta regresiva.
5. Frase destacada.
6. Código de vestimenta.
7. Cronograma.
8. Fotografía parallax.
9. Galería opcional.
10. Alojamiento.
11. Mesa de regalos.
12. Compartir fotografías.
13. Instagram y redes.
14. Sugerencias musicales.
15. Pase QR.
16. Confirmación de asistencia.
17. Footer corporativo.
18. Modales.

Cada sección, salvo el footer, debe activarse o desactivarse desde configuración. Cada una declara su tono en forma explícita; no usar selectores posicionales para resolver alternancia.

### Estado inicial de referencia

- Activas: hero, ubicación, countdown, frase, dress code, cronograma, parallax, alojamiento, regalos, fotos compartidas, social, sugerencias musicales, QR y RSVP.
- Galería: opcional y desactivada por defecto hasta contar con un set fotográfico aprobado.

---

## 6. Responsive

### Mobile first

- Soporte desde 320 px sin scroll horizontal.
- Hero con `min-height: 100svh` y safe areas.
- Marco ornamental contenido dentro del viewport.
- Nombre con `clamp()`, ancho máximo y salto seguro.
- Tarjeta de fecha completa y legible; en anchos mínimos reduce espacios sin perder su estructura.
- Cuenta regresiva completa dentro de 320 px.
- Botones en columna cuando no exista espacio suficiente.
- Áreas táctiles mínimas de 44 × 44 px; objetivo 48 px.
- Modales con máximo `100dvh`, scroll interno, foco atrapado y restauración de foco.
- Parallax desactivado en touch, movimiento reducido o dispositivos de bajo rendimiento.

### Tablet y desktop

- Ancho de lectura máximo de 760 px para contenido.
- Hero sin crecimiento indefinido y punto focal configurable.
- Ornamentos escalan con `clamp()`.
- Galería adaptable sin deformar imágenes.
- Breakpoints orientativos: 560 px, 768 px y 1100 px.

---

## 7. Animaciones

| Elemento | Animación | Activación | Duración | Repetición |
|---|---|---|---|---|
| Loader | fade de salida + spinner | carga inicial, con timeout de seguridad | 500–700 ms | una vez |
| Contenido del hero | fade-up escalonado | al finalizar loader | 700–900 ms | una vez |
| Ornamentos del hero | fade + scale suave | al finalizar loader | 900–1100 ms | una vez |
| Partículas | float mínimo y alternado | hero visible | 5–8 s | continua, muy sutil |
| Indicador de scroll | desplazamiento vertical leve | hero visible | 1.8–2.4 s | continua |
| Títulos, textos y botones | fade-up escalonado | ingreso al viewport | 600–800 ms | una vez |
| Fotografías | reveal con zoom 1.02 → 1 | ingreso al viewport | 800–1000 ms | una vez |
| Ornamentos laterales | fade lateral + flotación mínima | ingreso al viewport | reveal 800 ms; float 6–8 s | reveal una vez; float continua |
| Modales | fade de backdrop + scale 0.98 → 1 | apertura | 200–280 ms | por apertura |

Con `prefers-reduced-motion: reduce` se eliminan traslaciones, parallax, flotación y partículas animadas; el contenido queda visible inmediatamente.

---

## 8. Parametrización

La configuración productiva debe contemplar:

- `locale`: `es | pt | en`.
- `palettePreset`.
- Evento: nombre, tipo, fecha y hora, fin, zona horaria, salón, dirección, título de calendario y fecha límite de RSVP.
- Contenido: frase, hashtag, dress code y textos opcionales.
- Links: mapa, Instagram, carga de fotos, lista de regalos y endpoints.
- Cronograma como colección ordenada.
- Galería como colección de imagen, alt y punto focal.
- Hoteles como colección.
- Regalos: banco, titular, moneda, cuenta, alias y enlace.
- QR por invitado/grupo.
- Assets y puntos focales mobile/desktop.
- Tipografías mediante tokens del modelo.
- Visibilidad y tono de cada sección.
- Metadata: título, descripción, imagen social y privacidad/noindex.

La implementación no debe leer `window.VERONA_SITE_CONFIG`; Aurora tendrá tipos y configuración propios.

---

## 9. Funcionalidad y accesibilidad

- Countdown basado en una única fecha ISO y zona horaria; nunca muestra negativos.
- Calendario descargable con datos parametrizados.
- Links externos seguros y estados claros cuando falte configuración.
- RSVP conectado al flujo productivo existente con carga, éxito, error y reintento.
- Modales accesibles: Escape, click en backdrop, foco inicial, focus trap y restauración.
- Skip link, landmarks, labels, estados `aria-live`, foco visible y alt descriptivos.
- QR real en producción; nunca conservar “QR DEMO” como dato productivo.
- Loader con salida de seguridad aunque fallen recursos.
- Imágenes no críticas con lazy loading y dimensiones/aspect ratio reservados.

---

## 10. Criterios de aceptación

- Aurora se renderiza como componente React integrado al catálogo y al flujo de pedido.
- Preserva composición, fuentes, imágenes y jerarquía del HTML en 320, 375, 768, 1024 y 1440 px.
- Cambiar idioma actualiza contenido, fechas, metadatos, aria-labels, modales y formularios.
- Cambiar cualquiera de las cuatro paletas no deja colores rígidos visibles.
- Desactivar secciones no deja huecos ni ornamentos aislados.
- No hay scroll horizontal, errores de consola ni recursos faltantes.
- `prefers-reduced-motion` elimina movimiento no esencial.
- Footer corporativo aparece siempre al final y se adapta a la paleta.
- Build, lint y pruebas existentes finalizan correctamente.
- Se realiza revisión visual comparativa contra el HTML de referencia.

---

## 11. Pendiente de validación

- Confirmar el nombre comercial **Aurora**.
- Confirmar el orden ubicación → countdown, diferente al de otros modelos.
- Confirmar galería desactivada por defecto.
- Confirmar las cuatro paletas y `verde-dorado` como default.
- Confirmar que la sugerencia musical forma parte del modelo.
- Confirmar que no hay música de ambientación ni pantalla previa de ingreso.

## Implementado

- Componente React productivo y configuración propia.
- Integración al catálogo, selector de idioma y cuatro paletas.
- Responsive, animaciones, reduced motion, QR, RSVP y footer corporativo.

## Validación pendiente

- Revisión visual final en dispositivos físicos.

## Cambios solicitados — 2026-08-03

- Portada con textura de papel y sin fotografía.
- Separadores laterales reducidos y ajustados al contenedor mobile.
- Separadores alternados a lo largo de la invitación.
- Parallax aproximadamente un tercio más bajo.
- Footer institucional más compacto.

## Implementado — corrección visual

- Se aplicaron los cinco cambios solicitados preservando tipografías, paletas y estructura aprobadas.

## Cambios solicitados — escala final

- Textura de papel repetida a `66.666%` del ancho para mostrar 1,5 repeticiones en mobile.
- Separadores laterales al `46%` del ancho visible.
- Contenido institucional del footer completamente centrado.
